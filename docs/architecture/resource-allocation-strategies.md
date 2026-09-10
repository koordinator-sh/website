# NUMA and Device Topology Allocation Strategies

Koordinator has two topology-aware scheduler plugins that decide **where a Pod's resources physically land on a node**:

- **NodeNUMAResource** allocates CPU and memory across NUMA nodes, and orchestrates fine-grained CPUSet binding.
- **DeviceShare** allocates heterogeneous devices — GPU, RDMA, FPGA and others — across the device topology (device / PCIe / NUMA node).

A single Pod often requests *both* ordinary compute resources *and* accelerators, so the two plugins must agree on one consistent hardware placement. Each plugin exposes a set of allocation strategies through Pod annotations, Node labels and plugin arguments — these are the "protocols" that users configure. This topic catalogs every strategy in both plugins, then explains how they are kept **consistent** — and where they can appear to **conflict** — through the shared Topology Manager.

## Why Two Plugins Must Cooperate

Modern servers are non-uniform. CPUs and memory are grouped into NUMA nodes; GPUs and RDMA NICs hang off PCIe switches that belong to specific NUMA nodes. If the scheduler places a Pod's CPUs on NUMA node 0 but its GPU on NUMA node 1, every DMA transfer crosses the inter-socket link and performance collapses.

NodeNUMAResource and DeviceShare therefore cannot decide independently. They converge at a single coordination point — `frameworkext/topologymanager` — which collects NUMA topology hints from **both** plugins and merges them under **one** policy before any resource is bound.

```text
Pod being scheduled onto a node
        │
        ▼
┌────────────────────────────────────────────────────────┐
│ frameworkext/topologymanager                            │
│ Resolves ONE NUMATopologyPolicy for the Pod:            │
│   pod annotation  >  node label  >  kubelet/plugin arg  │
└────────────────────────────────────────────────────────┘
        │ GetPodTopologyHints()  (both plugins implement
        │                         NUMATopologyHintProvider)
        ├───────────────────────────────┐
        ▼                               ▼
  NodeNUMAResource                  DeviceShare
  hints for cpu / memory            hints for gpu / rdma / ...
  {affinity, Preferred, Score}      {affinity, Preferred, Score}
        │                               │  (best device layout
        │                               │   scores 500 to win ties)
        └──────────────┬────────────────┘
                       ▼
              Merge all provider hints
     narrowest affinity wins; equal width → higher Score wins
                       │
                       ▼
             best NUMATopologyHint (a NUMA node bitmask)
                       │
                       ▼   Allocate(affinity) on every provider
     NodeNUMAResource binds CPUs;  DeviceShare binds devices
```

Everything below is a refinement of one of the boxes in this diagram.

## The Topology Manager: Where the Protocols Converge

### NUMATopologyPolicy — the single governing policy

The `NUMATopologyPolicy` decides **how strictly** all resources of a Pod must be aligned to the same NUMA node(s). It mirrors the upstream kubelet Topology Manager and applies to CPU, memory **and** devices at once.

| Policy | Behavior |
| --- | --- |
| `None` (empty) | No NUMA alignment. Hints are still produced but any placement is admitted. |
| `BestEffort` | Prefer the narrowest NUMA alignment across all resources, but still admit the Pod when no aligned placement exists (falls back to all NUMA nodes). |
| `Restricted` | Like `BestEffort`, but **reject** the node when no suitably narrow alignment can be found. |
| `SingleNUMANode` | Admit the node **only** if a single NUMA node can satisfy *all* requested resources (CPU, memory and devices together). |

The policy is resolved with a clear precedence, and contradictions are rejected rather than silently merged:

- **Pod annotation** `koordinator.sh/numa-topology-spec` → `NUMATopologySpec.numaTopologyPolicy`
- **Node label** `node.koordinator.sh/numa-topology-policy`
- **kubelet / plugin argument** default

If the Pod and the Node both specify a policy and the two differ, scheduling fails with `ErrNotMatchNUMATopology` — the plugins never guess which one wins. When the Pod specifies a policy, it overrides the Node label.

### NUMATopologyHint — the shared currency

Both plugins emit hints of the same shape, which is what makes merging possible:

| Field | Meaning |
| --- | --- |
| `NUMANodeAffinity` | A bitmask of the NUMA nodes that can satisfy the resource (e.g. `0b0011` = NUMA 0 and 1). |
| `Preferred` | `true` when this affinity is a preferred placement for the Pod. |
| `Score` | Tie-breaker weight. For the same affinity width, the higher score wins. |
| `Unsatisfied` | `true` when no affinity can satisfy the request. |

### Merge and tie-breaking

The Topology Manager enumerates every combination of provider hints and picks the best merged hint:

1. A **narrower** affinity (fewer NUMA nodes) always beats a wider one.
2. Among hints of **equal width**, the one with the **higher `Score`** wins.
3. The result is checked against the exclusive policy (see `SingleNUMANodeExclusive` below); a violation demotes the hint to non-preferred or rejects it.

DeviceShare deliberately assigns its best device layout a `Score` of `500`, well above the CPU hints, so that **when CPU and devices can both fit the same NUMA width, the device layout drives the final choice**. This is an intentional, documented precedence — not an accident of ordering.

## NodeNUMAResource Allocation Strategies

NodeNUMAResource answers three questions: *which NUMA nodes*, *how to bind CPUs inside them*, and *how exclusive* the placement must be.

### NUMAAllocateStrategy — which NUMA nodes to pick

Configured per node with the label `node.koordinator.sh/numa-allocate-strategy`, falling back to the plugin-level default. It selects among the NUMA nodes that already satisfy the request.

| Strategy | Meaning | Effect |
| --- | --- | --- |
| `MostAllocated` | Allocate from the NUMA node with the **least** available resource. | Bin-pack / consolidate; leaves whole NUMA nodes free for large Pods. |
| `LeastAllocated` | Allocate from the NUMA node with the **most** available resource. | Spread load; balances usage across NUMA nodes. |
| `DistributeEvenly` | Evenly distribute CPUs across NUMA nodes. | Interleave-style placement for workloads that benefit from balanced per-NUMA capacity. |

> **Naming note:** `MostAllocated` means "pick the node that is already *most* allocated", i.e. the one with the *least* free resource. This is bin-packing, and the same wording is reused consistently by the scoring strategies below.

### CPUBindPolicy — how to bind logical CPUs

Set on the Pod through `koordinator.sh/resource-spec`, either as `requiredCPUBindPolicy` (strict — scheduling fails if it cannot be honored) or `preferredCPUBindPolicy` (best-effort).

| Policy | Meaning |
| --- | --- |
| `Default` | No strong preference on how logical CPUs are chosen. |
| `FullPCPUs` | Pack the allocation into as few **physical cores** as possible (allocate whole cores, keep hyper-thread siblings together). |
| `SpreadByPCPUs` | Evenly spread logical CPUs **across** physical cores (one sibling per core first). |
| `ConstrainedBurst` | Constrain the CPU Shared Pool range used by a Burstable Pod. |

### NodeCPUBindPolicy — the node-level required bind policy

Set on the Node with the label `node.koordinator.sh/cpu-bind-policy`. It constrains what the scheduler *must* do for CPUSet Pods on that node, and is aligned with the kubelet CPU Manager options.

| Policy | Meaning |
| --- | --- |
| `None` | No node-level constraint. |
| `FullPCPUsOnly` | Must allocate **full physical cores** (equivalent to kubelet `full-pcpus-only=true`). |
| `SpreadByPCPUs` | Must evenly spread logical CPUs across physical cores (equivalent to kubelet `distribute-cpus-across-numa`). |

A Pod's `requiredCPUBindPolicy` takes precedence; otherwise the node policy (combined with the kubelet CPU Manager policy reported on the node) determines the effective bind policy.

### CPUExclusivePolicy — exclusivity granularity

Set on the Pod through `koordinator.sh/resource-spec` → `preferredCPUExclusivePolicy`.

| Policy | Meaning |
| --- | --- |
| `None` | No exclusivity. |
| `PCPULevel` | Mutual exclusion at the **physical core** dimension — exclusive Pods do not share a physical core. |
| `NUMANodeLevel` | Mutual exclusion at the **NUMA node** dimension — exclusive Pods do not share a NUMA node. |

### SingleNUMANodeExclusive and NUMA node status

`koordinator.sh/numa-topology-spec` also carries `singleNUMANodeExclusive`, which governs whether a NUMA node already used exclusively by one Pod may be shared by another:

| Value | Meaning |
| --- | --- |
| `Preferred` | Prefer not to co-locate a single-NUMA Pod with a multi-NUMA Pod (and vice versa), but allow it if necessary. |
| `Required` | Forbid such co-location. |

To enforce this, each NUMA node tracks a status — `idle`, `shared`, or `single` — and the Topology Manager checks the merged hint against it during `Admit`. A node whose CPUs are fully bound to one Pod becomes `single`; a node used by resource-only Pods becomes `shared`.

### Scoring strategies

NodeNUMAResource exposes two independent scoring knobs through `NodeNUMAResourceArgs`:

| Argument | Scope | Types |
| --- | --- | --- |
| `scoringStrategy` | Rank **nodes** | `MostAllocated`, `LeastAllocated`, `BalancedAllocation` |
| `numaScoringStrategy` | Rank **NUMA nodes within a node** | `MostAllocated`, `LeastAllocated`, `BalancedAllocation` |

`BalancedAllocation` favors nodes whose resource usage rates are balanced across resource kinds. As with `NUMAAllocateStrategy`, `MostAllocated` = least available (bin-pack) and `LeastAllocated` = most available (spread).

## DeviceShare Allocation Strategies

DeviceShare allocates accelerators and other devices. Its strategies operate on the **device topology** (device → PCIe → NUMA node → node), and it participates in NUMA alignment unless explicitly disabled.

### DeviceHint — per-device-type allocation hints

Set on the Pod through `koordinator.sh/device-allocate-hint`, keyed by device type (`gpu`, `rdma`, ...).

| Field | Values | Meaning |
| --- | --- | --- |
| `selector` | label selector | Restrict which device instances are eligible. |
| `vfSelector` | label selector | Restrict which SR-IOV virtual functions (VFs) are eligible. |
| `allocateStrategy` | `ApplyForAll`, `RequestsAsCount` | `ApplyForAll`: allocate every matching device. `RequestsAsCount`: interpret the resource request value as the *count* of devices. |
| `requiredTopologyScope` | `Device`, `PCIe`, `NUMANode`, `Node` | The tightest topology scope the allocated devices must share (level 4 → 1). |
| `exclusivePolicy` | `DeviceLevel`, `PCIeLevel` | Mutual exclusion at the device-instance or PCIe dimension. |

### DeviceJointAllocate — co-locating different device types

Set on the Pod through `koordinator.sh/device-joint-allocate`. It groups multiple device types so they are allocated within a shared topology scope — the classic case being a GPU and an RDMA NIC on the same PCIe switch.

| Field | Meaning |
| --- | --- |
| `deviceTypes` | The device types to allocate jointly (e.g. `[gpu, rdma]`). |
| `requiredScope` | The scope they must share. `SamePCIe` requires all joint devices under one PCIe. |

### GPU partitioning

For multi-GPU Pods, the inter-GPU link topology (e.g. NVLink) matters more than raw count. Partitions are described on the `Device` CR with the annotation `koordinator.sh/gpu-partitions`, and requested by the Pod with `koordinator.sh/gpu-partition-spec`.

`GPUPartitionSpec` (Pod):

| Field | Values | Meaning |
| --- | --- | --- |
| `allocatePolicy` | `Restricted`, `BestEffort` | `Restricted`: consider **only** partitions with the highest `allocationScore`. `BestEffort` (default): try best to pursue a higher `allocationScore` but accept lower ones. |
| `ringBusBandwidth` | quantity | Minimum required ring-bus bandwidth of the partition. |

`GPUPartitionPolicy` (Node/Device label `node.koordinator.sh/gpu-partition-policy`):

| Value | Meaning |
| --- | --- |
| `Honor` | The partition table annotated on the `Device` CR **must** be honored. |
| `Prefer` (default) | The partition table is **preferred** but not mandatory. |

> **Naming collision to be aware of:** `GPUPartitionSpec.allocatePolicy` uses `Restricted` / `BestEffort`, but these are **unrelated** to the `NUMATopologyPolicy` values of the same name. Here they describe how strictly to pursue the best GPU-partition score; there they describe NUMA alignment strictness. The two axes are independent and never cross-check each other.

### Device scoring strategy

`DeviceShareArgs.scoringStrategy` ranks nodes by device availability using `MostAllocated` (bin-pack devices) or `LeastAllocated` (spread devices), with the same semantics as NodeNUMAResource scoring.

### DisableDeviceNUMATopologyAlignment — opting out of NUMA alignment

`DeviceShareArgs.disableDeviceNUMATopologyAlignment` decouples devices from the NUMA merge. When `true`, DeviceShare returns **no** hints, so device placement no longer constrains (or is constrained by) the Pod's NUMA alignment. Use it only when devices are intentionally allowed to sit on different NUMA nodes than the CPUs.

## Consistency and Conflict Analysis

The two plugins look like they define a lot of overlapping knobs. In practice they are layered so that most "conflicts" are either impossible by construction or resolved deterministically. This section makes the guarantees — and the genuine tension points — explicit.

### Shared vocabulary (truly consistent)

These concepts are defined once and consumed by both plugins through the Topology Manager, so they cannot drift apart:

| Concept | Where defined | Consumed by |
| --- | --- | --- |
| `NUMATopologyPolicy` | `apis/extension` | Both, via a single merged decision |
| `NUMATopologyHint` (affinity / Preferred / Score) | `frameworkext/topologymanager` | Both hint providers |
| `NumaTopologyExclusive` (Preferred / Required) | `apis/extension` | Topology Manager `Admit` |
| `NumaNodeStatus` (idle / shared / single) | `apis/extension` | Topology Manager `Admit` |

### Parallel-but-distinct vocabulary (the confusing part)

Several strategies share a *word* but govern *different axes*. They are orthogonal, not competing:

| Term | Plugin | Axis it controls | Values |
| --- | --- | --- | --- |
| `NUMAAllocateStrategy` | NodeNUMAResource | Which NUMA nodes to fill | MostAllocated / LeastAllocated / DistributeEvenly |
| `scoringStrategy` | NodeNUMAResource | How to rank nodes | MostAllocated / LeastAllocated / BalancedAllocation |
| `numaScoringStrategy` | NodeNUMAResource | How to rank NUMA nodes | MostAllocated / LeastAllocated / BalancedAllocation |
| `scoringStrategy` | DeviceShare | How to rank nodes by device | MostAllocated / LeastAllocated |
| `DeviceHint.allocateStrategy` | DeviceShare | How to read a device request | ApplyForAll / RequestsAsCount |
| `DeviceHint.requiredTopologyScope` | DeviceShare | Device grouping granularity | Device / PCIe / NUMANode / Node |
| `GPUPartitionSpec.allocatePolicy` | DeviceShare | GPU-partition selection | Restricted / BestEffort |

Two consistency guarantees hold across this table:

- **`MostAllocated` / `LeastAllocated` mean the same thing everywhere** — bin-pack vs. spread — whether applied to NUMA nodes, whole nodes, or devices.
- **`CPUBindPolicy` and `DeviceHint.exclusivePolicy` express the same *idea*** (exclusivity at a topology level) but over different domains (CPU cores vs. device/PCIe), so their value sets intentionally differ.

### How conflicts are prevented or resolved

| Potential conflict | Resolution |
| --- | --- |
| Pod and Node disagree on `NUMATopologyPolicy` | Rejected with `ErrNotMatchNUMATopology`; never silently merged. |
| CPU hints and device hints favor different NUMA nodes | Merged under one policy; narrower affinity wins, ties broken by `Score` (devices score `500`, so device layout leads at equal width). |
| Devices should ignore NUMA entirely | `disableDeviceNUMATopologyAlignment` removes device hints from the merge. |
| A single-NUMA Pod meets an already-exclusive NUMA node | `SingleNUMANodeExclusive` + `NumaNodeStatus` checked during `Admit`. |

### Genuine tension points and guidance

These combinations are *allowed* by the APIs but are logically opposed or redundant. The scheduler does not reject them, so operators should avoid pairing them:

| Combination | Why it is tense | Guidance |
| --- | --- | --- |
| `numa-allocate-strategy: DistributeEvenly` + `NUMATopologyPolicy: SingleNUMANode` | `SingleNUMANode` confines everything to one NUMA node, so "distribute evenly across NUMA nodes" has nothing to distribute over. The policy wins and the strategy becomes a no-op. | Do not set `DistributeEvenly` on nodes/pods that also require `SingleNUMANode`. |
| `requiredTopologyScope: NUMANode` (devices) + `NUMATopologyPolicy: None` | Devices still try to share a NUMA node, but global alignment is off, so CPUs may land elsewhere. | Raise the policy to at least `BestEffort` if cross-resource NUMA locality matters. |
| `GPUPartitionSpec.allocatePolicy: Restricted` + `gpu-partition-policy: Prefer` | The Pod demands only top-score partitions while the node treats partitions as optional; a strict Pod on a lenient node can be harder to place. | Align the two: use `Honor` on the node when Pods request `Restricted`. |

### The one-line mental model

> There is exactly **one** NUMA decision per Pod, made by the Topology Manager under **one** `NUMATopologyPolicy`. NodeNUMAResource and DeviceShare only *propose* hints into that decision; every other strategy (bind policy, allocate strategy, scoring, GPU partition, topology scope) refines *how* each plugin builds its proposal or *how* it binds resources once the NUMA bitmask is fixed.

## What's Next

Here are some recommended next steps:

- Learn how heterogeneous devices are modeled in [Device](./device).
- Learn Koordinator's [Resource Model](./resource-model).
- Follow the [Fine-grained CPU Orchestration](../user-manuals/fine-grained-cpu-orchestration.md) user manual for NodeNUMAResource in action.
- Follow the [Fine-grained Device Scheduling](../user-manuals/fine-grained-device-scheduling.md) and [GPU and RDMA Joint Allocation](../user-manuals/gpu-and-rdma-joint-allocation.md) user manuals for DeviceShare in action.
- Read the design details of [Fine-grained Device Scheduling](../designs/fine-grained-device-scheduling).
