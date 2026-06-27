import logging
from sqlalchemy.orm import Session
from app.models.models import (
    Snapshot, Resource, Relationship,
    SnapshotDiff, ChangeType, AwsAccount
)
from app.engines.cost_engine import cost_engine
from uuid import UUID

logger = logging.getLogger(__name__)


class SnapshotEngine:

    def create_snapshot(
        self,
        db: Session,
        account_db_id: UUID,
        all_nodes: list,
        all_edges: list,
        aws_account_id: str
    ) -> Snapshot:
        """
        Save all scanned resources as an immutable snapshot.
        Creates Version 1, Version 2 etc automatically.
        """

        # Get next version number
        last_snapshot = db.query(Snapshot).filter(
            Snapshot.account_id == account_db_id
        ).order_by(Snapshot.version_number.desc()).first()

        version_number = 1 if not last_snapshot else last_snapshot.version_number + 1

        # Mark old snapshots as not latest
        db.query(Snapshot).filter(
            Snapshot.account_id == account_db_id,
            Snapshot.is_latest == True
        ).update({"is_latest": False})

        # Calculate costs for the new nodes
        nodes_dicts = []
        for nr in all_nodes:
            n = nr['node']
            nodes_dicts.append({
                "id": n['id'],
                "type": n['type'],
                "parentId": n.get('parentID') or n.get('parentId'),
                "position": n.get('position', {"x": 0, "y": 0}),
                "data": {
                    "name": nr.get('resource_name', ''),
                    "service": n['data']['service'],
                    "region": n['data']['region'],
                    "account_id": aws_account_id,
                    "resource_arn": nr['resource_arn'],
                    "insights": n['data'].get('insights', ''),
                    "metrics": n['data'].get('metrics', {}),
                    "tags": n['data'].get('tags', {})
                }
            })

        cost_results = cost_engine.calculate_all(nodes_dicts, {})
        total_monthly_cost = cost_engine.total_cost(cost_results)

        cost_summary = {}
        for cr in cost_results.values():
            svc = cr.get("service", "unknown")
            cost_summary[svc] = round(cost_summary.get(svc, 0.0) + cr.get("monthlyCost", 0.0), 2)

        # Create new snapshot with pre-calculated stats
        snapshot = Snapshot(
            account_id=account_db_id,
            version_number=version_number,
            label=f"Version {version_number}",
            is_latest=True,
            total_resources=len(all_nodes),
            total_monthly_cost=total_monthly_cost,
            cost_by_service=cost_summary
        )
        db.add(snapshot)
        db.flush()  # Get snapshot.id without full commit

        # Save all nodes as resources
        for node_result in all_nodes:
            node = node_result['node']
            resource = Resource(
                snapshot_id=snapshot.id,
                node_id=node['id'],
                node_type=node['type'],
                parent_node_id=node.get('parentID'),
                resource_arn=node_result['resource_arn'],
                resource_name=node_result.get('resource_name', ''),
                service=node['data']['service'],
                region=node['data']['region'],
                account_id=aws_account_id,
                fingerprint=node_result['fingerprint'],
                meta_data=node['data']
)
            db.add(resource)

        # Save all edges as relationships
        for edge in all_edges:
            edge_data = edge.get('data', {})
            relationship = Relationship(
                snapshot_id=snapshot.id,
                edge_id=edge['id'],
                source_arn=edge['source'],
                target_arn=edge['target'],
                edge_type=edge.get('type', 'animatedEdge'),
                label=edge_data.get('label', ''),
                confidence=edge_data.get('confidence'),
                evidence=edge_data.get('evidence'),
                category=edge_data.get('category', 'runtime')
            )
            db.add(relationship)

        # Supported services to filter out raw/unsupported items in diffs
        SUPPORTED_SERVICES = [
            "vpc", "subnet", "ec2", "lambda", "rds", "sqs", "s3",
            "apigateway", "eventbridge", "dynamodb", "ecs", "sns", "cloudfront",
            "eks", "secretsmanager", "stepfunctions"
        ]

        # Calculate diff compared to last_snapshot if it exists
        added_count = 0
        removed_count = 0
        modified_count = 0
        if last_snapshot:
            # Fetch previous resources
            prev_resources = db.query(Resource).filter(
                Resource.snapshot_id == last_snapshot.id,
                Resource.service.in_(SUPPORTED_SERVICES)
            ).all()
            prev_by_arn = {r.resource_arn: r for r in prev_resources}

            # Fetch new resources
            new_resources = db.query(Resource).filter(
                Resource.snapshot_id == snapshot.id,
                Resource.service.in_(SUPPORTED_SERVICES)
            ).all()
            new_by_arn = {r.resource_arn: r for r in new_resources}

            # 1. Added
            for arn, new_res in new_by_arn.items():
                if arn not in prev_by_arn:
                    diff = SnapshotDiff(
                        from_snapshot=last_snapshot.id,
                        to_snapshot=snapshot.id,
                        change_type=ChangeType.added,
                        resource_arn=arn,
                        resource_type=new_res.node_type,
                        change_details={"name": new_res.resource_name, "service": new_res.service}
                    )
                    db.add(diff)
                    added_count += 1

            # 2. Removed
            for arn, prev_res in prev_by_arn.items():
                if arn not in new_by_arn:
                    diff = SnapshotDiff(
                        from_snapshot=last_snapshot.id,
                        to_snapshot=snapshot.id,
                        change_type=ChangeType.removed,
                        resource_arn=arn,
                        resource_type=prev_res.node_type,
                        change_details={"name": prev_res.resource_name, "service": prev_res.service}
                    )
                    db.add(diff)
                    removed_count += 1

            # 3. Modified
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
                            from_snapshot=last_snapshot.id,
                            to_snapshot=snapshot.id,
                            change_type=ChangeType.modified,
                            resource_arn=arn,
                            resource_type=new_res.node_type,
                            change_details=details or {"message": "Resource configuration or metadata changed"}
                        )
                        db.add(diff)
                        modified_count += 1

        # Store stats on the snapshot row
        snapshot.added_count = added_count
        snapshot.removed_count = removed_count
        snapshot.modified_count = modified_count

        db.commit()
        db.refresh(snapshot)

        logger.info(
            f"Snapshot Version {version_number} created "
            f"with {len(all_nodes)} resources and {len(all_edges)} edges"
        )
        return snapshot


snapshot_engine = SnapshotEngine()