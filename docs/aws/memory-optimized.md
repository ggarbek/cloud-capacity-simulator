

# Specifications for Amazon EC2 memory optimized instances
<a name="mo"></a>

**End of sale notice**  
The **U-9tb1**, **U-12tb1**, **U-18tb1**, and **U-24tb1** instance types are no longer available for new instance launches. If your workload requires a high-memory instance, we recommend that you use a U7i instance type instead.

Memory optimized instances are designed to deliver fast performance for workloads that process large data sets in memory.

For information on previous generation instance types of this category, such as R4 instances, see [Specifications for Amazon EC2 previous generation instances](pg.md).

**Topics**
+ [Instance families and instance types](#mo_sizes)
+ [Instance family summary](#mo_summary)
+ [Performance specifications](#mo_hardware)
+ [Network specifications](#mo_network)
+ [Amazon EBS specifications](#mo_storage-ebs)
+ [Instance store specifications](#mo_instance-store)
+ [Security specifications](#mo_security)

**Pricing**  
For pricing information, see [Amazon EC2 On-Demand Pricing](https://aws.amazon.com/ec2/pricing/on-demand/).

## Instance families and instance types
<a name="mo_sizes"></a>


| Instance family | Available instance types | 
| --- | --- | 
| R5 | r5.large \| r5.xlarge \| r5.2xlarge \| r5.4xlarge \| r5.8xlarge \| r5.12xlarge \| r5.16xlarge \| r5.24xlarge \| r5.metal | 
| R5a | r5a.large \| r5a.xlarge \| r5a.2xlarge \| r5a.4xlarge \| r5a.8xlarge \| r5a.12xlarge \| r5a.16xlarge \| r5a.24xlarge | 
| R5ad | r5ad.large \| r5ad.xlarge \| r5ad.2xlarge \| r5ad.4xlarge \| r5ad.8xlarge \| r5ad.12xlarge \| r5ad.16xlarge \| r5ad.24xlarge | 
| R5b | r5b.large \| r5b.xlarge \| r5b.2xlarge \| r5b.4xlarge \| r5b.8xlarge \| r5b.12xlarge \| r5b.16xlarge \| r5b.24xlarge \| r5b.metal | 
| R5d | r5d.large \| r5d.xlarge \| r5d.2xlarge \| r5d.4xlarge \| r5d.8xlarge \| r5d.12xlarge \| r5d.16xlarge \| r5d.24xlarge \| r5d.metal | 
| R5dn | r5dn.large \| r5dn.xlarge \| r5dn.2xlarge \| r5dn.4xlarge \| r5dn.8xlarge \| r5dn.12xlarge \| r5dn.16xlarge \| r5dn.24xlarge \| r5dn.metal | 
| R5n | r5n.large \| r5n.xlarge \| r5n.2xlarge \| r5n.4xlarge \| r5n.8xlarge \| r5n.12xlarge \| r5n.16xlarge \| r5n.24xlarge \| r5n.metal | 
| R6a | r6a.large \| r6a.xlarge \| r6a.2xlarge \| r6a.4xlarge \| r6a.8xlarge \| r6a.12xlarge \| r6a.16xlarge \| r6a.24xlarge \| r6a.32xlarge \| r6a.48xlarge \| r6a.metal | 
| R6g | r6g.medium \| r6g.large \| r6g.xlarge \| r6g.2xlarge \| r6g.4xlarge \| r6g.8xlarge \| r6g.12xlarge \| r6g.16xlarge \| r6g.metal | 
| R6gd | r6gd.medium \| r6gd.large \| r6gd.xlarge \| r6gd.2xlarge \| r6gd.4xlarge \| r6gd.8xlarge \| r6gd.12xlarge \| r6gd.16xlarge \| r6gd.metal | 
| R6i | r6i.large \| r6i.xlarge \| r6i.2xlarge \| r6i.4xlarge \| r6i.8xlarge \| r6i.12xlarge \| r6i.16xlarge \| r6i.24xlarge \| r6i.32xlarge \| r6i.metal | 
| R6id | r6id.large \| r6id.xlarge \| r6id.2xlarge \| r6id.4xlarge \| r6id.8xlarge \| r6id.12xlarge \| r6id.16xlarge \| r6id.24xlarge \| r6id.32xlarge \| r6id.metal | 
| R6idn | r6idn.large \| r6idn.xlarge \| r6idn.2xlarge \| r6idn.4xlarge \| r6idn.8xlarge \| r6idn.12xlarge \| r6idn.16xlarge \| r6idn.24xlarge \| r6idn.32xlarge \| r6idn.metal | 
| R6in | r6in.large \| r6in.xlarge \| r6in.2xlarge \| r6in.4xlarge \| r6in.8xlarge \| r6in.12xlarge \| r6in.16xlarge \| r6in.24xlarge \| r6in.32xlarge \| r6in.metal | 
| R7a | r7a.medium \| r7a.large \| r7a.xlarge \| r7a.2xlarge \| r7a.4xlarge \| r7a.8xlarge \| r7a.12xlarge \| r7a.16xlarge \| r7a.24xlarge \| r7a.32xlarge \| r7a.48xlarge \| r7a.metal-48xl | 
| R7g | r7g.medium \| r7g.large \| r7g.xlarge \| r7g.2xlarge \| r7g.4xlarge \| r7g.8xlarge \| r7g.12xlarge \| r7g.16xlarge \| r7g.metal | 
| R7gd | r7gd.medium \| r7gd.large \| r7gd.xlarge \| r7gd.2xlarge \| r7gd.4xlarge \| r7gd.8xlarge \| r7gd.12xlarge \| r7gd.16xlarge \| r7gd.metal | 
| R7i | r7i.large \| r7i.xlarge \| r7i.2xlarge \| r7i.4xlarge \| r7i.8xlarge \| r7i.12xlarge \| r7i.16xlarge \| r7i.24xlarge \| r7i.48xlarge \| r7i.metal-24xl \| r7i.metal-48xl | 
| R7iz | r7iz.large \| r7iz.xlarge \| r7iz.2xlarge \| r7iz.4xlarge \| r7iz.8xlarge \| r7iz.12xlarge \| r7iz.16xlarge \| r7iz.32xlarge \| r7iz.metal-16xl \| r7iz.metal-32xl | 
| R8a | r8a.medium \| r8a.large \| r8a.xlarge \| r8a.2xlarge \| r8a.4xlarge \| r8a.8xlarge \| r8a.12xlarge \| r8a.16xlarge \| r8a.24xlarge \| r8a.48xlarge \| r8a.metal-24xl \| r8a.metal-48xl | 
| R8g | r8g.medium \| r8g.large \| r8g.xlarge \| r8g.2xlarge \| r8g.4xlarge \| r8g.8xlarge \| r8g.12xlarge \| r8g.16xlarge \| r8g.24xlarge \| r8g.48xlarge \| r8g.metal-24xl \| r8g.metal-48xl | 
| R8gb | r8gb.medium \| r8gb.large \| r8gb.xlarge \| r8gb.2xlarge \| r8gb.4xlarge \| r8gb.8xlarge \| r8gb.12xlarge \| r8gb.16xlarge \| r8gb.24xlarge \| r8gb.48xlarge \| r8gb.metal-24xl \| r8gb.metal-48xl | 
| R8gd | r8gd.medium \| r8gd.large \| r8gd.xlarge \| r8gd.2xlarge \| r8gd.4xlarge \| r8gd.8xlarge \| r8gd.12xlarge \| r8gd.16xlarge \| r8gd.24xlarge \| r8gd.48xlarge \| r8gd.metal-24xl \| r8gd.metal-48xl | 
| R8gn | r8gn.medium \| r8gn.large \| r8gn.xlarge \| r8gn.2xlarge \| r8gn.4xlarge \| r8gn.8xlarge \| r8gn.12xlarge \| r8gn.16xlarge \| r8gn.24xlarge \| r8gn.48xlarge \| r8gn.metal-24xl \| r8gn.metal-48xl | 
| R8i | r8i.large \| r8i.xlarge \| r8i.2xlarge \| r8i.4xlarge \| r8i.8xlarge \| r8i.12xlarge \| r8i.16xlarge \| r8i.24xlarge \| r8i.32xlarge \| r8i.48xlarge \| r8i.96xlarge \| r8i.metal-48xl \| r8i.metal-96xl | 
| R8id | r8id.large \| r8id.xlarge \| r8id.2xlarge \| r8id.4xlarge \| r8id.8xlarge \| r8id.12xlarge \| r8id.16xlarge \| r8id.24xlarge \| r8id.32xlarge \| r8id.48xlarge \| r8id.96xlarge \| r8id.metal-48xl \| r8id.metal-96xl | 
| R8i-flex | r8i-flex.large \| r8i-flex.xlarge \| r8i-flex.2xlarge \| r8i-flex.4xlarge \| r8i-flex.8xlarge \| r8i-flex.12xlarge \| r8i-flex.16xlarge | 
| R8in | r8in.large \| r8in.xlarge \| r8in.2xlarge \| r8in.4xlarge \| r8in.8xlarge \| r8in.12xlarge \| r8in.16xlarge \| r8in.24xlarge \| r8in.32xlarge \| r8in.48xlarge \| r8in.96xlarge | 
| R8idn | r8idn.large \| r8idn.xlarge \| r8idn.2xlarge \| r8idn.4xlarge \| r8idn.8xlarge \| r8idn.12xlarge \| r8idn.16xlarge \| r8idn.24xlarge \| r8idn.32xlarge \| r8idn.48xlarge \| r8idn.96xlarge | 
| R8ib | r8ib.large \| r8ib.xlarge \| r8ib.2xlarge \| r8ib.4xlarge \| r8ib.8xlarge \| r8ib.12xlarge \| r8ib.16xlarge \| r8ib.24xlarge \| r8ib.32xlarge \| r8ib.48xlarge \| r8ib.96xlarge | 
| R8idb | r8idb.large \| r8idb.xlarge \| r8idb.2xlarge \| r8idb.4xlarge \| r8idb.8xlarge \| r8idb.12xlarge \| r8idb.16xlarge \| r8idb.24xlarge \| r8idb.32xlarge \| r8idb.48xlarge \| r8idb.96xlarge | 
| U-3tb1 | u-3tb1.56xlarge | 
| U-6tb1 | u-6tb1.56xlarge \| u-6tb1.112xlarge \| u-6tb1.metal | 
| U-9tb1 | u-9tb1.112xlarge \| u-9tb1.metal | 
| U-12tb1 | u-12tb1.112xlarge \| u-12tb1.metal | 
| U-18tb1 | u-18tb1.112xlarge \| u-18tb1.metal | 
| U-24tb1 | u-24tb1.112xlarge \| u-24tb1.metal | 
| U7i-6tb | u7i-6tb.112xlarge | 
| U7i-8tb | u7i-8tb.112xlarge | 
| U7i-12tb | u7i-12tb.224xlarge | 
| U7in-16tb | u7in-16tb.224xlarge | 
| U7in-24tb | u7in-24tb.224xlarge | 
| U7in-32tb | u7in-32tb.224xlarge | 
| U7inh-32tb | u7inh-32tb.480xlarge | 
| X1 | x1.16xlarge \| x1.32xlarge | 
| X1e | x1e.xlarge \| x1e.2xlarge \| x1e.4xlarge \| x1e.8xlarge \| x1e.16xlarge \| x1e.32xlarge | 
| X2gd | x2gd.medium \| x2gd.large \| x2gd.xlarge \| x2gd.2xlarge \| x2gd.4xlarge \| x2gd.8xlarge \| x2gd.12xlarge \| x2gd.16xlarge \| x2gd.metal | 
| X2idn | x2idn.16xlarge \| x2idn.24xlarge \| x2idn.32xlarge \| x2idn.metal | 
| X2iedn | x2iedn.xlarge \| x2iedn.2xlarge \| x2iedn.4xlarge \| x2iedn.8xlarge \| x2iedn.16xlarge \| x2iedn.24xlarge \| x2iedn.32xlarge \| x2iedn.metal | 
| X2iezn | x2iezn.2xlarge \| x2iezn.4xlarge \| x2iezn.6xlarge \| x2iezn.8xlarge \| x2iezn.12xlarge \| x2iezn.metal | 
| X8g | x8g.medium \| x8g.large \| x8g.xlarge \| x8g.2xlarge \| x8g.4xlarge \| x8g.8xlarge \| x8g.12xlarge \| x8g.16xlarge \| x8g.24xlarge \| x8g.48xlarge \| x8g.metal-24xl \| x8g.metal-48xl | 
| X8aedz | x8aedz.large \| x8aedz.xlarge \| x8aedz.3xlarge \| x8aedz.6xlarge \| x8aedz.12xlarge \| x8aedz.24xlarge \| x8aedz.metal-12xl \| x8aedz.metal-24xl | 
| X8i | x8i.large \| x8i.xlarge \| x8i.2xlarge \| x8i.4xlarge \| x8i.8xlarge \| x8i.12xlarge \| x8i.16xlarge \| x8i.24xlarge \| x8i.32xlarge \| x8i.48xlarge \| x8i.64xlarge \| x8i.96xlarge \| x8i.metal-48xl \| x8i.metal-96xl | 
| z1d | z1d.large \| z1d.xlarge \| z1d.2xlarge \| z1d.3xlarge \| z1d.6xlarge \| z1d.12xlarge \| z1d.metal | 

## Instance family summary
<a name="mo_summary"></a>


| Instance family | Hypervisor | Processor type (architecture) | Metal instances available | Dedicated Hosts support | Spot support | Hibernation support | Supported operating systems | 
| --- | --- | --- | --- | --- | --- | --- | --- | 
| R5 | [Nitro v2](ec2-nitro-instances.md) | Intel (x86\_64) | ✓ Yes | ✓ Yes | ✓ Yes | ✓ Yes | Windows \| Linux | 
| R5a | [Nitro v2](ec2-nitro-instances.md) | AMD (x86\_64) | ✗ No | ✗ No | ✓ Yes | ✓ Yes | Windows \| Linux | 
| R5ad | [Nitro v2](ec2-nitro-instances.md) | AMD (x86\_64) | ✗ No | ✗ No | ✓ Yes | ✓ Yes | Windows \| Linux | 
| R5b | [Nitro v2](ec2-nitro-instances.md) | Intel (x86\_64) | ✓ Yes | ✓ Yes | ✓ Yes | ✗ No | Windows \| Linux | 
| R5d | [Nitro v2](ec2-nitro-instances.md) | Intel (x86\_64) | ✓ Yes | ✓ Yes | ✓ Yes | ✓ Yes | Windows \| Linux | 
| R5dn | [Nitro v3](ec2-nitro-instances.md) | Intel (x86\_64) | ✓ Yes | ✓ Yes | ✓ Yes | ✗ No | Windows \| Linux | 
| R5n | [Nitro v3](ec2-nitro-instances.md) | Intel (x86\_64) | ✓ Yes | ✓ Yes | ✓ Yes | ✗ No | Windows \| Linux | 
| R6a | [Nitro v4](ec2-nitro-instances.md) | AMD (x86\_64) | ✓ Yes | ✓ Yes | ✓ Yes | ✓ Yes | Windows \| Linux | 
| R6g | [Nitro v2](ec2-nitro-instances.md) | AWS Graviton (arm64) | ✓ Yes | ✓ Yes | ✓ Yes | ✓ Yes | Linux | 
| R6gd | [Nitro v2](ec2-nitro-instances.md) | AWS Graviton (arm64) | ✓ Yes | ✓ Yes | ✓ Yes | ✓ Yes | Linux | 
| R6i | [Nitro v4](ec2-nitro-instances.md) | Intel (x86\_64) | ✓ Yes | ✓ Yes | ✓ Yes | ✗ No | Windows \| Linux | 
| R6id | [Nitro v4](ec2-nitro-instances.md) | Intel (x86\_64) | ✓ Yes | ✓ Yes | ✓ Yes | ✗ No | Windows \| Linux | 
| R6idn | [Nitro v4](ec2-nitro-instances.md) | Intel (x86\_64) | ✓ Yes | ✓ Yes | ✓ Yes | ✓ Yes | Windows \| Linux | 
| R6in | [Nitro v4](ec2-nitro-instances.md) | Intel (x86\_64) | ✓ Yes | ✓ Yes | ✓ Yes | ✓ Yes | Windows \| Linux | 
| R7a | [Nitro v4](ec2-nitro-instances.md) | AMD (x86\_64) | ✓ Yes | ✓ Yes | ✓ Yes | ✓ Yes | Windows \| Linux | 
| R7g | [Nitro v4](ec2-nitro-instances.md) | AWS Graviton (arm64) | ✓ Yes | ✓ Yes | ✓ Yes | ✓ Yes | Linux | 
| R7gd | [Nitro v4](ec2-nitro-instances.md) | AWS Graviton (arm64) | ✓ Yes | ✓ Yes | ✓ Yes | ✓ Yes | Linux | 
| R7i | [Nitro v4](ec2-nitro-instances.md) | Intel (x86\_64) | ✓ Yes | ✓ Yes | ✓ Yes | ✓ Yes | Windows \| Linux | 
| R7iz | [Nitro v4](ec2-nitro-instances.md) | Intel (x86\_64) | ✓ Yes | ✓ Yes | ✓ Yes | ✓ Yes | Windows \| Linux | 
| R8a | [Nitro v6](ec2-nitro-instances.md) | AMD (x86\_64) | ✓ Yes | ✓ Yes | ✓ Yes | ✓ Yes | Windows \| Linux | 
| R8g | [Nitro v5](ec2-nitro-instances.md) | AWS Graviton (arm64) | ✓ Yes | ✓ Yes | ✓ Yes | ✓ Yes | Linux | 
| R8gb | [Nitro v6](ec2-nitro-instances.md) | AWS Graviton (arm64) | ✓ Yes | ✓ Yes | ✓ Yes | ✓ Yes | Linux | 
| R8gd | [Nitro v5](ec2-nitro-instances.md) | AWS Graviton (arm64) | ✓ Yes | ✓ Yes | ✓ Yes | ✓ Yes | Linux | 
| R8gn | [Nitro v6](ec2-nitro-instances.md) | AWS Graviton (arm64) | ✓ Yes | ✓ Yes | ✓ Yes | ✓ Yes | Linux | 
| R8i | [Nitro v6](ec2-nitro-instances.md) | Intel (x86\_64) | ✓ Yes | ✓ Yes | ✓ Yes | ✓ Yes | Windows \| Linux | 
| R8id | [Nitro v6](ec2-nitro-instances.md) | Intel (x86\_64) | ✓ Yes | ✓ Yes | ✓ Yes | ✗ No | Windows \| Linux | 
| R8i-flex | [Nitro v6](ec2-nitro-instances.md) | Intel (x86\_64) | ✗ No | ✗ No | ✓ Yes | ✓ Yes | Windows \| Linux | 
| R8in | [Nitro v6](ec2-nitro-instances.md) | Intel (x86\_64) | ✗ No | ✓ Yes | ✓ Yes | ✓ Yes | Windows \| Linux | 
| R8idn | [Nitro v6](ec2-nitro-instances.md) | Intel (x86\_64) | ✗ No | ✓ Yes | ✓ Yes | ✓ Yes | Windows \| Linux | 
| R8ib | [Nitro v6](ec2-nitro-instances.md) | Intel (x86\_64) | ✗ No | ✓ Yes | ✓ Yes | ✓ Yes | Windows \| Linux | 
| R8idb | [Nitro v6](ec2-nitro-instances.md) | Intel (x86\_64) | ✗ No | ✓ Yes | ✓ Yes | ✓ Yes | Windows \| Linux | 
| U-3tb1 | [Nitro v3](ec2-nitro-instances.md) | Intel (x86\_64) | ✗ No | ✗ No | ✗ No | ✗ No | Windows \| Linux | 
| U-6tb1 | [Nitro v3](ec2-nitro-instances.md) | Intel (x86\_64) | ✓ Yes | ✓ Yes | ✗ No | ✗ No | Windows \| Linux | 
| U-9tb1 | [Nitro v3](ec2-nitro-instances.md) | Intel (x86\_64) | ✓ Yes | ✓ Yes | ✗ No | ✗ No | Windows \| Linux | 
| U-12tb1 | [Nitro v3](ec2-nitro-instances.md) | Intel (x86\_64) | ✓ Yes | ✓ Yes | ✗ No | ✗ No | Windows \| Linux | 
| U-18tb1 | [Nitro v3](ec2-nitro-instances.md) | Intel (x86\_64) | ✓ Yes | ✓ Yes | ✗ No | ✗ No | Windows \| Linux | 
| U-24tb1 | [Nitro v3](ec2-nitro-instances.md) | Intel (x86\_64) | ✓ Yes | ✓ Yes | ✗ No | ✗ No | Windows \| Linux | 
| U7i-6tb | [Nitro v4](ec2-nitro-instances.md) | Intel (x86\_64) | ✗ No | ✓ Yes | ✗ No | ✗ No | Windows \| Linux | 
| U7i-8tb | [Nitro v4](ec2-nitro-instances.md) | Intel (x86\_64) | ✗ No | ✓ Yes | ✗ No | ✗ No | Windows \| Linux | 
| U7i-12tb | [Nitro v4](ec2-nitro-instances.md) | Intel (x86\_64) | ✗ No | ✓ Yes | ✗ No | ✗ No | Windows \| Linux | 
| U7in-16tb | [Nitro v4](ec2-nitro-instances.md) | Intel (x86\_64) | ✗ No | ✓ Yes | ✗ No | ✗ No | Windows \| Linux | 
| U7in-24tb | [Nitro v4](ec2-nitro-instances.md) | Intel (x86\_64) | ✗ No | ✓ Yes | ✗ No | ✗ No | Windows \| Linux | 
| U7in-32tb | [Nitro v4](ec2-nitro-instances.md) | Intel (x86\_64) | ✗ No | ✓ Yes | ✗ No | ✗ No | Windows \| Linux | 
| U7inh-32tb | [Nitro v4](ec2-nitro-instances.md) | Intel (x86\_64) | ✗ No | ✓ Yes | ✗ No | ✗ No | Linux | 
| X1 | Xen | Intel (x86\_64) | ✗ No | ✓ Yes | ✓ Yes | ✗ No | Windows \| Linux | 
| X1e | Xen | Intel (x86\_64) | ✗ No | ✓ Yes | ✓ Yes | ✗ No | Windows \| Linux | 
| X2gd | [Nitro v2](ec2-nitro-instances.md) | AWS Graviton (arm64) | ✓ Yes | ✓ Yes | ✓ Yes | ✓ Yes | Linux | 
| X2idn | [Nitro v4](ec2-nitro-instances.md) | Intel (x86\_64) | ✓ Yes | ✓ Yes | ✓ Yes | ✗ No | Windows \| Linux | 
| X2iedn | [Nitro v4](ec2-nitro-instances.md) | Intel (x86\_64) | ✓ Yes | ✓ Yes | ✓ Yes | ✗ No | Windows \| Linux | 
| X2iezn | [Nitro v3](ec2-nitro-instances.md) | Intel (x86\_64) | ✓ Yes | ✓ Yes | ✓ Yes | ✗ No | Windows \| Linux | 
| X8g | [Nitro v5](ec2-nitro-instances.md) | AWS Graviton (arm64) | ✓ Yes | ✓ Yes | ✓ Yes | ✗ No | Linux | 
| X8aedz | [Nitro v6](ec2-nitro-instances.md) | AMD (x86\_64) | ✓ Yes | ✓ Yes | ✗ No | ✓ Yes | Windows \| Linux | 
| X8i | [Nitro v6](ec2-nitro-instances.md) | Intel (x86\_64) | ✓ Yes | ✓ Yes | ✓ Yes | ✓ Yes | Windows \| Linux | 
| z1d | [Nitro v2](ec2-nitro-instances.md) | Intel (x86\_64) | ✓ Yes | ✓ Yes | ✓ Yes | ✗ No | Windows \| Linux | 

## Performance specifications
<a name="mo_hardware"></a>


<table>
<thead>
  <tr><th>Instance type</th><th>Memory (GiB)</th><th>Processor</th><th>vCPUs</th><th>CPU cores</th><th>Threads per core</th><th>Accelerators</th><th>Accelerator memory</th></tr>
</thead>
<tbody>
  <tr><td colspan="8">R5</td></tr>
  <tr><td>r5.large</td><td>16.00</td><td>Intel Xeon Platinum 8175</td><td>2</td><td>1</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r5.xlarge</td><td>32.00</td><td>Intel Xeon Platinum 8175</td><td>4</td><td>2</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r5.2xlarge</td><td>64.00</td><td>Intel Xeon Platinum 8175</td><td>8</td><td>4</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r5.4xlarge</td><td>128.00</td><td>Intel Xeon Platinum 8175</td><td>16</td><td>8</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r5.8xlarge</td><td>256.00</td><td>Intel Xeon Platinum 8175</td><td>32</td><td>16</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r5.12xlarge</td><td>384.00</td><td>Intel Xeon Platinum 8175</td><td>48</td><td>24</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r5.16xlarge</td><td>512.00</td><td>Intel Xeon Platinum 8175</td><td>64</td><td>32</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r5.24xlarge</td><td>768.00</td><td>Intel Xeon Platinum 8175</td><td>96</td><td>48</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r5.metal</td><td>768.00</td><td>Intel Xeon Platinum 8175</td><td>96</td><td>48</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">R5a</td></tr>
  <tr><td>r5a.large</td><td>16.00</td><td>AMD EPYC 7571</td><td>2</td><td>1</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r5a.xlarge</td><td>32.00</td><td>AMD EPYC 7571</td><td>4</td><td>2</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r5a.2xlarge</td><td>64.00</td><td>AMD EPYC 7571</td><td>8</td><td>4</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r5a.4xlarge</td><td>128.00</td><td>AMD EPYC 7571</td><td>16</td><td>8</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r5a.8xlarge</td><td>256.00</td><td>AMD EPYC 7571</td><td>32</td><td>16</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r5a.12xlarge</td><td>384.00</td><td>AMD EPYC 7571</td><td>48</td><td>24</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r5a.16xlarge</td><td>512.00</td><td>AMD EPYC 7571</td><td>64</td><td>32</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r5a.24xlarge</td><td>768.00</td><td>AMD EPYC 7571</td><td>96</td><td>48</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">R5ad</td></tr>
  <tr><td>r5ad.large</td><td>16.00</td><td>AMD EPYC 7571</td><td>2</td><td>1</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r5ad.xlarge</td><td>32.00</td><td>AMD EPYC 7571</td><td>4</td><td>2</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r5ad.2xlarge</td><td>64.00</td><td>AMD EPYC 7571</td><td>8</td><td>4</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r5ad.4xlarge</td><td>128.00</td><td>AMD EPYC 7571</td><td>16</td><td>8</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r5ad.8xlarge</td><td>256.00</td><td>AMD EPYC 7571</td><td>32</td><td>16</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r5ad.12xlarge</td><td>384.00</td><td>AMD EPYC 7571</td><td>48</td><td>24</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r5ad.16xlarge</td><td>512.00</td><td>AMD EPYC 7571</td><td>64</td><td>32</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r5ad.24xlarge</td><td>768.00</td><td>AMD EPYC 7571</td><td>96</td><td>48</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">R5b</td></tr>
  <tr><td>r5b.large</td><td>16.00</td><td>Intel Xeon Platinum 8259</td><td>2</td><td>1</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r5b.xlarge</td><td>32.00</td><td>Intel Xeon Platinum 8259</td><td>4</td><td>2</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r5b.2xlarge</td><td>64.00</td><td>Intel Xeon Platinum 8259</td><td>8</td><td>4</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r5b.4xlarge</td><td>128.00</td><td>Intel Xeon Platinum 8259</td><td>16</td><td>8</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r5b.8xlarge</td><td>256.00</td><td>Intel Xeon Platinum 8259</td><td>32</td><td>16</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r5b.12xlarge</td><td>384.00</td><td>Intel Xeon Platinum 8259</td><td>48</td><td>24</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r5b.16xlarge</td><td>512.00</td><td>Intel Xeon Platinum 8259</td><td>64</td><td>32</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r5b.24xlarge</td><td>768.00</td><td>Intel Xeon Platinum 8259</td><td>96</td><td>48</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r5b.metal</td><td>768.00</td><td>Intel Xeon Platinum 8259</td><td>96</td><td>48</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">R5d</td></tr>
  <tr><td>r5d.large</td><td>16.00</td><td>Intel Xeon Platinum 8175</td><td>2</td><td>1</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r5d.xlarge</td><td>32.00</td><td>Intel Xeon Platinum 8175</td><td>4</td><td>2</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r5d.2xlarge</td><td>64.00</td><td>Intel Xeon Platinum 8175</td><td>8</td><td>4</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r5d.4xlarge</td><td>128.00</td><td>Intel Xeon Platinum 8175</td><td>16</td><td>8</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r5d.8xlarge</td><td>256.00</td><td>Intel Xeon Platinum 8175</td><td>32</td><td>16</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r5d.12xlarge</td><td>384.00</td><td>Intel Xeon Platinum 8175</td><td>48</td><td>24</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r5d.16xlarge</td><td>512.00</td><td>Intel Xeon Platinum 8175</td><td>64</td><td>32</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r5d.24xlarge</td><td>768.00</td><td>Intel Xeon Platinum 8175</td><td>96</td><td>48</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r5d.metal</td><td>768.00</td><td>Intel Xeon Platinum 8175</td><td>96</td><td>48</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">R5dn</td></tr>
  <tr><td>r5dn.large</td><td>16.00</td><td>Intel Xeon Platinum 8259</td><td>2</td><td>1</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r5dn.xlarge</td><td>32.00</td><td>Intel Xeon Platinum 8259</td><td>4</td><td>2</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r5dn.2xlarge</td><td>64.00</td><td>Intel Xeon Platinum 8259</td><td>8</td><td>4</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r5dn.4xlarge</td><td>128.00</td><td>Intel Xeon Platinum 8259</td><td>16</td><td>8</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r5dn.8xlarge</td><td>256.00</td><td>Intel Xeon Platinum 8259</td><td>32</td><td>16</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r5dn.12xlarge</td><td>384.00</td><td>Intel Xeon Platinum 8259</td><td>48</td><td>24</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r5dn.16xlarge</td><td>512.00</td><td>Intel Xeon Platinum 8259</td><td>64</td><td>32</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r5dn.24xlarge</td><td>768.00</td><td>Intel Xeon Platinum 8259</td><td>96</td><td>48</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r5dn.metal</td><td>768.00</td><td>Intel Xeon Platinum 8259</td><td>96</td><td>48</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">R5n</td></tr>
  <tr><td>r5n.large</td><td>16.00</td><td>Intel Xeon Platinum 8259</td><td>2</td><td>1</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r5n.xlarge</td><td>32.00</td><td>Intel Xeon Platinum 8259</td><td>4</td><td>2</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r5n.2xlarge</td><td>64.00</td><td>Intel Xeon Platinum 8259</td><td>8</td><td>4</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r5n.4xlarge</td><td>128.00</td><td>Intel Xeon Platinum 8259</td><td>16</td><td>8</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r5n.8xlarge</td><td>256.00</td><td>Intel Xeon Platinum 8259</td><td>32</td><td>16</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r5n.12xlarge</td><td>384.00</td><td>Intel Xeon Platinum 8259</td><td>48</td><td>24</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r5n.16xlarge</td><td>512.00</td><td>Intel Xeon Platinum 8259</td><td>64</td><td>32</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r5n.24xlarge</td><td>768.00</td><td>Intel Xeon Platinum 8259</td><td>96</td><td>48</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r5n.metal</td><td>768.00</td><td>Intel Xeon Platinum 8259</td><td>96</td><td>48</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">R6a</td></tr>
  <tr><td>r6a.large</td><td>16.00</td><td>AMD EPYC 7R13</td><td>2</td><td>1</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r6a.xlarge</td><td>32.00</td><td>AMD EPYC 7R13</td><td>4</td><td>2</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r6a.2xlarge</td><td>64.00</td><td>AMD EPYC 7R13</td><td>8</td><td>4</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r6a.4xlarge</td><td>128.00</td><td>AMD EPYC 7R13</td><td>16</td><td>8</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r6a.8xlarge</td><td>256.00</td><td>AMD EPYC 7R13</td><td>32</td><td>16</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r6a.12xlarge</td><td>384.00</td><td>AMD EPYC 7R13</td><td>48</td><td>24</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r6a.16xlarge</td><td>512.00</td><td>AMD EPYC 7R13</td><td>64</td><td>32</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r6a.24xlarge</td><td>768.00</td><td>AMD EPYC 7R13</td><td>96</td><td>48</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r6a.32xlarge</td><td>1024.00</td><td>AMD EPYC 7R13</td><td>128</td><td>64</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r6a.48xlarge</td><td>1536.00</td><td>AMD EPYC 7R13</td><td>192</td><td>96</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r6a.metal</td><td>1536.00</td><td>AMD EPYC 7R13</td><td>192</td><td>96</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">R6g</td></tr>
  <tr><td>r6g.medium</td><td>8.00</td><td>AWS Graviton2 Processor</td><td>1</td><td>1</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r6g.large</td><td>16.00</td><td>AWS Graviton2 Processor</td><td>2</td><td>2</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r6g.xlarge</td><td>32.00</td><td>AWS Graviton2 Processor</td><td>4</td><td>4</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r6g.2xlarge</td><td>64.00</td><td>AWS Graviton2 Processor</td><td>8</td><td>8</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r6g.4xlarge</td><td>128.00</td><td>AWS Graviton2 Processor</td><td>16</td><td>16</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r6g.8xlarge</td><td>256.00</td><td>AWS Graviton2 Processor</td><td>32</td><td>32</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r6g.12xlarge</td><td>384.00</td><td>AWS Graviton2 Processor</td><td>48</td><td>48</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r6g.16xlarge</td><td>512.00</td><td>AWS Graviton2 Processor</td><td>64</td><td>64</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r6g.metal</td><td>512.00</td><td>AWS Graviton2 Processor</td><td>64</td><td>64</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">R6gd</td></tr>
  <tr><td>r6gd.medium</td><td>8.00</td><td>AWS Graviton2 Processor</td><td>1</td><td>1</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r6gd.large</td><td>16.00</td><td>AWS Graviton2 Processor</td><td>2</td><td>2</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r6gd.xlarge</td><td>32.00</td><td>AWS Graviton2 Processor</td><td>4</td><td>4</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r6gd.2xlarge</td><td>64.00</td><td>AWS Graviton2 Processor</td><td>8</td><td>8</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r6gd.4xlarge</td><td>128.00</td><td>AWS Graviton2 Processor</td><td>16</td><td>16</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r6gd.8xlarge</td><td>256.00</td><td>AWS Graviton2 Processor</td><td>32</td><td>32</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r6gd.12xlarge</td><td>384.00</td><td>AWS Graviton2 Processor</td><td>48</td><td>48</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r6gd.16xlarge</td><td>512.00</td><td>AWS Graviton2 Processor</td><td>64</td><td>64</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r6gd.metal</td><td>512.00</td><td>AWS Graviton2 Processor</td><td>64</td><td>64</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">R6i</td></tr>
  <tr><td>r6i.large</td><td>16.00</td><td>Intel Xeon Ice Lake</td><td>2</td><td>1</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r6i.xlarge</td><td>32.00</td><td>Intel Xeon Ice Lake</td><td>4</td><td>2</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r6i.2xlarge</td><td>64.00</td><td>Intel Xeon Ice Lake</td><td>8</td><td>4</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r6i.4xlarge</td><td>128.00</td><td>Intel Xeon Ice Lake</td><td>16</td><td>8</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r6i.8xlarge</td><td>256.00</td><td>Intel Xeon Ice Lake</td><td>32</td><td>16</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r6i.12xlarge</td><td>384.00</td><td>Intel Xeon Ice Lake</td><td>48</td><td>24</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r6i.16xlarge</td><td>512.00</td><td>Intel Xeon Ice Lake</td><td>64</td><td>32</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r6i.24xlarge</td><td>768.00</td><td>Intel Xeon Ice Lake</td><td>96</td><td>48</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r6i.32xlarge</td><td>1024.00</td><td>Intel Xeon Ice Lake</td><td>128</td><td>64</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r6i.metal</td><td>1024.00</td><td>Intel Xeon Ice Lake</td><td>128</td><td>64</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">R6id</td></tr>
  <tr><td>r6id.large</td><td>16.00</td><td>Intel Xeon Ice Lake</td><td>2</td><td>1</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r6id.xlarge</td><td>32.00</td><td>Intel Xeon Ice Lake</td><td>4</td><td>2</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r6id.2xlarge</td><td>64.00</td><td>Intel Xeon Ice Lake</td><td>8</td><td>4</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r6id.4xlarge</td><td>128.00</td><td>Intel Xeon Ice Lake</td><td>16</td><td>8</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r6id.8xlarge</td><td>256.00</td><td>Intel Xeon Ice Lake</td><td>32</td><td>16</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r6id.12xlarge</td><td>384.00</td><td>Intel Xeon Ice Lake</td><td>48</td><td>24</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r6id.16xlarge</td><td>512.00</td><td>Intel Xeon Ice Lake</td><td>64</td><td>32</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r6id.24xlarge</td><td>768.00</td><td>Intel Xeon Ice Lake</td><td>96</td><td>48</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r6id.32xlarge</td><td>1024.00</td><td>Intel Xeon Ice Lake</td><td>128</td><td>64</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r6id.metal</td><td>1024.00</td><td>Intel Xeon Ice Lake</td><td>128</td><td>64</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">R6idn</td></tr>
  <tr><td>r6idn.large</td><td>16.00</td><td>Intel Xeon Ice Lake</td><td>2</td><td>1</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r6idn.xlarge</td><td>32.00</td><td>Intel Xeon Ice Lake</td><td>4</td><td>2</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r6idn.2xlarge</td><td>64.00</td><td>Intel Xeon Ice Lake</td><td>8</td><td>4</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r6idn.4xlarge</td><td>128.00</td><td>Intel Xeon Ice Lake</td><td>16</td><td>8</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r6idn.8xlarge</td><td>256.00</td><td>Intel Xeon Ice Lake</td><td>32</td><td>16</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r6idn.12xlarge</td><td>384.00</td><td>Intel Xeon Ice Lake</td><td>48</td><td>24</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r6idn.16xlarge</td><td>512.00</td><td>Intel Xeon Ice Lake</td><td>64</td><td>32</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r6idn.24xlarge</td><td>768.00</td><td>Intel Xeon Ice Lake</td><td>96</td><td>48</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r6idn.32xlarge</td><td>1024.00</td><td>Intel Xeon Ice Lake</td><td>128</td><td>64</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r6idn.metal</td><td>1024.00</td><td>Intel Xeon Ice Lake</td><td>128</td><td>64</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">R6in</td></tr>
  <tr><td>r6in.large</td><td>16.00</td><td>Intel Xeon Ice Lake</td><td>2</td><td>1</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r6in.xlarge</td><td>32.00</td><td>Intel Xeon Ice Lake</td><td>4</td><td>2</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r6in.2xlarge</td><td>64.00</td><td>Intel Xeon Ice Lake</td><td>8</td><td>4</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r6in.4xlarge</td><td>128.00</td><td>Intel Xeon Ice Lake</td><td>16</td><td>8</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r6in.8xlarge</td><td>256.00</td><td>Intel Xeon Ice Lake</td><td>32</td><td>16</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r6in.12xlarge</td><td>384.00</td><td>Intel Xeon Ice Lake</td><td>48</td><td>24</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r6in.16xlarge</td><td>512.00</td><td>Intel Xeon Ice Lake</td><td>64</td><td>32</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r6in.24xlarge</td><td>768.00</td><td>Intel Xeon Ice Lake</td><td>96</td><td>48</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r6in.32xlarge</td><td>1024.00</td><td>Intel Xeon Ice Lake</td><td>128</td><td>64</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r6in.metal</td><td>1024.00</td><td>Intel Xeon Ice Lake</td><td>128</td><td>64</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">R7a</td></tr>
  <tr><td>r7a.medium</td><td>8.00</td><td>AMD EPYC 9R14</td><td>1</td><td>1</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r7a.large</td><td>16.00</td><td>AMD EPYC 9R14</td><td>2</td><td>2</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r7a.xlarge</td><td>32.00</td><td>AMD EPYC 9R14</td><td>4</td><td>4</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r7a.2xlarge</td><td>64.00</td><td>AMD EPYC 9R14</td><td>8</td><td>8</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r7a.4xlarge</td><td>128.00</td><td>AMD EPYC 9R14</td><td>16</td><td>16</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r7a.8xlarge</td><td>256.00</td><td>AMD EPYC 9R14</td><td>32</td><td>32</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r7a.12xlarge</td><td>384.00</td><td>AMD EPYC 9R14</td><td>48</td><td>48</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r7a.16xlarge</td><td>512.00</td><td>AMD EPYC 9R14</td><td>64</td><td>64</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r7a.24xlarge</td><td>768.00</td><td>AMD EPYC 9R14</td><td>96</td><td>96</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r7a.32xlarge</td><td>1024.00</td><td>AMD EPYC 9R14</td><td>128</td><td>128</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r7a.48xlarge</td><td>1536.00</td><td>AMD EPYC 9R14</td><td>192</td><td>192</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r7a.metal-48xl</td><td>1536.00</td><td>AMD EPYC 9R14</td><td>192</td><td>192</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">R7g</td></tr>
  <tr><td>r7g.medium</td><td>8.00</td><td>AWS Graviton3 Processor</td><td>1</td><td>1</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r7g.large</td><td>16.00</td><td>AWS Graviton3 Processor</td><td>2</td><td>2</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r7g.xlarge</td><td>32.00</td><td>AWS Graviton3 Processor</td><td>4</td><td>4</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r7g.2xlarge</td><td>64.00</td><td>AWS Graviton3 Processor</td><td>8</td><td>8</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r7g.4xlarge</td><td>128.00</td><td>AWS Graviton3 Processor</td><td>16</td><td>16</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r7g.8xlarge</td><td>256.00</td><td>AWS Graviton3 Processor</td><td>32</td><td>32</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r7g.12xlarge</td><td>384.00</td><td>AWS Graviton3 Processor</td><td>48</td><td>48</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r7g.16xlarge</td><td>512.00</td><td>AWS Graviton3 Processor</td><td>64</td><td>64</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r7g.metal</td><td>512.00</td><td>AWS Graviton3 Processor</td><td>64</td><td>64</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">R7gd</td></tr>
  <tr><td>r7gd.medium</td><td>8.00</td><td>AWS Graviton3 Processor</td><td>1</td><td>1</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r7gd.large</td><td>16.00</td><td>AWS Graviton3 Processor</td><td>2</td><td>2</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r7gd.xlarge</td><td>32.00</td><td>AWS Graviton3 Processor</td><td>4</td><td>4</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r7gd.2xlarge</td><td>64.00</td><td>AWS Graviton3 Processor</td><td>8</td><td>8</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r7gd.4xlarge</td><td>128.00</td><td>AWS Graviton3 Processor</td><td>16</td><td>16</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r7gd.8xlarge</td><td>256.00</td><td>AWS Graviton3 Processor</td><td>32</td><td>32</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r7gd.12xlarge</td><td>384.00</td><td>AWS Graviton3 Processor</td><td>48</td><td>48</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r7gd.16xlarge</td><td>512.00</td><td>AWS Graviton3 Processor</td><td>64</td><td>64</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r7gd.metal</td><td>512.00</td><td>AWS Graviton3 Processor</td><td>64</td><td>64</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">R7i</td></tr>
  <tr><td>r7i.large</td><td>16.00</td><td>Intel Xeon Sapphire Rapids</td><td>2</td><td>1</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r7i.xlarge</td><td>32.00</td><td>Intel Xeon Sapphire Rapids</td><td>4</td><td>2</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r7i.2xlarge</td><td>64.00</td><td>Intel Xeon Sapphire Rapids</td><td>8</td><td>4</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r7i.4xlarge</td><td>128.00</td><td>Intel Xeon Sapphire Rapids</td><td>16</td><td>8</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r7i.8xlarge</td><td>256.00</td><td>Intel Xeon Sapphire Rapids</td><td>32</td><td>16</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r7i.12xlarge</td><td>384.00</td><td>Intel Xeon Sapphire Rapids</td><td>48</td><td>24</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r7i.16xlarge</td><td>512.00</td><td>Intel Xeon Sapphire Rapids</td><td>64</td><td>32</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r7i.24xlarge</td><td>768.00</td><td>Intel Xeon Sapphire Rapids</td><td>96</td><td>48</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r7i.48xlarge</td><td>1536.00</td><td>Intel Xeon Sapphire Rapids</td><td>192</td><td>96</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r7i.metal-24xl</td><td>768.00</td><td>Intel Xeon Sapphire Rapids</td><td>96</td><td>48</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r7i.metal-48xl</td><td>1536.00</td><td>Intel Xeon Sapphire Rapids</td><td>192</td><td>96</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">R7iz</td></tr>
  <tr><td>r7iz.large</td><td>16.00</td><td>Intel Xeon Sapphire Rapids</td><td>2</td><td>1</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r7iz.xlarge</td><td>32.00</td><td>Intel Xeon Sapphire Rapids</td><td>4</td><td>2</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r7iz.2xlarge</td><td>64.00</td><td>Intel Xeon Sapphire Rapids</td><td>8</td><td>4</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r7iz.4xlarge</td><td>128.00</td><td>Intel Xeon Sapphire Rapids</td><td>16</td><td>8</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r7iz.8xlarge</td><td>256.00</td><td>Intel Xeon Sapphire Rapids</td><td>32</td><td>16</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r7iz.12xlarge</td><td>384.00</td><td>Intel Xeon Sapphire Rapids</td><td>48</td><td>24</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r7iz.16xlarge</td><td>512.00</td><td>Intel Xeon Sapphire Rapids</td><td>64</td><td>32</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r7iz.32xlarge</td><td>1024.00</td><td>Intel Xeon Sapphire Rapids</td><td>128</td><td>64</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r7iz.metal-16xl</td><td>512.00</td><td>Intel Xeon Sapphire Rapids</td><td>64</td><td>32</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r7iz.metal-32xl</td><td>1024.00</td><td>Intel Xeon Sapphire Rapids</td><td>128</td><td>64</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">R8a</td></tr>
  <tr><td>r8a.medium</td><td>8.00</td><td>AMD EPYC 9R45</td><td>1</td><td>1</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8a.large</td><td>16.00</td><td>AMD EPYC 9R45</td><td>2</td><td>2</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8a.xlarge</td><td>32.00</td><td>AMD EPYC 9R45</td><td>4</td><td>4</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8a.2xlarge</td><td>64.00</td><td>AMD EPYC 9R45</td><td>8</td><td>8</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8a.4xlarge</td><td>128.00</td><td>AMD EPYC 9R45</td><td>16</td><td>16</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8a.8xlarge</td><td>256.00</td><td>AMD EPYC 9R45</td><td>32</td><td>32</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8a.12xlarge</td><td>384.00</td><td>AMD EPYC 9R45</td><td>48</td><td>48</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8a.16xlarge</td><td>512.00</td><td>AMD EPYC 9R45</td><td>64</td><td>64</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8a.24xlarge</td><td>768.00</td><td>AMD EPYC 9R45</td><td>96</td><td>96</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8a.48xlarge</td><td>1536.00</td><td>AMD EPYC 9R45</td><td>192</td><td>192</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8a.metal-24xl</td><td>768.00</td><td>AMD EPYC 9R45</td><td>96</td><td>96</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8a.metal-48xl</td><td>1536.00</td><td>AMD EPYC 9R45</td><td>192</td><td>192</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">R8g</td></tr>
  <tr><td>r8g.medium</td><td>8.00</td><td>AWS Graviton4 Processor</td><td>1</td><td>1</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8g.large</td><td>16.00</td><td>AWS Graviton4 Processor</td><td>2</td><td>2</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8g.xlarge</td><td>32.00</td><td>AWS Graviton4 Processor</td><td>4</td><td>4</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8g.2xlarge</td><td>64.00</td><td>AWS Graviton4 Processor</td><td>8</td><td>8</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8g.4xlarge</td><td>128.00</td><td>AWS Graviton4 Processor</td><td>16</td><td>16</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8g.8xlarge</td><td>256.00</td><td>AWS Graviton4 Processor</td><td>32</td><td>32</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8g.12xlarge</td><td>384.00</td><td>AWS Graviton4 Processor</td><td>48</td><td>48</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8g.16xlarge</td><td>512.00</td><td>AWS Graviton4 Processor</td><td>64</td><td>64</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8g.24xlarge</td><td>768.00</td><td>AWS Graviton4 Processor</td><td>96</td><td>96</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8g.48xlarge</td><td>1536.00</td><td>AWS Graviton4 Processor</td><td>192</td><td>192</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8g.metal-24xl</td><td>768.00</td><td>AWS Graviton4 Processor</td><td>96</td><td>96</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8g.metal-48xl</td><td>1536.00</td><td>AWS Graviton4 Processor</td><td>192</td><td>192</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">R8gb</td></tr>
  <tr><td>r8gb.medium</td><td>8.00</td><td>AWS Graviton4 Processor</td><td>1</td><td>1</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8gb.large</td><td>16.00</td><td>AWS Graviton4 Processor</td><td>2</td><td>2</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8gb.xlarge</td><td>32.00</td><td>AWS Graviton4 Processor</td><td>4</td><td>4</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8gb.2xlarge</td><td>64.00</td><td>AWS Graviton4 Processor</td><td>8</td><td>8</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8gb.4xlarge</td><td>128.00</td><td>AWS Graviton4 Processor</td><td>16</td><td>16</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8gb.8xlarge</td><td>256.00</td><td>AWS Graviton4 Processor</td><td>32</td><td>32</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8gb.12xlarge</td><td>384.00</td><td>AWS Graviton4 Processor</td><td>48</td><td>48</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8gb.16xlarge</td><td>512.00</td><td>AWS Graviton4 Processor</td><td>64</td><td>64</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8gb.24xlarge</td><td>768.00</td><td>AWS Graviton4 Processor</td><td>96</td><td>96</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8gb.48xlarge</td><td>1536.00</td><td>AWS Graviton4 Processor</td><td>192</td><td>192</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8gb.metal-24xl</td><td>768.00</td><td>AWS Graviton4 Processor</td><td>96</td><td>96</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8gb.metal-48xl</td><td>1536.00</td><td>AWS Graviton4 Processor</td><td>192</td><td>192</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">R8gd</td></tr>
  <tr><td>r8gd.medium</td><td>8.00</td><td>AWS Graviton4 Processor</td><td>1</td><td>1</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8gd.large</td><td>16.00</td><td>AWS Graviton4 Processor</td><td>2</td><td>2</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8gd.xlarge</td><td>32.00</td><td>AWS Graviton4 Processor</td><td>4</td><td>4</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8gd.2xlarge</td><td>64.00</td><td>AWS Graviton4 Processor</td><td>8</td><td>8</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8gd.4xlarge</td><td>128.00</td><td>AWS Graviton4 Processor</td><td>16</td><td>16</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8gd.8xlarge</td><td>256.00</td><td>AWS Graviton4 Processor</td><td>32</td><td>32</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8gd.12xlarge</td><td>384.00</td><td>AWS Graviton4 Processor</td><td>48</td><td>48</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8gd.16xlarge</td><td>512.00</td><td>AWS Graviton4 Processor</td><td>64</td><td>64</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8gd.24xlarge</td><td>768.00</td><td>AWS Graviton4 Processor</td><td>96</td><td>96</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8gd.48xlarge</td><td>1536.00</td><td>AWS Graviton4 Processor</td><td>192</td><td>192</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8gd.metal-24xl</td><td>768.00</td><td>AWS Graviton4 Processor</td><td>96</td><td>96</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8gd.metal-48xl</td><td>1536.00</td><td>AWS Graviton4 Processor</td><td>192</td><td>192</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">R8gn</td></tr>
  <tr><td>r8gn.medium</td><td>8.00</td><td>AWS Graviton4 Processor</td><td>1</td><td>1</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8gn.large</td><td>16.00</td><td>AWS Graviton4 Processor</td><td>2</td><td>2</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8gn.xlarge</td><td>32.00</td><td>AWS Graviton4 Processor</td><td>4</td><td>4</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8gn.2xlarge</td><td>64.00</td><td>AWS Graviton4 Processor</td><td>8</td><td>8</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8gn.4xlarge</td><td>128.00</td><td>AWS Graviton4 Processor</td><td>16</td><td>16</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8gn.8xlarge</td><td>256.00</td><td>AWS Graviton4 Processor</td><td>32</td><td>32</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8gn.12xlarge</td><td>384.00</td><td>AWS Graviton4 Processor</td><td>48</td><td>48</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8gn.16xlarge</td><td>512.00</td><td>AWS Graviton4 Processor</td><td>64</td><td>64</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8gn.24xlarge</td><td>768.00</td><td>AWS Graviton4 Processor</td><td>96</td><td>96</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8gn.48xlarge</td><td>1536.00</td><td>AWS Graviton4 Processor</td><td>192</td><td>192</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8gn.metal-24xl</td><td>768.00</td><td>AWS Graviton4 Processor</td><td>96</td><td>96</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8gn.metal-48xl</td><td>1536.00</td><td>AWS Graviton4 Processor</td><td>192</td><td>192</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">R8i</td></tr>
  <tr><td>r8i.large</td><td>16.00</td><td>Intel Xeon Granite Rapids</td><td>2</td><td>1</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8i.xlarge</td><td>32.00</td><td>Intel Xeon Granite Rapids</td><td>4</td><td>2</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8i.2xlarge</td><td>64.00</td><td>Intel Xeon Granite Rapids</td><td>8</td><td>4</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8i.4xlarge</td><td>128.00</td><td>Intel Xeon Granite Rapids</td><td>16</td><td>8</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8i.8xlarge</td><td>256.00</td><td>Intel Xeon Granite Rapids</td><td>32</td><td>16</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8i.12xlarge</td><td>384.00</td><td>Intel Xeon Granite Rapids</td><td>48</td><td>24</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8i.16xlarge</td><td>512.00</td><td>Intel Xeon Granite Rapids</td><td>64</td><td>32</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8i.24xlarge</td><td>768.00</td><td>Intel Xeon Granite Rapids</td><td>96</td><td>48</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8i.32xlarge</td><td>1024.00</td><td>Intel Xeon Granite Rapids</td><td>128</td><td>64</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8i.48xlarge</td><td>1536.00</td><td>Intel Xeon Granite Rapids</td><td>192</td><td>96</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8i.96xlarge</td><td>3072.00</td><td>Intel Xeon Granite Rapids</td><td>384</td><td>192</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8i.metal-48xl</td><td>1536.00</td><td>Intel Xeon Granite Rapids</td><td>192</td><td>96</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8i.metal-96xl</td><td>3072.00</td><td>Intel Xeon Granite Rapids</td><td>384</td><td>192</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">R8id</td></tr>
  <tr><td>r8id.large</td><td>16.00</td><td>Intel Xeon Granite Rapids</td><td>2</td><td>1</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8id.xlarge</td><td>32.00</td><td>Intel Xeon Granite Rapids</td><td>4</td><td>2</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8id.2xlarge</td><td>64.00</td><td>Intel Xeon Granite Rapids</td><td>8</td><td>4</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8id.4xlarge</td><td>128.00</td><td>Intel Xeon Granite Rapids</td><td>16</td><td>8</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8id.8xlarge</td><td>256.00</td><td>Intel Xeon Granite Rapids</td><td>32</td><td>16</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8id.12xlarge</td><td>384.00</td><td>Intel Xeon Granite Rapids</td><td>48</td><td>24</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8id.16xlarge</td><td>512.00</td><td>Intel Xeon Granite Rapids</td><td>64</td><td>32</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8id.24xlarge</td><td>768.00</td><td>Intel Xeon Granite Rapids</td><td>96</td><td>48</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8id.32xlarge</td><td>1024.00</td><td>Intel Xeon Granite Rapids</td><td>128</td><td>64</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8id.48xlarge</td><td>1536.00</td><td>Intel Xeon Granite Rapids</td><td>192</td><td>96</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8id.96xlarge</td><td>3072.00</td><td>Intel Xeon Granite Rapids</td><td>384</td><td>192</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8id.metal-48xl</td><td>1536.00</td><td>Intel Xeon Granite Rapids</td><td>192</td><td>96</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8id.metal-96xl</td><td>3072.00</td><td>Intel Xeon Granite Rapids</td><td>384</td><td>192</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">R8i-flex</td></tr>
  <tr><td>r8i-flex.large</td><td>16.00</td><td>Intel Xeon Granite Rapids</td><td>2</td><td>1</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8i-flex.xlarge</td><td>32.00</td><td>Intel Xeon Granite Rapids</td><td>4</td><td>2</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8i-flex.2xlarge</td><td>64.00</td><td>Intel Xeon Granite Rapids</td><td>8</td><td>4</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8i-flex.4xlarge</td><td>128.00</td><td>Intel Xeon Granite Rapids</td><td>16</td><td>8</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8i-flex.8xlarge</td><td>256.00</td><td>Intel Xeon Granite Rapids</td><td>32</td><td>16</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8i-flex.12xlarge</td><td>384.00</td><td>Intel Xeon Granite Rapids</td><td>48</td><td>24</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8i-flex.16xlarge</td><td>512.00</td><td>Intel Xeon Granite Rapids</td><td>64</td><td>32</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">R8in</td></tr>
  <tr><td>r8in.large</td><td>16.00</td><td>Intel Xeon Granite Rapids</td><td>2</td><td>1</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8in.xlarge</td><td>32.00</td><td>Intel Xeon Granite Rapids</td><td>4</td><td>2</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8in.2xlarge</td><td>64.00</td><td>Intel Xeon Granite Rapids</td><td>8</td><td>4</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8in.4xlarge</td><td>128.00</td><td>Intel Xeon Granite Rapids</td><td>16</td><td>8</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8in.8xlarge</td><td>256.00</td><td>Intel Xeon Granite Rapids</td><td>32</td><td>16</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8in.12xlarge</td><td>384.00</td><td>Intel Xeon Granite Rapids</td><td>48</td><td>24</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8in.16xlarge</td><td>512.00</td><td>Intel Xeon Granite Rapids</td><td>64</td><td>32</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8in.24xlarge</td><td>768.00</td><td>Intel Xeon Granite Rapids</td><td>96</td><td>48</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8in.32xlarge</td><td>1024.00</td><td>Intel Xeon Granite Rapids</td><td>128</td><td>64</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8in.48xlarge</td><td>1536.00</td><td>Intel Xeon Granite Rapids</td><td>192</td><td>96</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8in.96xlarge</td><td>3072.00</td><td>Intel Xeon Granite Rapids</td><td>384</td><td>192</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">R8idn</td></tr>
  <tr><td>r8idn.large</td><td>16.00</td><td>Intel Xeon Granite Rapids</td><td>2</td><td>1</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8idn.xlarge</td><td>32.00</td><td>Intel Xeon Granite Rapids</td><td>4</td><td>2</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8idn.2xlarge</td><td>64.00</td><td>Intel Xeon Granite Rapids</td><td>8</td><td>4</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8idn.4xlarge</td><td>128.00</td><td>Intel Xeon Granite Rapids</td><td>16</td><td>8</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8idn.8xlarge</td><td>256.00</td><td>Intel Xeon Granite Rapids</td><td>32</td><td>16</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8idn.12xlarge</td><td>384.00</td><td>Intel Xeon Granite Rapids</td><td>48</td><td>24</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8idn.16xlarge</td><td>512.00</td><td>Intel Xeon Granite Rapids</td><td>64</td><td>32</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8idn.24xlarge</td><td>768.00</td><td>Intel Xeon Granite Rapids</td><td>96</td><td>48</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8idn.32xlarge</td><td>1024.00</td><td>Intel Xeon Granite Rapids</td><td>128</td><td>64</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8idn.48xlarge</td><td>1536.00</td><td>Intel Xeon Granite Rapids</td><td>192</td><td>96</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8idn.96xlarge</td><td>3072.00</td><td>Intel Xeon Granite Rapids</td><td>384</td><td>192</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">R8ib</td></tr>
  <tr><td>r8ib.large</td><td>16.00</td><td>Intel Xeon Granite Rapids</td><td>2</td><td>1</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8ib.xlarge</td><td>32.00</td><td>Intel Xeon Granite Rapids</td><td>4</td><td>2</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8ib.2xlarge</td><td>64.00</td><td>Intel Xeon Granite Rapids</td><td>8</td><td>4</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8ib.4xlarge</td><td>128.00</td><td>Intel Xeon Granite Rapids</td><td>16</td><td>8</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8ib.8xlarge</td><td>256.00</td><td>Intel Xeon Granite Rapids</td><td>32</td><td>16</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8ib.12xlarge</td><td>384.00</td><td>Intel Xeon Granite Rapids</td><td>48</td><td>24</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8ib.16xlarge</td><td>512.00</td><td>Intel Xeon Granite Rapids</td><td>64</td><td>32</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8ib.24xlarge</td><td>768.00</td><td>Intel Xeon Granite Rapids</td><td>96</td><td>48</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8ib.32xlarge</td><td>1024.00</td><td>Intel Xeon Granite Rapids</td><td>128</td><td>64</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8ib.48xlarge</td><td>1536.00</td><td>Intel Xeon Granite Rapids</td><td>192</td><td>96</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8ib.96xlarge</td><td>3072.00</td><td>Intel Xeon Granite Rapids</td><td>384</td><td>192</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">R8idb</td></tr>
  <tr><td>r8idb.large</td><td>16.00</td><td>Intel Xeon Granite Rapids</td><td>2</td><td>1</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8idb.xlarge</td><td>32.00</td><td>Intel Xeon Granite Rapids</td><td>4</td><td>2</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8idb.2xlarge</td><td>64.00</td><td>Intel Xeon Granite Rapids</td><td>8</td><td>4</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8idb.4xlarge</td><td>128.00</td><td>Intel Xeon Granite Rapids</td><td>16</td><td>8</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8idb.8xlarge</td><td>256.00</td><td>Intel Xeon Granite Rapids</td><td>32</td><td>16</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8idb.12xlarge</td><td>384.00</td><td>Intel Xeon Granite Rapids</td><td>48</td><td>24</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8idb.16xlarge</td><td>512.00</td><td>Intel Xeon Granite Rapids</td><td>64</td><td>32</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8idb.24xlarge</td><td>768.00</td><td>Intel Xeon Granite Rapids</td><td>96</td><td>48</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8idb.32xlarge</td><td>1024.00</td><td>Intel Xeon Granite Rapids</td><td>128</td><td>64</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8idb.48xlarge</td><td>1536.00</td><td>Intel Xeon Granite Rapids</td><td>192</td><td>96</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8idb.96xlarge</td><td>3072.00</td><td>Intel Xeon Granite Rapids</td><td>384</td><td>192</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">U-3tb1</td></tr>
  <tr><td>u-3tb1.56xlarge</td><td>3072.00</td><td>Intel Xeon Platinum 8176M</td><td>224</td><td>112</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">U-6tb1</td></tr>
  <tr><td>u-6tb1.56xlarge</td><td>6144.00</td><td>Intel Xeon Platinum 8176M</td><td>224</td><td>224</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>u-6tb1.112xlarge</td><td>6144.00</td><td>Intel Xeon Platinum 8176M</td><td>448</td><td>224</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>u-6tb1.metal</td><td>6144.00</td><td>Intel Xeon Platinum 8176M</td><td>448</td><td>224</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">U-9tb1</td></tr>
  <tr><td>u-9tb1.112xlarge</td><td>9216.00</td><td>Intel Xeon Platinum 8176M</td><td>448</td><td>224</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>u-9tb1.metal</td><td>9216.00</td><td>Intel Xeon Platinum 8176M</td><td>448</td><td>224</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">U-12tb1</td></tr>
  <tr><td>u-12tb1.112xlarge</td><td>12288.00</td><td>Intel Xeon Platinum 8176M</td><td>448</td><td>224</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>u-12tb1.metal</td><td>12288.00</td><td>Intel Xeon Platinum 8176M</td><td>448</td><td>224</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">U-18tb1</td></tr>
  <tr><td>u-18tb1.112xlarge</td><td>18432.00</td><td>Intel Xeon Platinum 8280L</td><td>448</td><td>224</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>u-18tb1.metal</td><td>18432.00</td><td>Intel Xeon Platinum 8280L</td><td>448</td><td>224</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">U-24tb1</td></tr>
  <tr><td>u-24tb1.112xlarge</td><td>24576.00</td><td>Intel Xeon Platinum 8280L</td><td>448</td><td>224</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>u-24tb1.metal</td><td>24576.00</td><td>Intel Xeon Platinum 8280L</td><td>448</td><td>224</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">U7i-6tb</td></tr>
  <tr><td>u7i-6tb.112xlarge</td><td>6144.00</td><td>Intel Xeon Sapphire Rapids</td><td>448</td><td>224</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">U7i-8tb</td></tr>
  <tr><td>u7i-8tb.112xlarge</td><td>8192.00</td><td>Intel Xeon Sapphire Rapids</td><td>448</td><td>224</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">U7i-12tb</td></tr>
  <tr><td>u7i-12tb.224xlarge</td><td>12288.00</td><td>Intel Xeon Sapphire Rapids</td><td>896</td><td>448</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">U7in-16tb</td></tr>
  <tr><td>u7in-16tb.224xlarge</td><td>16384.00</td><td>Intel Xeon Sapphire Rapids</td><td>896</td><td>448</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">U7in-24tb</td></tr>
  <tr><td>u7in-24tb.224xlarge</td><td>24576.00</td><td>Intel Xeon Sapphire Rapids</td><td>896</td><td>448</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">U7in-32tb</td></tr>
  <tr><td>u7in-32tb.224xlarge</td><td>32768.00</td><td>Intel Xeon Sapphire Rapids</td><td>896</td><td>448</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">U7inh-32tb</td></tr>
  <tr><td>u7inh-32tb.480xlarge</td><td>32768.00</td><td>Intel Xeon Sapphire Rapids</td><td>1920</td><td>960</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">X1</td></tr>
  <tr><td>x1.16xlarge</td><td>976.00</td><td>Intel Xeon E7 8880 v3</td><td>64</td><td>32</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>x1.32xlarge</td><td>1952.00</td><td>Intel Xeon E7 8880 v3</td><td>128</td><td>64</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">X1e</td></tr>
  <tr><td>x1e.xlarge</td><td>122.00</td><td>Intel Haswell E7 8880v3</td><td>4</td><td>2</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>x1e.2xlarge</td><td>244.00</td><td>Intel Haswell E7 8880v3</td><td>8</td><td>4</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>x1e.4xlarge</td><td>488.00</td><td>Intel Haswell E7 8880v3</td><td>16</td><td>8</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>x1e.8xlarge</td><td>976.00</td><td>Intel Haswell E7 8880v3</td><td>32</td><td>16</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>x1e.16xlarge</td><td>1952.00</td><td>Intel Haswell E7 8880v3</td><td>64</td><td>32</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>x1e.32xlarge</td><td>3904.00</td><td>Intel Haswell E7 8880v3</td><td>128</td><td>64</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">X2gd</td></tr>
  <tr><td>x2gd.medium</td><td>16.00</td><td>AWS Graviton2 Processor</td><td>1</td><td>1</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>x2gd.large</td><td>32.00</td><td>AWS Graviton2 Processor</td><td>2</td><td>2</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>x2gd.xlarge</td><td>64.00</td><td>AWS Graviton2 Processor</td><td>4</td><td>4</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>x2gd.2xlarge</td><td>128.00</td><td>AWS Graviton2 Processor</td><td>8</td><td>8</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>x2gd.4xlarge</td><td>256.00</td><td>AWS Graviton2 Processor</td><td>16</td><td>16</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>x2gd.8xlarge</td><td>512.00</td><td>AWS Graviton2 Processor</td><td>32</td><td>32</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>x2gd.12xlarge</td><td>768.00</td><td>AWS Graviton2 Processor</td><td>48</td><td>48</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>x2gd.16xlarge</td><td>1024.00</td><td>AWS Graviton2 Processor</td><td>64</td><td>64</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>x2gd.metal</td><td>1024.00</td><td>AWS Graviton2 Processor</td><td>64</td><td>64</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">X2idn</td></tr>
  <tr><td>x2idn.16xlarge</td><td>1024.00</td><td>Intel Xeon Ice Lake</td><td>64</td><td>32</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>x2idn.24xlarge</td><td>1536.00</td><td>Intel Xeon Ice Lake</td><td>96</td><td>48</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>x2idn.32xlarge</td><td>2048.00</td><td>Intel Xeon Ice Lake</td><td>128</td><td>64</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>x2idn.metal</td><td>2048.00</td><td>Intel Xeon Ice Lake</td><td>128</td><td>64</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">X2iedn</td></tr>
  <tr><td>x2iedn.xlarge</td><td>128.00</td><td>Intel Xeon Ice Lake</td><td>4</td><td>2</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>x2iedn.2xlarge</td><td>256.00</td><td>Intel Xeon Ice Lake</td><td>8</td><td>4</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>x2iedn.4xlarge</td><td>512.00</td><td>Intel Xeon Ice Lake</td><td>16</td><td>8</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>x2iedn.8xlarge</td><td>1024.00</td><td>Intel Xeon Ice Lake</td><td>32</td><td>16</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>x2iedn.16xlarge</td><td>2048.00</td><td>Intel Xeon Ice Lake</td><td>64</td><td>32</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>x2iedn.24xlarge</td><td>3072.00</td><td>Intel Xeon Ice Lake</td><td>96</td><td>48</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>x2iedn.32xlarge</td><td>4096.00</td><td>Intel Xeon Ice Lake</td><td>128</td><td>64</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>x2iedn.metal</td><td>4096.00</td><td>Intel Xeon Ice Lake</td><td>128</td><td>64</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">X2iezn</td></tr>
  <tr><td>x2iezn.2xlarge</td><td>256.00</td><td>Intel Xeon Platinum 8252</td><td>8</td><td>4</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>x2iezn.4xlarge</td><td>512.00</td><td>Intel Xeon Platinum 8252</td><td>16</td><td>8</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>x2iezn.6xlarge</td><td>768.00</td><td>Intel Xeon Platinum 8252</td><td>24</td><td>12</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>x2iezn.8xlarge</td><td>1024.00</td><td>Intel Xeon Platinum 8252</td><td>32</td><td>16</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>x2iezn.12xlarge</td><td>1536.00</td><td>Intel Xeon Platinum 8252</td><td>48</td><td>24</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>x2iezn.metal</td><td>1536.00</td><td>Intel Xeon Platinum 8252</td><td>48</td><td>24</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">X8g</td></tr>
  <tr><td>x8g.medium</td><td>16.00</td><td>AWS Graviton4 Processor</td><td>1</td><td>1</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>x8g.large</td><td>32.00</td><td>AWS Graviton4 Processor</td><td>2</td><td>2</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>x8g.xlarge</td><td>64.00</td><td>AWS Graviton4 Processor</td><td>4</td><td>4</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>x8g.2xlarge</td><td>128.00</td><td>AWS Graviton4 Processor</td><td>8</td><td>8</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>x8g.4xlarge</td><td>256.00</td><td>AWS Graviton4 Processor</td><td>16</td><td>16</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>x8g.8xlarge</td><td>512.00</td><td>AWS Graviton4 Processor</td><td>32</td><td>32</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>x8g.12xlarge</td><td>768.00</td><td>AWS Graviton4 Processor</td><td>48</td><td>48</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>x8g.16xlarge</td><td>1024.00</td><td>AWS Graviton4 Processor</td><td>64</td><td>64</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>x8g.24xlarge</td><td>1536.00</td><td>AWS Graviton4 Processor</td><td>96</td><td>96</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>x8g.48xlarge</td><td>3072.00</td><td>AWS Graviton4 Processor</td><td>192</td><td>192</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>x8g.metal-24xl</td><td>1536.00</td><td>AWS Graviton4 Processor</td><td>96</td><td>96</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>x8g.metal-48xl</td><td>3072.00</td><td>AWS Graviton4 Processor</td><td>192</td><td>192</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">X8aedz</td></tr>
  <tr><td>x8aedz.large</td><td>64.00</td><td>AMD EPYC 9R05</td><td>2</td><td>2</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>x8aedz.xlarge</td><td>128.00</td><td>AMD EPYC 9R05</td><td>4</td><td>4</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>x8aedz.3xlarge</td><td>384.00</td><td>AMD EPYC 9R05</td><td>12</td><td>12</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>x8aedz.6xlarge</td><td>768.00</td><td>AMD EPYC 9R05</td><td>24</td><td>24</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>x8aedz.12xlarge</td><td>1536.00</td><td>AMD EPYC 9R05</td><td>48</td><td>48</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>x8aedz.24xlarge</td><td>3072.00</td><td>AMD EPYC 9R05</td><td>96</td><td>96</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>x8aedz.metal-12xl</td><td>1536.00</td><td>AMD EPYC 9R05</td><td>48</td><td>48</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>x8aedz.metal-24xl</td><td>3072.00</td><td>AMD EPYC 9R05</td><td>96</td><td>96</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">X8i</td></tr>
  <tr><td>x8i.large</td><td>32.00</td><td>Intel Xeon Granite Rapids</td><td>2</td><td>1</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>x8i.xlarge</td><td>64.00</td><td>Intel Xeon Granite Rapids</td><td>4</td><td>2</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>x8i.2xlarge</td><td>128.00</td><td>Intel Xeon Granite Rapids</td><td>8</td><td>4</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>x8i.4xlarge</td><td>256.00</td><td>Intel Xeon Granite Rapids</td><td>16</td><td>8</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>x8i.8xlarge</td><td>512.00</td><td>Intel Xeon Granite Rapids</td><td>32</td><td>16</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>x8i.12xlarge</td><td>768.00</td><td>Intel Xeon Granite Rapids</td><td>48</td><td>24</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>x8i.16xlarge</td><td>1024.00</td><td>Intel Xeon Granite Rapids</td><td>64</td><td>32</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>x8i.24xlarge</td><td>1536.00</td><td>Intel Xeon Granite Rapids</td><td>96</td><td>48</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>x8i.32xlarge</td><td>2048.00</td><td>Intel Xeon Granite Rapids</td><td>128</td><td>64</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>x8i.48xlarge</td><td>3072.00</td><td>Intel Xeon Granite Rapids</td><td>192</td><td>96</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>x8i.64xlarge</td><td>4096.00</td><td>Intel Xeon Granite Rapids</td><td>256</td><td>128</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>x8i.96xlarge</td><td>6144.00</td><td>Intel Xeon Granite Rapids</td><td>384</td><td>192</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>x8i.metal-48xl</td><td>3072.00</td><td>Intel Xeon Granite Rapids</td><td>192</td><td>96</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>x8i.metal-96xl</td><td>6144.00</td><td>Intel Xeon Granite Rapids</td><td>384</td><td>192</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">z1d</td></tr>
  <tr><td>z1d.large</td><td>16.00</td><td>Intel Xeon Platinum 8151</td><td>2</td><td>1</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>z1d.xlarge</td><td>32.00</td><td>Intel Xeon Platinum 8151</td><td>4</td><td>2</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>z1d.2xlarge</td><td>64.00</td><td>Intel Xeon Platinum 8151</td><td>8</td><td>4</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>z1d.3xlarge</td><td>96.00</td><td>Intel Xeon Platinum 8151</td><td>12</td><td>6</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>z1d.6xlarge</td><td>192.00</td><td>Intel Xeon Platinum 8151</td><td>24</td><td>12</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>z1d.12xlarge</td><td>384.00</td><td>Intel Xeon Platinum 8151</td><td>48</td><td>24</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>z1d.metal</td><td>384.00</td><td>Intel Xeon Platinum 8151</td><td>48</td><td>24</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
</tbody>
</table>


## Network specifications
<a name="mo_network"></a>

**Note**  
R8a, R8g, R8gd, R8i, R8id, R8i-flex, X8g, X8aedz, X8i instance types support configurable bandwidth weightings. With these instance types, you can optimize an instance's bandwidth for either networking performance or Amazon EBS performance. The following table shows the default networking bandwidth performance for these instance types. For the supported configurable weightings, see [ Configurable bandwidth weighting preferences](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/configure-bandwidth-weighting.html).


<table>
<thead>
  <tr><th>Instance type</th><th>Baseline / Burst bandwidth (Gbps)</th><th>EFA</th><th>ENA</th><th>ENA Express</th><th>Network cards</th><th>Max. network interfaces</th><th>IP addresses per interface</th><th>IPv6</th></tr>
</thead>
<tbody>
  <tr><td colspan="9">R5</td></tr>
  <tr><td>r5.large 1</td><td>0.75 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>r5.xlarge 1</td><td>1.25 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>r5.2xlarge 1</td><td>2.5 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>r5.4xlarge 1</td><td>5.0 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>r5.8xlarge</td><td>10 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>r5.12xlarge</td><td>12 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>r5.16xlarge</td><td>20 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>r5.24xlarge</td><td>25 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>r5.metal</td><td>25 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">R5a</td></tr>
  <tr><td>r5a.large 1</td><td>0.75 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>r5a.xlarge 1</td><td>1.25 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>r5a.2xlarge 1</td><td>2.5 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>r5a.4xlarge 1</td><td>5.0 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>r5a.8xlarge 1</td><td>7.5 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>r5a.12xlarge</td><td>10 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>r5a.16xlarge</td><td>12 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>r5a.24xlarge</td><td>20 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">R5ad</td></tr>
  <tr><td>r5ad.large 1</td><td>0.75 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>r5ad.xlarge 1</td><td>1.25 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>r5ad.2xlarge 1</td><td>2.5 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>r5ad.4xlarge 1</td><td>5.0 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>r5ad.8xlarge 1</td><td>7.5 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>r5ad.12xlarge</td><td>10 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>r5ad.16xlarge</td><td>12 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>r5ad.24xlarge</td><td>20 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">R5b</td></tr>
  <tr><td>r5b.large 1</td><td>0.75 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>r5b.xlarge 1</td><td>1.25 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>r5b.2xlarge 1</td><td>2.5 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>r5b.4xlarge 1</td><td>5.0 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>r5b.8xlarge</td><td>10 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>r5b.12xlarge</td><td>12 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>r5b.16xlarge</td><td>20 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>r5b.24xlarge</td><td>25 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>r5b.metal</td><td>25 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">R5d</td></tr>
  <tr><td>r5d.large 1</td><td>0.75 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>r5d.xlarge 1</td><td>1.25 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>r5d.2xlarge 1</td><td>2.5 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>r5d.4xlarge 1</td><td>5.0 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>r5d.8xlarge</td><td>10 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>r5d.12xlarge</td><td>12 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>r5d.16xlarge</td><td>20 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>r5d.24xlarge</td><td>25 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>r5d.metal</td><td>25 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">R5dn</td></tr>
  <tr><td>r5dn.large 1</td><td>2.1 / 25.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>r5dn.xlarge 1</td><td>4.1 / 25.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>r5dn.2xlarge 1</td><td>8.125 / 25.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>r5dn.4xlarge 1</td><td>16.25 / 25.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>r5dn.8xlarge</td><td>25 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>r5dn.12xlarge</td><td>50 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>r5dn.16xlarge</td><td>75 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>r5dn.24xlarge</td><td>100 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>r5dn.metal</td><td>100 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">R5n</td></tr>
  <tr><td>r5n.large 1</td><td>2.1 / 25.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>r5n.xlarge 1</td><td>4.1 / 25.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>r5n.2xlarge 1</td><td>8.125 / 25.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>r5n.4xlarge 1</td><td>16.25 / 25.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>r5n.8xlarge</td><td>25 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>r5n.12xlarge</td><td>50 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>r5n.16xlarge</td><td>75 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>r5n.24xlarge</td><td>100 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>r5n.metal</td><td>100 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">R6a</td></tr>
  <tr><td>r6a.large 1</td><td>0.781 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>r6a.xlarge 1</td><td>1.562 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>r6a.2xlarge 1</td><td>3.125 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>r6a.4xlarge 1</td><td>6.25 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>r6a.8xlarge</td><td>12.5 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>r6a.12xlarge</td><td>18.75 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>r6a.16xlarge</td><td>25 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>r6a.24xlarge</td><td>37.5 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>r6a.32xlarge</td><td>50 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>r6a.48xlarge</td><td>50 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>r6a.metal</td><td>50 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">R6g</td></tr>
  <tr><td>r6g.medium 1</td><td>0.5 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>2</td><td>4</td><td>✓ Yes</td></tr>
  <tr><td>r6g.large 1</td><td>0.75 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>r6g.xlarge 1</td><td>1.25 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>r6g.2xlarge 1</td><td>2.5 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>r6g.4xlarge 1</td><td>5.0 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>r6g.8xlarge</td><td>12 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>r6g.12xlarge</td><td>20 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>r6g.16xlarge</td><td>25 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>r6g.metal</td><td>25 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">R6gd</td></tr>
  <tr><td>r6gd.medium 1</td><td>0.5 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>2</td><td>4</td><td>✓ Yes</td></tr>
  <tr><td>r6gd.large 1</td><td>0.75 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>r6gd.xlarge 1</td><td>1.25 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>r6gd.2xlarge 1</td><td>2.5 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>r6gd.4xlarge 1</td><td>5.0 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>r6gd.8xlarge</td><td>12 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>r6gd.12xlarge</td><td>20 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>r6gd.16xlarge</td><td>25 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>r6gd.metal</td><td>25 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">R6i</td></tr>
  <tr><td>r6i.large 1</td><td>0.781 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>r6i.xlarge 1</td><td>1.562 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>r6i.2xlarge 1</td><td>3.125 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>r6i.4xlarge 1</td><td>6.25 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>r6i.8xlarge</td><td>12.5 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>r6i.12xlarge</td><td>18.75 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>r6i.16xlarge</td><td>25 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>r6i.24xlarge</td><td>37.5 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>r6i.32xlarge</td><td>50 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>r6i.metal</td><td>50 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">R6id</td></tr>
  <tr><td>r6id.large 1</td><td>0.781 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>r6id.xlarge 1</td><td>1.562 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>r6id.2xlarge 1</td><td>3.125 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>r6id.4xlarge 1</td><td>6.25 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>r6id.8xlarge</td><td>12.5 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>r6id.12xlarge</td><td>18.75 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>r6id.16xlarge</td><td>25 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>r6id.24xlarge</td><td>37.5 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>r6id.32xlarge</td><td>50 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>r6id.metal</td><td>50 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">R6idn</td></tr>
  <tr><td>r6idn.large 1</td><td>3.125 / 25.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>r6idn.xlarge 1</td><td>6.25 / 30.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>r6idn.2xlarge 1</td><td>12.5 / 40.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>r6idn.4xlarge 1</td><td>25.0 / 50.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>r6idn.8xlarge</td><td>50 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>r6idn.12xlarge</td><td>75 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>r6idn.16xlarge</td><td>100 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>r6idn.24xlarge</td><td>150 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>r6idn.32xlarge</td><td>200 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>2</td><td>16</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>r6idn.metal</td><td>200 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>2</td><td>16</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">R6in</td></tr>
  <tr><td>r6in.large 1</td><td>3.125 / 25.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>r6in.xlarge 1</td><td>6.25 / 30.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>r6in.2xlarge 1</td><td>12.5 / 40.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>r6in.4xlarge 1</td><td>25.0 / 50.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>r6in.8xlarge</td><td>50 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>r6in.12xlarge</td><td>75 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>r6in.16xlarge</td><td>100 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>r6in.24xlarge</td><td>150 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>r6in.32xlarge</td><td>200 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>2</td><td>16</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>r6in.metal</td><td>200 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>2</td><td>16</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">R7a</td></tr>
  <tr><td>r7a.medium 1</td><td>0.39 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>2</td><td>4</td><td>✓ Yes</td></tr>
  <tr><td>r7a.large 1</td><td>0.781 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>r7a.xlarge 1</td><td>1.562 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>r7a.2xlarge 1</td><td>3.125 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>r7a.4xlarge 1</td><td>6.25 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>r7a.8xlarge</td><td>12.5 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>r7a.12xlarge</td><td>18.75 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>r7a.16xlarge</td><td>25 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>r7a.24xlarge</td><td>37.5 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>r7a.32xlarge</td><td>50 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>r7a.48xlarge</td><td>50 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>r7a.metal-48xl</td><td>50 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">R7g</td></tr>
  <tr><td>r7g.medium 1</td><td>0.52 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>2</td><td>4</td><td>✓ Yes</td></tr>
  <tr><td>r7g.large 1</td><td>0.937 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>r7g.xlarge 1</td><td>1.876 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>r7g.2xlarge 1</td><td>3.75 / 15.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>r7g.4xlarge 1</td><td>7.5 / 15.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>r7g.8xlarge</td><td>15 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>r7g.12xlarge</td><td>22.5 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>r7g.16xlarge</td><td>30 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>r7g.metal</td><td>30 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">R7gd</td></tr>
  <tr><td>r7gd.medium 1</td><td>0.52 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>2</td><td>4</td><td>✓ Yes</td></tr>
  <tr><td>r7gd.large 1</td><td>0.937 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>r7gd.xlarge 1</td><td>1.876 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>r7gd.2xlarge 1</td><td>3.75 / 15.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>r7gd.4xlarge 1</td><td>7.5 / 15.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>r7gd.8xlarge</td><td>15 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>r7gd.12xlarge</td><td>22.5 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>r7gd.16xlarge</td><td>30 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>r7gd.metal</td><td>30 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">R7i</td></tr>
  <tr><td>r7i.large 1</td><td>0.781 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>r7i.xlarge 1</td><td>1.562 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>r7i.2xlarge 1</td><td>3.125 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>r7i.4xlarge 1</td><td>6.25 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>r7i.8xlarge</td><td>12.5 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>r7i.12xlarge</td><td>18.75 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>r7i.16xlarge</td><td>25 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>r7i.24xlarge</td><td>37.5 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>r7i.48xlarge</td><td>50 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>r7i.metal-24xl</td><td>37.5 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>r7i.metal-48xl</td><td>50 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">R7iz</td></tr>
  <tr><td>r7iz.large 1</td><td>0.781 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>r7iz.xlarge 1</td><td>1.562 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>r7iz.2xlarge 1</td><td>3.125 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>r7iz.4xlarge 1</td><td>6.25 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>r7iz.8xlarge</td><td>12.5 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>r7iz.12xlarge</td><td>25 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>r7iz.16xlarge</td><td>25 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>r7iz.32xlarge</td><td>50 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>r7iz.metal-16xl</td><td>25 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>r7iz.metal-32xl</td><td>50 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">R8a</td></tr>
  <tr><td>r8a.medium 1</td><td>0.52 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>2</td><td>4</td><td>✓ Yes</td></tr>
  <tr><td>r8a.large 1</td><td>0.937 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>20</td><td>✓ Yes</td></tr>
  <tr><td>r8a.xlarge 1</td><td>1.875 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>20</td><td>✓ Yes</td></tr>
  <tr><td>r8a.2xlarge 1</td><td>3.75 / 15.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>40</td><td>✓ Yes</td></tr>
  <tr><td>r8a.4xlarge 1</td><td>7.5 / 15.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>40</td><td>✓ Yes</td></tr>
  <tr><td>r8a.8xlarge</td><td>15 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>10</td><td>40</td><td>✓ Yes</td></tr>
  <tr><td>r8a.12xlarge</td><td>22.5 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>12</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>r8a.16xlarge</td><td>30 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>16</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>r8a.24xlarge</td><td>40 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>16</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>r8a.48xlarge</td><td>75 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>24</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>r8a.metal-24xl</td><td>40 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>16</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>r8a.metal-48xl</td><td>75 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>24</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">R8g</td></tr>
  <tr><td>r8g.medium 1</td><td>0.52 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>2</td><td>4</td><td>✓ Yes</td></tr>
  <tr><td>r8g.large 1</td><td>0.937 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>r8g.xlarge 1</td><td>1.875 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>r8g.2xlarge 1</td><td>3.75 / 15.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>r8g.4xlarge 1</td><td>7.5 / 15.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>r8g.8xlarge</td><td>15 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>r8g.12xlarge</td><td>22.5 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>r8g.16xlarge</td><td>30 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>r8g.24xlarge</td><td>40 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>r8g.48xlarge</td><td>50 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>r8g.metal-24xl</td><td>40 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>r8g.metal-48xl</td><td>50 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">R8gb</td></tr>
  <tr><td>r8gb.medium 1</td><td>2.083 / 16.667</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>2</td><td>4</td><td>✓ Yes</td></tr>
  <tr><td>r8gb.large 1</td><td>4.166 / 20.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>r8gb.xlarge 1</td><td>8.333 / 26.667</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>r8gb.2xlarge 1</td><td>16.666 / 33.333</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>r8gb.4xlarge</td><td>33.33 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>r8gb.8xlarge</td><td>66.66 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>10</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>r8gb.12xlarge</td><td>100 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>12</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>r8gb.16xlarge</td><td>133.33 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>16</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>r8gb.24xlarge</td><td>200 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>24</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>r8gb.48xlarge</td><td>400 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>2</td><td>24</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>r8gb.metal-24xl</td><td>200 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>24</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>r8gb.metal-48xl</td><td>400 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>2</td><td>24</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">R8gd</td></tr>
  <tr><td>r8gd.medium 1</td><td>0.52 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>2</td><td>4</td><td>✓ Yes</td></tr>
  <tr><td>r8gd.large 1</td><td>0.937 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>r8gd.xlarge 1</td><td>1.875 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>r8gd.2xlarge 1</td><td>3.75 / 15.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>r8gd.4xlarge 1</td><td>7.5 / 15.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>r8gd.8xlarge</td><td>15 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>r8gd.12xlarge</td><td>22.5 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>r8gd.16xlarge</td><td>30 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>r8gd.24xlarge</td><td>40 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>r8gd.48xlarge</td><td>50 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>r8gd.metal-24xl</td><td>40 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>r8gd.metal-48xl</td><td>50 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">R8gn</td></tr>
  <tr><td>r8gn.medium 1</td><td>3.125 / 25.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>2</td><td>4</td><td>✓ Yes</td></tr>
  <tr><td>r8gn.large 1</td><td>6.25 / 30.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>r8gn.xlarge 1</td><td>12.5 / 40.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>r8gn.2xlarge 1</td><td>25.0 / 50.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>r8gn.4xlarge</td><td>50 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>r8gn.8xlarge</td><td>100 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>10</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>r8gn.12xlarge</td><td>150 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>12</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>r8gn.16xlarge</td><td>200 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>16</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>r8gn.24xlarge</td><td>300 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>24</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>r8gn.48xlarge</td><td>600 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>2</td><td>24</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>r8gn.metal-24xl</td><td>300 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>24</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>r8gn.metal-48xl</td><td>600 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>2</td><td>24</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">R8i</td></tr>
  <tr><td>r8i.large 1</td><td>0.937 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>20</td><td>✓ Yes</td></tr>
  <tr><td>r8i.xlarge 1</td><td>1.875 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>r8i.2xlarge 1</td><td>3.75 / 15.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>r8i.4xlarge 1</td><td>7.5 / 15.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>r8i.8xlarge</td><td>15 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>10</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>r8i.12xlarge</td><td>22.5 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>12</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>r8i.16xlarge</td><td>30 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>16</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>r8i.24xlarge</td><td>40 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>16</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>r8i.32xlarge</td><td>50 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>24</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>r8i.48xlarge</td><td>75 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>24</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>r8i.96xlarge</td><td>100 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>24</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>r8i.metal-48xl</td><td>75 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>24</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>r8i.metal-96xl</td><td>100 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>24</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">R8id</td></tr>
  <tr><td>r8id.large 1</td><td>0.937 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>20</td><td>✓ Yes</td></tr>
  <tr><td>r8id.xlarge 1</td><td>1.875 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>r8id.2xlarge 1</td><td>3.75 / 15.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>r8id.4xlarge 1</td><td>7.5 / 15.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>r8id.8xlarge</td><td>15 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>10</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>r8id.12xlarge</td><td>22.5 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>12</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>r8id.16xlarge</td><td>30 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>16</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>r8id.24xlarge</td><td>40 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>16</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>r8id.32xlarge</td><td>50 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>24</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>r8id.48xlarge</td><td>75 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>24</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>r8id.96xlarge</td><td>100 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>24</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>r8id.metal-48xl</td><td>75 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>24</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>r8id.metal-96xl</td><td>100 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>24</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">R8i-flex</td></tr>
  <tr><td>r8i-flex.large 1</td><td>0.468 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>20</td><td>✓ Yes</td></tr>
  <tr><td>r8i-flex.xlarge 1</td><td>0.937 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>r8i-flex.2xlarge 1</td><td>1.875 / 15.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>r8i-flex.4xlarge 1</td><td>3.75 / 15.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>r8i-flex.8xlarge 1</td><td>7.5 / 15.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>10</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>r8i-flex.12xlarge 1</td><td>11.25 / 22.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>12</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>r8i-flex.16xlarge 1</td><td>15.0 / 30.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>16</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">R8in</td></tr>
  <tr><td>r8in.large 1</td><td>3.125 / 25.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>20</td><td>✓ Yes</td></tr>
  <tr><td>r8in.xlarge 1</td><td>6.25 / 30.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>r8in.2xlarge 1</td><td>12.5 / 40.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>r8in.4xlarge 1</td><td>25.0 / 50.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>r8in.8xlarge</td><td>50 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>r8in.12xlarge</td><td>75 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>12</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>r8in.16xlarge</td><td>100 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>16</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>r8in.24xlarge</td><td>150 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>16</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>r8in.32xlarge</td><td>200 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>16</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>r8in.48xlarge</td><td>300 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>24</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>r8in.96xlarge</td><td>600 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>2</td><td>24</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">R8idn</td></tr>
  <tr><td>r8idn.large 1</td><td>3.125 / 25.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>20</td><td>✓ Yes</td></tr>
  <tr><td>r8idn.xlarge 1</td><td>6.25 / 30.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>r8idn.2xlarge 1</td><td>12.5 / 40.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>r8idn.4xlarge 1</td><td>25.0 / 50.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>r8idn.8xlarge</td><td>50 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>r8idn.12xlarge</td><td>75 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>12</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>r8idn.16xlarge</td><td>100 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>16</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>r8idn.24xlarge</td><td>150 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>16</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>r8idn.32xlarge</td><td>200 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>16</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>r8idn.48xlarge</td><td>300 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>24</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>r8idn.96xlarge</td><td>600 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>2</td><td>24</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">R8ib</td></tr>
  <tr><td>r8ib.large 1</td><td>2.083 / 16.667</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>20</td><td>✓ Yes</td></tr>
  <tr><td>r8ib.xlarge 1</td><td>4.166 / 20.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>r8ib.2xlarge 1</td><td>8.333 / 26.667</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>r8ib.4xlarge 1</td><td>16.666 / 33.333</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>r8ib.8xlarge</td><td>33.33 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>r8ib.12xlarge</td><td>50 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>12</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>r8ib.16xlarge</td><td>66.66 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>16</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>r8ib.24xlarge</td><td>100 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>16</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>r8ib.32xlarge</td><td>133.33 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>16</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>r8ib.48xlarge</td><td>200 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>24</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>r8ib.96xlarge</td><td>400 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>2</td><td>24</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">R8idb</td></tr>
  <tr><td>r8idb.large 1</td><td>2.083 / 16.667</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>20</td><td>✓ Yes</td></tr>
  <tr><td>r8idb.xlarge 1</td><td>4.166 / 20.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>r8idb.2xlarge 1</td><td>8.333 / 26.667</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>r8idb.4xlarge 1</td><td>16.666 / 33.333</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>r8idb.8xlarge</td><td>33.33 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>r8idb.12xlarge</td><td>50 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>12</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>r8idb.16xlarge</td><td>66.66 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>16</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>r8idb.24xlarge</td><td>100 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>16</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>r8idb.32xlarge</td><td>133.33 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>16</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>r8idb.48xlarge</td><td>200 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>24</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>r8idb.96xlarge</td><td>400 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>2</td><td>24</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">U-3tb1</td></tr>
  <tr><td>u-3tb1.56xlarge</td><td>50 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">U-6tb1</td></tr>
  <tr><td>u-6tb1.56xlarge</td><td>100 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>u-6tb1.112xlarge</td><td>100 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>u-6tb1.metal</td><td>100</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>5</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">U-9tb1</td></tr>
  <tr><td>u-9tb1.112xlarge</td><td>100 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>u-9tb1.metal</td><td>100</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>5</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">U-12tb1</td></tr>
  <tr><td>u-12tb1.112xlarge</td><td>100 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>u-12tb1.metal</td><td>100</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>5</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">U-18tb1</td></tr>
  <tr><td>u-18tb1.112xlarge</td><td>100 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>u-18tb1.metal</td><td>100 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">U-24tb1</td></tr>
  <tr><td>u-24tb1.112xlarge</td><td>100 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>u-24tb1.metal</td><td>100 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">U7i-6tb</td></tr>
  <tr><td>u7i-6tb.112xlarge</td><td>100 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">U7i-8tb</td></tr>
  <tr><td>u7i-8tb.112xlarge</td><td>100 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">U7i-12tb</td></tr>
  <tr><td>u7i-12tb.224xlarge</td><td>100 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">U7in-16tb</td></tr>
  <tr><td>u7in-16tb.224xlarge</td><td>200 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>2</td><td>16</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">U7in-24tb</td></tr>
  <tr><td>u7in-24tb.224xlarge</td><td>200 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>2</td><td>16</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">U7in-32tb</td></tr>
  <tr><td>u7in-32tb.224xlarge</td><td>200 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>2</td><td>16</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">U7inh-32tb</td></tr>
  <tr><td>u7inh-32tb.480xlarge</td><td>200 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>2</td><td>16</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">X1</td></tr>
  <tr><td>x1.16xlarge</td><td>10 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>x1.32xlarge</td><td>25 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">X1e</td></tr>
  <tr><td>x1e.xlarge 1</td><td>0.625 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>x1e.2xlarge 1</td><td>1.25 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>x1e.4xlarge 1</td><td>2.5 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>x1e.8xlarge 1</td><td>5.0 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>x1e.16xlarge</td><td>10 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>x1e.32xlarge</td><td>25 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">X2gd</td></tr>
  <tr><td>x2gd.medium 1</td><td>0.5 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>2</td><td>4</td><td>✓ Yes</td></tr>
  <tr><td>x2gd.large 1</td><td>0.75 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>x2gd.xlarge 1</td><td>1.25 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>x2gd.2xlarge 1</td><td>2.5 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>x2gd.4xlarge 1</td><td>5.0 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>x2gd.8xlarge</td><td>12 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>x2gd.12xlarge</td><td>20 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>x2gd.16xlarge</td><td>25 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>x2gd.metal</td><td>25 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">X2idn</td></tr>
  <tr><td>x2idn.16xlarge</td><td>50 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>x2idn.24xlarge</td><td>75 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>x2idn.32xlarge</td><td>100 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>x2idn.metal</td><td>100 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">X2iedn</td></tr>
  <tr><td>x2iedn.xlarge 1</td><td>1.875 / 25.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>x2iedn.2xlarge 1</td><td>5.0 / 25.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>x2iedn.4xlarge 1</td><td>12.5 / 25.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>x2iedn.8xlarge</td><td>25 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>x2iedn.16xlarge</td><td>50 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>x2iedn.24xlarge</td><td>75 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>x2iedn.32xlarge</td><td>100 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>x2iedn.metal</td><td>100 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">X2iezn</td></tr>
  <tr><td>x2iezn.2xlarge 1</td><td>12.5 / 25.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>x2iezn.4xlarge 1</td><td>15.0 / 25.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>x2iezn.6xlarge</td><td>50 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>x2iezn.8xlarge</td><td>75 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>x2iezn.12xlarge</td><td>100 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>x2iezn.metal</td><td>100 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">X8g</td></tr>
  <tr><td>x8g.medium 1</td><td>0.52 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>2</td><td>4</td><td>✓ Yes</td></tr>
  <tr><td>x8g.large 1</td><td>0.937 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>x8g.xlarge 1</td><td>1.875 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>x8g.2xlarge 1</td><td>3.75 / 15.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>x8g.4xlarge 1</td><td>7.5 / 15.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>x8g.8xlarge</td><td>15 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>x8g.12xlarge</td><td>22.5 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>x8g.16xlarge</td><td>30 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>x8g.24xlarge</td><td>40 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>x8g.48xlarge</td><td>50 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>x8g.metal-24xl</td><td>40 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>x8g.metal-48xl</td><td>50 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">X8aedz</td></tr>
  <tr><td>x8aedz.large 1</td><td>1.562 / 18.75</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>20</td><td>✓ Yes</td></tr>
  <tr><td>x8aedz.xlarge 1</td><td>3.125 / 18.75</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>20</td><td>✓ Yes</td></tr>
  <tr><td>x8aedz.3xlarge 1</td><td>9.375 / 18.75</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>40</td><td>✓ Yes</td></tr>
  <tr><td>x8aedz.6xlarge</td><td>18.75 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>40</td><td>✓ Yes</td></tr>
  <tr><td>x8aedz.12xlarge</td><td>37.5 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>16</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>x8aedz.24xlarge</td><td>75 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>16</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>x8aedz.metal-12xl</td><td>37.5 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>16</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>x8aedz.metal-24xl</td><td>75 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>16</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">X8i</td></tr>
  <tr><td>x8i.large 1</td><td>0.937 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>20</td><td>✓ Yes</td></tr>
  <tr><td>x8i.xlarge 1</td><td>1.875 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>x8i.2xlarge 1</td><td>3.75 / 15.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>x8i.4xlarge 1</td><td>7.5 / 15.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>x8i.8xlarge</td><td>15 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>10</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>x8i.12xlarge</td><td>22.5 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>12</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>x8i.16xlarge</td><td>30 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>16</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>x8i.24xlarge</td><td>40 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>16</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>x8i.32xlarge</td><td>50 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>24</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>x8i.48xlarge</td><td>75 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>24</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>x8i.64xlarge</td><td>80 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>24</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>x8i.96xlarge</td><td>100 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>24</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>x8i.metal-48xl</td><td>75 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>24</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>x8i.metal-96xl</td><td>100 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>24</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">z1d</td></tr>
  <tr><td>z1d.large 1</td><td>0.75 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>z1d.xlarge 1</td><td>1.25 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>z1d.2xlarge 1</td><td>2.5 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>z1d.3xlarge 1</td><td>5.0 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>z1d.6xlarge</td><td>12 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>z1d.12xlarge</td><td>25 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>z1d.metal</td><td>25 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
</tbody>
</table>


**Note**  
1 These instances have a baseline bandwidth and can use a network I/O credit mechanism to burst beyond their baseline bandwidth on a best effort basis. Other instances types can sustain their maximum performance indefinitely. For more information, see [ instance network bandwidth](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-instance-network-bandwidth.html).  
For `r6in.32xlarge`, `r6in.metal`, `r6idn.32xlarge`, `r6idn.metal`, you must attach at least 2 ENIs, to separate network cards, to achieve 200 Gbps throughput. Each ENI attached to a network card can achieve up to 170 Gbps.  
For `u7in-16tb.224xlarge`, `u7in-24tb.224xlarge`, `u7in-32tb.224xlarge`, `u7inh-32tb.480xlarge`, you must attach at least 2 ENIs, to separate network cards, to achieve 200 Gbps throughput. Each ENI attached to a network card can achieve up to 100 Gbps.  
For `r8in.96xlarge`, `r8idn.96xlarge`, `r8gn.48xlarge`, `r8gn.metal-48xl`, you must attach at least 2 ENIs, to separate network cards, to achieve 600 Gbps throughput. Each ENI attached to a network card can achieve up to 300 Gbps.  
For `r8ib.96xlarge`, `r8idb.96xlarge`, `r8gb.48xlarge`, `r8gb.metal-48xl`, you must attach at least 2 ENIs, to separate network cards, to achieve 400 Gbps throughput. Each ENI attached to a network card can achieve up to 200 Gbps.

## Amazon EBS specifications
<a name="mo_storage-ebs"></a>

The following table indicates which instance types are Amazon EBS optimized by default and which optionally support it. It also describes their EBS-optimized performance, including dedicated bandwidth to Amazon EBS, the typical maximum aggregate throughput that can be achieved on that dedicated connection with a streaming read workload and 128 KiB I/O size, and the maximum IOPS the instance type can support when using a 16 KiB I/O size. Instance types not listed do not support Amazon EBS optimization.

**Important**  
An instance's EBS performance is bounded by the instance's performance limits, or the aggregated performance of its attached volumes, whichever is smaller. To achieve maximum EBS performance, an instance must have attached volumes that provide a combined performance equal to or greater than the maximum instance performance. For example, to achieve `80,000` IOPS for `r6i.16xlarge`, the instance must have at least `5` `gp3` volumes provisioned with `16,000` IOPS each (`5` volumes x `16,000` IOPS = `80,000` IOPS).  
We recommend that you choose an EBS–optimized instance type that provides more dedicated Amazon EBS throughput than your application needs; otherwise, the connection between Amazon EBS and Amazon EC2 can become a performance bottleneck.

**Note**  
R8a, R8g, R8gd, R8i, R8id, R8i-flex, X8g, X8aedz, X8i virtualized instance types support configurable bandwidth weightings. With these instance types, you can optimize an instance's bandwidth for either networking performance or Amazon EBS performance. The following table shows the default networking bandwidth performance for these instance types. Bare metal instance types are not supported. For the supported configurable weightings, see [ Configurable bandwidth weighting preferences](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/configure-bandwidth-weighting.html).
For maximum IOPS performance with U7i instances, we recommend that you use io2 BlockExpress volumes.


<table>
<thead>
  <tr><th>Instance type</th><th>Baseline / Maximum bandwidth (Mbps)</th><th>Baseline / Maximum throughput (MB/s, 128 KiB I/O)</th><th>Baseline / Maximum IOPS (16 KiB I/O)</th><th>NVMe</th><th>Multiple EBS cards</th><th>EBS volume limit</th></tr>
</thead>
<tbody>
  <tr><td colspan="7">R5</td></tr>
  <tr><td>r5.large 1</td><td>650.00 / 4750.00</td><td>81.25 / 593.75</td><td>3600.00 / 18750.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r5.xlarge 1</td><td>1150.00 / 4750.00</td><td>143.75 / 593.75</td><td>6000.00 / 18750.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r5.2xlarge 1</td><td>2300.00 / 4750.00</td><td>287.50 / 593.75</td><td>12000.00 / 18750.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r5.4xlarge</td><td>4750.00</td><td>593.75</td><td>18750.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r5.8xlarge</td><td>6800.00</td><td>850.00</td><td>30000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r5.12xlarge</td><td>9500.00</td><td>1187.50</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r5.16xlarge</td><td>13600.00</td><td>1700.00</td><td>60000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r5.24xlarge</td><td>19000.00</td><td>2375.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r5.metal</td><td>19000.00</td><td>2375.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 31 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td colspan="7">R5a</td></tr>
  <tr><td>r5a.large 1</td><td>650.00 / 2880.00</td><td>81.25 / 360.00</td><td>3600.00 / 16000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r5a.xlarge 1</td><td>1085.00 / 2880.00</td><td>135.62 / 360.00</td><td>6000.00 / 16000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r5a.2xlarge 1</td><td>1580.00 / 2880.00</td><td>197.50 / 360.00</td><td>8333.00 / 16000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r5a.4xlarge</td><td>2880.00</td><td>360.00</td><td>16000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r5a.8xlarge</td><td>4750.00</td><td>593.75</td><td>20000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r5a.12xlarge</td><td>6780.00</td><td>847.50</td><td>30000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r5a.16xlarge</td><td>9500.00</td><td>1187.50</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r5a.24xlarge</td><td>13570.00</td><td>1696.25</td><td>60000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td colspan="7">R5ad</td></tr>
  <tr><td>r5ad.large 1</td><td>650.00 / 2880.00</td><td>81.25 / 360.00</td><td>3600.00 / 16000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r5ad.xlarge 1</td><td>1085.00 / 2880.00</td><td>135.62 / 360.00</td><td>6000.00 / 16000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r5ad.2xlarge 1</td><td>1580.00 / 2880.00</td><td>197.50 / 360.00</td><td>8333.00 / 16000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r5ad.4xlarge</td><td>2880.00</td><td>360.00</td><td>16000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 25 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r5ad.8xlarge</td><td>4750.00</td><td>593.75</td><td>20000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 25 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r5ad.12xlarge</td><td>6780.00</td><td>847.50</td><td>30000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 25 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r5ad.16xlarge</td><td>9500.00</td><td>1187.50</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 23 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r5ad.24xlarge</td><td>13570.00</td><td>1696.25</td><td>60000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 23 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td colspan="7">R5b</td></tr>
  <tr><td>r5b.large 1</td><td>1250.00 / 10000.00</td><td>156.25 / 1250.00</td><td>5417.00 / 43333.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r5b.xlarge 1</td><td>2500.00 / 10000.00</td><td>312.50 / 1250.00</td><td>10833.00 / 43333.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r5b.2xlarge 1</td><td>5000.00 / 10000.00</td><td>625.00 / 1250.00</td><td>21667.00 / 43333.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r5b.4xlarge</td><td>10000.00</td><td>1250.00</td><td>43333.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r5b.8xlarge</td><td>20000.00</td><td>2500.00</td><td>86667.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r5b.12xlarge</td><td>30000.00</td><td>3750.00</td><td>130000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r5b.16xlarge</td><td>40000.00</td><td>5000.00</td><td>173333.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r5b.24xlarge</td><td>60000.00</td><td>7500.00</td><td>260000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r5b.metal</td><td>60000.00</td><td>7500.00</td><td>260000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 31 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td colspan="7">R5d</td></tr>
  <tr><td>r5d.large 1</td><td>650.00 / 4750.00</td><td>81.25 / 593.75</td><td>3600.00 / 18750.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r5d.xlarge 1</td><td>1150.00 / 4750.00</td><td>143.75 / 593.75</td><td>6000.00 / 18750.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r5d.2xlarge 1</td><td>2300.00 / 4750.00</td><td>287.50 / 593.75</td><td>12000.00 / 18750.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r5d.4xlarge</td><td>4750.00</td><td>593.75</td><td>18750.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 25 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r5d.8xlarge</td><td>6800.00</td><td>850.00</td><td>30000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 25 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r5d.12xlarge</td><td>9500.00</td><td>1187.50</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 25 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r5d.16xlarge</td><td>13600.00</td><td>1700.00</td><td>60000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 23 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r5d.24xlarge</td><td>19000.00</td><td>2375.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 23 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r5d.metal</td><td>19000.00</td><td>2375.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 31 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td colspan="7">R5dn</td></tr>
  <tr><td>r5dn.large 1</td><td>650.00 / 4750.00</td><td>81.25 / 593.75</td><td>3600.00 / 18750.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r5dn.xlarge 1</td><td>1150.00 / 4750.00</td><td>143.75 / 593.75</td><td>6000.00 / 18750.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r5dn.2xlarge 1</td><td>2300.00 / 4750.00</td><td>287.50 / 593.75</td><td>12000.00 / 18750.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r5dn.4xlarge</td><td>4750.00</td><td>593.75</td><td>18750.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 25 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r5dn.8xlarge</td><td>6800.00</td><td>850.00</td><td>30000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 25 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r5dn.12xlarge</td><td>9500.00</td><td>1187.50</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 25 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r5dn.16xlarge</td><td>13600.00</td><td>1700.00</td><td>60000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 23 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r5dn.24xlarge</td><td>19000.00</td><td>2375.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 23 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r5dn.metal</td><td>19000.00</td><td>2375.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 31 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td colspan="7">R5n</td></tr>
  <tr><td>r5n.large 1</td><td>650.00 / 4750.00</td><td>81.25 / 593.75</td><td>3600.00 / 18750.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r5n.xlarge 1</td><td>1150.00 / 4750.00</td><td>143.75 / 593.75</td><td>6000.00 / 18750.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r5n.2xlarge 1</td><td>2300.00 / 4750.00</td><td>287.50 / 593.75</td><td>12000.00 / 18750.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r5n.4xlarge</td><td>4750.00</td><td>593.75</td><td>18750.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r5n.8xlarge</td><td>6800.00</td><td>850.00</td><td>30000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r5n.12xlarge</td><td>9500.00</td><td>1187.50</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r5n.16xlarge</td><td>13600.00</td><td>1700.00</td><td>60000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r5n.24xlarge</td><td>19000.00</td><td>2375.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r5n.metal</td><td>19000.00</td><td>2375.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 31 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td colspan="7">R6a</td></tr>
  <tr><td>r6a.large 1</td><td>650.00 / 10000.00</td><td>81.25 / 1250.00</td><td>3600.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r6a.xlarge 1</td><td>1250.00 / 10000.00</td><td>156.25 / 1250.00</td><td>6000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r6a.2xlarge 1</td><td>2500.00 / 10000.00</td><td>312.50 / 1250.00</td><td>12000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r6a.4xlarge 1</td><td>5000.00 / 10000.00</td><td>625.00 / 1250.00</td><td>20000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r6a.8xlarge</td><td>10000.00</td><td>1250.00</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r6a.12xlarge</td><td>15000.00</td><td>1875.00</td><td>60000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r6a.16xlarge</td><td>20000.00</td><td>2500.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r6a.24xlarge</td><td>30000.00</td><td>3750.00</td><td>120000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r6a.32xlarge</td><td>40000.00</td><td>5000.00</td><td>160000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r6a.48xlarge</td><td>40000.00</td><td>5000.00</td><td>240000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r6a.metal</td><td>40000.00</td><td>5000.00</td><td>240000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 31 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td colspan="7">R6g</td></tr>
  <tr><td>r6g.medium 1</td><td>315.00 / 4750.00</td><td>39.38 / 593.75</td><td>2500.00 / 20000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r6g.large 1</td><td>630.00 / 4750.00</td><td>78.75 / 593.75</td><td>3600.00 / 20000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r6g.xlarge 1</td><td>1188.00 / 4750.00</td><td>148.50 / 593.75</td><td>6000.00 / 20000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r6g.2xlarge 1</td><td>2375.00 / 4750.00</td><td>296.88 / 593.75</td><td>12000.00 / 20000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r6g.4xlarge</td><td>4750.00</td><td>593.75</td><td>20000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r6g.8xlarge</td><td>9500.00</td><td>1187.50</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r6g.12xlarge</td><td>14250.00</td><td>1781.25</td><td>50000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r6g.16xlarge</td><td>19000.00</td><td>2375.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r6g.metal</td><td>19000.00</td><td>2375.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 31 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td colspan="7">R6gd</td></tr>
  <tr><td>r6gd.medium 1</td><td>315.00 / 4750.00</td><td>39.38 / 593.75</td><td>2500.00 / 20000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r6gd.large 1</td><td>630.00 / 4750.00</td><td>78.75 / 593.75</td><td>3600.00 / 20000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r6gd.xlarge 1</td><td>1188.00 / 4750.00</td><td>148.50 / 593.75</td><td>6000.00 / 20000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r6gd.2xlarge 1</td><td>2375.00 / 4750.00</td><td>296.88 / 593.75</td><td>12000.00 / 20000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r6gd.4xlarge</td><td>4750.00</td><td>593.75</td><td>20000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r6gd.8xlarge</td><td>9500.00</td><td>1187.50</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r6gd.12xlarge</td><td>14250.00</td><td>1781.25</td><td>50000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 25 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r6gd.16xlarge</td><td>19000.00</td><td>2375.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 25 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r6gd.metal</td><td>19000.00</td><td>2375.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 31 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td colspan="7">R6i</td></tr>
  <tr><td>r6i.large 1</td><td>650.00 / 10000.00</td><td>81.25 / 1250.00</td><td>3600.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r6i.xlarge 1</td><td>1250.00 / 10000.00</td><td>156.25 / 1250.00</td><td>6000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r6i.2xlarge 1</td><td>2500.00 / 10000.00</td><td>312.50 / 1250.00</td><td>12000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r6i.4xlarge 1</td><td>5000.00 / 10000.00</td><td>625.00 / 1250.00</td><td>20000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r6i.8xlarge</td><td>10000.00</td><td>1250.00</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r6i.12xlarge</td><td>15000.00</td><td>1875.00</td><td>60000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r6i.16xlarge</td><td>20000.00</td><td>2500.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r6i.24xlarge</td><td>30000.00</td><td>3750.00</td><td>120000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r6i.32xlarge</td><td>40000.00</td><td>5000.00</td><td>160000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r6i.metal</td><td>40000.00</td><td>5000.00</td><td>160000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 31 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td colspan="7">R6id</td></tr>
  <tr><td>r6id.large 1</td><td>650.00 / 10000.00</td><td>81.25 / 1250.00</td><td>3600.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r6id.xlarge 1</td><td>1250.00 / 10000.00</td><td>156.25 / 1250.00</td><td>6000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r6id.2xlarge 1</td><td>2500.00 / 10000.00</td><td>312.50 / 1250.00</td><td>12000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r6id.4xlarge 1</td><td>5000.00 / 10000.00</td><td>625.00 / 1250.00</td><td>20000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r6id.8xlarge</td><td>10000.00</td><td>1250.00</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r6id.12xlarge</td><td>15000.00</td><td>1875.00</td><td>60000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 25 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r6id.16xlarge</td><td>20000.00</td><td>2500.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 25 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r6id.24xlarge</td><td>30000.00</td><td>3750.00</td><td>120000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 23 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r6id.32xlarge</td><td>40000.00</td><td>5000.00</td><td>160000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 23 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r6id.metal</td><td>40000.00</td><td>5000.00</td><td>160000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 31 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td colspan="7">R6idn</td></tr>
  <tr><td>r6idn.large 1</td><td>1562.00 / 25000.00</td><td>195.31 / 3125.00</td><td>6250.00 / 100000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r6idn.xlarge 1</td><td>3125.00 / 25000.00</td><td>390.62 / 3125.00</td><td>12500.00 / 100000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r6idn.2xlarge 1</td><td>6250.00 / 25000.00</td><td>781.25 / 3125.00</td><td>25000.00 / 100000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r6idn.4xlarge 1</td><td>12500.00 / 25000.00</td><td>1562.50 / 3125.00</td><td>50000.00 / 100000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r6idn.8xlarge</td><td>25000.00</td><td>3125.00</td><td>100000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r6idn.12xlarge</td><td>37500.00</td><td>4687.50</td><td>150000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 25 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r6idn.16xlarge</td><td>50000.00</td><td>6250.00</td><td>200000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 25 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r6idn.24xlarge</td><td>75000.00</td><td>9375.00</td><td>300000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 23 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r6idn.32xlarge</td><td>100000.00</td><td>12500.00</td><td>400000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 23 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r6idn.metal</td><td>100000.00</td><td>12500.00</td><td>400000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 31 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td colspan="7">R6in</td></tr>
  <tr><td>r6in.large 1</td><td>1562.00 / 25000.00</td><td>195.31 / 3125.00</td><td>6250.00 / 100000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r6in.xlarge 1</td><td>3125.00 / 25000.00</td><td>390.62 / 3125.00</td><td>12500.00 / 100000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r6in.2xlarge 1</td><td>6250.00 / 25000.00</td><td>781.25 / 3125.00</td><td>25000.00 / 100000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r6in.4xlarge 1</td><td>12500.00 / 25000.00</td><td>1562.50 / 3125.00</td><td>50000.00 / 100000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r6in.8xlarge</td><td>25000.00</td><td>3125.00</td><td>100000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r6in.12xlarge</td><td>37500.00</td><td>4687.50</td><td>150000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r6in.16xlarge</td><td>50000.00</td><td>6250.00</td><td>200000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r6in.24xlarge</td><td>75000.00</td><td>9375.00</td><td>300000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r6in.32xlarge</td><td>100000.00</td><td>12500.00</td><td>400000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r6in.metal</td><td>100000.00</td><td>12500.00</td><td>400000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 31 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td colspan="7">R7a</td></tr>
  <tr><td>r7a.medium 1</td><td>325.00 / 10000.00</td><td>40.62 / 1250.00</td><td>2500.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r7a.large 1</td><td>650.00 / 10000.00</td><td>81.25 / 1250.00</td><td>3600.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r7a.xlarge 1</td><td>1250.00 / 10000.00</td><td>156.25 / 1250.00</td><td>6000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r7a.2xlarge 1</td><td>2500.00 / 10000.00</td><td>312.50 / 1250.00</td><td>12000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r7a.4xlarge 1</td><td>5000.00 / 10000.00</td><td>625.00 / 1250.00</td><td>20000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r7a.8xlarge</td><td>10000.00</td><td>1250.00</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r7a.12xlarge</td><td>15000.00</td><td>1875.00</td><td>60000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r7a.16xlarge</td><td>20000.00</td><td>2500.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>48 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r7a.24xlarge</td><td>30000.00</td><td>3750.00</td><td>120000.00</td><td>✓ Yes</td><td>✗ No</td><td>64 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r7a.32xlarge</td><td>40000.00</td><td>5000.00</td><td>160000.00</td><td>✓ Yes</td><td>✗ No</td><td>88 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r7a.48xlarge</td><td>40000.00</td><td>5000.00</td><td>240000.00</td><td>✓ Yes</td><td>✗ No</td><td>128 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r7a.metal-48xl</td><td>40000.00</td><td>5000.00</td><td>240000.00</td><td>✓ Yes</td><td>✗ No</td><td>79 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td colspan="7">R7g</td></tr>
  <tr><td>r7g.medium 1</td><td>315.00 / 10000.00</td><td>39.38 / 1250.00</td><td>2500.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r7g.large 1</td><td>630.00 / 10000.00</td><td>78.75 / 1250.00</td><td>3600.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r7g.xlarge 1</td><td>1250.00 / 10000.00</td><td>156.25 / 1250.00</td><td>6000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r7g.2xlarge 1</td><td>2500.00 / 10000.00</td><td>312.50 / 1250.00</td><td>12000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r7g.4xlarge 1</td><td>5000.00 / 10000.00</td><td>625.00 / 1250.00</td><td>20000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r7g.8xlarge</td><td>10000.00</td><td>1250.00</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r7g.12xlarge</td><td>15000.00</td><td>1875.00</td><td>60000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r7g.16xlarge</td><td>20000.00</td><td>2500.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r7g.metal</td><td>20000.00</td><td>2500.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 31 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td colspan="7">R7gd</td></tr>
  <tr><td>r7gd.medium 1</td><td>315.00 / 10000.00</td><td>39.38 / 1250.00</td><td>2500.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r7gd.large 1</td><td>630.00 / 10000.00</td><td>78.75 / 1250.00</td><td>3600.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r7gd.xlarge 1</td><td>1250.00 / 10000.00</td><td>156.25 / 1250.00</td><td>6000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r7gd.2xlarge 1</td><td>2500.00 / 10000.00</td><td>312.50 / 1250.00</td><td>12000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r7gd.4xlarge 1</td><td>5000.00 / 10000.00</td><td>625.00 / 1250.00</td><td>20000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r7gd.8xlarge</td><td>10000.00</td><td>1250.00</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r7gd.12xlarge</td><td>15000.00</td><td>1875.00</td><td>60000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 25 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r7gd.16xlarge</td><td>20000.00</td><td>2500.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 25 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>r7gd.metal</td><td>20000.00</td><td>2500.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 31 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td colspan="7">R7i</td></tr>
  <tr><td>r7i.large 1</td><td>650.00 / 10000.00</td><td>81.25 / 1250.00</td><td>3600.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r7i.xlarge 1</td><td>1250.00 / 10000.00</td><td>156.25 / 1250.00</td><td>6000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r7i.2xlarge 1</td><td>2500.00 / 10000.00</td><td>312.50 / 1250.00</td><td>12000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r7i.4xlarge 1</td><td>5000.00 / 10000.00</td><td>625.00 / 1250.00</td><td>20000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r7i.8xlarge</td><td>10000.00</td><td>1250.00</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r7i.12xlarge</td><td>15000.00</td><td>1875.00</td><td>60000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r7i.16xlarge</td><td>20000.00</td><td>2500.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>48 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r7i.24xlarge</td><td>30000.00</td><td>3750.00</td><td>120000.00</td><td>✓ Yes</td><td>✗ No</td><td>64 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r7i.48xlarge</td><td>40000.00</td><td>5000.00</td><td>240000.00</td><td>✓ Yes</td><td>✗ No</td><td>128 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r7i.metal-24xl</td><td>30000.00</td><td>3750.00</td><td>120000.00</td><td>✓ Yes</td><td>✗ No</td><td>39 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r7i.metal-48xl</td><td>40000.00</td><td>5000.00</td><td>240000.00</td><td>✓ Yes</td><td>✗ No</td><td>79 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td colspan="7">R7iz</td></tr>
  <tr><td>r7iz.large 1</td><td>792.00 / 10000.00</td><td>99.00 / 1250.00</td><td>3600.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r7iz.xlarge 1</td><td>1584.00 / 10000.00</td><td>198.00 / 1250.00</td><td>6667.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r7iz.2xlarge 1</td><td>3168.00 / 10000.00</td><td>396.00 / 1250.00</td><td>13333.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r7iz.4xlarge 1</td><td>5000.00 / 10000.00</td><td>625.00 / 1250.00</td><td>20000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r7iz.8xlarge</td><td>10000.00</td><td>1250.00</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r7iz.12xlarge</td><td>19000.00</td><td>2375.00</td><td>76000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r7iz.16xlarge</td><td>20000.00</td><td>2500.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>48 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r7iz.32xlarge</td><td>40000.00</td><td>5000.00</td><td>160000.00</td><td>✓ Yes</td><td>✗ No</td><td>88 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r7iz.metal-16xl</td><td>20000.00</td><td>2500.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>39 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r7iz.metal-32xl</td><td>40000.00</td><td>5000.00</td><td>160000.00</td><td>✓ Yes</td><td>✗ No</td><td>79 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td colspan="7">R8a</td></tr>
  <tr><td>r8a.medium 1</td><td>325.00 / 10000.00</td><td>40.62 / 1250.00</td><td>2500.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8a.large 1</td><td>650.00 / 10000.00</td><td>81.25 / 1250.00</td><td>3600.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8a.xlarge 1</td><td>1250.00 / 10000.00</td><td>156.25 / 1250.00</td><td>6000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8a.2xlarge 1</td><td>2500.00 / 10000.00</td><td>312.50 / 1250.00</td><td>12000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8a.4xlarge 1</td><td>5000.00 / 10000.00</td><td>625.00 / 1250.00</td><td>20000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8a.8xlarge</td><td>10000.00</td><td>1250.00</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8a.12xlarge</td><td>15000.00</td><td>1875.00</td><td>60000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8a.16xlarge</td><td>20000.00</td><td>2500.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>48 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8a.24xlarge</td><td>30000.00</td><td>3750.00</td><td>120000.00</td><td>✓ Yes</td><td>✗ No</td><td>64 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8a.48xlarge</td><td>60000.00</td><td>7500.00</td><td>240000.00</td><td>✓ Yes</td><td>✗ No</td><td>128 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8a.metal-24xl</td><td>30000.00</td><td>3750.00</td><td>120000.00</td><td>✓ Yes</td><td>✗ No</td><td>64 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8a.metal-48xl</td><td>60000.00</td><td>7500.00</td><td>240000.00</td><td>✓ Yes</td><td>✗ No</td><td>79 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td colspan="7">R8g</td></tr>
  <tr><td>r8g.medium 1</td><td>315.00 / 10000.00</td><td>39.38 / 1250.00</td><td>2500.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8g.large 1</td><td>630.00 / 10000.00</td><td>78.75 / 1250.00</td><td>3600.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8g.xlarge 1</td><td>1250.00 / 10000.00</td><td>156.25 / 1250.00</td><td>6000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8g.2xlarge 1</td><td>2500.00 / 10000.00</td><td>312.50 / 1250.00</td><td>12000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8g.4xlarge 1</td><td>5000.00 / 10000.00</td><td>625.00 / 1250.00</td><td>20000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8g.8xlarge</td><td>10000.00</td><td>1250.00</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8g.12xlarge</td><td>15000.00</td><td>1875.00</td><td>60000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8g.16xlarge</td><td>20000.00</td><td>2500.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>48 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8g.24xlarge</td><td>30000.00</td><td>3750.00</td><td>120000.00</td><td>✓ Yes</td><td>✗ No</td><td>64 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8g.48xlarge</td><td>40000.00</td><td>5000.00</td><td>240000.00</td><td>✓ Yes</td><td>✗ No</td><td>128 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8g.metal-24xl</td><td>30000.00</td><td>3750.00</td><td>120000.00</td><td>✓ Yes</td><td>✗ No</td><td>39 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8g.metal-48xl</td><td>40000.00</td><td>5000.00</td><td>240000.00</td><td>✓ Yes</td><td>✗ No</td><td>79 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td colspan="7">R8gb</td></tr>
  <tr><td>r8gb.medium 1</td><td>1562.00 / 25000.00</td><td>195.31 / 3125.00</td><td>7500.00 / 120000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8gb.large 1</td><td>3125.00 / 25000.00</td><td>390.62 / 3125.00</td><td>15000.00 / 120000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8gb.xlarge 1</td><td>6250.00 / 25000.00</td><td>781.25 / 3125.00</td><td>30000.00 / 120000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8gb.2xlarge 1</td><td>12500.00 / 25000.00</td><td>1562.50 / 3125.00</td><td>60000.00 / 120000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8gb.4xlarge</td><td>25000.00</td><td>3125.00</td><td>120000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8gb.8xlarge</td><td>50000.00</td><td>6250.00</td><td>240000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8gb.12xlarge</td><td>75000.00</td><td>9375.00</td><td>360000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8gb.16xlarge</td><td>100000.00</td><td>12500.00</td><td>480000.00</td><td>✓ Yes</td><td>✗ No</td><td>48 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8gb.24xlarge</td><td>150000.00</td><td>18750.00</td><td>720000.00</td><td>✓ Yes</td><td>✗ No</td><td>64 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8gb.48xlarge</td><td>300000.00</td><td>37500.00</td><td>1440000.00</td><td>✓ Yes</td><td>✓ Yes ([2 EBS cards](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ebs_cards.html))</td><td>128 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8gb.metal-24xl</td><td>150000.00</td><td>18750.00</td><td>720000.00</td><td>✓ Yes</td><td>✗ No</td><td>39 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8gb.metal-48xl</td><td>300000.00</td><td>37500.00</td><td>1440000.00</td><td>✓ Yes</td><td>✓ Yes ([2 EBS cards](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ebs_cards.html))</td><td>78 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td colspan="7">R8gd</td></tr>
  <tr><td>r8gd.medium 1</td><td>315.00 / 10000.00</td><td>39.38 / 1250.00</td><td>2500.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8gd.large 1</td><td>630.00 / 10000.00</td><td>78.75 / 1250.00</td><td>3600.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8gd.xlarge 1</td><td>1250.00 / 10000.00</td><td>156.25 / 1250.00</td><td>6000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8gd.2xlarge 1</td><td>2500.00 / 10000.00</td><td>312.50 / 1250.00</td><td>12000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8gd.4xlarge 1</td><td>5000.00 / 10000.00</td><td>625.00 / 1250.00</td><td>20000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8gd.8xlarge</td><td>10000.00</td><td>1250.00</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8gd.12xlarge</td><td>15000.00</td><td>1875.00</td><td>60000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8gd.16xlarge</td><td>20000.00</td><td>2500.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>48 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8gd.24xlarge</td><td>30000.00</td><td>3750.00</td><td>120000.00</td><td>✓ Yes</td><td>✗ No</td><td>64 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8gd.48xlarge</td><td>40000.00</td><td>5000.00</td><td>240000.00</td><td>✓ Yes</td><td>✗ No</td><td>128 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8gd.metal-24xl</td><td>30000.00</td><td>3750.00</td><td>120000.00</td><td>✓ Yes</td><td>✗ No</td><td>39 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8gd.metal-48xl</td><td>40000.00</td><td>5000.00</td><td>240000.00</td><td>✓ Yes</td><td>✗ No</td><td>79 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td colspan="7">R8gn</td></tr>
  <tr><td>r8gn.medium 1</td><td>760.00 / 10000.00</td><td>95.00 / 1250.00</td><td>2500.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8gn.large 1</td><td>1250.00 / 10000.00</td><td>156.25 / 1250.00</td><td>5000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8gn.xlarge 1</td><td>2500.00 / 10000.00</td><td>312.50 / 1250.00</td><td>10000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8gn.2xlarge 1</td><td>5000.00 / 10000.00</td><td>625.00 / 1250.00</td><td>20000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8gn.4xlarge</td><td>10000.00</td><td>1250.00</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8gn.8xlarge</td><td>20000.00</td><td>2500.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8gn.12xlarge</td><td>30000.00</td><td>3750.00</td><td>120000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8gn.16xlarge</td><td>40000.00</td><td>5000.00</td><td>160000.00</td><td>✓ Yes</td><td>✗ No</td><td>48 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8gn.24xlarge</td><td>60000.00</td><td>7500.00</td><td>240000.00</td><td>✓ Yes</td><td>✗ No</td><td>64 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8gn.48xlarge</td><td>120000.00</td><td>15000.00</td><td>480000.00</td><td>✓ Yes</td><td>✓ Yes ([2 EBS cards](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ebs_cards.html))</td><td>128 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8gn.metal-24xl</td><td>60000.00</td><td>7500.00</td><td>240000.00</td><td>✓ Yes</td><td>✗ No</td><td>39 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8gn.metal-48xl</td><td>120000.00</td><td>15000.00</td><td>480000.00</td><td>✓ Yes</td><td>✓ Yes ([2 EBS cards](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ebs_cards.html))</td><td>78 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td colspan="7">R8i</td></tr>
  <tr><td>r8i.large 1</td><td>650.00 / 10000.00</td><td>81.25 / 1250.00</td><td>3600.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8i.xlarge 1</td><td>1250.00 / 10000.00</td><td>156.25 / 1250.00</td><td>6000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8i.2xlarge 1</td><td>2500.00 / 10000.00</td><td>312.50 / 1250.00</td><td>12000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8i.4xlarge 1</td><td>5000.00 / 10000.00</td><td>625.00 / 1250.00</td><td>20000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8i.8xlarge</td><td>10000.00</td><td>1250.00</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8i.12xlarge</td><td>15000.00</td><td>1875.00</td><td>60000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8i.16xlarge</td><td>20000.00</td><td>2500.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>48 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8i.24xlarge</td><td>30000.00</td><td>3750.00</td><td>120000.00</td><td>✓ Yes</td><td>✗ No</td><td>64 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8i.32xlarge</td><td>40000.00</td><td>5000.00</td><td>160000.00</td><td>✓ Yes</td><td>✗ No</td><td>88 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8i.48xlarge</td><td>60000.00</td><td>7500.00</td><td>240000.00</td><td>✓ Yes</td><td>✗ No</td><td>128 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8i.96xlarge</td><td>80000.00</td><td>10000.00</td><td>480000.00</td><td>✓ Yes</td><td>✗ No</td><td>128 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8i.metal-48xl</td><td>60000.00</td><td>7500.00</td><td>240000.00</td><td>✓ Yes</td><td>✗ No</td><td>64 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8i.metal-96xl</td><td>80000.00</td><td>10000.00</td><td>480000.00</td><td>✓ Yes</td><td>✗ No</td><td>79 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td colspan="7">R8id</td></tr>
  <tr><td>r8id.large 1</td><td>650.00 / 10000.00</td><td>81.25 / 1250.00</td><td>3600.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8id.xlarge 1</td><td>1250.00 / 10000.00</td><td>156.25 / 1250.00</td><td>6000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8id.2xlarge 1</td><td>2500.00 / 10000.00</td><td>312.50 / 1250.00</td><td>12000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8id.4xlarge 1</td><td>5000.00 / 10000.00</td><td>625.00 / 1250.00</td><td>20000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8id.8xlarge</td><td>10000.00</td><td>1250.00</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8id.12xlarge</td><td>15000.00</td><td>1875.00</td><td>60000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8id.16xlarge</td><td>20000.00</td><td>2500.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>48 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8id.24xlarge</td><td>30000.00</td><td>3750.00</td><td>120000.00</td><td>✓ Yes</td><td>✗ No</td><td>64 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8id.32xlarge</td><td>40000.00</td><td>5000.00</td><td>160000.00</td><td>✓ Yes</td><td>✗ No</td><td>88 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8id.48xlarge</td><td>60000.00</td><td>7500.00</td><td>240000.00</td><td>✓ Yes</td><td>✗ No</td><td>128 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8id.96xlarge</td><td>80000.00</td><td>10000.00</td><td>480000.00</td><td>✓ Yes</td><td>✗ No</td><td>128 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8id.metal-48xl</td><td>60000.00</td><td>7500.00</td><td>240000.00</td><td>✓ Yes</td><td>✗ No</td><td>64 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8id.metal-96xl</td><td>80000.00</td><td>10000.00</td><td>480000.00</td><td>✓ Yes</td><td>✗ No</td><td>79 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td colspan="7">R8i-flex</td></tr>
  <tr><td>r8i-flex.large 1</td><td>315.00 / 10000.00</td><td>39.38 / 1250.00</td><td>2500.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8i-flex.xlarge 1</td><td>630.00 / 10000.00</td><td>78.75 / 1250.00</td><td>3600.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8i-flex.2xlarge 1</td><td>1250.00 / 10000.00</td><td>156.25 / 1250.00</td><td>6000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8i-flex.4xlarge 1</td><td>2500.00 / 10000.00</td><td>312.50 / 1250.00</td><td>12000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8i-flex.8xlarge 1</td><td>5000.00 / 10000.00</td><td>625.00 / 1250.00</td><td>20000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8i-flex.12xlarge 1</td><td>7500.00 / 15000.00</td><td>937.50 / 1875.00</td><td>30000.00 / 60000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8i-flex.16xlarge 1</td><td>10000.00 / 20000.00</td><td>1250.00 / 2500.00</td><td>40000.00 / 80000.00</td><td>✓ Yes</td><td>✗ No</td><td>48 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td colspan="7">R8in</td></tr>
  <tr><td>r8in.large 1</td><td>650.00 / 10000.00</td><td>81.25 / 1250.00</td><td>3600.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8in.xlarge 1</td><td>1250.00 / 10000.00</td><td>156.25 / 1250.00</td><td>6000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8in.2xlarge 1</td><td>2500.00 / 10000.00</td><td>312.50 / 1250.00</td><td>12000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8in.4xlarge 1</td><td>5000.00 / 10000.00</td><td>625.00 / 1250.00</td><td>20000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8in.8xlarge</td><td>10000.00</td><td>1250.00</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8in.12xlarge</td><td>15000.00</td><td>1875.00</td><td>60000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8in.16xlarge</td><td>20000.00</td><td>2500.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>48 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8in.24xlarge</td><td>30000.00</td><td>3750.00</td><td>120000.00</td><td>✓ Yes</td><td>✗ No</td><td>64 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8in.32xlarge</td><td>40000.00</td><td>5000.00</td><td>160000.00</td><td>✓ Yes</td><td>✗ No</td><td>88 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8in.48xlarge</td><td>60000.00</td><td>7500.00</td><td>240000.00</td><td>✓ Yes</td><td>✗ No</td><td>128 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8in.96xlarge</td><td>120000.00</td><td>15000.00</td><td>480000.00</td><td>✓ Yes</td><td>✓ Yes ([2 EBS cards](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ebs_cards.html))</td><td>128 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td colspan="7">R8idn</td></tr>
  <tr><td>r8idn.large 1</td><td>650.00 / 10000.00</td><td>81.25 / 1250.00</td><td>3600.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8idn.xlarge 1</td><td>1250.00 / 10000.00</td><td>156.25 / 1250.00</td><td>6000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8idn.2xlarge 1</td><td>2500.00 / 10000.00</td><td>312.50 / 1250.00</td><td>12000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8idn.4xlarge 1</td><td>5000.00 / 10000.00</td><td>625.00 / 1250.00</td><td>20000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8idn.8xlarge</td><td>10000.00</td><td>1250.00</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8idn.12xlarge</td><td>15000.00</td><td>1875.00</td><td>60000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8idn.16xlarge</td><td>20000.00</td><td>2500.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>48 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8idn.24xlarge</td><td>30000.00</td><td>3750.00</td><td>120000.00</td><td>✓ Yes</td><td>✗ No</td><td>64 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8idn.32xlarge</td><td>40000.00</td><td>5000.00</td><td>160000.00</td><td>✓ Yes</td><td>✗ No</td><td>88 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8idn.48xlarge</td><td>60000.00</td><td>7500.00</td><td>240000.00</td><td>✓ Yes</td><td>✗ No</td><td>128 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8idn.96xlarge</td><td>120000.00</td><td>15000.00</td><td>480000.00</td><td>✓ Yes</td><td>✓ Yes ([2 EBS cards](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ebs_cards.html))</td><td>128 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td colspan="7">R8ib</td></tr>
  <tr><td>r8ib.large 1</td><td>1563.00 / 25000.00</td><td>195.38 / 3125.00</td><td>7500.00 / 120000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8ib.xlarge 1</td><td>3125.00 / 25000.00</td><td>390.62 / 3125.00</td><td>15000.00 / 120000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8ib.2xlarge 1</td><td>6250.00 / 25000.00</td><td>781.25 / 3125.00</td><td>30000.00 / 120000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8ib.4xlarge 1</td><td>12500.00 / 25000.00</td><td>1562.50 / 3125.00</td><td>60000.00 / 120000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8ib.8xlarge</td><td>25000.00</td><td>3125.00</td><td>120000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8ib.12xlarge</td><td>37500.00</td><td>4687.50</td><td>180000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8ib.16xlarge</td><td>50000.00</td><td>6250.00</td><td>240000.00</td><td>✓ Yes</td><td>✗ No</td><td>48 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8ib.24xlarge</td><td>75000.00</td><td>9375.00</td><td>360000.00</td><td>✓ Yes</td><td>✗ No</td><td>64 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8ib.32xlarge</td><td>100000.00</td><td>12500.00</td><td>480000.00</td><td>✓ Yes</td><td>✗ No</td><td>88 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8ib.48xlarge</td><td>150000.00</td><td>18750.00</td><td>720000.00</td><td>✓ Yes</td><td>✗ No</td><td>128 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8ib.96xlarge</td><td>300000.00</td><td>37500.00</td><td>1440000.00</td><td>✓ Yes</td><td>✓ Yes ([2 EBS cards](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ebs_cards.html))</td><td>128 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td colspan="7">R8idb</td></tr>
  <tr><td>r8idb.large 1</td><td>1563.00 / 25000.00</td><td>195.38 / 3125.00</td><td>7500.00 / 120000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8idb.xlarge 1</td><td>3125.00 / 25000.00</td><td>390.62 / 3125.00</td><td>15000.00 / 120000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8idb.2xlarge 1</td><td>6250.00 / 25000.00</td><td>781.25 / 3125.00</td><td>30000.00 / 120000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8idb.4xlarge 1</td><td>12500.00 / 25000.00</td><td>1562.50 / 3125.00</td><td>60000.00 / 120000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8idb.8xlarge</td><td>25000.00</td><td>3125.00</td><td>120000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8idb.12xlarge</td><td>37500.00</td><td>4687.50</td><td>180000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8idb.16xlarge</td><td>50000.00</td><td>6250.00</td><td>240000.00</td><td>✓ Yes</td><td>✗ No</td><td>48 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8idb.24xlarge</td><td>75000.00</td><td>9375.00</td><td>360000.00</td><td>✓ Yes</td><td>✗ No</td><td>64 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8idb.32xlarge</td><td>100000.00</td><td>12500.00</td><td>480000.00</td><td>✓ Yes</td><td>✗ No</td><td>88 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8idb.48xlarge</td><td>150000.00</td><td>18750.00</td><td>720000.00</td><td>✓ Yes</td><td>✗ No</td><td>128 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>r8idb.96xlarge</td><td>300000.00</td><td>37500.00</td><td>1440000.00</td><td>✓ Yes</td><td>✓ Yes ([2 EBS cards](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ebs_cards.html))</td><td>128 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td colspan="7">U-3tb1</td></tr>
  <tr><td>u-3tb1.56xlarge</td><td>19000.00</td><td>2375.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td colspan="7">U-6tb1</td></tr>
  <tr><td>u-6tb1.56xlarge</td><td>38000.00</td><td>4750.00</td><td>160000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>u-6tb1.112xlarge</td><td>38000.00</td><td>4750.00</td><td>160000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>u-6tb1.metal</td><td>38000.00</td><td>4750.00</td><td>160000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 19 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td colspan="7">U-9tb1</td></tr>
  <tr><td>u-9tb1.112xlarge</td><td>38000.00</td><td>4750.00</td><td>160000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>u-9tb1.metal</td><td>38000.00</td><td>4750.00</td><td>160000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 19 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td colspan="7">U-12tb1</td></tr>
  <tr><td>u-12tb1.112xlarge</td><td>38000.00</td><td>4750.00</td><td>160000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>u-12tb1.metal</td><td>38000.00</td><td>4750.00</td><td>160000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 19 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td colspan="7">U-18tb1</td></tr>
  <tr><td>u-18tb1.112xlarge</td><td>38000.00</td><td>4750.00</td><td>160000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>u-18tb1.metal</td><td>38000.00</td><td>4750.00</td><td>160000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 19 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td colspan="7">U-24tb1</td></tr>
  <tr><td>u-24tb1.112xlarge</td><td>38000.00</td><td>4750.00</td><td>160000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>u-24tb1.metal</td><td>38000.00</td><td>4750.00</td><td>160000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 19 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td colspan="7">U7i-6tb</td></tr>
  <tr><td>u7i-6tb.112xlarge</td><td>100000.00</td><td>12500.00</td><td>560000.00</td><td>✓ Yes</td><td>✗ No</td><td>128 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td colspan="7">U7i-8tb</td></tr>
  <tr><td>u7i-8tb.112xlarge</td><td>100000.00</td><td>12500.00</td><td>560000.00</td><td>✓ Yes</td><td>✗ No</td><td>128 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td colspan="7">U7i-12tb</td></tr>
  <tr><td>u7i-12tb.224xlarge</td><td>100000.00</td><td>12500.00</td><td>560000.00</td><td>✓ Yes</td><td>✗ No</td><td>128 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td colspan="7">U7in-16tb</td></tr>
  <tr><td>u7in-16tb.224xlarge</td><td>100000.00</td><td>12500.00</td><td>560000.00</td><td>✓ Yes</td><td>✗ No</td><td>128 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td colspan="7">U7in-24tb</td></tr>
  <tr><td>u7in-24tb.224xlarge</td><td>100000.00</td><td>12500.00</td><td>560000.00</td><td>✓ Yes</td><td>✗ No</td><td>128 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td colspan="7">U7in-32tb</td></tr>
  <tr><td>u7in-32tb.224xlarge</td><td>100000.00</td><td>12500.00</td><td>560000.00</td><td>✓ Yes</td><td>✗ No</td><td>128 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td colspan="7">U7inh-32tb</td></tr>
  <tr><td>u7inh-32tb.480xlarge</td><td>160000.00</td><td>20000.00</td><td>840000.00</td><td>✓ Yes</td><td>✗ No</td><td>128 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td colspan="7">X1</td></tr>
  <tr><td>x1.16xlarge</td><td>7000.00</td><td>875.00</td><td>40000.00</td><td>✗ No</td><td>✗ No</td><td>Up to 40 ([Xen-based limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#xen-limits))</td></tr>
  <tr><td>x1.32xlarge</td><td>14000.00</td><td>1750.00</td><td>80000.00</td><td>✗ No</td><td>✗ No</td><td>Up to 40 ([Xen-based limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#xen-limits))</td></tr>
  <tr><td colspan="7">X1e</td></tr>
  <tr><td>x1e.xlarge</td><td>500.00</td><td>62.50</td><td>3700.00</td><td>✗ No</td><td>✗ No</td><td>Up to 40 ([Xen-based limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#xen-limits))</td></tr>
  <tr><td>x1e.2xlarge</td><td>1000.00</td><td>125.00</td><td>7400.00</td><td>✗ No</td><td>✗ No</td><td>Up to 40 ([Xen-based limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#xen-limits))</td></tr>
  <tr><td>x1e.4xlarge</td><td>1750.00</td><td>218.75</td><td>10000.00</td><td>✗ No</td><td>✗ No</td><td>Up to 40 ([Xen-based limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#xen-limits))</td></tr>
  <tr><td>x1e.8xlarge</td><td>3500.00</td><td>437.50</td><td>20000.00</td><td>✗ No</td><td>✗ No</td><td>Up to 40 ([Xen-based limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#xen-limits))</td></tr>
  <tr><td>x1e.16xlarge</td><td>7000.00</td><td>875.00</td><td>40000.00</td><td>✗ No</td><td>✗ No</td><td>Up to 40 ([Xen-based limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#xen-limits))</td></tr>
  <tr><td>x1e.32xlarge</td><td>14000.00</td><td>1750.00</td><td>80000.00</td><td>✗ No</td><td>✗ No</td><td>Up to 40 ([Xen-based limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#xen-limits))</td></tr>
  <tr><td colspan="7">X2gd</td></tr>
  <tr><td>x2gd.medium 1</td><td>315.00 / 4750.00</td><td>39.38 / 593.75</td><td>2500.00 / 20000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>x2gd.large 1</td><td>630.00 / 4750.00</td><td>78.75 / 593.75</td><td>3600.00 / 20000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>x2gd.xlarge 1</td><td>1188.00 / 4750.00</td><td>148.50 / 593.75</td><td>6000.00 / 20000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>x2gd.2xlarge 1</td><td>2375.00 / 4750.00</td><td>296.88 / 593.75</td><td>12000.00 / 20000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>x2gd.4xlarge</td><td>4750.00</td><td>593.75</td><td>20000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>x2gd.8xlarge</td><td>9500.00</td><td>1187.50</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>x2gd.12xlarge</td><td>14250.00</td><td>1781.25</td><td>60000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 25 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>x2gd.16xlarge</td><td>19000.00</td><td>2375.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 25 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>x2gd.metal</td><td>19000.00</td><td>2375.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 31 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td colspan="7">X2idn</td></tr>
  <tr><td>x2idn.16xlarge</td><td>40000.00</td><td>5000.00</td><td>173333.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>x2idn.24xlarge</td><td>60000.00</td><td>7500.00</td><td>260000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 25 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>x2idn.32xlarge</td><td>80000.00</td><td>10000.00</td><td>260000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 25 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>x2idn.metal</td><td>80000.00</td><td>10000.00</td><td>260000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 31 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td colspan="7">X2iedn</td></tr>
  <tr><td>x2iedn.xlarge 1</td><td>2500.00 / 20000.00</td><td>312.50 / 2500.00</td><td>8125.00 / 65000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>x2iedn.2xlarge 1</td><td>5000.00 / 20000.00</td><td>625.00 / 2500.00</td><td>16250.00 / 65000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>x2iedn.4xlarge 1</td><td>10000.00 / 20000.00</td><td>1250.00 / 2500.00</td><td>32500.00 / 65000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>x2iedn.8xlarge</td><td>20000.00</td><td>2500.00</td><td>65000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>x2iedn.16xlarge</td><td>40000.00</td><td>5000.00</td><td>130000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>x2iedn.24xlarge</td><td>60000.00</td><td>7500.00</td><td>195000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 25 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>x2iedn.32xlarge</td><td>80000.00</td><td>10000.00</td><td>260000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 25 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>x2iedn.metal</td><td>80000.00</td><td>10000.00</td><td>260000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 31 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td colspan="7">X2iezn</td></tr>
  <tr><td>x2iezn.2xlarge</td><td>3170.00</td><td>396.25</td><td>13333.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>x2iezn.4xlarge</td><td>4750.00</td><td>593.75</td><td>20000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>x2iezn.6xlarge</td><td>9500.00</td><td>1187.50</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>x2iezn.8xlarge</td><td>12000.00</td><td>1500.00</td><td>55000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>x2iezn.12xlarge</td><td>19000.00</td><td>2375.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>x2iezn.metal</td><td>19000.00</td><td>2375.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 31 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td colspan="7">X8g</td></tr>
  <tr><td>x8g.medium 1</td><td>315.00 / 10000.00</td><td>39.38 / 1250.00</td><td>2500.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>x8g.large 1</td><td>630.00 / 10000.00</td><td>78.75 / 1250.00</td><td>3600.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>x8g.xlarge 1</td><td>1250.00 / 10000.00</td><td>156.25 / 1250.00</td><td>6000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>x8g.2xlarge 1</td><td>2500.00 / 10000.00</td><td>312.50 / 1250.00</td><td>12000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>x8g.4xlarge 1</td><td>5000.00 / 10000.00</td><td>625.00 / 1250.00</td><td>20000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>x8g.8xlarge</td><td>10000.00</td><td>1250.00</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>x8g.12xlarge</td><td>15000.00</td><td>1875.00</td><td>60000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>x8g.16xlarge</td><td>20000.00</td><td>2500.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>48 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>x8g.24xlarge</td><td>30000.00</td><td>3750.00</td><td>120000.00</td><td>✓ Yes</td><td>✗ No</td><td>64 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>x8g.48xlarge</td><td>40000.00</td><td>5000.00</td><td>240000.00</td><td>✓ Yes</td><td>✗ No</td><td>128 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>x8g.metal-24xl</td><td>30000.00</td><td>3750.00</td><td>120000.00</td><td>✓ Yes</td><td>✗ No</td><td>39 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>x8g.metal-48xl</td><td>40000.00</td><td>5000.00</td><td>240000.00</td><td>✓ Yes</td><td>✗ No</td><td>79 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td colspan="7">X8aedz</td></tr>
  <tr><td>x8aedz.large 1</td><td>1250.00 / 15000.00</td><td>156.25 / 1875.00</td><td>5000.00 / 60000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>x8aedz.xlarge 1</td><td>2500.00 / 15000.00</td><td>312.50 / 1875.00</td><td>10000.00 / 60000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>x8aedz.3xlarge 1</td><td>7500.00 / 15000.00</td><td>937.50 / 1875.00</td><td>30000.00 / 60000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>x8aedz.6xlarge</td><td>15000.00</td><td>1875.00</td><td>60000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>x8aedz.12xlarge</td><td>30000.00</td><td>3750.00</td><td>120000.00</td><td>✓ Yes</td><td>✗ No</td><td>64 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>x8aedz.24xlarge</td><td>60000.00</td><td>7500.00</td><td>240000.00</td><td>✓ Yes</td><td>✗ No</td><td>128 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>x8aedz.metal-12xl</td><td>30000.00</td><td>3750.00</td><td>120000.00</td><td>✓ Yes</td><td>✗ No</td><td>64 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>x8aedz.metal-24xl</td><td>60000.00</td><td>7500.00</td><td>240000.00</td><td>✓ Yes</td><td>✗ No</td><td>79 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td colspan="7">X8i</td></tr>
  <tr><td>x8i.large 1</td><td>650.00 / 10000.00</td><td>81.25 / 1250.00</td><td>3600.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>x8i.xlarge 1</td><td>1250.00 / 10000.00</td><td>156.25 / 1250.00</td><td>6000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>x8i.2xlarge 1</td><td>2500.00 / 10000.00</td><td>312.50 / 1250.00</td><td>12000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>x8i.4xlarge 1</td><td>5000.00 / 10000.00</td><td>625.00 / 1250.00</td><td>20000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>x8i.8xlarge</td><td>10000.00</td><td>1250.00</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>x8i.12xlarge</td><td>15000.00</td><td>1875.00</td><td>60000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>x8i.16xlarge</td><td>20000.00</td><td>2500.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>48 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>x8i.24xlarge</td><td>30000.00</td><td>3750.00</td><td>120000.00</td><td>✓ Yes</td><td>✗ No</td><td>64 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>x8i.32xlarge</td><td>40000.00</td><td>5000.00</td><td>160000.00</td><td>✓ Yes</td><td>✗ No</td><td>88 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>x8i.48xlarge</td><td>60000.00</td><td>7500.00</td><td>240000.00</td><td>✓ Yes</td><td>✗ No</td><td>128 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>x8i.64xlarge</td><td>70000.00</td><td>8750.00</td><td>320000.00</td><td>✓ Yes</td><td>✗ No</td><td>128 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>x8i.96xlarge</td><td>80000.00</td><td>10000.00</td><td>480000.00</td><td>✓ Yes</td><td>✗ No</td><td>128 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>x8i.metal-48xl</td><td>60000.00</td><td>7500.00</td><td>240000.00</td><td>✓ Yes</td><td>✗ No</td><td>64 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>x8i.metal-96xl</td><td>80000.00</td><td>10000.00</td><td>480000.00</td><td>✓ Yes</td><td>✗ No</td><td>79 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td colspan="7">z1d</td></tr>
  <tr><td>z1d.large 1</td><td>800.00 / 3170.00</td><td>100.00 / 396.25</td><td>3333.00 / 13333.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>z1d.xlarge 1</td><td>1580.00 / 3170.00</td><td>197.50 / 396.25</td><td>6667.00 / 13333.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>z1d.2xlarge</td><td>3170.00</td><td>396.25</td><td>13333.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>z1d.3xlarge</td><td>4750.00</td><td>593.75</td><td>20000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>z1d.6xlarge</td><td>9500.00</td><td>1187.50</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>z1d.12xlarge</td><td>19000.00</td><td>2375.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 25 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>z1d.metal</td><td>19000.00</td><td>2375.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 31 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
</tbody>
</table>


**Note**  
1 These instances can support maximum performance for 30 minutes at least once every 24 hours, after which they revert to their baseline performance. Other instances can sustain the maximum performance indefinitely. If your workload requires sustained maximum performance for longer than 30 minutes, use one of these instances.

## Instance store specifications
<a name="mo_instance-store"></a>

The following table shows the instance store volume configuration for supported instance types, along with the aggregated IOPS performance with 4,096 byte block size at queue depth saturation. 


<table>
<thead>
  <tr><th>Instance type</th><th>Instance store volumes</th><th>Instance store type</th><th>100% random read IOPS / Write IOPS</th><th>Needs initialization 1</th><th>TRIM support 2</th></tr>
</thead>
<tbody>
  <tr><td colspan="6">R5ad</td></tr>
  <tr><td>r5ad.large</td><td>1 x 75 GB</td><td>NVMe SSD</td><td>30,000 / 15,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r5ad.xlarge</td><td>1 x 150 GB</td><td>NVMe SSD</td><td>59,000 / 29,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r5ad.2xlarge</td><td>1 x 300 GB</td><td>NVMe SSD</td><td>117,000 / 57,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r5ad.4xlarge</td><td>2 x 300 GB</td><td>NVMe SSD</td><td>234,000 / 114,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r5ad.8xlarge</td><td>2 x 600 GB</td><td>NVMe SSD</td><td>466,666 / 233,334</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r5ad.12xlarge</td><td>2 x 900 GB</td><td>NVMe SSD</td><td>700,000 / 340,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r5ad.16xlarge</td><td>4 x 600 GB</td><td>NVMe SSD</td><td>933,332 / 466,668</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r5ad.24xlarge</td><td>4 x 900 GB</td><td>NVMe SSD</td><td>1,400,000 / 680,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td colspan="6">R5d</td></tr>
  <tr><td>r5d.large</td><td>1 x 75 GB</td><td>NVMe SSD</td><td>30,000 / 15,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r5d.xlarge</td><td>1 x 150 GB</td><td>NVMe SSD</td><td>59,000 / 29,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r5d.2xlarge</td><td>1 x 300 GB</td><td>NVMe SSD</td><td>117,000 / 57,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r5d.4xlarge</td><td>2 x 300 GB</td><td>NVMe SSD</td><td>234,000 / 114,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r5d.8xlarge</td><td>2 x 600 GB</td><td>NVMe SSD</td><td>466,666 / 233,334</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r5d.12xlarge</td><td>2 x 900 GB</td><td>NVMe SSD</td><td>700,000 / 340,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r5d.16xlarge</td><td>4 x 600 GB</td><td>NVMe SSD</td><td>933,332 / 466,668</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r5d.24xlarge</td><td>4 x 900 GB</td><td>NVMe SSD</td><td>1,400,000 / 680,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r5d.metal</td><td>4 x 900 GB</td><td>NVMe SSD</td><td>1,400,000 / 680,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td colspan="6">R5dn</td></tr>
  <tr><td>r5dn.large</td><td>1 x 75 GB</td><td>NVMe SSD</td><td>29,000 / 14,500</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r5dn.xlarge</td><td>1 x 150 GB</td><td>NVMe SSD</td><td>58,000 / 29,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r5dn.2xlarge</td><td>1 x 300 GB</td><td>NVMe SSD</td><td>116,000 / 58,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r5dn.4xlarge</td><td>2 x 300 GB</td><td>NVMe SSD</td><td>232,000 / 116,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r5dn.8xlarge</td><td>2 x 600 GB</td><td>NVMe SSD</td><td>464,000 / 232,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r5dn.12xlarge</td><td>2 x 900 GB</td><td>NVMe SSD</td><td>700,000 / 350,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r5dn.16xlarge</td><td>4 x 600 GB</td><td>NVMe SSD</td><td>930,000 / 465,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r5dn.24xlarge</td><td>4 x 900 GB</td><td>NVMe SSD</td><td>1,400,000 / 700,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r5dn.metal</td><td>4 x 900 GB</td><td>NVMe SSD</td><td>1,400,000 / 700,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td colspan="6">R6gd</td></tr>
  <tr><td>r6gd.medium</td><td>1 x 59 GB</td><td>NVMe SSD</td><td>13,438 / 5,625</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r6gd.large</td><td>1 x 118 GB</td><td>NVMe SSD</td><td>26,875 / 11,250</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r6gd.xlarge</td><td>1 x 237 GB</td><td>NVMe SSD</td><td>53,750 / 22,500</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r6gd.2xlarge</td><td>1 x 474 GB</td><td>NVMe SSD</td><td>107,500 / 45,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r6gd.4xlarge</td><td>1 x 950 GB</td><td>NVMe SSD</td><td>215,000 / 90,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r6gd.8xlarge</td><td>1 x 1900 GB</td><td>NVMe SSD</td><td>430,000 / 180,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r6gd.12xlarge</td><td>2 x 1425 GB</td><td>NVMe SSD</td><td>645,000 / 270,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r6gd.16xlarge</td><td>2 x 1900 GB</td><td>NVMe SSD</td><td>860,000 / 360,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r6gd.metal</td><td>2 x 1900 GB</td><td>NVMe SSD</td><td>860,000 / 360,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td colspan="6">R6id</td></tr>
  <tr><td>r6id.large</td><td>1 x 118 GB</td><td>NVMe SSD</td><td>33,542 / 16,771</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r6id.xlarge</td><td>1 x 237 GB</td><td>NVMe SSD</td><td>67,083 / 33,542</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r6id.2xlarge</td><td>1 x 474 GB</td><td>NVMe SSD</td><td>134,167 / 67,084</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r6id.4xlarge</td><td>1 x 950 GB</td><td>NVMe SSD</td><td>268,333 / 134,167</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r6id.8xlarge</td><td>1 x 1900 GB</td><td>NVMe SSD</td><td>536,666 / 268,334</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r6id.12xlarge</td><td>2 x 1425 GB</td><td>NVMe SSD</td><td>804,998 / 402,500</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r6id.16xlarge</td><td>2 x 1900 GB</td><td>NVMe SSD</td><td>1,073,332 / 536,668</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r6id.24xlarge</td><td>4 x 1425 GB</td><td>NVMe SSD</td><td>1,609,996 / 805,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r6id.32xlarge</td><td>4 x 1900 GB</td><td>NVMe SSD</td><td>2,146,664 / 1,073,336</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r6id.metal</td><td>4 x 1900 GB</td><td>NVMe SSD</td><td>2,146,664 / 1,073,336</td><td> </td><td>✓ Yes</td></tr>
  <tr><td colspan="6">R6idn</td></tr>
  <tr><td>r6idn.large</td><td>1 x 118 GB</td><td>NVMe SSD</td><td>33,542 / 16,771</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r6idn.xlarge</td><td>1 x 237 GB</td><td>NVMe SSD</td><td>67,083 / 33,542</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r6idn.2xlarge</td><td>1 x 474 GB</td><td>NVMe SSD</td><td>134,167 / 67,084</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r6idn.4xlarge</td><td>1 x 950 GB</td><td>NVMe SSD</td><td>268,333 / 134,167</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r6idn.8xlarge</td><td>1 x 1900 GB</td><td>NVMe SSD</td><td>536,666 / 268,334</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r6idn.12xlarge</td><td>2 x 1425 GB</td><td>NVMe SSD</td><td>804,998 / 402,500</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r6idn.16xlarge</td><td>2 x 1900 GB</td><td>NVMe SSD</td><td>1,073,332 / 536,668</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r6idn.24xlarge</td><td>4 x 1425 GB</td><td>NVMe SSD</td><td>1,609,996 / 805,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r6idn.32xlarge</td><td>4 x 1900 GB</td><td>NVMe SSD</td><td>2,146,664 / 1,073,336</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r6idn.metal</td><td>4 x 1900 GB</td><td>NVMe SSD</td><td>2,146,664 / 1,073,336</td><td> </td><td>✓ Yes</td></tr>
  <tr><td colspan="6">R7gd</td></tr>
  <tr><td>r7gd.medium</td><td>1 x 59 GB</td><td>NVMe SSD</td><td>16,771 / 8,385</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r7gd.large</td><td>1 x 118 GB</td><td>NVMe SSD</td><td>33,542 / 16,771</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r7gd.xlarge</td><td>1 x 237 GB</td><td>NVMe SSD</td><td>67,083 / 33,542</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r7gd.2xlarge</td><td>1 x 474 GB</td><td>NVMe SSD</td><td>134,167 / 67,084</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r7gd.4xlarge</td><td>1 x 950 GB</td><td>NVMe SSD</td><td>268,333 / 134,167</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r7gd.8xlarge</td><td>1 x 1900 GB</td><td>NVMe SSD</td><td>536,666 / 268,334</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r7gd.12xlarge</td><td>2 x 1425 GB</td><td>NVMe SSD</td><td>804,998 / 402,500</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r7gd.16xlarge</td><td>2 x 1900 GB</td><td>NVMe SSD</td><td>1,073,332 / 536,668</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r7gd.metal</td><td>2 x 1900 GB</td><td>NVMe SSD</td><td>1,073,332 / 536,668</td><td> </td><td>✓ Yes</td></tr>
  <tr><td colspan="6">R8gd</td></tr>
  <tr><td>r8gd.medium</td><td>1 x 59 GB</td><td>NVMe SSD</td><td>16,771 / 8,385</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r8gd.large</td><td>1 x 118 GB</td><td>NVMe SSD</td><td>33,542 / 16,771</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r8gd.xlarge</td><td>1 x 237 GB</td><td>NVMe SSD</td><td>67,083 / 33,542</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r8gd.2xlarge</td><td>1 x 474 GB</td><td>NVMe SSD</td><td>134,167 / 67,084</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r8gd.4xlarge</td><td>1 x 950 GB</td><td>NVMe SSD</td><td>268,333 / 134,167</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r8gd.8xlarge</td><td>1 x 1900 GB</td><td>NVMe SSD</td><td>536,666 / 268,334</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r8gd.12xlarge</td><td>3 x 950 GB</td><td>NVMe SSD</td><td>804,999 / 402,501</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r8gd.16xlarge</td><td>2 x 1900 GB</td><td>NVMe SSD</td><td>1,073,332 / 536,668</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r8gd.24xlarge</td><td>3 x 1900 GB</td><td>NVMe SSD</td><td>1,609,998 / 805,002</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r8gd.48xlarge</td><td>6 x 1900 GB</td><td>NVMe SSD</td><td>3,219,996 / 1,610,004</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r8gd.metal-24xl</td><td>3 x 1900 GB</td><td>NVMe SSD</td><td>1,609,998 / 805,002</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r8gd.metal-48xl</td><td>6 x 1900 GB</td><td>NVMe SSD</td><td>3,219,996 / 1,610,004</td><td> </td><td>✓ Yes</td></tr>
  <tr><td colspan="6">R8id</td></tr>
  <tr><td>r8id.large</td><td>1 x 118 GB</td><td>NVMe SSD</td><td>33,542 / 16,771</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r8id.xlarge</td><td>1 x 237 GB</td><td>NVMe SSD</td><td>67,083 / 33,542</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r8id.2xlarge</td><td>1 x 474 GB</td><td>NVMe SSD</td><td>134,167 / 67,084</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r8id.4xlarge</td><td>1 x 950 GB</td><td>NVMe SSD</td><td>268,333 / 134,167</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r8id.8xlarge</td><td>1 x 1900 GB</td><td>NVMe SSD</td><td>536,666 / 268,334</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r8id.12xlarge</td><td>1 x 2850 GB</td><td>NVMe SSD</td><td>804,999 / 402,501</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r8id.16xlarge</td><td>1 x 3800 GB</td><td>NVMe SSD</td><td>1,073,332 / 536,668</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r8id.24xlarge</td><td>2 x 2850 GB</td><td>NVMe SSD</td><td>1,609,998 / 805,002</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r8id.32xlarge</td><td>2 x 3800 GB</td><td>NVMe SSD</td><td>2,146,664 / 1,073,336</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r8id.48xlarge</td><td>3 x 3800 GB</td><td>NVMe SSD</td><td>3,219,996 / 1,610,004</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r8id.96xlarge</td><td>6 x 3800 GB</td><td>NVMe SSD</td><td>6,439,992 / 3,220,008</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r8id.metal-48xl</td><td>3 x 3800 GB</td><td>NVMe SSD</td><td>3,219,996 / 1,610,004</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r8id.metal-96xl</td><td>6 x 3800 GB</td><td>NVMe SSD</td><td>6,439,992 / 3,220,008</td><td> </td><td>✓ Yes</td></tr>
  <tr><td colspan="6">R8idn</td></tr>
  <tr><td>r8idn.large</td><td>1 x 118 GB</td><td>NVMe SSD</td><td>33,542 / 16,771</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r8idn.xlarge</td><td>1 x 237 GB</td><td>NVMe SSD</td><td>67,083 / 33,542</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r8idn.2xlarge</td><td>1 x 474 GB</td><td>NVMe SSD</td><td>134,167 / 67,084</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r8idn.4xlarge</td><td>1 x 950 GB</td><td>NVMe SSD</td><td>268,333 / 134,167</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r8idn.8xlarge</td><td>1 x 1900 GB</td><td>NVMe SSD</td><td>536,666 / 268,334</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r8idn.12xlarge</td><td>1 x 2850 GB</td><td>NVMe SSD</td><td>804,999 / 402,501</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r8idn.16xlarge</td><td>1 x 3800 GB</td><td>NVMe SSD</td><td>1,073,332 / 536,668</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r8idn.24xlarge</td><td>2 x 2850 GB</td><td>NVMe SSD</td><td>1,609,998 / 805,002</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r8idn.32xlarge</td><td>2 x 3800 GB</td><td>NVMe SSD</td><td>2,146,664 / 1,073,336</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r8idn.48xlarge</td><td>3 x 3800 GB</td><td>NVMe SSD</td><td>3,219,996 / 1,610,004</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r8idn.96xlarge</td><td>6 x 3800 GB</td><td>NVMe SSD</td><td>6,439,992 / 3,220,008</td><td> </td><td>✓ Yes</td></tr>
  <tr><td colspan="6">R8idb</td></tr>
  <tr><td>r8idb.large</td><td>1 x 118 GB</td><td>NVMe SSD</td><td>33,542 / 16,771</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r8idb.xlarge</td><td>1 x 237 GB</td><td>NVMe SSD</td><td>67,083 / 33,542</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r8idb.2xlarge</td><td>1 x 474 GB</td><td>NVMe SSD</td><td>134,167 / 67,084</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r8idb.4xlarge</td><td>1 x 950 GB</td><td>NVMe SSD</td><td>268,333 / 134,167</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r8idb.8xlarge</td><td>1 x 1900 GB</td><td>NVMe SSD</td><td>536,666 / 268,334</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r8idb.12xlarge</td><td>1 x 2850 GB</td><td>NVMe SSD</td><td>804,999 / 402,501</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r8idb.16xlarge</td><td>1 x 3800 GB</td><td>NVMe SSD</td><td>1,073,332 / 536,668</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r8idb.24xlarge</td><td>2 x 2850 GB</td><td>NVMe SSD</td><td>1,609,998 / 805,002</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r8idb.32xlarge</td><td>2 x 3800 GB</td><td>NVMe SSD</td><td>2,146,664 / 1,073,336</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r8idb.48xlarge</td><td>3 x 3800 GB</td><td>NVMe SSD</td><td>3,219,996 / 1,610,004</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>r8idb.96xlarge</td><td>6 x 3800 GB</td><td>NVMe SSD</td><td>6,439,992 / 3,220,008</td><td> </td><td>✓ Yes</td></tr>
  <tr><td colspan="6">X1</td></tr>
  <tr><td>x1.16xlarge</td><td>1 x 1920 GB</td><td>SSD</td><td></td><td>✓ Yes</td><td> </td></tr>
  <tr><td>x1.32xlarge</td><td>2 x 1920 GB</td><td>SSD</td><td></td><td>✓ Yes</td><td> </td></tr>
  <tr><td colspan="6">X1e</td></tr>
  <tr><td>x1e.xlarge</td><td>1 x 120 GB</td><td>SSD</td><td></td><td>✓ Yes</td><td> </td></tr>
  <tr><td>x1e.2xlarge</td><td>1 x 240 GB</td><td>SSD</td><td></td><td>✓ Yes</td><td> </td></tr>
  <tr><td>x1e.4xlarge</td><td>1 x 480 GB</td><td>SSD</td><td></td><td>✓ Yes</td><td> </td></tr>
  <tr><td>x1e.8xlarge</td><td>1 x 960 GB</td><td>SSD</td><td></td><td>✓ Yes</td><td> </td></tr>
  <tr><td>x1e.16xlarge</td><td>1 x 1920 GB</td><td>SSD</td><td></td><td>✓ Yes</td><td> </td></tr>
  <tr><td>x1e.32xlarge</td><td>2 x 1920 GB</td><td>SSD</td><td></td><td>✓ Yes</td><td> </td></tr>
  <tr><td colspan="6">X2gd</td></tr>
  <tr><td>x2gd.medium</td><td>1 x 59 GB</td><td>NVMe SSD</td><td>13,438 / 5,625</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>x2gd.large</td><td>1 x 118 GB</td><td>NVMe SSD</td><td>26,875 / 11,250</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>x2gd.xlarge</td><td>1 x 237 GB</td><td>NVMe SSD</td><td>53,750 / 22,500</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>x2gd.2xlarge</td><td>1 x 475 GB</td><td>NVMe SSD</td><td>107,500 / 45,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>x2gd.4xlarge</td><td>1 x 950 GB</td><td>NVMe SSD</td><td>215,000 / 90,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>x2gd.8xlarge</td><td>1 x 1900 GB</td><td>NVMe SSD</td><td>430,000 / 180,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>x2gd.12xlarge</td><td>2 x 1425 GB</td><td>NVMe SSD</td><td>645,000 / 270,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>x2gd.16xlarge</td><td>2 x 1900 GB</td><td>NVMe SSD</td><td>860,000 / 360,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>x2gd.metal</td><td>2 x 1900 GB</td><td>NVMe SSD</td><td>860,000 / 360,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td colspan="6">X2idn</td></tr>
  <tr><td>x2idn.16xlarge</td><td>1 x 1900 GB</td><td>NVMe SSD</td><td>430,000 / 180,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>x2idn.24xlarge</td><td>2 x 1425 GB</td><td>NVMe SSD</td><td>645,000 / 270,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>x2idn.32xlarge</td><td>2 x 1900 GB</td><td>NVMe SSD</td><td>860,000 / 360,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>x2idn.metal</td><td>2 x 1900 GB</td><td>NVMe SSD</td><td>860,000 / 360,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td colspan="6">X2iedn</td></tr>
  <tr><td>x2iedn.xlarge</td><td>1 x 118 GB</td><td>NVMe SSD</td><td>26,875 / 11,250</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>x2iedn.2xlarge</td><td>1 x 237 GB</td><td>NVMe SSD</td><td>53,750 / 22,500</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>x2iedn.4xlarge</td><td>1 x 475 GB</td><td>NVMe SSD</td><td>107,500 / 45,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>x2iedn.8xlarge</td><td>1 x 950 GB</td><td>NVMe SSD</td><td>215,000 / 90,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>x2iedn.16xlarge</td><td>1 x 1900 GB</td><td>NVMe SSD</td><td>430,000 / 180,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>x2iedn.24xlarge</td><td>2 x 1425 GB</td><td>NVMe SSD</td><td>645,000 / 270,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>x2iedn.32xlarge</td><td>2 x 1900 GB</td><td>NVMe SSD</td><td>860,000 / 360,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>x2iedn.metal</td><td>2 x 1900 GB</td><td>NVMe SSD</td><td>860,000 / 360,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td colspan="6">X8aedz</td></tr>
  <tr><td>x8aedz.large</td><td>1 x 158 GB</td><td>NVMe SSD</td><td>44,722 / 22,361</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>x8aedz.xlarge</td><td>1 x 316 GB</td><td>NVMe SSD</td><td>89,444 / 44,722</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>x8aedz.3xlarge</td><td>1 x 950 GB</td><td>NVMe SSD</td><td>268,333 / 134,167</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>x8aedz.6xlarge</td><td>1 x 1900 GB</td><td>NVMe SSD</td><td>536,666 / 268,334</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>x8aedz.12xlarge</td><td>1 x 3800 GB</td><td>NVMe SSD</td><td>1,073,332 / 536,668</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>x8aedz.24xlarge</td><td>2 x 3800 GB</td><td>NVMe SSD</td><td>2,146,664 / 1,073,336</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>x8aedz.metal-12xl</td><td>1 x 3800 GB</td><td>NVMe SSD</td><td>1,073,332 / 536,668</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>x8aedz.metal-24xl</td><td>2 x 3800 GB</td><td>NVMe SSD</td><td>2,146,664 / 1,073,336</td><td> </td><td>✓ Yes</td></tr>
  <tr><td colspan="6">z1d</td></tr>
  <tr><td>z1d.large</td><td>1 x 75 GB</td><td>NVMe SSD</td><td>30,000 / 15,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>z1d.xlarge</td><td>1 x 150 GB</td><td>NVMe SSD</td><td>59,000 / 29,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>z1d.2xlarge</td><td>1 x 300 GB</td><td>NVMe SSD</td><td>117,000 / 57,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>z1d.3xlarge</td><td>1 x 450 GB</td><td>NVMe SSD</td><td>175,000 / 75,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>z1d.6xlarge</td><td>1 x 900 GB</td><td>NVMe SSD</td><td>350,000 / 170,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>z1d.12xlarge</td><td>2 x 900 GB</td><td>NVMe SSD</td><td>700,000 / 340,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>z1d.metal</td><td>2 x 900 GB</td><td>NVMe SSD</td><td>700,000 / 340,000</td><td> </td><td>✓ Yes</td></tr>
</tbody>
</table>


1 Volumes attached to certain instances suffer a first-write penalty unless initialized. For more information, see [Optimize disk performance for instance store volumes](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/disk-performance.html).

2 For more information, see [Instance store volume TRIM support](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ssd-instance-store.html#InstanceStoreTrimSupport).

## Security specifications
<a name="mo_security"></a>


<table>
<thead>
  <tr><th>Instance type</th><th>EBS encryption</th><th>Instance store encryption</th><th>Encryption in transit</th><th>AMD SEV-SNP</th><th>NitroTPM</th><th>Nitro Enclaves</th></tr>
</thead>
<tbody>
  <tr><td colspan="7">R5</td></tr>
  <tr><td>r5.large</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>r5.xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r5.2xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r5.4xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r5.8xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r5.12xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r5.16xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r5.24xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r5.metal</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">R5a</td></tr>
  <tr><td>r5a.large</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>r5a.xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r5a.2xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r5a.4xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r5a.8xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r5a.12xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r5a.16xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r5a.24xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td colspan="7">R5ad</td></tr>
  <tr><td>r5ad.large</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>r5ad.xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r5ad.2xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r5ad.4xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r5ad.8xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r5ad.12xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r5ad.16xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r5ad.24xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td colspan="7">R5b</td></tr>
  <tr><td>r5b.large</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>r5b.xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r5b.2xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r5b.4xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r5b.8xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r5b.12xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r5b.16xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r5b.24xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r5b.metal</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">R5d</td></tr>
  <tr><td>r5d.large</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>r5d.xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r5d.2xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r5d.4xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r5d.8xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r5d.12xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r5d.16xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r5d.24xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r5d.metal</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">R5dn</td></tr>
  <tr><td>r5dn.large</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>r5dn.xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r5dn.2xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r5dn.4xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r5dn.8xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r5dn.12xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r5dn.16xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r5dn.24xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r5dn.metal</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">R5n</td></tr>
  <tr><td>r5n.large</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>r5n.xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r5n.2xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r5n.4xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r5n.8xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r5n.12xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r5n.16xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r5n.24xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r5n.metal</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">R6a</td></tr>
  <tr><td>r6a.large</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>r6a.xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r6a.2xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r6a.4xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r6a.8xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r6a.12xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r6a.16xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r6a.24xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r6a.32xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r6a.48xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r6a.metal</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">R6g</td></tr>
  <tr><td>r6g.medium</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>r6g.large</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r6g.xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r6g.2xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r6g.4xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r6g.8xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r6g.12xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r6g.16xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r6g.metal</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">R6gd</td></tr>
  <tr><td>r6gd.medium</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>r6gd.large</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r6gd.xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r6gd.2xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r6gd.4xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r6gd.8xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r6gd.12xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r6gd.16xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r6gd.metal</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">R6i</td></tr>
  <tr><td>r6i.large</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>r6i.xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r6i.2xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r6i.4xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r6i.8xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r6i.12xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r6i.16xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r6i.24xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r6i.32xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r6i.metal</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">R6id</td></tr>
  <tr><td>r6id.large</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>r6id.xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r6id.2xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r6id.4xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r6id.8xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r6id.12xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r6id.16xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r6id.24xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r6id.32xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r6id.metal</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">R6idn</td></tr>
  <tr><td>r6idn.large</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>r6idn.xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r6idn.2xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r6idn.4xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r6idn.8xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r6idn.12xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r6idn.16xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r6idn.24xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r6idn.32xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r6idn.metal</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">R6in</td></tr>
  <tr><td>r6in.large</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>r6in.xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r6in.2xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r6in.4xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r6in.8xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r6in.12xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r6in.16xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r6in.24xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r6in.32xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r6in.metal</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">R7a</td></tr>
  <tr><td>r7a.medium</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>r7a.large</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>r7a.xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r7a.2xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r7a.4xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r7a.8xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r7a.12xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r7a.16xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r7a.24xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r7a.32xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r7a.48xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r7a.metal-48xl</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">R7g</td></tr>
  <tr><td>r7g.medium</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>r7g.large</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r7g.xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r7g.2xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r7g.4xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r7g.8xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r7g.12xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r7g.16xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r7g.metal</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">R7gd</td></tr>
  <tr><td>r7gd.medium</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>r7gd.large</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r7gd.xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r7gd.2xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r7gd.4xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r7gd.8xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r7gd.12xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r7gd.16xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r7gd.metal</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">R7i</td></tr>
  <tr><td>r7i.large</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>r7i.xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r7i.2xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r7i.4xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r7i.8xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r7i.12xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r7i.16xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r7i.24xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r7i.48xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r7i.metal-24xl</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r7i.metal-48xl</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">R7iz</td></tr>
  <tr><td>r7iz.large</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>r7iz.xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r7iz.2xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r7iz.4xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r7iz.8xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r7iz.12xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r7iz.16xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r7iz.32xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r7iz.metal-16xl</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r7iz.metal-32xl</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">R8a</td></tr>
  <tr><td>r8a.medium</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>r8a.large</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8a.xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8a.2xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8a.4xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8a.8xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8a.12xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8a.16xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8a.24xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8a.48xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8a.metal-24xl</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8a.metal-48xl</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">R8g</td></tr>
  <tr><td>r8g.medium</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>r8g.large</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8g.xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8g.2xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8g.4xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8g.8xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8g.12xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8g.16xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8g.24xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8g.48xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8g.metal-24xl</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8g.metal-48xl</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">R8gb</td></tr>
  <tr><td>r8gb.medium</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>r8gb.large</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8gb.xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8gb.2xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8gb.4xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8gb.8xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8gb.12xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8gb.16xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8gb.24xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8gb.48xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8gb.metal-24xl</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8gb.metal-48xl</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">R8gd</td></tr>
  <tr><td>r8gd.medium</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>r8gd.large</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8gd.xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8gd.2xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8gd.4xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8gd.8xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8gd.12xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8gd.16xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8gd.24xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8gd.48xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8gd.metal-24xl</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8gd.metal-48xl</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">R8gn</td></tr>
  <tr><td>r8gn.medium</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>r8gn.large</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8gn.xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8gn.2xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8gn.4xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8gn.8xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8gn.12xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8gn.16xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8gn.24xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8gn.48xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8gn.metal-24xl</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8gn.metal-48xl</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">R8i</td></tr>
  <tr><td>r8i.large</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>r8i.xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8i.2xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8i.4xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8i.8xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8i.12xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8i.16xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8i.24xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8i.32xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8i.48xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8i.96xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8i.metal-48xl</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8i.metal-96xl</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">R8id</td></tr>
  <tr><td>r8id.large</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>r8id.xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8id.2xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8id.4xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8id.8xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8id.12xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8id.16xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8id.24xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8id.32xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8id.48xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8id.96xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8id.metal-48xl</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r8id.metal-96xl</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">R8i-flex</td></tr>
  <tr><td>r8i-flex.large</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>r8i-flex.xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>r8i-flex.2xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>r8i-flex.4xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>r8i-flex.8xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>r8i-flex.12xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>r8i-flex.16xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td colspan="7">R8in</td></tr>
  <tr><td>r8in.large</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>r8in.xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8in.2xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8in.4xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8in.8xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8in.12xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8in.16xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8in.24xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8in.32xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8in.48xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8in.96xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td colspan="7">R8idn</td></tr>
  <tr><td>r8idn.large</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>r8idn.xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8idn.2xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8idn.4xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8idn.8xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8idn.12xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8idn.16xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8idn.24xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8idn.32xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8idn.48xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8idn.96xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td colspan="7">R8ib</td></tr>
  <tr><td>r8ib.large</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>r8ib.xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8ib.2xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8ib.4xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8ib.8xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8ib.12xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8ib.16xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8ib.24xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8ib.32xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8ib.48xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8ib.96xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td colspan="7">R8idb</td></tr>
  <tr><td>r8idb.large</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>r8idb.xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8idb.2xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8idb.4xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8idb.8xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8idb.12xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8idb.16xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8idb.24xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8idb.32xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8idb.48xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>r8idb.96xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td colspan="7">U-3tb1</td></tr>
  <tr><td>u-3tb1.56xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">U-6tb1</td></tr>
  <tr><td>u-6tb1.56xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>u-6tb1.112xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>u-6tb1.metal</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">U-9tb1</td></tr>
  <tr><td>u-9tb1.112xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>u-9tb1.metal</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">U-12tb1</td></tr>
  <tr><td>u-12tb1.112xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>u-12tb1.metal</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">U-18tb1</td></tr>
  <tr><td>u-18tb1.112xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>u-18tb1.metal</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">U-24tb1</td></tr>
  <tr><td>u-24tb1.112xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>u-24tb1.metal</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">U7i-6tb</td></tr>
  <tr><td>u7i-6tb.112xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td colspan="7">U7i-8tb</td></tr>
  <tr><td>u7i-8tb.112xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td colspan="7">U7i-12tb</td></tr>
  <tr><td>u7i-12tb.224xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td colspan="7">U7in-16tb</td></tr>
  <tr><td>u7in-16tb.224xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td colspan="7">U7in-24tb</td></tr>
  <tr><td>u7in-24tb.224xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td colspan="7">U7in-32tb</td></tr>
  <tr><td>u7in-32tb.224xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td colspan="7">U7inh-32tb</td></tr>
  <tr><td>u7inh-32tb.480xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">X1</td></tr>
  <tr><td>x1.16xlarge</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>x1.32xlarge</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">X1e</td></tr>
  <tr><td>x1e.xlarge</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>x1e.2xlarge</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>x1e.4xlarge</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>x1e.8xlarge</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>x1e.16xlarge</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>x1e.32xlarge</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">X2gd</td></tr>
  <tr><td>x2gd.medium</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>x2gd.large</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td></tr>
  <tr><td>x2gd.xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td></tr>
  <tr><td>x2gd.2xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td></tr>
  <tr><td>x2gd.4xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td></tr>
  <tr><td>x2gd.8xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td></tr>
  <tr><td>x2gd.12xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td></tr>
  <tr><td>x2gd.16xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td></tr>
  <tr><td>x2gd.metal</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">X2idn</td></tr>
  <tr><td>x2idn.16xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>x2idn.24xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>x2idn.32xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>x2idn.metal</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">X2iedn</td></tr>
  <tr><td>x2iedn.xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>x2iedn.2xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>x2iedn.4xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>x2iedn.8xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>x2iedn.16xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>x2iedn.24xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>x2iedn.32xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>x2iedn.metal</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">X2iezn</td></tr>
  <tr><td>x2iezn.2xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>x2iezn.4xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>x2iezn.6xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>x2iezn.8xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>x2iezn.12xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>x2iezn.metal</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">X8g</td></tr>
  <tr><td>x8g.medium</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>x8g.large</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>x8g.xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>x8g.2xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>x8g.4xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>x8g.8xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>x8g.12xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>x8g.16xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>x8g.24xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>x8g.48xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>x8g.metal-24xl</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>x8g.metal-48xl</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">X8aedz</td></tr>
  <tr><td>x8aedz.large</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>x8aedz.xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>x8aedz.3xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>x8aedz.6xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>x8aedz.12xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>x8aedz.24xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>x8aedz.metal-12xl</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>x8aedz.metal-24xl</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">X8i</td></tr>
  <tr><td>x8i.large</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>x8i.xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>x8i.2xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>x8i.4xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>x8i.8xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>x8i.12xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>x8i.16xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>x8i.24xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>x8i.32xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>x8i.48xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>x8i.64xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>x8i.96xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>x8i.metal-48xl</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>x8i.metal-96xl</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">z1d</td></tr>
  <tr><td>z1d.large</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>z1d.xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>z1d.2xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>z1d.3xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>z1d.6xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>z1d.12xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>z1d.metal</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
</tbody>
</table>
