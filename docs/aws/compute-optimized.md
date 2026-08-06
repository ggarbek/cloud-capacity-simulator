

# Specifications for Amazon EC2 compute optimized instances
<a name="co"></a>

Compute optimized instances are designed for compute intensive applications that benefit from high performance processors. These instances are ideal for batch processing workloads, media transcoding, high performance web servers, high performance computing (HPC), scientific modeling, dedicated gaming servers, ad server engines, and machine learning inference.

For information on previous generation instance types of this category, such as C4 instances, see [Specifications for Amazon EC2 previous generation instances](pg.md).

**Topics**
+ [Instance families and instance types](#co_sizes)
+ [Instance family summary](#co_summary)
+ [Performance specifications](#co_hardware)
+ [Network specifications](#co_network)
+ [Amazon EBS specifications](#co_storage-ebs)
+ [Instance store specifications](#co_instance-store)
+ [Security specifications](#co_security)

**Pricing**  
For pricing information, see [Amazon EC2 On-Demand Pricing](https://aws.amazon.com/ec2/pricing/on-demand/).

## Instance families and instance types
<a name="co_sizes"></a>


| Instance family | Available instance types | 
| --- | --- | 
| C5 | c5.large \| c5.xlarge \| c5.2xlarge \| c5.4xlarge \| c5.9xlarge \| c5.12xlarge \| c5.18xlarge \| c5.24xlarge \| c5.metal | 
| C5a | c5a.large \| c5a.xlarge \| c5a.2xlarge \| c5a.4xlarge \| c5a.8xlarge \| c5a.12xlarge \| c5a.16xlarge \| c5a.24xlarge | 
| C5ad | c5ad.large \| c5ad.xlarge \| c5ad.2xlarge \| c5ad.4xlarge \| c5ad.8xlarge \| c5ad.12xlarge \| c5ad.16xlarge \| c5ad.24xlarge | 
| C5d | c5d.large \| c5d.xlarge \| c5d.2xlarge \| c5d.4xlarge \| c5d.9xlarge \| c5d.12xlarge \| c5d.18xlarge \| c5d.24xlarge \| c5d.metal | 
| C5n | c5n.large \| c5n.xlarge \| c5n.2xlarge \| c5n.4xlarge \| c5n.9xlarge \| c5n.18xlarge \| c5n.metal | 
| C6a | c6a.large \| c6a.xlarge \| c6a.2xlarge \| c6a.4xlarge \| c6a.8xlarge \| c6a.12xlarge \| c6a.16xlarge \| c6a.24xlarge \| c6a.32xlarge \| c6a.48xlarge \| c6a.metal | 
| C6g | c6g.medium \| c6g.large \| c6g.xlarge \| c6g.2xlarge \| c6g.4xlarge \| c6g.8xlarge \| c6g.12xlarge \| c6g.16xlarge \| c6g.metal | 
| C6gd | c6gd.medium \| c6gd.large \| c6gd.xlarge \| c6gd.2xlarge \| c6gd.4xlarge \| c6gd.8xlarge \| c6gd.12xlarge \| c6gd.16xlarge \| c6gd.metal | 
| C6gn | c6gn.medium \| c6gn.large \| c6gn.xlarge \| c6gn.2xlarge \| c6gn.4xlarge \| c6gn.8xlarge \| c6gn.12xlarge \| c6gn.16xlarge | 
| C6i | c6i.large \| c6i.xlarge \| c6i.2xlarge \| c6i.4xlarge \| c6i.8xlarge \| c6i.12xlarge \| c6i.16xlarge \| c6i.24xlarge \| c6i.32xlarge \| c6i.metal | 
| C6id | c6id.large \| c6id.xlarge \| c6id.2xlarge \| c6id.4xlarge \| c6id.8xlarge \| c6id.12xlarge \| c6id.16xlarge \| c6id.24xlarge \| c6id.32xlarge \| c6id.metal | 
| C6in | c6in.large \| c6in.xlarge \| c6in.2xlarge \| c6in.4xlarge \| c6in.8xlarge \| c6in.12xlarge \| c6in.16xlarge \| c6in.24xlarge \| c6in.32xlarge \| c6in.metal | 
| C7a | c7a.medium \| c7a.large \| c7a.xlarge \| c7a.2xlarge \| c7a.4xlarge \| c7a.8xlarge \| c7a.12xlarge \| c7a.16xlarge \| c7a.24xlarge \| c7a.32xlarge \| c7a.48xlarge \| c7a.metal-48xl | 
| C7g | c7g.medium \| c7g.large \| c7g.xlarge \| c7g.2xlarge \| c7g.4xlarge \| c7g.8xlarge \| c7g.12xlarge \| c7g.16xlarge \| c7g.metal | 
| C7gd | c7gd.medium \| c7gd.large \| c7gd.xlarge \| c7gd.2xlarge \| c7gd.4xlarge \| c7gd.8xlarge \| c7gd.12xlarge \| c7gd.16xlarge \| c7gd.metal | 
| C7gn | c7gn.medium \| c7gn.large \| c7gn.xlarge \| c7gn.2xlarge \| c7gn.4xlarge \| c7gn.8xlarge \| c7gn.12xlarge \| c7gn.16xlarge \| c7gn.metal | 
| C7i | c7i.large \| c7i.xlarge \| c7i.2xlarge \| c7i.4xlarge \| c7i.8xlarge \| c7i.12xlarge \| c7i.16xlarge \| c7i.24xlarge \| c7i.48xlarge \| c7i.metal-24xl \| c7i.metal-48xl | 
| C7i-flex | c7i-flex.large \| c7i-flex.xlarge \| c7i-flex.2xlarge \| c7i-flex.4xlarge \| c7i-flex.8xlarge \| c7i-flex.12xlarge \| c7i-flex.16xlarge | 
| C8a | c8a.medium \| c8a.large \| c8a.xlarge \| c8a.2xlarge \| c8a.4xlarge \| c8a.8xlarge \| c8a.12xlarge \| c8a.16xlarge \| c8a.24xlarge \| c8a.48xlarge \| c8a.metal-24xl \| c8a.metal-48xl | 
| C8g | c8g.medium \| c8g.large \| c8g.xlarge \| c8g.2xlarge \| c8g.4xlarge \| c8g.8xlarge \| c8g.12xlarge \| c8g.16xlarge \| c8g.24xlarge \| c8g.48xlarge \| c8g.metal-24xl \| c8g.metal-48xl | 
| C8gb | c8gb.medium \| c8gb.large \| c8gb.xlarge \| c8gb.2xlarge \| c8gb.4xlarge \| c8gb.8xlarge \| c8gb.12xlarge \| c8gb.16xlarge \| c8gb.24xlarge \| c8gb.48xlarge \| c8gb.metal-24xl \| c8gb.metal-48xl | 
| C8gd | c8gd.medium \| c8gd.large \| c8gd.xlarge \| c8gd.2xlarge \| c8gd.4xlarge \| c8gd.8xlarge \| c8gd.12xlarge \| c8gd.16xlarge \| c8gd.24xlarge \| c8gd.48xlarge \| c8gd.metal-24xl \| c8gd.metal-48xl | 
| C8gn | c8gn.medium \| c8gn.large \| c8gn.xlarge \| c8gn.2xlarge \| c8gn.4xlarge \| c8gn.8xlarge \| c8gn.12xlarge \| c8gn.16xlarge \| c8gn.24xlarge \| c8gn.48xlarge \| c8gn.metal-24xl \| c8gn.metal-48xl | 
| C8i | c8i.large \| c8i.xlarge \| c8i.2xlarge \| c8i.4xlarge \| c8i.8xlarge \| c8i.12xlarge \| c8i.16xlarge \| c8i.24xlarge \| c8i.32xlarge \| c8i.48xlarge \| c8i.96xlarge \| c8i.metal-48xl \| c8i.metal-96xl | 
| C8id | c8id.large \| c8id.xlarge \| c8id.2xlarge \| c8id.4xlarge \| c8id.8xlarge \| c8id.12xlarge \| c8id.16xlarge \| c8id.24xlarge \| c8id.32xlarge \| c8id.48xlarge \| c8id.96xlarge \| c8id.metal-48xl \| c8id.metal-96xl | 
| C8i-flex | c8i-flex.large \| c8i-flex.xlarge \| c8i-flex.2xlarge \| c8i-flex.4xlarge \| c8i-flex.8xlarge \| c8i-flex.12xlarge \| c8i-flex.16xlarge | 
| C8in | c8in.large \| c8in.xlarge \| c8in.2xlarge \| c8in.4xlarge \| c8in.8xlarge \| c8in.12xlarge \| c8in.16xlarge \| c8in.24xlarge \| c8in.32xlarge \| c8in.48xlarge \| c8in.96xlarge \| c8in.metal-48xl \| c8in.metal-96xl | 
| C8ine | c8ine.large \| c8ine.xlarge \| c8ine.2xlarge \| c8ine.4xlarge \| c8ine.8xlarge \| c8ine.12xlarge | 
| C8ib | c8ib.large \| c8ib.xlarge \| c8ib.2xlarge \| c8ib.4xlarge \| c8ib.8xlarge \| c8ib.12xlarge \| c8ib.16xlarge \| c8ib.24xlarge \| c8ib.32xlarge \| c8ib.48xlarge \| c8ib.96xlarge \| c8ib.metal-48xl \| c8ib.metal-96xl | 

## Instance family summary
<a name="co_summary"></a>


| Instance family | Hypervisor | Processor type (architecture) | Metal instances available | Dedicated Hosts support | Spot support | Hibernation support | Supported operating systems | 
| --- | --- | --- | --- | --- | --- | --- | --- | 
| C5 | [Nitro v2](ec2-nitro-instances.md) | Intel (x86\_64) | ✓ Yes | ✓ Yes | ✓ Yes | ✓ Yes | Windows \| Linux | 
| C5a | [Nitro v2](ec2-nitro-instances.md) | AMD (x86\_64) | ✗ No | ✗ No | ✓ Yes | ✗ No | Windows \| Linux | 
| C5ad | [Nitro v2](ec2-nitro-instances.md) | AMD (x86\_64) | ✗ No | ✗ No | ✓ Yes | ✗ No | Windows \| Linux | 
| C5d | [Nitro v2](ec2-nitro-instances.md) | Intel (x86\_64) | ✓ Yes | ✓ Yes | ✓ Yes | ✓ Yes | Windows \| Linux | 
| C5n | [Nitro v3](ec2-nitro-instances.md) | Intel (x86\_64) | ✓ Yes | ✓ Yes | ✓ Yes | ✗ No | Windows \| Linux | 
| C6a | [Nitro v4](ec2-nitro-instances.md) | AMD (x86\_64) | ✓ Yes | ✓ Yes | ✓ Yes | ✓ Yes | Windows \| Linux | 
| C6g | [Nitro v2](ec2-nitro-instances.md) | AWS Graviton (arm64) | ✓ Yes | ✓ Yes | ✓ Yes | ✓ Yes | Linux | 
| C6gd | [Nitro v2](ec2-nitro-instances.md) | AWS Graviton (arm64) | ✓ Yes | ✓ Yes | ✓ Yes | ✓ Yes | Linux | 
| C6gn | [Nitro v4](ec2-nitro-instances.md) | AWS Graviton (arm64) | ✗ No | ✓ Yes | ✓ Yes | ✓ Yes | Linux | 
| C6i | [Nitro v4](ec2-nitro-instances.md) | Intel (x86\_64) | ✓ Yes | ✓ Yes | ✓ Yes | ✓ Yes | Windows \| Linux | 
| C6id | [Nitro v4](ec2-nitro-instances.md) | Intel (x86\_64) | ✓ Yes | ✓ Yes | ✓ Yes | ✓ Yes | Windows \| Linux | 
| C6in | [Nitro v4](ec2-nitro-instances.md) | Intel (x86\_64) | ✓ Yes | ✓ Yes | ✓ Yes | ✓ Yes | Windows \| Linux | 
| C7a | [Nitro v4](ec2-nitro-instances.md) | AMD (x86\_64) | ✓ Yes | ✓ Yes | ✓ Yes | ✓ Yes | Windows \| Linux | 
| C7g | [Nitro v4](ec2-nitro-instances.md) | AWS Graviton (arm64) | ✓ Yes | ✓ Yes | ✓ Yes | ✓ Yes | Linux | 
| C7gd | [Nitro v4](ec2-nitro-instances.md) | AWS Graviton (arm64) | ✓ Yes | ✓ Yes | ✓ Yes | ✓ Yes | Linux | 
| C7gn | [Nitro v5](ec2-nitro-instances.md) | AWS Graviton (arm64) | ✓ Yes | ✓ Yes | ✓ Yes | ✓ Yes | Linux | 
| C7i | [Nitro v4](ec2-nitro-instances.md) | Intel (x86\_64) | ✓ Yes | ✓ Yes | ✓ Yes | ✓ Yes | Windows \| Linux | 
| C7i-flex | [Nitro v4](ec2-nitro-instances.md) | Intel (x86\_64) | ✗ No | ✗ No | ✓ Yes | ✓ Yes | Windows \| Linux | 
| C8a | [Nitro v6](ec2-nitro-instances.md) | AMD (x86\_64) | ✓ Yes | ✓ Yes | ✓ Yes | ✓ Yes | Windows \| Linux | 
| C8g | [Nitro v5](ec2-nitro-instances.md) | AWS Graviton (arm64) | ✓ Yes | ✓ Yes | ✓ Yes | ✓ Yes | Linux | 
| C8gb | [Nitro v6](ec2-nitro-instances.md) | AWS Graviton (arm64) | ✓ Yes | ✓ Yes | ✓ Yes | ✓ Yes | Linux | 
| C8gd | [Nitro v5](ec2-nitro-instances.md) | AWS Graviton (arm64) | ✓ Yes | ✓ Yes | ✓ Yes | ✓ Yes | Linux | 
| C8gn | [Nitro v6](ec2-nitro-instances.md) | AWS Graviton (arm64) | ✓ Yes | ✓ Yes | ✓ Yes | ✓ Yes | Linux | 
| C8i | [Nitro v6](ec2-nitro-instances.md) | Intel (x86\_64) | ✓ Yes | ✓ Yes | ✓ Yes | ✓ Yes | Windows \| Linux | 
| C8id | [Nitro v6](ec2-nitro-instances.md) | Intel (x86\_64) | ✓ Yes | ✓ Yes | ✓ Yes | ✗ No | Windows \| Linux | 
| C8i-flex | [Nitro v6](ec2-nitro-instances.md) | Intel (x86\_64) | ✗ No | ✗ No | ✓ Yes | ✓ Yes | Windows \| Linux | 
| C8in | [Nitro v6](ec2-nitro-instances.md) | Intel (x86\_64) | ✓ Yes | ✓ Yes | ✓ Yes | ✓ Yes | Windows \| Linux | 
| C8ine | [Nitro v6](ec2-nitro-instances.md) | Intel (x86\_64) | ✗ No | ✗ No | ✗ No | ✗ No | Windows \| Linux | 
| C8ib | [Nitro v6](ec2-nitro-instances.md) | Intel (x86\_64) | ✓ Yes | ✓ Yes | ✓ Yes | ✓ Yes | Windows \| Linux | 

## Performance specifications
<a name="co_hardware"></a>


<table>
<thead>
  <tr><th>Instance type</th><th>Memory (GiB)</th><th>Processor</th><th>vCPUs</th><th>CPU cores</th><th>Threads per core</th><th>Accelerators</th><th>Accelerator memory</th></tr>
</thead>
<tbody>
  <tr><td colspan="8">C5</td></tr>
  <tr><td>c5.large</td><td>4.00</td><td>Intel Xeon Platinum 8124M</td><td>2</td><td>1</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c5.xlarge</td><td>8.00</td><td>Intel Xeon Platinum 8124M</td><td>4</td><td>2</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c5.2xlarge</td><td>16.00</td><td>Intel Xeon Platinum 8124M</td><td>8</td><td>4</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c5.4xlarge</td><td>32.00</td><td>Intel Xeon Platinum 8124M</td><td>16</td><td>8</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c5.9xlarge</td><td>72.00</td><td>Intel Xeon Platinum 8124M</td><td>36</td><td>18</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c5.12xlarge</td><td>96.00</td><td>2nd Gen Intel Xeon Platinum 8275CL</td><td>48</td><td>24</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c5.18xlarge</td><td>144.00</td><td>Intel Xeon Platinum 8124M</td><td>72</td><td>36</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c5.24xlarge</td><td>192.00</td><td>2nd Gen Intel Xeon Platinum 8275CL</td><td>96</td><td>48</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c5.metal</td><td>192.00</td><td>2nd Gen Intel Xeon Platinum 8275CL</td><td>96</td><td>48</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">C5a</td></tr>
  <tr><td>c5a.large</td><td>4.00</td><td>2nd Gen AMD EPYC 7R32</td><td>2</td><td>1</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c5a.xlarge</td><td>8.00</td><td>2nd Gen AMD EPYC 7R32</td><td>4</td><td>2</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c5a.2xlarge</td><td>16.00</td><td>2nd Gen AMD EPYC 7R32</td><td>8</td><td>4</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c5a.4xlarge</td><td>32.00</td><td>2nd Gen AMD EPYC 7R32</td><td>16</td><td>8</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c5a.8xlarge</td><td>64.00</td><td>2nd Gen AMD EPYC 7R32</td><td>32</td><td>16</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c5a.12xlarge</td><td>96.00</td><td>2nd Gen AMD EPYC 7R32</td><td>48</td><td>24</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c5a.16xlarge</td><td>128.00</td><td>2nd Gen AMD EPYC 7R32</td><td>64</td><td>32</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c5a.24xlarge</td><td>192.00</td><td>2nd Gen AMD EPYC 7R32</td><td>96</td><td>48</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">C5ad</td></tr>
  <tr><td>c5ad.large</td><td>4.00</td><td>2nd Gen AMD EPYC 7R32</td><td>2</td><td>1</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c5ad.xlarge</td><td>8.00</td><td>2nd Gen AMD EPYC 7R32</td><td>4</td><td>2</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c5ad.2xlarge</td><td>16.00</td><td>2nd Gen AMD EPYC 7R32</td><td>8</td><td>4</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c5ad.4xlarge</td><td>32.00</td><td>2nd Gen AMD EPYC 7R32</td><td>16</td><td>8</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c5ad.8xlarge</td><td>64.00</td><td>2nd Gen AMD EPYC 7R32</td><td>32</td><td>16</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c5ad.12xlarge</td><td>96.00</td><td>2nd Gen AMD EPYC 7R32</td><td>48</td><td>24</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c5ad.16xlarge</td><td>128.00</td><td>2nd Gen AMD EPYC 7R32</td><td>64</td><td>32</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c5ad.24xlarge</td><td>192.00</td><td>2nd Gen AMD EPYC 7R32</td><td>96</td><td>48</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">C5d</td></tr>
  <tr><td>c5d.large</td><td>4.00</td><td>Intel Xeon Platinum 8124M</td><td>2</td><td>1</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c5d.xlarge</td><td>8.00</td><td>Intel Xeon Platinum 8124M</td><td>4</td><td>2</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c5d.2xlarge</td><td>16.00</td><td>Intel Xeon Platinum 8124M</td><td>8</td><td>4</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c5d.4xlarge</td><td>32.00</td><td>Intel Xeon Platinum 8124M</td><td>16</td><td>8</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c5d.9xlarge</td><td>72.00</td><td>Intel Xeon Platinum 8124M</td><td>36</td><td>18</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c5d.12xlarge</td><td>96.00</td><td>2nd Gen Intel Xeon Platinum 8275CL</td><td>48</td><td>24</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c5d.18xlarge</td><td>144.00</td><td>Intel Xeon Platinum 8124M</td><td>72</td><td>36</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c5d.24xlarge</td><td>192.00</td><td>2nd Gen Intel Xeon Platinum 8275CL</td><td>96</td><td>48</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c5d.metal</td><td>192.00</td><td>2nd Gen Intel Xeon Platinum 8275CL</td><td>96</td><td>48</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">C5n</td></tr>
  <tr><td>c5n.large</td><td>5.25</td><td>Intel Xeon Platinum 8124M</td><td>2</td><td>1</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c5n.xlarge</td><td>10.50</td><td>Intel Xeon Platinum 8124M</td><td>4</td><td>2</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c5n.2xlarge</td><td>21.00</td><td>Intel Xeon Platinum 8124M</td><td>8</td><td>4</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c5n.4xlarge</td><td>42.00</td><td>Intel Xeon Platinum 8124M</td><td>16</td><td>8</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c5n.9xlarge</td><td>96.00</td><td>Intel Xeon Platinum 8124M</td><td>36</td><td>18</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c5n.18xlarge</td><td>192.00</td><td>Intel Xeon Platinum 8124M</td><td>72</td><td>36</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c5n.metal</td><td>192.00</td><td>Intel Xeon Platinum 8124M</td><td>72</td><td>36</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">C6a</td></tr>
  <tr><td>c6a.large</td><td>4.00</td><td>AMD EPYC 7R13</td><td>2</td><td>1</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c6a.xlarge</td><td>8.00</td><td>AMD EPYC 7R13</td><td>4</td><td>2</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c6a.2xlarge</td><td>16.00</td><td>AMD EPYC 7R13</td><td>8</td><td>4</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c6a.4xlarge</td><td>32.00</td><td>AMD EPYC 7R13</td><td>16</td><td>8</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c6a.8xlarge</td><td>64.00</td><td>AMD EPYC 7R13</td><td>32</td><td>16</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c6a.12xlarge</td><td>96.00</td><td>AMD EPYC 7R13</td><td>48</td><td>24</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c6a.16xlarge</td><td>128.00</td><td>AMD EPYC 7R13</td><td>64</td><td>32</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c6a.24xlarge</td><td>192.00</td><td>AMD EPYC 7R13</td><td>96</td><td>48</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c6a.32xlarge</td><td>256.00</td><td>AMD EPYC 7R13</td><td>128</td><td>64</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c6a.48xlarge</td><td>384.00</td><td>AMD EPYC 7R13</td><td>192</td><td>96</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c6a.metal</td><td>384.00</td><td>AMD EPYC 7R13</td><td>192</td><td>96</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">C6g</td></tr>
  <tr><td>c6g.medium</td><td>2.00</td><td>AWS Graviton2 Processor</td><td>1</td><td>1</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c6g.large</td><td>4.00</td><td>AWS Graviton2 Processor</td><td>2</td><td>2</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c6g.xlarge</td><td>8.00</td><td>AWS Graviton2 Processor</td><td>4</td><td>4</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c6g.2xlarge</td><td>16.00</td><td>AWS Graviton2 Processor</td><td>8</td><td>8</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c6g.4xlarge</td><td>32.00</td><td>AWS Graviton2 Processor</td><td>16</td><td>16</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c6g.8xlarge</td><td>64.00</td><td>AWS Graviton2 Processor</td><td>32</td><td>32</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c6g.12xlarge</td><td>96.00</td><td>AWS Graviton2 Processor</td><td>48</td><td>48</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c6g.16xlarge</td><td>128.00</td><td>AWS Graviton2 Processor</td><td>64</td><td>64</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c6g.metal</td><td>128.00</td><td>AWS Graviton2 Processor</td><td>64</td><td>64</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">C6gd</td></tr>
  <tr><td>c6gd.medium</td><td>2.00</td><td>AWS Graviton2 Processor</td><td>1</td><td>1</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c6gd.large</td><td>4.00</td><td>AWS Graviton2 Processor</td><td>2</td><td>2</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c6gd.xlarge</td><td>8.00</td><td>AWS Graviton2 Processor</td><td>4</td><td>4</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c6gd.2xlarge</td><td>16.00</td><td>AWS Graviton2 Processor</td><td>8</td><td>8</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c6gd.4xlarge</td><td>32.00</td><td>AWS Graviton2 Processor</td><td>16</td><td>16</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c6gd.8xlarge</td><td>64.00</td><td>AWS Graviton2 Processor</td><td>32</td><td>32</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c6gd.12xlarge</td><td>96.00</td><td>AWS Graviton2 Processor</td><td>48</td><td>48</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c6gd.16xlarge</td><td>128.00</td><td>AWS Graviton2 Processor</td><td>64</td><td>64</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c6gd.metal</td><td>128.00</td><td>AWS Graviton2 Processor</td><td>64</td><td>64</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">C6gn</td></tr>
  <tr><td>c6gn.medium</td><td>2.00</td><td>AWS Graviton2 Processor</td><td>1</td><td>1</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c6gn.large</td><td>4.00</td><td>AWS Graviton2 Processor</td><td>2</td><td>2</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c6gn.xlarge</td><td>8.00</td><td>AWS Graviton2 Processor</td><td>4</td><td>4</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c6gn.2xlarge</td><td>16.00</td><td>AWS Graviton2 Processor</td><td>8</td><td>8</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c6gn.4xlarge</td><td>32.00</td><td>AWS Graviton2 Processor</td><td>16</td><td>16</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c6gn.8xlarge</td><td>64.00</td><td>AWS Graviton2 Processor</td><td>32</td><td>32</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c6gn.12xlarge</td><td>96.00</td><td>AWS Graviton2 Processor</td><td>48</td><td>48</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c6gn.16xlarge</td><td>128.00</td><td>AWS Graviton2 Processor</td><td>64</td><td>64</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">C6i</td></tr>
  <tr><td>c6i.large</td><td>4.00</td><td>Intel Xeon Ice Lake</td><td>2</td><td>1</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c6i.xlarge</td><td>8.00</td><td>Intel Xeon Ice Lake</td><td>4</td><td>2</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c6i.2xlarge</td><td>16.00</td><td>Intel Xeon Ice Lake</td><td>8</td><td>4</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c6i.4xlarge</td><td>32.00</td><td>Intel Xeon Ice Lake</td><td>16</td><td>8</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c6i.8xlarge</td><td>64.00</td><td>Intel Xeon Ice Lake</td><td>32</td><td>16</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c6i.12xlarge</td><td>96.00</td><td>Intel Xeon Ice Lake</td><td>48</td><td>24</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c6i.16xlarge</td><td>128.00</td><td>Intel Xeon Ice Lake</td><td>64</td><td>32</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c6i.24xlarge</td><td>192.00</td><td>Intel Xeon Ice Lake</td><td>96</td><td>48</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c6i.32xlarge</td><td>256.00</td><td>Intel Xeon Ice Lake</td><td>128</td><td>64</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c6i.metal</td><td>256.00</td><td>Intel Xeon Ice Lake</td><td>128</td><td>64</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">C6id</td></tr>
  <tr><td>c6id.large</td><td>4.00</td><td>Intel Xeon Ice Lake</td><td>2</td><td>1</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c6id.xlarge</td><td>8.00</td><td>Intel Xeon Ice Lake</td><td>4</td><td>2</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c6id.2xlarge</td><td>16.00</td><td>Intel Xeon Ice Lake</td><td>8</td><td>4</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c6id.4xlarge</td><td>32.00</td><td>Intel Xeon Ice Lake</td><td>16</td><td>8</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c6id.8xlarge</td><td>64.00</td><td>Intel Xeon Ice Lake</td><td>32</td><td>16</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c6id.12xlarge</td><td>96.00</td><td>Intel Xeon Ice Lake</td><td>48</td><td>24</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c6id.16xlarge</td><td>128.00</td><td>Intel Xeon Ice Lake</td><td>64</td><td>32</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c6id.24xlarge</td><td>192.00</td><td>Intel Xeon Ice Lake</td><td>96</td><td>48</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c6id.32xlarge</td><td>256.00</td><td>Intel Xeon Ice Lake</td><td>128</td><td>64</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c6id.metal</td><td>256.00</td><td>Intel Xeon Ice Lake</td><td>128</td><td>64</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">C6in</td></tr>
  <tr><td>c6in.large</td><td>4.00</td><td>Intel Xeon Ice Lake</td><td>2</td><td>1</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c6in.xlarge</td><td>8.00</td><td>Intel Xeon Ice Lake</td><td>4</td><td>2</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c6in.2xlarge</td><td>16.00</td><td>Intel Xeon Ice Lake</td><td>8</td><td>4</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c6in.4xlarge</td><td>32.00</td><td>Intel Xeon Ice Lake</td><td>16</td><td>8</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c6in.8xlarge</td><td>64.00</td><td>Intel Xeon Ice Lake</td><td>32</td><td>16</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c6in.12xlarge</td><td>96.00</td><td>Intel Xeon Ice Lake</td><td>48</td><td>24</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c6in.16xlarge</td><td>128.00</td><td>Intel Xeon Ice Lake</td><td>64</td><td>32</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c6in.24xlarge</td><td>192.00</td><td>Intel Xeon Ice Lake</td><td>96</td><td>48</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c6in.32xlarge</td><td>256.00</td><td>Intel Xeon Ice Lake</td><td>128</td><td>64</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c6in.metal</td><td>256.00</td><td>Intel Xeon Ice Lake</td><td>128</td><td>64</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">C7a</td></tr>
  <tr><td>c7a.medium</td><td>2.00</td><td>AMD EPYC 9R14</td><td>1</td><td>1</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c7a.large</td><td>4.00</td><td>AMD EPYC 9R14</td><td>2</td><td>2</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c7a.xlarge</td><td>8.00</td><td>AMD EPYC 9R14</td><td>4</td><td>4</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c7a.2xlarge</td><td>16.00</td><td>AMD EPYC 9R14</td><td>8</td><td>8</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c7a.4xlarge</td><td>32.00</td><td>AMD EPYC 9R14</td><td>16</td><td>16</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c7a.8xlarge</td><td>64.00</td><td>AMD EPYC 9R14</td><td>32</td><td>32</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c7a.12xlarge</td><td>96.00</td><td>AMD EPYC 9R14</td><td>48</td><td>48</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c7a.16xlarge</td><td>128.00</td><td>AMD EPYC 9R14</td><td>64</td><td>64</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c7a.24xlarge</td><td>192.00</td><td>AMD EPYC 9R14</td><td>96</td><td>96</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c7a.32xlarge</td><td>256.00</td><td>AMD EPYC 9R14</td><td>128</td><td>128</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c7a.48xlarge</td><td>384.00</td><td>AMD EPYC 9R14</td><td>192</td><td>192</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c7a.metal-48xl</td><td>384.00</td><td>AMD EPYC 9R14</td><td>192</td><td>192</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">C7g</td></tr>
  <tr><td>c7g.medium</td><td>2.00</td><td>AWS Graviton3 Processor</td><td>1</td><td>1</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c7g.large</td><td>4.00</td><td>AWS Graviton3 Processor</td><td>2</td><td>2</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c7g.xlarge</td><td>8.00</td><td>AWS Graviton3 Processor</td><td>4</td><td>4</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c7g.2xlarge</td><td>16.00</td><td>AWS Graviton3 Processor</td><td>8</td><td>8</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c7g.4xlarge</td><td>32.00</td><td>AWS Graviton3 Processor</td><td>16</td><td>16</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c7g.8xlarge</td><td>64.00</td><td>AWS Graviton3 Processor</td><td>32</td><td>32</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c7g.12xlarge</td><td>96.00</td><td>AWS Graviton3 Processor</td><td>48</td><td>48</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c7g.16xlarge</td><td>128.00</td><td>AWS Graviton3 Processor</td><td>64</td><td>64</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c7g.metal</td><td>128.00</td><td>AWS Graviton3 Processor</td><td>64</td><td>64</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">C7gd</td></tr>
  <tr><td>c7gd.medium</td><td>2.00</td><td>AWS Graviton3 Processor</td><td>1</td><td>1</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c7gd.large</td><td>4.00</td><td>AWS Graviton3 Processor</td><td>2</td><td>2</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c7gd.xlarge</td><td>8.00</td><td>AWS Graviton3 Processor</td><td>4</td><td>4</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c7gd.2xlarge</td><td>16.00</td><td>AWS Graviton3 Processor</td><td>8</td><td>8</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c7gd.4xlarge</td><td>32.00</td><td>AWS Graviton3 Processor</td><td>16</td><td>16</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c7gd.8xlarge</td><td>64.00</td><td>AWS Graviton3 Processor</td><td>32</td><td>32</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c7gd.12xlarge</td><td>96.00</td><td>AWS Graviton3 Processor</td><td>48</td><td>48</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c7gd.16xlarge</td><td>128.00</td><td>AWS Graviton3 Processor</td><td>64</td><td>64</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c7gd.metal</td><td>128.00</td><td>AWS Graviton3 Processor</td><td>64</td><td>64</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">C7gn</td></tr>
  <tr><td>c7gn.medium</td><td>2.00</td><td>AWS Graviton3E Processor</td><td>1</td><td>1</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c7gn.large</td><td>4.00</td><td>AWS Graviton3E Processor</td><td>2</td><td>2</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c7gn.xlarge</td><td>8.00</td><td>AWS Graviton3E Processor</td><td>4</td><td>4</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c7gn.2xlarge</td><td>16.00</td><td>AWS Graviton3E Processor</td><td>8</td><td>8</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c7gn.4xlarge</td><td>32.00</td><td>AWS Graviton3E Processor</td><td>16</td><td>16</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c7gn.8xlarge</td><td>64.00</td><td>AWS Graviton3E Processor</td><td>32</td><td>32</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c7gn.12xlarge</td><td>96.00</td><td>AWS Graviton3E Processor</td><td>48</td><td>48</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c7gn.16xlarge</td><td>128.00</td><td>AWS Graviton3E Processor</td><td>64</td><td>64</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c7gn.metal</td><td>128.00</td><td>AWS Graviton3E Processor</td><td>64</td><td>64</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">C7i</td></tr>
  <tr><td>c7i.large</td><td>4.00</td><td>Intel Xeon Sapphire Rapids</td><td>2</td><td>1</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c7i.xlarge</td><td>8.00</td><td>Intel Xeon Sapphire Rapids</td><td>4</td><td>2</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c7i.2xlarge</td><td>16.00</td><td>Intel Xeon Sapphire Rapids</td><td>8</td><td>4</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c7i.4xlarge</td><td>32.00</td><td>Intel Xeon Sapphire Rapids</td><td>16</td><td>8</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c7i.8xlarge</td><td>64.00</td><td>Intel Xeon Sapphire Rapids</td><td>32</td><td>16</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c7i.12xlarge</td><td>96.00</td><td>Intel Xeon Sapphire Rapids</td><td>48</td><td>24</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c7i.16xlarge</td><td>128.00</td><td>Intel Xeon Sapphire Rapids</td><td>64</td><td>32</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c7i.24xlarge</td><td>192.00</td><td>Intel Xeon Sapphire Rapids</td><td>96</td><td>48</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c7i.48xlarge</td><td>384.00</td><td>Intel Xeon Sapphire Rapids</td><td>192</td><td>96</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c7i.metal-24xl</td><td>192.00</td><td>Intel Xeon Sapphire Rapids</td><td>96</td><td>48</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c7i.metal-48xl</td><td>384.00</td><td>Intel Xeon Sapphire Rapids</td><td>192</td><td>96</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">C7i-flex</td></tr>
  <tr><td>c7i-flex.large</td><td>4.00</td><td>Intel Xeon Sapphire Rapids</td><td>2</td><td>1</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c7i-flex.xlarge</td><td>8.00</td><td>Intel Xeon Sapphire Rapids</td><td>4</td><td>2</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c7i-flex.2xlarge</td><td>16.00</td><td>Intel Xeon Sapphire Rapids</td><td>8</td><td>4</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c7i-flex.4xlarge</td><td>32.00</td><td>Intel Xeon Sapphire Rapids</td><td>16</td><td>8</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c7i-flex.8xlarge</td><td>64.00</td><td>Intel Xeon Sapphire Rapids</td><td>32</td><td>16</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c7i-flex.12xlarge</td><td>96.00</td><td>Intel Xeon Sapphire Rapids</td><td>48</td><td>24</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c7i-flex.16xlarge</td><td>128.00</td><td>Intel Xeon Sapphire Rapids</td><td>64</td><td>32</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">C8a</td></tr>
  <tr><td>c8a.medium</td><td>2.00</td><td>AMD EPYC 9R45</td><td>1</td><td>1</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8a.large</td><td>4.00</td><td>AMD EPYC 9R45</td><td>2</td><td>2</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8a.xlarge</td><td>8.00</td><td>AMD EPYC 9R45</td><td>4</td><td>4</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8a.2xlarge</td><td>16.00</td><td>AMD EPYC 9R45</td><td>8</td><td>8</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8a.4xlarge</td><td>32.00</td><td>AMD EPYC 9R45</td><td>16</td><td>16</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8a.8xlarge</td><td>64.00</td><td>AMD EPYC 9R45</td><td>32</td><td>32</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8a.12xlarge</td><td>96.00</td><td>AMD EPYC 9R45</td><td>48</td><td>48</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8a.16xlarge</td><td>128.00</td><td>AMD EPYC 9R45</td><td>64</td><td>64</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8a.24xlarge</td><td>192.00</td><td>AMD EPYC 9R45</td><td>96</td><td>96</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8a.48xlarge</td><td>384.00</td><td>AMD EPYC 9R45</td><td>192</td><td>192</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8a.metal-24xl</td><td>192.00</td><td>AMD EPYC 9R45</td><td>96</td><td>96</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8a.metal-48xl</td><td>384.00</td><td>AMD EPYC 9R45</td><td>192</td><td>192</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">C8g</td></tr>
  <tr><td>c8g.medium</td><td>2.00</td><td>AWS Graviton4 Processor</td><td>1</td><td>1</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8g.large</td><td>4.00</td><td>AWS Graviton4 Processor</td><td>2</td><td>2</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8g.xlarge</td><td>8.00</td><td>AWS Graviton4 Processor</td><td>4</td><td>4</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8g.2xlarge</td><td>16.00</td><td>AWS Graviton4 Processor</td><td>8</td><td>8</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8g.4xlarge</td><td>32.00</td><td>AWS Graviton4 Processor</td><td>16</td><td>16</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8g.8xlarge</td><td>64.00</td><td>AWS Graviton4 Processor</td><td>32</td><td>32</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8g.12xlarge</td><td>96.00</td><td>AWS Graviton4 Processor</td><td>48</td><td>48</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8g.16xlarge</td><td>128.00</td><td>AWS Graviton4 Processor</td><td>64</td><td>64</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8g.24xlarge</td><td>192.00</td><td>AWS Graviton4 Processor</td><td>96</td><td>96</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8g.48xlarge</td><td>384.00</td><td>AWS Graviton4 Processor</td><td>192</td><td>192</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8g.metal-24xl</td><td>192.00</td><td>AWS Graviton4 Processor</td><td>96</td><td>96</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8g.metal-48xl</td><td>384.00</td><td>AWS Graviton4 Processor</td><td>192</td><td>192</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">C8gb</td></tr>
  <tr><td>c8gb.medium</td><td>2.00</td><td>AWS Graviton4 Processor</td><td>1</td><td>1</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8gb.large</td><td>4.00</td><td>AWS Graviton4 Processor</td><td>2</td><td>2</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8gb.xlarge</td><td>8.00</td><td>AWS Graviton4 Processor</td><td>4</td><td>4</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8gb.2xlarge</td><td>16.00</td><td>AWS Graviton4 Processor</td><td>8</td><td>8</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8gb.4xlarge</td><td>32.00</td><td>AWS Graviton4 Processor</td><td>16</td><td>16</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8gb.8xlarge</td><td>64.00</td><td>AWS Graviton4 Processor</td><td>32</td><td>32</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8gb.12xlarge</td><td>96.00</td><td>AWS Graviton4 Processor</td><td>48</td><td>48</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8gb.16xlarge</td><td>128.00</td><td>AWS Graviton4 Processor</td><td>64</td><td>64</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8gb.24xlarge</td><td>192.00</td><td>AWS Graviton4 Processor</td><td>96</td><td>96</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8gb.48xlarge</td><td>384.00</td><td>AWS Graviton4 Processor</td><td>192</td><td>192</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8gb.metal-24xl</td><td>192.00</td><td>AWS Graviton4 Processor</td><td>96</td><td>96</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8gb.metal-48xl</td><td>384.00</td><td>AWS Graviton4 Processor</td><td>192</td><td>192</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">C8gd</td></tr>
  <tr><td>c8gd.medium</td><td>2.00</td><td>AWS Graviton4 Processor</td><td>1</td><td>1</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8gd.large</td><td>4.00</td><td>AWS Graviton4 Processor</td><td>2</td><td>2</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8gd.xlarge</td><td>8.00</td><td>AWS Graviton4 Processor</td><td>4</td><td>4</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8gd.2xlarge</td><td>16.00</td><td>AWS Graviton4 Processor</td><td>8</td><td>8</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8gd.4xlarge</td><td>32.00</td><td>AWS Graviton4 Processor</td><td>16</td><td>16</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8gd.8xlarge</td><td>64.00</td><td>AWS Graviton4 Processor</td><td>32</td><td>32</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8gd.12xlarge</td><td>96.00</td><td>AWS Graviton4 Processor</td><td>48</td><td>48</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8gd.16xlarge</td><td>128.00</td><td>AWS Graviton4 Processor</td><td>64</td><td>64</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8gd.24xlarge</td><td>192.00</td><td>AWS Graviton4 Processor</td><td>96</td><td>96</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8gd.48xlarge</td><td>384.00</td><td>AWS Graviton4 Processor</td><td>192</td><td>192</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8gd.metal-24xl</td><td>192.00</td><td>AWS Graviton4 Processor</td><td>96</td><td>96</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8gd.metal-48xl</td><td>384.00</td><td>AWS Graviton4 Processor</td><td>192</td><td>192</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">C8gn</td></tr>
  <tr><td>c8gn.medium</td><td>2.00</td><td>AWS Graviton4 Processor</td><td>1</td><td>1</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8gn.large</td><td>4.00</td><td>AWS Graviton4 Processor</td><td>2</td><td>2</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8gn.xlarge</td><td>8.00</td><td>AWS Graviton4 Processor</td><td>4</td><td>4</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8gn.2xlarge</td><td>16.00</td><td>AWS Graviton4 Processor</td><td>8</td><td>8</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8gn.4xlarge</td><td>32.00</td><td>AWS Graviton4 Processor</td><td>16</td><td>16</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8gn.8xlarge</td><td>64.00</td><td>AWS Graviton4 Processor</td><td>32</td><td>32</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8gn.12xlarge</td><td>96.00</td><td>AWS Graviton4 Processor</td><td>48</td><td>48</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8gn.16xlarge</td><td>128.00</td><td>AWS Graviton4 Processor</td><td>64</td><td>64</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8gn.24xlarge</td><td>192.00</td><td>AWS Graviton4 Processor</td><td>96</td><td>96</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8gn.48xlarge</td><td>384.00</td><td>AWS Graviton4 Processor</td><td>192</td><td>192</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8gn.metal-24xl</td><td>192.00</td><td>AWS Graviton4 Processor</td><td>96</td><td>96</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8gn.metal-48xl</td><td>384.00</td><td>AWS Graviton4 Processor</td><td>192</td><td>192</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">C8i</td></tr>
  <tr><td>c8i.large</td><td>4.00</td><td>Intel Xeon Granite Rapids</td><td>2</td><td>1</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8i.xlarge</td><td>8.00</td><td>Intel Xeon Granite Rapids</td><td>4</td><td>2</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8i.2xlarge</td><td>16.00</td><td>Intel Xeon Granite Rapids</td><td>8</td><td>4</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8i.4xlarge</td><td>32.00</td><td>Intel Xeon Granite Rapids</td><td>16</td><td>8</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8i.8xlarge</td><td>64.00</td><td>Intel Xeon Granite Rapids</td><td>32</td><td>16</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8i.12xlarge</td><td>96.00</td><td>Intel Xeon Granite Rapids</td><td>48</td><td>24</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8i.16xlarge</td><td>128.00</td><td>Intel Xeon Granite Rapids</td><td>64</td><td>32</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8i.24xlarge</td><td>192.00</td><td>Intel Xeon Granite Rapids</td><td>96</td><td>48</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8i.32xlarge</td><td>256.00</td><td>Intel Xeon Granite Rapids</td><td>128</td><td>64</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8i.48xlarge</td><td>384.00</td><td>Intel Xeon Granite Rapids</td><td>192</td><td>96</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8i.96xlarge</td><td>768.00</td><td>Intel Xeon Granite Rapids</td><td>384</td><td>192</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8i.metal-48xl</td><td>384.00</td><td>Intel Xeon Granite Rapids</td><td>192</td><td>96</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8i.metal-96xl</td><td>768.00</td><td>Intel Xeon Granite Rapids</td><td>384</td><td>192</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">C8id</td></tr>
  <tr><td>c8id.large</td><td>4.00</td><td>Intel Xeon Granite Rapids</td><td>2</td><td>1</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8id.xlarge</td><td>8.00</td><td>Intel Xeon Granite Rapids</td><td>4</td><td>2</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8id.2xlarge</td><td>16.00</td><td>Intel Xeon Granite Rapids</td><td>8</td><td>4</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8id.4xlarge</td><td>32.00</td><td>Intel Xeon Granite Rapids</td><td>16</td><td>8</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8id.8xlarge</td><td>64.00</td><td>Intel Xeon Granite Rapids</td><td>32</td><td>16</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8id.12xlarge</td><td>96.00</td><td>Intel Xeon Granite Rapids</td><td>48</td><td>24</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8id.16xlarge</td><td>128.00</td><td>Intel Xeon Granite Rapids</td><td>64</td><td>32</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8id.24xlarge</td><td>192.00</td><td>Intel Xeon Granite Rapids</td><td>96</td><td>48</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8id.32xlarge</td><td>256.00</td><td>Intel Xeon Granite Rapids</td><td>128</td><td>64</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8id.48xlarge</td><td>384.00</td><td>Intel Xeon Granite Rapids</td><td>192</td><td>96</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8id.96xlarge</td><td>768.00</td><td>Intel Xeon Granite Rapids</td><td>384</td><td>192</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8id.metal-48xl</td><td>384.00</td><td>Intel Xeon Granite Rapids</td><td>192</td><td>96</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8id.metal-96xl</td><td>768.00</td><td>Intel Xeon Granite Rapids</td><td>384</td><td>192</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">C8i-flex</td></tr>
  <tr><td>c8i-flex.large</td><td>4.00</td><td>Intel Xeon Granite Rapids</td><td>2</td><td>1</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8i-flex.xlarge</td><td>8.00</td><td>Intel Xeon Granite Rapids</td><td>4</td><td>2</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8i-flex.2xlarge</td><td>16.00</td><td>Intel Xeon Granite Rapids</td><td>8</td><td>4</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8i-flex.4xlarge</td><td>32.00</td><td>Intel Xeon Granite Rapids</td><td>16</td><td>8</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8i-flex.8xlarge</td><td>64.00</td><td>Intel Xeon Granite Rapids</td><td>32</td><td>16</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8i-flex.12xlarge</td><td>96.00</td><td>Intel Xeon Granite Rapids</td><td>48</td><td>24</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8i-flex.16xlarge</td><td>128.00</td><td>Intel Xeon Granite Rapids</td><td>64</td><td>32</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">C8in</td></tr>
  <tr><td>c8in.large</td><td>4.00</td><td>Intel Xeon Granite Rapids</td><td>2</td><td>1</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8in.xlarge</td><td>8.00</td><td>Intel Xeon Granite Rapids</td><td>4</td><td>2</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8in.2xlarge</td><td>16.00</td><td>Intel Xeon Granite Rapids</td><td>8</td><td>4</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8in.4xlarge</td><td>32.00</td><td>Intel Xeon Granite Rapids</td><td>16</td><td>8</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8in.8xlarge</td><td>64.00</td><td>Intel Xeon Granite Rapids</td><td>32</td><td>16</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8in.12xlarge</td><td>96.00</td><td>Intel Xeon Granite Rapids</td><td>48</td><td>24</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8in.16xlarge</td><td>128.00</td><td>Intel Xeon Granite Rapids</td><td>64</td><td>32</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8in.24xlarge</td><td>192.00</td><td>Intel Xeon Granite Rapids</td><td>96</td><td>48</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8in.32xlarge</td><td>256.00</td><td>Intel Xeon Granite Rapids</td><td>128</td><td>64</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8in.48xlarge</td><td>384.00</td><td>Intel Xeon Granite Rapids</td><td>192</td><td>96</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8in.96xlarge</td><td>768.00</td><td>Intel Xeon Granite Rapids</td><td>384</td><td>192</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8in.metal-48xl</td><td>384.00</td><td>Intel Xeon Granite Rapids</td><td>192</td><td>96</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8in.metal-96xl</td><td>768.00</td><td>Intel Xeon Granite Rapids</td><td>384</td><td>192</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">C8ine</td></tr>
  <tr><td>c8ine.large</td><td>4.00</td><td>Intel Xeon Granite Rapids</td><td>2</td><td>1</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8ine.xlarge</td><td>8.00</td><td>Intel Xeon Granite Rapids</td><td>4</td><td>2</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8ine.2xlarge</td><td>16.00</td><td>Intel Xeon Granite Rapids</td><td>8</td><td>4</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8ine.4xlarge</td><td>32.00</td><td>Intel Xeon Granite Rapids</td><td>16</td><td>8</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8ine.8xlarge</td><td>64.00</td><td>Intel Xeon Granite Rapids</td><td>32</td><td>16</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8ine.12xlarge</td><td>96.00</td><td>Intel Xeon Granite Rapids</td><td>48</td><td>24</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">C8ib</td></tr>
  <tr><td>c8ib.large</td><td>4.00</td><td>Intel Xeon Granite Rapids</td><td>2</td><td>1</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8ib.xlarge</td><td>8.00</td><td>Intel Xeon Granite Rapids</td><td>4</td><td>2</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8ib.2xlarge</td><td>16.00</td><td>Intel Xeon Granite Rapids</td><td>8</td><td>4</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8ib.4xlarge</td><td>32.00</td><td>Intel Xeon Granite Rapids</td><td>16</td><td>8</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8ib.8xlarge</td><td>64.00</td><td>Intel Xeon Granite Rapids</td><td>32</td><td>16</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8ib.12xlarge</td><td>96.00</td><td>Intel Xeon Granite Rapids</td><td>48</td><td>24</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8ib.16xlarge</td><td>128.00</td><td>Intel Xeon Granite Rapids</td><td>64</td><td>32</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8ib.24xlarge</td><td>192.00</td><td>Intel Xeon Granite Rapids</td><td>96</td><td>48</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8ib.32xlarge</td><td>256.00</td><td>Intel Xeon Granite Rapids</td><td>128</td><td>64</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8ib.48xlarge</td><td>384.00</td><td>Intel Xeon Granite Rapids</td><td>192</td><td>96</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8ib.96xlarge</td><td>768.00</td><td>Intel Xeon Granite Rapids</td><td>384</td><td>192</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8ib.metal-48xl</td><td>384.00</td><td>Intel Xeon Granite Rapids</td><td>192</td><td>96</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8ib.metal-96xl</td><td>768.00</td><td>Intel Xeon Granite Rapids</td><td>384</td><td>192</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
</tbody>
</table>


## Network specifications
<a name="co_network"></a>

**Note**  
C8a, C8g, C8gd, C8i, C8id, C8i-flex instance types support configurable bandwidth weightings. With these instance types, you can optimize an instance's bandwidth for either networking performance or Amazon EBS performance. The following table shows the default networking bandwidth performance for these instance types. For the supported configurable weightings, see [ Configurable bandwidth weighting preferences](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/configure-bandwidth-weighting.html).


<table>
<thead>
  <tr><th>Instance type</th><th>Baseline / Burst bandwidth (Gbps)</th><th>EFA</th><th>ENA</th><th>ENA Express</th><th>Network cards</th><th>Max. network interfaces</th><th>IP addresses per interface</th><th>IPv6</th></tr>
</thead>
<tbody>
  <tr><td colspan="9">C5</td></tr>
  <tr><td>c5.large 1</td><td>0.75 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>c5.xlarge 1</td><td>1.25 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>c5.2xlarge 1</td><td>2.5 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>c5.4xlarge 1</td><td>5.0 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>c5.9xlarge</td><td>12 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>c5.12xlarge</td><td>12 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>c5.18xlarge</td><td>25 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>c5.24xlarge</td><td>25 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>c5.metal</td><td>25 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">C5a</td></tr>
  <tr><td>c5a.large 1</td><td>0.75 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>c5a.xlarge 1</td><td>1.25 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>c5a.2xlarge 1</td><td>2.5 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>c5a.4xlarge 1</td><td>5.0 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>c5a.8xlarge</td><td>10 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>c5a.12xlarge</td><td>12 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>c5a.16xlarge</td><td>20 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>c5a.24xlarge</td><td>20 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">C5ad</td></tr>
  <tr><td>c5ad.large 1</td><td>0.75 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>c5ad.xlarge 1</td><td>1.25 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>c5ad.2xlarge 1</td><td>2.5 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>c5ad.4xlarge 1</td><td>5.0 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>c5ad.8xlarge</td><td>10 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>c5ad.12xlarge</td><td>12 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>c5ad.16xlarge</td><td>20 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>c5ad.24xlarge</td><td>20 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">C5d</td></tr>
  <tr><td>c5d.large 1</td><td>0.75 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>c5d.xlarge 1</td><td>1.25 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>c5d.2xlarge 1</td><td>2.5 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>c5d.4xlarge 1</td><td>5.0 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>c5d.9xlarge</td><td>12 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>c5d.12xlarge</td><td>12 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>c5d.18xlarge</td><td>25 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>c5d.24xlarge</td><td>25 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>c5d.metal</td><td>25 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">C5n</td></tr>
  <tr><td>c5n.large 1</td><td>3.0 / 25.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>c5n.xlarge 1</td><td>5.0 / 25.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>c5n.2xlarge 1</td><td>10.0 / 25.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>c5n.4xlarge 1</td><td>15.0 / 25.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>c5n.9xlarge</td><td>50 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>c5n.18xlarge</td><td>100 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>c5n.metal</td><td>100 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">C6a</td></tr>
  <tr><td>c6a.large 1</td><td>0.781 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>c6a.xlarge 1</td><td>1.562 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>c6a.2xlarge 1</td><td>3.125 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>c6a.4xlarge 1</td><td>6.25 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>c6a.8xlarge</td><td>12.5 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>c6a.12xlarge</td><td>18.75 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>c6a.16xlarge</td><td>25 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>c6a.24xlarge</td><td>37.5 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>c6a.32xlarge</td><td>50 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>c6a.48xlarge</td><td>50 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>c6a.metal</td><td>50 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">C6g</td></tr>
  <tr><td>c6g.medium 1</td><td>0.5 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>2</td><td>4</td><td>✓ Yes</td></tr>
  <tr><td>c6g.large 1</td><td>0.75 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>c6g.xlarge 1</td><td>1.25 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>c6g.2xlarge 1</td><td>2.5 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>c6g.4xlarge 1</td><td>5.0 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>c6g.8xlarge</td><td>12 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>c6g.12xlarge</td><td>20 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>c6g.16xlarge</td><td>25 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>c6g.metal</td><td>25 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">C6gd</td></tr>
  <tr><td>c6gd.medium 1</td><td>0.5 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>2</td><td>4</td><td>✓ Yes</td></tr>
  <tr><td>c6gd.large 1</td><td>0.75 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>c6gd.xlarge 1</td><td>1.25 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>c6gd.2xlarge 1</td><td>2.5 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>c6gd.4xlarge 1</td><td>5.0 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>c6gd.8xlarge</td><td>12 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>c6gd.12xlarge</td><td>20 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>c6gd.16xlarge</td><td>25 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>c6gd.metal</td><td>25 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">C6gn</td></tr>
  <tr><td>c6gn.medium 1</td><td>1.6 / 16.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>2</td><td>4</td><td>✓ Yes</td></tr>
  <tr><td>c6gn.large 1</td><td>3.0 / 25.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>c6gn.xlarge 1</td><td>6.3 / 25.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>c6gn.2xlarge 1</td><td>12.5 / 25.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>c6gn.4xlarge</td><td>25 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>c6gn.8xlarge</td><td>50 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>c6gn.12xlarge</td><td>75 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>c6gn.16xlarge</td><td>100 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">C6i</td></tr>
  <tr><td>c6i.large 1</td><td>0.781 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>c6i.xlarge 1</td><td>1.562 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>c6i.2xlarge 1</td><td>3.125 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>c6i.4xlarge 1</td><td>6.25 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>c6i.8xlarge</td><td>12.5 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>c6i.12xlarge</td><td>18.75 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>c6i.16xlarge</td><td>25 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>c6i.24xlarge</td><td>37.5 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>c6i.32xlarge</td><td>50 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>c6i.metal</td><td>50 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">C6id</td></tr>
  <tr><td>c6id.large 1</td><td>0.781 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>c6id.xlarge 1</td><td>1.562 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>c6id.2xlarge 1</td><td>3.125 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>c6id.4xlarge 1</td><td>6.25 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>c6id.8xlarge</td><td>12.5 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>c6id.12xlarge</td><td>18.75 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>c6id.16xlarge</td><td>25 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>c6id.24xlarge</td><td>37.5 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>c6id.32xlarge</td><td>50 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>c6id.metal</td><td>50 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">C6in</td></tr>
  <tr><td>c6in.large 1</td><td>3.125 / 25.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>c6in.xlarge 1</td><td>6.25 / 30.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>c6in.2xlarge 1</td><td>12.5 / 40.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>c6in.4xlarge 1</td><td>25.0 / 50.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>c6in.8xlarge</td><td>50 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>c6in.12xlarge</td><td>75 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>c6in.16xlarge</td><td>100 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>c6in.24xlarge</td><td>150 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>c6in.32xlarge</td><td>200 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>2</td><td>16</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>c6in.metal</td><td>200 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>2</td><td>16</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">C7a</td></tr>
  <tr><td>c7a.medium 1</td><td>0.39 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>2</td><td>4</td><td>✓ Yes</td></tr>
  <tr><td>c7a.large 1</td><td>0.781 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>c7a.xlarge 1</td><td>1.562 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>c7a.2xlarge 1</td><td>3.125 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>c7a.4xlarge 1</td><td>6.25 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>c7a.8xlarge</td><td>12.5 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>c7a.12xlarge</td><td>18.75 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>c7a.16xlarge</td><td>25 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>c7a.24xlarge</td><td>37.5 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>c7a.32xlarge</td><td>50 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>c7a.48xlarge</td><td>50 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>c7a.metal-48xl</td><td>50 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">C7g</td></tr>
  <tr><td>c7g.medium 1</td><td>0.52 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>2</td><td>4</td><td>✓ Yes</td></tr>
  <tr><td>c7g.large 1</td><td>0.937 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>c7g.xlarge 1</td><td>1.876 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>c7g.2xlarge 1</td><td>3.75 / 15.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>c7g.4xlarge 1</td><td>7.5 / 15.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>c7g.8xlarge</td><td>15 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>c7g.12xlarge</td><td>22.5 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>c7g.16xlarge</td><td>30 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>c7g.metal</td><td>30 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">C7gd</td></tr>
  <tr><td>c7gd.medium 1</td><td>0.52 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>2</td><td>4</td><td>✓ Yes</td></tr>
  <tr><td>c7gd.large 1</td><td>0.937 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>c7gd.xlarge 1</td><td>1.876 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>c7gd.2xlarge 1</td><td>3.75 / 15.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>c7gd.4xlarge 1</td><td>7.5 / 15.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>c7gd.8xlarge</td><td>15 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>c7gd.12xlarge</td><td>22.5 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>c7gd.16xlarge</td><td>30 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>c7gd.metal</td><td>30 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">C7gn</td></tr>
  <tr><td>c7gn.medium 1</td><td>3.125 / 25.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>2</td><td>4</td><td>✓ Yes</td></tr>
  <tr><td>c7gn.large 1</td><td>6.25 / 30.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>c7gn.xlarge 1</td><td>12.5 / 40.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>c7gn.2xlarge 1</td><td>25.0 / 50.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>c7gn.4xlarge</td><td>50 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>c7gn.8xlarge</td><td>100 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>c7gn.12xlarge</td><td>150 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>c7gn.16xlarge</td><td>200 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>c7gn.metal</td><td>200 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">C7i</td></tr>
  <tr><td>c7i.large 1</td><td>0.781 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>c7i.xlarge 1</td><td>1.562 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>c7i.2xlarge 1</td><td>3.125 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>c7i.4xlarge 1</td><td>6.25 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>c7i.8xlarge</td><td>12.5 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>c7i.12xlarge</td><td>18.75 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>c7i.16xlarge</td><td>25 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>c7i.24xlarge</td><td>37.5 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>c7i.48xlarge</td><td>50 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>c7i.metal-24xl</td><td>37.5 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>c7i.metal-48xl</td><td>50 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">C7i-flex</td></tr>
  <tr><td>c7i-flex.large 1</td><td>0.39 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>c7i-flex.xlarge 1</td><td>0.781 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>c7i-flex.2xlarge 1</td><td>1.562 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>c7i-flex.4xlarge 1</td><td>3.125 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>c7i-flex.8xlarge 1</td><td>6.25 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>c7i-flex.12xlarge 1</td><td>9.375 / 18.75</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>c7i-flex.16xlarge 1</td><td>12.5 / 25.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">C8a</td></tr>
  <tr><td>c8a.medium 1</td><td>0.52 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>2</td><td>4</td><td>✓ Yes</td></tr>
  <tr><td>c8a.large 1</td><td>0.937 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>20</td><td>✓ Yes</td></tr>
  <tr><td>c8a.xlarge 1</td><td>1.875 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>20</td><td>✓ Yes</td></tr>
  <tr><td>c8a.2xlarge 1</td><td>3.75 / 15.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>40</td><td>✓ Yes</td></tr>
  <tr><td>c8a.4xlarge 1</td><td>7.5 / 15.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>40</td><td>✓ Yes</td></tr>
  <tr><td>c8a.8xlarge</td><td>15 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>10</td><td>40</td><td>✓ Yes</td></tr>
  <tr><td>c8a.12xlarge</td><td>22.5 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>12</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>c8a.16xlarge</td><td>30 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>16</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>c8a.24xlarge</td><td>40 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>16</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>c8a.48xlarge</td><td>75 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>24</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>c8a.metal-24xl</td><td>40 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>16</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>c8a.metal-48xl</td><td>75 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>24</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">C8g</td></tr>
  <tr><td>c8g.medium 1</td><td>0.52 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>2</td><td>4</td><td>✓ Yes</td></tr>
  <tr><td>c8g.large 1</td><td>0.937 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>c8g.xlarge 1</td><td>1.875 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>c8g.2xlarge 1</td><td>3.75 / 15.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>c8g.4xlarge 1</td><td>7.5 / 15.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>c8g.8xlarge</td><td>15 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>c8g.12xlarge</td><td>22.5 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>c8g.16xlarge</td><td>30 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>c8g.24xlarge</td><td>40 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>c8g.48xlarge</td><td>50 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>c8g.metal-24xl</td><td>40 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>c8g.metal-48xl</td><td>50 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">C8gb</td></tr>
  <tr><td>c8gb.medium 1</td><td>2.083 / 16.666</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>2</td><td>4</td><td>✓ Yes</td></tr>
  <tr><td>c8gb.large 1</td><td>4.166 / 20.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>c8gb.xlarge 1</td><td>8.333 / 26.666</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>c8gb.2xlarge 1</td><td>16.666 / 33.333</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>c8gb.4xlarge</td><td>33.33 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>c8gb.8xlarge</td><td>66.66 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>10</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>c8gb.12xlarge</td><td>100 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>12</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>c8gb.16xlarge</td><td>133.33 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>16</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>c8gb.24xlarge</td><td>200 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>24</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>c8gb.48xlarge</td><td>400 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>2</td><td>24</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>c8gb.metal-24xl</td><td>200 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>24</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>c8gb.metal-48xl</td><td>400 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>2</td><td>24</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">C8gd</td></tr>
  <tr><td>c8gd.medium 1</td><td>0.52 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>2</td><td>4</td><td>✓ Yes</td></tr>
  <tr><td>c8gd.large 1</td><td>0.937 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>c8gd.xlarge 1</td><td>1.875 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>c8gd.2xlarge 1</td><td>3.75 / 15.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>c8gd.4xlarge 1</td><td>7.5 / 15.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>c8gd.8xlarge</td><td>15 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>c8gd.12xlarge</td><td>22.5 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>c8gd.16xlarge</td><td>30 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>c8gd.24xlarge</td><td>40 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>c8gd.48xlarge</td><td>50 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>c8gd.metal-24xl</td><td>40 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>c8gd.metal-48xl</td><td>50 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">C8gn</td></tr>
  <tr><td>c8gn.medium 1</td><td>3.125 / 25.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>2</td><td>4</td><td>✓ Yes</td></tr>
  <tr><td>c8gn.large 1</td><td>6.25 / 30.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>c8gn.xlarge 1</td><td>12.5 / 40.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>c8gn.2xlarge 1</td><td>25.0 / 50.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>c8gn.4xlarge</td><td>50 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>c8gn.8xlarge</td><td>100 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>10</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>c8gn.12xlarge</td><td>150 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>12</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>c8gn.16xlarge</td><td>200 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>16</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>c8gn.24xlarge</td><td>300 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>24</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>c8gn.48xlarge</td><td>600 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>2</td><td>24</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>c8gn.metal-24xl</td><td>300 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>24</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>c8gn.metal-48xl</td><td>600 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>2</td><td>24</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">C8i</td></tr>
  <tr><td>c8i.large 1</td><td>0.937 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>20</td><td>✓ Yes</td></tr>
  <tr><td>c8i.xlarge 1</td><td>1.875 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>c8i.2xlarge 1</td><td>3.75 / 15.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>c8i.4xlarge 1</td><td>7.5 / 15.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>c8i.8xlarge</td><td>15 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>10</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>c8i.12xlarge</td><td>22.5 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>12</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>c8i.16xlarge</td><td>30 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>16</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>c8i.24xlarge</td><td>40 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>16</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>c8i.32xlarge</td><td>50 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>24</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>c8i.48xlarge</td><td>75 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>24</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>c8i.96xlarge</td><td>100 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>24</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>c8i.metal-48xl</td><td>75 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>24</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>c8i.metal-96xl</td><td>100 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>24</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">C8id</td></tr>
  <tr><td>c8id.large 1</td><td>0.937 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>20</td><td>✓ Yes</td></tr>
  <tr><td>c8id.xlarge 1</td><td>1.875 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>c8id.2xlarge 1</td><td>3.75 / 15.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>c8id.4xlarge 1</td><td>7.5 / 15.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>c8id.8xlarge</td><td>15 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>10</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>c8id.12xlarge</td><td>22.5 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>12</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>c8id.16xlarge</td><td>30 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>16</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>c8id.24xlarge</td><td>40 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>16</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>c8id.32xlarge</td><td>50 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>24</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>c8id.48xlarge</td><td>75 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>24</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>c8id.96xlarge</td><td>100 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>24</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>c8id.metal-48xl</td><td>75 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>24</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>c8id.metal-96xl</td><td>100 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>24</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">C8i-flex</td></tr>
  <tr><td>c8i-flex.large 1</td><td>0.468 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>20</td><td>✓ Yes</td></tr>
  <tr><td>c8i-flex.xlarge 1</td><td>0.937 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>c8i-flex.2xlarge 1</td><td>1.875 / 15.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>c8i-flex.4xlarge 1</td><td>3.75 / 15.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>c8i-flex.8xlarge 1</td><td>7.5 / 15.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>10</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>c8i-flex.12xlarge 1</td><td>11.25 / 22.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>12</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>c8i-flex.16xlarge 1</td><td>15.0 / 30.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>16</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">C8in</td></tr>
  <tr><td>c8in.large 1</td><td>3.125 / 25.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>20</td><td>✓ Yes</td></tr>
  <tr><td>c8in.xlarge 1</td><td>6.25 / 30.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>c8in.2xlarge 1</td><td>12.5 / 40.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>c8in.4xlarge 1</td><td>25.0 / 50.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>c8in.8xlarge</td><td>50 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>c8in.12xlarge</td><td>75 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>12</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>c8in.16xlarge</td><td>100 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>16</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>c8in.24xlarge</td><td>150 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>16</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>c8in.32xlarge</td><td>200 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>16</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>c8in.48xlarge</td><td>300 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>24</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>c8in.96xlarge</td><td>600 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>2</td><td>24</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>c8in.metal-48xl</td><td>300 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>24</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>c8in.metal-96xl</td><td>600 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>2</td><td>24</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">C8ine</td></tr>
  <tr><td>c8ine.large</td><td>3.125 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>20</td><td>✓ Yes</td></tr>
  <tr><td>c8ine.xlarge</td><td>6.25 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>c8ine.2xlarge</td><td>12.5 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>c8ine.4xlarge</td><td>25 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>c8ine.8xlarge</td><td>50 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>c8ine.12xlarge</td><td>75 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>12</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">C8ib</td></tr>
  <tr><td>c8ib.large 1</td><td>2.083 / 16.667</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>20</td><td>✓ Yes</td></tr>
  <tr><td>c8ib.xlarge 1</td><td>4.166 / 20.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>c8ib.2xlarge 1</td><td>8.333 / 26.667</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>c8ib.4xlarge 1</td><td>16.666 / 33.333</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>c8ib.8xlarge</td><td>33.33 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>c8ib.12xlarge</td><td>50 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>12</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>c8ib.16xlarge</td><td>66.66 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>16</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>c8ib.24xlarge</td><td>100 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>16</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>c8ib.32xlarge</td><td>133.33 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>16</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>c8ib.48xlarge</td><td>200 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>24</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>c8ib.96xlarge</td><td>400 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>2</td><td>24</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>c8ib.metal-48xl</td><td>200 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>24</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>c8ib.metal-96xl</td><td>400 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>2</td><td>24</td><td>64</td><td>✓ Yes</td></tr>
</tbody>
</table>


**Note**  
1 These instances have a baseline bandwidth and can use a network I/O credit mechanism to burst beyond their baseline bandwidth on a best effort basis. Other instances types can sustain their maximum performance indefinitely. For more information, see [ instance network bandwidth](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-instance-network-bandwidth.html).  
For `c6in.32xlarge`, `c6in.metal`, you must attach at least 2 ENIs, to separate network cards, to achieve 200 Gbps throughput. Each ENI attached to a network card can achieve up to 170 Gbps.  
For `c8in.96xlarge`, `c8in.metal-96xl`, `c8gn.48xlarge`, `c8gn.metal-48xl`, you must attach at least 2 ENIs, to separate network cards, to achieve 600 Gbps throughput. Each ENI attached to a network card can achieve up to 300 Gbps.  
For `c8ib.96xlarge`, `c8ib.metal-96xl`, `c8gb.48xlarge`, `c8gb.metal-48xl`, you must attach at least 2 ENIs, to separate network cards, to achieve 400 Gbps throughput. Each ENI attached to a network card can achieve up to 200 Gbps.

## Amazon EBS specifications
<a name="co_storage-ebs"></a>

The following table indicates which instance types are Amazon EBS optimized by default and which optionally support it. It also describes their EBS-optimized performance, including dedicated bandwidth to Amazon EBS, the typical maximum aggregate throughput that can be achieved on that dedicated connection with a streaming read workload and 128 KiB I/O size, and the maximum IOPS the instance type can support when using a 16 KiB I/O size. Instance types not listed do not support Amazon EBS optimization.

**Important**  
An instance's EBS performance is bounded by the instance's performance limits, or the aggregated performance of its attached volumes, whichever is smaller. To achieve maximum EBS performance, an instance must have attached volumes that provide a combined performance equal to or greater than the maximum instance performance. For example, to achieve `80,000` IOPS for `r6i.16xlarge`, the instance must have at least `5` `gp3` volumes provisioned with `16,000` IOPS each (`5` volumes x `16,000` IOPS = `80,000` IOPS).  
We recommend that you choose an EBS–optimized instance type that provides more dedicated Amazon EBS throughput than your application needs; otherwise, the connection between Amazon EBS and Amazon EC2 can become a performance bottleneck.

**Note**  
C8a, C8g, C8gd, C8i, C8id, C8i-flex instance types support configurable bandwidth weightings. With these instance types, you can optimize an instance's bandwidth for either networking performance or Amazon EBS performance. The following table shows the default networking bandwidth performance for these instance types. For the supported configurable weightings, see [ Configurable bandwidth weighting preferences](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/configure-bandwidth-weighting.html).


<table>
<thead>
  <tr><th>Instance type</th><th>Baseline / Maximum bandwidth (Mbps)</th><th>Baseline / Maximum throughput (MB/s, 128 KiB I/O)</th><th>Baseline / Maximum IOPS (16 KiB I/O)</th><th>NVMe</th><th>Multiple EBS cards</th><th>EBS volume limit</th></tr>
</thead>
<tbody>
  <tr><td colspan="7">C5</td></tr>
  <tr><td>c5.large 1</td><td>650.00 / 4750.00</td><td>81.25 / 593.75</td><td>4000.00 / 20000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c5.xlarge 1</td><td>1150.00 / 4750.00</td><td>143.75 / 593.75</td><td>6000.00 / 20000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c5.2xlarge 1</td><td>2300.00 / 4750.00</td><td>287.50 / 593.75</td><td>10000.00 / 20000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c5.4xlarge</td><td>4750.00</td><td>593.75</td><td>20000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c5.9xlarge</td><td>9500.00</td><td>1187.50</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c5.12xlarge</td><td>9500.00</td><td>1187.50</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c5.18xlarge</td><td>19000.00</td><td>2375.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c5.24xlarge</td><td>19000.00</td><td>2375.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c5.metal</td><td>19000.00</td><td>2375.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 31 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td colspan="7">C5a</td></tr>
  <tr><td>c5a.large 1</td><td>200.00 / 3170.00</td><td>25.00 / 396.25</td><td>800.00 / 13300.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c5a.xlarge 1</td><td>400.00 / 3170.00</td><td>50.00 / 396.25</td><td>1600.00 / 13300.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c5a.2xlarge 1</td><td>800.00 / 3170.00</td><td>100.00 / 396.25</td><td>3200.00 / 13300.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c5a.4xlarge 1</td><td>1580.00 / 3170.00</td><td>197.50 / 396.25</td><td>6600.00 / 13300.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c5a.8xlarge</td><td>3170.00</td><td>396.25</td><td>13300.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c5a.12xlarge</td><td>4750.00</td><td>593.75</td><td>20000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c5a.16xlarge</td><td>6300.00</td><td>787.50</td><td>26700.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c5a.24xlarge</td><td>9500.00</td><td>1187.50</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td colspan="7">C5ad</td></tr>
  <tr><td>c5ad.large 1</td><td>200.00 / 3170.00</td><td>25.00 / 396.25</td><td>800.00 / 13300.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c5ad.xlarge 1</td><td>400.00 / 3170.00</td><td>50.00 / 396.25</td><td>1600.00 / 13300.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c5ad.2xlarge 1</td><td>800.00 / 3170.00</td><td>100.00 / 396.25</td><td>3200.00 / 13300.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c5ad.4xlarge 1</td><td>1580.00 / 3170.00</td><td>197.50 / 396.25</td><td>6600.00 / 13300.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 25 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c5ad.8xlarge</td><td>3170.00</td><td>396.25</td><td>13300.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 25 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c5ad.12xlarge</td><td>4750.00</td><td>593.75</td><td>20000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 25 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c5ad.16xlarge</td><td>6300.00</td><td>787.50</td><td>26700.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 25 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c5ad.24xlarge</td><td>9500.00</td><td>1187.50</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 25 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td colspan="7">C5d</td></tr>
  <tr><td>c5d.large 1</td><td>650.00 / 4750.00</td><td>81.25 / 593.75</td><td>4000.00 / 20000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c5d.xlarge 1</td><td>1150.00 / 4750.00</td><td>143.75 / 593.75</td><td>6000.00 / 20000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c5d.2xlarge 1</td><td>2300.00 / 4750.00</td><td>287.50 / 593.75</td><td>10000.00 / 20000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c5d.4xlarge</td><td>4750.00</td><td>593.75</td><td>20000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c5d.9xlarge</td><td>9500.00</td><td>1187.50</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c5d.12xlarge</td><td>9500.00</td><td>1187.50</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 25 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c5d.18xlarge</td><td>19000.00</td><td>2375.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 25 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c5d.24xlarge</td><td>19000.00</td><td>2375.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 23 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c5d.metal</td><td>19000.00</td><td>2375.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 31 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td colspan="7">C5n</td></tr>
  <tr><td>c5n.large 1</td><td>650.00 / 4750.00</td><td>81.25 / 593.75</td><td>4000.00 / 20000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c5n.xlarge 1</td><td>1150.00 / 4750.00</td><td>143.75 / 593.75</td><td>6000.00 / 20000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c5n.2xlarge 1</td><td>2300.00 / 4750.00</td><td>287.50 / 593.75</td><td>10000.00 / 20000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c5n.4xlarge</td><td>4750.00</td><td>593.75</td><td>20000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c5n.9xlarge</td><td>9500.00</td><td>1187.50</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c5n.18xlarge</td><td>19000.00</td><td>2375.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c5n.metal</td><td>19000.00</td><td>2375.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 31 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td colspan="7">C6a</td></tr>
  <tr><td>c6a.large 1</td><td>650.00 / 10000.00</td><td>81.25 / 1250.00</td><td>3600.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c6a.xlarge 1</td><td>1250.00 / 10000.00</td><td>156.25 / 1250.00</td><td>6000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c6a.2xlarge 1</td><td>2500.00 / 10000.00</td><td>312.50 / 1250.00</td><td>12000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c6a.4xlarge 1</td><td>5000.00 / 10000.00</td><td>625.00 / 1250.00</td><td>20000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c6a.8xlarge</td><td>10000.00</td><td>1250.00</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c6a.12xlarge</td><td>15000.00</td><td>1875.00</td><td>60000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c6a.16xlarge</td><td>20000.00</td><td>2500.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c6a.24xlarge</td><td>30000.00</td><td>3750.00</td><td>120000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c6a.32xlarge</td><td>40000.00</td><td>5000.00</td><td>160000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c6a.48xlarge</td><td>40000.00</td><td>5000.00</td><td>240000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c6a.metal</td><td>40000.00</td><td>5000.00</td><td>240000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 31 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td colspan="7">C6g</td></tr>
  <tr><td>c6g.medium 1</td><td>315.00 / 4750.00</td><td>39.38 / 593.75</td><td>2500.00 / 20000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c6g.large 1</td><td>630.00 / 4750.00</td><td>78.75 / 593.75</td><td>3600.00 / 20000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c6g.xlarge 1</td><td>1188.00 / 4750.00</td><td>148.50 / 593.75</td><td>6000.00 / 20000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c6g.2xlarge 1</td><td>2375.00 / 4750.00</td><td>296.88 / 593.75</td><td>12000.00 / 20000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c6g.4xlarge</td><td>4750.00</td><td>593.75</td><td>20000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c6g.8xlarge</td><td>9500.00</td><td>1187.50</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c6g.12xlarge</td><td>14250.00</td><td>1781.25</td><td>50000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c6g.16xlarge</td><td>19000.00</td><td>2375.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c6g.metal</td><td>19000.00</td><td>2375.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 31 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td colspan="7">C6gd</td></tr>
  <tr><td>c6gd.medium 1</td><td>315.00 / 4750.00</td><td>39.38 / 593.75</td><td>2500.00 / 20000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c6gd.large 1</td><td>630.00 / 4750.00</td><td>78.75 / 593.75</td><td>3600.00 / 20000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c6gd.xlarge 1</td><td>1188.00 / 4750.00</td><td>148.50 / 593.75</td><td>6000.00 / 20000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c6gd.2xlarge 1</td><td>2375.00 / 4750.00</td><td>296.88 / 593.75</td><td>12000.00 / 20000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c6gd.4xlarge</td><td>4750.00</td><td>593.75</td><td>20000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c6gd.8xlarge</td><td>9500.00</td><td>1187.50</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c6gd.12xlarge</td><td>14250.00</td><td>1781.25</td><td>50000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 25 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c6gd.16xlarge</td><td>19000.00</td><td>2375.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 25 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c6gd.metal</td><td>19000.00</td><td>2375.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 31 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td colspan="7">C6gn</td></tr>
  <tr><td>c6gn.medium 1</td><td>760.00 / 9500.00</td><td>95.00 / 1187.50</td><td>2500.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c6gn.large 1</td><td>1235.00 / 9500.00</td><td>154.38 / 1187.50</td><td>5000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c6gn.xlarge 1</td><td>2375.00 / 9500.00</td><td>296.88 / 1187.50</td><td>10000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c6gn.2xlarge 1</td><td>4750.00 / 9500.00</td><td>593.75 / 1187.50</td><td>20000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c6gn.4xlarge</td><td>9500.00</td><td>1187.50</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c6gn.8xlarge</td><td>19000.00</td><td>2375.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c6gn.12xlarge</td><td>28500.00</td><td>3562.50</td><td>120000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c6gn.16xlarge</td><td>38000.00</td><td>4750.00</td><td>160000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td colspan="7">C6i</td></tr>
  <tr><td>c6i.large 1</td><td>650.00 / 10000.00</td><td>81.25 / 1250.00</td><td>3600.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c6i.xlarge 1</td><td>1250.00 / 10000.00</td><td>156.25 / 1250.00</td><td>6000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c6i.2xlarge 1</td><td>2500.00 / 10000.00</td><td>312.50 / 1250.00</td><td>12000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c6i.4xlarge 1</td><td>5000.00 / 10000.00</td><td>625.00 / 1250.00</td><td>20000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c6i.8xlarge</td><td>10000.00</td><td>1250.00</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c6i.12xlarge</td><td>15000.00</td><td>1875.00</td><td>60000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c6i.16xlarge</td><td>20000.00</td><td>2500.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c6i.24xlarge</td><td>30000.00</td><td>3750.00</td><td>120000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c6i.32xlarge</td><td>40000.00</td><td>5000.00</td><td>160000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c6i.metal</td><td>40000.00</td><td>5000.00</td><td>160000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 31 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td colspan="7">C6id</td></tr>
  <tr><td>c6id.large 1</td><td>650.00 / 10000.00</td><td>81.25 / 1250.00</td><td>3600.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c6id.xlarge 1</td><td>1250.00 / 10000.00</td><td>156.25 / 1250.00</td><td>6000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c6id.2xlarge 1</td><td>2500.00 / 10000.00</td><td>312.50 / 1250.00</td><td>12000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c6id.4xlarge 1</td><td>5000.00 / 10000.00</td><td>625.00 / 1250.00</td><td>20000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c6id.8xlarge</td><td>10000.00</td><td>1250.00</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c6id.12xlarge</td><td>15000.00</td><td>1875.00</td><td>60000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 25 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c6id.16xlarge</td><td>20000.00</td><td>2500.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 25 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c6id.24xlarge</td><td>30000.00</td><td>3750.00</td><td>120000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 23 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c6id.32xlarge</td><td>40000.00</td><td>5000.00</td><td>160000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 23 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c6id.metal</td><td>40000.00</td><td>5000.00</td><td>160000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 31 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td colspan="7">C6in</td></tr>
  <tr><td>c6in.large 1</td><td>1562.00 / 25000.00</td><td>195.31 / 3125.00</td><td>6250.00 / 100000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c6in.xlarge 1</td><td>3125.00 / 25000.00</td><td>390.62 / 3125.00</td><td>12500.00 / 100000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c6in.2xlarge 1</td><td>6250.00 / 25000.00</td><td>781.25 / 3125.00</td><td>25000.00 / 100000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c6in.4xlarge 1</td><td>12500.00 / 25000.00</td><td>1562.50 / 3125.00</td><td>50000.00 / 100000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c6in.8xlarge</td><td>25000.00</td><td>3125.00</td><td>100000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c6in.12xlarge</td><td>37500.00</td><td>4687.50</td><td>150000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c6in.16xlarge</td><td>50000.00</td><td>6250.00</td><td>200000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c6in.24xlarge</td><td>75000.00</td><td>9375.00</td><td>300000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c6in.32xlarge</td><td>100000.00</td><td>12500.00</td><td>400000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c6in.metal</td><td>100000.00</td><td>12500.00</td><td>400000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 31 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td colspan="7">C7a</td></tr>
  <tr><td>c7a.medium 1</td><td>325.00 / 10000.00</td><td>40.62 / 1250.00</td><td>2500.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c7a.large 1</td><td>650.00 / 10000.00</td><td>81.25 / 1250.00</td><td>3600.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c7a.xlarge 1</td><td>1250.00 / 10000.00</td><td>156.25 / 1250.00</td><td>6000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c7a.2xlarge 1</td><td>2500.00 / 10000.00</td><td>312.50 / 1250.00</td><td>12000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c7a.4xlarge 1</td><td>5000.00 / 10000.00</td><td>625.00 / 1250.00</td><td>20000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c7a.8xlarge</td><td>10000.00</td><td>1250.00</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c7a.12xlarge</td><td>15000.00</td><td>1875.00</td><td>60000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c7a.16xlarge</td><td>20000.00</td><td>2500.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>48 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c7a.24xlarge</td><td>30000.00</td><td>3750.00</td><td>120000.00</td><td>✓ Yes</td><td>✗ No</td><td>64 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c7a.32xlarge</td><td>40000.00</td><td>5000.00</td><td>160000.00</td><td>✓ Yes</td><td>✗ No</td><td>88 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c7a.48xlarge</td><td>40000.00</td><td>5000.00</td><td>240000.00</td><td>✓ Yes</td><td>✗ No</td><td>128 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c7a.metal-48xl</td><td>40000.00</td><td>5000.00</td><td>240000.00</td><td>✓ Yes</td><td>✗ No</td><td>79 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td colspan="7">C7g</td></tr>
  <tr><td>c7g.medium 1</td><td>315.00 / 10000.00</td><td>39.38 / 1250.00</td><td>2500.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c7g.large 1</td><td>630.00 / 10000.00</td><td>78.75 / 1250.00</td><td>3600.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c7g.xlarge 1</td><td>1250.00 / 10000.00</td><td>156.25 / 1250.00</td><td>6000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c7g.2xlarge 1</td><td>2500.00 / 10000.00</td><td>312.50 / 1250.00</td><td>12000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c7g.4xlarge 1</td><td>5000.00 / 10000.00</td><td>625.00 / 1250.00</td><td>20000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c7g.8xlarge</td><td>10000.00</td><td>1250.00</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c7g.12xlarge</td><td>15000.00</td><td>1875.00</td><td>60000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c7g.16xlarge</td><td>20000.00</td><td>2500.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c7g.metal</td><td>20000.00</td><td>2500.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 31 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td colspan="7">C7gd</td></tr>
  <tr><td>c7gd.medium 1</td><td>315.00 / 10000.00</td><td>39.38 / 1250.00</td><td>2500.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c7gd.large 1</td><td>630.00 / 10000.00</td><td>78.75 / 1250.00</td><td>3600.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c7gd.xlarge 1</td><td>1250.00 / 10000.00</td><td>156.25 / 1250.00</td><td>6000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c7gd.2xlarge 1</td><td>2500.00 / 10000.00</td><td>312.50 / 1250.00</td><td>12000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c7gd.4xlarge 1</td><td>5000.00 / 10000.00</td><td>625.00 / 1250.00</td><td>20000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c7gd.8xlarge</td><td>10000.00</td><td>1250.00</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c7gd.12xlarge</td><td>15000.00</td><td>1875.00</td><td>60000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 25 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c7gd.16xlarge</td><td>20000.00</td><td>2500.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 25 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c7gd.metal</td><td>20000.00</td><td>2500.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 31 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td colspan="7">C7gn</td></tr>
  <tr><td>c7gn.medium 1</td><td>521.00 / 10000.00</td><td>65.12 / 1250.00</td><td>2083.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c7gn.large 1</td><td>1042.00 / 10000.00</td><td>130.25 / 1250.00</td><td>4167.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c7gn.xlarge 1</td><td>2083.00 / 10000.00</td><td>260.38 / 1250.00</td><td>8333.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c7gn.2xlarge 1</td><td>4167.00 / 10000.00</td><td>520.88 / 1250.00</td><td>16667.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c7gn.4xlarge 1</td><td>8333.00 / 10000.00</td><td>1041.62 / 1250.00</td><td>33333.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c7gn.8xlarge 1</td><td>16667.00 / 20000.00</td><td>2083.38 / 2500.00</td><td>66667.00 / 80000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c7gn.12xlarge 1</td><td>25000.00 / 30000.00</td><td>3125.00 / 3750.00</td><td>100000.00 / 120000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c7gn.16xlarge 1</td><td>33333.00 / 40000.00</td><td>4166.62 / 5000.00</td><td>133333.00 / 160000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>c7gn.metal 1</td><td>33333.00 / 40000.00</td><td>4166.62 / 5000.00</td><td>133333.00 / 160000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 31 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td colspan="7">C7i</td></tr>
  <tr><td>c7i.large 1</td><td>650.00 / 10000.00</td><td>81.25 / 1250.00</td><td>3600.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c7i.xlarge 1</td><td>1250.00 / 10000.00</td><td>156.25 / 1250.00</td><td>6000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c7i.2xlarge 1</td><td>2500.00 / 10000.00</td><td>312.50 / 1250.00</td><td>12000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c7i.4xlarge 1</td><td>5000.00 / 10000.00</td><td>625.00 / 1250.00</td><td>20000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c7i.8xlarge</td><td>10000.00</td><td>1250.00</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c7i.12xlarge</td><td>15000.00</td><td>1875.00</td><td>60000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c7i.16xlarge</td><td>20000.00</td><td>2500.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>48 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c7i.24xlarge</td><td>30000.00</td><td>3750.00</td><td>120000.00</td><td>✓ Yes</td><td>✗ No</td><td>64 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c7i.48xlarge</td><td>40000.00</td><td>5000.00</td><td>240000.00</td><td>✓ Yes</td><td>✗ No</td><td>128 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c7i.metal-24xl</td><td>30000.00</td><td>3750.00</td><td>120000.00</td><td>✓ Yes</td><td>✗ No</td><td>39 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c7i.metal-48xl</td><td>40000.00</td><td>5000.00</td><td>240000.00</td><td>✓ Yes</td><td>✗ No</td><td>79 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td colspan="7">C7i-flex</td></tr>
  <tr><td>c7i-flex.large 1</td><td>312.00 / 10000.00</td><td>39.06 / 1250.00</td><td>2500.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c7i-flex.xlarge 1</td><td>625.00 / 10000.00</td><td>78.12 / 1250.00</td><td>3600.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c7i-flex.2xlarge 1</td><td>1250.00 / 10000.00</td><td>156.25 / 1250.00</td><td>6000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c7i-flex.4xlarge 1</td><td>2500.00 / 10000.00</td><td>312.50 / 1250.00</td><td>12000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c7i-flex.8xlarge 1</td><td>5000.00 / 10000.00</td><td>625.00 / 1250.00</td><td>20000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c7i-flex.12xlarge 1</td><td>7500.00 / 15000.00</td><td>937.50 / 1875.00</td><td>30000.00 / 60000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c7i-flex.16xlarge 1</td><td>10000.00 / 20000.00</td><td>1250.00 / 2500.00</td><td>40000.00 / 80000.00</td><td>✓ Yes</td><td>✗ No</td><td>48 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td colspan="7">C8a</td></tr>
  <tr><td>c8a.medium 1</td><td>325.00 / 10000.00</td><td>40.62 / 1250.00</td><td>2500.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8a.large 1</td><td>650.00 / 10000.00</td><td>81.25 / 1250.00</td><td>3600.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8a.xlarge 1</td><td>1250.00 / 10000.00</td><td>156.25 / 1250.00</td><td>6000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8a.2xlarge 1</td><td>2500.00 / 10000.00</td><td>312.50 / 1250.00</td><td>12000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8a.4xlarge 1</td><td>5000.00 / 10000.00</td><td>625.00 / 1250.00</td><td>20000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8a.8xlarge</td><td>10000.00</td><td>1250.00</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8a.12xlarge</td><td>15000.00</td><td>1875.00</td><td>60000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8a.16xlarge</td><td>20000.00</td><td>2500.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>48 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8a.24xlarge</td><td>30000.00</td><td>3750.00</td><td>120000.00</td><td>✓ Yes</td><td>✗ No</td><td>64 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8a.48xlarge</td><td>60000.00</td><td>7500.00</td><td>240000.00</td><td>✓ Yes</td><td>✗ No</td><td>128 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8a.metal-24xl</td><td>30000.00</td><td>3750.00</td><td>120000.00</td><td>✓ Yes</td><td>✗ No</td><td>64 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8a.metal-48xl</td><td>60000.00</td><td>7500.00</td><td>240000.00</td><td>✓ Yes</td><td>✗ No</td><td>79 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td colspan="7">C8g</td></tr>
  <tr><td>c8g.medium 1</td><td>315.00 / 10000.00</td><td>39.38 / 1250.00</td><td>2500.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8g.large 1</td><td>630.00 / 10000.00</td><td>78.75 / 1250.00</td><td>3600.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8g.xlarge 1</td><td>1250.00 / 10000.00</td><td>156.25 / 1250.00</td><td>6000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8g.2xlarge 1</td><td>2500.00 / 10000.00</td><td>312.50 / 1250.00</td><td>12000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8g.4xlarge 1</td><td>5000.00 / 10000.00</td><td>625.00 / 1250.00</td><td>20000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8g.8xlarge</td><td>10000.00</td><td>1250.00</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8g.12xlarge</td><td>15000.00</td><td>1875.00</td><td>60000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8g.16xlarge</td><td>20000.00</td><td>2500.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>48 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8g.24xlarge</td><td>30000.00</td><td>3750.00</td><td>120000.00</td><td>✓ Yes</td><td>✗ No</td><td>64 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8g.48xlarge</td><td>40000.00</td><td>5000.00</td><td>240000.00</td><td>✓ Yes</td><td>✗ No</td><td>128 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8g.metal-24xl</td><td>30000.00</td><td>3750.00</td><td>120000.00</td><td>✓ Yes</td><td>✗ No</td><td>39 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8g.metal-48xl</td><td>40000.00</td><td>5000.00</td><td>240000.00</td><td>✓ Yes</td><td>✗ No</td><td>79 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td colspan="7">C8gb</td></tr>
  <tr><td>c8gb.medium 1</td><td>1562.00 / 25000.00</td><td>195.31 / 3125.00</td><td>7500.00 / 120000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8gb.large 1</td><td>3125.00 / 25000.00</td><td>390.62 / 3125.00</td><td>15000.00 / 120000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8gb.xlarge 1</td><td>6250.00 / 25000.00</td><td>781.25 / 3125.00</td><td>30000.00 / 120000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8gb.2xlarge 1</td><td>12500.00 / 25000.00</td><td>1562.50 / 3125.00</td><td>60000.00 / 120000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8gb.4xlarge</td><td>25000.00</td><td>3125.00</td><td>120000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8gb.8xlarge</td><td>50000.00</td><td>6250.00</td><td>240000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8gb.12xlarge</td><td>75000.00</td><td>9375.00</td><td>360000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8gb.16xlarge</td><td>100000.00</td><td>12500.00</td><td>480000.00</td><td>✓ Yes</td><td>✗ No</td><td>48 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8gb.24xlarge</td><td>150000.00</td><td>18750.00</td><td>720000.00</td><td>✓ Yes</td><td>✗ No</td><td>64 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8gb.48xlarge</td><td>300000.00</td><td>37500.00</td><td>1440000.00</td><td>✓ Yes</td><td>✓ Yes ([2 EBS cards](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ebs_cards.html))</td><td>128 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8gb.metal-24xl</td><td>150000.00</td><td>18750.00</td><td>720000.00</td><td>✓ Yes</td><td>✗ No</td><td>39 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8gb.metal-48xl</td><td>300000.00</td><td>37500.00</td><td>1440000.00</td><td>✓ Yes</td><td>✓ Yes ([2 EBS cards](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ebs_cards.html))</td><td>78 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td colspan="7">C8gd</td></tr>
  <tr><td>c8gd.medium 1</td><td>315.00 / 10000.00</td><td>39.38 / 1250.00</td><td>2500.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8gd.large 1</td><td>630.00 / 10000.00</td><td>78.75 / 1250.00</td><td>3600.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8gd.xlarge 1</td><td>1250.00 / 10000.00</td><td>156.25 / 1250.00</td><td>6000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8gd.2xlarge 1</td><td>2500.00 / 10000.00</td><td>312.50 / 1250.00</td><td>12000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8gd.4xlarge 1</td><td>5000.00 / 10000.00</td><td>625.00 / 1250.00</td><td>20000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8gd.8xlarge</td><td>10000.00</td><td>1250.00</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8gd.12xlarge</td><td>15000.00</td><td>1875.00</td><td>60000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8gd.16xlarge</td><td>20000.00</td><td>2500.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>48 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8gd.24xlarge</td><td>30000.00</td><td>3750.00</td><td>120000.00</td><td>✓ Yes</td><td>✗ No</td><td>64 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8gd.48xlarge</td><td>40000.00</td><td>5000.00</td><td>240000.00</td><td>✓ Yes</td><td>✗ No</td><td>128 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8gd.metal-24xl</td><td>30000.00</td><td>3750.00</td><td>120000.00</td><td>✓ Yes</td><td>✗ No</td><td>39 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8gd.metal-48xl</td><td>40000.00</td><td>5000.00</td><td>240000.00</td><td>✓ Yes</td><td>✗ No</td><td>79 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td colspan="7">C8gn</td></tr>
  <tr><td>c8gn.medium 1</td><td>760.00 / 10000.00</td><td>95.00 / 1250.00</td><td>2500.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8gn.large 1</td><td>1250.00 / 10000.00</td><td>156.25 / 1250.00</td><td>5000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8gn.xlarge 1</td><td>2500.00 / 10000.00</td><td>312.50 / 1250.00</td><td>10000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8gn.2xlarge 1</td><td>5000.00 / 10000.00</td><td>625.00 / 1250.00</td><td>20000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8gn.4xlarge</td><td>10000.00</td><td>1250.00</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8gn.8xlarge</td><td>20000.00</td><td>2500.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8gn.12xlarge</td><td>30000.00</td><td>3750.00</td><td>120000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8gn.16xlarge</td><td>40000.00</td><td>5000.00</td><td>160000.00</td><td>✓ Yes</td><td>✗ No</td><td>48 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8gn.24xlarge</td><td>60000.00</td><td>7500.00</td><td>240000.00</td><td>✓ Yes</td><td>✗ No</td><td>64 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8gn.48xlarge</td><td>120000.00</td><td>15000.00</td><td>480000.00</td><td>✓ Yes</td><td>✓ Yes ([2 EBS cards](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ebs_cards.html))</td><td>128 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8gn.metal-24xl</td><td>60000.00</td><td>7500.00</td><td>240000.00</td><td>✓ Yes</td><td>✗ No</td><td>39 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8gn.metal-48xl</td><td>120000.00</td><td>15000.00</td><td>480000.00</td><td>✓ Yes</td><td>✓ Yes ([2 EBS cards](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ebs_cards.html))</td><td>78 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td colspan="7">C8i</td></tr>
  <tr><td>c8i.large 1</td><td>650.00 / 10000.00</td><td>81.25 / 1250.00</td><td>3600.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8i.xlarge 1</td><td>1250.00 / 10000.00</td><td>156.25 / 1250.00</td><td>6000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8i.2xlarge 1</td><td>2500.00 / 10000.00</td><td>312.50 / 1250.00</td><td>12000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8i.4xlarge 1</td><td>5000.00 / 10000.00</td><td>625.00 / 1250.00</td><td>20000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8i.8xlarge</td><td>10000.00</td><td>1250.00</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8i.12xlarge</td><td>15000.00</td><td>1875.00</td><td>60000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8i.16xlarge</td><td>20000.00</td><td>2500.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>48 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8i.24xlarge</td><td>30000.00</td><td>3750.00</td><td>120000.00</td><td>✓ Yes</td><td>✗ No</td><td>64 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8i.32xlarge</td><td>40000.00</td><td>5000.00</td><td>160000.00</td><td>✓ Yes</td><td>✗ No</td><td>88 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8i.48xlarge</td><td>60000.00</td><td>7500.00</td><td>240000.00</td><td>✓ Yes</td><td>✗ No</td><td>128 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8i.96xlarge</td><td>80000.00</td><td>10000.00</td><td>480000.00</td><td>✓ Yes</td><td>✗ No</td><td>128 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8i.metal-48xl</td><td>60000.00</td><td>7500.00</td><td>240000.00</td><td>✓ Yes</td><td>✗ No</td><td>64 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8i.metal-96xl</td><td>80000.00</td><td>10000.00</td><td>480000.00</td><td>✓ Yes</td><td>✗ No</td><td>79 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td colspan="7">C8id</td></tr>
  <tr><td>c8id.large 1</td><td>650.00 / 10000.00</td><td>81.25 / 1250.00</td><td>3600.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8id.xlarge 1</td><td>1250.00 / 10000.00</td><td>156.25 / 1250.00</td><td>6000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8id.2xlarge 1</td><td>2500.00 / 10000.00</td><td>312.50 / 1250.00</td><td>12000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8id.4xlarge 1</td><td>5000.00 / 10000.00</td><td>625.00 / 1250.00</td><td>20000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8id.8xlarge</td><td>10000.00</td><td>1250.00</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8id.12xlarge</td><td>15000.00</td><td>1875.00</td><td>60000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8id.16xlarge</td><td>20000.00</td><td>2500.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>48 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8id.24xlarge</td><td>30000.00</td><td>3750.00</td><td>120000.00</td><td>✓ Yes</td><td>✗ No</td><td>64 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8id.32xlarge</td><td>40000.00</td><td>5000.00</td><td>160000.00</td><td>✓ Yes</td><td>✗ No</td><td>88 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8id.48xlarge</td><td>60000.00</td><td>7500.00</td><td>240000.00</td><td>✓ Yes</td><td>✗ No</td><td>128 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8id.96xlarge</td><td>80000.00</td><td>10000.00</td><td>480000.00</td><td>✓ Yes</td><td>✗ No</td><td>128 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8id.metal-48xl</td><td>60000.00</td><td>7500.00</td><td>240000.00</td><td>✓ Yes</td><td>✗ No</td><td>64 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8id.metal-96xl</td><td>80000.00</td><td>10000.00</td><td>480000.00</td><td>✓ Yes</td><td>✗ No</td><td>79 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td colspan="7">C8i-flex</td></tr>
  <tr><td>c8i-flex.large 1</td><td>315.00 / 10000.00</td><td>39.38 / 1250.00</td><td>2500.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8i-flex.xlarge 1</td><td>630.00 / 10000.00</td><td>78.75 / 1250.00</td><td>3600.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8i-flex.2xlarge 1</td><td>1250.00 / 10000.00</td><td>156.25 / 1250.00</td><td>6000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8i-flex.4xlarge 1</td><td>2500.00 / 10000.00</td><td>312.50 / 1250.00</td><td>12000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8i-flex.8xlarge 1</td><td>5000.00 / 10000.00</td><td>625.00 / 1250.00</td><td>20000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8i-flex.12xlarge 1</td><td>7500.00 / 15000.00</td><td>937.50 / 1875.00</td><td>30000.00 / 60000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8i-flex.16xlarge 1</td><td>10000.00 / 20000.00</td><td>1250.00 / 2500.00</td><td>40000.00 / 80000.00</td><td>✓ Yes</td><td>✗ No</td><td>48 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td colspan="7">C8in</td></tr>
  <tr><td>c8in.large 1</td><td>650.00 / 10000.00</td><td>81.25 / 1250.00</td><td>3600.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8in.xlarge 1</td><td>1250.00 / 10000.00</td><td>156.25 / 1250.00</td><td>6000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8in.2xlarge 1</td><td>2500.00 / 10000.00</td><td>312.50 / 1250.00</td><td>12000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8in.4xlarge 1</td><td>5000.00 / 10000.00</td><td>625.00 / 1250.00</td><td>20000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8in.8xlarge</td><td>10000.00</td><td>1250.00</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8in.12xlarge</td><td>15000.00</td><td>1875.00</td><td>60000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8in.16xlarge</td><td>20000.00</td><td>2500.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>48 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8in.24xlarge</td><td>30000.00</td><td>3750.00</td><td>120000.00</td><td>✓ Yes</td><td>✗ No</td><td>64 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8in.32xlarge</td><td>40000.00</td><td>5000.00</td><td>160000.00</td><td>✓ Yes</td><td>✗ No</td><td>88 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8in.48xlarge</td><td>60000.00</td><td>7500.00</td><td>240000.00</td><td>✓ Yes</td><td>✗ No</td><td>128 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8in.96xlarge</td><td>120000.00</td><td>15000.00</td><td>480000.00</td><td>✓ Yes</td><td>✓ Yes ([2 EBS cards](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ebs_cards.html))</td><td>128 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8in.metal-48xl</td><td>60000.00</td><td>7500.00</td><td>240000.00</td><td>✓ Yes</td><td>✗ No</td><td>64 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8in.metal-96xl</td><td>120000.00</td><td>15000.00</td><td>480000.00</td><td>✓ Yes</td><td>✓ Yes ([2 EBS cards](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ebs_cards.html))</td><td>78 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td colspan="7">C8ine</td></tr>
  <tr><td>c8ine.large 1</td><td>650.00 / 10000.00</td><td>81.25 / 1250.00</td><td>3600.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8ine.xlarge 1</td><td>1250.00 / 10000.00</td><td>156.25 / 1250.00</td><td>6000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8ine.2xlarge 1</td><td>2500.00 / 10000.00</td><td>312.50 / 1250.00</td><td>12000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8ine.4xlarge 1</td><td>5000.00 / 10000.00</td><td>625.00 / 1250.00</td><td>20000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8ine.8xlarge</td><td>10000.00</td><td>1250.00</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8ine.12xlarge</td><td>15000.00</td><td>1875.00</td><td>60000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td colspan="7">C8ib</td></tr>
  <tr><td>c8ib.large 1</td><td>1563.00 / 25000.00</td><td>195.38 / 3125.00</td><td>7500.00 / 120000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8ib.xlarge 1</td><td>3125.00 / 25000.00</td><td>390.62 / 3125.00</td><td>15000.00 / 120000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8ib.2xlarge 1</td><td>6250.00 / 25000.00</td><td>781.25 / 3125.00</td><td>30000.00 / 120000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8ib.4xlarge 1</td><td>12500.00 / 25000.00</td><td>1562.50 / 3125.00</td><td>60000.00 / 120000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8ib.8xlarge</td><td>25000.00</td><td>3125.00</td><td>120000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8ib.12xlarge</td><td>37500.00</td><td>4687.50</td><td>180000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8ib.16xlarge</td><td>50000.00</td><td>6250.00</td><td>240000.00</td><td>✓ Yes</td><td>✗ No</td><td>48 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8ib.24xlarge</td><td>75000.00</td><td>9375.00</td><td>360000.00</td><td>✓ Yes</td><td>✗ No</td><td>64 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8ib.32xlarge</td><td>100000.00</td><td>12500.00</td><td>480000.00</td><td>✓ Yes</td><td>✗ No</td><td>88 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8ib.48xlarge</td><td>150000.00</td><td>18750.00</td><td>720000.00</td><td>✓ Yes</td><td>✗ No</td><td>128 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8ib.96xlarge</td><td>300000.00</td><td>37500.00</td><td>1440000.00</td><td>✓ Yes</td><td>✓ Yes ([2 EBS cards](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ebs_cards.html))</td><td>128 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8ib.metal-48xl</td><td>150000.00</td><td>18750.00</td><td>720000.00</td><td>✓ Yes</td><td>✗ No</td><td>64 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>c8ib.metal-96xl</td><td>300000.00</td><td>37500.00</td><td>1440000.00</td><td>✓ Yes</td><td>✓ Yes ([2 EBS cards](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ebs_cards.html))</td><td>78 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
</tbody>
</table>


**Note**  
1 These instances can support maximum performance for 30 minutes at least once every 24 hours, after which they revert to their baseline performance. Other instances can sustain the maximum performance indefinitely. If your workload requires sustained maximum performance for longer than 30 minutes, use one of these instances.

## Instance store specifications
<a name="co_instance-store"></a>

The following table shows the instance store volume configuration for supported instance types, along with the aggregated IOPS performance with 4,096 byte block size at queue depth saturation. 


<table>
<thead>
  <tr><th>Instance type</th><th>Instance store volumes</th><th>Instance store type</th><th>100% random read IOPS / Write IOPS</th><th>Needs initialization 1</th><th>TRIM support 2</th></tr>
</thead>
<tbody>
  <tr><td colspan="6">C5ad</td></tr>
  <tr><td>c5ad.large</td><td>1 x 75 GB</td><td>NVMe SSD</td><td>16,283 / 7,105</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>c5ad.xlarge</td><td>1 x 150 GB</td><td>NVMe SSD</td><td>32,566 / 14,211</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>c5ad.2xlarge</td><td>1 x 300 GB</td><td>NVMe SSD</td><td>65,132 / 28,421</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>c5ad.4xlarge</td><td>2 x 300 GB</td><td>NVMe SSD</td><td>130,262 / 56,842</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>c5ad.8xlarge</td><td>2 x 600 GB</td><td>NVMe SSD</td><td>260,526 / 113,684</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>c5ad.12xlarge</td><td>2 x 900 GB</td><td>NVMe SSD</td><td>412,500 / 180,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>c5ad.16xlarge</td><td>2 x 1200 GB</td><td>NVMe SSD</td><td>521,052 / 227,368</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>c5ad.24xlarge</td><td>2 x 1900 GB</td><td>NVMe SSD</td><td>825,000 / 360,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td colspan="6">C5d</td></tr>
  <tr><td>c5d.large</td><td>1 x 50 GB</td><td>NVMe SSD</td><td>20,000 / 9,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>c5d.xlarge</td><td>1 x 100 GB</td><td>NVMe SSD</td><td>40,000 / 18,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>c5d.2xlarge</td><td>1 x 200 GB</td><td>NVMe SSD</td><td>80,000 / 37,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>c5d.4xlarge</td><td>1 x 400 GB</td><td>NVMe SSD</td><td>175,000 / 75,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>c5d.9xlarge</td><td>1 x 900 GB</td><td>NVMe SSD</td><td>350,000 / 170,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>c5d.12xlarge</td><td>2 x 900 GB</td><td>NVMe SSD</td><td>700,000 / 340,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>c5d.18xlarge</td><td>2 x 900 GB</td><td>NVMe SSD</td><td>700,000 / 340,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>c5d.24xlarge</td><td>4 x 900 GB</td><td>NVMe SSD</td><td>1,400,000 / 680,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>c5d.metal</td><td>4 x 900 GB</td><td>NVMe SSD</td><td>1,400,000 / 680,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td colspan="6">C6gd</td></tr>
  <tr><td>c6gd.medium</td><td>1 x 59 GB</td><td>NVMe SSD</td><td>13,438 / 5,625</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>c6gd.large</td><td>1 x 118 GB</td><td>NVMe SSD</td><td>26,875 / 11,250</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>c6gd.xlarge</td><td>1 x 237 GB</td><td>NVMe SSD</td><td>53,750 / 22,500</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>c6gd.2xlarge</td><td>1 x 474 GB</td><td>NVMe SSD</td><td>107,500 / 45,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>c6gd.4xlarge</td><td>1 x 950 GB</td><td>NVMe SSD</td><td>215,000 / 90,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>c6gd.8xlarge</td><td>1 x 1900 GB</td><td>NVMe SSD</td><td>430,000 / 180,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>c6gd.12xlarge</td><td>2 x 1425 GB</td><td>NVMe SSD</td><td>645,000 / 270,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>c6gd.16xlarge</td><td>2 x 1900 GB</td><td>NVMe SSD</td><td>860,000 / 360,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>c6gd.metal</td><td>2 x 1900 GB</td><td>NVMe SSD</td><td>860,000 / 360,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td colspan="6">C6id</td></tr>
  <tr><td>c6id.large</td><td>1 x 118 GB</td><td>NVMe SSD</td><td>33,542 / 16,771</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>c6id.xlarge</td><td>1 x 237 GB</td><td>NVMe SSD</td><td>67,083 / 33,542</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>c6id.2xlarge</td><td>1 x 474 GB</td><td>NVMe SSD</td><td>134,167 / 67,084</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>c6id.4xlarge</td><td>1 x 950 GB</td><td>NVMe SSD</td><td>268,333 / 134,167</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>c6id.8xlarge</td><td>1 x 1900 GB</td><td>NVMe SSD</td><td>536,666 / 268,334</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>c6id.12xlarge</td><td>2 x 1425 GB</td><td>NVMe SSD</td><td>804,998 / 402,500</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>c6id.16xlarge</td><td>2 x 1900 GB</td><td>NVMe SSD</td><td>1,073,332 / 536,668</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>c6id.24xlarge</td><td>4 x 1425 GB</td><td>NVMe SSD</td><td>1,609,996 / 805,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>c6id.32xlarge</td><td>4 x 1900 GB</td><td>NVMe SSD</td><td>2,146,664 / 1,073,336</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>c6id.metal</td><td>4 x 1900 GB</td><td>NVMe SSD</td><td>2,146,664 / 1,073,336</td><td> </td><td>✓ Yes</td></tr>
  <tr><td colspan="6">C7gd</td></tr>
  <tr><td>c7gd.medium</td><td>1 x 59 GB</td><td>NVMe SSD</td><td>16,771 / 8,385</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>c7gd.large</td><td>1 x 118 GB</td><td>NVMe SSD</td><td>33,542 / 16,771</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>c7gd.xlarge</td><td>1 x 237 GB</td><td>NVMe SSD</td><td>67,083 / 33,542</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>c7gd.2xlarge</td><td>1 x 474 GB</td><td>NVMe SSD</td><td>134,167 / 67,084</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>c7gd.4xlarge</td><td>1 x 950 GB</td><td>NVMe SSD</td><td>268,333 / 134,167</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>c7gd.8xlarge</td><td>1 x 1900 GB</td><td>NVMe SSD</td><td>536,666 / 268,334</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>c7gd.12xlarge</td><td>2 x 1425 GB</td><td>NVMe SSD</td><td>804,998 / 402,500</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>c7gd.16xlarge</td><td>2 x 1900 GB</td><td>NVMe SSD</td><td>1,073,332 / 536,668</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>c7gd.metal</td><td>2 x 1900 GB</td><td>NVMe SSD</td><td>1,073,332 / 536,668</td><td> </td><td>✓ Yes</td></tr>
  <tr><td colspan="6">C8gd</td></tr>
  <tr><td>c8gd.medium</td><td>1 x 59 GB</td><td>NVMe SSD</td><td>16,771 / 8,385</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>c8gd.large</td><td>1 x 118 GB</td><td>NVMe SSD</td><td>33,542 / 16,771</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>c8gd.xlarge</td><td>1 x 237 GB</td><td>NVMe SSD</td><td>67,083 / 33,542</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>c8gd.2xlarge</td><td>1 x 474 GB</td><td>NVMe SSD</td><td>134,167 / 67,084</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>c8gd.4xlarge</td><td>1 x 950 GB</td><td>NVMe SSD</td><td>268,333 / 134,167</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>c8gd.8xlarge</td><td>1 x 1900 GB</td><td>NVMe SSD</td><td>536,666 / 268,334</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>c8gd.12xlarge</td><td>3 x 950 GB</td><td>NVMe SSD</td><td>804,999 / 402,501</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>c8gd.16xlarge</td><td>2 x 1900 GB</td><td>NVMe SSD</td><td>1,073,332 / 536,668</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>c8gd.24xlarge</td><td>3 x 1900 GB</td><td>NVMe SSD</td><td>1,609,998 / 805,002</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>c8gd.48xlarge</td><td>6 x 1900 GB</td><td>NVMe SSD</td><td>3,219,996 / 1,610,004</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>c8gd.metal-24xl</td><td>3 x 1900 GB</td><td>NVMe SSD</td><td>1,609,998 / 805,002</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>c8gd.metal-48xl</td><td>6 x 1900 GB</td><td>NVMe SSD</td><td>3,219,996 / 1,610,004</td><td> </td><td>✓ Yes</td></tr>
  <tr><td colspan="6">C8id</td></tr>
  <tr><td>c8id.large</td><td>1 x 118 GB</td><td>NVMe SSD</td><td>33,542 / 16,771</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>c8id.xlarge</td><td>1 x 237 GB</td><td>NVMe SSD</td><td>67,083 / 33,542</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>c8id.2xlarge</td><td>1 x 474 GB</td><td>NVMe SSD</td><td>134,167 / 67,084</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>c8id.4xlarge</td><td>1 x 950 GB</td><td>NVMe SSD</td><td>268,333 / 134,167</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>c8id.8xlarge</td><td>1 x 1900 GB</td><td>NVMe SSD</td><td>536,666 / 268,334</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>c8id.12xlarge</td><td>1 x 2850 GB</td><td>NVMe SSD</td><td>804,999 / 402,501</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>c8id.16xlarge</td><td>1 x 3800 GB</td><td>NVMe SSD</td><td>1,073,332 / 536,668</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>c8id.24xlarge</td><td>2 x 2850 GB</td><td>NVMe SSD</td><td>1,609,998 / 805,002</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>c8id.32xlarge</td><td>2 x 3800 GB</td><td>NVMe SSD</td><td>2,146,664 / 1,073,336</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>c8id.48xlarge</td><td>3 x 3800 GB</td><td>NVMe SSD</td><td>3,219,996 / 1,610,004</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>c8id.96xlarge</td><td>6 x 3800 GB</td><td>NVMe SSD</td><td>6,439,992 / 3,220,008</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>c8id.metal-48xl</td><td>3 x 3800 GB</td><td>NVMe SSD</td><td>3,219,996 / 1,610,004</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>c8id.metal-96xl</td><td>6 x 3800 GB</td><td>NVMe SSD</td><td>6,439,992 / 3,220,008</td><td> </td><td>✓ Yes</td></tr>
</tbody>
</table>


1 Volumes attached to certain instances suffer a first-write penalty unless initialized. For more information, see [Optimize disk performance for instance store volumes](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/disk-performance.html).

2 For more information, see [Instance store volume TRIM support](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ssd-instance-store.html#InstanceStoreTrimSupport).

## Security specifications
<a name="co_security"></a>


<table>
<thead>
  <tr><th>Instance type</th><th>EBS encryption</th><th>Instance store encryption</th><th>Encryption in transit</th><th>AMD SEV-SNP</th><th>NitroTPM</th><th>Nitro Enclaves</th></tr>
</thead>
<tbody>
  <tr><td colspan="7">C5</td></tr>
  <tr><td>c5.large</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>c5.xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c5.2xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c5.4xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c5.9xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c5.12xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c5.18xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c5.24xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c5.metal</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">C5a</td></tr>
  <tr><td>c5a.large</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>c5a.xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c5a.2xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c5a.4xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c5a.8xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c5a.12xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c5a.16xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c5a.24xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td colspan="7">C5ad</td></tr>
  <tr><td>c5ad.large</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>c5ad.xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c5ad.2xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c5ad.4xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c5ad.8xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c5ad.12xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c5ad.16xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c5ad.24xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td colspan="7">C5d</td></tr>
  <tr><td>c5d.large</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>c5d.xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c5d.2xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c5d.4xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c5d.9xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c5d.12xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c5d.18xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c5d.24xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c5d.metal</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">C5n</td></tr>
  <tr><td>c5n.large</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>c5n.xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c5n.2xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c5n.4xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c5n.9xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c5n.18xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c5n.metal</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">C6a</td></tr>
  <tr><td>c6a.large</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>c6a.xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c6a.2xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c6a.4xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c6a.8xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c6a.12xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c6a.16xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c6a.24xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c6a.32xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c6a.48xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c6a.metal</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">C6g</td></tr>
  <tr><td>c6g.medium</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>c6g.large</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c6g.xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c6g.2xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c6g.4xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c6g.8xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c6g.12xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c6g.16xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c6g.metal</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">C6gd</td></tr>
  <tr><td>c6gd.medium</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>c6gd.large</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c6gd.xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c6gd.2xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c6gd.4xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c6gd.8xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c6gd.12xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c6gd.16xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c6gd.metal</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">C6gn</td></tr>
  <tr><td>c6gn.medium</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>c6gn.large</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c6gn.xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c6gn.2xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c6gn.4xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c6gn.8xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c6gn.12xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c6gn.16xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td colspan="7">C6i</td></tr>
  <tr><td>c6i.large</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>c6i.xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c6i.2xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c6i.4xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c6i.8xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c6i.12xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c6i.16xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c6i.24xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c6i.32xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c6i.metal</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">C6id</td></tr>
  <tr><td>c6id.large</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>c6id.xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c6id.2xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c6id.4xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c6id.8xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c6id.12xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c6id.16xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c6id.24xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c6id.32xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c6id.metal</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">C6in</td></tr>
  <tr><td>c6in.large</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>c6in.xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c6in.2xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c6in.4xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c6in.8xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c6in.12xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c6in.16xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c6in.24xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c6in.32xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c6in.metal</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">C7a</td></tr>
  <tr><td>c7a.medium</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>c7a.large</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>c7a.xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c7a.2xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c7a.4xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c7a.8xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c7a.12xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c7a.16xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c7a.24xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c7a.32xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c7a.48xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c7a.metal-48xl</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">C7g</td></tr>
  <tr><td>c7g.medium</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>c7g.large</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c7g.xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c7g.2xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c7g.4xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c7g.8xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c7g.12xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c7g.16xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c7g.metal</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">C7gd</td></tr>
  <tr><td>c7gd.medium</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>c7gd.large</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c7gd.xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c7gd.2xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c7gd.4xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c7gd.8xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c7gd.12xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c7gd.16xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c7gd.metal</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">C7gn</td></tr>
  <tr><td>c7gn.medium</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>c7gn.large</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>c7gn.xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>c7gn.2xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>c7gn.4xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>c7gn.8xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>c7gn.12xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>c7gn.16xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>c7gn.metal</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">C7i</td></tr>
  <tr><td>c7i.large</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>c7i.xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c7i.2xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c7i.4xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c7i.8xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c7i.12xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c7i.16xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c7i.24xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c7i.48xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c7i.metal-24xl</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c7i.metal-48xl</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">C7i-flex</td></tr>
  <tr><td>c7i-flex.large</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>c7i-flex.xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>c7i-flex.2xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>c7i-flex.4xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>c7i-flex.8xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>c7i-flex.12xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>c7i-flex.16xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td colspan="7">C8a</td></tr>
  <tr><td>c8a.medium</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>c8a.large</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c8a.xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c8a.2xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c8a.4xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c8a.8xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c8a.12xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c8a.16xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c8a.24xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c8a.48xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c8a.metal-24xl</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8a.metal-48xl</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">C8g</td></tr>
  <tr><td>c8g.medium</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>c8g.large</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c8g.xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c8g.2xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c8g.4xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c8g.8xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c8g.12xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c8g.16xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c8g.24xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c8g.48xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c8g.metal-24xl</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8g.metal-48xl</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">C8gb</td></tr>
  <tr><td>c8gb.medium</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>c8gb.large</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c8gb.xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c8gb.2xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c8gb.4xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c8gb.8xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c8gb.12xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c8gb.16xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c8gb.24xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c8gb.48xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c8gb.metal-24xl</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8gb.metal-48xl</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">C8gd</td></tr>
  <tr><td>c8gd.medium</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>c8gd.large</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c8gd.xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c8gd.2xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c8gd.4xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c8gd.8xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c8gd.12xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c8gd.16xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c8gd.24xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c8gd.48xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c8gd.metal-24xl</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8gd.metal-48xl</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">C8gn</td></tr>
  <tr><td>c8gn.medium</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>c8gn.large</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c8gn.xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c8gn.2xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c8gn.4xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c8gn.8xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c8gn.12xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c8gn.16xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c8gn.24xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c8gn.48xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c8gn.metal-24xl</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8gn.metal-48xl</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">C8i</td></tr>
  <tr><td>c8i.large</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>c8i.xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c8i.2xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c8i.4xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c8i.8xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c8i.12xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c8i.16xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c8i.24xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c8i.32xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c8i.48xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c8i.96xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c8i.metal-48xl</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8i.metal-96xl</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">C8id</td></tr>
  <tr><td>c8id.large</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>c8id.xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c8id.2xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c8id.4xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c8id.8xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c8id.12xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c8id.16xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c8id.24xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c8id.32xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c8id.48xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c8id.96xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c8id.metal-48xl</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8id.metal-96xl</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">C8i-flex</td></tr>
  <tr><td>c8i-flex.large</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>c8i-flex.xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>c8i-flex.2xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>c8i-flex.4xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>c8i-flex.8xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>c8i-flex.12xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>c8i-flex.16xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td colspan="7">C8in</td></tr>
  <tr><td>c8in.large</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>c8in.xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c8in.2xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c8in.4xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c8in.8xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c8in.12xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c8in.16xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c8in.24xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c8in.32xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c8in.48xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c8in.96xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c8in.metal-48xl</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8in.metal-96xl</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">C8ine</td></tr>
  <tr><td>c8ine.large</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>c8ine.xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c8ine.2xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c8ine.4xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c8ine.8xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c8ine.12xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td colspan="7">C8ib</td></tr>
  <tr><td>c8ib.large</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>c8ib.xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c8ib.2xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c8ib.4xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c8ib.8xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c8ib.12xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c8ib.16xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c8ib.24xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c8ib.32xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c8ib.48xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c8ib.96xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>c8ib.metal-48xl</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c8ib.metal-96xl</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
</tbody>
</table>
