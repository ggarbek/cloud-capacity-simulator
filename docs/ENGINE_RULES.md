# Packing engine — validated rules (engine spec-of-record)

## Packing engine — validated rules

The engine in `src/engine/simulator.ts` is the spec-of-record alongside `simulator.test.ts`. These behaviors are LOCKED — change only if the PRD and a test update both motivate it.

1. **Best-Fit Decreasing (default — `SMART` mode).** Sort placeable VMs by `memoryGib desc, vcpus desc`. For each VM, scan open nodes for the tightest fit (smallest remaining memory that still accommodates the VM).

2. **`STRICT` mode preserves BOM order.** No pre-sort. Required to exercise true skip-and-continue (because SMART's sort can bypass it). Scenario B is a STRICT-mode test.

3. **Skip-and-continue.** If a VM cannot fit any open node and no empty node is available, mark unplaceable and continue with the next VM. Never stop on first block. (PRD §9.5 RULE 4.)

4. **Diagnosed blocking reason.** When packing fails, `diagnoseBlocked(openNodes, vm)` picks the open node with most remaining memory as best candidate and reports `VCPU` if vcpu is the limiter, else `MEMORY`, else `NO_ELIGIBLE_NODES`. Falls back to `DEPLOYMENT_LIMIT` only when no open node exists.

5. **Binding constraint, two cases:**
   - `occupied-full`: the resource that hit zero first (priority MEMORY > VCPU > THROUGHPUT).
   - `occupied-partial`: whichever resource is *more* utilized (`memPct >= vcpuPct ? MEMORY : VCPU`).

6. **Pre-flight oversize rejection.** VMs with `memoryGib > nodeMemory` get blocked `MEMORY`; with `vcpus > nodeVcpu` get blocked `VCPU` — before packing starts.

7. **Stranded math.** `strandedMemoryGib` and `strandedVcpus` are computed strictly over `nodes.filter(n => n.vmsPlaced.length > 0)`. Empty deployable and reserved nodes never contribute. Explicit filter — don't rely on `openNodes` array.

8. **Buffer is simplified.** Only Flat % or Fixed Node Count (PRD §9.3). v1.0's complex `ofrCount + healingBuffer + maintenanceBuffer` model was discarded.

9. **Isolated host = 1 VM per node.** Auto-applied when fleet `memoryCategory === 'vhm'`. Extra VMs flagged `ISOLATED_HOST`.

10. **VM_SIZE_NOT_FOUND is not fatal.** Catalog lookup miss flags that VM but keeps processing the rest.

### Scenario expectations (must always pass)

- **Scenario A (E-001):** 3× M96s_1_v3 on a Gen-A MM node (1×1 fleet). → 2 placed, 1 unplaceable with reason `VCPU`. Stranded mem = 2,148 GiB, stranded vCPU = 16. Node state = `occupied-partial`, binding = `VCPU`.
- **Scenario B (E-002, STRICT):** 7× M32ts + 1× M16ms. → 7 placed (the 7th M32ts is skipped, M16ms placed). Stranded mem ≈ 2,506.5 GiB, stranded vCPU = 0, binding = `VCPU`.
- **Scenario C (E-003):** Tetris pack — 7 VMs, 5 different sizes. → 7 placed, stranded mem = 750 ± 1 GiB, mem util ≈ 81.7%.

If any of these regress, the engine has a bug.

---

