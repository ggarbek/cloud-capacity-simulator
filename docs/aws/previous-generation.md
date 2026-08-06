

# Specifications for Amazon EC2 previous generation instances
<a name="pg"></a>

AWS offers previous generation instance types for users who have optimized their applications around them and have yet to upgrade. We encourage you to use current generation instance types to get the best performance, but we continue to support the following previous generation instance types.

**Topics**
+ [Instance families and instance types](#pg_sizes)
+ [Instance family summary](#pg_summary)
+ [Performance specifications](#pg_hardware)
+ [Network specifications](#pg_network)
+ [Amazon EBS specifications](#pg_storage-ebs)
+ [Instance store specifications](#pg_instance-store)
+ [Security specifications](#pg_security)

**Pricing**  
For pricing information, see [Amazon EC2 On-Demand Pricing](https://aws.amazon.com/ec2/pricing/on-demand/).

## Instance families and instance types
<a name="pg_sizes"></a>


| Instance family | Available instance types | 
| --- | --- | 
| A1 | a1.medium \| a1.large \| a1.xlarge \| a1.2xlarge \| a1.4xlarge \| a1.metal | 
| C1 | c1.medium \| c1.xlarge | 
| C3 | c3.large \| c3.xlarge \| c3.2xlarge \| c3.4xlarge \| c3.8xlarge | 
| C4 | c4.large \| c4.xlarge \| c4.2xlarge \| c4.4xlarge \| c4.8xlarge | 
| G3 | g3.4xlarge \| g3.8xlarge \| g3.16xlarge | 
| I2 | i2.xlarge \| i2.2xlarge \| i2.4xlarge \| i2.8xlarge | 
| M1 | m1.small \| m1.medium \| m1.large \| m1.xlarge | 
| M2 | m2.xlarge \| m2.2xlarge \| m2.4xlarge | 
| M3 | m3.medium \| m3.large \| m3.xlarge \| m3.2xlarge | 
| M4 | m4.large \| m4.xlarge \| m4.2xlarge \| m4.4xlarge \| m4.10xlarge \| m4.16xlarge | 
| P3 | p3.2xlarge \| p3.8xlarge \| p3.16xlarge | 
| P3dn | p3dn.24xlarge | 
| R3 | r3.large \| r3.xlarge \| r3.2xlarge \| r3.4xlarge \| r3.8xlarge | 
| R4 | r4.large \| r4.xlarge \| r4.2xlarge \| r4.4xlarge \| r4.8xlarge \| r4.16xlarge | 
| T1 | t1.micro | 

## Instance family summary
<a name="pg_summary"></a>


| Instance family | Hypervisor | Processor type (architecture) | Metal instances available | Dedicated Hosts support | Spot support | Hibernation support | Supported operating systems | 
| --- | --- | --- | --- | --- | --- | --- | --- | 
| A1 | [Nitro v2](ec2-nitro-instances.md) | AWS Graviton (arm64) | ✓ Yes | ✓ Yes | ✓ Yes | ✗ No | Linux | 
| C1 | Xen | Intel (x86\_64) | ✗ No | ✗ No | ✓ Yes | ✗ No | Windows \| Linux | 
| C3 | Xen | Intel (x86\_64) | ✗ No | ✓ Yes | ✓ Yes | ✓ Yes | Windows \| Linux | 
| C4 | Xen | Intel (x86\_64) | ✗ No | ✓ Yes | ✓ Yes | ✓ Yes | Windows \| Linux | 
| G3 | Xen | Intel (x86\_64) | ✗ No | ✓ Yes | ✓ Yes | ✗ No | Windows \| Linux | 
| I2 | Xen | Intel (x86\_64) | ✗ No | ✓ Yes | ✓ Yes | ✗ No | Windows \| Linux | 
| M1 | Xen | Intel (x86\_64) | ✗ No | ✗ No | ✓ Yes | ✗ No | Windows \| Linux | 
| M2 | Xen | Intel (x86\_64) | ✗ No | ✗ No | ✓ Yes | ✗ No | Windows \| Linux | 
| M3 | Xen | Intel (x86\_64) | ✗ No | ✓ Yes | ✓ Yes | ✓ Yes | Windows \| Linux | 
| M4 | Xen | Intel (x86\_64) | ✗ No | ✓ Yes | ✓ Yes | ✓ Yes | Windows \| Linux | 
| P3 | Xen | Intel (x86\_64) | ✗ No | ✓ Yes | ✓ Yes | ✗ No | Windows \| Linux | 
| P3dn | [Nitro v3](ec2-nitro-instances.md) | Intel (x86\_64) | ✗ No | ✓ Yes | ✓ Yes | ✗ No | Windows \| Linux | 
| R3 | Xen | Intel (x86\_64) | ✗ No | ✓ Yes | ✓ Yes | ✓ Yes | Windows \| Linux | 
| R4 | Xen | Intel (x86\_64) | ✗ No | ✓ Yes | ✓ Yes | ✓ Yes | Windows \| Linux | 
| T1 | Xen | Intel (i386) | ✗ No | ✗ No | ✓ Yes | ✗ No | Windows \| Linux | 

## Performance specifications
<a name="pg_hardware"></a>


<table>
<thead>
  <tr><th>Instance type</th><th>Memory (GiB)</th><th>Processor</th><th>vCPUs</th><th>CPU cores</th><th>Threads per core</th><th>Accelerators</th><th>Accelerator memory</th></tr>
</thead>
<tbody>
  <tr><td colspan="8">A1</td></tr>
  <tr><td>a1.medium</td><td>2.00</td><td>AWS Graviton Processor</td><td>1</td><td>1</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>a1.large</td><td>4.00</td><td>AWS Graviton Processor</td><td>2</td><td>2</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>a1.xlarge</td><td>8.00</td><td>AWS Graviton Processor</td><td>4</td><td>4</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>a1.2xlarge</td><td>16.00</td><td>AWS Graviton Processor</td><td>8</td><td>8</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>a1.4xlarge</td><td>32.00</td><td>AWS Graviton Processor</td><td>16</td><td>16</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>a1.metal</td><td>32.00</td><td>AWS Graviton Processor</td><td>16</td><td>16</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">C1</td></tr>
  <tr><td>c1.medium</td><td>1.70</td><td>Intel Xeon Family</td><td>2</td><td>2</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c1.xlarge</td><td>7.00</td><td>Intel Xeon Family</td><td>8</td><td>8</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">C3</td></tr>
  <tr><td>c3.large</td><td>3.75</td><td>Intel Xeon E5-2680v2</td><td>2</td><td>1</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c3.xlarge</td><td>7.50</td><td>Intel Xeon E5-2680v2</td><td>4</td><td>2</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c3.2xlarge</td><td>15.00</td><td>Intel Xeon E5-2680v2</td><td>8</td><td>4</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c3.4xlarge</td><td>30.00</td><td>Intel Xeon E5-2680v2</td><td>16</td><td>8</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c3.8xlarge</td><td>60.00</td><td>Intel Xeon E5-2680v2</td><td>32</td><td>16</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">C4</td></tr>
  <tr><td>c4.large</td><td>3.75</td><td>Intel Xeon E5-2666v3</td><td>2</td><td>1</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c4.xlarge</td><td>7.50</td><td>Intel Xeon E5-2666v3</td><td>4</td><td>2</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c4.2xlarge</td><td>15.00</td><td>Intel Xeon E5-2666v3</td><td>8</td><td>4</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c4.4xlarge</td><td>30.00</td><td>Intel Xeon E5-2666v3</td><td>16</td><td>8</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c4.8xlarge</td><td>60.00</td><td>Intel Xeon E5-2666v3</td><td>36</td><td>18</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">G3</td></tr>
  <tr><td>g3.4xlarge</td><td>122.00</td><td>Intel Xeon E5-2686 v4</td><td>16</td><td>8</td><td>2</td><td>1 x NVIDIA M60 GPU</td><td>8 GiB (1 x 8 GiB)</td></tr>
  <tr><td>g3.8xlarge</td><td>244.00</td><td>Intel Xeon E5-2686 v4</td><td>32</td><td>16</td><td>2</td><td>2 x NVIDIA M60 GPU</td><td>16 GiB (2 x 8 GiB)</td></tr>
  <tr><td>g3.16xlarge</td><td>488.00</td><td>Intel Xeon E5-2686 v4</td><td>64</td><td>32</td><td>2</td><td>4 x NVIDIA M60 GPU</td><td>32 GiB (4 x 8 GiB)</td></tr>
  <tr><td colspan="8">I2</td></tr>
  <tr><td>i2.xlarge</td><td>30.50</td><td>Intel Xeon E5-2670v2</td><td>4</td><td>2</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>i2.2xlarge</td><td>61.00</td><td>Intel Xeon E5-2670v2</td><td>8</td><td>4</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>i2.4xlarge</td><td>122.00</td><td>Intel Xeon E5-2670v2</td><td>16</td><td>8</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>i2.8xlarge</td><td>244.00</td><td>Intel Xeon E5-2670v2</td><td>32</td><td>16</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">M1</td></tr>
  <tr><td>m1.small</td><td>1.70</td><td>Intel Xeon Family</td><td>1</td><td>1</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m1.medium</td><td>3.70</td><td>Intel Xeon Family</td><td>1</td><td>1</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m1.large</td><td>7.50</td><td>Intel Xeon Family</td><td>2</td><td>2</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m1.xlarge</td><td>15.00</td><td>Intel Xeon Family</td><td>4</td><td>4</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">M2</td></tr>
  <tr><td>m2.xlarge</td><td>17.10</td><td>Intel Xeon Family</td><td>2</td><td>2</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m2.2xlarge</td><td>34.20</td><td>Intel Xeon Family</td><td>4</td><td>4</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m2.4xlarge</td><td>68.40</td><td>Intel Xeon Family</td><td>8</td><td>8</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">M3</td></tr>
  <tr><td>m3.medium</td><td>3.75</td><td>Intel Xeon E5-2670v2</td><td>1</td><td>1</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m3.large</td><td>7.50</td><td>Intel Xeon E5-2670v2</td><td>2</td><td>1</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m3.xlarge</td><td>15.00</td><td>Intel Xeon E5-2670v2</td><td>4</td><td>2</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m3.2xlarge</td><td>30.00</td><td>Intel Xeon E5-2670v2</td><td>8</td><td>4</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">M4</td></tr>
  <tr><td>m4.large</td><td>8.00</td><td>Intel Xeon E5-2676v3</td><td>2</td><td>1</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m4.xlarge</td><td>16.00</td><td>Intel Xeon E5-2676v3</td><td>4</td><td>2</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m4.2xlarge</td><td>32.00</td><td>Intel Xeon E5-2676v3</td><td>8</td><td>4</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m4.4xlarge</td><td>64.00</td><td>Intel Xeon E5-2676v3</td><td>16</td><td>8</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m4.10xlarge</td><td>160.00</td><td>Intel Xeon E5-2676v3</td><td>40</td><td>20</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m4.16xlarge</td><td>256.00</td><td>Intel Xeon E5-2686v4</td><td>64</td><td>32</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">P3</td></tr>
  <tr><td>p3.2xlarge</td><td>61.00</td><td>Intel Xeon E5-2686 v4</td><td>8</td><td>4</td><td>2</td><td>1 x NVIDIA V100 GPU</td><td>16 GiB (1 x 16 GiB)</td></tr>
  <tr><td>p3.8xlarge</td><td>244.00</td><td>Intel Xeon E5-2686 v4</td><td>32</td><td>16</td><td>2</td><td>4 x NVIDIA V100 GPU</td><td>64 GiB (4 x 16 GiB)</td></tr>
  <tr><td>p3.16xlarge</td><td>488.00</td><td>Intel Xeon E5-2686 v4</td><td>64</td><td>32</td><td>2</td><td>8 x NVIDIA V100 GPU</td><td>128 GiB (8 x 16 GiB)</td></tr>
  <tr><td colspan="8">P3dn</td></tr>
  <tr><td>p3dn.24xlarge</td><td>768.00</td><td>Intel Xeon Platinum 8175</td><td>96</td><td>48</td><td>2</td><td>8 x NVIDIA V100 GPU</td><td>256 GiB (8 x 32 GiB)</td></tr>
  <tr><td colspan="8">R3</td></tr>
  <tr><td>r3.large</td><td>15.00</td><td>Intel Xeon E5-2670v2</td><td>2</td><td>1</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r3.xlarge</td><td>30.50</td><td>Intel Xeon E5-2670v2</td><td>4</td><td>2</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r3.2xlarge</td><td>61.00</td><td>Intel Xeon E5-2670v2</td><td>8</td><td>4</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r3.4xlarge</td><td>122.00</td><td>Intel Xeon E5-2670v2</td><td>16</td><td>8</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r3.8xlarge</td><td>244.00</td><td>Intel Xeon E5-2670v2</td><td>32</td><td>16</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">R4</td></tr>
  <tr><td>r4.large</td><td>15.25</td><td>Intel Broadwell E5-2686v4</td><td>2</td><td>1</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r4.xlarge</td><td>30.50</td><td>Intel Broadwell E5-2686v4</td><td>4</td><td>2</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r4.2xlarge</td><td>61.00</td><td>Intel Broadwell E5-2686v4</td><td>8</td><td>4</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r4.4xlarge</td><td>122.00</td><td>Intel Broadwell E5-2686v4</td><td>16</td><td>8</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r4.8xlarge</td><td>244.00</td><td>Intel Broadwell E5-2686v4</td><td>32</td><td>16</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r4.16xlarge</td><td>488.00</td><td>Intel Broadwell E5-2686v4</td><td>64</td><td>32</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">T1</td></tr>
  <tr><td>t1.micro</td><td>0.61</td><td>Intel E5-2650</td><td>1</td><td>1</td><td>1</td><td>✗ No</td><td>✗ No</td></tr>
</tbody>
</table>


## Network specifications
<a name="pg_network"></a>


<table>
<thead>
  <tr><th>Instance type</th><th>Baseline / Burst bandwidth (Gbps)</th><th>EFA</th><th>ENA</th><th>ENA Express</th><th>Network cards</th><th>Max. network interfaces</th><th>IP addresses per interface</th><th>IPv6</th></tr>
</thead>
<tbody>
  <tr><td colspan="9">A1</td></tr>
  <tr><td>a1.medium 1</td><td>0.5 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>2</td><td>4</td><td>✓ Yes</td></tr>
  <tr><td>a1.large 1</td><td>0.75 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>a1.xlarge 1</td><td>1.25 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>a1.2xlarge 1</td><td>2.5 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>a1.4xlarge 1</td><td>5.0 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>a1.metal 1</td><td>5.0 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">C1</td></tr>
  <tr><td>c1.medium</td><td>Moderate</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>1</td><td>2</td><td>6</td><td>✗ No</td></tr>
  <tr><td>c1.xlarge</td><td>High</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✗ No</td></tr>
  <tr><td colspan="9">C3</td></tr>
  <tr><td>c3.large</td><td>Moderate</td><td>✗ No</td><td>✗ No 2</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>c3.xlarge</td><td>Moderate</td><td>✗ No</td><td>✗ No 2</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>c3.2xlarge</td><td>High</td><td>✗ No</td><td>✗ No 2</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>c3.4xlarge</td><td>High</td><td>✗ No</td><td>✗ No 2</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>c3.8xlarge</td><td>10 Gigabit</td><td>✗ No</td><td>✗ No 2</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">C4</td></tr>
  <tr><td>c4.large</td><td>Moderate</td><td>✗ No</td><td>✗ No 2</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>c4.xlarge</td><td>High</td><td>✗ No</td><td>✗ No 2</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>c4.2xlarge</td><td>High</td><td>✗ No</td><td>✗ No 2</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>c4.4xlarge</td><td>High</td><td>✗ No</td><td>✗ No 2</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>c4.8xlarge</td><td>10 Gigabit</td><td>✗ No</td><td>✗ No 2</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">G3</td></tr>
  <tr><td>g3.4xlarge 1</td><td>5.0 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>g3.8xlarge</td><td>10 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>g3.16xlarge</td><td>25 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">I2</td></tr>
  <tr><td>i2.xlarge</td><td>Moderate</td><td>✗ No</td><td>✗ No 2</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>i2.2xlarge</td><td>High</td><td>✗ No</td><td>✗ No 2</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>i2.4xlarge</td><td>High</td><td>✗ No</td><td>✗ No 2</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>i2.8xlarge</td><td>10 Gigabit</td><td>✗ No</td><td>✗ No 2</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">M1</td></tr>
  <tr><td>m1.small</td><td>Low</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>1</td><td>2</td><td>4</td><td>✗ No</td></tr>
  <tr><td>m1.medium</td><td>Moderate</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>1</td><td>2</td><td>6</td><td>✗ No</td></tr>
  <tr><td>m1.large</td><td>Moderate</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✗ No</td></tr>
  <tr><td>m1.xlarge</td><td>High</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✗ No</td></tr>
  <tr><td colspan="9">M2</td></tr>
  <tr><td>m2.xlarge</td><td>Moderate</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✗ No</td></tr>
  <tr><td>m2.2xlarge</td><td>Moderate</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>1</td><td>4</td><td>30</td><td>✗ No</td></tr>
  <tr><td>m2.4xlarge</td><td>High</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✗ No</td></tr>
  <tr><td colspan="9">M3</td></tr>
  <tr><td>m3.medium</td><td>Moderate</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>1</td><td>2</td><td>6</td><td>✗ No</td></tr>
  <tr><td>m3.large</td><td>Moderate</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✗ No</td></tr>
  <tr><td>m3.xlarge</td><td>High</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✗ No</td></tr>
  <tr><td>m3.2xlarge</td><td>High</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>1</td><td>4</td><td>30</td><td>✗ No</td></tr>
  <tr><td colspan="9">M4</td></tr>
  <tr><td>m4.large</td><td>Moderate</td><td>✗ No</td><td>✗ No 2</td><td>✗ No</td><td>1</td><td>2</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>m4.xlarge</td><td>High</td><td>✗ No</td><td>✗ No 2</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>m4.2xlarge</td><td>High</td><td>✗ No</td><td>✗ No 2</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>m4.4xlarge</td><td>High</td><td>✗ No</td><td>✗ No 2</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>m4.10xlarge</td><td>10 Gigabit</td><td>✗ No</td><td>✗ No 2</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>m4.16xlarge</td><td>25 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">P3</td></tr>
  <tr><td>p3.2xlarge 1</td><td>2.5 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>p3.8xlarge</td><td>10 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>p3.16xlarge</td><td>25 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">P3dn</td></tr>
  <tr><td>p3dn.24xlarge</td><td>100 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">R3</td></tr>
  <tr><td>r3.large</td><td>Moderate</td><td>✗ No</td><td>✗ No 2</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>r3.xlarge</td><td>Moderate</td><td>✗ No</td><td>✗ No 2</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>r3.2xlarge</td><td>High</td><td>✗ No</td><td>✗ No 2</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>r3.4xlarge</td><td>High</td><td>✗ No</td><td>✗ No 2</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>r3.8xlarge</td><td>10 Gigabit</td><td>✗ No</td><td>✗ No 2</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">R4</td></tr>
  <tr><td>r4.large 1</td><td>0.75 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>r4.xlarge 1</td><td>1.25 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>r4.2xlarge 1</td><td>2.5 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>r4.4xlarge 1</td><td>5.0 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>r4.8xlarge</td><td>10 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>r4.16xlarge</td><td>25 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">T1</td></tr>
  <tr><td>t1.micro</td><td>Very Low</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>1</td><td>2</td><td>2</td><td>✗ No</td></tr>
</tbody>
</table>


**Note**  
1 These instances have a baseline bandwidth and can use a network I/O credit mechanism to burst beyond their baseline bandwidth on a best effort basis. Other instances types can sustain their maximum performance indefinitely. For more information, see [ instance network bandwidth](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-instance-network-bandwidth.html).  
2 These instances support enhanced networking using the Intel 82599 VF interface.

## Amazon EBS specifications
<a name="pg_storage-ebs"></a>

The following table indicates which instance types are Amazon EBS optimized by default and which optionally support it. It also describes their EBS-optimized performance, including dedicated bandwidth to Amazon EBS, the typical maximum aggregate throughput that can be achieved on that dedicated connection with a streaming read workload and 128 KiB I/O size, and the maximum IOPS the instance type can support when using a 16 KiB I/O size. Instance types not listed do not support Amazon EBS optimization.

**Important**  
An instance's EBS performance is bounded by the instance's performance limits, or the aggregated performance of its attached volumes, whichever is smaller. To achieve maximum EBS performance, an instance must have attached volumes that provide a combined performance equal to or greater than the maximum instance performance. For example, to achieve `80,000` IOPS for `r6i.16xlarge`, the instance must have at least `5` `gp3` volumes provisioned with `16,000` IOPS each (`5` volumes x `16,000` IOPS = `80,000` IOPS).  
We recommend that you choose an EBS–optimized instance type that provides more dedicated Amazon EBS throughput than your application needs; otherwise, the connection between Amazon EBS and Amazon EC2 can become a performance bottleneck.


<table>
<thead>
  <tr><th>Instance type</th><th>Baseline / Maximum bandwidth (Mbps)</th><th>Baseline / Maximum throughput (MB/s, 128 KiB I/O)</th><th>Baseline / Maximum IOPS (16 KiB I/O)</th><th>NVMe</th><th>Multiple EBS cards</th><th>EBS volume limit</th></tr>
</thead>
<tbody>
  <tr><td colspan="7">A1</td></tr>
  <tr><td>a1.medium 1</td><td>300.00 / 3500.00</td><td>37.50 / 437.50</td><td>2500.00 / 20000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>a1.large 1</td><td>525.00 / 3500.00</td><td>65.62 / 437.50</td><td>4000.00 / 20000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>a1.xlarge 1</td><td>800.00 / 3500.00</td><td>100.00 / 437.50</td><td>6000.00 / 20000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>a1.2xlarge 1</td><td>1750.00 / 3500.00</td><td>218.75 / 437.50</td><td>10000.00 / 20000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>a1.4xlarge</td><td>3500.00</td><td>437.50</td><td>20000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>a1.metal</td><td>3500.00</td><td>437.50</td><td>20000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 31 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td colspan="7">C1</td></tr>
  <tr><td>c1.xlarge</td><td>1000.00</td><td>125.00</td><td>8000.00</td><td>✗ No</td><td>✗ No</td><td>Up to 39 ([Xen-based limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#xen-limits))</td></tr>
  <tr><td colspan="7">C3</td></tr>
  <tr><td>c3.xlarge</td><td>500.00</td><td>62.50</td><td>4000.00</td><td>✗ No</td><td>✗ No</td><td>Up to 39 ([Xen-based limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#xen-limits))</td></tr>
  <tr><td>c3.2xlarge</td><td>1000.00</td><td>125.00</td><td>8000.00</td><td>✗ No</td><td>✗ No</td><td>Up to 39 ([Xen-based limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#xen-limits))</td></tr>
  <tr><td>c3.4xlarge</td><td>2000.00</td><td>250.00</td><td>16000.00</td><td>✗ No</td><td>✗ No</td><td>Up to 39 ([Xen-based limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#xen-limits))</td></tr>
  <tr><td colspan="7">C4</td></tr>
  <tr><td>c4.large</td><td>500.00</td><td>62.50</td><td>4000.00</td><td>✗ No</td><td>✗ No</td><td>Up to 40 ([Xen-based limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#xen-limits))</td></tr>
  <tr><td>c4.xlarge</td><td>750.00</td><td>93.75</td><td>6000.00</td><td>✗ No</td><td>✗ No</td><td>Up to 40 ([Xen-based limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#xen-limits))</td></tr>
  <tr><td>c4.2xlarge</td><td>1000.00</td><td>125.00</td><td>8000.00</td><td>✗ No</td><td>✗ No</td><td>Up to 40 ([Xen-based limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#xen-limits))</td></tr>
  <tr><td>c4.4xlarge</td><td>2000.00</td><td>250.00</td><td>16000.00</td><td>✗ No</td><td>✗ No</td><td>Up to 40 ([Xen-based limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#xen-limits))</td></tr>
  <tr><td>c4.8xlarge</td><td>4000.00</td><td>500.00</td><td>32000.00</td><td>✗ No</td><td>✗ No</td><td>Up to 40 ([Xen-based limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#xen-limits))</td></tr>
  <tr><td colspan="7">G3</td></tr>
  <tr><td>g3.4xlarge</td><td>3500.00</td><td>437.50</td><td>20000.00</td><td>✗ No</td><td>✗ No</td><td>Up to 26 ([Xen-based limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#xen-limits))</td></tr>
  <tr><td>g3.8xlarge</td><td>7000.00</td><td>875.00</td><td>40000.00</td><td>✗ No</td><td>✗ No</td><td>Up to 25 ([Xen-based limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#xen-limits))</td></tr>
  <tr><td>g3.16xlarge</td><td>14000.00</td><td>1750.00</td><td>80000.00</td><td>✗ No</td><td>✗ No</td><td>Up to 23 ([Xen-based limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#xen-limits))</td></tr>
  <tr><td colspan="7">I2</td></tr>
  <tr><td>i2.xlarge</td><td>500.00</td><td>62.50</td><td>4000.00</td><td>✗ No</td><td>✗ No</td><td>Up to 40 ([Xen-based limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#xen-limits))</td></tr>
  <tr><td>i2.2xlarge</td><td>1000.00</td><td>125.00</td><td>8000.00</td><td>✗ No</td><td>✗ No</td><td>Up to 40 ([Xen-based limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#xen-limits))</td></tr>
  <tr><td>i2.4xlarge</td><td>2000.00</td><td>250.00</td><td>16000.00</td><td>✗ No</td><td>✗ No</td><td>Up to 40 ([Xen-based limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#xen-limits))</td></tr>
  <tr><td colspan="7">M1</td></tr>
  <tr><td>m1.large</td><td>500.00</td><td>62.50</td><td>4000.00</td><td>✗ No</td><td>✗ No</td><td>Up to 39 ([Xen-based limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#xen-limits))</td></tr>
  <tr><td>m1.xlarge</td><td>1000.00</td><td>125.00</td><td>8000.00</td><td>✗ No</td><td>✗ No</td><td>Up to 39 ([Xen-based limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#xen-limits))</td></tr>
  <tr><td colspan="7">M2</td></tr>
  <tr><td>m2.2xlarge</td><td>500.00</td><td>62.50</td><td>4000.00</td><td>✗ No</td><td>✗ No</td><td>Up to 39 ([Xen-based limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#xen-limits))</td></tr>
  <tr><td>m2.4xlarge</td><td>1000.00</td><td>125.00</td><td>8000.00</td><td>✗ No</td><td>✗ No</td><td>Up to 39 ([Xen-based limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#xen-limits))</td></tr>
  <tr><td colspan="7">M3</td></tr>
  <tr><td>m3.xlarge</td><td>500.00</td><td>62.50</td><td>4000.00</td><td>✗ No</td><td>✗ No</td><td>Up to 39 ([Xen-based limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#xen-limits))</td></tr>
  <tr><td>m3.2xlarge</td><td>1000.00</td><td>125.00</td><td>8000.00</td><td>✗ No</td><td>✗ No</td><td>Up to 39 ([Xen-based limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#xen-limits))</td></tr>
  <tr><td colspan="7">M4</td></tr>
  <tr><td>m4.large</td><td>450.00</td><td>56.25</td><td>3600.00</td><td>✗ No</td><td>✗ No</td><td>Up to 40 ([Xen-based limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#xen-limits))</td></tr>
  <tr><td>m4.xlarge</td><td>750.00</td><td>93.75</td><td>6000.00</td><td>✗ No</td><td>✗ No</td><td>Up to 40 ([Xen-based limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#xen-limits))</td></tr>
  <tr><td>m4.2xlarge</td><td>1000.00</td><td>125.00</td><td>8000.00</td><td>✗ No</td><td>✗ No</td><td>Up to 40 ([Xen-based limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#xen-limits))</td></tr>
  <tr><td>m4.4xlarge</td><td>2000.00</td><td>250.00</td><td>16000.00</td><td>✗ No</td><td>✗ No</td><td>Up to 40 ([Xen-based limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#xen-limits))</td></tr>
  <tr><td>m4.10xlarge</td><td>4000.00</td><td>500.00</td><td>32000.00</td><td>✗ No</td><td>✗ No</td><td>Up to 40 ([Xen-based limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#xen-limits))</td></tr>
  <tr><td>m4.16xlarge</td><td>10000.00</td><td>1250.00</td><td>65000.00</td><td>✗ No</td><td>✗ No</td><td>Up to 40 ([Xen-based limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#xen-limits))</td></tr>
  <tr><td colspan="7">P3</td></tr>
  <tr><td>p3.2xlarge</td><td>1750.00</td><td>218.75</td><td>10000.00</td><td>✗ No</td><td>✗ No</td><td>Up to 26 ([Xen-based limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#xen-limits))</td></tr>
  <tr><td>p3.8xlarge</td><td>7000.00</td><td>875.00</td><td>40000.00</td><td>✗ No</td><td>✗ No</td><td>Up to 23 ([Xen-based limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#xen-limits))</td></tr>
  <tr><td>p3.16xlarge</td><td>14000.00</td><td>1750.00</td><td>80000.00</td><td>✗ No</td><td>✗ No</td><td>Up to 19 ([Xen-based limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#xen-limits))</td></tr>
  <tr><td colspan="7">P3dn</td></tr>
  <tr><td>p3dn.24xlarge</td><td>19000.00</td><td>2375.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 17 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td colspan="7">R3</td></tr>
  <tr><td>r3.xlarge</td><td>500.00</td><td>62.50</td><td>4000.00</td><td>✗ No</td><td>✗ No</td><td>Up to 39 ([Xen-based limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#xen-limits))</td></tr>
  <tr><td>r3.2xlarge</td><td>1000.00</td><td>125.00</td><td>8000.00</td><td>✗ No</td><td>✗ No</td><td>Up to 39 ([Xen-based limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#xen-limits))</td></tr>
  <tr><td>r3.4xlarge</td><td>2000.00</td><td>250.00</td><td>16000.00</td><td>✗ No</td><td>✗ No</td><td>Up to 39 ([Xen-based limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#xen-limits))</td></tr>
  <tr><td colspan="7">R4</td></tr>
  <tr><td>r4.large</td><td>425.00</td><td>53.12</td><td>3000.00</td><td>✗ No</td><td>✗ No</td><td>Up to 40 ([Xen-based limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#xen-limits))</td></tr>
  <tr><td>r4.xlarge</td><td>850.00</td><td>106.25</td><td>6000.00</td><td>✗ No</td><td>✗ No</td><td>Up to 40 ([Xen-based limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#xen-limits))</td></tr>
  <tr><td>r4.2xlarge</td><td>1700.00</td><td>212.50</td><td>12000.00</td><td>✗ No</td><td>✗ No</td><td>Up to 40 ([Xen-based limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#xen-limits))</td></tr>
  <tr><td>r4.4xlarge</td><td>3500.00</td><td>437.50</td><td>18750.00</td><td>✗ No</td><td>✗ No</td><td>Up to 40 ([Xen-based limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#xen-limits))</td></tr>
  <tr><td>r4.8xlarge</td><td>7000.00</td><td>875.00</td><td>37500.00</td><td>✗ No</td><td>✗ No</td><td>Up to 40 ([Xen-based limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#xen-limits))</td></tr>
  <tr><td>r4.16xlarge</td><td>14000.00</td><td>1750.00</td><td>75000.00</td><td>✗ No</td><td>✗ No</td><td>Up to 40 ([Xen-based limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#xen-limits))</td></tr>
  <tr><td colspan="7">T1</td></tr>
</tbody>
</table>


**Note**  
1 These instances can support maximum performance for 30 minutes at least once every 24 hours, after which they revert to their baseline performance. Other instances can sustain the maximum performance indefinitely. If your workload requires sustained maximum performance for longer than 30 minutes, use one of these instances.  
C1, C3, I2, M1, M2, M3, and R3 instances are not Amazon EBS optimized by default. You can optionally enable [Amazon EBS optimization](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ebs-optimized.html) for these instances during or after launch for an additional hourly fee.

## Instance store specifications
<a name="pg_instance-store"></a>


<table>
<thead>
  <tr><th>Instance type</th><th>Instance store volumes</th><th>Instance store type</th><th>100% random read IOPS / Write IOPS</th><th>Needs initialization 1</th><th>TRIM support 2</th></tr>
</thead>
<tbody>
  <tr><td colspan="6">C1</td></tr>
  <tr><td>c1.medium</td><td>1 x 350 GB</td><td>HDD</td><td></td><td>✓ Yes</td><td> </td></tr>
  <tr><td>c1.xlarge</td><td>4 x 420 GB</td><td>HDD</td><td></td><td>✓ Yes</td><td> </td></tr>
  <tr><td colspan="6">C3</td></tr>
  <tr><td>c3.large</td><td>2 x 16 GB</td><td>SSD</td><td></td><td>✓ Yes</td><td> </td></tr>
  <tr><td>c3.xlarge</td><td>2 x 40 GB</td><td>SSD</td><td></td><td>✓ Yes</td><td> </td></tr>
  <tr><td>c3.2xlarge</td><td>2 x 80 GB</td><td>SSD</td><td></td><td>✓ Yes</td><td> </td></tr>
  <tr><td>c3.4xlarge</td><td>2 x 160 GB</td><td>SSD</td><td></td><td>✓ Yes</td><td> </td></tr>
  <tr><td>c3.8xlarge</td><td>2 x 320 GB</td><td>SSD</td><td></td><td>✓ Yes</td><td> </td></tr>
  <tr><td colspan="6">I2</td></tr>
  <tr><td>i2.xlarge</td><td>1 x 800 GB</td><td>SSD</td><td></td><td>✓ Yes</td><td> </td></tr>
  <tr><td>i2.2xlarge</td><td>2 x 800 GB</td><td>SSD</td><td></td><td>✓ Yes</td><td> </td></tr>
  <tr><td>i2.4xlarge</td><td>4 x 800 GB</td><td>SSD</td><td></td><td>✓ Yes</td><td> </td></tr>
  <tr><td>i2.8xlarge</td><td>8 x 800 GB</td><td>SSD</td><td></td><td>✓ Yes</td><td> </td></tr>
  <tr><td colspan="6">M1</td></tr>
  <tr><td>m1.small</td><td>1 x 160 GB</td><td>HDD</td><td></td><td>✓ Yes</td><td> </td></tr>
  <tr><td>m1.medium</td><td>1 x 410 GB</td><td>HDD</td><td></td><td>✓ Yes</td><td> </td></tr>
  <tr><td>m1.large</td><td>2 x 420 GB</td><td>HDD</td><td></td><td>✓ Yes</td><td> </td></tr>
  <tr><td>m1.xlarge</td><td>4 x 420 GB</td><td>HDD</td><td></td><td>✓ Yes</td><td> </td></tr>
  <tr><td colspan="6">M2</td></tr>
  <tr><td>m2.xlarge</td><td>1 x 420 GB</td><td>HDD</td><td></td><td>✓ Yes</td><td> </td></tr>
  <tr><td>m2.2xlarge</td><td>1 x 850 GB</td><td>HDD</td><td></td><td>✓ Yes</td><td> </td></tr>
  <tr><td>m2.4xlarge</td><td>2 x 840 GB</td><td>HDD</td><td></td><td>✓ Yes</td><td> </td></tr>
  <tr><td colspan="6">M3</td></tr>
  <tr><td>m3.medium</td><td>1 x 4 GB</td><td>SSD</td><td></td><td>✓ Yes</td><td> </td></tr>
  <tr><td>m3.large</td><td>1 x 32 GB</td><td>SSD</td><td></td><td>✓ Yes</td><td> </td></tr>
  <tr><td>m3.xlarge</td><td>2 x 40 GB</td><td>SSD</td><td></td><td>✓ Yes</td><td> </td></tr>
  <tr><td>m3.2xlarge</td><td>2 x 80 GB</td><td>SSD</td><td></td><td>✓ Yes</td><td> </td></tr>
  <tr><td colspan="6">P3dn</td></tr>
  <tr><td>p3dn.24xlarge</td><td>2 x 900 GB</td><td>NVMe SSD</td><td>700,000 / 340,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td colspan="6">R3</td></tr>
  <tr><td>r3.large</td><td>1 x 32 GB</td><td>SSD</td><td></td><td>✓ Yes</td><td> </td></tr>
  <tr><td>r3.xlarge</td><td>1 x 80 GB</td><td>SSD</td><td></td><td>✓ Yes</td><td> </td></tr>
  <tr><td>r3.2xlarge</td><td>1 x 160 GB</td><td>SSD</td><td></td><td>✓ Yes</td><td> </td></tr>
  <tr><td>r3.4xlarge</td><td>1 x 320 GB</td><td>SSD</td><td></td><td>✓ Yes</td><td> </td></tr>
  <tr><td>r3.8xlarge</td><td>2 x 320 GB</td><td>SSD</td><td></td><td>✓ Yes</td><td> </td></tr>
</tbody>
</table>


1 Volumes attached to certain instances suffer a first-write penalty unless initialized. For more information, see [Optimize disk performance for instance store volumes](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/disk-performance.html).

2 For more information, see [Instance store volume TRIM support](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ssd-instance-store.html#InstanceStoreTrimSupport).

## Security specifications
<a name="pg_security"></a>


<table>
<thead>
  <tr><th>Instance type</th><th>EBS encryption</th><th>Instance store encryption</th><th>Encryption in transit</th><th>AMD SEV-SNP</th><th>NitroTPM</th><th>Nitro Enclaves</th></tr>
</thead>
<tbody>
  <tr><td colspan="7">A1</td></tr>
  <tr><td>a1.medium</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>a1.large</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>a1.xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>a1.2xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>a1.4xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>a1.metal</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">C1</td></tr>
  <tr><td>c1.medium</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c1.xlarge</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">C3</td></tr>
  <tr><td>c3.large</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c3.xlarge</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c3.2xlarge</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c3.4xlarge</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c3.8xlarge</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">C4</td></tr>
  <tr><td>c4.large</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c4.xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c4.2xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c4.4xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>c4.8xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">G3</td></tr>
  <tr><td>g3.4xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>g3.8xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>g3.16xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">I2</td></tr>
  <tr><td>i2.xlarge</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>i2.2xlarge</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>i2.4xlarge</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>i2.8xlarge</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">M1</td></tr>
  <tr><td>m1.small</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m1.medium</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m1.large</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m1.xlarge</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">M2</td></tr>
  <tr><td>m2.xlarge</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m2.2xlarge</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m2.4xlarge</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">M3</td></tr>
  <tr><td>m3.medium</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m3.large</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m3.xlarge</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m3.2xlarge</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">M4</td></tr>
  <tr><td>m4.large</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m4.xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m4.2xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m4.4xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m4.10xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>m4.16xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">P3</td></tr>
  <tr><td>p3.2xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>p3.8xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>p3.16xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">P3dn</td></tr>
  <tr><td>p3dn.24xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td></tr>
  <tr><td colspan="7">R3</td></tr>
  <tr><td>r3.large</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r3.xlarge</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r3.2xlarge</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r3.4xlarge</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r3.8xlarge</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">R4</td></tr>
  <tr><td>r4.large</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r4.xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r4.2xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r4.4xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r4.8xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>r4.16xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">T1</td></tr>
  <tr><td>t1.micro</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
</tbody>
</table>
