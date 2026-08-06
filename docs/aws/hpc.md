

# Specifications for Amazon EC2 high-performance computing instances
<a name="hpc"></a>

High-performance computing instances are purpose built to offer the best price performance for running HPC workloads at scale on AWS. These instances are ideal for applications that benefit from high-performance processors, such as large, complex simulations and deep learning workloads.

**Topics**
+ [Instance families and instance types](#hpc_sizes)
+ [Instance family summary](#hpc_summary)
+ [Performance specifications](#hpc_hardware)
+ [Network specifications](#hpc_network)
+ [Amazon EBS specifications](#hpc_storage-ebs)
+ [Instance store specifications](#hpc_instance-store)
+ [Security specifications](#hpc_security)

**Pricing**  
For pricing information, see [Amazon EC2 On-Demand Pricing](https://aws.amazon.com/ec2/pricing/on-demand/).

## Instance families and instance types
<a name="hpc_sizes"></a>


| Instance family | Available instance types | 
| --- | --- | 
| Hpc6a | hpc6a.48xlarge | 
| Hpc6id | hpc6id.32xlarge | 
| Hpc7a | hpc7a.12xlarge \| hpc7a.24xlarge \| hpc7a.48xlarge \| hpc7a.96xlarge | 
| Hpc7g | hpc7g.4xlarge \| hpc7g.8xlarge \| hpc7g.16xlarge | 
| Hpc8a | hpc8a.96xlarge | 

## Instance family summary
<a name="hpc_summary"></a>


| Instance family | Hypervisor | Processor type (architecture) | Metal instances available | Dedicated Hosts support | Spot support | Hibernation support | Supported operating systems | 
| --- | --- | --- | --- | --- | --- | --- | --- | 
| Hpc6a | [Nitro v4](ec2-nitro-instances.md) | AMD (x86\_64) | ✗ No | ✗ No | ✗ No | ✗ No | Linux | 
| Hpc6id | [Nitro v4](ec2-nitro-instances.md) | Intel (x86\_64) | ✗ No | ✗ No | ✗ No | ✗ No | Windows \| Linux | 
| Hpc7a | [Nitro v4](ec2-nitro-instances.md) | AMD (x86\_64) | ✗ No | ✗ No | ✗ No | ✗ No | Windows \| Linux | 
| Hpc7g | [Nitro v5](ec2-nitro-instances.md) | AWS Graviton (arm64) | ✗ No | ✗ No | ✗ No | ✗ No | Linux | 
| Hpc8a | [Nitro v6](ec2-nitro-instances.md) | AMD (x86\_64) | ✗ No | ✗ No | ✗ No | ✗ No | Windows \| Linux | 

## Performance specifications
<a name="hpc_hardware"></a>


<table>
<thead>
  <tr><th>Instance type</th><th>Memory (GiB)</th><th>Processor</th><th>vCPUs</th><th>CPU cores</th><th>Threads per core</th><th>Accelerators</th><th>Accelerator memory</th></tr>
</thead>
<tbody>
  <tr><td colspan="8">Hpc6a</td></tr>
  <tr><td>hpc6a.48xlarge</td><td>384.00</td><td>AMD EPYC 7R13</td><td>96</td><td>96</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">Hpc6id</td></tr>
  <tr><td>hpc6id.32xlarge</td><td>1024.00</td><td>Intel Xeon Ice Lake</td><td>64</td><td>64</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">Hpc7a</td></tr>
  <tr><td>hpc7a.12xlarge</td><td>768.00</td><td>AMD EPYC 9R14</td><td>24</td><td>24</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>hpc7a.24xlarge</td><td>768.00</td><td>AMD EPYC 9R14</td><td>48</td><td>48</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>hpc7a.48xlarge</td><td>768.00</td><td>AMD EPYC 9R14</td><td>96</td><td>96</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>hpc7a.96xlarge</td><td>768.00</td><td>AMD EPYC 9R14</td><td>192</td><td>192</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">Hpc7g</td></tr>
  <tr><td>hpc7g.4xlarge</td><td>128.00</td><td>AWS Graviton3E Processor</td><td>16</td><td>16</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>hpc7g.8xlarge</td><td>128.00</td><td>AWS Graviton3E Processor</td><td>32</td><td>32</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>hpc7g.16xlarge</td><td>128.00</td><td>AWS Graviton3E Processor</td><td>64</td><td>64</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">Hpc8a</td></tr>
  <tr><td>hpc8a.96xlarge</td><td>768.00</td><td>AMD EPYC 9R45</td><td>192</td><td>192</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
</tbody>
</table>


## Network specifications
<a name="hpc_network"></a>


<table>
<thead>
  <tr><th>Instance type</th><th>Baseline / Burst bandwidth (Gbps)</th><th>EFA</th><th>ENA</th><th>ENA Express</th><th>Network cards</th><th>Max. network interfaces</th><th>IP addresses per interface</th><th>IPv6</th></tr>
</thead>
<tbody>
  <tr><td colspan="9">Hpc6a</td></tr>
  <tr><td>hpc6a.48xlarge</td><td>100 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>2</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">Hpc6id</td></tr>
  <tr><td>hpc6id.32xlarge</td><td>200 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>2</td><td>2</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">Hpc7a</td></tr>
  <tr><td>hpc7a.12xlarge</td><td>300 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>2</td><td>4</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>hpc7a.24xlarge</td><td>300 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>2</td><td>4</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>hpc7a.48xlarge</td><td>300 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>2</td><td>4</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>hpc7a.96xlarge</td><td>300 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>2</td><td>4</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">Hpc7g</td></tr>
  <tr><td>hpc7g.4xlarge</td><td>200 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>hpc7g.8xlarge</td><td>200 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>hpc7g.16xlarge</td><td>200 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">Hpc8a</td></tr>
  <tr><td>hpc8a.96xlarge</td><td>300 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>2</td><td>4</td><td>50</td><td>✓ Yes</td></tr>
</tbody>
</table>


**Note**  
For `hpc6id.32xlarge`, you must attach at least 2 ENIs, to separate network cards, to achieve 200 Gbps throughput. Each ENI attached to a network card can achieve up to 170 Gbps.  
For `hpc7a.12xlarge`, `hpc7a.24xlarge`, `hpc7a.48xlarge`, `hpc7a.96xlarge`, you must attach at least 2 ENIs, to separate network cards, to achieve 300 Gbps throughput. Each ENI attached to a network card can achieve up to 150 Gbps.

## Amazon EBS specifications
<a name="hpc_storage-ebs"></a>

The following table indicates which instance types are Amazon EBS optimized by default and which optionally support it. It also describes their EBS-optimized performance, including dedicated bandwidth to Amazon EBS, the typical maximum aggregate throughput that can be achieved on that dedicated connection with a streaming read workload and 128 KiB I/O size, and the maximum IOPS the instance type can support when using a 16 KiB I/O size. Instance types not listed do not support Amazon EBS optimization.

**Important**  
An instance's EBS performance is bounded by the instance's performance limits, or the aggregated performance of its attached volumes, whichever is smaller. To achieve maximum EBS performance, an instance must have attached volumes that provide a combined performance equal to or greater than the maximum instance performance. For example, to achieve `80,000` IOPS for `r6i.16xlarge`, the instance must have at least `5` `gp3` volumes provisioned with `16,000` IOPS each (`5` volumes x `16,000` IOPS = `80,000` IOPS).  
We recommend that you choose an EBS–optimized instance type that provides more dedicated Amazon EBS throughput than your application needs; otherwise, the connection between Amazon EBS and Amazon EC2 can become a performance bottleneck.


<table>
<thead>
  <tr><th>Instance type</th><th>Baseline / Maximum bandwidth (Mbps)</th><th>Baseline / Maximum throughput (MB/s, 128 KiB I/O)</th><th>Baseline / Maximum IOPS (16 KiB I/O)</th><th>NVMe</th><th>Multiple EBS cards</th><th>EBS volume limit</th></tr>
</thead>
<tbody>
  <tr><td colspan="7">Hpc6a</td></tr>
  <tr><td>hpc6a.48xlarge 1</td><td>87.00 / 2085.00</td><td>10.88 / 260.62</td><td>500.00 / 11000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td colspan="7">Hpc6id</td></tr>
  <tr><td>hpc6id.32xlarge 1</td><td>87.00 / 2085.00</td><td>10.88 / 260.62</td><td>500.00 / 11000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 23 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td colspan="7">Hpc7a</td></tr>
  <tr><td>hpc7a.12xlarge 1</td><td>87.00 / 2085.00</td><td>10.88 / 260.62</td><td>500.00 / 11000.00</td><td>✓ Yes</td><td>✗ No</td><td>27 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>hpc7a.24xlarge 1</td><td>87.00 / 2085.00</td><td>10.88 / 260.62</td><td>500.00 / 11000.00</td><td>✓ Yes</td><td>✗ No</td><td>27 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>hpc7a.48xlarge 1</td><td>87.00 / 2085.00</td><td>10.88 / 260.62</td><td>500.00 / 11000.00</td><td>✓ Yes</td><td>✗ No</td><td>27 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>hpc7a.96xlarge 1</td><td>87.00 / 2085.00</td><td>10.88 / 260.62</td><td>500.00 / 11000.00</td><td>✓ Yes</td><td>✗ No</td><td>27 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td colspan="7">Hpc7g</td></tr>
  <tr><td>hpc7g.4xlarge 1</td><td>87.00 / 2085.00</td><td>10.88 / 260.62</td><td>500.00 / 11000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>hpc7g.8xlarge 1</td><td>87.00 / 2085.00</td><td>10.88 / 260.62</td><td>500.00 / 11000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>hpc7g.16xlarge 1</td><td>87.00 / 2085.00</td><td>10.88 / 260.62</td><td>500.00 / 11000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td colspan="7">Hpc8a</td></tr>
  <tr><td>hpc8a.96xlarge 1</td><td>87.00 / 2085.00</td><td>10.88 / 260.62</td><td>500.00 / 11000.00</td><td>✓ Yes</td><td>✗ No</td><td>27 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
</tbody>
</table>


**Note**  
1 These instances can support maximum performance for 30 minutes at least once every 24 hours, after which they revert to their baseline performance. Other instances can sustain the maximum performance indefinitely. If your workload requires sustained maximum performance for longer than 30 minutes, use one of these instances.

## Instance store specifications
<a name="hpc_instance-store"></a>

The following table shows the instance store volume configuration for supported instance types, along with the aggregated IOPS performance with 4,096 byte block size at queue depth saturation. 


<table>
<thead>
  <tr><th>Instance type</th><th>Instance store volumes</th><th>Instance store type</th><th>100% random read IOPS / Write IOPS</th><th>Needs initialization 1</th><th>TRIM support 2</th></tr>
</thead>
<tbody>
  <tr><td colspan="6">Hpc6id</td></tr>
  <tr><td>hpc6id.32xlarge</td><td>4 x 3800 GB</td><td>NVMe SSD</td><td>2,146,664 / 1,073,336</td><td> </td><td>✓ Yes</td></tr>
</tbody>
</table>


1 Volumes attached to certain instances suffer a first-write penalty unless initialized. For more information, see [Optimize disk performance for instance store volumes](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/disk-performance.html).

2 For more information, see [Instance store volume TRIM support](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ssd-instance-store.html#InstanceStoreTrimSupport).

## Security specifications
<a name="hpc_security"></a>


<table>
<thead>
  <tr><th>Instance type</th><th>EBS encryption</th><th>Instance store encryption</th><th>Encryption in transit</th><th>AMD SEV-SNP</th><th>NitroTPM</th><th>Nitro Enclaves</th></tr>
</thead>
<tbody>
  <tr><td colspan="7">Hpc6a</td></tr>
  <tr><td>hpc6a.48xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td colspan="7">Hpc6id</td></tr>
  <tr><td>hpc6id.32xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td colspan="7">Hpc7a</td></tr>
  <tr><td>hpc7a.12xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>hpc7a.24xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>hpc7a.48xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>hpc7a.96xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">Hpc7g</td></tr>
  <tr><td>hpc7g.4xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>hpc7g.8xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>hpc7g.16xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">Hpc8a</td></tr>
  <tr><td>hpc8a.96xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
</tbody>
</table>
