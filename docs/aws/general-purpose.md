

# Specifications for Amazon EC2 general purpose instances
<a name="gp"></a>

General purpose instances provide a balance of compute, memory, and networking resources. These instances are ideal for applications that use these resources in equal proportions, such as web servers and code repositories.

For information on previous generation instance types of this category, such as M4 instances, see [Specifications for Amazon EC2 previous generation instances](pg.md).

**Topics**
+ [Instance families and instance types](#gp_sizes)
+ [Instance family summary](#gp_summary)
+ [Performance specifications](#gp_hardware)
+ [Network specifications](#gp_network)
+ [Amazon EBS specifications](#gp_storage-ebs)
+ [Instance store specifications](#gp_instance-store)
+ [Security specifications](#gp_security)

**Pricing**  
For pricing information, see [Amazon EC2 On-Demand Pricing](https://aws.amazon.com/ec2/pricing/on-demand/).

## Instance families and instance types
<a name="gp_sizes"></a>


| Instance family | Available instance types | 
| --- | --- | 
| M5 | m5.large \| m5.xlarge \| m5.2xlarge \| m5.4xlarge \| m5.8xlarge \| m5.12xlarge \| m5.16xlarge \| m5.24xlarge \| m5.metal | 
| M5a | m5a.large \| m5a.xlarge \| m5a.2xlarge \| m5a.4xlarge \| m5a.8xlarge \| m5a.12xlarge \| m5a.16xlarge \| m5a.24xlarge | 
| M5ad | m5ad.large \| m5ad.xlarge \| m5ad.2xlarge \| m5ad.4xlarge \| m5ad.8xlarge \| m5ad.12xlarge \| m5ad.16xlarge \| m5ad.24xlarge | 
| M5d | m5d.large \| m5d.xlarge \| m5d.2xlarge \| m5d.4xlarge \| m5d.8xlarge \| m5d.12xlarge \| m5d.16xlarge \| m5d.24xlarge \| m5d.metal | 
| M5dn | m5dn.large \| m5dn.xlarge \| m5dn.2xlarge \| m5dn.4xlarge \| m5dn.8xlarge \| m5dn.12xlarge \| m5dn.16xlarge \| m5dn.24xlarge \| m5dn.metal | 
| M5n | m5n.large \| m5n.xlarge \| m5n.2xlarge \| m5n.4xlarge \| m5n.8xlarge \| m5n.12xlarge \| m5n.16xlarge \| m5n.24xlarge \| m5n.metal | 
| M5zn | m5zn.large \| m5zn.xlarge \| m5zn.2xlarge \| m5zn.3xlarge \| m5zn.6xlarge \| m5zn.12xlarge \| m5zn.metal | 
| M6a | m6a.large \| m6a.xlarge \| m6a.2xlarge \| m6a.4xlarge \| m6a.8xlarge \| m6a.12xlarge \| m6a.16xlarge \| m6a.24xlarge \| m6a.32xlarge \| m6a.48xlarge \| m6a.metal | 
| M6g | m6g.medium \| m6g.large \| m6g.xlarge \| m6g.2xlarge \| m6g.4xlarge \| m6g.8xlarge \| m6g.12xlarge \| m6g.16xlarge \| m6g.metal | 
| M6gd | m6gd.medium \| m6gd.large \| m6gd.xlarge \| m6gd.2xlarge \| m6gd.4xlarge \| m6gd.8xlarge \| m6gd.12xlarge \| m6gd.16xlarge \| m6gd.metal | 
| M6i | m6i.large \| m6i.xlarge \| m6i.2xlarge \| m6i.4xlarge \| m6i.8xlarge \| m6i.12xlarge \| m6i.16xlarge \| m6i.24xlarge \| m6i.32xlarge \| m6i.metal | 
| M6id | m6id.large \| m6id.xlarge \| m6id.2xlarge \| m6id.4xlarge \| m6id.8xlarge \| m6id.12xlarge \| m6id.16xlarge \| m6id.24xlarge \| m6id.32xlarge \| m6id.metal | 
| M6idn | m6idn.large \| m6idn.xlarge \| m6idn.2xlarge \| m6idn.4xlarge \| m6idn.8xlarge \| m6idn.12xlarge \| m6idn.16xlarge \| m6idn.24xlarge \| m6idn.32xlarge \| m6idn.metal | 
| M6in | m6in.large \| m6in.xlarge \| m6in.2xlarge \| m6in.4xlarge \| m6in.8xlarge \| m6in.12xlarge \| m6in.16xlarge \| m6in.24xlarge \| m6in.32xlarge \| m6in.metal | 
| M7a | m7a.medium \| m7a.large \| m7a.xlarge \| m7a.2xlarge \| m7a.4xlarge \| m7a.8xlarge \| m7a.12xlarge \| m7a.16xlarge \| m7a.24xlarge \| m7a.32xlarge \| m7a.48xlarge \| m7a.metal-48xl | 
| M7g | m7g.medium \| m7g.large \| m7g.xlarge \| m7g.2xlarge \| m7g.4xlarge \| m7g.8xlarge \| m7g.12xlarge \| m7g.16xlarge \| m7g.metal | 
| M7gd | m7gd.medium \| m7gd.large \| m7gd.xlarge \| m7gd.2xlarge \| m7gd.4xlarge \| m7gd.8xlarge \| m7gd.12xlarge \| m7gd.16xlarge \| m7gd.metal | 
| M7i | m7i.large \| m7i.xlarge \| m7i.2xlarge \| m7i.4xlarge \| m7i.8xlarge \| m7i.12xlarge \| m7i.16xlarge \| m7i.24xlarge \| m7i.48xlarge \| m7i.metal-24xl \| m7i.metal-48xl | 
| M7i-flex | m7i-flex.large \| m7i-flex.xlarge \| m7i-flex.2xlarge \| m7i-flex.4xlarge \| m7i-flex.8xlarge \| m7i-flex.12xlarge \| m7i-flex.16xlarge | 
| M8a | m8a.medium \| m8a.large \| m8a.xlarge \| m8a.2xlarge \| m8a.4xlarge \| m8a.8xlarge \| m8a.12xlarge \| m8a.16xlarge \| m8a.24xlarge \| m8a.48xlarge \| m8a.metal-24xl \| m8a.metal-48xl | 
| M8azn | m8azn.medium \| m8azn.large \| m8azn.xlarge \| m8azn.3xlarge \| m8azn.6xlarge \| m8azn.12xlarge \| m8azn.24xlarge \| m8azn.metal-12xl \| m8azn.metal-24xl | 
| M8g | m8g.medium \| m8g.large \| m8g.xlarge \| m8g.2xlarge \| m8g.4xlarge \| m8g.8xlarge \| m8g.12xlarge \| m8g.16xlarge \| m8g.24xlarge \| m8g.48xlarge \| m8g.metal-24xl \| m8g.metal-48xl | 
| M8gb | m8gb.medium \| m8gb.large \| m8gb.xlarge \| m8gb.2xlarge \| m8gb.4xlarge \| m8gb.8xlarge \| m8gb.12xlarge \| m8gb.16xlarge \| m8gb.24xlarge \| m8gb.48xlarge \| m8gb.metal-24xl \| m8gb.metal-48xl | 
| M8gd | m8gd.medium \| m8gd.large \| m8gd.xlarge \| m8gd.2xlarge \| m8gd.4xlarge \| m8gd.8xlarge \| m8gd.12xlarge \| m8gd.16xlarge \| m8gd.24xlarge \| m8gd.48xlarge \| m8gd.metal-24xl \| m8gd.metal-48xl | 
| M8gn | m8gn.medium \| m8gn.large \| m8gn.xlarge \| m8gn.2xlarge \| m8gn.4xlarge \| m8gn.8xlarge \| m8gn.12xlarge \| m8gn.16xlarge \| m8gn.24xlarge \| m8gn.48xlarge \| m8gn.metal-24xl \| m8gn.metal-48xl | 
| M8i | m8i.large \| m8i.xlarge \| m8i.2xlarge \| m8i.4xlarge \| m8i.8xlarge \| m8i.12xlarge \| m8i.16xlarge \| m8i.24xlarge \| m8i.32xlarge \| m8i.48xlarge \| m8i.96xlarge \| m8i.metal-48xl \| m8i.metal-96xl | 
| M8id | m8id.large \| m8id.xlarge \| m8id.2xlarge \| m8id.4xlarge \| m8id.8xlarge \| m8id.12xlarge \| m8id.16xlarge \| m8id.24xlarge \| m8id.32xlarge \| m8id.48xlarge \| m8id.96xlarge \| m8id.metal-48xl \| m8id.metal-96xl | 
| M8i-flex | m8i-flex.large \| m8i-flex.xlarge \| m8i-flex.2xlarge \| m8i-flex.4xlarge \| m8i-flex.8xlarge \| m8i-flex.12xlarge \| m8i-flex.16xlarge | 
| M8in | m8in.large \| m8in.xlarge \| m8in.2xlarge \| m8in.4xlarge \| m8in.8xlarge \| m8in.12xlarge \| m8in.16xlarge \| m8in.24xlarge \| m8in.32xlarge \| m8in.48xlarge \| m8in.96xlarge | 
| M8idn | m8idn.large \| m8idn.xlarge \| m8idn.2xlarge \| m8idn.4xlarge \| m8idn.8xlarge \| m8idn.12xlarge \| m8idn.16xlarge \| m8idn.24xlarge \| m8idn.32xlarge \| m8idn.48xlarge \| m8idn.96xlarge | 
| M8ine | m8ine.large \| m8ine.xlarge \| m8ine.2xlarge \| m8ine.4xlarge \| m8ine.8xlarge \| m8ine.12xlarge | 
| M8ib | m8ib.large \| m8ib.xlarge \| m8ib.2xlarge \| m8ib.4xlarge \| m8ib.8xlarge \| m8ib.12xlarge \| m8ib.16xlarge \| m8ib.24xlarge \| m8ib.32xlarge \| m8ib.48xlarge \| m8ib.96xlarge | 
| M8idb | m8idb.large \| m8idb.xlarge \| m8idb.2xlarge \| m8idb.4xlarge \| m8idb.8xlarge \| m8idb.12xlarge \| m8idb.16xlarge \| m8idb.24xlarge \| m8idb.32xlarge \| m8idb.48xlarge \| m8idb.96xlarge | 
| M9g | m9g.medium \| m9g.large \| m9g.xlarge \| m9g.2xlarge \| m9g.4xlarge \| m9g.8xlarge \| m9g.12xlarge \| m9g.16xlarge \| m9g.24xlarge \| m9g.48xlarge \| m9g.metal-48xl | 
| M9gd | m9gd.medium \| m9gd.large \| m9gd.xlarge \| m9gd.2xlarge \| m9gd.4xlarge \| m9gd.8xlarge \| m9gd.12xlarge \| m9gd.16xlarge \| m9gd.24xlarge \| m9gd.48xlarge \| m9gd.metal-48xl | 
| Mac1 | mac1.metal | 
| Mac2 | mac2.metal | 
| Mac2-m1ultra | mac2-m1ultra.metal | 
| Mac2-m2 | mac2-m2.metal | 
| Mac2-m2pro | mac2-m2pro.metal | 
| Mac-m4 | mac-m4.metal | 
| Mac-m4pro | mac-m4pro.metal | 
| Mac-m4max | mac-m4max.metal | 
| T2 | t2.nano \| t2.micro \| t2.small \| t2.medium \| t2.large \| t2.xlarge \| t2.2xlarge | 
| T3 | t3.nano \| t3.micro \| t3.small \| t3.medium \| t3.large \| t3.xlarge \| t3.2xlarge | 
| T3a | t3a.nano \| t3a.micro \| t3a.small \| t3a.medium \| t3a.large \| t3a.xlarge \| t3a.2xlarge | 
| T4g | t4g.nano \| t4g.micro \| t4g.small \| t4g.medium \| t4g.large \| t4g.xlarge \| t4g.2xlarge | 

## Instance family summary
<a name="gp_summary"></a>


| Instance family | Hypervisor | Processor type (architecture) | Metal instances available | Dedicated Hosts support | Spot support | Hibernation support | Supported operating systems | 
| --- | --- | --- | --- | --- | --- | --- | --- | 
| M5 | [Nitro v2](ec2-nitro-instances.md) | Intel (x86\_64) | ✓ Yes | ✓ Yes | ✓ Yes | ✓ Yes | Windows \| Linux | 
| M5a | [Nitro v2](ec2-nitro-instances.md) | AMD (x86\_64) | ✗ No | ✗ No | ✓ Yes | ✓ Yes | Windows \| Linux | 
| M5ad | [Nitro v2](ec2-nitro-instances.md) | AMD (x86\_64) | ✗ No | ✗ No | ✓ Yes | ✓ Yes | Windows \| Linux | 
| M5d | [Nitro v2](ec2-nitro-instances.md) | Intel (x86\_64) | ✓ Yes | ✓ Yes | ✓ Yes | ✓ Yes | Windows \| Linux | 
| M5dn | [Nitro v3](ec2-nitro-instances.md) | Intel (x86\_64) | ✓ Yes | ✓ Yes | ✓ Yes | ✗ No | Windows \| Linux | 
| M5n | [Nitro v3](ec2-nitro-instances.md) | Intel (x86\_64) | ✓ Yes | ✓ Yes | ✓ Yes | ✗ No | Windows \| Linux | 
| M5zn | [Nitro v3](ec2-nitro-instances.md) | Intel (x86\_64) | ✓ Yes | ✓ Yes | ✓ Yes | ✗ No | Windows \| Linux | 
| M6a | [Nitro v4](ec2-nitro-instances.md) | AMD (x86\_64) | ✓ Yes | ✓ Yes | ✓ Yes | ✓ Yes | Windows \| Linux | 
| M6g | [Nitro v2](ec2-nitro-instances.md) | AWS Graviton (arm64) | ✓ Yes | ✓ Yes | ✓ Yes | ✓ Yes | Linux | 
| M6gd | [Nitro v2](ec2-nitro-instances.md) | AWS Graviton (arm64) | ✓ Yes | ✓ Yes | ✓ Yes | ✓ Yes | Linux | 
| M6i | [Nitro v4](ec2-nitro-instances.md) | Intel (x86\_64) | ✓ Yes | ✓ Yes | ✓ Yes | ✓ Yes | Windows \| Linux | 
| M6id | [Nitro v4](ec2-nitro-instances.md) | Intel (x86\_64) | ✓ Yes | ✓ Yes | ✓ Yes | ✓ Yes | Windows \| Linux | 
| M6idn | [Nitro v4](ec2-nitro-instances.md) | Intel (x86\_64) | ✓ Yes | ✓ Yes | ✓ Yes | ✓ Yes | Windows \| Linux | 
| M6in | [Nitro v4](ec2-nitro-instances.md) | Intel (x86\_64) | ✓ Yes | ✓ Yes | ✓ Yes | ✓ Yes | Windows \| Linux | 
| M7a | [Nitro v4](ec2-nitro-instances.md) | AMD (x86\_64) | ✓ Yes | ✓ Yes | ✓ Yes | ✓ Yes | Windows \| Linux | 
| M7g | [Nitro v4](ec2-nitro-instances.md) | AWS Graviton (arm64) | ✓ Yes | ✓ Yes | ✓ Yes | ✓ Yes | Linux | 
| M7gd | [Nitro v4](ec2-nitro-instances.md) | AWS Graviton (arm64) | ✓ Yes | ✓ Yes | ✓ Yes | ✓ Yes | Linux | 
| M7i | [Nitro v4](ec2-nitro-instances.md) | Intel (x86\_64) | ✓ Yes | ✓ Yes | ✓ Yes | ✓ Yes | Windows \| Linux | 
| M7i-flex | [Nitro v4](ec2-nitro-instances.md) | Intel (x86\_64) | ✗ No | ✗ No | ✓ Yes | ✓ Yes | Windows \| Linux | 
| M8a | [Nitro v6](ec2-nitro-instances.md) | AMD (x86\_64) | ✓ Yes | ✓ Yes | ✓ Yes | ✓ Yes | Windows \| Linux | 
| M8azn | [Nitro v6](ec2-nitro-instances.md) | AMD (x86\_64) | ✓ Yes | ✓ Yes | ✓ Yes | ✓ Yes | Windows \| Linux | 
| M8g | [Nitro v5](ec2-nitro-instances.md) | AWS Graviton (arm64) | ✓ Yes | ✓ Yes | ✓ Yes | ✓ Yes | Linux | 
| M8gb | [Nitro v6](ec2-nitro-instances.md) | AWS Graviton (arm64) | ✓ Yes | ✓ Yes | ✓ Yes | ✓ Yes | Linux | 
| M8gd | [Nitro v5](ec2-nitro-instances.md) | AWS Graviton (arm64) | ✓ Yes | ✓ Yes | ✓ Yes | ✓ Yes | Linux | 
| M8gn | [Nitro v6](ec2-nitro-instances.md) | AWS Graviton (arm64) | ✓ Yes | ✓ Yes | ✓ Yes | ✓ Yes | Linux | 
| M8i | [Nitro v6](ec2-nitro-instances.md) | Intel (x86\_64) | ✓ Yes | ✓ Yes | ✓ Yes | ✓ Yes | Windows \| Linux | 
| M8id | [Nitro v6](ec2-nitro-instances.md) | Intel (x86\_64) | ✓ Yes | ✓ Yes | ✓ Yes | ✗ No | Windows \| Linux | 
| M8i-flex | [Nitro v6](ec2-nitro-instances.md) | Intel (x86\_64) | ✗ No | ✗ No | ✓ Yes | ✓ Yes | Windows \| Linux | 
| M8in | [Nitro v6](ec2-nitro-instances.md) | Intel (x86\_64) | ✗ No | ✓ Yes | ✓ Yes | ✓ Yes | Windows \| Linux | 
| M8idn | [Nitro v6](ec2-nitro-instances.md) | Intel (x86\_64) | ✗ No | ✓ Yes | ✓ Yes | ✓ Yes | Windows \| Linux | 
| M8ine | [Nitro v6](ec2-nitro-instances.md) | Intel (x86\_64) | ✗ No | ✗ No | ✗ No | ✗ No | Windows \| Linux | 
| M8ib | [Nitro v6](ec2-nitro-instances.md) | Intel (x86\_64) | ✗ No | ✓ Yes | ✓ Yes | ✓ Yes | Windows \| Linux | 
| M8idb | [Nitro v6](ec2-nitro-instances.md) | Intel (x86\_64) | ✗ No | ✓ Yes | ✓ Yes | ✓ Yes | Windows \| Linux | 
| M9g | [Nitro v6](ec2-nitro-instances.md) | AWS Graviton5 (arm64) | ✓ Yes | ✓ Yes | ✓ Yes | ✓ Yes | Linux | 
| M9gd | [Nitro v6](ec2-nitro-instances.md) | AWS Graviton5 (arm64) | ✓ Yes | ✓ Yes | ✓ Yes | ✓ Yes | Linux | 
| Mac1 | [Nitro v2](ec2-nitro-instances.md) | Intel (x86\_64\_mac) | ✓ Yes | ✓ Yes | ✗ No | ✗ No | Linux | 
| Mac2 | [Nitro v2](ec2-nitro-instances.md) | Apple (arm64\_mac) | ✓ Yes | ✓ Yes | ✗ No | ✗ No | Linux | 
| Mac2-m1ultra | [Nitro v2](ec2-nitro-instances.md) | Apple (arm64\_mac) | ✓ Yes | ✓ Yes | ✗ No | ✗ No | Linux | 
| Mac2-m2 | [Nitro v2](ec2-nitro-instances.md) | Apple (arm64\_mac) | ✓ Yes | ✓ Yes | ✗ No | ✗ No | Linux | 
| Mac2-m2pro | [Nitro v2](ec2-nitro-instances.md) | Apple (arm64\_mac) | ✓ Yes | ✓ Yes | ✗ No | ✗ No | Linux | 
| Mac-m4 | [Nitro v5](ec2-nitro-instances.md) | Apple (arm64\_mac) | ✓ Yes | ✓ Yes | ✗ No | ✗ No | Linux | 
| Mac-m4pro | [Nitro v5](ec2-nitro-instances.md) | Apple (arm64\_mac) | ✓ Yes | ✓ Yes | ✗ No | ✗ No | Linux | 
| Mac-m4max | [Nitro v2](ec2-nitro-instances.md) | Apple (arm64\_mac) | ✓ Yes | ✓ Yes | ✗ No | ✗ No | Linux | 
| T2 | Xen | Intel (x86\_64) | ✗ No | ✗ No | ✓ Yes | ✓ Yes | Windows \| Linux | 
| T3 | [Nitro v2](ec2-nitro-instances.md) | Intel (x86\_64) | ✗ No | ✓ Yes | ✓ Yes | ✓ Yes | Windows \| Linux | 
| T3a | [Nitro v2](ec2-nitro-instances.md) | AMD (x86\_64) | ✗ No | ✗ No | ✓ Yes | ✓ Yes | Windows \| Linux | 
| T4g | [Nitro v2](ec2-nitro-instances.md) | AWS Graviton (arm64) | ✗ No | ✗ No | ✓ Yes | ✓ Yes | Linux | 

## Performance specifications
<a name="gp_hardware"></a>


<table>
<thead>
  <tr><th>Instance type</th><th>Memory (GiB)</th><th>Processor</th><th>vCPUs</th><th>CPU cores</th><th>Threads per core</th><th>Accelerators</th><th>Accelerator memory</th></tr>
</thead>
<tbody>
  <tr><td colspan="8">M5</td></tr>
  <tr><td>m5.large</td><td>8.00</td><td>Intel Xeon Platinum 8175</td><td>2</td><td>1</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m5.xlarge</td><td>16.00</td><td>Intel Xeon Platinum 8175</td><td>4</td><td>2</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m5.2xlarge</td><td>32.00</td><td>Intel Xeon Platinum 8175</td><td>8</td><td>4</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m5.4xlarge</td><td>64.00</td><td>Intel Xeon Platinum 8175</td><td>16</td><td>8</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m5.8xlarge</td><td>128.00</td><td>Intel Xeon Platinum 8175</td><td>32</td><td>16</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m5.12xlarge</td><td>192.00</td><td>Intel Xeon Platinum 8175</td><td>48</td><td>24</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m5.16xlarge</td><td>256.00</td><td>Intel Xeon Platinum 8175</td><td>64</td><td>32</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m5.24xlarge</td><td>384.00</td><td>Intel Xeon Platinum 8175</td><td>96</td><td>48</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m5.metal</td><td>384.00</td><td>Intel Xeon Platinum 8175</td><td>96</td><td>48</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">M5a</td></tr>
  <tr><td>m5a.large</td><td>8.00</td><td>AMD EPYC 7571</td><td>2</td><td>1</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m5a.xlarge</td><td>16.00</td><td>AMD EPYC 7571</td><td>4</td><td>2</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m5a.2xlarge</td><td>32.00</td><td>AMD EPYC 7571</td><td>8</td><td>4</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m5a.4xlarge</td><td>64.00</td><td>AMD EPYC 7571</td><td>16</td><td>8</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m5a.8xlarge</td><td>128.00</td><td>AMD EPYC 7571</td><td>32</td><td>16</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m5a.12xlarge</td><td>192.00</td><td>AMD EPYC 7571</td><td>48</td><td>24</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m5a.16xlarge</td><td>256.00</td><td>AMD EPYC 7571</td><td>64</td><td>32</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m5a.24xlarge</td><td>384.00</td><td>AMD EPYC 7571</td><td>96</td><td>48</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">M5ad</td></tr>
  <tr><td>m5ad.large</td><td>8.00</td><td>AMD EPYC 7571</td><td>2</td><td>1</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m5ad.xlarge</td><td>16.00</td><td>AMD EPYC 7571</td><td>4</td><td>2</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m5ad.2xlarge</td><td>32.00</td><td>AMD EPYC 7571</td><td>8</td><td>4</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m5ad.4xlarge</td><td>64.00</td><td>AMD EPYC 7571</td><td>16</td><td>8</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m5ad.8xlarge</td><td>128.00</td><td>AMD EPYC 7571</td><td>32</td><td>16</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m5ad.12xlarge</td><td>192.00</td><td>AMD EPYC 7571</td><td>48</td><td>24</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m5ad.16xlarge</td><td>256.00</td><td>AMD EPYC 7571</td><td>64</td><td>32</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m5ad.24xlarge</td><td>384.00</td><td>AMD EPYC 7571</td><td>96</td><td>48</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">M5d</td></tr>
  <tr><td>m5d.large</td><td>8.00</td><td>Intel Xeon Platinum 8175</td><td>2</td><td>1</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m5d.xlarge</td><td>16.00</td><td>Intel Xeon Platinum 8175</td><td>4</td><td>2</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m5d.2xlarge</td><td>32.00</td><td>Intel Xeon Platinum 8175</td><td>8</td><td>4</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m5d.4xlarge</td><td>64.00</td><td>Intel Xeon Platinum 8175</td><td>16</td><td>8</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m5d.8xlarge</td><td>128.00</td><td>Intel Xeon Platinum 8175</td><td>32</td><td>16</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m5d.12xlarge</td><td>192.00</td><td>Intel Xeon Platinum 8175</td><td>48</td><td>24</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m5d.16xlarge</td><td>256.00</td><td>Intel Xeon Platinum 8175</td><td>64</td><td>32</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m5d.24xlarge</td><td>384.00</td><td>Intel Xeon Platinum 8175</td><td>96</td><td>48</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m5d.metal</td><td>384.00</td><td>Intel Xeon Platinum 8175</td><td>96</td><td>48</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">M5dn</td></tr>
  <tr><td>m5dn.large</td><td>8.00</td><td>Intel Xeon Platinum 8259</td><td>2</td><td>1</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m5dn.xlarge</td><td>16.00</td><td>Intel Xeon Platinum 8259</td><td>4</td><td>2</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m5dn.2xlarge</td><td>32.00</td><td>Intel Xeon Platinum 8259</td><td>8</td><td>4</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m5dn.4xlarge</td><td>64.00</td><td>Intel Xeon Platinum 8259</td><td>16</td><td>8</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m5dn.8xlarge</td><td>128.00</td><td>Intel Xeon Platinum 8259</td><td>32</td><td>16</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m5dn.12xlarge</td><td>192.00</td><td>Intel Xeon Platinum 8259</td><td>48</td><td>24</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m5dn.16xlarge</td><td>256.00</td><td>Intel Xeon Platinum 8259</td><td>64</td><td>32</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m5dn.24xlarge</td><td>384.00</td><td>Intel Xeon Platinum 8259</td><td>96</td><td>48</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m5dn.metal</td><td>384.00</td><td>Intel Xeon Platinum 8259</td><td>96</td><td>48</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">M5n</td></tr>
  <tr><td>m5n.large</td><td>8.00</td><td>Intel Xeon Platinum 8259</td><td>2</td><td>1</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m5n.xlarge</td><td>16.00</td><td>Intel Xeon Platinum 8259</td><td>4</td><td>2</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m5n.2xlarge</td><td>32.00</td><td>Intel Xeon Platinum 8259</td><td>8</td><td>4</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m5n.4xlarge</td><td>64.00</td><td>Intel Xeon Platinum 8259</td><td>16</td><td>8</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m5n.8xlarge</td><td>128.00</td><td>Intel Xeon Platinum 8259</td><td>32</td><td>16</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m5n.12xlarge</td><td>192.00</td><td>Intel Xeon Platinum 8259</td><td>48</td><td>24</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m5n.16xlarge</td><td>256.00</td><td>Intel Xeon Platinum 8259</td><td>64</td><td>32</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m5n.24xlarge</td><td>384.00</td><td>Intel Xeon Platinum 8259</td><td>96</td><td>48</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m5n.metal</td><td>384.00</td><td>Intel Xeon Platinum 8259</td><td>96</td><td>48</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">M5zn</td></tr>
  <tr><td>m5zn.large</td><td>8.00</td><td>Intel Xeon Platinum 8252</td><td>2</td><td>1</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m5zn.xlarge</td><td>16.00</td><td>Intel Xeon Platinum 8252</td><td>4</td><td>2</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m5zn.2xlarge</td><td>32.00</td><td>Intel Xeon Platinum 8252</td><td>8</td><td>4</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m5zn.3xlarge</td><td>48.00</td><td>Intel Xeon Platinum 8252</td><td>12</td><td>6</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m5zn.6xlarge</td><td>96.00</td><td>Intel Xeon Platinum 8252</td><td>24</td><td>12</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m5zn.12xlarge</td><td>192.00</td><td>Intel Xeon Platinum 8252</td><td>48</td><td>24</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m5zn.metal</td><td>192.00</td><td>Intel Xeon Platinum 8252</td><td>48</td><td>24</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">M6a</td></tr>
  <tr><td>m6a.large</td><td>8.00</td><td>AMD EPYC 7R13</td><td>2</td><td>1</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m6a.xlarge</td><td>16.00</td><td>AMD EPYC 7R13</td><td>4</td><td>2</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m6a.2xlarge</td><td>32.00</td><td>AMD EPYC 7R13</td><td>8</td><td>4</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m6a.4xlarge</td><td>64.00</td><td>AMD EPYC 7R13</td><td>16</td><td>8</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m6a.8xlarge</td><td>128.00</td><td>AMD EPYC 7R13</td><td>32</td><td>16</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m6a.12xlarge</td><td>192.00</td><td>AMD EPYC 7R13</td><td>48</td><td>24</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m6a.16xlarge</td><td>256.00</td><td>AMD EPYC 7R13</td><td>64</td><td>32</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m6a.24xlarge</td><td>384.00</td><td>AMD EPYC 7R13</td><td>96</td><td>48</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m6a.32xlarge</td><td>512.00</td><td>AMD EPYC 7R13</td><td>128</td><td>64</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m6a.48xlarge</td><td>768.00</td><td>AMD EPYC 7R13</td><td>192</td><td>96</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m6a.metal</td><td>768.00</td><td>AMD EPYC 7R13</td><td>192</td><td>96</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">M6g</td></tr>
  <tr><td>m6g.medium</td><td>4.00</td><td>AWS Graviton2 Processor</td><td>1</td><td>1</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m6g.large</td><td>8.00</td><td>AWS Graviton2 Processor</td><td>2</td><td>2</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m6g.xlarge</td><td>16.00</td><td>AWS Graviton2 Processor</td><td>4</td><td>4</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m6g.2xlarge</td><td>32.00</td><td>AWS Graviton2 Processor</td><td>8</td><td>8</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m6g.4xlarge</td><td>64.00</td><td>AWS Graviton2 Processor</td><td>16</td><td>16</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m6g.8xlarge</td><td>128.00</td><td>AWS Graviton2 Processor</td><td>32</td><td>32</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m6g.12xlarge</td><td>192.00</td><td>AWS Graviton2 Processor</td><td>48</td><td>48</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m6g.16xlarge</td><td>256.00</td><td>AWS Graviton2 Processor</td><td>64</td><td>64</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m6g.metal</td><td>256.00</td><td>AWS Graviton2 Processor</td><td>64</td><td>64</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">M6gd</td></tr>
  <tr><td>m6gd.medium</td><td>4.00</td><td>AWS Graviton2 Processor</td><td>1</td><td>1</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m6gd.large</td><td>8.00</td><td>AWS Graviton2 Processor</td><td>2</td><td>2</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m6gd.xlarge</td><td>16.00</td><td>AWS Graviton2 Processor</td><td>4</td><td>4</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m6gd.2xlarge</td><td>32.00</td><td>AWS Graviton2 Processor</td><td>8</td><td>8</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m6gd.4xlarge</td><td>64.00</td><td>AWS Graviton2 Processor</td><td>16</td><td>16</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m6gd.8xlarge</td><td>128.00</td><td>AWS Graviton2 Processor</td><td>32</td><td>32</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m6gd.12xlarge</td><td>192.00</td><td>AWS Graviton2 Processor</td><td>48</td><td>48</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m6gd.16xlarge</td><td>256.00</td><td>AWS Graviton2 Processor</td><td>64</td><td>64</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m6gd.metal</td><td>256.00</td><td>AWS Graviton2 Processor</td><td>64</td><td>64</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">M6i</td></tr>
  <tr><td>m6i.large</td><td>8.00</td><td>Intel Xeon Ice Lake</td><td>2</td><td>1</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m6i.xlarge</td><td>16.00</td><td>Intel Xeon Ice Lake</td><td>4</td><td>2</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m6i.2xlarge</td><td>32.00</td><td>Intel Xeon Ice Lake</td><td>8</td><td>4</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m6i.4xlarge</td><td>64.00</td><td>Intel Xeon Ice Lake</td><td>16</td><td>8</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m6i.8xlarge</td><td>128.00</td><td>Intel Xeon Ice Lake</td><td>32</td><td>16</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m6i.12xlarge</td><td>192.00</td><td>Intel Xeon Ice Lake</td><td>48</td><td>24</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m6i.16xlarge</td><td>256.00</td><td>Intel Xeon Ice Lake</td><td>64</td><td>32</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m6i.24xlarge</td><td>384.00</td><td>Intel Xeon Ice Lake</td><td>96</td><td>48</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m6i.32xlarge</td><td>512.00</td><td>Intel Xeon Ice Lake</td><td>128</td><td>64</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m6i.metal</td><td>512.00</td><td>Intel Xeon Ice Lake</td><td>128</td><td>64</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">M6id</td></tr>
  <tr><td>m6id.large</td><td>8.00</td><td>Intel Xeon Ice Lake</td><td>2</td><td>1</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m6id.xlarge</td><td>16.00</td><td>Intel Xeon Ice Lake</td><td>4</td><td>2</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m6id.2xlarge</td><td>32.00</td><td>Intel Xeon Ice Lake</td><td>8</td><td>4</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m6id.4xlarge</td><td>64.00</td><td>Intel Xeon Ice Lake</td><td>16</td><td>8</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m6id.8xlarge</td><td>128.00</td><td>Intel Xeon Ice Lake</td><td>32</td><td>16</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m6id.12xlarge</td><td>192.00</td><td>Intel Xeon Ice Lake</td><td>48</td><td>24</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m6id.16xlarge</td><td>256.00</td><td>Intel Xeon Ice Lake</td><td>64</td><td>32</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m6id.24xlarge</td><td>384.00</td><td>Intel Xeon Ice Lake</td><td>96</td><td>48</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m6id.32xlarge</td><td>512.00</td><td>Intel Xeon Ice Lake</td><td>128</td><td>64</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m6id.metal</td><td>512.00</td><td>Intel Xeon Ice Lake</td><td>128</td><td>64</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">M6idn</td></tr>
  <tr><td>m6idn.large</td><td>8.00</td><td>Intel Xeon Ice Lake</td><td>2</td><td>1</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m6idn.xlarge</td><td>16.00</td><td>Intel Xeon Ice Lake</td><td>4</td><td>2</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m6idn.2xlarge</td><td>32.00</td><td>Intel Xeon Ice Lake</td><td>8</td><td>4</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m6idn.4xlarge</td><td>64.00</td><td>Intel Xeon Ice Lake</td><td>16</td><td>8</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m6idn.8xlarge</td><td>128.00</td><td>Intel Xeon Ice Lake</td><td>32</td><td>16</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m6idn.12xlarge</td><td>192.00</td><td>Intel Xeon Ice Lake</td><td>48</td><td>24</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m6idn.16xlarge</td><td>256.00</td><td>Intel Xeon Ice Lake</td><td>64</td><td>32</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m6idn.24xlarge</td><td>384.00</td><td>Intel Xeon Ice Lake</td><td>96</td><td>48</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m6idn.32xlarge</td><td>512.00</td><td>Intel Xeon Ice Lake</td><td>128</td><td>64</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m6idn.metal</td><td>512.00</td><td>Intel Xeon Ice Lake</td><td>128</td><td>64</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">M6in</td></tr>
  <tr><td>m6in.large</td><td>8.00</td><td>Intel Xeon Ice Lake</td><td>2</td><td>1</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m6in.xlarge</td><td>16.00</td><td>Intel Xeon Ice Lake</td><td>4</td><td>2</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m6in.2xlarge</td><td>32.00</td><td>Intel Xeon Ice Lake</td><td>8</td><td>4</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m6in.4xlarge</td><td>64.00</td><td>Intel Xeon Ice Lake</td><td>16</td><td>8</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m6in.8xlarge</td><td>128.00</td><td>Intel Xeon Ice Lake</td><td>32</td><td>16</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m6in.12xlarge</td><td>192.00</td><td>Intel Xeon Ice Lake</td><td>48</td><td>24</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m6in.16xlarge</td><td>256.00</td><td>Intel Xeon Ice Lake</td><td>64</td><td>32</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m6in.24xlarge</td><td>384.00</td><td>Intel Xeon Ice Lake</td><td>96</td><td>48</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m6in.32xlarge</td><td>512.00</td><td>Intel Xeon Ice Lake</td><td>128</td><td>64</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m6in.metal</td><td>512.00</td><td>Intel Xeon Ice Lake</td><td>128</td><td>64</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">M7a</td></tr>
  <tr><td>m7a.medium</td><td>4.00</td><td>AMD EPYC 9R14</td><td>1</td><td>1</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m7a.large</td><td>8.00</td><td>AMD EPYC 9R14</td><td>2</td><td>2</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m7a.xlarge</td><td>16.00</td><td>AMD EPYC 9R14</td><td>4</td><td>4</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m7a.2xlarge</td><td>32.00</td><td>AMD EPYC 9R14</td><td>8</td><td>8</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m7a.4xlarge</td><td>64.00</td><td>AMD EPYC 9R14</td><td>16</td><td>16</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m7a.8xlarge</td><td>128.00</td><td>AMD EPYC 9R14</td><td>32</td><td>32</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m7a.12xlarge</td><td>192.00</td><td>AMD EPYC 9R14</td><td>48</td><td>48</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m7a.16xlarge</td><td>256.00</td><td>AMD EPYC 9R14</td><td>64</td><td>64</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m7a.24xlarge</td><td>384.00</td><td>AMD EPYC 9R14</td><td>96</td><td>96</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m7a.32xlarge</td><td>512.00</td><td>AMD EPYC 9R14</td><td>128</td><td>128</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m7a.48xlarge</td><td>768.00</td><td>AMD EPYC 9R14</td><td>192</td><td>192</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m7a.metal-48xl</td><td>768.00</td><td>AMD EPYC 9R14</td><td>192</td><td>192</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">M7g</td></tr>
  <tr><td>m7g.medium</td><td>4.00</td><td>AWS Graviton3 Processor</td><td>1</td><td>1</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m7g.large</td><td>8.00</td><td>AWS Graviton3 Processor</td><td>2</td><td>2</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m7g.xlarge</td><td>16.00</td><td>AWS Graviton3 Processor</td><td>4</td><td>4</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m7g.2xlarge</td><td>32.00</td><td>AWS Graviton3 Processor</td><td>8</td><td>8</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m7g.4xlarge</td><td>64.00</td><td>AWS Graviton3 Processor</td><td>16</td><td>16</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m7g.8xlarge</td><td>128.00</td><td>AWS Graviton3 Processor</td><td>32</td><td>32</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m7g.12xlarge</td><td>192.00</td><td>AWS Graviton3 Processor</td><td>48</td><td>48</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m7g.16xlarge</td><td>256.00</td><td>AWS Graviton3 Processor</td><td>64</td><td>64</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m7g.metal</td><td>256.00</td><td>AWS Graviton3 Processor</td><td>64</td><td>64</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">M7gd</td></tr>
  <tr><td>m7gd.medium</td><td>4.00</td><td>AWS Graviton3 Processor</td><td>1</td><td>1</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m7gd.large</td><td>8.00</td><td>AWS Graviton3 Processor</td><td>2</td><td>2</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m7gd.xlarge</td><td>16.00</td><td>AWS Graviton3 Processor</td><td>4</td><td>4</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m7gd.2xlarge</td><td>32.00</td><td>AWS Graviton3 Processor</td><td>8</td><td>8</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m7gd.4xlarge</td><td>64.00</td><td>AWS Graviton3 Processor</td><td>16</td><td>16</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m7gd.8xlarge</td><td>128.00</td><td>AWS Graviton3 Processor</td><td>32</td><td>32</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m7gd.12xlarge</td><td>192.00</td><td>AWS Graviton3 Processor</td><td>48</td><td>48</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m7gd.16xlarge</td><td>256.00</td><td>AWS Graviton3 Processor</td><td>64</td><td>64</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m7gd.metal</td><td>256.00</td><td>AWS Graviton3 Processor</td><td>64</td><td>64</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">M7i</td></tr>
  <tr><td>m7i.large</td><td>8.00</td><td>Intel Xeon Sapphire Rapids</td><td>2</td><td>1</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m7i.xlarge</td><td>16.00</td><td>Intel Xeon Sapphire Rapids</td><td>4</td><td>2</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m7i.2xlarge</td><td>32.00</td><td>Intel Xeon Sapphire Rapids</td><td>8</td><td>4</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m7i.4xlarge</td><td>64.00</td><td>Intel Xeon Sapphire Rapids</td><td>16</td><td>8</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m7i.8xlarge</td><td>128.00</td><td>Intel Xeon Sapphire Rapids</td><td>32</td><td>16</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m7i.12xlarge</td><td>192.00</td><td>Intel Xeon Sapphire Rapids</td><td>48</td><td>24</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m7i.16xlarge</td><td>256.00</td><td>Intel Xeon Sapphire Rapids</td><td>64</td><td>32</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m7i.24xlarge</td><td>384.00</td><td>Intel Xeon Sapphire Rapids</td><td>96</td><td>48</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m7i.48xlarge</td><td>768.00</td><td>Intel Xeon Sapphire Rapids</td><td>192</td><td>96</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m7i.metal-24xl</td><td>384.00</td><td>Intel Xeon Sapphire Rapids</td><td>96</td><td>48</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m7i.metal-48xl</td><td>768.00</td><td>Intel Xeon Sapphire Rapids</td><td>192</td><td>96</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">M7i-flex</td></tr>
  <tr><td>m7i-flex.large</td><td>8.00</td><td>Intel Xeon Sapphire Rapids</td><td>2</td><td>1</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m7i-flex.xlarge</td><td>16.00</td><td>Intel Xeon Sapphire Rapids</td><td>4</td><td>2</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m7i-flex.2xlarge</td><td>32.00</td><td>Intel Xeon Sapphire Rapids</td><td>8</td><td>4</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m7i-flex.4xlarge</td><td>64.00</td><td>Intel Xeon Sapphire Rapids</td><td>16</td><td>8</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m7i-flex.8xlarge</td><td>128.00</td><td>Intel Xeon Sapphire Rapids</td><td>32</td><td>16</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m7i-flex.12xlarge</td><td>192.00</td><td>Intel Xeon Sapphire Rapids</td><td>48</td><td>24</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m7i-flex.16xlarge</td><td>256.00</td><td>Intel Xeon Sapphire Rapids</td><td>64</td><td>32</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">M8a</td></tr>
  <tr><td>m8a.medium</td><td>4.00</td><td>AMD EPYC 9R45</td><td>1</td><td>1</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8a.large</td><td>8.00</td><td>AMD EPYC 9R45</td><td>2</td><td>2</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8a.xlarge</td><td>16.00</td><td>AMD EPYC 9R45</td><td>4</td><td>4</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8a.2xlarge</td><td>32.00</td><td>AMD EPYC 9R45</td><td>8</td><td>8</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8a.4xlarge</td><td>64.00</td><td>AMD EPYC 9R45</td><td>16</td><td>16</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8a.8xlarge</td><td>128.00</td><td>AMD EPYC 9R45</td><td>32</td><td>32</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8a.12xlarge</td><td>192.00</td><td>AMD EPYC 9R45</td><td>48</td><td>48</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8a.16xlarge</td><td>256.00</td><td>AMD EPYC 9R45</td><td>64</td><td>64</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8a.24xlarge</td><td>384.00</td><td>AMD EPYC 9R45</td><td>96</td><td>96</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8a.48xlarge</td><td>768.00</td><td>AMD EPYC 9R45</td><td>192</td><td>192</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8a.metal-24xl</td><td>384.00</td><td>AMD EPYC 9R45</td><td>96</td><td>96</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8a.metal-48xl</td><td>768.00</td><td>AMD EPYC 9R45</td><td>192</td><td>192</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">M8azn</td></tr>
  <tr><td>m8azn.medium</td><td>4.00</td><td>AMD EPYC 9R05</td><td>1</td><td>1</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8azn.large</td><td>8.00</td><td>AMD EPYC 9R05</td><td>2</td><td>2</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8azn.xlarge</td><td>16.00</td><td>AMD EPYC 9R05</td><td>4</td><td>4</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8azn.3xlarge</td><td>48.00</td><td>AMD EPYC 9R05</td><td>12</td><td>12</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8azn.6xlarge</td><td>96.00</td><td>AMD EPYC 9R05</td><td>24</td><td>24</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8azn.12xlarge</td><td>192.00</td><td>AMD EPYC 9R05</td><td>48</td><td>48</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8azn.24xlarge</td><td>384.00</td><td>AMD EPYC 9R05</td><td>96</td><td>96</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8azn.metal-12xl</td><td>192.00</td><td>AMD EPYC 9R05</td><td>48</td><td>48</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8azn.metal-24xl</td><td>384.00</td><td>AMD EPYC 9R05</td><td>96</td><td>96</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">M8g</td></tr>
  <tr><td>m8g.medium</td><td>4.00</td><td>AWS Graviton4 Processor</td><td>1</td><td>1</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8g.large</td><td>8.00</td><td>AWS Graviton4 Processor</td><td>2</td><td>2</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8g.xlarge</td><td>16.00</td><td>AWS Graviton4 Processor</td><td>4</td><td>4</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8g.2xlarge</td><td>32.00</td><td>AWS Graviton4 Processor</td><td>8</td><td>8</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8g.4xlarge</td><td>64.00</td><td>AWS Graviton4 Processor</td><td>16</td><td>16</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8g.8xlarge</td><td>128.00</td><td>AWS Graviton4 Processor</td><td>32</td><td>32</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8g.12xlarge</td><td>192.00</td><td>AWS Graviton4 Processor</td><td>48</td><td>48</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8g.16xlarge</td><td>256.00</td><td>AWS Graviton4 Processor</td><td>64</td><td>64</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8g.24xlarge</td><td>384.00</td><td>AWS Graviton4 Processor</td><td>96</td><td>96</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8g.48xlarge</td><td>768.00</td><td>AWS Graviton4 Processor</td><td>192</td><td>192</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8g.metal-24xl</td><td>384.00</td><td>AWS Graviton4 Processor</td><td>96</td><td>96</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8g.metal-48xl</td><td>768.00</td><td>AWS Graviton4 Processor</td><td>192</td><td>192</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">M8gb</td></tr>
  <tr><td>m8gb.medium</td><td>4.00</td><td>AWS Graviton4 Processor</td><td>1</td><td>1</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8gb.large</td><td>8.00</td><td>AWS Graviton4 Processor</td><td>2</td><td>2</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8gb.xlarge</td><td>16.00</td><td>AWS Graviton4 Processor</td><td>4</td><td>4</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8gb.2xlarge</td><td>32.00</td><td>AWS Graviton4 Processor</td><td>8</td><td>8</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8gb.4xlarge</td><td>64.00</td><td>AWS Graviton4 Processor</td><td>16</td><td>16</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8gb.8xlarge</td><td>128.00</td><td>AWS Graviton4 Processor</td><td>32</td><td>32</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8gb.12xlarge</td><td>192.00</td><td>AWS Graviton4 Processor</td><td>48</td><td>48</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8gb.16xlarge</td><td>256.00</td><td>AWS Graviton4 Processor</td><td>64</td><td>64</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8gb.24xlarge</td><td>384.00</td><td>AWS Graviton4 Processor</td><td>96</td><td>96</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8gb.48xlarge</td><td>768.00</td><td>AWS Graviton4 Processor</td><td>192</td><td>192</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8gb.metal-24xl</td><td>384.00</td><td>AWS Graviton4 Processor</td><td>96</td><td>96</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8gb.metal-48xl</td><td>768.00</td><td>AWS Graviton4 Processor</td><td>192</td><td>192</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">M8gd</td></tr>
  <tr><td>m8gd.medium</td><td>4.00</td><td>AWS Graviton4 Processor</td><td>1</td><td>1</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8gd.large</td><td>8.00</td><td>AWS Graviton4 Processor</td><td>2</td><td>2</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8gd.xlarge</td><td>16.00</td><td>AWS Graviton4 Processor</td><td>4</td><td>4</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8gd.2xlarge</td><td>32.00</td><td>AWS Graviton4 Processor</td><td>8</td><td>8</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8gd.4xlarge</td><td>64.00</td><td>AWS Graviton4 Processor</td><td>16</td><td>16</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8gd.8xlarge</td><td>128.00</td><td>AWS Graviton4 Processor</td><td>32</td><td>32</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8gd.12xlarge</td><td>192.00</td><td>AWS Graviton4 Processor</td><td>48</td><td>48</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8gd.16xlarge</td><td>256.00</td><td>AWS Graviton4 Processor</td><td>64</td><td>64</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8gd.24xlarge</td><td>384.00</td><td>AWS Graviton4 Processor</td><td>96</td><td>96</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8gd.48xlarge</td><td>768.00</td><td>AWS Graviton4 Processor</td><td>192</td><td>192</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8gd.metal-24xl</td><td>384.00</td><td>AWS Graviton4 Processor</td><td>96</td><td>96</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8gd.metal-48xl</td><td>768.00</td><td>AWS Graviton4 Processor</td><td>192</td><td>192</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">M8gn</td></tr>
  <tr><td>m8gn.medium</td><td>4.00</td><td>AWS Graviton4 Processor</td><td>1</td><td>1</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8gn.large</td><td>8.00</td><td>AWS Graviton4 Processor</td><td>2</td><td>2</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8gn.xlarge</td><td>16.00</td><td>AWS Graviton4 Processor</td><td>4</td><td>4</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8gn.2xlarge</td><td>32.00</td><td>AWS Graviton4 Processor</td><td>8</td><td>8</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8gn.4xlarge</td><td>64.00</td><td>AWS Graviton4 Processor</td><td>16</td><td>16</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8gn.8xlarge</td><td>128.00</td><td>AWS Graviton4 Processor</td><td>32</td><td>32</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8gn.12xlarge</td><td>192.00</td><td>AWS Graviton4 Processor</td><td>48</td><td>48</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8gn.16xlarge</td><td>256.00</td><td>AWS Graviton4 Processor</td><td>64</td><td>64</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8gn.24xlarge</td><td>384.00</td><td>AWS Graviton4 Processor</td><td>96</td><td>96</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8gn.48xlarge</td><td>768.00</td><td>AWS Graviton4 Processor</td><td>192</td><td>192</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8gn.metal-24xl</td><td>384.00</td><td>AWS Graviton4 Processor</td><td>96</td><td>96</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8gn.metal-48xl</td><td>768.00</td><td>AWS Graviton4 Processor</td><td>192</td><td>192</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">M8i</td></tr>
  <tr><td>m8i.large</td><td>8.00</td><td>Intel Xeon Granite Rapids</td><td>2</td><td>1</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8i.xlarge</td><td>16.00</td><td>Intel Xeon Granite Rapids</td><td>4</td><td>2</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8i.2xlarge</td><td>32.00</td><td>Intel Xeon Granite Rapids</td><td>8</td><td>4</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8i.4xlarge</td><td>64.00</td><td>Intel Xeon Granite Rapids</td><td>16</td><td>8</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8i.8xlarge</td><td>128.00</td><td>Intel Xeon Granite Rapids</td><td>32</td><td>16</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8i.12xlarge</td><td>192.00</td><td>Intel Xeon Granite Rapids</td><td>48</td><td>24</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8i.16xlarge</td><td>256.00</td><td>Intel Xeon Granite Rapids</td><td>64</td><td>32</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8i.24xlarge</td><td>384.00</td><td>Intel Xeon Granite Rapids</td><td>96</td><td>48</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8i.32xlarge</td><td>512.00</td><td>Intel Xeon Granite Rapids</td><td>128</td><td>64</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8i.48xlarge</td><td>768.00</td><td>Intel Xeon Granite Rapids</td><td>192</td><td>96</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8i.96xlarge</td><td>1536.00</td><td>Intel Xeon Granite Rapids</td><td>384</td><td>192</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8i.metal-48xl</td><td>768.00</td><td>Intel Xeon Granite Rapids</td><td>192</td><td>96</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8i.metal-96xl</td><td>1536.00</td><td>Intel Xeon Granite Rapids</td><td>384</td><td>192</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">M8id</td></tr>
  <tr><td>m8id.large</td><td>8.00</td><td>Intel Xeon Granite Rapids</td><td>2</td><td>1</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8id.xlarge</td><td>16.00</td><td>Intel Xeon Granite Rapids</td><td>4</td><td>2</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8id.2xlarge</td><td>32.00</td><td>Intel Xeon Granite Rapids</td><td>8</td><td>4</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8id.4xlarge</td><td>64.00</td><td>Intel Xeon Granite Rapids</td><td>16</td><td>8</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8id.8xlarge</td><td>128.00</td><td>Intel Xeon Granite Rapids</td><td>32</td><td>16</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8id.12xlarge</td><td>192.00</td><td>Intel Xeon Granite Rapids</td><td>48</td><td>24</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8id.16xlarge</td><td>256.00</td><td>Intel Xeon Granite Rapids</td><td>64</td><td>32</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8id.24xlarge</td><td>384.00</td><td>Intel Xeon Granite Rapids</td><td>96</td><td>48</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8id.32xlarge</td><td>512.00</td><td>Intel Xeon Granite Rapids</td><td>128</td><td>64</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8id.48xlarge</td><td>768.00</td><td>Intel Xeon Granite Rapids</td><td>192</td><td>96</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8id.96xlarge</td><td>1536.00</td><td>Intel Xeon Granite Rapids</td><td>384</td><td>192</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8id.metal-48xl</td><td>768.00</td><td>Intel Xeon Granite Rapids</td><td>192</td><td>96</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8id.metal-96xl</td><td>1536.00</td><td>Intel Xeon Granite Rapids</td><td>384</td><td>192</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">M8i-flex</td></tr>
  <tr><td>m8i-flex.large</td><td>8.00</td><td>Intel Xeon Granite Rapids</td><td>2</td><td>1</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8i-flex.xlarge</td><td>16.00</td><td>Intel Xeon Granite Rapids</td><td>4</td><td>2</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8i-flex.2xlarge</td><td>32.00</td><td>Intel Xeon Granite Rapids</td><td>8</td><td>4</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8i-flex.4xlarge</td><td>64.00</td><td>Intel Xeon Granite Rapids</td><td>16</td><td>8</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8i-flex.8xlarge</td><td>128.00</td><td>Intel Xeon Granite Rapids</td><td>32</td><td>16</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8i-flex.12xlarge</td><td>192.00</td><td>Intel Xeon Granite Rapids</td><td>48</td><td>24</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8i-flex.16xlarge</td><td>256.00</td><td>Intel Xeon Granite Rapids</td><td>64</td><td>32</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">M8in</td></tr>
  <tr><td>m8in.large</td><td>8.00</td><td>Intel Xeon Granite Rapids</td><td>2</td><td>1</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8in.xlarge</td><td>16.00</td><td>Intel Xeon Granite Rapids</td><td>4</td><td>2</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8in.2xlarge</td><td>32.00</td><td>Intel Xeon Granite Rapids</td><td>8</td><td>4</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8in.4xlarge</td><td>64.00</td><td>Intel Xeon Granite Rapids</td><td>16</td><td>8</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8in.8xlarge</td><td>128.00</td><td>Intel Xeon Granite Rapids</td><td>32</td><td>16</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8in.12xlarge</td><td>192.00</td><td>Intel Xeon Granite Rapids</td><td>48</td><td>24</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8in.16xlarge</td><td>256.00</td><td>Intel Xeon Granite Rapids</td><td>64</td><td>32</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8in.24xlarge</td><td>384.00</td><td>Intel Xeon Granite Rapids</td><td>96</td><td>48</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8in.32xlarge</td><td>512.00</td><td>Intel Xeon Granite Rapids</td><td>128</td><td>64</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8in.48xlarge</td><td>768.00</td><td>Intel Xeon Granite Rapids</td><td>192</td><td>96</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8in.96xlarge</td><td>1536.00</td><td>Intel Xeon Granite Rapids</td><td>384</td><td>192</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">M8idn</td></tr>
  <tr><td>m8idn.large</td><td>8.00</td><td>Intel Xeon Granite Rapids</td><td>2</td><td>1</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8idn.xlarge</td><td>16.00</td><td>Intel Xeon Granite Rapids</td><td>4</td><td>2</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8idn.2xlarge</td><td>32.00</td><td>Intel Xeon Granite Rapids</td><td>8</td><td>4</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8idn.4xlarge</td><td>64.00</td><td>Intel Xeon Granite Rapids</td><td>16</td><td>8</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8idn.8xlarge</td><td>128.00</td><td>Intel Xeon Granite Rapids</td><td>32</td><td>16</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8idn.12xlarge</td><td>192.00</td><td>Intel Xeon Granite Rapids</td><td>48</td><td>24</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8idn.16xlarge</td><td>256.00</td><td>Intel Xeon Granite Rapids</td><td>64</td><td>32</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8idn.24xlarge</td><td>384.00</td><td>Intel Xeon Granite Rapids</td><td>96</td><td>48</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8idn.32xlarge</td><td>512.00</td><td>Intel Xeon Granite Rapids</td><td>128</td><td>64</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8idn.48xlarge</td><td>768.00</td><td>Intel Xeon Granite Rapids</td><td>192</td><td>96</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8idn.96xlarge</td><td>1536.00</td><td>Intel Xeon Granite Rapids</td><td>384</td><td>192</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">M8ine</td></tr>
  <tr><td>m8ine.large</td><td>8.00</td><td>Intel Xeon Granite Rapids</td><td>2</td><td>1</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8ine.xlarge</td><td>16.00</td><td>Intel Xeon Granite Rapids</td><td>4</td><td>2</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8ine.2xlarge</td><td>32.00</td><td>Intel Xeon Granite Rapids</td><td>8</td><td>4</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8ine.4xlarge</td><td>64.00</td><td>Intel Xeon Granite Rapids</td><td>16</td><td>8</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8ine.8xlarge</td><td>128.00</td><td>Intel Xeon Granite Rapids</td><td>32</td><td>16</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8ine.12xlarge</td><td>192.00</td><td>Intel Xeon Granite Rapids</td><td>48</td><td>24</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">M8ib</td></tr>
  <tr><td>m8ib.large</td><td>8.00</td><td>Intel Xeon Granite Rapids</td><td>2</td><td>1</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8ib.xlarge</td><td>16.00</td><td>Intel Xeon Granite Rapids</td><td>4</td><td>2</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8ib.2xlarge</td><td>32.00</td><td>Intel Xeon Granite Rapids</td><td>8</td><td>4</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8ib.4xlarge</td><td>64.00</td><td>Intel Xeon Granite Rapids</td><td>16</td><td>8</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8ib.8xlarge</td><td>128.00</td><td>Intel Xeon Granite Rapids</td><td>32</td><td>16</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8ib.12xlarge</td><td>192.00</td><td>Intel Xeon Granite Rapids</td><td>48</td><td>24</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8ib.16xlarge</td><td>256.00</td><td>Intel Xeon Granite Rapids</td><td>64</td><td>32</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8ib.24xlarge</td><td>384.00</td><td>Intel Xeon Granite Rapids</td><td>96</td><td>48</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8ib.32xlarge</td><td>512.00</td><td>Intel Xeon Granite Rapids</td><td>128</td><td>64</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8ib.48xlarge</td><td>768.00</td><td>Intel Xeon Granite Rapids</td><td>192</td><td>96</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8ib.96xlarge</td><td>1536.00</td><td>Intel Xeon Granite Rapids</td><td>384</td><td>192</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">M8idb</td></tr>
  <tr><td>m8idb.large</td><td>8.00</td><td>Intel Xeon Granite Rapids</td><td>2</td><td>1</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8idb.xlarge</td><td>16.00</td><td>Intel Xeon Granite Rapids</td><td>4</td><td>2</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8idb.2xlarge</td><td>32.00</td><td>Intel Xeon Granite Rapids</td><td>8</td><td>4</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8idb.4xlarge</td><td>64.00</td><td>Intel Xeon Granite Rapids</td><td>16</td><td>8</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8idb.8xlarge</td><td>128.00</td><td>Intel Xeon Granite Rapids</td><td>32</td><td>16</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8idb.12xlarge</td><td>192.00</td><td>Intel Xeon Granite Rapids</td><td>48</td><td>24</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8idb.16xlarge</td><td>256.00</td><td>Intel Xeon Granite Rapids</td><td>64</td><td>32</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8idb.24xlarge</td><td>384.00</td><td>Intel Xeon Granite Rapids</td><td>96</td><td>48</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8idb.32xlarge</td><td>512.00</td><td>Intel Xeon Granite Rapids</td><td>128</td><td>64</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8idb.48xlarge</td><td>768.00</td><td>Intel Xeon Granite Rapids</td><td>192</td><td>96</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8idb.96xlarge</td><td>1536.00</td><td>Intel Xeon Granite Rapids</td><td>384</td><td>192</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">M9g</td></tr>
  <tr><td>m9g.medium</td><td>4.00</td><td>AWS Graviton5 Processor</td><td>1</td><td>1</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m9g.large</td><td>8.00</td><td>AWS Graviton5 Processor</td><td>2</td><td>2</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m9g.xlarge</td><td>16.00</td><td>AWS Graviton5 Processor</td><td>4</td><td>4</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m9g.2xlarge</td><td>32.00</td><td>AWS Graviton5 Processor</td><td>8</td><td>8</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m9g.4xlarge</td><td>64.00</td><td>AWS Graviton5 Processor</td><td>16</td><td>16</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m9g.8xlarge</td><td>128.00</td><td>AWS Graviton5 Processor</td><td>32</td><td>32</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m9g.12xlarge</td><td>192.00</td><td>AWS Graviton5 Processor</td><td>48</td><td>48</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m9g.16xlarge</td><td>256.00</td><td>AWS Graviton5 Processor</td><td>64</td><td>64</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m9g.24xlarge</td><td>384.00</td><td>AWS Graviton5 Processor</td><td>96</td><td>96</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m9g.48xlarge</td><td>768.00</td><td>AWS Graviton5 Processor</td><td>192</td><td>192</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m9g.metal-48xl</td><td>768.00</td><td>AWS Graviton5 Processor</td><td>192</td><td>192</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">M9gd</td></tr>
  <tr><td>m9gd.medium</td><td>4.00</td><td>AWS Graviton5 Processor</td><td>1</td><td>1</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m9gd.large</td><td>8.00</td><td>AWS Graviton5 Processor</td><td>2</td><td>2</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m9gd.xlarge</td><td>16.00</td><td>AWS Graviton5 Processor</td><td>4</td><td>4</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m9gd.2xlarge</td><td>32.00</td><td>AWS Graviton5 Processor</td><td>8</td><td>8</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m9gd.4xlarge</td><td>64.00</td><td>AWS Graviton5 Processor</td><td>16</td><td>16</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m9gd.8xlarge</td><td>128.00</td><td>AWS Graviton5 Processor</td><td>32</td><td>32</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m9gd.12xlarge</td><td>192.00</td><td>AWS Graviton5 Processor</td><td>48</td><td>48</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m9gd.16xlarge</td><td>256.00</td><td>AWS Graviton5 Processor</td><td>64</td><td>64</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m9gd.24xlarge</td><td>384.00</td><td>AWS Graviton5 Processor</td><td>96</td><td>96</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m9gd.48xlarge</td><td>768.00</td><td>AWS Graviton5 Processor</td><td>192</td><td>192</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m9gd.metal-48xl</td><td>768.00</td><td>AWS Graviton5 Processor</td><td>192</td><td>192</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">Mac1</td></tr>
  <tr><td>mac1.metal</td><td>32.00</td><td>Intel Core i7-8700B</td><td>12</td><td>6</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">Mac2</td></tr>
  <tr><td>mac2.metal</td><td>16.00</td><td>Apple M1 chip with 8-core CPU</td><td>8</td><td>4</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">Mac2-m1ultra</td></tr>
  <tr><td>mac2-m1ultra.metal</td><td>128.00</td><td>Apple M1 Ultra with 20‑core CPU</td><td>20</td><td>20</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">Mac2-m2</td></tr>
  <tr><td>mac2-m2.metal</td><td>24.00</td><td>Apple M2 with 8‑core CPU</td><td>8</td><td>8</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">Mac2-m2pro</td></tr>
  <tr><td>mac2-m2pro.metal</td><td>32.00</td><td>Apple M2 Pro with 12‑core CPU</td><td>12</td><td>12</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">Mac-m4</td></tr>
  <tr><td>mac-m4.metal</td><td>24.00</td><td>Apple M4 with 10‑core CPU</td><td>10</td><td>10</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">Mac-m4pro</td></tr>
  <tr><td>mac-m4pro.metal</td><td>48.00</td><td>Apple M4 with 12‑core CPU</td><td>14</td><td>14</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">Mac-m4max</td></tr>
  <tr><td>mac-m4max.metal</td><td>128.00</td><td>Apple M4 Max with 16‑core CPU</td><td>16</td><td>16</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">T2</td></tr>
  <tr><td>t2.nano 1</td><td>0.50</td><td>Intel Xeon Family</td><td>1</td><td>1</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>t2.micro 1</td><td>1.00</td><td>Intel Xeon Family</td><td>1</td><td>1</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>t2.small 1</td><td>2.00</td><td>Intel Xeon Family</td><td>1</td><td>1</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>t2.medium 1</td><td>4.00</td><td>Intel Broadwell E5-2686v4</td><td>2</td><td>2</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>t2.large 1</td><td>8.00</td><td>Intel Broadwell E5-2686v4</td><td>2</td><td>2</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>t2.xlarge 1</td><td>16.00</td><td>Intel Broadwell E5-2686v4</td><td>4</td><td>4</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>t2.2xlarge 1</td><td>32.00</td><td>Intel Broadwell E5-2686v4</td><td>8</td><td>8</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">T3</td></tr>
  <tr><td>t3.nano 1</td><td>0.50</td><td>Intel Skylake P-8175</td><td>2</td><td>1</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>t3.micro 1</td><td>1.00</td><td>Intel Skylake P-8175</td><td>2</td><td>1</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>t3.small 1</td><td>2.00</td><td>Intel Skylake P-8175</td><td>2</td><td>1</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>t3.medium 1</td><td>4.00</td><td>Intel Skylake P-8175</td><td>2</td><td>1</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>t3.large 1</td><td>8.00</td><td>Intel Skylake P-8175</td><td>2</td><td>1</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>t3.xlarge 1</td><td>16.00</td><td>Intel Skylake P-8175</td><td>4</td><td>2</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>t3.2xlarge 1</td><td>32.00</td><td>Intel Skylake P-8175</td><td>8</td><td>4</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">T3a</td></tr>
  <tr><td>t3a.nano 1</td><td>0.50</td><td>AMD EPYC 7571</td><td>2</td><td>1</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>t3a.micro 1</td><td>1.00</td><td>AMD EPYC 7571</td><td>2</td><td>1</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>t3a.small 1</td><td>2.00</td><td>AMD EPYC 7571</td><td>2</td><td>1</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>t3a.medium 1</td><td>4.00</td><td>AMD EPYC 7571</td><td>2</td><td>1</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>t3a.large 1</td><td>8.00</td><td>AMD EPYC 7571</td><td>2</td><td>1</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>t3a.xlarge 1</td><td>16.00</td><td>AMD EPYC 7571</td><td>4</td><td>2</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>t3a.2xlarge 1</td><td>32.00</td><td>AMD EPYC 7571</td><td>8</td><td>4</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">T4g</td></tr>
  <tr><td>t4g.nano 1</td><td>0.50</td><td>AWS Graviton2 Processor</td><td>2</td><td>2</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>t4g.micro 1</td><td>1.00</td><td>AWS Graviton2 Processor</td><td>2</td><td>2</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>t4g.small 1</td><td>2.00</td><td>AWS Graviton2 Processor</td><td>2</td><td>2</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>t4g.medium 1</td><td>4.00</td><td>AWS Graviton2 Processor</td><td>2</td><td>2</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>t4g.large 1</td><td>8.00</td><td>AWS Graviton2 Processor</td><td>2</td><td>2</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>t4g.xlarge 1</td><td>16.00</td><td>AWS Graviton2 Processor</td><td>4</td><td>4</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>t4g.2xlarge 1</td><td>32.00</td><td>AWS Graviton2 Processor</td><td>8</td><td>8</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
</tbody>
</table>


**Note**  
1 These are burstable instance types that provide a baseline CPU performance with the ability to burst beyond their baseline at any time using CPU credits. For more information, see [ Burstable performance instances](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/burstable-performance-instances.html).

## Network specifications
<a name="gp_network"></a>

**Note**  
M8a, M8g, M8gd, M8i, M8id, M8i-flex instance types support configurable bandwidth weightings. With these instance types, you can optimize an instance's bandwidth for either networking performance or Amazon EBS performance. The following table shows the default networking bandwidth performance for these instance types. For the supported configurable weightings, see [ Configurable bandwidth weighting preferences](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/configure-bandwidth-weighting.html).


<table>
<thead>
  <tr><th>Instance type</th><th>Baseline / Burst bandwidth (Gbps)</th><th>EFA</th><th>ENA</th><th>ENA Express</th><th>Network cards</th><th>Max. network interfaces</th><th>IP addresses per interface</th><th>IPv6</th></tr>
</thead>
<tbody>
  <tr><td colspan="9">M5</td></tr>
  <tr><td>m5.large 1</td><td>0.75 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>m5.xlarge 1</td><td>1.25 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>m5.2xlarge 1</td><td>2.5 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>m5.4xlarge 1</td><td>5.0 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>m5.8xlarge</td><td>10 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>m5.12xlarge</td><td>12 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>m5.16xlarge</td><td>20 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>m5.24xlarge</td><td>25 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>m5.metal</td><td>25 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">M5a</td></tr>
  <tr><td>m5a.large 1</td><td>0.75 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>m5a.xlarge 1</td><td>1.25 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>m5a.2xlarge 1</td><td>2.5 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>m5a.4xlarge 1</td><td>5.0 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>m5a.8xlarge 1</td><td>7.5 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>m5a.12xlarge</td><td>10 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>m5a.16xlarge</td><td>12 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>m5a.24xlarge</td><td>20 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">M5ad</td></tr>
  <tr><td>m5ad.large 1</td><td>0.75 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>m5ad.xlarge 1</td><td>1.25 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>m5ad.2xlarge 1</td><td>2.5 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>m5ad.4xlarge 1</td><td>5.0 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>m5ad.8xlarge 1</td><td>7.5 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>m5ad.12xlarge</td><td>10 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>m5ad.16xlarge</td><td>12 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>m5ad.24xlarge</td><td>20 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">M5d</td></tr>
  <tr><td>m5d.large 1</td><td>0.75 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>m5d.xlarge 1</td><td>1.25 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>m5d.2xlarge 1</td><td>2.5 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>m5d.4xlarge 1</td><td>5.0 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>m5d.8xlarge</td><td>10 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>m5d.12xlarge</td><td>12 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>m5d.16xlarge</td><td>20 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>m5d.24xlarge</td><td>25 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>m5d.metal</td><td>25 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">M5dn</td></tr>
  <tr><td>m5dn.large 1</td><td>2.1 / 25.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>m5dn.xlarge 1</td><td>4.1 / 25.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>m5dn.2xlarge 1</td><td>8.125 / 25.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>m5dn.4xlarge 1</td><td>16.25 / 25.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>m5dn.8xlarge</td><td>25 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>m5dn.12xlarge</td><td>50 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>m5dn.16xlarge</td><td>75 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>m5dn.24xlarge</td><td>100 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>m5dn.metal</td><td>100 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">M5n</td></tr>
  <tr><td>m5n.large 1</td><td>2.1 / 25.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>m5n.xlarge 1</td><td>4.1 / 25.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>m5n.2xlarge 1</td><td>8.125 / 25.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>m5n.4xlarge 1</td><td>16.25 / 25.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>m5n.8xlarge</td><td>25 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>m5n.12xlarge</td><td>50 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>m5n.16xlarge</td><td>75 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>m5n.24xlarge</td><td>100 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>m5n.metal</td><td>100 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">M5zn</td></tr>
  <tr><td>m5zn.large 1</td><td>3.0 / 25.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>m5zn.xlarge 1</td><td>5.0 / 25.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>m5zn.2xlarge 1</td><td>10.0 / 25.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>m5zn.3xlarge 1</td><td>15.0 / 25.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>m5zn.6xlarge</td><td>50 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>m5zn.12xlarge</td><td>100 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>m5zn.metal</td><td>100 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">M6a</td></tr>
  <tr><td>m6a.large 1</td><td>0.781 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>m6a.xlarge 1</td><td>1.562 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>m6a.2xlarge 1</td><td>3.125 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>m6a.4xlarge 1</td><td>6.25 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>m6a.8xlarge</td><td>12.5 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>m6a.12xlarge</td><td>18.75 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>m6a.16xlarge</td><td>25 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>m6a.24xlarge</td><td>37.5 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>m6a.32xlarge</td><td>50 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>m6a.48xlarge</td><td>50 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>m6a.metal</td><td>50 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">M6g</td></tr>
  <tr><td>m6g.medium 1</td><td>0.5 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>2</td><td>4</td><td>✓ Yes</td></tr>
  <tr><td>m6g.large 1</td><td>0.75 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>m6g.xlarge 1</td><td>1.25 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>m6g.2xlarge 1</td><td>2.5 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>m6g.4xlarge 1</td><td>5.0 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>m6g.8xlarge</td><td>12 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>m6g.12xlarge</td><td>20 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>m6g.16xlarge</td><td>25 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>m6g.metal</td><td>25 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">M6gd</td></tr>
  <tr><td>m6gd.medium 1</td><td>0.5 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>2</td><td>4</td><td>✓ Yes</td></tr>
  <tr><td>m6gd.large 1</td><td>0.75 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>m6gd.xlarge 1</td><td>1.25 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>m6gd.2xlarge 1</td><td>2.5 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>m6gd.4xlarge 1</td><td>5.0 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>m6gd.8xlarge</td><td>12 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>m6gd.12xlarge</td><td>20 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>m6gd.16xlarge</td><td>25 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>m6gd.metal</td><td>25 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">M6i</td></tr>
  <tr><td>m6i.large 1</td><td>0.781 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>m6i.xlarge 1</td><td>1.562 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>m6i.2xlarge 1</td><td>3.125 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>m6i.4xlarge 1</td><td>6.25 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>m6i.8xlarge</td><td>12.5 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>m6i.12xlarge</td><td>18.75 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>m6i.16xlarge</td><td>25 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>m6i.24xlarge</td><td>37.5 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>m6i.32xlarge</td><td>50 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>m6i.metal</td><td>50 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">M6id</td></tr>
  <tr><td>m6id.large 1</td><td>0.781 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>m6id.xlarge 1</td><td>1.562 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>m6id.2xlarge 1</td><td>3.125 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>m6id.4xlarge 1</td><td>6.25 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>m6id.8xlarge</td><td>12.5 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>m6id.12xlarge</td><td>18.75 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>m6id.16xlarge</td><td>25 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>m6id.24xlarge</td><td>37.5 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>m6id.32xlarge</td><td>50 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>m6id.metal</td><td>50 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">M6idn</td></tr>
  <tr><td>m6idn.large 1</td><td>3.125 / 25.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>m6idn.xlarge 1</td><td>6.25 / 30.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>m6idn.2xlarge 1</td><td>12.5 / 40.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>m6idn.4xlarge 1</td><td>25.0 / 50.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>m6idn.8xlarge</td><td>50 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>m6idn.12xlarge</td><td>75 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>m6idn.16xlarge</td><td>100 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>m6idn.24xlarge</td><td>150 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>m6idn.32xlarge</td><td>200 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>2</td><td>16</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>m6idn.metal</td><td>200 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>2</td><td>16</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">M6in</td></tr>
  <tr><td>m6in.large 1</td><td>3.125 / 25.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>m6in.xlarge 1</td><td>6.25 / 30.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>m6in.2xlarge 1</td><td>12.5 / 40.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>m6in.4xlarge 1</td><td>25.0 / 50.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>m6in.8xlarge</td><td>50 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>m6in.12xlarge</td><td>75 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>m6in.16xlarge</td><td>100 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>m6in.24xlarge</td><td>150 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>m6in.32xlarge</td><td>200 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>2</td><td>16</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>m6in.metal</td><td>200 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>2</td><td>16</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">M7a</td></tr>
  <tr><td>m7a.medium 1</td><td>0.39 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>2</td><td>4</td><td>✓ Yes</td></tr>
  <tr><td>m7a.large 1</td><td>0.781 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>m7a.xlarge 1</td><td>1.562 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>m7a.2xlarge 1</td><td>3.125 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>m7a.4xlarge 1</td><td>6.25 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>m7a.8xlarge</td><td>12.5 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>m7a.12xlarge</td><td>18.75 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>m7a.16xlarge</td><td>25 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>m7a.24xlarge</td><td>37.5 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>m7a.32xlarge</td><td>50 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>m7a.48xlarge</td><td>50 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>m7a.metal-48xl</td><td>50 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">M7g</td></tr>
  <tr><td>m7g.medium 1</td><td>0.52 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>2</td><td>4</td><td>✓ Yes</td></tr>
  <tr><td>m7g.large 1</td><td>0.937 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>m7g.xlarge 1</td><td>1.876 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>m7g.2xlarge 1</td><td>3.75 / 15.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>m7g.4xlarge 1</td><td>7.5 / 15.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>m7g.8xlarge</td><td>15 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>m7g.12xlarge</td><td>22.5 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>m7g.16xlarge</td><td>30 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>m7g.metal</td><td>30 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">M7gd</td></tr>
  <tr><td>m7gd.medium 1</td><td>0.52 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>2</td><td>4</td><td>✓ Yes</td></tr>
  <tr><td>m7gd.large 1</td><td>0.937 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>m7gd.xlarge 1</td><td>1.876 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>m7gd.2xlarge 1</td><td>3.75 / 15.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>m7gd.4xlarge 1</td><td>7.5 / 15.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>m7gd.8xlarge</td><td>15 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>m7gd.12xlarge</td><td>22.5 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>m7gd.16xlarge</td><td>30 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>m7gd.metal</td><td>30 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">M7i</td></tr>
  <tr><td>m7i.large 1</td><td>0.781 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>m7i.xlarge 1</td><td>1.562 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>m7i.2xlarge 1</td><td>3.125 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>m7i.4xlarge 1</td><td>6.25 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>m7i.8xlarge</td><td>12.5 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>m7i.12xlarge</td><td>18.75 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>m7i.16xlarge</td><td>25 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>m7i.24xlarge</td><td>37.5 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>m7i.48xlarge</td><td>50 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>m7i.metal-24xl</td><td>37.5 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>m7i.metal-48xl</td><td>50 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">M7i-flex</td></tr>
  <tr><td>m7i-flex.large 1</td><td>0.39 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>m7i-flex.xlarge 1</td><td>0.781 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>m7i-flex.2xlarge 1</td><td>1.562 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>m7i-flex.4xlarge 1</td><td>3.125 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>m7i-flex.8xlarge 1</td><td>6.25 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>m7i-flex.12xlarge 1</td><td>9.375 / 18.75</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>m7i-flex.16xlarge 1</td><td>12.5 / 25.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">M8a</td></tr>
  <tr><td>m8a.medium 1</td><td>0.52 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>2</td><td>4</td><td>✓ Yes</td></tr>
  <tr><td>m8a.large 1</td><td>0.937 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>20</td><td>✓ Yes</td></tr>
  <tr><td>m8a.xlarge 1</td><td>1.875 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>20</td><td>✓ Yes</td></tr>
  <tr><td>m8a.2xlarge 1</td><td>3.75 / 15.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>40</td><td>✓ Yes</td></tr>
  <tr><td>m8a.4xlarge 1</td><td>7.5 / 15.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>40</td><td>✓ Yes</td></tr>
  <tr><td>m8a.8xlarge</td><td>15 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>10</td><td>40</td><td>✓ Yes</td></tr>
  <tr><td>m8a.12xlarge</td><td>22.5 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>12</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>m8a.16xlarge</td><td>30 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>16</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>m8a.24xlarge</td><td>40 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>16</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>m8a.48xlarge</td><td>75 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>24</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>m8a.metal-24xl</td><td>40 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>16</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>m8a.metal-48xl</td><td>75 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>24</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">M8azn</td></tr>
  <tr><td>m8azn.medium 1</td><td>2.08 / 25.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>4</td><td>✓ Yes</td></tr>
  <tr><td>m8azn.large 1</td><td>4.17 / 30.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>20</td><td>✓ Yes</td></tr>
  <tr><td>m8azn.xlarge 1</td><td>8.33 / 40.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>20</td><td>✓ Yes</td></tr>
  <tr><td>m8azn.3xlarge 1</td><td>25.0 / 50.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>40</td><td>✓ Yes</td></tr>
  <tr><td>m8azn.6xlarge</td><td>50 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>40</td><td>✓ Yes</td></tr>
  <tr><td>m8azn.12xlarge</td><td>100 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>16</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>m8azn.24xlarge</td><td>200 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>16</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>m8azn.metal-12xl</td><td>100 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>16</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>m8azn.metal-24xl</td><td>200 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>16</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">M8g</td></tr>
  <tr><td>m8g.medium 1</td><td>0.52 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>2</td><td>4</td><td>✓ Yes</td></tr>
  <tr><td>m8g.large 1</td><td>0.937 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>m8g.xlarge 1</td><td>1.875 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>m8g.2xlarge 1</td><td>3.75 / 15.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>m8g.4xlarge 1</td><td>7.5 / 15.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>m8g.8xlarge</td><td>15 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>m8g.12xlarge</td><td>22.5 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>m8g.16xlarge</td><td>30 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>m8g.24xlarge</td><td>40 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>m8g.48xlarge</td><td>50 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>m8g.metal-24xl</td><td>40 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>m8g.metal-48xl</td><td>50 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">M8gb</td></tr>
  <tr><td>m8gb.medium 1</td><td>2.083 / 16.666</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>2</td><td>4</td><td>✓ Yes</td></tr>
  <tr><td>m8gb.large 1</td><td>4.166 / 20.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>m8gb.xlarge 1</td><td>8.333 / 26.666</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>m8gb.2xlarge 1</td><td>16.666 / 33.333</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>m8gb.4xlarge</td><td>33.33 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>m8gb.8xlarge</td><td>66.66 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>10</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>m8gb.12xlarge</td><td>100 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>12</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>m8gb.16xlarge</td><td>133.33 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>16</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>m8gb.24xlarge</td><td>200 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>24</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>m8gb.48xlarge</td><td>400 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>2</td><td>24</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>m8gb.metal-24xl</td><td>200 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>24</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>m8gb.metal-48xl</td><td>400 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>2</td><td>24</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">M8gd</td></tr>
  <tr><td>m8gd.medium 1</td><td>0.52 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>2</td><td>4</td><td>✓ Yes</td></tr>
  <tr><td>m8gd.large 1</td><td>0.937 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>m8gd.xlarge 1</td><td>1.875 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>m8gd.2xlarge 1</td><td>3.75 / 15.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>m8gd.4xlarge 1</td><td>7.5 / 15.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>m8gd.8xlarge</td><td>15 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>m8gd.12xlarge</td><td>22.5 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>m8gd.16xlarge</td><td>30 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>m8gd.24xlarge</td><td>40 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>m8gd.48xlarge</td><td>50 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>m8gd.metal-24xl</td><td>40 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>m8gd.metal-48xl</td><td>50 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">M8gn</td></tr>
  <tr><td>m8gn.medium 1</td><td>3.125 / 25.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>2</td><td>4</td><td>✓ Yes</td></tr>
  <tr><td>m8gn.large 1</td><td>6.25 / 30.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>m8gn.xlarge 1</td><td>12.5 / 40.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>m8gn.2xlarge 1</td><td>25.0 / 50.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>m8gn.4xlarge</td><td>50 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>m8gn.8xlarge</td><td>100 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>10</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>m8gn.12xlarge</td><td>150 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>12</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>m8gn.16xlarge</td><td>200 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>16</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>m8gn.24xlarge</td><td>300 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>24</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>m8gn.48xlarge</td><td>600 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>2</td><td>24</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>m8gn.metal-24xl</td><td>300 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>24</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>m8gn.metal-48xl</td><td>600 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>2</td><td>24</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">M8i</td></tr>
  <tr><td>m8i.large 1</td><td>0.937 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>20</td><td>✓ Yes</td></tr>
  <tr><td>m8i.xlarge 1</td><td>1.875 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>m8i.2xlarge 1</td><td>3.75 / 15.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>m8i.4xlarge 1</td><td>7.5 / 15.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>m8i.8xlarge</td><td>15 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>10</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>m8i.12xlarge</td><td>22.5 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>12</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>m8i.16xlarge</td><td>30 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>16</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>m8i.24xlarge</td><td>40 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>16</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>m8i.32xlarge</td><td>50 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>24</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>m8i.48xlarge</td><td>75 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>24</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>m8i.96xlarge</td><td>100 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>24</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>m8i.metal-48xl</td><td>75 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>24</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>m8i.metal-96xl</td><td>100 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>24</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">M8id</td></tr>
  <tr><td>m8id.large 1</td><td>0.937 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>20</td><td>✓ Yes</td></tr>
  <tr><td>m8id.xlarge 1</td><td>1.875 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>m8id.2xlarge 1</td><td>3.75 / 15.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>m8id.4xlarge 1</td><td>7.5 / 15.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>m8id.8xlarge</td><td>15 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>10</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>m8id.12xlarge</td><td>22.5 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>12</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>m8id.16xlarge</td><td>30 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>16</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>m8id.24xlarge</td><td>40 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>16</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>m8id.32xlarge</td><td>50 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>24</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>m8id.48xlarge</td><td>75 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>24</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>m8id.96xlarge</td><td>100 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>24</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>m8id.metal-48xl</td><td>75 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>24</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>m8id.metal-96xl</td><td>100 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>24</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">M8i-flex</td></tr>
  <tr><td>m8i-flex.large 1</td><td>0.468 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>20</td><td>✓ Yes</td></tr>
  <tr><td>m8i-flex.xlarge 1</td><td>0.937 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>m8i-flex.2xlarge 1</td><td>1.875 / 15.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>m8i-flex.4xlarge 1</td><td>3.75 / 15.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>m8i-flex.8xlarge 1</td><td>7.5 / 15.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>10</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>m8i-flex.12xlarge 1</td><td>11.25 / 22.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>12</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>m8i-flex.16xlarge 1</td><td>15.0 / 30.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>16</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">M8in</td></tr>
  <tr><td>m8in.large 1</td><td>3.125 / 25.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>20</td><td>✓ Yes</td></tr>
  <tr><td>m8in.xlarge 1</td><td>6.25 / 30.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>m8in.2xlarge 1</td><td>12.5 / 40.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>m8in.4xlarge 1</td><td>25.0 / 50.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>m8in.8xlarge</td><td>50 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>m8in.12xlarge</td><td>75 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>12</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>m8in.16xlarge</td><td>100 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>16</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>m8in.24xlarge</td><td>150 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>16</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>m8in.32xlarge</td><td>200 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>16</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>m8in.48xlarge</td><td>300 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>24</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>m8in.96xlarge</td><td>600 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>2</td><td>24</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">M8idn</td></tr>
  <tr><td>m8idn.large 1</td><td>3.125 / 25.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>20</td><td>✓ Yes</td></tr>
  <tr><td>m8idn.xlarge 1</td><td>6.25 / 30.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>m8idn.2xlarge 1</td><td>12.5 / 40.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>m8idn.4xlarge 1</td><td>25.0 / 50.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>m8idn.8xlarge</td><td>50 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>m8idn.12xlarge</td><td>75 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>12</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>m8idn.16xlarge</td><td>100 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>16</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>m8idn.24xlarge</td><td>150 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>16</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>m8idn.32xlarge</td><td>200 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>16</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>m8idn.48xlarge</td><td>300 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>24</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>m8idn.96xlarge</td><td>600 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>2</td><td>24</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">M8ine</td></tr>
  <tr><td>m8ine.large</td><td>3.125 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>20</td><td>✓ Yes</td></tr>
  <tr><td>m8ine.xlarge</td><td>6.25 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>m8ine.2xlarge</td><td>12.5 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>m8ine.4xlarge</td><td>25 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>m8ine.8xlarge</td><td>50 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>m8ine.12xlarge</td><td>75 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>12</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">M8ib</td></tr>
  <tr><td>m8ib.large 1</td><td>2.083 / 16.667</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>20</td><td>✓ Yes</td></tr>
  <tr><td>m8ib.xlarge 1</td><td>4.166 / 20.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>m8ib.2xlarge 1</td><td>8.333 / 26.667</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>m8ib.4xlarge 1</td><td>16.666 / 33.333</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>m8ib.8xlarge</td><td>33.33 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>m8ib.12xlarge</td><td>50 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>12</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>m8ib.16xlarge</td><td>66.66 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>16</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>m8ib.24xlarge</td><td>100 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>16</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>m8ib.32xlarge</td><td>133.33 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>16</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>m8ib.48xlarge</td><td>200 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>24</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>m8ib.96xlarge</td><td>400 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>2</td><td>24</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">M8idb</td></tr>
  <tr><td>m8idb.large 1</td><td>2.083 / 16.667</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>20</td><td>✓ Yes</td></tr>
  <tr><td>m8idb.xlarge 1</td><td>4.166 / 20.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>m8idb.2xlarge 1</td><td>8.333 / 26.667</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>m8idb.4xlarge 1</td><td>16.666 / 33.333</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>m8idb.8xlarge</td><td>33.33 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>m8idb.12xlarge</td><td>50 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>12</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>m8idb.16xlarge</td><td>66.66 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>16</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>m8idb.24xlarge</td><td>100 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>16</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>m8idb.32xlarge</td><td>133.33 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>16</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>m8idb.48xlarge</td><td>200 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>24</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>m8idb.96xlarge</td><td>400 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>2</td><td>24</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">Mac1</td></tr>
  <tr><td>mac1.metal</td><td>25 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">Mac2</td></tr>
  <tr><td>mac2.metal</td><td>10 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">Mac2-m1ultra</td></tr>
  <tr><td>mac2-m1ultra.metal</td><td>10 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">Mac2-m2</td></tr>
  <tr><td>mac2-m2.metal</td><td>10 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">Mac2-m2pro</td></tr>
  <tr><td>mac2-m2pro.metal</td><td>10 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">Mac-m4</td></tr>
  <tr><td>mac-m4.metal</td><td>10 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">Mac-m4pro</td></tr>
  <tr><td>mac-m4pro.metal</td><td>10 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">Mac-m4max</td></tr>
  <tr><td>mac-m4max.metal</td><td>10 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">T2</td></tr>
  <tr><td>t2.nano</td><td>Low to Moderate</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>1</td><td>2</td><td>2</td><td>✓ Yes</td></tr>
  <tr><td>t2.micro</td><td>Low to Moderate</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>1</td><td>2</td><td>2</td><td>✓ Yes</td></tr>
  <tr><td>t2.small</td><td>Low to Moderate</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>1</td><td>3</td><td>4</td><td>✓ Yes</td></tr>
  <tr><td>t2.medium</td><td>Low to Moderate</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>1</td><td>3</td><td>6</td><td>✓ Yes</td></tr>
  <tr><td>t2.large</td><td>Low to Moderate</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>1</td><td>3</td><td>12</td><td>✓ Yes</td></tr>
  <tr><td>t2.xlarge</td><td>Moderate</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>1</td><td>3</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>t2.2xlarge</td><td>Moderate</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>1</td><td>3</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">T3</td></tr>
  <tr><td>t3.nano 1</td><td>0.032 / 5.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>2</td><td>2</td><td>✓ Yes</td></tr>
  <tr><td>t3.micro 1</td><td>0.064 / 5.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>2</td><td>2</td><td>✓ Yes</td></tr>
  <tr><td>t3.small 1</td><td>0.128 / 5.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>4</td><td>✓ Yes</td></tr>
  <tr><td>t3.medium 1</td><td>0.256 / 5.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>6</td><td>✓ Yes</td></tr>
  <tr><td>t3.large 1</td><td>0.512 / 5.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>12</td><td>✓ Yes</td></tr>
  <tr><td>t3.xlarge 1</td><td>1.024 / 5.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>t3.2xlarge 1</td><td>2.048 / 5.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">T3a</td></tr>
  <tr><td>t3a.nano 1</td><td>0.032 / 5.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>2</td><td>2</td><td>✓ Yes</td></tr>
  <tr><td>t3a.micro 1</td><td>0.064 / 5.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>2</td><td>2</td><td>✓ Yes</td></tr>
  <tr><td>t3a.small 1</td><td>0.128 / 5.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>2</td><td>4</td><td>✓ Yes</td></tr>
  <tr><td>t3a.medium 1</td><td>0.256 / 5.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>6</td><td>✓ Yes</td></tr>
  <tr><td>t3a.large 1</td><td>0.512 / 5.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>12</td><td>✓ Yes</td></tr>
  <tr><td>t3a.xlarge 1</td><td>1.024 / 5.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>t3a.2xlarge 1</td><td>2.048 / 5.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">T4g</td></tr>
  <tr><td>t4g.nano 1</td><td>0.032 / 5.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>2</td><td>2</td><td>✓ Yes</td></tr>
  <tr><td>t4g.micro 1</td><td>0.064 / 5.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>2</td><td>2</td><td>✓ Yes</td></tr>
  <tr><td>t4g.small 1</td><td>0.128 / 5.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>4</td><td>✓ Yes</td></tr>
  <tr><td>t4g.medium 1</td><td>0.256 / 5.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>6</td><td>✓ Yes</td></tr>
  <tr><td>t4g.large 1</td><td>0.512 / 5.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>12</td><td>✓ Yes</td></tr>
  <tr><td>t4g.xlarge 1</td><td>1.024 / 5.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>t4g.2xlarge 1</td><td>2.048 / 5.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
</tbody>
</table>


**Note**  
1 These instances have a baseline bandwidth and can use a network I/O credit mechanism to burst beyond their baseline bandwidth on a best effort basis. Other instances types can sustain their maximum performance indefinitely. For more information, see [ instance network bandwidth](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-instance-network-bandwidth.html).  
For `m6in.32xlarge`, `m6in.metal`, `m6idn.32xlarge`, `m6idn.metal`, you must attach at least 2 ENIs, to separate network cards, to achieve 200 Gbps throughput. Each ENI attached to a network card can achieve up to 170 Gbps.  
For `m8in.96xlarge`, `m8idn.96xlarge`, `m8gn.48xlarge`, `m8gn.metal-48xl`, you must attach at least 2 ENIs, to separate network cards, to achieve 600 Gbps throughput. Each ENI attached to a network card can achieve up to 300 Gbps.  
For `m8ib.96xlarge`, `m8idb.96xlarge`, `m8gb.48xlarge`, `m8gb.metal-48xl`, you must attach at least 2 ENIs, to separate network cards, to achieve 400 Gbps throughput. Each ENI attached to a network card can achieve up to 200 Gbps.

## Amazon EBS specifications
<a name="gp_storage-ebs"></a>

The following table indicates which instance types are Amazon EBS optimized by default and which optionally support it. It also describes their EBS-optimized performance, including dedicated bandwidth to Amazon EBS, the typical maximum aggregate throughput that can be achieved on that dedicated connection with a streaming read workload and 128 KiB I/O size, and the maximum IOPS the instance type can support when using a 16 KiB I/O size. Instance types not listed do not support Amazon EBS optimization.

**Important**  
An instance's EBS performance is bounded by the instance's performance limits, or the aggregated performance of its attached volumes, whichever is smaller. To achieve maximum EBS performance, an instance must have attached volumes that provide a combined performance equal to or greater than the maximum instance performance. For example, to achieve `80,000` IOPS for `r6i.16xlarge`, the instance must have at least `5` `gp3` volumes provisioned with `16,000` IOPS each (`5` volumes x `16,000` IOPS = `80,000` IOPS).  
We recommend that you choose an EBS–optimized instance type that provides more dedicated Amazon EBS throughput than your application needs; otherwise, the connection between Amazon EBS and Amazon EC2 can become a performance bottleneck.

**Note**  
M8a, M8g, M8gd, M8i, M8id, M8i-flex instance types support configurable bandwidth weightings. With these instance types, you can optimize an instance's bandwidth for either networking performance or Amazon EBS performance. The following table shows the default networking bandwidth performance for these instance types. For the supported configurable weightings, see [ Configurable bandwidth weighting preferences](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/configure-bandwidth-weighting.html).


<table>
<thead>
  <tr><th>Instance type</th><th>Baseline / Maximum bandwidth (Mbps)</th><th>Baseline / Maximum throughput (MB/s, 128 KiB I/O)</th><th>Baseline / Maximum IOPS (16 KiB I/O)</th><th>NVMe</th><th>Multiple EBS cards</th><th>EBS volume limit</th></tr>
</thead>
<tbody>
  <tr><td colspan="7">M5</td></tr>
  <tr><td>m5.large 1</td><td>650.00 / 4750.00</td><td>81.25 / 593.75</td><td>3600.00 / 18750.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m5.xlarge 1</td><td>1150.00 / 4750.00</td><td>143.75 / 593.75</td><td>6000.00 / 18750.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m5.2xlarge 1</td><td>2300.00 / 4750.00</td><td>287.50 / 593.75</td><td>12000.00 / 18750.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m5.4xlarge</td><td>4750.00</td><td>593.75</td><td>18750.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m5.8xlarge</td><td>6800.00</td><td>850.00</td><td>30000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m5.12xlarge</td><td>9500.00</td><td>1187.50</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m5.16xlarge</td><td>13600.00</td><td>1700.00</td><td>60000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m5.24xlarge</td><td>19000.00</td><td>2375.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m5.metal</td><td>19000.00</td><td>2375.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 31 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td colspan="7">M5a</td></tr>
  <tr><td>m5a.large 1</td><td>650.00 / 2880.00</td><td>81.25 / 360.00</td><td>3600.00 / 16000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m5a.xlarge 1</td><td>1085.00 / 2880.00</td><td>135.62 / 360.00</td><td>6000.00 / 16000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m5a.2xlarge 1</td><td>1580.00 / 2880.00</td><td>197.50 / 360.00</td><td>8333.00 / 16000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m5a.4xlarge</td><td>2880.00</td><td>360.00</td><td>16000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m5a.8xlarge</td><td>4750.00</td><td>593.75</td><td>20000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m5a.12xlarge</td><td>6780.00</td><td>847.50</td><td>30000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m5a.16xlarge</td><td>9500.00</td><td>1187.50</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m5a.24xlarge</td><td>13750.00</td><td>1718.75</td><td>60000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td colspan="7">M5ad</td></tr>
  <tr><td>m5ad.large 1</td><td>650.00 / 2880.00</td><td>81.25 / 360.00</td><td>3600.00 / 16000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m5ad.xlarge 1</td><td>1085.00 / 2880.00</td><td>135.62 / 360.00</td><td>6000.00 / 16000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m5ad.2xlarge 1</td><td>1580.00 / 2880.00</td><td>197.50 / 360.00</td><td>8333.00 / 16000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m5ad.4xlarge</td><td>2880.00</td><td>360.00</td><td>16000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 25 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m5ad.8xlarge</td><td>4750.00</td><td>593.75</td><td>20000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 25 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m5ad.12xlarge</td><td>6780.00</td><td>847.50</td><td>30000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 25 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m5ad.16xlarge</td><td>9500.00</td><td>1187.50</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 23 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m5ad.24xlarge</td><td>13750.00</td><td>1718.75</td><td>60000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 23 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td colspan="7">M5d</td></tr>
  <tr><td>m5d.large 1</td><td>650.00 / 4750.00</td><td>81.25 / 593.75</td><td>3600.00 / 18750.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m5d.xlarge 1</td><td>1150.00 / 4750.00</td><td>143.75 / 593.75</td><td>6000.00 / 18750.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m5d.2xlarge 1</td><td>2300.00 / 4750.00</td><td>287.50 / 593.75</td><td>12000.00 / 18750.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m5d.4xlarge</td><td>4750.00</td><td>593.75</td><td>18750.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 25 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m5d.8xlarge</td><td>6800.00</td><td>850.00</td><td>30000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 25 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m5d.12xlarge</td><td>9500.00</td><td>1187.50</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 25 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m5d.16xlarge</td><td>13600.00</td><td>1700.00</td><td>60000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 23 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m5d.24xlarge</td><td>19000.00</td><td>2375.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 23 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m5d.metal</td><td>19000.00</td><td>2375.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 31 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td colspan="7">M5dn</td></tr>
  <tr><td>m5dn.large 1</td><td>650.00 / 4750.00</td><td>81.25 / 593.75</td><td>3600.00 / 18750.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m5dn.xlarge 1</td><td>1150.00 / 4750.00</td><td>143.75 / 593.75</td><td>6000.00 / 18750.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m5dn.2xlarge 1</td><td>2300.00 / 4750.00</td><td>287.50 / 593.75</td><td>12000.00 / 18750.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m5dn.4xlarge</td><td>4750.00</td><td>593.75</td><td>18750.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 25 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m5dn.8xlarge</td><td>6800.00</td><td>850.00</td><td>30000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 25 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m5dn.12xlarge</td><td>9500.00</td><td>1187.50</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 25 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m5dn.16xlarge</td><td>13600.00</td><td>1700.00</td><td>60000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 23 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m5dn.24xlarge</td><td>19000.00</td><td>2375.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 23 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m5dn.metal</td><td>19000.00</td><td>2375.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 31 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td colspan="7">M5n</td></tr>
  <tr><td>m5n.large 1</td><td>650.00 / 4750.00</td><td>81.25 / 593.75</td><td>3600.00 / 18750.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m5n.xlarge 1</td><td>1150.00 / 4750.00</td><td>143.75 / 593.75</td><td>6000.00 / 18750.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m5n.2xlarge 1</td><td>2300.00 / 4750.00</td><td>287.50 / 593.75</td><td>12000.00 / 18750.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m5n.4xlarge</td><td>4750.00</td><td>593.75</td><td>18750.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m5n.8xlarge</td><td>6800.00</td><td>850.00</td><td>30000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m5n.12xlarge</td><td>9500.00</td><td>1187.50</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m5n.16xlarge</td><td>13600.00</td><td>1700.00</td><td>60000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m5n.24xlarge</td><td>19000.00</td><td>2375.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m5n.metal</td><td>19000.00</td><td>2375.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 31 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td colspan="7">M5zn</td></tr>
  <tr><td>m5zn.large 1</td><td>800.00 / 3170.00</td><td>100.00 / 396.25</td><td>3333.00 / 13333.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m5zn.xlarge 1</td><td>1564.00 / 3170.00</td><td>195.50 / 396.25</td><td>6667.00 / 13333.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m5zn.2xlarge</td><td>3170.00</td><td>396.25</td><td>13333.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m5zn.3xlarge</td><td>4750.00</td><td>593.75</td><td>20000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m5zn.6xlarge</td><td>9500.00</td><td>1187.50</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m5zn.12xlarge</td><td>19000.00</td><td>2375.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m5zn.metal</td><td>19000.00</td><td>2375.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 31 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td colspan="7">M6a</td></tr>
  <tr><td>m6a.large 1</td><td>650.00 / 10000.00</td><td>81.25 / 1250.00</td><td>3600.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m6a.xlarge 1</td><td>1250.00 / 10000.00</td><td>156.25 / 1250.00</td><td>6000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m6a.2xlarge 1</td><td>2500.00 / 10000.00</td><td>312.50 / 1250.00</td><td>12000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m6a.4xlarge 1</td><td>5000.00 / 10000.00</td><td>625.00 / 1250.00</td><td>20000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m6a.8xlarge</td><td>10000.00</td><td>1250.00</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m6a.12xlarge</td><td>15000.00</td><td>1875.00</td><td>60000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m6a.16xlarge</td><td>20000.00</td><td>2500.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m6a.24xlarge</td><td>30000.00</td><td>3750.00</td><td>120000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m6a.32xlarge</td><td>40000.00</td><td>5000.00</td><td>160000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m6a.48xlarge</td><td>40000.00</td><td>5000.00</td><td>240000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m6a.metal</td><td>40000.00</td><td>5000.00</td><td>240000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 31 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td colspan="7">M6g</td></tr>
  <tr><td>m6g.medium 1</td><td>315.00 / 4750.00</td><td>39.38 / 593.75</td><td>2500.00 / 20000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m6g.large 1</td><td>630.00 / 4750.00</td><td>78.75 / 593.75</td><td>3600.00 / 20000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m6g.xlarge 1</td><td>1188.00 / 4750.00</td><td>148.50 / 593.75</td><td>6000.00 / 20000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m6g.2xlarge 1</td><td>2375.00 / 4750.00</td><td>296.88 / 593.75</td><td>12000.00 / 20000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m6g.4xlarge</td><td>4750.00</td><td>593.75</td><td>20000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m6g.8xlarge</td><td>9500.00</td><td>1187.50</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m6g.12xlarge</td><td>14250.00</td><td>1781.25</td><td>50000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m6g.16xlarge</td><td>19000.00</td><td>2375.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m6g.metal</td><td>19000.00</td><td>2375.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 31 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td colspan="7">M6gd</td></tr>
  <tr><td>m6gd.medium 1</td><td>315.00 / 4750.00</td><td>39.38 / 593.75</td><td>2500.00 / 20000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m6gd.large 1</td><td>630.00 / 4750.00</td><td>78.75 / 593.75</td><td>3600.00 / 20000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m6gd.xlarge 1</td><td>1188.00 / 4750.00</td><td>148.50 / 593.75</td><td>6000.00 / 20000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m6gd.2xlarge 1</td><td>2375.00 / 4750.00</td><td>296.88 / 593.75</td><td>12000.00 / 20000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m6gd.4xlarge</td><td>4750.00</td><td>593.75</td><td>20000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m6gd.8xlarge</td><td>9500.00</td><td>1187.50</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m6gd.12xlarge</td><td>14250.00</td><td>1781.25</td><td>50000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 25 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m6gd.16xlarge</td><td>19000.00</td><td>2375.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 25 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m6gd.metal</td><td>19000.00</td><td>2375.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 31 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td colspan="7">M6i</td></tr>
  <tr><td>m6i.large 1</td><td>650.00 / 10000.00</td><td>81.25 / 1250.00</td><td>3600.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m6i.xlarge 1</td><td>1250.00 / 10000.00</td><td>156.25 / 1250.00</td><td>6000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m6i.2xlarge 1</td><td>2500.00 / 10000.00</td><td>312.50 / 1250.00</td><td>12000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m6i.4xlarge 1</td><td>5000.00 / 10000.00</td><td>625.00 / 1250.00</td><td>20000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m6i.8xlarge</td><td>10000.00</td><td>1250.00</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m6i.12xlarge</td><td>15000.00</td><td>1875.00</td><td>60000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m6i.16xlarge</td><td>20000.00</td><td>2500.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m6i.24xlarge</td><td>30000.00</td><td>3750.00</td><td>120000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m6i.32xlarge</td><td>40000.00</td><td>5000.00</td><td>160000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m6i.metal</td><td>40000.00</td><td>5000.00</td><td>160000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 31 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td colspan="7">M6id</td></tr>
  <tr><td>m6id.large 1</td><td>650.00 / 10000.00</td><td>81.25 / 1250.00</td><td>3600.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m6id.xlarge 1</td><td>1250.00 / 10000.00</td><td>156.25 / 1250.00</td><td>6000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m6id.2xlarge 1</td><td>2500.00 / 10000.00</td><td>312.50 / 1250.00</td><td>12000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m6id.4xlarge 1</td><td>5000.00 / 10000.00</td><td>625.00 / 1250.00</td><td>20000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m6id.8xlarge</td><td>10000.00</td><td>1250.00</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m6id.12xlarge</td><td>15000.00</td><td>1875.00</td><td>60000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 25 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m6id.16xlarge</td><td>20000.00</td><td>2500.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 25 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m6id.24xlarge</td><td>30000.00</td><td>3750.00</td><td>120000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 23 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m6id.32xlarge</td><td>40000.00</td><td>5000.00</td><td>160000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 23 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m6id.metal</td><td>40000.00</td><td>5000.00</td><td>160000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 31 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td colspan="7">M6idn</td></tr>
  <tr><td>m6idn.large 1</td><td>1562.00 / 25000.00</td><td>195.31 / 3125.00</td><td>6250.00 / 100000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m6idn.xlarge 1</td><td>3125.00 / 25000.00</td><td>390.62 / 3125.00</td><td>12500.00 / 100000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m6idn.2xlarge 1</td><td>6250.00 / 25000.00</td><td>781.25 / 3125.00</td><td>25000.00 / 100000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m6idn.4xlarge 1</td><td>12500.00 / 25000.00</td><td>1562.50 / 3125.00</td><td>50000.00 / 100000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m6idn.8xlarge</td><td>25000.00</td><td>3125.00</td><td>100000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m6idn.12xlarge</td><td>37500.00</td><td>4687.50</td><td>150000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 25 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m6idn.16xlarge</td><td>50000.00</td><td>6250.00</td><td>200000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 25 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m6idn.24xlarge</td><td>75000.00</td><td>9375.00</td><td>300000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 23 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m6idn.32xlarge</td><td>100000.00</td><td>12500.00</td><td>400000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 23 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m6idn.metal</td><td>100000.00</td><td>12500.00</td><td>400000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 31 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td colspan="7">M6in</td></tr>
  <tr><td>m6in.large 1</td><td>1562.00 / 25000.00</td><td>195.31 / 3125.00</td><td>6250.00 / 100000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m6in.xlarge 1</td><td>3125.00 / 25000.00</td><td>390.62 / 3125.00</td><td>12500.00 / 100000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m6in.2xlarge 1</td><td>6250.00 / 25000.00</td><td>781.25 / 3125.00</td><td>25000.00 / 100000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m6in.4xlarge 1</td><td>12500.00 / 25000.00</td><td>1562.50 / 3125.00</td><td>50000.00 / 100000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m6in.8xlarge</td><td>25000.00</td><td>3125.00</td><td>100000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m6in.12xlarge</td><td>37500.00</td><td>4687.50</td><td>150000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m6in.16xlarge</td><td>50000.00</td><td>6250.00</td><td>200000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m6in.24xlarge</td><td>75000.00</td><td>9375.00</td><td>300000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m6in.32xlarge</td><td>100000.00</td><td>12500.00</td><td>400000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m6in.metal</td><td>100000.00</td><td>12500.00</td><td>400000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 31 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td colspan="7">M7a</td></tr>
  <tr><td>m7a.medium 1</td><td>325.00 / 10000.00</td><td>40.62 / 1250.00</td><td>2500.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m7a.large 1</td><td>650.00 / 10000.00</td><td>81.25 / 1250.00</td><td>3600.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m7a.xlarge 1</td><td>1250.00 / 10000.00</td><td>156.25 / 1250.00</td><td>6000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m7a.2xlarge 1</td><td>2500.00 / 10000.00</td><td>312.50 / 1250.00</td><td>12000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m7a.4xlarge 1</td><td>5000.00 / 10000.00</td><td>625.00 / 1250.00</td><td>20000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m7a.8xlarge</td><td>10000.00</td><td>1250.00</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m7a.12xlarge</td><td>15000.00</td><td>1875.00</td><td>60000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m7a.16xlarge</td><td>20000.00</td><td>2500.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>48 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m7a.24xlarge</td><td>30000.00</td><td>3750.00</td><td>120000.00</td><td>✓ Yes</td><td>✗ No</td><td>64 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m7a.32xlarge</td><td>40000.00</td><td>5000.00</td><td>160000.00</td><td>✓ Yes</td><td>✗ No</td><td>88 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m7a.48xlarge</td><td>40000.00</td><td>5000.00</td><td>240000.00</td><td>✓ Yes</td><td>✗ No</td><td>128 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m7a.metal-48xl</td><td>40000.00</td><td>5000.00</td><td>240000.00</td><td>✓ Yes</td><td>✗ No</td><td>79 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td colspan="7">M7g</td></tr>
  <tr><td>m7g.medium 1</td><td>315.00 / 10000.00</td><td>39.38 / 1250.00</td><td>2500.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m7g.large 1</td><td>630.00 / 10000.00</td><td>78.75 / 1250.00</td><td>3600.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m7g.xlarge 1</td><td>1250.00 / 10000.00</td><td>156.25 / 1250.00</td><td>6000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m7g.2xlarge 1</td><td>2500.00 / 10000.00</td><td>312.50 / 1250.00</td><td>12000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m7g.4xlarge 1</td><td>5000.00 / 10000.00</td><td>625.00 / 1250.00</td><td>20000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m7g.8xlarge</td><td>10000.00</td><td>1250.00</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m7g.12xlarge</td><td>15000.00</td><td>1875.00</td><td>60000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m7g.16xlarge</td><td>20000.00</td><td>2500.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m7g.metal</td><td>20000.00</td><td>2500.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 31 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td colspan="7">M7gd</td></tr>
  <tr><td>m7gd.medium 1</td><td>315.00 / 10000.00</td><td>39.38 / 1250.00</td><td>2500.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m7gd.large 1</td><td>630.00 / 10000.00</td><td>78.75 / 1250.00</td><td>3600.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m7gd.xlarge 1</td><td>1250.00 / 10000.00</td><td>156.25 / 1250.00</td><td>6000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m7gd.2xlarge 1</td><td>2500.00 / 10000.00</td><td>312.50 / 1250.00</td><td>12000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m7gd.4xlarge 1</td><td>5000.00 / 10000.00</td><td>625.00 / 1250.00</td><td>20000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m7gd.8xlarge</td><td>10000.00</td><td>1250.00</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m7gd.12xlarge</td><td>15000.00</td><td>1875.00</td><td>60000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 25 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m7gd.16xlarge</td><td>20000.00</td><td>2500.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 25 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>m7gd.metal</td><td>20000.00</td><td>2500.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 31 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td colspan="7">M7i</td></tr>
  <tr><td>m7i.large 1</td><td>650.00 / 10000.00</td><td>81.25 / 1250.00</td><td>3600.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m7i.xlarge 1</td><td>1250.00 / 10000.00</td><td>156.25 / 1250.00</td><td>6000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m7i.2xlarge 1</td><td>2500.00 / 10000.00</td><td>312.50 / 1250.00</td><td>12000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m7i.4xlarge 1</td><td>5000.00 / 10000.00</td><td>625.00 / 1250.00</td><td>20000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m7i.8xlarge</td><td>10000.00</td><td>1250.00</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m7i.12xlarge</td><td>15000.00</td><td>1875.00</td><td>60000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m7i.16xlarge</td><td>20000.00</td><td>2500.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>48 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m7i.24xlarge</td><td>30000.00</td><td>3750.00</td><td>120000.00</td><td>✓ Yes</td><td>✗ No</td><td>64 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m7i.48xlarge</td><td>40000.00</td><td>5000.00</td><td>240000.00</td><td>✓ Yes</td><td>✗ No</td><td>128 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m7i.metal-24xl</td><td>30000.00</td><td>3750.00</td><td>120000.00</td><td>✓ Yes</td><td>✗ No</td><td>39 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m7i.metal-48xl</td><td>40000.00</td><td>5000.00</td><td>240000.00</td><td>✓ Yes</td><td>✗ No</td><td>79 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td colspan="7">M7i-flex</td></tr>
  <tr><td>m7i-flex.large 1</td><td>312.00 / 10000.00</td><td>39.06 / 1250.00</td><td>2500.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m7i-flex.xlarge 1</td><td>625.00 / 10000.00</td><td>78.12 / 1250.00</td><td>3600.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m7i-flex.2xlarge 1</td><td>1250.00 / 10000.00</td><td>156.25 / 1250.00</td><td>6000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m7i-flex.4xlarge 1</td><td>2500.00 / 10000.00</td><td>312.50 / 1250.00</td><td>12000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m7i-flex.8xlarge 1</td><td>5000.00 / 10000.00</td><td>625.00 / 1250.00</td><td>20000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m7i-flex.12xlarge 1</td><td>7500.00 / 15000.00</td><td>937.50 / 1875.00</td><td>30000.00 / 60000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m7i-flex.16xlarge 1</td><td>10000.00 / 20000.00</td><td>1250.00 / 2500.00</td><td>40000.00 / 80000.00</td><td>✓ Yes</td><td>✗ No</td><td>48 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td colspan="7">M8a</td></tr>
  <tr><td>m8a.medium 1</td><td>325.00 / 10000.00</td><td>40.62 / 1250.00</td><td>2500.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8a.large 1</td><td>650.00 / 10000.00</td><td>81.25 / 1250.00</td><td>3600.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8a.xlarge 1</td><td>1250.00 / 10000.00</td><td>156.25 / 1250.00</td><td>6000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8a.2xlarge 1</td><td>2500.00 / 10000.00</td><td>312.50 / 1250.00</td><td>12000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8a.4xlarge 1</td><td>5000.00 / 10000.00</td><td>625.00 / 1250.00</td><td>20000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8a.8xlarge</td><td>10000.00</td><td>1250.00</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8a.12xlarge</td><td>15000.00</td><td>1875.00</td><td>60000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8a.16xlarge</td><td>20000.00</td><td>2500.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>48 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8a.24xlarge</td><td>30000.00</td><td>3750.00</td><td>120000.00</td><td>✓ Yes</td><td>✗ No</td><td>64 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8a.48xlarge</td><td>60000.00</td><td>7500.00</td><td>240000.00</td><td>✓ Yes</td><td>✗ No</td><td>128 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8a.metal-24xl</td><td>30000.00</td><td>3750.00</td><td>120000.00</td><td>✓ Yes</td><td>✗ No</td><td>64 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8a.metal-48xl</td><td>60000.00</td><td>7500.00</td><td>240000.00</td><td>✓ Yes</td><td>✗ No</td><td>79 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td colspan="7">M8azn</td></tr>
  <tr><td>m8azn.medium 1</td><td>625.00 / 15000.00</td><td>78.12 / 1875.00</td><td>2500.00 / 60000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8azn.large 1</td><td>1250.00 / 15000.00</td><td>156.25 / 1875.00</td><td>5000.00 / 60000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8azn.xlarge 1</td><td>2500.00 / 15000.00</td><td>312.50 / 1875.00</td><td>10000.00 / 60000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8azn.3xlarge 1</td><td>7500.00 / 15000.00</td><td>937.50 / 1875.00</td><td>30000.00 / 60000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8azn.6xlarge</td><td>15000.00</td><td>1875.00</td><td>60000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8azn.12xlarge</td><td>30000.00</td><td>3750.00</td><td>120000.00</td><td>✓ Yes</td><td>✗ No</td><td>64 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8azn.24xlarge</td><td>60000.00</td><td>7500.00</td><td>240000.00</td><td>✓ Yes</td><td>✗ No</td><td>128 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8azn.metal-12xl</td><td>30000.00</td><td>3750.00</td><td>120000.00</td><td>✓ Yes</td><td>✗ No</td><td>64 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8azn.metal-24xl</td><td>60000.00</td><td>7500.00</td><td>240000.00</td><td>✓ Yes</td><td>✗ No</td><td>79 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td colspan="7">M8g</td></tr>
  <tr><td>m8g.medium 1</td><td>315.00 / 10000.00</td><td>39.38 / 1250.00</td><td>2500.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8g.large 1</td><td>630.00 / 10000.00</td><td>78.75 / 1250.00</td><td>3600.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8g.xlarge 1</td><td>1250.00 / 10000.00</td><td>156.25 / 1250.00</td><td>6000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8g.2xlarge 1</td><td>2500.00 / 10000.00</td><td>312.50 / 1250.00</td><td>12000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8g.4xlarge 1</td><td>5000.00 / 10000.00</td><td>625.00 / 1250.00</td><td>20000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8g.8xlarge</td><td>10000.00</td><td>1250.00</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8g.12xlarge</td><td>15000.00</td><td>1875.00</td><td>60000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8g.16xlarge</td><td>20000.00</td><td>2500.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>48 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8g.24xlarge</td><td>30000.00</td><td>3750.00</td><td>120000.00</td><td>✓ Yes</td><td>✗ No</td><td>64 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8g.48xlarge</td><td>40000.00</td><td>5000.00</td><td>240000.00</td><td>✓ Yes</td><td>✗ No</td><td>128 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8g.metal-24xl</td><td>30000.00</td><td>3750.00</td><td>120000.00</td><td>✓ Yes</td><td>✗ No</td><td>39 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8g.metal-48xl</td><td>40000.00</td><td>5000.00</td><td>240000.00</td><td>✓ Yes</td><td>✗ No</td><td>79 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td colspan="7">M8gb</td></tr>
  <tr><td>m8gb.medium 1</td><td>1562.00 / 25000.00</td><td>195.31 / 3125.00</td><td>7500.00 / 120000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8gb.large 1</td><td>3125.00 / 25000.00</td><td>390.62 / 3125.00</td><td>15000.00 / 120000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8gb.xlarge 1</td><td>6250.00 / 25000.00</td><td>781.25 / 3125.00</td><td>30000.00 / 120000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8gb.2xlarge 1</td><td>12500.00 / 25000.00</td><td>1562.50 / 3125.00</td><td>60000.00 / 120000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8gb.4xlarge</td><td>25000.00</td><td>3125.00</td><td>120000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8gb.8xlarge</td><td>50000.00</td><td>6250.00</td><td>240000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8gb.12xlarge</td><td>75000.00</td><td>9375.00</td><td>360000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8gb.16xlarge</td><td>100000.00</td><td>12500.00</td><td>480000.00</td><td>✓ Yes</td><td>✗ No</td><td>48 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8gb.24xlarge</td><td>150000.00</td><td>18750.00</td><td>720000.00</td><td>✓ Yes</td><td>✗ No</td><td>64 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8gb.48xlarge</td><td>300000.00</td><td>37500.00</td><td>1440000.00</td><td>✓ Yes</td><td>✓ Yes ([2 EBS cards](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ebs_cards.html))</td><td>128 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8gb.metal-24xl</td><td>150000.00</td><td>18750.00</td><td>720000.00</td><td>✓ Yes</td><td>✗ No</td><td>39 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8gb.metal-48xl</td><td>300000.00</td><td>37500.00</td><td>1440000.00</td><td>✓ Yes</td><td>✓ Yes ([2 EBS cards](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ebs_cards.html))</td><td>78 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td colspan="7">M8gd</td></tr>
  <tr><td>m8gd.medium 1</td><td>315.00 / 10000.00</td><td>39.38 / 1250.00</td><td>2500.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8gd.large 1</td><td>630.00 / 10000.00</td><td>78.75 / 1250.00</td><td>3600.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8gd.xlarge 1</td><td>1250.00 / 10000.00</td><td>156.25 / 1250.00</td><td>6000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8gd.2xlarge 1</td><td>2500.00 / 10000.00</td><td>312.50 / 1250.00</td><td>12000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8gd.4xlarge 1</td><td>5000.00 / 10000.00</td><td>625.00 / 1250.00</td><td>20000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8gd.8xlarge</td><td>10000.00</td><td>1250.00</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8gd.12xlarge</td><td>15000.00</td><td>1875.00</td><td>60000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8gd.16xlarge</td><td>20000.00</td><td>2500.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>48 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8gd.24xlarge</td><td>30000.00</td><td>3750.00</td><td>120000.00</td><td>✓ Yes</td><td>✗ No</td><td>64 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8gd.48xlarge</td><td>40000.00</td><td>5000.00</td><td>240000.00</td><td>✓ Yes</td><td>✗ No</td><td>128 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8gd.metal-24xl</td><td>30000.00</td><td>3750.00</td><td>120000.00</td><td>✓ Yes</td><td>✗ No</td><td>39 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8gd.metal-48xl</td><td>40000.00</td><td>5000.00</td><td>240000.00</td><td>✓ Yes</td><td>✗ No</td><td>79 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td colspan="7">M8gn</td></tr>
  <tr><td>m8gn.medium 1</td><td>760.00 / 10000.00</td><td>95.00 / 1250.00</td><td>2500.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8gn.large 1</td><td>1250.00 / 10000.00</td><td>156.25 / 1250.00</td><td>5000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8gn.xlarge 1</td><td>2500.00 / 10000.00</td><td>312.50 / 1250.00</td><td>10000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8gn.2xlarge 1</td><td>5000.00 / 10000.00</td><td>625.00 / 1250.00</td><td>20000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8gn.4xlarge</td><td>10000.00</td><td>1250.00</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8gn.8xlarge</td><td>20000.00</td><td>2500.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8gn.12xlarge</td><td>30000.00</td><td>3750.00</td><td>120000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8gn.16xlarge</td><td>40000.00</td><td>5000.00</td><td>160000.00</td><td>✓ Yes</td><td>✗ No</td><td>48 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8gn.24xlarge</td><td>60000.00</td><td>7500.00</td><td>240000.00</td><td>✓ Yes</td><td>✗ No</td><td>64 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8gn.48xlarge</td><td>120000.00</td><td>15000.00</td><td>480000.00</td><td>✓ Yes</td><td>✓ Yes ([2 EBS cards](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ebs_cards.html))</td><td>128 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8gn.metal-24xl</td><td>60000.00</td><td>7500.00</td><td>240000.00</td><td>✓ Yes</td><td>✗ No</td><td>39 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8gn.metal-48xl</td><td>120000.00</td><td>15000.00</td><td>480000.00</td><td>✓ Yes</td><td>✓ Yes ([2 EBS cards](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ebs_cards.html))</td><td>78 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td colspan="7">M8i</td></tr>
  <tr><td>m8i.large 1</td><td>650.00 / 10000.00</td><td>81.25 / 1250.00</td><td>3600.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8i.xlarge 1</td><td>1250.00 / 10000.00</td><td>156.25 / 1250.00</td><td>6000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8i.2xlarge 1</td><td>2500.00 / 10000.00</td><td>312.50 / 1250.00</td><td>12000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8i.4xlarge 1</td><td>5000.00 / 10000.00</td><td>625.00 / 1250.00</td><td>20000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8i.8xlarge</td><td>10000.00</td><td>1250.00</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8i.12xlarge</td><td>15000.00</td><td>1875.00</td><td>60000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8i.16xlarge</td><td>20000.00</td><td>2500.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>48 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8i.24xlarge</td><td>30000.00</td><td>3750.00</td><td>120000.00</td><td>✓ Yes</td><td>✗ No</td><td>64 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8i.32xlarge</td><td>40000.00</td><td>5000.00</td><td>160000.00</td><td>✓ Yes</td><td>✗ No</td><td>88 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8i.48xlarge</td><td>60000.00</td><td>7500.00</td><td>240000.00</td><td>✓ Yes</td><td>✗ No</td><td>128 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8i.96xlarge</td><td>80000.00</td><td>10000.00</td><td>480000.00</td><td>✓ Yes</td><td>✗ No</td><td>128 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8i.metal-48xl</td><td>60000.00</td><td>7500.00</td><td>240000.00</td><td>✓ Yes</td><td>✗ No</td><td>64 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8i.metal-96xl</td><td>80000.00</td><td>10000.00</td><td>480000.00</td><td>✓ Yes</td><td>✗ No</td><td>79 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td colspan="7">M8id</td></tr>
  <tr><td>m8id.large 1</td><td>650.00 / 10000.00</td><td>81.25 / 1250.00</td><td>3600.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8id.xlarge 1</td><td>1250.00 / 10000.00</td><td>156.25 / 1250.00</td><td>6000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8id.2xlarge 1</td><td>2500.00 / 10000.00</td><td>312.50 / 1250.00</td><td>12000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8id.4xlarge 1</td><td>5000.00 / 10000.00</td><td>625.00 / 1250.00</td><td>20000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8id.8xlarge</td><td>10000.00</td><td>1250.00</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8id.12xlarge</td><td>15000.00</td><td>1875.00</td><td>60000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8id.16xlarge</td><td>20000.00</td><td>2500.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>48 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8id.24xlarge</td><td>30000.00</td><td>3750.00</td><td>120000.00</td><td>✓ Yes</td><td>✗ No</td><td>64 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8id.32xlarge</td><td>40000.00</td><td>5000.00</td><td>160000.00</td><td>✓ Yes</td><td>✗ No</td><td>88 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8id.48xlarge</td><td>60000.00</td><td>7500.00</td><td>240000.00</td><td>✓ Yes</td><td>✗ No</td><td>128 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8id.96xlarge</td><td>80000.00</td><td>10000.00</td><td>480000.00</td><td>✓ Yes</td><td>✗ No</td><td>128 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8id.metal-48xl</td><td>60000.00</td><td>7500.00</td><td>240000.00</td><td>✓ Yes</td><td>✗ No</td><td>64 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8id.metal-96xl</td><td>80000.00</td><td>10000.00</td><td>480000.00</td><td>✓ Yes</td><td>✗ No</td><td>79 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td colspan="7">M8i-flex</td></tr>
  <tr><td>m8i-flex.large 1</td><td>315.00 / 10000.00</td><td>39.38 / 1250.00</td><td>2500.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8i-flex.xlarge 1</td><td>630.00 / 10000.00</td><td>78.75 / 1250.00</td><td>3600.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8i-flex.2xlarge 1</td><td>1250.00 / 10000.00</td><td>156.25 / 1250.00</td><td>6000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8i-flex.4xlarge 1</td><td>2500.00 / 10000.00</td><td>312.50 / 1250.00</td><td>12000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8i-flex.8xlarge 1</td><td>5000.00 / 10000.00</td><td>625.00 / 1250.00</td><td>20000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8i-flex.12xlarge 1</td><td>7500.00 / 15000.00</td><td>937.50 / 1875.00</td><td>30000.00 / 60000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8i-flex.16xlarge 1</td><td>10000.00 / 20000.00</td><td>1250.00 / 2500.00</td><td>40000.00 / 80000.00</td><td>✓ Yes</td><td>✗ No</td><td>48 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td colspan="7">M8in</td></tr>
  <tr><td>m8in.large 1</td><td>650.00 / 10000.00</td><td>81.25 / 1250.00</td><td>3600.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8in.xlarge 1</td><td>1250.00 / 10000.00</td><td>156.25 / 1250.00</td><td>6000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8in.2xlarge 1</td><td>2500.00 / 10000.00</td><td>312.50 / 1250.00</td><td>12000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8in.4xlarge 1</td><td>5000.00 / 10000.00</td><td>625.00 / 1250.00</td><td>20000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8in.8xlarge</td><td>10000.00</td><td>1250.00</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8in.12xlarge</td><td>15000.00</td><td>1875.00</td><td>60000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8in.16xlarge</td><td>20000.00</td><td>2500.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>48 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8in.24xlarge</td><td>30000.00</td><td>3750.00</td><td>120000.00</td><td>✓ Yes</td><td>✗ No</td><td>64 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8in.32xlarge</td><td>40000.00</td><td>5000.00</td><td>160000.00</td><td>✓ Yes</td><td>✗ No</td><td>88 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8in.48xlarge</td><td>60000.00</td><td>7500.00</td><td>240000.00</td><td>✓ Yes</td><td>✗ No</td><td>128 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8in.96xlarge</td><td>120000.00</td><td>15000.00</td><td>480000.00</td><td>✓ Yes</td><td>✓ Yes ([2 EBS cards](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ebs_cards.html))</td><td>128 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td colspan="7">M8idn</td></tr>
  <tr><td>m8idn.large 1</td><td>650.00 / 10000.00</td><td>81.25 / 1250.00</td><td>3600.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8idn.xlarge 1</td><td>1250.00 / 10000.00</td><td>156.25 / 1250.00</td><td>6000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8idn.2xlarge 1</td><td>2500.00 / 10000.00</td><td>312.50 / 1250.00</td><td>12000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8idn.4xlarge 1</td><td>5000.00 / 10000.00</td><td>625.00 / 1250.00</td><td>20000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8idn.8xlarge</td><td>10000.00</td><td>1250.00</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8idn.12xlarge</td><td>15000.00</td><td>1875.00</td><td>60000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8idn.16xlarge</td><td>20000.00</td><td>2500.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>48 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8idn.24xlarge</td><td>30000.00</td><td>3750.00</td><td>120000.00</td><td>✓ Yes</td><td>✗ No</td><td>64 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8idn.32xlarge</td><td>40000.00</td><td>5000.00</td><td>160000.00</td><td>✓ Yes</td><td>✗ No</td><td>88 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8idn.48xlarge</td><td>60000.00</td><td>7500.00</td><td>240000.00</td><td>✓ Yes</td><td>✗ No</td><td>128 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8idn.96xlarge</td><td>120000.00</td><td>15000.00</td><td>480000.00</td><td>✓ Yes</td><td>✓ Yes ([2 EBS cards](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ebs_cards.html))</td><td>128 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td colspan="7">M8ine</td></tr>
  <tr><td>m8ine.large 1</td><td>650.00 / 10000.00</td><td>81.25 / 1250.00</td><td>3600.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8ine.xlarge 1</td><td>1250.00 / 10000.00</td><td>156.25 / 1250.00</td><td>6000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8ine.2xlarge 1</td><td>2500.00 / 10000.00</td><td>312.50 / 1250.00</td><td>12000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8ine.4xlarge 1</td><td>5000.00 / 10000.00</td><td>625.00 / 1250.00</td><td>20000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8ine.8xlarge</td><td>10000.00</td><td>1250.00</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8ine.12xlarge</td><td>15000.00</td><td>1875.00</td><td>60000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td colspan="7">M8ib</td></tr>
  <tr><td>m8ib.large 1</td><td>1563.00 / 25000.00</td><td>195.38 / 3125.00</td><td>7500.00 / 120000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8ib.xlarge 1</td><td>3125.00 / 25000.00</td><td>390.62 / 3125.00</td><td>15000.00 / 120000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8ib.2xlarge 1</td><td>6250.00 / 25000.00</td><td>781.25 / 3125.00</td><td>30000.00 / 120000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8ib.4xlarge 1</td><td>12500.00 / 25000.00</td><td>1562.50 / 3125.00</td><td>60000.00 / 120000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8ib.8xlarge</td><td>25000.00</td><td>3125.00</td><td>120000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8ib.12xlarge</td><td>37500.00</td><td>4687.50</td><td>180000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8ib.16xlarge</td><td>50000.00</td><td>6250.00</td><td>240000.00</td><td>✓ Yes</td><td>✗ No</td><td>48 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8ib.24xlarge</td><td>75000.00</td><td>9375.00</td><td>360000.00</td><td>✓ Yes</td><td>✗ No</td><td>64 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8ib.32xlarge</td><td>100000.00</td><td>12500.00</td><td>480000.00</td><td>✓ Yes</td><td>✗ No</td><td>88 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8ib.48xlarge</td><td>150000.00</td><td>18750.00</td><td>720000.00</td><td>✓ Yes</td><td>✗ No</td><td>128 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8ib.96xlarge</td><td>300000.00</td><td>37500.00</td><td>1440000.00</td><td>✓ Yes</td><td>✓ Yes ([2 EBS cards](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ebs_cards.html))</td><td>128 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td colspan="7">M8idb</td></tr>
  <tr><td>m8idb.large 1</td><td>1563.00 / 25000.00</td><td>195.38 / 3125.00</td><td>7500.00 / 120000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8idb.xlarge 1</td><td>3125.00 / 25000.00</td><td>390.62 / 3125.00</td><td>15000.00 / 120000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8idb.2xlarge 1</td><td>6250.00 / 25000.00</td><td>781.25 / 3125.00</td><td>30000.00 / 120000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8idb.4xlarge 1</td><td>12500.00 / 25000.00</td><td>1562.50 / 3125.00</td><td>60000.00 / 120000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8idb.8xlarge</td><td>25000.00</td><td>3125.00</td><td>120000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8idb.12xlarge</td><td>37500.00</td><td>4687.50</td><td>180000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8idb.16xlarge</td><td>50000.00</td><td>6250.00</td><td>240000.00</td><td>✓ Yes</td><td>✗ No</td><td>48 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8idb.24xlarge</td><td>75000.00</td><td>9375.00</td><td>360000.00</td><td>✓ Yes</td><td>✗ No</td><td>64 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8idb.32xlarge</td><td>100000.00</td><td>12500.00</td><td>480000.00</td><td>✓ Yes</td><td>✗ No</td><td>88 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8idb.48xlarge</td><td>150000.00</td><td>18750.00</td><td>720000.00</td><td>✓ Yes</td><td>✗ No</td><td>128 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>m8idb.96xlarge</td><td>300000.00</td><td>37500.00</td><td>1440000.00</td><td>✓ Yes</td><td>✓ Yes ([2 EBS cards](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ebs_cards.html))</td><td>128 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td colspan="7">Mac1</td></tr>
  <tr><td>mac1.metal</td><td>14000.00</td><td>1750.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 16 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td colspan="7">Mac2</td></tr>
  <tr><td>mac2.metal</td><td>10000.00</td><td>1250.00</td><td>55000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 10 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td colspan="7">Mac2-m1ultra</td></tr>
  <tr><td>mac2-m1ultra.metal</td><td>10000.00</td><td>1250.00</td><td>55000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 10 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td colspan="7">Mac2-m2</td></tr>
  <tr><td>mac2-m2.metal</td><td>8000.00</td><td>1000.00</td><td>55000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 10 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td colspan="7">Mac2-m2pro</td></tr>
  <tr><td>mac2-m2pro.metal</td><td>8000.00</td><td>1000.00</td><td>55000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 10 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td colspan="7">Mac-m4</td></tr>
  <tr><td>mac-m4.metal</td><td>8000.00</td><td>1000.00</td><td>55000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 31 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td colspan="7">Mac-m4pro</td></tr>
  <tr><td>mac-m4pro.metal</td><td>8000.00</td><td>1000.00</td><td>55000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 31 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td colspan="7">Mac-m4max</td></tr>
  <tr><td>mac-m4max.metal</td><td>10000.00</td><td>1250.00</td><td>55000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 10 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td colspan="7">T2</td></tr>
  <tr><td colspan="7">T3</td></tr>
  <tr><td>t3.nano 1</td><td>43.00 / 2085.00</td><td>5.38 / 260.62</td><td>250.00 / 11800.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>t3.micro 1</td><td>87.00 / 2085.00</td><td>10.88 / 260.62</td><td>500.00 / 11800.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>t3.small 1</td><td>174.00 / 2085.00</td><td>21.75 / 260.62</td><td>1000.00 / 11800.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>t3.medium 1</td><td>347.00 / 2085.00</td><td>43.38 / 260.62</td><td>2000.00 / 11800.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>t3.large 1</td><td>695.00 / 2780.00</td><td>86.88 / 347.50</td><td>4000.00 / 15700.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>t3.xlarge 1</td><td>695.00 / 2780.00</td><td>86.88 / 347.50</td><td>4000.00 / 15700.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>t3.2xlarge 1</td><td>695.00 / 2780.00</td><td>86.88 / 347.50</td><td>4000.00 / 15700.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td colspan="7">T3a</td></tr>
  <tr><td>t3a.nano 1</td><td>45.00 / 2085.00</td><td>5.62 / 260.62</td><td>250.00 / 11800.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>t3a.micro 1</td><td>90.00 / 2085.00</td><td>11.25 / 260.62</td><td>500.00 / 11800.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>t3a.small 1</td><td>175.00 / 2085.00</td><td>21.88 / 260.62</td><td>1000.00 / 11800.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>t3a.medium 1</td><td>350.00 / 2085.00</td><td>43.75 / 260.62</td><td>2000.00 / 11800.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>t3a.large 1</td><td>695.00 / 2780.00</td><td>86.88 / 347.50</td><td>4000.00 / 15700.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>t3a.xlarge 1</td><td>695.00 / 2780.00</td><td>86.88 / 347.50</td><td>4000.00 / 15700.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>t3a.2xlarge 1</td><td>695.00 / 2780.00</td><td>86.88 / 347.50</td><td>4000.00 / 15700.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td colspan="7">T4g</td></tr>
  <tr><td>t4g.nano 1</td><td>43.00 / 2085.00</td><td>5.38 / 260.62</td><td>250.00 / 11800.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>t4g.micro 1</td><td>87.00 / 2085.00</td><td>10.88 / 260.62</td><td>500.00 / 11800.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>t4g.small 1</td><td>174.00 / 2085.00</td><td>21.75 / 260.62</td><td>1000.00 / 11800.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>t4g.medium 1</td><td>347.00 / 2085.00</td><td>43.38 / 260.62</td><td>2000.00 / 11800.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>t4g.large 1</td><td>695.00 / 2780.00</td><td>86.88 / 347.50</td><td>4000.00 / 15700.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>t4g.xlarge 1</td><td>695.00 / 2780.00</td><td>86.88 / 347.50</td><td>4000.00 / 15700.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>t4g.2xlarge 1</td><td>695.00 / 2780.00</td><td>86.88 / 347.50</td><td>4000.00 / 15700.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
</tbody>
</table>


**Note**  
1 These instances can support maximum performance for 30 minutes at least once every 24 hours, after which they revert to their baseline performance. Other instances can sustain the maximum performance indefinitely. If your workload requires sustained maximum performance for longer than 30 minutes, use one of these instances.

## Instance store specifications
<a name="gp_instance-store"></a>

The following table shows the instance store volume configuration for supported instance types, along with the aggregated IOPS performance with 4,096 byte block size at queue depth saturation. 


<table>
<thead>
  <tr><th>Instance type</th><th>Instance store volumes</th><th>Instance store type</th><th>100% random read IOPS / Write IOPS</th><th>Needs initialization 1</th><th>TRIM support 2</th></tr>
</thead>
<tbody>
  <tr><td colspan="6">M5ad</td></tr>
  <tr><td>m5ad.large</td><td>1 x 75 GB</td><td>NVMe SSD</td><td>30,000 / 15,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m5ad.xlarge</td><td>1 x 150 GB</td><td>NVMe SSD</td><td>59,000 / 29,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m5ad.2xlarge</td><td>1 x 300 GB</td><td>NVMe SSD</td><td>117,000 / 57,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m5ad.4xlarge</td><td>2 x 300 GB</td><td>NVMe SSD</td><td>234,000 / 114,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m5ad.8xlarge</td><td>2 x 600 GB</td><td>NVMe SSD</td><td>466,666 / 233,334</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m5ad.12xlarge</td><td>2 x 900 GB</td><td>NVMe SSD</td><td>700,000 / 340,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m5ad.16xlarge</td><td>4 x 600 GB</td><td>NVMe SSD</td><td>933,332 / 466,668</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m5ad.24xlarge</td><td>4 x 900 GB</td><td>NVMe SSD</td><td>1,400,000 / 680,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td colspan="6">M5d</td></tr>
  <tr><td>m5d.large</td><td>1 x 75 GB</td><td>NVMe SSD</td><td>30,000 / 15,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m5d.xlarge</td><td>1 x 150 GB</td><td>NVMe SSD</td><td>59,000 / 29,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m5d.2xlarge</td><td>1 x 300 GB</td><td>NVMe SSD</td><td>117,000 / 57,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m5d.4xlarge</td><td>2 x 300 GB</td><td>NVMe SSD</td><td>234,000 / 114,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m5d.8xlarge</td><td>2 x 600 GB</td><td>NVMe SSD</td><td>466,666 / 233,334</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m5d.12xlarge</td><td>2 x 900 GB</td><td>NVMe SSD</td><td>700,000 / 340,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m5d.16xlarge</td><td>4 x 600 GB</td><td>NVMe SSD</td><td>933,332 / 466,668</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m5d.24xlarge</td><td>4 x 900 GB</td><td>NVMe SSD</td><td>1,400,000 / 680,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m5d.metal</td><td>4 x 900 GB</td><td>NVMe SSD</td><td>1,400,000 / 680,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td colspan="6">M5dn</td></tr>
  <tr><td>m5dn.large</td><td>1 x 75 GB</td><td>NVMe SSD</td><td>29,000 / 14,500</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m5dn.xlarge</td><td>1 x 150 GB</td><td>NVMe SSD</td><td>58,000 / 29,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m5dn.2xlarge</td><td>1 x 300 GB</td><td>NVMe SSD</td><td>116,000 / 58,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m5dn.4xlarge</td><td>2 x 300 GB</td><td>NVMe SSD</td><td>232,000 / 116,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m5dn.8xlarge</td><td>2 x 600 GB</td><td>NVMe SSD</td><td>464,000 / 232,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m5dn.12xlarge</td><td>2 x 900 GB</td><td>NVMe SSD</td><td>700,000 / 350,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m5dn.16xlarge</td><td>4 x 600 GB</td><td>NVMe SSD</td><td>930,000 / 465,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m5dn.24xlarge</td><td>4 x 900 GB</td><td>NVMe SSD</td><td>1,400,000 / 700,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m5dn.metal</td><td>4 x 900 GB</td><td>NVMe SSD</td><td>1,400,000 / 700,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td colspan="6">M6gd</td></tr>
  <tr><td>m6gd.medium</td><td>1 x 59 GB</td><td>NVMe SSD</td><td>13,438 / 5,625</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m6gd.large</td><td>1 x 118 GB</td><td>NVMe SSD</td><td>26,875 / 11,250</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m6gd.xlarge</td><td>1 x 237 GB</td><td>NVMe SSD</td><td>53,750 / 22,500</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m6gd.2xlarge</td><td>1 x 474 GB</td><td>NVMe SSD</td><td>107,500 / 45,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m6gd.4xlarge</td><td>1 x 950 GB</td><td>NVMe SSD</td><td>215,000 / 90,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m6gd.8xlarge</td><td>1 x 1900 GB</td><td>NVMe SSD</td><td>430,000 / 180,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m6gd.12xlarge</td><td>2 x 1425 GB</td><td>NVMe SSD</td><td>645,000 / 270,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m6gd.16xlarge</td><td>2 x 1900 GB</td><td>NVMe SSD</td><td>860,000 / 360,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m6gd.metal</td><td>2 x 1900 GB</td><td>NVMe SSD</td><td>860,000 / 360,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td colspan="6">M6id</td></tr>
  <tr><td>m6id.large</td><td>1 x 118 GB</td><td>NVMe SSD</td><td>33,542 / 16,771</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m6id.xlarge</td><td>1 x 237 GB</td><td>NVMe SSD</td><td>67,083 / 33,542</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m6id.2xlarge</td><td>1 x 474 GB</td><td>NVMe SSD</td><td>134,167 / 67,084</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m6id.4xlarge</td><td>1 x 950 GB</td><td>NVMe SSD</td><td>268,333 / 134,167</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m6id.8xlarge</td><td>1 x 1900 GB</td><td>NVMe SSD</td><td>536,666 / 268,334</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m6id.12xlarge</td><td>2 x 1425 GB</td><td>NVMe SSD</td><td>804,998 / 402,500</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m6id.16xlarge</td><td>2 x 1900 GB</td><td>NVMe SSD</td><td>1,073,332 / 536,668</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m6id.24xlarge</td><td>4 x 1425 GB</td><td>NVMe SSD</td><td>1,609,996 / 805,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m6id.32xlarge</td><td>4 x 1900 GB</td><td>NVMe SSD</td><td>2,146,664 / 1,073,336</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m6id.metal</td><td>4 x 1900 GB</td><td>NVMe SSD</td><td>2,146,664 / 1,073,336</td><td> </td><td>✓ Yes</td></tr>
  <tr><td colspan="6">M6idn</td></tr>
  <tr><td>m6idn.large</td><td>1 x 118 GB</td><td>NVMe SSD</td><td>33,542 / 16,771</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m6idn.xlarge</td><td>1 x 237 GB</td><td>NVMe SSD</td><td>67,083 / 33,542</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m6idn.2xlarge</td><td>1 x 474 GB</td><td>NVMe SSD</td><td>134,167 / 67,084</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m6idn.4xlarge</td><td>1 x 950 GB</td><td>NVMe SSD</td><td>268,333 / 134,167</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m6idn.8xlarge</td><td>1 x 1900 GB</td><td>NVMe SSD</td><td>536,666 / 268,334</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m6idn.12xlarge</td><td>2 x 1425 GB</td><td>NVMe SSD</td><td>804,998 / 402,500</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m6idn.16xlarge</td><td>2 x 1900 GB</td><td>NVMe SSD</td><td>1,073,332 / 536,668</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m6idn.24xlarge</td><td>4 x 1425 GB</td><td>NVMe SSD</td><td>1,609,996 / 805,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m6idn.32xlarge</td><td>4 x 1900 GB</td><td>NVMe SSD</td><td>2,146,664 / 1,073,336</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m6idn.metal</td><td>4 x 1900 GB</td><td>NVMe SSD</td><td>2,146,664 / 1,073,336</td><td> </td><td>✓ Yes</td></tr>
  <tr><td colspan="6">M7gd</td></tr>
  <tr><td>m7gd.medium</td><td>1 x 59 GB</td><td>NVMe SSD</td><td>16,771 / 8,385</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m7gd.large</td><td>1 x 118 GB</td><td>NVMe SSD</td><td>33,542 / 16,771</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m7gd.xlarge</td><td>1 x 237 GB</td><td>NVMe SSD</td><td>67,083 / 33,542</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m7gd.2xlarge</td><td>1 x 474 GB</td><td>NVMe SSD</td><td>134,167 / 67,084</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m7gd.4xlarge</td><td>1 x 950 GB</td><td>NVMe SSD</td><td>268,333 / 134,167</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m7gd.8xlarge</td><td>1 x 1900 GB</td><td>NVMe SSD</td><td>536,666 / 268,334</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m7gd.12xlarge</td><td>2 x 1425 GB</td><td>NVMe SSD</td><td>804,998 / 402,500</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m7gd.16xlarge</td><td>2 x 1900 GB</td><td>NVMe SSD</td><td>1,073,332 / 536,668</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m7gd.metal</td><td>2 x 1900 GB</td><td>NVMe SSD</td><td>1,073,332 / 536,668</td><td> </td><td>✓ Yes</td></tr>
  <tr><td colspan="6">M8gd</td></tr>
  <tr><td>m8gd.medium</td><td>1 x 59 GB</td><td>NVMe SSD</td><td>16,771 / 8,385</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m8gd.large</td><td>1 x 118 GB</td><td>NVMe SSD</td><td>33,542 / 16,771</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m8gd.xlarge</td><td>1 x 237 GB</td><td>NVMe SSD</td><td>67,083 / 33,542</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m8gd.2xlarge</td><td>1 x 474 GB</td><td>NVMe SSD</td><td>134,167 / 67,084</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m8gd.4xlarge</td><td>1 x 950 GB</td><td>NVMe SSD</td><td>268,333 / 134,167</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m8gd.8xlarge</td><td>1 x 1900 GB</td><td>NVMe SSD</td><td>536,666 / 268,334</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m8gd.12xlarge</td><td>3 x 950 GB</td><td>NVMe SSD</td><td>804,999 / 402,501</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m8gd.16xlarge</td><td>2 x 1900 GB</td><td>NVMe SSD</td><td>1,073,332 / 536,668</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m8gd.24xlarge</td><td>3 x 1900 GB</td><td>NVMe SSD</td><td>1,609,998 / 805,002</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m8gd.48xlarge</td><td>6 x 1900 GB</td><td>NVMe SSD</td><td>3,219,996 / 1,610,004</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m8gd.metal-24xl</td><td>3 x 1900 GB</td><td>NVMe SSD</td><td>1,609,998 / 805,002</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m8gd.metal-48xl</td><td>6 x 1900 GB</td><td>NVMe SSD</td><td>3,219,996 / 1,610,004</td><td> </td><td>✓ Yes</td></tr>
  <tr><td colspan="6">M8id</td></tr>
  <tr><td>m8id.large</td><td>1 x 118 GB</td><td>NVMe SSD</td><td>33,542 / 16,771</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m8id.xlarge</td><td>1 x 237 GB</td><td>NVMe SSD</td><td>67,083 / 33,542</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m8id.2xlarge</td><td>1 x 474 GB</td><td>NVMe SSD</td><td>134,167 / 67,084</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m8id.4xlarge</td><td>1 x 950 GB</td><td>NVMe SSD</td><td>268,333 / 134,167</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m8id.8xlarge</td><td>1 x 1900 GB</td><td>NVMe SSD</td><td>536,666 / 268,334</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m8id.12xlarge</td><td>1 x 2850 GB</td><td>NVMe SSD</td><td>804,999 / 402,501</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m8id.16xlarge</td><td>1 x 3800 GB</td><td>NVMe SSD</td><td>1,073,332 / 536,668</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m8id.24xlarge</td><td>2 x 2850 GB</td><td>NVMe SSD</td><td>1,609,998 / 805,002</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m8id.32xlarge</td><td>2 x 3800 GB</td><td>NVMe SSD</td><td>2,146,664 / 1,073,336</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m8id.48xlarge</td><td>3 x 3800 GB</td><td>NVMe SSD</td><td>3,219,996 / 1,610,004</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m8id.96xlarge</td><td>6 x 3800 GB</td><td>NVMe SSD</td><td>6,439,992 / 3,220,008</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m8id.metal-48xl</td><td>3 x 3800 GB</td><td>NVMe SSD</td><td>3,219,996 / 1,610,004</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m8id.metal-96xl</td><td>6 x 3800 GB</td><td>NVMe SSD</td><td>6,439,992 / 3,220,008</td><td> </td><td>✓ Yes</td></tr>
  <tr><td colspan="6">M8idn</td></tr>
  <tr><td>m8idn.large</td><td>1 x 118 GB</td><td>NVMe SSD</td><td>33,542 / 16,771</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m8idn.xlarge</td><td>1 x 237 GB</td><td>NVMe SSD</td><td>67,083 / 33,542</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m8idn.2xlarge</td><td>1 x 474 GB</td><td>NVMe SSD</td><td>134,167 / 67,084</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m8idn.4xlarge</td><td>1 x 950 GB</td><td>NVMe SSD</td><td>268,333 / 134,167</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m8idn.8xlarge</td><td>1 x 1900 GB</td><td>NVMe SSD</td><td>536,666 / 268,334</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m8idn.12xlarge</td><td>1 x 2850 GB</td><td>NVMe SSD</td><td>804,999 / 402,501</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m8idn.16xlarge</td><td>1 x 3800 GB</td><td>NVMe SSD</td><td>1,073,332 / 536,668</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m8idn.24xlarge</td><td>2 x 2850 GB</td><td>NVMe SSD</td><td>1,609,998 / 805,002</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m8idn.32xlarge</td><td>2 x 3800 GB</td><td>NVMe SSD</td><td>2,146,664 / 1,073,336</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m8idn.48xlarge</td><td>3 x 3800 GB</td><td>NVMe SSD</td><td>3,219,996 / 1,610,004</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m8idn.96xlarge</td><td>6 x 3800 GB</td><td>NVMe SSD</td><td>6,439,992 / 3,220,008</td><td> </td><td>✓ Yes</td></tr>
  <tr><td colspan="6">M8idb</td></tr>
  <tr><td>m8idb.large</td><td>1 x 118 GB</td><td>NVMe SSD</td><td>33,542 / 16,771</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m8idb.xlarge</td><td>1 x 237 GB</td><td>NVMe SSD</td><td>67,083 / 33,542</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m8idb.2xlarge</td><td>1 x 474 GB</td><td>NVMe SSD</td><td>134,167 / 67,084</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m8idb.4xlarge</td><td>1 x 950 GB</td><td>NVMe SSD</td><td>268,333 / 134,167</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m8idb.8xlarge</td><td>1 x 1900 GB</td><td>NVMe SSD</td><td>536,666 / 268,334</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m8idb.12xlarge</td><td>1 x 2850 GB</td><td>NVMe SSD</td><td>804,999 / 402,501</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m8idb.16xlarge</td><td>1 x 3800 GB</td><td>NVMe SSD</td><td>1,073,332 / 536,668</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m8idb.24xlarge</td><td>2 x 2850 GB</td><td>NVMe SSD</td><td>1,609,998 / 805,002</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m8idb.32xlarge</td><td>2 x 3800 GB</td><td>NVMe SSD</td><td>2,146,664 / 1,073,336</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m8idb.48xlarge</td><td>3 x 3800 GB</td><td>NVMe SSD</td><td>3,219,996 / 1,610,004</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>m8idb.96xlarge</td><td>6 x 3800 GB</td><td>NVMe SSD</td><td>6,439,992 / 3,220,008</td><td> </td><td>✓ Yes</td></tr>
  <tr><td colspan="6">Mac-m4</td></tr>
  <tr><td>mac-m4.metal</td><td>1 x 1900 GB</td><td>NVMe SSD</td><td>550,000 / 275,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td colspan="6">Mac-m4pro</td></tr>
  <tr><td>mac-m4pro.metal</td><td>1 x 1900 GB</td><td>NVMe SSD</td><td>550,000 / 275,000</td><td> </td><td>✓ Yes</td></tr>
</tbody>
</table>


1 Volumes attached to certain instances suffer a first-write penalty unless initialized. For more information, see [Optimize disk performance for instance store volumes](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/disk-performance.html).

2 For more information, see [Instance store volume TRIM support](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ssd-instance-store.html#InstanceStoreTrimSupport).

## Security specifications
<a name="gp_security"></a>


<table>
<thead>
  <tr><th>Instance type</th><th>EBS encryption</th><th>Instance store encryption</th><th>Encryption in transit</th><th>AMD SEV-SNP</th><th>NitroTPM</th><th>Nitro Enclaves</th></tr>
</thead>
<tbody>
  <tr><td colspan="7">M5</td></tr>
  <tr><td>m5.large</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>m5.xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m5.2xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m5.4xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m5.8xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m5.12xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m5.16xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m5.24xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m5.metal</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">M5a</td></tr>
  <tr><td>m5a.large</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>m5a.xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m5a.2xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m5a.4xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m5a.8xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m5a.12xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m5a.16xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m5a.24xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td colspan="7">M5ad</td></tr>
  <tr><td>m5ad.large</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>m5ad.xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m5ad.2xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m5ad.4xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m5ad.8xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m5ad.12xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m5ad.16xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m5ad.24xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td colspan="7">M5d</td></tr>
  <tr><td>m5d.large</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>m5d.xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m5d.2xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m5d.4xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m5d.8xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m5d.12xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m5d.16xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m5d.24xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m5d.metal</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">M5dn</td></tr>
  <tr><td>m5dn.large</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>m5dn.xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m5dn.2xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m5dn.4xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m5dn.8xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m5dn.12xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m5dn.16xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m5dn.24xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m5dn.metal</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">M5n</td></tr>
  <tr><td>m5n.large</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>m5n.xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m5n.2xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m5n.4xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m5n.8xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m5n.12xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m5n.16xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m5n.24xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m5n.metal</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">M5zn</td></tr>
  <tr><td>m5zn.large</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>m5zn.xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m5zn.2xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m5zn.3xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m5zn.6xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m5zn.12xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m5zn.metal</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">M6a</td></tr>
  <tr><td>m6a.large</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>m6a.xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m6a.2xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m6a.4xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m6a.8xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m6a.12xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m6a.16xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m6a.24xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m6a.32xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m6a.48xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m6a.metal</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">M6g</td></tr>
  <tr><td>m6g.medium</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>m6g.large</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m6g.xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m6g.2xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m6g.4xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m6g.8xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m6g.12xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m6g.16xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m6g.metal</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">M6gd</td></tr>
  <tr><td>m6gd.medium</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>m6gd.large</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m6gd.xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m6gd.2xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m6gd.4xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m6gd.8xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m6gd.12xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m6gd.16xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m6gd.metal</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">M6i</td></tr>
  <tr><td>m6i.large</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>m6i.xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m6i.2xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m6i.4xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m6i.8xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m6i.12xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m6i.16xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m6i.24xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m6i.32xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m6i.metal</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">M6id</td></tr>
  <tr><td>m6id.large</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>m6id.xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m6id.2xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m6id.4xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m6id.8xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m6id.12xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m6id.16xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m6id.24xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m6id.32xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m6id.metal</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">M6idn</td></tr>
  <tr><td>m6idn.large</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>m6idn.xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m6idn.2xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m6idn.4xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m6idn.8xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m6idn.12xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m6idn.16xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m6idn.24xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m6idn.32xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m6idn.metal</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">M6in</td></tr>
  <tr><td>m6in.large</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>m6in.xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m6in.2xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m6in.4xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m6in.8xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m6in.12xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m6in.16xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m6in.24xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m6in.32xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m6in.metal</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">M7a</td></tr>
  <tr><td>m7a.medium</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>m7a.large</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>m7a.xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m7a.2xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m7a.4xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m7a.8xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m7a.12xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m7a.16xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m7a.24xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m7a.32xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m7a.48xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m7a.metal-48xl</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">M7g</td></tr>
  <tr><td>m7g.medium</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>m7g.large</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m7g.xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m7g.2xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m7g.4xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m7g.8xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m7g.12xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m7g.16xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m7g.metal</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">M7gd</td></tr>
  <tr><td>m7gd.medium</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>m7gd.large</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m7gd.xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m7gd.2xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m7gd.4xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m7gd.8xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m7gd.12xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m7gd.16xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m7gd.metal</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">M7i</td></tr>
  <tr><td>m7i.large</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>m7i.xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m7i.2xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m7i.4xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m7i.8xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m7i.12xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m7i.16xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m7i.24xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m7i.48xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m7i.metal-24xl</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m7i.metal-48xl</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">M7i-flex</td></tr>
  <tr><td>m7i-flex.large</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>m7i-flex.xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>m7i-flex.2xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>m7i-flex.4xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>m7i-flex.8xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>m7i-flex.12xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>m7i-flex.16xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td colspan="7">M8a</td></tr>
  <tr><td>m8a.medium</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>m8a.large</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8a.xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8a.2xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8a.4xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8a.8xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8a.12xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8a.16xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8a.24xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8a.48xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8a.metal-24xl</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8a.metal-48xl</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">M8azn</td></tr>
  <tr><td>m8azn.medium</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>m8azn.large</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8azn.xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8azn.3xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8azn.6xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8azn.12xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8azn.24xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8azn.metal-12xl</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8azn.metal-24xl</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">M8g</td></tr>
  <tr><td>m8g.medium</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>m8g.large</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8g.xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8g.2xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8g.4xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8g.8xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8g.12xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8g.16xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8g.24xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8g.48xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8g.metal-24xl</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8g.metal-48xl</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">M8gb</td></tr>
  <tr><td>m8gb.medium</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>m8gb.large</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8gb.xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8gb.2xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8gb.4xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8gb.8xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8gb.12xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8gb.16xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8gb.24xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8gb.48xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8gb.metal-24xl</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8gb.metal-48xl</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">M8gd</td></tr>
  <tr><td>m8gd.medium</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>m8gd.large</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8gd.xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8gd.2xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8gd.4xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8gd.8xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8gd.12xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8gd.16xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8gd.24xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8gd.48xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8gd.metal-24xl</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8gd.metal-48xl</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">M8gn</td></tr>
  <tr><td>m8gn.medium</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>m8gn.large</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8gn.xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8gn.2xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8gn.4xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8gn.8xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8gn.12xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8gn.16xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8gn.24xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8gn.48xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8gn.metal-24xl</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8gn.metal-48xl</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">M8i</td></tr>
  <tr><td>m8i.large</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>m8i.xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8i.2xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8i.4xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8i.8xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8i.12xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8i.16xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8i.24xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8i.32xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8i.48xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8i.96xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8i.metal-48xl</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8i.metal-96xl</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">M8id</td></tr>
  <tr><td>m8id.large</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>m8id.xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8id.2xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8id.4xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8id.8xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8id.12xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8id.16xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8id.24xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8id.32xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8id.48xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8id.96xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8id.metal-48xl</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m8id.metal-96xl</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">M8i-flex</td></tr>
  <tr><td>m8i-flex.large</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>m8i-flex.xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>m8i-flex.2xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>m8i-flex.4xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>m8i-flex.8xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>m8i-flex.12xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>m8i-flex.16xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td colspan="7">M8in</td></tr>
  <tr><td>m8in.large</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>m8in.xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8in.2xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8in.4xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8in.8xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8in.12xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8in.16xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8in.24xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8in.32xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8in.48xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8in.96xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td colspan="7">M8idn</td></tr>
  <tr><td>m8idn.large</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>m8idn.xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8idn.2xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8idn.4xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8idn.8xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8idn.12xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8idn.16xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8idn.24xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8idn.32xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8idn.48xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8idn.96xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td colspan="7">M8ine</td></tr>
  <tr><td>m8ine.large</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>m8ine.xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8ine.2xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8ine.4xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8ine.8xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8ine.12xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td colspan="7">M8ib</td></tr>
  <tr><td>m8ib.large</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>m8ib.xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8ib.2xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8ib.4xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8ib.8xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8ib.12xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8ib.16xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8ib.24xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8ib.32xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8ib.48xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8ib.96xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td colspan="7">M8idb</td></tr>
  <tr><td>m8idb.large</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>m8idb.xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8idb.2xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8idb.4xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8idb.8xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8idb.12xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8idb.16xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8idb.24xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8idb.32xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8idb.48xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>m8idb.96xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td colspan="7">Mac1</td></tr>
  <tr><td>mac1.metal</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">Mac2</td></tr>
  <tr><td>mac2.metal</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">Mac2-m1ultra</td></tr>
  <tr><td>mac2-m1ultra.metal</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">Mac2-m2</td></tr>
  <tr><td>mac2-m2.metal</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">Mac2-m2pro</td></tr>
  <tr><td>mac2-m2pro.metal</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">Mac-m4</td></tr>
  <tr><td>mac-m4.metal</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">Mac-m4pro</td></tr>
  <tr><td>mac-m4pro.metal</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">Mac-m4max</td></tr>
  <tr><td>mac-m4max.metal</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">T2</td></tr>
  <tr><td>t2.nano</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>t2.micro</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>t2.small</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>t2.medium</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>t2.large</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>t2.xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>t2.2xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">T3</td></tr>
  <tr><td>t3.nano</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>t3.micro</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>t3.small</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>t3.medium</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>t3.large</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>t3.xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>t3.2xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td colspan="7">T3a</td></tr>
  <tr><td>t3a.nano</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>t3a.micro</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>t3a.small</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>t3a.medium</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>t3a.large</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>t3a.xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>t3a.2xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td colspan="7">T4g</td></tr>
  <tr><td>t4g.nano</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>t4g.micro</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>t4g.small</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>t4g.medium</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>t4g.large</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>t4g.xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>t4g.2xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
</tbody>
</table>
