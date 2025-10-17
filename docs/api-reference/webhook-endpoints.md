# Webhook Endpoints

## Introduction
Koordinator implements Kubernetes admission webhooks to enforce custom policies during resource creation, update, and deletion. These webhooks are critical for ensuring proper resource management, quota enforcement, and system stability. The admission control system includes both mutating and validating webhooks for Pods, Nodes, ConfigMaps, ElasticQuota, and Reservations. This document details the endpoints, their configuration, admission logic, and operational considerations.

## Webhook Registration
Koordinator registers its admission webhooks through `MutatingWebhookConfiguration` and `ValidatingWebhookConfiguration` resources defined in `manifests.yaml`. These configurations specify the webhook server endpoint, rules for when webhooks are invoked, failure policies, and supported API versions.

**Webhook Registration Architecture:**

```
MutatingWebhookConfiguration
  ├── mutate-pod
  ├── mutate-node-status
  ├── mutate-scheduling-sigs-k8s-io-v1alpha1-elasticquota
  └── mutate-reservation

ValidatingWebhookConfiguration
  ├── validate-pod
  ├── validate-node
  ├── validate-scheduling-sigs-k8s-io-v1alpha1-elasticquota
  └── validate-configmap

Webhook Server
  ├─→ MutatingWebhookConfiguration
  └─→ ValidatingWebhookConfiguration
```

**Diagram sources**
- [manifests.yaml](https://github.com/koordinator-sh/koordinator/tree/main/config/webhook/manifests.yaml#L1-L199)

**Section sources**
- [manifests.yaml](https://github.com/koordinator-sh/koordinator/tree/main/config/webhook/manifests.yaml#L1-L199)

## Mutating Webhooks

### Pod Mutating Webhook
The Pod mutating webhook intercepts Pod creation and update operations to apply resource mutations based on colocation profiles and other scheduling policies. It ensures Pods are properly configured before admission to the cluster.

**API Path**: `/mutate-pod`  
**HTTP Methods**: POST  
**Operations**: CREATE, UPDATE  
**Resource**: pods.v1.core  
**Failure Policy**: Fail  

This webhook is registered with two separate rules for create and update operations, both using the same endpoint.

**Section sources**
- [webhooks.go](https://github.com/koordinator-sh/koordinator/tree/main/pkg/webhook/pod/mutating/webhooks.go#L1-L54)
- [mutating_handler.go](https://github.com/koordinator-sh/koordinator/tree/main/pkg/webhook/pod/mutating/mutating_handler.go)

### Node Status Mutating Webhook
The Node status mutating webhook intercepts updates to Node status to apply resource amplification based on node colocation profiles. This allows Koordinator to enhance reported node resources based on observed capacity.

**API Path**: `/mutate-node-status`  
**HTTP Methods**: POST  
**Operations**: CREATE, UPDATE  
**Resource**: nodes/status.v1.core  
**Failure Policy**: Ignore  

The failure policy is set to "Ignore" to ensure node status updates are not blocked if the webhook is temporarily unavailable.

**Section sources**
- [webhooks.go](https://github.com/koordinator-sh/koordinator/tree/main/pkg/webhook/node/mutating/webhooks.go#L1-L49)
- [mutating_handler.go](https://github.com/koordinator-sh/koordinator/tree/main/pkg/webhook/node/mutating/mutating_handler.go)

### ElasticQuota Mutating Webhook
The ElasticQuota mutating webhook intercepts ElasticQuota creation to ensure proper initialization and metadata setup. It validates and potentially modifies ElasticQuota specifications before persistence.

**API Path**: `/mutate-scheduling-sigs-k8s-io-v1alpha1-elasticquota`  
**HTTP Methods**: POST  
**Operations**: CREATE  
**Resource**: elasticquotas.v1alpha1.scheduling.sigs.k8s.io  
**Failure Policy**: Fail  

**Section sources**
- [webhooks.go](https://github.com/koordinator-sh/koordinator/tree/main/pkg/webhook/elasticquota/mutating/webhooks.go#L1-L58)
- [quota_handler.go](https://github.com/koordinator-sh/koordinator/tree/main/pkg/webhook/elasticquota/quota_handler.go)

### Reservation Mutating Webhook
The Reservation mutating webhook intercepts Reservation creation to apply default configurations and ensure proper setup based on cluster policies.

**API Path**: `/mutate-reservation`  
**HTTP Methods**: POST  
**Operations**: CREATE  
**Resource**: reservations.v1alpha1.scheduling.koordinator.sh  
**Failure Policy**: Fail  

**Section sources**
- [webhooks.go](https://github.com/koordinator-sh/koordinator/tree/main/pkg/webhook/reservation/mutating/webhooks.go#L1-L52)
- [mutating_handler.go](https://github.com/koordinator-sh/koordinator/tree/main/pkg/webhook/reservation/mutating/mutating_handler.go)

## Validating Webhooks

### Pod Validating Webhook
The Pod validating webhook performs validation on Pod creation and update operations. It checks resource requests against quota limits, validates topology constraints, and ensures compliance with cluster policies.

**API Path**: `/validate-pod`  
**HTTP Methods**: POST  
**Operations**: CREATE, UPDATE  
**Resource**: pods.v1.core  
**Failure Policy**: Fail  

The validation includes checking if the Pod's resource requests fit within available ElasticQuota and Reservation allocations.

**Section sources**
- [webhooks.go](https://github.com/koordinator-sh/koordinator/tree/main/pkg/webhook/pod/validating/webhooks.go#L1-L58)
- [validating_handler.go](https://github.com/koordinator-sh/koordinator/tree/main/pkg/webhook/pod/validating/validating_handler.go)

### Node Validating Webhook
The Node validating webhook validates Node creation and update operations to ensure node resource amplification stays within configured limits.

**API Path**: `/validate-node`  
**HTTP Methods**: POST  
**Operations**: CREATE, UPDATE  
**Resource**: nodes.v1.core  
**Failure Policy**: Ignore  

Similar to the mutating counterpart, this uses an "Ignore" failure policy to prevent blocking critical node registration.

**Section sources**
- [webhooks.go](https://github.com/koordinator-sh/koordinator/tree/main/pkg/webhook/node/validating/webhooks.go#L1-L49)
- [validating_handler.go](https://github.com/koordinator-sh/koordinator/tree/main/pkg/webhook/node/validating/validating_handler.go)

### ElasticQuota Validating Webhook
The ElasticQuota validating webhook validates ElasticQuota creation, update, and deletion operations to ensure quota topology rules are followed and no inconsistencies are introduced.

**API Path**: `/validate-scheduling-sigs-k8s-io-v1alpha1-elasticquota`  
**HTTP Methods**: POST  
**Operations**: CREATE, UPDATE, DELETE  
**Resource**: elasticquotas.v1alpha1.scheduling.sigs.k8s.io  
**Failure Policy**: Fail  

This webhook enforces hierarchical quota relationships and prevents invalid quota configurations.

**Section sources**
- [webhooks.go](https://github.com/koordinator-sh/koordinator/tree/main/pkg/webhook/elasticquota/validating/webhooks.go#L1-L58)
- [quota_handler.go](https://github.com/koordinator-sh/koordinator/tree/main/pkg/webhook/elasticquota/quota_handler.go)

### ConfigMap Validating Webhook
The ConfigMap validating webhook validates ConfigMap operations to ensure Koordinator configuration integrity, particularly for SLO (Service Level Objective) configurations.

**API Path**: `/validate-configmap`  
**HTTP Methods**: POST  
**Operations**: CREATE, UPDATE, DELETE  
**Resource**: configmaps.v1.core  
**Failure Policy**: Fail  

This prevents invalid configuration changes that could affect cluster-wide behavior.

**Section sources**
- [webhooks.go](https://github.com/koordinator-sh/koordinator/tree/main/pkg/webhook/cm/validating/webhooks.go#L1-L49)
- [validating_handler.go](https://github.com/koordinator-sh/koordinator/tree/main/pkg/webhook/cm/validating/validating_handler.go)

## Admission Logic
The admission logic varies by webhook type and resource:

- **Pod Mutation**: Applies resource adjustments based on colocation profiles, potentially modifying CPU and memory requests/limits according to defined policies.
- **Node Status Mutation**: Amplifies node resource capacity based on historical utilization and colocation profiles, allowing overcommitment when safe.
- **ElasticQuota Validation**: Enforces quota topology rules, ensuring child quotas do not exceed parent limits and that resource distribution follows defined constraints.
- **Pod Validation**: Evaluates Pod resource requests against available ElasticQuota and Reservation allocations, rejecting Pods that would exceed limits.
- **Node Validation**: Ensures node resource amplification factors remain within administrator-defined bounds.
- **ConfigMap Validation**: Validates SLO configuration integrity, preventing malformed or contradictory settings.

The logic is implemented through handler chains that process AdmissionReview requests and return appropriate responses with allowed status and optional patches.

**Section sources**
- [pod_mutating_handler.go](https://github.com/koordinator-sh/koordinator/tree/main/pkg/webhook/pod/mutating/mutating_handler.go)
- [pod_validating_handler.go](https://github.com/koordinator-sh/koordinator/tree/main/pkg/webhook/pod/validating/validating_handler.go)
- [node_mutating_handler.go](https://github.com/koordinator-sh/koordinator/tree/main/pkg/webhook/node/mutating/mutating_handler.go)
- [node_validating_handler.go](https://github.com/koordinator-sh/koordinator/tree/main/pkg/webhook/node/validating/validating_handler.go)
- [quota_handler.go](https://github.com/koordinator-sh/koordinator/tree/main/pkg/webhook/elasticquota/quota_handler.go)
- [configmap_validating_handler.go](https://github.com/koordinator-sh/koordinator/tree/main/pkg/webhook/cm/validating/validating_handler.go)

## Request and Response Format
All webhooks follow the standard Kubernetes AdmissionReview format:

**Request Format**:
```json
{
  "apiVersion": "admission.k8s.io/v1",
  "kind": "AdmissionReview",
  "request": {
    "uid": "string",
    "kind": {"group":"string","version":"string","kind":"string"},
    "resource": {"group":"string","version":"string","resource":"string"},
    "requestKind": {"group":"string","version":"string","kind":"string"},
    "requestResource": {"group":"string","version":"string","resource":"string"},
    "name": "string",
    "namespace": "string",
    "operation": "CREATE|UPDATE|DELETE",
    "userInfo": {},
    "object": {"raw": "base64 encoded resource"},
    "oldObject": {"raw": "base64 encoded resource"},
    "options": {"raw": "base64 encoded options"}
  }
}
```

**Response Format**:
```json
{
  "apiVersion": "admission.k8s.io/v1",
  "kind": "AdmissionReview",
  "response": {
    "uid": "string",
    "allowed": boolean,
    "status": {"status":"Success|Failure", "message":"string"},
    "patch": "base64 encoded JSON patch",
    "patchType": "JSONPatch"
  }
}
```

Mutating webhooks may include a JSON patch in the response to modify the resource, while validating webhooks only indicate whether the operation is allowed.

**Section sources**
- [server.go](https://github.com/koordinator-sh/koordinator/tree/main/pkg/webhook/server.go#L1-L162)

## Failure Policies and Timeout Configuration
Webhooks are configured with different failure policies based on criticality:

- **Fail**: Critical webhooks (Pod, ElasticQuota, Reservation, ConfigMap) use "Fail" policy, rejecting the operation if the webhook endpoint is unreachable.
- **Ignore**: Node-related webhooks use "Ignore" policy to prevent blocking node registration or status updates during webhook outages.

The webhook server is configured to listen on port 9443 with TLS certificates managed through Kubernetes secrets. The server includes health checking endpoints at `/healthz` to support liveness and readiness probes.

Timeouts are controlled by the Kubernetes API server, typically defaulting to 30 seconds. The webhook implementation includes internal timeout handling to ensure timely responses.

**Webhook Processing Flow:**

```
Participants:
- Kubernetes API Server
- Koordinator Webhook
- kubectl (Client)

Flow:

1. kubectl → Kubernetes API Server: Create Pod
2. Kubernetes API Server → Koordinator Webhook: AdmissionReview Request
3. Koordinator Webhook internal: Process Request
4. Koordinator Webhook → Kubernetes API Server: AdmissionReview Response
5. Kubernetes API Server → kubectl: Operation Result
```

**Diagram sources**
- [server.go](https://github.com/koordinator-sh/koordinator/tree/main/pkg/webhook/server.go#L1-L162)
- [manifests.yaml](https://github.com/koordinator-sh/koordinator/tree/main/config/webhook/manifests.yaml#L1-L199)

**Section sources**
- [server.go](https://github.com/koordinator-sh/koordinator/tree/main/pkg/webhook/server.go#L1-L162)
- [manifests.yaml](https://github.com/koordinator-sh/koordinator/tree/main/config/webhook/manifests.yaml#L1-L199)

## Troubleshooting Webhook Issues
Common webhook issues and troubleshooting approaches:

**Certificate Management**: Webhook certificates are automatically generated and rotated. Issues often stem from certificate expiration or mismatched SANs. Check the `webhook-tls` secret in the koordinator-system namespace.

**Network Connectivity**: Ensure the webhook service is reachable from the API server. Verify service endpoints and network policies allow traffic on port 9443.

**Performance Considerations**: High webhook latency can block API operations. Monitor webhook duration metrics and ensure the webhook server has adequate resources.

**Debugging Steps**:
1. Check webhook server logs for errors
2. Verify webhook configurations with `kubectl get mutatingwebhookconfiguration,validatingwebhookconfiguration`
3. Test connectivity to the webhook service
4. Validate certificate validity
5. Monitor admission latency metrics

The webhook server includes a debug API handler for diagnostic purposes.

**Section sources**
- [server.go](https://github.com/koordinator-sh/koordinator/tree/main/pkg/webhook/server.go#L1-L162)
- [health](https://github.com/koordinator-sh/koordinator/tree/main/pkg/webhook/util/health)
- [generator](https://github.com/koordinator-sh/koordinator/tree/main/pkg/webhook/util/generator)

## Security and Best Practices
Security considerations for Koordinator webhooks:

- **Least Privilege**: Webhook service account has minimal required permissions
- **TLS Encryption**: All webhook communications use TLS with automatically managed certificates
- **Input Validation**: Thorough validation of all admission requests to prevent malicious input
- **Rate Limiting**: Protection against denial-of-service through excessive requests
- **Audit Logging**: All admission decisions are logged for security auditing

Best practices include:
- Regularly monitoring webhook performance and error rates
- Testing configuration changes in non-production environments
- Maintaining backup configurations for quick recovery
- Implementing proper alerting for webhook failures

**Section sources**
- [server.go](https://github.com/koordinator-sh/koordinator/tree/main/pkg/webhook/server.go#L1-L162)
- [manifests.yaml](https://github.com/koordinator-sh/koordinator/tree/main/config/webhook/manifests.yaml#L1-L199)
- [rbac](https://github.com/koordinator-sh/koordinator/tree/main/config/rbac)

## Webhook Chaining
Koordinator webhooks are designed to work with other admission controllers in the Kubernetes admission chain. The order of execution is determined by the webhook configuration order in the API server.

When chaining with other controllers:
- Koordinator webhooks should typically run after core Kubernetes validation
- Conflicts with other quota or resource management controllers should be avoided
- The failure policy settings help prevent cascading failures

The webhook server supports multiple concurrent requests and is optimized for low latency to minimize impact on the overall admission process.

**Section sources**
- [server.go](https://github.com/koordinator-sh/koordinator/tree/main/pkg/webhook/server.go#L1-L162)
- [framework](https://github.com/koordinator-sh/koordinator/tree/main/pkg/webhook/util/framework)