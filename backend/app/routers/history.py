from fastapi import APIRouter, Depends, HTTPException
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import or_
from uuid import UUID as UUIDClass
from app.database import get_db
from app.models.models import (
    AwsAccount, Snapshot, NormalizedNode, NormalizedEdge,
    SnapshotDiff, ChangeType, Resource, Relationship
)
from app.engines.cost_engine import cost_engine
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/history", tags=["History"])

# Process-level cache for snapshot stats to prevent redundant calculations
HISTORY_STATS_CACHE = {}

# Supported service types to filter out unsupported raw resources in fallbacks
SUPPORTED_SERVICES = [
    "vpc", "subnet", "ec2", "lambda", "rds", "sqs", "s3",
    "apigateway", "eventbridge", "dynamodb", "ecs", "sns", "cloudfront",
    "eks", "secretsmanager", "stepfunctions"
]


# Helper to convert NormalizedNode to the dict format expected by cost_engine and React Flow
def row_to_node_dict(row: NormalizedNode) -> Dict[str, Any]:
    return {
        "id": row.node_id,
        "type": row.node_type,
        "parentId": row.parent_node_id,
        "position": {"x": row.position_x, "y": row.position_y},
        "data": {
            "name": row.resource_name,
            "service": row.service,
            "region": row.region,
            "account_id": row.account_id,
            "resource_arn": row.resource_arn,
            "insights": row.insights,
            "metrics": row.metrics or {},
            "tags": row.tags or {}
        }
    }


# Helper to convert raw Resource to the React Flow node format
def resource_row_to_node_dict(row: Resource) -> Dict[str, Any]:
    meta = row.meta_data or {}
    return {
        "id": row.node_id,
        "type": row.node_type,
        "parentId": row.parent_node_id,
        "position": {"x": 0, "y": 0},
        "data": {
            "name": row.resource_name,
            "service": row.service,
            "region": row.region,
            "account_id": row.account_id,
            "resource_arn": row.resource_arn,
            "insights": meta.get("insights", ""),
            "metrics": meta.get("metrics", {}),
            "tags": meta.get("tags", {})
        }
    }


@router.get("")
def get_snapshot_history(account_id: Optional[str] = None, db: Session = Depends(get_db)):
    """
    Returns lists of all snapshots for a given account with total resource counts,
    cost calculations, and change stats.
    """
    try:
        # Find AWS Account first
        account = None
        if account_id:
            parsed_uuid = None
            try:
                parsed_uuid = UUIDClass(account_id)
            except ValueError:
                pass

            query = db.query(AwsAccount)
            if parsed_uuid:
                account = query.filter(
                    or_(
                        AwsAccount.id == parsed_uuid,
                        AwsAccount.account_id == account_id
                    )
                ).first()
            else:
                account = query.filter(AwsAccount.account_id == account_id).first()
        else:
            # Fallback to the first account if none specified
            account = db.query(AwsAccount).first()

        if not account:
            return {"versions": [], "total_versions": 0}

        snapshots = db.query(Snapshot).filter(
            Snapshot.account_id == account.id
        ).order_by(Snapshot.version_number.desc()).all()

        versions_data = []
        for snap in snapshots:
            snap_id_str = str(snap.id)

            # If the database columns are already populated, use them directly (dedicated table pattern)
            if snap.total_resources is not None and snap.total_monthly_cost is not None and snap.cost_by_service is not None:
                added = snap.added_count or 0
                removed = snap.removed_count or 0
                modified = snap.modified_count or 0
                versions_data.append({
                    "version_id": snap_id_str,
                    "version_number": snap.version_number,
                    "label": snap.label or f"Version {snap.version_number}",
                    "is_latest": snap.is_latest,
                    "created_at": snap.created_at.isoformat() if snap.created_at else None,
                    "summary": {
                        "total_resources": snap.total_resources,
                    },
                    "costs": {
                        "total_monthly": snap.total_monthly_cost,
                        "by_service": snap.cost_by_service
                    },
                    "changes": {
                        "added": added,
                        "removed": removed,
                        "modified": modified
                    }
                })
                continue

            # Fetch nodes to calculate cost and resource count (try normalized first, fall back to raw resources)
            nodes_rows = db.query(NormalizedNode).filter(NormalizedNode.snapshot_id == snap.id).all()
            if nodes_rows:
                nodes_dicts = [row_to_node_dict(n) for n in nodes_rows]
            else:
                resource_rows = db.query(Resource).filter(
                    Resource.snapshot_id == snap.id,
                    Resource.service.in_(SUPPORTED_SERVICES)
                ).all()
                nodes_dicts = [resource_row_to_node_dict(r) for r in resource_rows]
            
            # Run offline cost calculation using fallback prices
            cost_results = cost_engine.calculate_all(nodes_dicts, {})
            total_monthly_cost = cost_engine.total_cost(cost_results)

            # Summarize cost by service
            cost_summary = {}
            for cr in cost_results.values():
                svc = cr.get("service", "unknown")
                cost_summary[svc] = round(cost_summary.get(svc, 0.0) + cr.get("monthlyCost", 0.0), 2)

            # Count changes compared to the previous snapshot
            added_count = db.query(SnapshotDiff).filter(
                SnapshotDiff.to_snapshot == snap.id,
                SnapshotDiff.change_type == ChangeType.added
            ).count()
            
            removed_count = db.query(SnapshotDiff).filter(
                SnapshotDiff.to_snapshot == snap.id,
                SnapshotDiff.change_type == ChangeType.removed
            ).count()

            modified_count = db.query(SnapshotDiff).filter(
                SnapshotDiff.to_snapshot == snap.id,
                SnapshotDiff.change_type == ChangeType.modified
            ).count()

            # Cache stats directly on the snapshot row in the database
            snap.total_resources = len(nodes_dicts)
            snap.total_monthly_cost = total_monthly_cost
            snap.cost_by_service = cost_summary
            snap.added_count = added_count
            snap.removed_count = removed_count
            snap.modified_count = modified_count
            
            db.add(snap)
            db.commit()

            versions_data.append({
                "version_id": snap_id_str,
                "version_number": snap.version_number,
                "label": snap.label or f"Version {snap.version_number}",
                "is_latest": snap.is_latest,
                "created_at": snap.created_at.isoformat() if snap.created_at else None,
                "summary": {
                    "total_resources": snap.total_resources,
                },
                "costs": {
                    "total_monthly": snap.total_monthly_cost,
                    "by_service": snap.cost_by_service
                },
                "changes": {
                    "added": snap.added_count,
                    "removed": snap.removed_count,
                    "modified": snap.modified_count
                }
            })

        return {
            "versions": versions_data,
            "total_versions": len(versions_data)
        }

    except Exception as e:
        logger.error(f"Error fetching snapshot history: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.get("/snapshot/{snapshot_id}")
def get_snapshot_graph(snapshot_id: str, db: Session = Depends(get_db)):
    """
    Returns the full React Flow nodes and edges for a specific historical snapshot.
    """
    try:
        snap_uuid = UUIDClass(snapshot_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid snapshot UUID format")

    snapshot = db.query(Snapshot).filter(Snapshot.id == snap_uuid).first()
    if not snapshot:
        raise HTTPException(status_code=404, detail="Snapshot not found")

    # Fetch nodes
    nodes_rows = db.query(NormalizedNode).filter(NormalizedNode.snapshot_id == snapshot.id).all()
    if nodes_rows:
        nodes_dicts = [row_to_node_dict(n) for n in nodes_rows]
    else:
        resource_rows = db.query(Resource).filter(
            Resource.snapshot_id == snapshot.id,
            Resource.service.in_(SUPPORTED_SERVICES)
        ).all()
        nodes_dicts = [resource_row_to_node_dict(r) for r in resource_rows]

    # Fetch edges
    edges_rows = db.query(NormalizedEdge).filter(NormalizedEdge.snapshot_id == snapshot.id).all()
    edges_dicts = []
    if edges_rows:
        for e in edges_rows:
            edges_dicts.append({
                "id": e.edge_id,
                "source": e.source_arn,
                "target": e.target_arn,
                "type": e.edge_type,
                "label": e.label,
                "confidence": e.confidence,
                "evidence": e.evidence
            })
    else:
        relationships = db.query(Relationship).filter(Relationship.snapshot_id == snapshot.id).all()
        for r in relationships:
            edges_dicts.append({
                "id": r.edge_id,
                "source": r.source_arn,
                "target": r.target_arn,
                "type": r.edge_type,
                "label": r.label,
                "confidence": r.confidence,
                "evidence": r.evidence
            })

    # Run cost engine to enrich the returned nodes so the Canvas shows the correct cost lens values
    cost_results = cost_engine.calculate_all(nodes_dicts, {})
    for node in nodes_dicts:
        arn = node["id"]
        c = cost_results.get(arn, {})
        node["data"]["cost"] = {
            "source":       c.get("source", "pricing-api"),
            "confidence":   c.get("confidence", "estimated"),
            "billingModel": c.get("billingModel", "unknown"),
            "dailyCost":    c.get("dailyCost", 0.0),
            "monthlyCost":  c.get("monthlyCost", 0.0),
            "yearlyCost":   c.get("yearlyCost", 0.0),
            "currency":     c.get("currency", "USD"),
            "usageMetrics": c.get("usageMetrics", {}),
            "lineItems":    c.get("lineItems", []),
            "notes":        c.get("notes", ""),
        }

    return {
        "nodes": nodes_dicts,
        "edges": edges_dicts
    }


@router.get("/snapshot/{snapshot_id}/diff")
def get_snapshot_diff(snapshot_id: str, db: Session = Depends(get_db)):
    """
    Returns the diff details (added/removed/modified resources) for a snapshot.
    If no pre-calculated diff exists, it is calculated on-the-fly and committed.
    """
    try:
        snap_uuid = UUIDClass(snapshot_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid snapshot UUID format")

    diffs = db.query(SnapshotDiff).filter(
        SnapshotDiff.to_snapshot == snap_uuid
    ).all()

    results = []
    if diffs:
        for d in diffs:
            results.append({
                "id": str(d.id),
                "change_type": d.change_type,
                "resource_arn": d.resource_arn,
                "resource_type": d.resource_type,
                "change_details": d.change_details
            })
    else:
        # Calculate diffs on-the-fly for older or newly scanned snapshots
        current_snap = db.query(Snapshot).filter(Snapshot.id == snap_uuid).first()
        if current_snap:
            # Find previous snapshot for this account
            previous_snap = db.query(Snapshot).filter(
                Snapshot.account_id == current_snap.account_id,
                Snapshot.version_number < current_snap.version_number
            ).order_by(Snapshot.version_number.desc()).first()

            if previous_snap:
                # Fetch resources
                prev_resources = db.query(Resource).filter(
                    Resource.snapshot_id == previous_snap.id,
                    Resource.service.in_(SUPPORTED_SERVICES)
                ).all()
                prev_by_arn = {r.resource_arn: r for r in prev_resources}

                new_resources = db.query(Resource).filter(
                    Resource.snapshot_id == current_snap.id,
                    Resource.service.in_(SUPPORTED_SERVICES)
                ).all()
                new_by_arn = {r.resource_arn: r for r in new_resources}

                # 1. Added resources
                for arn, new_res in new_by_arn.items():
                    if arn not in prev_by_arn:
                        diff = SnapshotDiff(
                            from_snapshot=previous_snap.id,
                            to_snapshot=current_snap.id,
                            change_type=ChangeType.added,
                            resource_arn=arn,
                            resource_type=new_res.node_type,
                            change_details={"name": new_res.resource_name, "service": new_res.service}
                        )
                        db.add(diff)
                        db.flush()
                        results.append({
                            "id": str(diff.id),
                            "change_type": diff.change_type,
                            "resource_arn": diff.resource_arn,
                            "resource_type": diff.resource_type,
                            "change_details": diff.change_details
                        })

                # 2. Removed resources
                for arn, prev_res in prev_by_arn.items():
                    if arn not in new_by_arn:
                        diff = SnapshotDiff(
                            from_snapshot=previous_snap.id,
                            to_snapshot=current_snap.id,
                            change_type=ChangeType.removed,
                            resource_arn=arn,
                            resource_type=prev_res.node_type,
                            change_details={"name": prev_res.resource_name, "service": prev_res.service}
                        )
                        db.add(diff)
                        db.flush()
                        results.append({
                            "id": str(diff.id),
                            "change_type": diff.change_type,
                            "resource_arn": diff.resource_arn,
                            "resource_type": diff.resource_type,
                            "change_details": diff.change_details
                        })

                # 3. Modified resources
                for arn, new_res in new_by_arn.items():
                    if arn in prev_by_arn:
                        prev_res = prev_by_arn[arn]
                        if new_res.fingerprint != prev_res.fingerprint:
                            details = {}
                            if new_res.resource_name != prev_res.resource_name:
                                details["name"] = {"from": prev_res.resource_name, "to": new_res.resource_name}
                            
                            prev_meta = prev_res.meta_data or {}
                            new_meta = new_res.meta_data or {}
                            meta_changes = {}
                            for k, v in new_meta.items():
                                if k not in ["metrics", "insights"]:
                                    if prev_meta.get(k) != v:
                                        meta_changes[k] = {"from": prev_meta.get(k), "to": v}
                            if meta_changes:
                                details["meta_changes"] = meta_changes

                            diff = SnapshotDiff(
                                from_snapshot=previous_snap.id,
                                to_snapshot=current_snap.id,
                                change_type=ChangeType.modified,
                                resource_arn=arn,
                                resource_type=new_res.node_type,
                                change_details=details or {"message": "Resource configuration or metadata changed"}
                            )
                            db.add(diff)
                            db.flush()
                            results.append({
                                "id": str(diff.id),
                                "change_type": diff.change_type,
                                "resource_arn": diff.resource_arn,
                                "resource_type": diff.resource_type,
                                "change_details": diff.change_details
                            })
                
                db.commit()
                # Clear the cache for the current snapshot so stats (like added, removed counts) are recalculated on next load
                if str(current_snap.id) in HISTORY_STATS_CACHE:
                    del HISTORY_STATS_CACHE[str(current_snap.id)]

    return {
        "snapshot_id": snapshot_id,
        "diffs": results
    }
