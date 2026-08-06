

# Specifications for Amazon EC2 storage optimized instances
<a name="so"></a>

Storage optimized instances are designed for workloads that require high, sequential read and write access to very large data sets on local storage. They are optimized to deliver tens of thousands of low-latency, random I/O operations per second (IOPS) to applications.

For information on previous generation instance types of this category, such as I2 instances, see [Specifications for Amazon EC2 previous generation instances](pg.md).

**Topics**
+ [Instance families and instance types](#so_sizes)
+ [Instance family summary](#so_summary)
+ [Performance specifications](#so_hardware)
+ [Network specifications](#so_network)
+ [Amazon EBS specifications](#so_storage-ebs)
+ [Instance store specifications](#so_instance-store)
+ [Security specifications](#so_security)

**Pricing**  
For pricing information, see [Amazon EC2 On-Demand Pricing](https://aws.amazon.com/ec2/pricing/on-demand/).

## Instance families and instance types
<a name="so_sizes"></a>


| Instance family | Available instance types | 
| --- | --- | 
| D2 | d2.xlarge \| d2.2xlarge \| d2.4xlarge \| d2.8xlarge | 
| D3 | d3.xlarge \| d3.2xlarge \| d3.4xlarge \| d3.8xlarge | 
| D3en | d3en.xlarge \| d3en.2xlarge \| d3en.4xlarge \| d3en.6xlarge \| d3en.8xlarge \| d3en.12xlarge | 
| H1 | h1.2xlarge \| h1.4xlarge \| h1.8xlarge \| h1.16xlarge | 
| I3 | i3.large \| i3.xlarge \| i3.2xlarge \| i3.4xlarge \| i3.8xlarge \| i3.16xlarge \| i3.metal | 
| I3en | i3en.large \| i3en.xlarge \| i3en.2xlarge \| i3en.3xlarge \| i3en.6xlarge \| i3en.12xlarge \| i3en.24xlarge \| i3en.metal | 
| I4g | i4g.large \| i4g.xlarge \| i4g.2xlarge \| i4g.4xlarge \| i4g.8xlarge \| i4g.16xlarge | 
| I4i | i4i.large \| i4i.xlarge \| i4i.2xlarge \| i4i.4xlarge \| i4i.8xlarge \| i4i.12xlarge \| i4i.16xlarge \| i4i.24xlarge \| i4i.32xlarge \| i4i.metal | 
| I7i | i7i.large \| i7i.xlarge \| i7i.2xlarge \| i7i.4xlarge \| i7i.8xlarge \| i7i.12xlarge \| i7i.16xlarge \| i7i.24xlarge \| i7i.48xlarge \| i7i.metal-24xl \| i7i.metal-48xl | 
| I7ie | i7ie.large \| i7ie.xlarge \| i7ie.2xlarge \| i7ie.3xlarge \| i7ie.6xlarge \| i7ie.12xlarge \| i7ie.18xlarge \| i7ie.24xlarge \| i7ie.48xlarge \| i7ie.metal-24xl \| i7ie.metal-48xl | 
| I8g | i8g.large \| i8g.xlarge \| i8g.2xlarge \| i8g.4xlarge \| i8g.8xlarge \| i8g.12xlarge \| i8g.16xlarge \| i8g.24xlarge \| i8g.48xlarge \| i8g.metal-24xl \| i8g.metal-48xl | 
| I8ge | i8ge.large \| i8ge.xlarge \| i8ge.2xlarge \| i8ge.3xlarge \| i8ge.6xlarge \| i8ge.12xlarge \| i8ge.18xlarge \| i8ge.24xlarge \| i8ge.48xlarge \| i8ge.metal-24xl \| i8ge.metal-48xl | 
| Im4gn | im4gn.large \| im4gn.xlarge \| im4gn.2xlarge \| im4gn.4xlarge \| im4gn.8xlarge \| im4gn.16xlarge | 
| Is4gen | is4gen.medium \| is4gen.large \| is4gen.xlarge \| is4gen.2xlarge \| is4gen.4xlarge \| is4gen.8xlarge | 

## Instance family summary
<a name="so_summary"></a>


| Instance family | Hypervisor | Processor type (architecture) | Metal instances available | Dedicated Hosts support | Spot support | Hibernation support | Supported operating systems | 
| --- | --- | --- | --- | --- | --- | --- | --- | 
| D2 | Xen | Intel (x86\_64) | ✗ No | ✓ Yes | ✓ Yes | ✗ No | Windows \| Linux | 
| D3 | [Nitro v3](ec2-nitro-instances.md) | Intel (x86\_64) | ✗ No | ✗ No | ✓ Yes | ✗ No | Windows \| Linux | 
| D3en | [Nitro v3](ec2-nitro-instances.md) | Intel (x86\_64) | ✗ No | ✗ No | ✓ Yes | ✗ No | Windows \| Linux | 
| H1 | Xen | Intel (x86\_64) | ✗ No | ✓ Yes | ✓ Yes | ✗ No | Windows \| Linux | 
| I3 | Xen \* | Intel (x86\_64) | ✓ Yes | ✓ Yes | ✓ Yes | ✓ Yes | Windows \| Linux | 
| I3en | [Nitro v3](ec2-nitro-instances.md) | Intel (x86\_64) | ✓ Yes | ✓ Yes | ✓ Yes | ✓ Yes | Windows \| Linux | 
| I4g | [Nitro v4](ec2-nitro-instances.md) | AWS Graviton (arm64) | ✗ No | ✓ Yes | ✓ Yes | ✓ Yes | Linux | 
| I4i | [Nitro v4](ec2-nitro-instances.md) | Intel (x86\_64) | ✓ Yes | ✓ Yes | ✓ Yes | ✗ No | Windows \| Linux | 
| I7i | [Nitro v4](ec2-nitro-instances.md) | Intel (x86\_64) | ✓ Yes | ✓ Yes | ✓ Yes | ✓ Yes | Windows \| Linux | 
| I7ie | [Nitro v5](ec2-nitro-instances.md) | Intel (x86\_64) | ✓ Yes | ✓ Yes | ✓ Yes | ✓ Yes | Windows \| Linux | 
| I8g | [Nitro v5](ec2-nitro-instances.md) | AWS Graviton (arm64) | ✓ Yes | ✓ Yes | ✓ Yes | ✓ Yes | Linux | 
| I8ge | [Nitro v6](ec2-nitro-instances.md) | AWS Graviton (arm64) | ✓ Yes | ✓ Yes | ✓ Yes | ✓ Yes | Linux | 
| Im4gn | [Nitro v4](ec2-nitro-instances.md) | AWS Graviton (arm64) | ✗ No | ✓ Yes | ✓ Yes | ✓ Yes | Linux | 
| Is4gen | [Nitro v4](ec2-nitro-instances.md) | AWS Graviton (arm64) | ✗ No | ✗ No | ✓ Yes | ✓ Yes | Linux | 

**Note**  
\* `i3.metal` instances are built on the AWS Nitro System.

## Performance specifications
<a name="so_hardware"></a>


<table>
<thead>
  <tr><th>Instance type</th><th>Memory (GiB)</th><th>Processor</th><th>vCPUs</th><th>CPU cores</th><th>Threads per core</th><th>Accelerators</th><th>Accelerator memory</th></tr>
</thead>
<tbody>
  <tr><td colspan="8">D2</td></tr>
  <tr><td>d2.xlarge</td><td>30.50</td><td>Intel Xeon E52676v3</td><td>4</td><td>2</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>d2.2xlarge</td><td>61.00</td><td>Intel Xeon E52676v3</td><td>8</td><td>4</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>d2.4xlarge</td><td>122.00</td><td>Intel Xeon E52676v3</td><td>16</td><td>8</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>d2.8xlarge</td><td>244.00</td><td>Intel Xeon E52676v3</td><td>36</td><td>18</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">D3</td></tr>
  <tr><td>d3.xlarge</td><td>32.00</td><td>Intel Xeon Platinum 8259</td><td>4</td><td>2</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>d3.2xlarge</td><td>64.00</td><td>Intel Xeon Platinum 8259</td><td>8</td><td>4</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>d3.4xlarge</td><td>128.00</td><td>Intel Xeon Platinum 8259</td><td>16</td><td>8</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>d3.8xlarge</td><td>256.00</td><td>Intel Xeon Platinum 8259</td><td>32</td><td>16</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">D3en</td></tr>
  <tr><td>d3en.xlarge</td><td>16.00</td><td>Intel Xeon Platinum 8259</td><td>4</td><td>2</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>d3en.2xlarge</td><td>32.00</td><td>Intel Xeon Platinum 8259</td><td>8</td><td>4</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>d3en.4xlarge</td><td>64.00</td><td>Intel Xeon Platinum 8259</td><td>16</td><td>8</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>d3en.6xlarge</td><td>96.00</td><td>Intel Xeon Platinum 8259</td><td>24</td><td>12</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>d3en.8xlarge</td><td>128.00</td><td>Intel Xeon Platinum 8259</td><td>32</td><td>16</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>d3en.12xlarge</td><td>192.00</td><td>Intel Xeon Platinum 8259</td><td>48</td><td>24</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">H1</td></tr>
  <tr><td>h1.2xlarge</td><td>32.00</td><td>Intel Broadwell E5-2686v4</td><td>8</td><td>4</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>h1.4xlarge</td><td>64.00</td><td>Intel Broadwell E5-2686v4</td><td>16</td><td>8</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>h1.8xlarge</td><td>128.00</td><td>Intel Broadwell E5-2686v4</td><td>32</td><td>16</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>h1.16xlarge</td><td>256.00</td><td>Intel Broadwell E5-2686v4</td><td>64</td><td>32</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">I3</td></tr>
  <tr><td>i3.large</td><td>15.25</td><td>Intel Broadwell E5-2686v4</td><td>2</td><td>1</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>i3.xlarge</td><td>30.50</td><td>Intel Broadwell E5-2686v4</td><td>4</td><td>2</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>i3.2xlarge</td><td>61.00</td><td>Intel Broadwell E5-2686v4</td><td>8</td><td>4</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>i3.4xlarge</td><td>122.00</td><td>Intel Broadwell E5-2686v4</td><td>16</td><td>8</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>i3.8xlarge</td><td>244.00</td><td>Intel Broadwell E5-2686v4</td><td>32</td><td>16</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>i3.16xlarge</td><td>488.00</td><td>Intel Broadwell E5-2686v4</td><td>64</td><td>32</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>i3.metal</td><td>512.00</td><td>Intel Broadwell E5-2686v4</td><td>72</td><td>36</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">I3en</td></tr>
  <tr><td>i3en.large</td><td>16.00</td><td>Intel Xeon Platinum 8175</td><td>2</td><td>1</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>i3en.xlarge</td><td>32.00</td><td>Intel Xeon Platinum 8175</td><td>4</td><td>2</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>i3en.2xlarge</td><td>64.00</td><td>Intel Xeon Platinum 8175</td><td>8</td><td>4</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>i3en.3xlarge</td><td>96.00</td><td>Intel Xeon Platinum 8175</td><td>12</td><td>6</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>i3en.6xlarge</td><td>192.00</td><td>Intel Xeon Platinum 8175</td><td>24</td><td>12</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>i3en.12xlarge</td><td>384.00</td><td>Intel Xeon Platinum 8175</td><td>48</td><td>24</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>i3en.24xlarge</td><td>768.00</td><td>Intel Xeon Platinum 8175</td><td>96</td><td>48</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>i3en.metal</td><td>768.00</td><td>Intel Xeon Platinum 8175</td><td>96</td><td>48</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">I4g</td></tr>
  <tr><td>i4g.large</td><td>16.00</td><td>AWS Graviton2 Processor</td><td>2</td><td>2</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>i4g.xlarge</td><td>32.00</td><td>AWS Graviton2 Processor</td><td>4</td><td>4</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>i4g.2xlarge</td><td>64.00</td><td>AWS Graviton2 Processor</td><td>8</td><td>8</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>i4g.4xlarge</td><td>128.00</td><td>AWS Graviton2 Processor</td><td>16</td><td>16</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>i4g.8xlarge</td><td>256.00</td><td>AWS Graviton2 Processor</td><td>32</td><td>32</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>i4g.16xlarge</td><td>512.00</td><td>AWS Graviton2 Processor</td><td>64</td><td>64</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">I4i</td></tr>
  <tr><td>i4i.large</td><td>16.00</td><td>Intel Xeon Ice Lake</td><td>2</td><td>1</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>i4i.xlarge</td><td>32.00</td><td>Intel Xeon Ice Lake</td><td>4</td><td>2</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>i4i.2xlarge</td><td>64.00</td><td>Intel Xeon Ice Lake</td><td>8</td><td>4</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>i4i.4xlarge</td><td>128.00</td><td>Intel Xeon Ice Lake</td><td>16</td><td>8</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>i4i.8xlarge</td><td>256.00</td><td>Intel Xeon Ice Lake</td><td>32</td><td>16</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>i4i.12xlarge</td><td>384.00</td><td>Intel Xeon Ice Lake</td><td>48</td><td>24</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>i4i.16xlarge</td><td>512.00</td><td>Intel Xeon Ice Lake</td><td>64</td><td>32</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>i4i.24xlarge</td><td>768.00</td><td>Intel Xeon Ice Lake</td><td>96</td><td>48</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>i4i.32xlarge</td><td>1024.00</td><td>Intel Xeon Ice Lake</td><td>128</td><td>64</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>i4i.metal</td><td>1024.00</td><td>Intel Xeon Ice Lake</td><td>128</td><td>64</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">I7i</td></tr>
  <tr><td>i7i.large</td><td>16.00</td><td>Intel Emerald Rapids</td><td>2</td><td>1</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>i7i.xlarge</td><td>32.00</td><td>Intel Emerald Rapids</td><td>4</td><td>2</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>i7i.2xlarge</td><td>64.00</td><td>Intel Emerald Rapids</td><td>8</td><td>4</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>i7i.4xlarge</td><td>128.00</td><td>Intel Emerald Rapids</td><td>16</td><td>8</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>i7i.8xlarge</td><td>256.00</td><td>Intel Emerald Rapids</td><td>32</td><td>16</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>i7i.12xlarge</td><td>384.00</td><td>Intel Emerald Rapids</td><td>48</td><td>24</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>i7i.16xlarge</td><td>512.00</td><td>Intel Emerald Rapids</td><td>64</td><td>32</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>i7i.24xlarge</td><td>768.00</td><td>Intel Emerald Rapids</td><td>96</td><td>48</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>i7i.48xlarge</td><td>1536.00</td><td>Intel Emerald Rapids</td><td>192</td><td>96</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>i7i.metal-24xl</td><td>768.00</td><td>Intel Emerald Rapids</td><td>96</td><td>48</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>i7i.metal-48xl</td><td>1536.00</td><td>Intel Emerald Rapids</td><td>192</td><td>96</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">I7ie</td></tr>
  <tr><td>i7ie.large</td><td>16.00</td><td>Intel Emerald Rapids</td><td>2</td><td>1</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>i7ie.xlarge</td><td>32.00</td><td>Intel Emerald Rapids</td><td>4</td><td>2</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>i7ie.2xlarge</td><td>64.00</td><td>Intel Emerald Rapids</td><td>8</td><td>4</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>i7ie.3xlarge</td><td>96.00</td><td>Intel Emerald Rapids</td><td>12</td><td>6</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>i7ie.6xlarge</td><td>192.00</td><td>Intel Emerald Rapids</td><td>24</td><td>12</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>i7ie.12xlarge</td><td>384.00</td><td>Intel Emerald Rapids</td><td>48</td><td>24</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>i7ie.18xlarge</td><td>576.00</td><td>Intel Emerald Rapids</td><td>72</td><td>36</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>i7ie.24xlarge</td><td>768.00</td><td>Intel Emerald Rapids</td><td>96</td><td>48</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>i7ie.48xlarge</td><td>1536.00</td><td>Intel Emerald Rapids</td><td>192</td><td>96</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>i7ie.metal-24xl</td><td>768.00</td><td>Intel Emerald Rapids</td><td>96</td><td>48</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>i7ie.metal-48xl</td><td>1536.00</td><td>Intel Emerald Rapids</td><td>192</td><td>96</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">I8g</td></tr>
  <tr><td>i8g.large</td><td>16.00</td><td>AWS Graviton4 Processor</td><td>2</td><td>2</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>i8g.xlarge</td><td>32.00</td><td>AWS Graviton4 Processor</td><td>4</td><td>4</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>i8g.2xlarge</td><td>64.00</td><td>AWS Graviton4 Processor</td><td>8</td><td>8</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>i8g.4xlarge</td><td>128.00</td><td>AWS Graviton4 Processor</td><td>16</td><td>16</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>i8g.8xlarge</td><td>256.00</td><td>AWS Graviton4 Processor</td><td>32</td><td>32</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>i8g.12xlarge</td><td>384.00</td><td>AWS Graviton4 Processor</td><td>48</td><td>48</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>i8g.16xlarge</td><td>512.00</td><td>AWS Graviton4 Processor</td><td>64</td><td>64</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>i8g.24xlarge</td><td>768.00</td><td>AWS Graviton4 Processor</td><td>96</td><td>96</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>i8g.48xlarge</td><td>1536.00</td><td>AWS Graviton4 Processor</td><td>192</td><td>192</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>i8g.metal-24xl</td><td>768.00</td><td>AWS Graviton4 Processor</td><td>96</td><td>96</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>i8g.metal-48xl</td><td>1536.00</td><td>AWS Graviton4 Processor</td><td>192</td><td>192</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">I8ge</td></tr>
  <tr><td>i8ge.large</td><td>16.00</td><td>AWS Graviton4 Processor</td><td>2</td><td>2</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>i8ge.xlarge</td><td>32.00</td><td>AWS Graviton4 Processor</td><td>4</td><td>4</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>i8ge.2xlarge</td><td>64.00</td><td>AWS Graviton4 Processor</td><td>8</td><td>8</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>i8ge.3xlarge</td><td>96.00</td><td>AWS Graviton4 Processor</td><td>12</td><td>12</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>i8ge.6xlarge</td><td>192.00</td><td>AWS Graviton4 Processor</td><td>24</td><td>24</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>i8ge.12xlarge</td><td>384.00</td><td>AWS Graviton4 Processor</td><td>48</td><td>48</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>i8ge.18xlarge</td><td>576.00</td><td>AWS Graviton4 Processor</td><td>72</td><td>72</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>i8ge.24xlarge</td><td>768.00</td><td>AWS Graviton4 Processor</td><td>96</td><td>96</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>i8ge.48xlarge</td><td>1536.00</td><td>AWS Graviton4 Processor</td><td>192</td><td>192</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>i8ge.metal-24xl</td><td>768.00</td><td>AWS Graviton4 Processor</td><td>96</td><td>96</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>i8ge.metal-48xl</td><td>1536.00</td><td>AWS Graviton4 Processor</td><td>192</td><td>192</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">Im4gn</td></tr>
  <tr><td>im4gn.large</td><td>8.00</td><td>AWS Graviton2 Processor</td><td>2</td><td>2</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>im4gn.xlarge</td><td>16.00</td><td>AWS Graviton2 Processor</td><td>4</td><td>4</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>im4gn.2xlarge</td><td>32.00</td><td>AWS Graviton2 Processor</td><td>8</td><td>8</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>im4gn.4xlarge</td><td>64.00</td><td>AWS Graviton2 Processor</td><td>16</td><td>16</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>im4gn.8xlarge</td><td>128.00</td><td>AWS Graviton2 Processor</td><td>32</td><td>32</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>im4gn.16xlarge</td><td>256.00</td><td>AWS Graviton2 Processor</td><td>64</td><td>64</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">Is4gen</td></tr>
  <tr><td>is4gen.medium</td><td>6.00</td><td>AWS Graviton2 Processor</td><td>1</td><td>1</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>is4gen.large</td><td>12.00</td><td>AWS Graviton2 Processor</td><td>2</td><td>2</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>is4gen.xlarge</td><td>24.00</td><td>AWS Graviton2 Processor</td><td>4</td><td>4</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>is4gen.2xlarge</td><td>48.00</td><td>AWS Graviton2 Processor</td><td>8</td><td>8</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>is4gen.4xlarge</td><td>96.00</td><td>AWS Graviton2 Processor</td><td>16</td><td>16</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>is4gen.8xlarge</td><td>192.00</td><td>AWS Graviton2 Processor</td><td>32</td><td>32</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
</tbody>
</table>


## Network specifications
<a name="so_network"></a>


<table>
<thead>
  <tr><th>Instance type</th><th>Baseline / Burst bandwidth (Gbps)</th><th>EFA</th><th>ENA</th><th>ENA Express</th><th>Network cards</th><th>Max. network interfaces</th><th>IP addresses per interface</th><th>IPv6</th></tr>
</thead>
<tbody>
  <tr><td colspan="9">D2</td></tr>
  <tr><td>d2.xlarge</td><td>Moderate</td><td>✗ No</td><td>✗ No 2</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>d2.2xlarge</td><td>High</td><td>✗ No</td><td>✗ No 2</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>d2.4xlarge</td><td>High</td><td>✗ No</td><td>✗ No 2</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>d2.8xlarge</td><td>10 Gigabit</td><td>✗ No</td><td>✗ No 2</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">D3</td></tr>
  <tr><td>d3.xlarge 1</td><td>3.0 / 15.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>3</td><td>✓ Yes</td></tr>
  <tr><td>d3.2xlarge 1</td><td>6.0 / 15.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>5</td><td>✓ Yes</td></tr>
  <tr><td>d3.4xlarge 1</td><td>12.5 / 15.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>d3.8xlarge</td><td>25 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>20</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">D3en</td></tr>
  <tr><td>d3en.xlarge 1</td><td>6.0 / 25.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>3</td><td>✓ Yes</td></tr>
  <tr><td>d3en.2xlarge 1</td><td>12.5 / 25.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>5</td><td>✓ Yes</td></tr>
  <tr><td>d3en.4xlarge</td><td>25 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>d3en.6xlarge</td><td>40 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>d3en.8xlarge</td><td>50 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>20</td><td>✓ Yes</td></tr>
  <tr><td>d3en.12xlarge</td><td>75 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">H1</td></tr>
  <tr><td>h1.2xlarge 1</td><td>2.5 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>h1.4xlarge 1</td><td>5.0 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>h1.8xlarge</td><td>10 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>h1.16xlarge</td><td>25 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">I3</td></tr>
  <tr><td>i3.large 1</td><td>0.75 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>i3.xlarge 1</td><td>1.25 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>i3.2xlarge 1</td><td>2.5 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>i3.4xlarge 1</td><td>5.0 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>i3.8xlarge</td><td>10 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>i3.16xlarge</td><td>25 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>i3.metal</td><td>25 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">I3en</td></tr>
  <tr><td>i3en.large 1</td><td>2.1 / 25.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>i3en.xlarge 1</td><td>4.2 / 25.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>i3en.2xlarge 1</td><td>8.4 / 25.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>i3en.3xlarge 1</td><td>12.5 / 25.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>i3en.6xlarge</td><td>25 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>i3en.12xlarge</td><td>50 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>i3en.24xlarge</td><td>100 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>i3en.metal</td><td>100 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">I4g</td></tr>
  <tr><td>i4g.large 1</td><td>0.781 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>i4g.xlarge 1</td><td>1.875 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>i4g.2xlarge 1</td><td>4.687 / 12.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>i4g.4xlarge 1</td><td>9.375 / 25.0</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>i4g.8xlarge</td><td>18.75 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>i4g.16xlarge</td><td>37.5 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">I4i</td></tr>
  <tr><td>i4i.large 1</td><td>0.781 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>i4i.xlarge 1</td><td>1.875 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>i4i.2xlarge 1</td><td>4.687 / 12.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>i4i.4xlarge 1</td><td>9.375 / 25.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>i4i.8xlarge</td><td>18.75 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>i4i.12xlarge</td><td>28.12 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>i4i.16xlarge</td><td>37.5 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>i4i.24xlarge</td><td>56.25 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>i4i.32xlarge</td><td>75 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>i4i.metal</td><td>75 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">I7i</td></tr>
  <tr><td>i7i.large 1</td><td>1.171 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>i7i.xlarge 1</td><td>2.343 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>i7i.2xlarge 1</td><td>4.687 / 12.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>i7i.4xlarge 1</td><td>9.375 / 25.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>i7i.8xlarge</td><td>25 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>i7i.12xlarge</td><td>28.12 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>i7i.16xlarge</td><td>37.5 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>i7i.24xlarge</td><td>56.25 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>i7i.48xlarge</td><td>100 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>i7i.metal-24xl</td><td>56.25 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>i7i.metal-48xl</td><td>100 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">I7ie</td></tr>
  <tr><td>i7ie.large 1</td><td>2.083 / 25.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>i7ie.xlarge 1</td><td>4.166 / 25.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>i7ie.2xlarge 1</td><td>8.333 / 25.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>i7ie.3xlarge 1</td><td>12.5 / 25.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>i7ie.6xlarge 1</td><td>12.5 / 25.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>i7ie.12xlarge 1</td><td>25.0 / 50.0</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>8</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>i7ie.18xlarge 1</td><td>37.5 / 75.0</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>i7ie.24xlarge 1</td><td>50.0 / 100.0</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>i7ie.48xlarge</td><td>100 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>i7ie.metal-24xl 1</td><td>50.0 / 100.0</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>i7ie.metal-48xl</td><td>100 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">I8g</td></tr>
  <tr><td>i8g.large 1</td><td>1.172 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>i8g.xlarge 1</td><td>2.344 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>i8g.2xlarge 1</td><td>4.688 / 12.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>i8g.4xlarge 1</td><td>9.375 / 25.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>i8g.8xlarge</td><td>25 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>i8g.12xlarge</td><td>28.12 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>i8g.16xlarge</td><td>37.5 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>i8g.24xlarge</td><td>56.25 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>i8g.48xlarge</td><td>100 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>i8g.metal-24xl</td><td>56.25 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>i8g.metal-48xl 1</td><td>90.0 / 100.0</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">I8ge</td></tr>
  <tr><td>i8ge.large 1</td><td>2.1 / 25.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>i8ge.xlarge 1</td><td>4.2 / 25.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>i8ge.2xlarge 1</td><td>8.4 / 25.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>i8ge.3xlarge 1</td><td>12.5 / 25.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>6</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>i8ge.6xlarge</td><td>37.5 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>10</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>i8ge.12xlarge</td><td>75 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>12</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>i8ge.18xlarge</td><td>112.5 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>16</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>i8ge.24xlarge</td><td>150 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>16</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>i8ge.48xlarge</td><td>180 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>24</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>i8ge.metal-24xl</td><td>150 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>16</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>i8ge.metal-48xl</td><td>180 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>24</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">Im4gn</td></tr>
  <tr><td>im4gn.large 1</td><td>3.125 / 25.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>im4gn.xlarge 1</td><td>6.25 / 25.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>im4gn.2xlarge 1</td><td>12.5 / 25.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>im4gn.4xlarge</td><td>25 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>im4gn.8xlarge</td><td>50 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>im4gn.16xlarge</td><td>100 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">Is4gen</td></tr>
  <tr><td>is4gen.medium 1</td><td>1.562 / 25.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>2</td><td>4</td><td>✓ Yes</td></tr>
  <tr><td>is4gen.large 1</td><td>3.125 / 25.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>is4gen.xlarge 1</td><td>6.25 / 25.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>is4gen.2xlarge 1</td><td>12.5 / 25.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>is4gen.4xlarge</td><td>25 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>is4gen.8xlarge</td><td>50 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
</tbody>
</table>


**Note**  
1 These instances have a baseline bandwidth and can use a network I/O credit mechanism to burst beyond their baseline bandwidth on a best effort basis. Other instances types can sustain their maximum performance indefinitely. For more information, see [ instance network bandwidth](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-instance-network-bandwidth.html).  
2 These instances support enhanced networking using the Intel 82599 VF interface.

## Amazon EBS specifications
<a name="so_storage-ebs"></a>

The following table indicates which instance types are Amazon EBS optimized by default and which optionally support it. It also describes their EBS-optimized performance, including dedicated bandwidth to Amazon EBS, the typical maximum aggregate throughput that can be achieved on that dedicated connection with a streaming read workload and 128 KiB I/O size, and the maximum IOPS the instance type can support when using a 16 KiB I/O size. Instance types not listed do not support Amazon EBS optimization.

**Important**  
An instance's EBS performance is bounded by the instance's performance limits, or the aggregated performance of its attached volumes, whichever is smaller. To achieve maximum EBS performance, an instance must have attached volumes that provide a combined performance equal to or greater than the maximum instance performance. For example, to achieve `80,000` IOPS for `r6i.16xlarge`, the instance must have at least `5` `gp3` volumes provisioned with `16,000` IOPS each (`5` volumes x `16,000` IOPS = `80,000` IOPS).  
We recommend that you choose an EBS–optimized instance type that provides more dedicated Amazon EBS throughput than your application needs; otherwise, the connection between Amazon EBS and Amazon EC2 can become a performance bottleneck.


<table>
<thead>
  <tr><th>Instance type</th><th>Baseline / Maximum bandwidth (Mbps)</th><th>Baseline / Maximum throughput (MB/s, 128 KiB I/O)</th><th>Baseline / Maximum IOPS (16 KiB I/O)</th><th>NVMe</th><th>Multiple EBS cards</th><th>EBS volume limit</th></tr>
</thead>
<tbody>
  <tr><td colspan="7">D2</td></tr>
  <tr><td>d2.xlarge</td><td>750.00</td><td>93.75</td><td>6000.00</td><td>✗ No</td><td>✗ No</td><td>Up to 40 ([Xen-based limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#xen-limits))</td></tr>
  <tr><td>d2.2xlarge</td><td>1000.00</td><td>125.00</td><td>8000.00</td><td>✗ No</td><td>✗ No</td><td>Up to 40 ([Xen-based limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#xen-limits))</td></tr>
  <tr><td>d2.4xlarge</td><td>2000.00</td><td>250.00</td><td>16000.00</td><td>✗ No</td><td>✗ No</td><td>Up to 40 ([Xen-based limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#xen-limits))</td></tr>
  <tr><td>d2.8xlarge</td><td>4000.00</td><td>500.00</td><td>32000.00</td><td>✗ No</td><td>✗ No</td><td>Up to 40 ([Xen-based limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#xen-limits))</td></tr>
  <tr><td colspan="7">D3</td></tr>
  <tr><td>d3.xlarge 1</td><td>850.00 / 2800.00</td><td>106.25 / 350.00</td><td>5000.00 / 15000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 24 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>d3.2xlarge 1</td><td>1700.00 / 2800.00</td><td>212.50 / 350.00</td><td>10000.00 / 15000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 21 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>d3.4xlarge</td><td>2800.00</td><td>350.00</td><td>15000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 15 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>d3.8xlarge</td><td>5000.00</td><td>625.00</td><td>30000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 3 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td colspan="7">D3en</td></tr>
  <tr><td>d3en.xlarge 1</td><td>850.00 / 2800.00</td><td>106.25 / 350.00</td><td>5000.00 / 15000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 25 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>d3en.2xlarge 1</td><td>1700.00 / 2800.00</td><td>212.50 / 350.00</td><td>10000.00 / 15000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 23 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>d3en.4xlarge</td><td>2800.00</td><td>350.00</td><td>15000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 19 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>d3en.6xlarge</td><td>4000.00</td><td>500.00</td><td>25000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 15 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>d3en.8xlarge</td><td>5000.00</td><td>625.00</td><td>30000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 11 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>d3en.12xlarge</td><td>7000.00</td><td>875.00</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 3 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td colspan="7">H1</td></tr>
  <tr><td>h1.2xlarge</td><td>1750.00</td><td>218.75</td><td>12000.00</td><td>✗ No</td><td>✗ No</td><td>Up to 40 ([Xen-based limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#xen-limits))</td></tr>
  <tr><td>h1.4xlarge</td><td>3500.00</td><td>437.50</td><td>20000.00</td><td>✗ No</td><td>✗ No</td><td>Up to 40 ([Xen-based limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#xen-limits))</td></tr>
  <tr><td>h1.8xlarge</td><td>7000.00</td><td>875.00</td><td>40000.00</td><td>✗ No</td><td>✗ No</td><td>Up to 40 ([Xen-based limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#xen-limits))</td></tr>
  <tr><td>h1.16xlarge</td><td>14000.00</td><td>1750.00</td><td>80000.00</td><td>✗ No</td><td>✗ No</td><td>Up to 40 ([Xen-based limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#xen-limits))</td></tr>
  <tr><td colspan="7">I3</td></tr>
  <tr><td>i3.large</td><td>425.00</td><td>53.12</td><td>3000.00</td><td>✗ No</td><td>✗ No</td><td>Up to 40 ([Xen-based limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#xen-limits))</td></tr>
  <tr><td>i3.xlarge</td><td>850.00</td><td>106.25</td><td>6000.00</td><td>✗ No</td><td>✗ No</td><td>Up to 40 ([Xen-based limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#xen-limits))</td></tr>
  <tr><td>i3.2xlarge</td><td>1700.00</td><td>212.50</td><td>12000.00</td><td>✗ No</td><td>✗ No</td><td>Up to 40 ([Xen-based limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#xen-limits))</td></tr>
  <tr><td>i3.4xlarge</td><td>3500.00</td><td>437.50</td><td>16000.00</td><td>✗ No</td><td>✗ No</td><td>Up to 40 ([Xen-based limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#xen-limits))</td></tr>
  <tr><td>i3.8xlarge</td><td>7000.00</td><td>875.00</td><td>32500.00</td><td>✗ No</td><td>✗ No</td><td>Up to 40 ([Xen-based limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#xen-limits))</td></tr>
  <tr><td>i3.16xlarge</td><td>14000.00</td><td>1750.00</td><td>65000.00</td><td>✗ No</td><td>✗ No</td><td>Up to 40 ([Xen-based limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#xen-limits))</td></tr>
  <tr><td>i3.metal</td><td>19000.00</td><td>2375.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 31 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td colspan="7">I3en</td></tr>
  <tr><td>i3en.large 1</td><td>576.00 / 4750.00</td><td>72.10 / 593.75</td><td>3000.00 / 20000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>i3en.xlarge 1</td><td>1153.00 / 4750.00</td><td>144.20 / 593.75</td><td>6000.00 / 20000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>i3en.2xlarge 1</td><td>2307.00 / 4750.00</td><td>288.39 / 593.75</td><td>12000.00 / 20000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 25 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>i3en.3xlarge 1</td><td>3800.00 / 4750.00</td><td>475.00 / 593.75</td><td>15000.00 / 20000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>i3en.6xlarge</td><td>4750.00</td><td>593.75</td><td>20000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 25 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>i3en.12xlarge</td><td>9500.00</td><td>1187.50</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 23 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>i3en.24xlarge</td><td>19000.00</td><td>2375.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 19 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>i3en.metal</td><td>19000.00</td><td>2375.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 31 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td colspan="7">I4g</td></tr>
  <tr><td>i4g.large 1</td><td>625.00 / 10000.00</td><td>78.12 / 1250.00</td><td>2500.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>i4g.xlarge 1</td><td>1250.00 / 10000.00</td><td>156.25 / 1250.00</td><td>5000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>i4g.2xlarge 1</td><td>2500.00 / 10000.00</td><td>312.50 / 1250.00</td><td>10000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>i4g.4xlarge 1</td><td>5000.00 / 10000.00</td><td>625.00 / 1250.00</td><td>20000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>i4g.8xlarge</td><td>10000.00</td><td>1250.00</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 25 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>i4g.16xlarge</td><td>20000.00</td><td>2500.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 23 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td colspan="7">I4i</td></tr>
  <tr><td>i4i.large 1</td><td>625.00 / 10000.00</td><td>78.12 / 1250.00</td><td>2500.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>i4i.xlarge 1</td><td>1250.00 / 10000.00</td><td>156.25 / 1250.00</td><td>5000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>i4i.2xlarge 1</td><td>2500.00 / 10000.00</td><td>312.50 / 1250.00</td><td>10000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>i4i.4xlarge 1</td><td>5000.00 / 10000.00</td><td>625.00 / 1250.00</td><td>20000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>i4i.8xlarge</td><td>10000.00</td><td>1250.00</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 25 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>i4i.12xlarge</td><td>15000.00</td><td>1875.00</td><td>60000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 24 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>i4i.16xlarge</td><td>20000.00</td><td>2500.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 23 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>i4i.24xlarge</td><td>30000.00</td><td>3750.00</td><td>120000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 21 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>i4i.32xlarge</td><td>40000.00</td><td>5000.00</td><td>160000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 19 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>i4i.metal</td><td>40000.00</td><td>5000.00</td><td>160000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 31 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td colspan="7">I7i</td></tr>
  <tr><td>i7i.large 1</td><td>625.00 / 10000.00</td><td>78.12 / 1250.00</td><td>2500.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>i7i.xlarge 1</td><td>1250.00 / 10000.00</td><td>156.25 / 1250.00</td><td>5000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>i7i.2xlarge 1</td><td>2500.00 / 10000.00</td><td>312.50 / 1250.00</td><td>10000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>i7i.4xlarge 1</td><td>5000.00 / 10000.00</td><td>625.00 / 1250.00</td><td>20000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>i7i.8xlarge</td><td>10000.00</td><td>1250.00</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>i7i.12xlarge</td><td>15000.00</td><td>1875.00</td><td>60000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>i7i.16xlarge</td><td>20000.00</td><td>2500.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>48 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>i7i.24xlarge</td><td>30000.00</td><td>3750.00</td><td>120000.00</td><td>✓ Yes</td><td>✗ No</td><td>64 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>i7i.48xlarge</td><td>60000.00</td><td>7500.00</td><td>240000.00</td><td>✓ Yes</td><td>✗ No</td><td>128 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>i7i.metal-24xl</td><td>30000.00</td><td>3750.00</td><td>120000.00</td><td>✓ Yes</td><td>✗ No</td><td>39 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>i7i.metal-48xl</td><td>60000.00</td><td>7500.00</td><td>240000.00</td><td>✓ Yes</td><td>✗ No</td><td>79 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td colspan="7">I7ie</td></tr>
  <tr><td>i7ie.large 1</td><td>625.00 / 10000.00</td><td>78.12 / 1250.00</td><td>2500.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>i7ie.xlarge 1</td><td>1250.00 / 10000.00</td><td>156.25 / 1250.00</td><td>5000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>i7ie.2xlarge 1</td><td>2500.00 / 10000.00</td><td>312.50 / 1250.00</td><td>10000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>i7ie.3xlarge 1</td><td>3750.00 / 10000.00</td><td>468.75 / 1250.00</td><td>15000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>i7ie.6xlarge 1</td><td>7500.00 / 10000.00</td><td>937.50 / 1250.00</td><td>30000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>i7ie.12xlarge</td><td>15000.00</td><td>1875.00</td><td>60000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>i7ie.18xlarge</td><td>22500.00</td><td>2812.50</td><td>90000.00</td><td>✓ Yes</td><td>✗ No</td><td>48 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>i7ie.24xlarge</td><td>30000.00</td><td>3750.00</td><td>120000.00</td><td>✓ Yes</td><td>✗ No</td><td>64 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>i7ie.48xlarge</td><td>60000.00</td><td>7500.00</td><td>240000.00</td><td>✓ Yes</td><td>✗ No</td><td>128 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>i7ie.metal-24xl</td><td>30000.00</td><td>3750.00</td><td>120000.00</td><td>✓ Yes</td><td>✗ No</td><td>39 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>i7ie.metal-48xl</td><td>60000.00</td><td>7500.00</td><td>240000.00</td><td>✓ Yes</td><td>✗ No</td><td>79 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td colspan="7">I8g</td></tr>
  <tr><td>i8g.large 1</td><td>625.00 / 10000.00</td><td>78.12 / 1250.00</td><td>2500.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>i8g.xlarge 1</td><td>1250.00 / 10000.00</td><td>156.25 / 1250.00</td><td>5000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>i8g.2xlarge 1</td><td>2500.00 / 10000.00</td><td>312.50 / 1250.00</td><td>10000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>i8g.4xlarge 1</td><td>5000.00 / 10000.00</td><td>625.00 / 1250.00</td><td>20000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>i8g.8xlarge</td><td>10000.00</td><td>1250.00</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>i8g.12xlarge</td><td>15000.00</td><td>1875.00</td><td>60000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>i8g.16xlarge</td><td>20000.00</td><td>2500.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>48 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>i8g.24xlarge</td><td>30000.00</td><td>3750.00</td><td>120000.00</td><td>✓ Yes</td><td>✗ No</td><td>64 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>i8g.48xlarge</td><td>60000.00</td><td>7500.00</td><td>240000.00</td><td>✓ Yes</td><td>✗ No</td><td>128 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>i8g.metal-24xl</td><td>30000.00</td><td>3750.00</td><td>120000.00</td><td>✓ Yes</td><td>✗ No</td><td>39 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>i8g.metal-48xl</td><td>60000.00</td><td>7500.00</td><td>240000.00</td><td>✓ Yes</td><td>✗ No</td><td>79 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td colspan="7">I8ge</td></tr>
  <tr><td>i8ge.large 1</td><td>625.00 / 10000.00</td><td>78.12 / 1250.00</td><td>2500.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>i8ge.xlarge 1</td><td>1250.00 / 10000.00</td><td>156.25 / 1250.00</td><td>5000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>i8ge.2xlarge 1</td><td>2500.00 / 10000.00</td><td>312.50 / 1250.00</td><td>10000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>i8ge.3xlarge 1</td><td>3750.00 / 10000.00</td><td>468.75 / 1250.00</td><td>15000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>i8ge.6xlarge 1</td><td>7500.00 / 10000.00</td><td>937.50 / 1250.00</td><td>30000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>i8ge.12xlarge</td><td>15000.00</td><td>1875.00</td><td>60000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>i8ge.18xlarge</td><td>22500.00</td><td>2812.50</td><td>90000.00</td><td>✓ Yes</td><td>✗ No</td><td>48 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>i8ge.24xlarge</td><td>30000.00</td><td>3750.00</td><td>120000.00</td><td>✓ Yes</td><td>✗ No</td><td>64 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>i8ge.48xlarge</td><td>60000.00</td><td>7500.00</td><td>240000.00</td><td>✓ Yes</td><td>✗ No</td><td>128 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>i8ge.metal-24xl</td><td>30000.00</td><td>3750.00</td><td>120000.00</td><td>✓ Yes</td><td>✗ No</td><td>39 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>i8ge.metal-48xl</td><td>60000.00</td><td>7500.00</td><td>240000.00</td><td>✓ Yes</td><td>✗ No</td><td>79 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td colspan="7">Im4gn</td></tr>
  <tr><td>im4gn.large 1</td><td>1250.00 / 10000.00</td><td>156.25 / 1250.00</td><td>5000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>im4gn.xlarge 1</td><td>2500.00 / 10000.00</td><td>312.50 / 1250.00</td><td>10000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>im4gn.2xlarge 1</td><td>5000.00 / 10000.00</td><td>625.00 / 1250.00</td><td>20000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>im4gn.4xlarge</td><td>10000.00</td><td>1250.00</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>im4gn.8xlarge</td><td>20000.00</td><td>2500.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 25 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>im4gn.16xlarge</td><td>40000.00</td><td>5000.00</td><td>160000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 23 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td colspan="7">Is4gen</td></tr>
  <tr><td>is4gen.medium 1</td><td>625.00 / 10000.00</td><td>78.12 / 1250.00</td><td>2500.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>is4gen.large 1</td><td>1250.00 / 10000.00</td><td>156.25 / 1250.00</td><td>5000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>is4gen.xlarge 1</td><td>2500.00 / 10000.00</td><td>312.50 / 1250.00</td><td>10000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>is4gen.2xlarge 1</td><td>5000.00 / 10000.00</td><td>625.00 / 1250.00</td><td>20000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>is4gen.4xlarge</td><td>10000.00</td><td>1250.00</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 25 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>is4gen.8xlarge</td><td>20000.00</td><td>2500.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 23 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
</tbody>
</table>


**Note**  
1 These instances can support maximum performance for 30 minutes at least once every 24 hours, after which they revert to their baseline performance. Other instances can sustain the maximum performance indefinitely. If your workload requires sustained maximum performance for longer than 30 minutes, use one of these instances.

## Instance store specifications
<a name="so_instance-store"></a>

The following table shows the instance store volume configuration for supported instance types, along with the aggregated IOPS performance with 4,096 byte block size at queue depth saturation. 


<table>
<thead>
  <tr><th>Instance type</th><th>Instance store volumes</th><th>Instance store type</th><th>100% random read IOPS / Write IOPS</th><th>Needs initialization 1</th><th>TRIM support 2</th></tr>
</thead>
<tbody>
  <tr><td colspan="6">D2</td></tr>
  <tr><td>d2.xlarge</td><td>3 x 2048 GB</td><td>HDD</td><td></td><td>✓ Yes</td><td> </td></tr>
  <tr><td>d2.2xlarge</td><td>6 x 2048 GB</td><td>HDD</td><td></td><td>✓ Yes</td><td> </td></tr>
  <tr><td>d2.4xlarge</td><td>12 x 2048 GB</td><td>HDD</td><td></td><td>✓ Yes</td><td> </td></tr>
  <tr><td>d2.8xlarge</td><td>24 x 2048 GB</td><td>HDD</td><td></td><td>✓ Yes</td><td> </td></tr>
  <tr><td colspan="6">D3</td></tr>
  <tr><td>d3.xlarge</td><td>3 x 1980 GB</td><td>NVMe HDD</td><td></td><td> </td><td>✓ Yes</td></tr>
  <tr><td>d3.2xlarge</td><td>6 x 1980 GB</td><td>NVMe HDD</td><td></td><td> </td><td>✓ Yes</td></tr>
  <tr><td>d3.4xlarge</td><td>12 x 1980 GB</td><td>NVMe HDD</td><td></td><td> </td><td>✓ Yes</td></tr>
  <tr><td>d3.8xlarge</td><td>24 x 1980 GB</td><td>NVMe HDD</td><td></td><td> </td><td>✓ Yes</td></tr>
  <tr><td colspan="6">D3en</td></tr>
  <tr><td>d3en.xlarge</td><td>2 x 13980 GB</td><td>NVMe HDD</td><td></td><td> </td><td>✓ Yes</td></tr>
  <tr><td>d3en.2xlarge</td><td>4 x 13980 GB</td><td>NVMe HDD</td><td></td><td> </td><td>✓ Yes</td></tr>
  <tr><td>d3en.4xlarge</td><td>8 x 13980 GB</td><td>NVMe HDD</td><td></td><td> </td><td>✓ Yes</td></tr>
  <tr><td>d3en.6xlarge</td><td>12 x 13980 GB</td><td>NVMe HDD</td><td></td><td> </td><td>✓ Yes</td></tr>
  <tr><td>d3en.8xlarge</td><td>16 x 13980 GB</td><td>NVMe HDD</td><td></td><td> </td><td>✓ Yes</td></tr>
  <tr><td>d3en.12xlarge</td><td>24 x 13980 GB</td><td>NVMe HDD</td><td></td><td> </td><td>✓ Yes</td></tr>
  <tr><td colspan="6">H1</td></tr>
  <tr><td>h1.2xlarge</td><td>1 x 2000 GB</td><td>HDD</td><td></td><td>✓ Yes</td><td> </td></tr>
  <tr><td>h1.4xlarge</td><td>2 x 2000 GB</td><td>HDD</td><td></td><td>✓ Yes</td><td> </td></tr>
  <tr><td>h1.8xlarge</td><td>4 x 2000 GB</td><td>HDD</td><td></td><td>✓ Yes</td><td> </td></tr>
  <tr><td>h1.16xlarge</td><td>8 x 2000 GB</td><td>HDD</td><td></td><td>✓ Yes</td><td> </td></tr>
  <tr><td colspan="6">I3</td></tr>
  <tr><td>i3.large</td><td>1 x 475 GB</td><td>NVMe SSD</td><td>103,125 / 35,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>i3.xlarge</td><td>1 x 950 GB</td><td>NVMe SSD</td><td>206,250 / 70,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>i3.2xlarge</td><td>1 x 1900 GB</td><td>NVMe SSD</td><td>412,500 / 180,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>i3.4xlarge</td><td>2 x 1900 GB</td><td>NVMe SSD</td><td>825,000 / 360,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>i3.8xlarge</td><td>4 x 1900 GB</td><td>NVMe SSD</td><td>1,650,000 / 720,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>i3.16xlarge</td><td>8 x 1900 GB</td><td>NVMe SSD</td><td>3,300,000 / 1,440,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>i3.metal</td><td>8 x 1900 GB</td><td>NVMe SSD</td><td>3,300,000 / 1,440,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td colspan="6">I3en</td></tr>
  <tr><td>i3en.large</td><td>1 x 1250 GB</td><td>NVMe SSD</td><td>42,500 / 32,500</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>i3en.xlarge</td><td>1 x 2500 GB</td><td>NVMe SSD</td><td>85,000 / 65,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>i3en.2xlarge</td><td>2 x 2500 GB</td><td>NVMe SSD</td><td>170,000 / 130,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>i3en.3xlarge</td><td>1 x 7500 GB</td><td>NVMe SSD</td><td>250,000 / 200,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>i3en.6xlarge</td><td>2 x 7500 GB</td><td>NVMe SSD</td><td>500,000 / 400,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>i3en.12xlarge</td><td>4 x 7500 GB</td><td>NVMe SSD</td><td>1,000,000 / 800,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>i3en.24xlarge</td><td>8 x 7500 GB</td><td>NVMe SSD</td><td>2,000,000 / 1,600,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>i3en.metal</td><td>8 x 7500 GB</td><td>NVMe SSD</td><td>2,000,000 / 1,600,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td colspan="6">I4g</td></tr>
  <tr><td>i4g.large</td><td>1 x 468 GB</td><td>NVMe SSD</td><td>31,250 / 25,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>i4g.xlarge</td><td>1 x 937 GB</td><td>NVMe SSD</td><td>62,500 / 50,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>i4g.2xlarge</td><td>1 x 1875 GB</td><td>NVMe SSD</td><td>125,000 / 100,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>i4g.4xlarge</td><td>1 x 3750 GB</td><td>NVMe SSD</td><td>250,000 / 200,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>i4g.8xlarge</td><td>2 x 3750 GB</td><td>NVMe SSD</td><td>500,000 / 400,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>i4g.16xlarge</td><td>4 x 3750 GB</td><td>NVMe SSD</td><td>1,000,000 / 800,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td colspan="6">I4i</td></tr>
  <tr><td>i4i.large</td><td>1 x 468 GB</td><td>NVMe SSD</td><td>50,000 / 27,500</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>i4i.xlarge</td><td>1 x 937 GB</td><td>NVMe SSD</td><td>100,000 / 55,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>i4i.2xlarge</td><td>1 x 1875 GB</td><td>NVMe SSD</td><td>200,000 / 110,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>i4i.4xlarge</td><td>1 x 3750 GB</td><td>NVMe SSD</td><td>400,000 / 220,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>i4i.8xlarge</td><td>2 x 3750 GB</td><td>NVMe SSD</td><td>800,000 / 440,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>i4i.12xlarge</td><td>3 x 3750 GB</td><td>NVMe SSD</td><td>1,200,000 / 660,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>i4i.16xlarge</td><td>4 x 3750 GB</td><td>NVMe SSD</td><td>1,600,000 / 880,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>i4i.24xlarge</td><td>6 x 3750 GB</td><td>NVMe SSD</td><td>2,400,000 / 1,320,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>i4i.32xlarge</td><td>8 x 3750 GB</td><td>NVMe SSD</td><td>3,200,000 / 1,760,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>i4i.metal</td><td>8 x 3750 GB</td><td>NVMe SSD</td><td>3,200,000 / 1,760,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td colspan="6">I7i</td></tr>
  <tr><td>i7i.large</td><td>1 x 468 GB</td><td>NVMe SSD</td><td>75,000 / 41,250</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>i7i.xlarge</td><td>1 x 937 GB</td><td>NVMe SSD</td><td>150,000 / 82,500</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>i7i.2xlarge</td><td>1 x 1875 GB</td><td>NVMe SSD</td><td>300,000 / 165,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>i7i.4xlarge</td><td>1 x 3750 GB</td><td>NVMe SSD</td><td>600,000 / 330,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>i7i.8xlarge</td><td>2 x 3750 GB</td><td>NVMe SSD</td><td>1,200,000 / 660,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>i7i.12xlarge</td><td>3 x 3750 GB</td><td>NVMe SSD</td><td>1,800,000 / 990,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>i7i.16xlarge</td><td>4 x 3750 GB</td><td>NVMe SSD</td><td>2,400,000 / 1,320,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>i7i.24xlarge</td><td>6 x 3750 GB</td><td>NVMe SSD</td><td>3,600,000 / 1,980,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>i7i.48xlarge</td><td>12 x 3750 GB</td><td>NVMe SSD</td><td>7,200,000 / 3,960,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>i7i.metal-24xl</td><td>6 x 3750 GB</td><td>NVMe SSD</td><td>3,600,000 / 1,980,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>i7i.metal-48xl</td><td>12 x 3750 GB</td><td>NVMe SSD</td><td>7,200,000 / 3,960,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td colspan="6">I7ie</td></tr>
  <tr><td>i7ie.large</td><td>1 x 1250 GB</td><td>NVMe SSD</td><td>54,166 / 43,333</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>i7ie.xlarge</td><td>1 x 2500 GB</td><td>NVMe SSD</td><td>108,333 / 86,666</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>i7ie.2xlarge</td><td>2 x 2500 GB</td><td>NVMe SSD</td><td>216,666 / 173,332</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>i7ie.3xlarge</td><td>1 x 7500 GB</td><td>NVMe SSD</td><td>325,000 / 260,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>i7ie.6xlarge</td><td>2 x 7500 GB</td><td>NVMe SSD</td><td>650,000 / 520,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>i7ie.12xlarge</td><td>4 x 7500 GB</td><td>NVMe SSD</td><td>1,300,000 / 1,040,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>i7ie.18xlarge</td><td>6 x 7500 GB</td><td>NVMe SSD</td><td>1,950,000 / 1,560,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>i7ie.24xlarge</td><td>8 x 7500 GB</td><td>NVMe SSD</td><td>2,600,000 / 2,080,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>i7ie.48xlarge</td><td>16 x 7500 GB</td><td>NVMe SSD</td><td>5,200,000 / 4,160,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>i7ie.metal-24xl</td><td>8 x 7500 GB</td><td>NVMe SSD</td><td>2,600,000 / 2,080,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>i7ie.metal-48xl</td><td>16 x 7500 GB</td><td>NVMe SSD</td><td>5,200,000 / 4,160,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td colspan="6">I8g</td></tr>
  <tr><td>i8g.large</td><td>1 x 468 GB</td><td>NVMe SSD</td><td>75,000 / 41,250</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>i8g.xlarge</td><td>1 x 937 GB</td><td>NVMe SSD</td><td>150,000 / 82,500</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>i8g.2xlarge</td><td>1 x 1875 GB</td><td>NVMe SSD</td><td>300,000 / 165,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>i8g.4xlarge</td><td>1 x 3750 GB</td><td>NVMe SSD</td><td>600,000 / 330,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>i8g.8xlarge</td><td>2 x 3750 GB</td><td>NVMe SSD</td><td>1,200,000 / 660,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>i8g.12xlarge</td><td>3 x 3750 GB</td><td>NVMe SSD</td><td>1,800,000 / 990,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>i8g.16xlarge</td><td>4 x 3750 GB</td><td>NVMe SSD</td><td>2,400,000 / 1,320,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>i8g.24xlarge</td><td>6 x 3750 GB</td><td>NVMe SSD</td><td>3,600,000 / 1,980,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>i8g.48xlarge</td><td>12 x 3750 GB</td><td>NVMe SSD</td><td>7,200,000 / 3,960,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>i8g.metal-24xl</td><td>6 x 3750 GB</td><td>NVMe SSD</td><td>3,600,000 / 1,980,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>i8g.metal-48xl</td><td>12 x 3750 GB</td><td>NVMe SSD</td><td>7,200,000 / 3,960,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td colspan="6">I8ge</td></tr>
  <tr><td>i8ge.large</td><td>1 x 1250 GB</td><td>NVMe SSD</td><td>54,166 / 43,333</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>i8ge.xlarge</td><td>1 x 2500 GB</td><td>NVMe SSD</td><td>108,333 / 86,666</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>i8ge.2xlarge</td><td>2 x 2500 GB</td><td>NVMe SSD</td><td>216,666 / 173,332</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>i8ge.3xlarge</td><td>1 x 7500 GB</td><td>NVMe SSD</td><td>325,000 / 260,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>i8ge.6xlarge</td><td>2 x 7500 GB</td><td>NVMe SSD</td><td>650,000 / 520,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>i8ge.12xlarge</td><td>4 x 7500 GB</td><td>NVMe SSD</td><td>1,300,000 / 1,040,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>i8ge.18xlarge</td><td>6 x 7500 GB</td><td>NVMe SSD</td><td>1,950,000 / 1,560,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>i8ge.24xlarge</td><td>8 x 7500 GB</td><td>NVMe SSD</td><td>2,600,000 / 2,080,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>i8ge.48xlarge</td><td>16 x 7500 GB</td><td>NVMe SSD</td><td>5,200,000 / 4,160,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>i8ge.metal-24xl</td><td>8 x 7500 GB</td><td>NVMe SSD</td><td>2,600,000 / 2,080,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>i8ge.metal-48xl</td><td>16 x 7500 GB</td><td>NVMe SSD</td><td>5,200,000 / 4,160,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td colspan="6">Im4gn</td></tr>
  <tr><td>im4gn.large</td><td>1 x 937 GB</td><td>NVMe SSD</td><td>31,250 / 25,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>im4gn.xlarge</td><td>1 x 1875 GB</td><td>NVMe SSD</td><td>62,500 / 50,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>im4gn.2xlarge</td><td>1 x 3750 GB</td><td>NVMe SSD</td><td>125,000 / 100,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>im4gn.4xlarge</td><td>1 x 7500 GB</td><td>NVMe SSD</td><td>250,000 / 200,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>im4gn.8xlarge</td><td>2 x 7500 GB</td><td>NVMe SSD</td><td>500,000 / 400,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>im4gn.16xlarge</td><td>4 x 7500 GB</td><td>NVMe SSD</td><td>1,000,000 / 800,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td colspan="6">Is4gen</td></tr>
  <tr><td>is4gen.medium</td><td>1 x 937 GB</td><td>NVMe SSD</td><td>31,250 / 25,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>is4gen.large</td><td>1 x 1875 GB</td><td>NVMe SSD</td><td>62,500 / 50,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>is4gen.xlarge</td><td>1 x 3750 GB</td><td>NVMe SSD</td><td>125,000 / 100,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>is4gen.2xlarge</td><td>1 x 7500 GB</td><td>NVMe SSD</td><td>250,000 / 200,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>is4gen.4xlarge</td><td>2 x 7500 GB</td><td>NVMe SSD</td><td>500,000 / 400,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>is4gen.8xlarge</td><td>4 x 7500 GB</td><td>NVMe SSD</td><td>1,000,000 / 800,000</td><td> </td><td>✓ Yes</td></tr>
</tbody>
</table>


1 Volumes attached to certain instances suffer a first-write penalty unless initialized. For more information, see [Optimize disk performance for instance store volumes](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/disk-performance.html).

2 For more information, see [Instance store volume TRIM support](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ssd-instance-store.html#InstanceStoreTrimSupport).

## Security specifications
<a name="so_security"></a>


<table>
<thead>
  <tr><th>Instance type</th><th>EBS encryption</th><th>Instance store encryption</th><th>Encryption in transit</th><th>AMD SEV-SNP</th><th>NitroTPM</th><th>Nitro Enclaves</th></tr>
</thead>
<tbody>
  <tr><td colspan="7">D2</td></tr>
  <tr><td>d2.xlarge</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>d2.2xlarge</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>d2.4xlarge</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>d2.8xlarge</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">D3</td></tr>
  <tr><td>d3.xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>d3.2xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>d3.4xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>d3.8xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td colspan="7">D3en</td></tr>
  <tr><td>d3en.xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>d3en.2xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>d3en.4xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>d3en.6xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>d3en.8xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>d3en.12xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td colspan="7">H1</td></tr>
  <tr><td>h1.2xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>h1.4xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>h1.8xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>h1.16xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">I3</td></tr>
  <tr><td>i3.large</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>i3.xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>i3.2xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>i3.4xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>i3.8xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>i3.16xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>i3.metal</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">I3en</td></tr>
  <tr><td>i3en.large</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>i3en.xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>i3en.2xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>i3en.3xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>i3en.6xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>i3en.12xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>i3en.24xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>i3en.metal</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">I4g</td></tr>
  <tr><td>i4g.large</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td></tr>
  <tr><td>i4g.xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td></tr>
  <tr><td>i4g.2xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td></tr>
  <tr><td>i4g.4xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td></tr>
  <tr><td>i4g.8xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td></tr>
  <tr><td>i4g.16xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td></tr>
  <tr><td colspan="7">I4i</td></tr>
  <tr><td>i4i.large</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>i4i.xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>i4i.2xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>i4i.4xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>i4i.8xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>i4i.12xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>i4i.16xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>i4i.24xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>i4i.32xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>i4i.metal</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">I7i</td></tr>
  <tr><td>i7i.large</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>i7i.xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>i7i.2xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>i7i.4xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>i7i.8xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>i7i.12xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>i7i.16xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>i7i.24xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>i7i.48xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>i7i.metal-24xl</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>i7i.metal-48xl</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">I7ie</td></tr>
  <tr><td>i7ie.large</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>i7ie.xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>i7ie.2xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>i7ie.3xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>i7ie.6xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>i7ie.12xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>i7ie.18xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>i7ie.24xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>i7ie.48xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>i7ie.metal-24xl</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>i7ie.metal-48xl</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">I8g</td></tr>
  <tr><td>i8g.large</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>i8g.xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>i8g.2xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>i8g.4xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>i8g.8xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>i8g.12xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>i8g.16xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>i8g.24xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>i8g.48xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>i8g.metal-24xl</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>i8g.metal-48xl</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">I8ge</td></tr>
  <tr><td>i8ge.large</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>i8ge.xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>i8ge.2xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>i8ge.3xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>i8ge.6xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>i8ge.12xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>i8ge.18xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>i8ge.24xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>i8ge.48xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>i8ge.metal-24xl</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>i8ge.metal-48xl</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">Im4gn</td></tr>
  <tr><td>im4gn.large</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>im4gn.xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>im4gn.2xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>im4gn.4xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>im4gn.8xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>im4gn.16xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td colspan="7">Is4gen</td></tr>
  <tr><td>is4gen.medium</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>is4gen.large</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>is4gen.xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>is4gen.2xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>is4gen.4xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>is4gen.8xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
</tbody>
</table>
