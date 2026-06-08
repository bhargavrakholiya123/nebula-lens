import { useMemo } from 'react';
import { useCanvasStore } from '../store/useCanvasStore';

export function useSecurityAudit() {
  const nodes = useCanvasStore(state => state.nodes);
  const edges = useCanvasStore(state => state.edges);

  return useMemo(() => {
    const vulnerabilities: any[] = [];
    let score = 100; // Start with a perfect score

    // 1. Scan all nodes for misconfigurations
    nodes.forEach(node => {
      // Rule 1: API Gateways must have a Web Application Firewall (WAF)
      if (node.type === 'apiGatewayNode') {
        vulnerabilities.push({
          nodeId: node.id,
          name: node.data?.name || 'API Gateway',
          issue: 'Missing Web Application Firewall (WAF)',
          severity: 'critical',
          remediation: 'Attach AWS WAF to prevent SQLi, XSS, and layer 7 DDoS attacks.',
          deduction: 20
        });
        score -= 20;
      }

      // Rule 2: Databases should not be in public/edge subnets (Simulated Check)
      if (node.type === 'databaseNode') {
        vulnerabilities.push({
          nodeId: node.id,
          name: node.data?.name || 'Database',
          issue: 'Data in Transit Unencrypted',
          severity: 'high',
          remediation: 'Enforce TLS 1.3 for all inter-node database communication.',
          deduction: 15
        });
        score -= 15;
      }

      // Rule 3: S3 Buckets should have MFA Delete enabled
      if (node.type === 's3Node') {
        vulnerabilities.push({
          nodeId: node.id,
          name: node.data?.name || 'S3 Bucket',
          issue: 'MFA Delete Disabled',
          severity: 'medium',
          remediation: 'Require Multi-Factor Authentication to permanently delete object versions.',
          deduction: 5
        });
        score -= 5;
      }
    });

    // Create a Set of vulnerable node IDs so we can highlight them easily
    const vulnerableNodeIds = new Set(vulnerabilities.map(v => v.nodeId));

    return {
      vulnerabilities,
      score: Math.max(0, score),
      vulnerableNodeIds
    };
  }, [nodes, edges]);
}