

# Specifications for Amazon EC2 accelerated computing instances
<a name="ac"></a>

Accelerated computing instances use hardware accelerators, or co-processors, to perform functions, such as floating point number calculations, graphics processing, or data pattern matching, more efficiently than is possible in software running on CPUs.

For information on previous generation instance types of this category, such as G3 instances, see [Specifications for Amazon EC2 previous generation instances](pg.md).

**Topics**
+ [Instance families and instance types](#ac-sizes)
+ [Instance family summary](#ac_summary)
+ [Performance specifications](#ac_hardware)
+ [Network specifications](#ac_network)
+ [Amazon EBS specifications](#ac_storage-ebs)
+ [Instance store specifications](#ac_instance-store)
+ [Security specifications](#ac_security)

**Pricing**  
For pricing information, see [Amazon EC2 On-Demand Pricing](https://aws.amazon.com/ec2/pricing/on-demand/).

## Instance families and instance types
<a name="ac-sizes"></a>


| Instance family | Available instance types | 
| --- | --- | 
| DL1 | dl1.24xlarge | 
| DL2q | dl2q.24xlarge | 
| F2 | f2.6xlarge \| f2.12xlarge \| f2.48xlarge | 
| G4ad | g4ad.xlarge \| g4ad.2xlarge \| g4ad.4xlarge \| g4ad.8xlarge \| g4ad.16xlarge | 
| G4dn | g4dn.xlarge \| g4dn.2xlarge \| g4dn.4xlarge \| g4dn.8xlarge \| g4dn.12xlarge \| g4dn.16xlarge \| g4dn.metal | 
| G5 | g5.xlarge \| g5.2xlarge \| g5.4xlarge \| g5.8xlarge \| g5.12xlarge \| g5.16xlarge \| g5.24xlarge \| g5.48xlarge | 
| G5g | g5g.xlarge \| g5g.2xlarge \| g5g.4xlarge \| g5g.8xlarge \| g5g.16xlarge \| g5g.metal | 
| G6 | g6.xlarge \| g6.2xlarge \| g6.4xlarge \| g6.8xlarge \| g6.12xlarge \| g6.16xlarge \| g6.24xlarge \| g6.48xlarge | 
| G6e | g6e.xlarge \| g6e.2xlarge \| g6e.4xlarge \| g6e.8xlarge \| g6e.12xlarge \| g6e.16xlarge \| g6e.24xlarge \| g6e.48xlarge | 
| G6f | g6f.large \| g6f.xlarge \| g6f.2xlarge \| g6f.4xlarge | 
| Gr6 | gr6.4xlarge \| gr6.8xlarge | 
| Gr6f | gr6f.4xlarge | 
| G7e | g7e.2xlarge \| g7e.4xlarge \| g7e.8xlarge \| g7e.12xlarge \| g7e.24xlarge \| g7e.48xlarge | 
| Inf1 | inf1.xlarge \| inf1.2xlarge \| inf1.6xlarge \| inf1.24xlarge | 
| Inf2 | inf2.xlarge \| inf2.8xlarge \| inf2.24xlarge \| inf2.48xlarge | 
| P4d | p4d.24xlarge | 
| P4de | p4de.24xlarge | 
| P5 | p5.4xlarge \| p5.48xlarge | 
| P5e | p5e.48xlarge | 
| P5en | p5en.48xlarge | 
| P6-B200 | p6-b200.48xlarge | 
| P6-B300 | p6-b300.48xlarge | 
| P6e-GB200 | p6e-gb200.36xlarge | 
| Trn1 | trn1.2xlarge \| trn1.32xlarge | 
| Trn1n | trn1n.32xlarge | 
| Trn2 | trn2.3xlarge \| trn2.48xlarge | 
| Trn2u | trn2u.48xlarge | 
| VT1 | vt1.3xlarge \| vt1.6xlarge \| vt1.24xlarge | 

## Instance family summary
<a name="ac_summary"></a>


| Instance family | Hypervisor | Processor type (architecture) | Metal instances available | Dedicated Hosts support | Spot support | Hibernation support | Supported operating systems | 
| --- | --- | --- | --- | --- | --- | --- | --- | 
| DL1 | [Nitro v3](ec2-nitro-instances.md) | Intel (x86\_64) | ✗ No | ✓ Yes | ✓ Yes | ✗ No | Linux | 
| DL2q | [Nitro v3](ec2-nitro-instances.md) | Intel (x86\_64) | ✗ No | ✓ Yes | ✓ Yes | ✗ No | Linux | 
| F2 | [Nitro v4](ec2-nitro-instances.md) | AMD (x86\_64) | ✗ No | ✓ Yes | ✓ Yes | ✗ No | Linux | 
| G4ad | [Nitro v3](ec2-nitro-instances.md) | AMD (x86\_64) | ✗ No | ✓ Yes | ✓ Yes | ✗ No | Windows \| Linux | 
| G4dn | [Nitro v3](ec2-nitro-instances.md) | Intel (x86\_64) | ✓ Yes | ✓ Yes | ✓ Yes | ✗ No | Windows \| Linux | 
| G5 | [Nitro v3](ec2-nitro-instances.md) | AMD (x86\_64) | ✗ No | ✓ Yes | ✓ Yes | ✗ No | Windows \| Linux | 
| G5g | [Nitro v2](ec2-nitro-instances.md) | AWS Graviton (arm64) | ✓ Yes | ✓ Yes | ✓ Yes | ✗ No | Linux | 
| G6 | [Nitro v4](ec2-nitro-instances.md) | AMD (x86\_64) | ✗ No | ✓ Yes | ✓ Yes | ✗ No | Windows \| Linux | 
| G6e | [Nitro v4](ec2-nitro-instances.md) | AMD (x86\_64) | ✗ No | ✓ Yes | ✓ Yes | ✗ No | Windows \| Linux | 
| G6f | [Nitro v4](ec2-nitro-instances.md) | AMD (x86\_64) | ✗ No | ✗ No | ✓ Yes | ✗ No | Windows \| Linux | 
| Gr6 | [Nitro v4](ec2-nitro-instances.md) | AMD (x86\_64) | ✗ No | ✗ No | ✓ Yes | ✗ No | Windows \| Linux | 
| Gr6f | [Nitro v4](ec2-nitro-instances.md) | AMD (x86\_64) | ✗ No | ✗ No | ✓ Yes | ✗ No | Windows \| Linux | 
| G7e | [Nitro v6](ec2-nitro-instances.md) | Intel (x86\_64) | ✗ No | ✓ Yes | ✓ Yes | ✗ No | Windows \| Linux | 
| Inf1 | [Nitro v3](ec2-nitro-instances.md) | Intel (x86\_64) | ✗ No | ✓ Yes | ✓ Yes | ✗ No | Linux | 
| Inf2 | [Nitro v4](ec2-nitro-instances.md) | AMD (x86\_64) | ✗ No | ✓ Yes | ✓ Yes | ✗ No | Linux | 
| P4d | [Nitro v3](ec2-nitro-instances.md) | Intel (x86\_64) | ✗ No | ✓ Yes | ✓ Yes | ✗ No | Linux | 
| P4de | [Nitro v3](ec2-nitro-instances.md) | Intel (x86\_64) | ✗ No | ✗ No | ✓ Yes | ✗ No | Linux | 
| P5 | [Nitro v4](ec2-nitro-instances.md) | AMD (x86\_64) | ✗ No | ✗ No | ✓ Yes | ✗ No | Windows (p5.4xlarge only) \| Linux 1 | 
| P5e | [Nitro v4](ec2-nitro-instances.md) | AMD (x86\_64) | ✗ No | ✗ No | ✓ Yes | ✗ No | Linux | 
| P5en | [Nitro v5](ec2-nitro-instances.md) | Intel (x86\_64) | ✗ No | ✗ No | ✓ Yes | ✗ No | Linux | 
| P6-B200 | [Nitro v6](ec2-nitro-instances.md) | Intel (x86\_64) | ✗ No | ✗ No | ✓ Yes | ✗ No | Linux | 
| P6-B300 | [Nitro v6](ec2-nitro-instances.md) | Intel (x86\_64) | ✗ No | ✗ No | ✓ Yes | ✗ No | Linux | 
| P6e-GB200 | [Nitro v5](ec2-nitro-instances.md) | NVIDIA Grace (arm64) | ✗ No | ✗ No | ✗ No | ✗ No | Linux | 
| Trn1 | [Nitro v4](ec2-nitro-instances.md) | Intel (x86\_64) | ✗ No | ✓ Yes | ✓ Yes | ✗ No | Linux | 
| Trn1n | [Nitro v4](ec2-nitro-instances.md) | Intel (x86\_64) | ✗ No | ✗ No | ✓ Yes | ✗ No | Linux | 
| Trn2 | [Nitro v5](ec2-nitro-instances.md) | Intel (x86\_64) | ✗ No | ✗ No | ✓ Yes | ✗ No | Linux | 
| Trn2u | [Nitro v5](ec2-nitro-instances.md) | Intel (x86\_64) | ✗ No | ✗ No | ✗ No | ✗ No | Linux | 
| VT1 | [Nitro v3](ec2-nitro-instances.md) | Intel (x86\_64) | ✗ No | ✓ Yes | ✓ Yes | ✗ No | Linux | 

**Note**  
1 `p5.4xlarge` supports both Windows and Linux operating systems. `p5.48xlarge` supports Linux operating systems only.

## Performance specifications
<a name="ac_hardware"></a>


<table>
<thead>
  <tr><th>Instance type</th><th>Memory (GiB)</th><th>Processor</th><th>vCPUs</th><th>CPU cores</th><th>Threads per core</th><th>Accelerators</th><th>Accelerator memory</th></tr>
</thead>
<tbody>
  <tr><td colspan="8">DL1</td></tr>
  <tr><td>dl1.24xlarge</td><td>768.00</td><td>Intel Xeon Platinum 8275CL</td><td>96</td><td>48</td><td>2</td><td>8 x Habana Gaudi HL-205 GPU</td><td>256 GiB (8 x 32 GiB)</td></tr>
  <tr><td colspan="8">DL2q</td></tr>
  <tr><td>dl2q.24xlarge</td><td>768.00</td><td>Intel Xeon Cascade Lake</td><td>96</td><td>48</td><td>2</td><td>8 x Qualcomm Qualcomm AI100 inference accelerator</td><td>125 GiB (8 x 15 GiB)</td></tr>
  <tr><td colspan="8">F2</td></tr>
  <tr><td>f2.6xlarge</td><td>256.00</td><td>AMD EPYC 7R13</td><td>24</td><td>12</td><td>2</td><td>1 x Xilinx Virtex UltraScale\+ (VU47P) FPGA</td><td>80 GiB (1 x 80 GiB)</td></tr>
  <tr><td>f2.12xlarge</td><td>512.00</td><td>AMD EPYC 7R13</td><td>48</td><td>24</td><td>2</td><td>2 x Xilinx Virtex UltraScale\+ (VU47P) FPGA</td><td>160 GiB (2 x 80 GiB)</td></tr>
  <tr><td>f2.48xlarge</td><td>2048.00</td><td>AMD EPYC 7R13</td><td>192</td><td>96</td><td>2</td><td>8 x Xilinx Virtex UltraScale\+ (VU47P) FPGA</td><td>640 GiB (8 x 80 GiB)</td></tr>
  <tr><td colspan="8">G4ad</td></tr>
  <tr><td>g4ad.xlarge</td><td>16.00</td><td>2nd Gen AMD EPYC 7R32</td><td>4</td><td>2</td><td>2</td><td>1 x AMD Radeon Pro V520 GPU</td><td>8 GiB (1 x 8 GiB)</td></tr>
  <tr><td>g4ad.2xlarge</td><td>32.00</td><td>2nd Gen AMD EPYC 7R32</td><td>8</td><td>4</td><td>2</td><td>1 x AMD Radeon Pro V520 GPU</td><td>8 GiB (1 x 8 GiB)</td></tr>
  <tr><td>g4ad.4xlarge</td><td>64.00</td><td>2nd Gen AMD EPYC 7R32</td><td>16</td><td>8</td><td>2</td><td>1 x AMD Radeon Pro V520 GPU</td><td>8 GiB (1 x 8 GiB)</td></tr>
  <tr><td>g4ad.8xlarge</td><td>128.00</td><td>2nd Gen AMD EPYC 7R32</td><td>32</td><td>16</td><td>2</td><td>2 x AMD Radeon Pro V520 GPU</td><td>16 GiB (2 x 8 GiB)</td></tr>
  <tr><td>g4ad.16xlarge</td><td>256.00</td><td>2nd Gen AMD EPYC 7R32</td><td>64</td><td>32</td><td>2</td><td>4 x AMD Radeon Pro V520 GPU</td><td>32 GiB (4 x 8 GiB)</td></tr>
  <tr><td colspan="8">G4dn</td></tr>
  <tr><td>g4dn.xlarge</td><td>16.00</td><td>Intel Xeon P-8259L</td><td>4</td><td>2</td><td>2</td><td>1 x NVIDIA T4 GPU</td><td>16 GiB (1 x 16 GiB)</td></tr>
  <tr><td>g4dn.2xlarge</td><td>32.00</td><td>Intel Xeon P-8259L</td><td>8</td><td>4</td><td>2</td><td>1 x NVIDIA T4 GPU</td><td>16 GiB (1 x 16 GiB)</td></tr>
  <tr><td>g4dn.4xlarge</td><td>64.00</td><td>Intel Xeon P-8259L</td><td>16</td><td>8</td><td>2</td><td>1 x NVIDIA T4 GPU</td><td>16 GiB (1 x 16 GiB)</td></tr>
  <tr><td>g4dn.8xlarge</td><td>128.00</td><td>Intel Xeon P-8259L</td><td>32</td><td>16</td><td>2</td><td>1 x NVIDIA T4 GPU</td><td>16 GiB (1 x 16 GiB)</td></tr>
  <tr><td>g4dn.12xlarge</td><td>192.00</td><td>Intel Xeon P-8259L</td><td>48</td><td>24</td><td>2</td><td>4 x NVIDIA T4 GPU</td><td>64 GiB (4 x 16 GiB)</td></tr>
  <tr><td>g4dn.16xlarge</td><td>256.00</td><td>Intel Xeon P-8259L</td><td>64</td><td>32</td><td>2</td><td>1 x NVIDIA T4 GPU</td><td>16 GiB (1 x 16 GiB)</td></tr>
  <tr><td>g4dn.metal</td><td>384.00</td><td>Intel Xeon P-8259L</td><td>96</td><td>48</td><td>2</td><td>8 x NVIDIA T4 GPU</td><td>128 GiB (8 x 16 GiB)</td></tr>
  <tr><td colspan="8">G5</td></tr>
  <tr><td>g5.xlarge</td><td>16.00</td><td>2nd Gen AMD EPYC 7R32</td><td>4</td><td>2</td><td>2</td><td>1 x NVIDIA A10G GPU</td><td>22 GiB (1 x 22 GiB)</td></tr>
  <tr><td>g5.2xlarge</td><td>32.00</td><td>2nd Gen AMD EPYC 7R32</td><td>8</td><td>4</td><td>2</td><td>1 x NVIDIA A10G GPU</td><td>22 GiB (1 x 22 GiB)</td></tr>
  <tr><td>g5.4xlarge</td><td>64.00</td><td>2nd Gen AMD EPYC 7R32</td><td>16</td><td>8</td><td>2</td><td>1 x NVIDIA A10G GPU</td><td>22 GiB (1 x 22 GiB)</td></tr>
  <tr><td>g5.8xlarge</td><td>128.00</td><td>2nd Gen AMD EPYC 7R32</td><td>32</td><td>16</td><td>2</td><td>1 x NVIDIA A10G GPU</td><td>22 GiB (1 x 22 GiB)</td></tr>
  <tr><td>g5.12xlarge</td><td>192.00</td><td>2nd Gen AMD EPYC 7R32</td><td>48</td><td>24</td><td>2</td><td>4 x NVIDIA A10G GPU</td><td>89 GiB (4 x 22 GiB)</td></tr>
  <tr><td>g5.16xlarge</td><td>256.00</td><td>2nd Gen AMD EPYC 7R32</td><td>64</td><td>32</td><td>2</td><td>1 x NVIDIA A10G GPU</td><td>22 GiB (1 x 22 GiB)</td></tr>
  <tr><td>g5.24xlarge</td><td>384.00</td><td>2nd Gen AMD EPYC 7R32</td><td>96</td><td>48</td><td>2</td><td>4 x NVIDIA A10G GPU</td><td>89 GiB (4 x 22 GiB)</td></tr>
  <tr><td>g5.48xlarge</td><td>768.00</td><td>2nd Gen AMD EPYC 7R32</td><td>192</td><td>96</td><td>2</td><td>8 x NVIDIA A10G GPU</td><td>178 GiB (8 x 22 GiB)</td></tr>
  <tr><td colspan="8">G5g</td></tr>
  <tr><td>g5g.xlarge</td><td>8.00</td><td>AWS Graviton2 Processor</td><td>4</td><td>4</td><td>1</td><td>1 x NVIDIA T4g GPU</td><td>16 GiB (1 x 16 GiB)</td></tr>
  <tr><td>g5g.2xlarge</td><td>16.00</td><td>AWS Graviton2 Processor</td><td>8</td><td>8</td><td>1</td><td>1 x NVIDIA T4g GPU</td><td>16 GiB (1 x 16 GiB)</td></tr>
  <tr><td>g5g.4xlarge</td><td>32.00</td><td>AWS Graviton2 Processor</td><td>16</td><td>16</td><td>1</td><td>1 x NVIDIA T4g GPU</td><td>16 GiB (1 x 16 GiB)</td></tr>
  <tr><td>g5g.8xlarge</td><td>64.00</td><td>AWS Graviton2 Processor</td><td>32</td><td>32</td><td>1</td><td>1 x NVIDIA T4g GPU</td><td>16 GiB (1 x 16 GiB)</td></tr>
  <tr><td>g5g.16xlarge</td><td>128.00</td><td>AWS Graviton2 Processor</td><td>64</td><td>64</td><td>1</td><td>2 x NVIDIA T4g GPU</td><td>32 GiB (2 x 16 GiB)</td></tr>
  <tr><td>g5g.metal</td><td>128.00</td><td>AWS Graviton2 Processor</td><td>64</td><td>64</td><td>1</td><td>2 x NVIDIA T4g GPU</td><td>32 GiB (2 x 16 GiB)</td></tr>
  <tr><td colspan="8">G6</td></tr>
  <tr><td>g6.xlarge</td><td>16.00</td><td>AMD EPYC 7R13</td><td>4</td><td>2</td><td>2</td><td>1 x NVIDIA L4 GPU</td><td>22 GiB (1 x 22 GiB)</td></tr>
  <tr><td>g6.2xlarge</td><td>32.00</td><td>AMD EPYC 7R13</td><td>8</td><td>4</td><td>2</td><td>1 x NVIDIA L4 GPU</td><td>22 GiB (1 x 22 GiB)</td></tr>
  <tr><td>g6.4xlarge</td><td>64.00</td><td>AMD EPYC 7R13</td><td>16</td><td>8</td><td>2</td><td>1 x NVIDIA L4 GPU</td><td>22 GiB (1 x 22 GiB)</td></tr>
  <tr><td>g6.8xlarge</td><td>128.00</td><td>AMD EPYC 7R13</td><td>32</td><td>16</td><td>2</td><td>1 x NVIDIA L4 GPU</td><td>22 GiB (1 x 22 GiB)</td></tr>
  <tr><td>g6.12xlarge</td><td>192.00</td><td>AMD EPYC 7R13</td><td>48</td><td>24</td><td>2</td><td>4 x NVIDIA L4 GPU</td><td>89 GiB (4 x 22 GiB)</td></tr>
  <tr><td>g6.16xlarge</td><td>256.00</td><td>AMD EPYC 7R13</td><td>64</td><td>32</td><td>2</td><td>1 x NVIDIA L4 GPU</td><td>22 GiB (1 x 22 GiB)</td></tr>
  <tr><td>g6.24xlarge</td><td>384.00</td><td>AMD EPYC 7R13</td><td>96</td><td>48</td><td>2</td><td>4 x NVIDIA L4 GPU</td><td>89 GiB (4 x 22 GiB)</td></tr>
  <tr><td>g6.48xlarge</td><td>768.00</td><td>AMD EPYC 7R13</td><td>192</td><td>96</td><td>2</td><td>8 x NVIDIA L4 GPU</td><td>178 GiB (8 x 22 GiB)</td></tr>
  <tr><td colspan="8">G6e</td></tr>
  <tr><td>g6e.xlarge</td><td>32.00</td><td>AMD EPYC 7R13</td><td>4</td><td>2</td><td>2</td><td>1 x NVIDIA L40S GPU</td><td>44 GiB (1 x 44 GiB)</td></tr>
  <tr><td>g6e.2xlarge</td><td>64.00</td><td>AMD EPYC 7R13</td><td>8</td><td>4</td><td>2</td><td>1 x NVIDIA L40S GPU</td><td>44 GiB (1 x 44 GiB)</td></tr>
  <tr><td>g6e.4xlarge</td><td>128.00</td><td>AMD EPYC 7R13</td><td>16</td><td>8</td><td>2</td><td>1 x NVIDIA L40S GPU</td><td>44 GiB (1 x 44 GiB)</td></tr>
  <tr><td>g6e.8xlarge</td><td>256.00</td><td>AMD EPYC 7R13</td><td>32</td><td>16</td><td>2</td><td>1 x NVIDIA L40S GPU</td><td>44 GiB (1 x 44 GiB)</td></tr>
  <tr><td>g6e.12xlarge</td><td>384.00</td><td>AMD EPYC 7R13</td><td>48</td><td>24</td><td>2</td><td>4 x NVIDIA L40S GPU</td><td>178 GiB (4 x 44 GiB)</td></tr>
  <tr><td>g6e.16xlarge</td><td>512.00</td><td>AMD EPYC 7R13</td><td>64</td><td>32</td><td>2</td><td>1 x NVIDIA L40S GPU</td><td>44 GiB (1 x 44 GiB)</td></tr>
  <tr><td>g6e.24xlarge</td><td>768.00</td><td>AMD EPYC 7R13</td><td>96</td><td>48</td><td>2</td><td>4 x NVIDIA L40S GPU</td><td>178 GiB (4 x 44 GiB)</td></tr>
  <tr><td>g6e.48xlarge</td><td>1536.00</td><td>AMD EPYC 7R13</td><td>192</td><td>96</td><td>2</td><td>8 x NVIDIA L40S GPU</td><td>357 GiB (8 x 44 GiB)</td></tr>
  <tr><td colspan="8">G6f</td></tr>
  <tr><td>g6f.large</td><td>8.00</td><td>AMD EPYC 7R13</td><td>2</td><td>1</td><td>2</td><td>0.125 x NVIDIA L4 GPU</td><td>2.79 GiB</td></tr>
  <tr><td>g6f.xlarge</td><td>16.00</td><td>AMD EPYC 7R13</td><td>4</td><td>2</td><td>2</td><td>0.125 x NVIDIA L4 GPU</td><td>2.79 GiB</td></tr>
  <tr><td>g6f.2xlarge</td><td>32.00</td><td>AMD EPYC 7R13</td><td>8</td><td>4</td><td>2</td><td>0.25 x NVIDIA L4 GPU</td><td>5.59 GiB</td></tr>
  <tr><td>g6f.4xlarge</td><td>64.00</td><td>AMD EPYC 7R13</td><td>16</td><td>8</td><td>2</td><td>0.5 x NVIDIA L4 GPU</td><td>11.18 GiB</td></tr>
  <tr><td colspan="8">Gr6</td></tr>
  <tr><td>gr6.4xlarge</td><td>128.00</td><td>AMD EPYC 7R13</td><td>16</td><td>8</td><td>2</td><td>1 x NVIDIA L4 GPU</td><td>22 GiB (1 x 22 GiB)</td></tr>
  <tr><td>gr6.8xlarge</td><td>256.00</td><td>AMD EPYC 7R13</td><td>32</td><td>16</td><td>2</td><td>1 x NVIDIA L4 GPU</td><td>22 GiB (1 x 22 GiB)</td></tr>
  <tr><td colspan="8">Gr6f</td></tr>
  <tr><td>gr6f.4xlarge</td><td>128.00</td><td>AMD EPYC 7R13</td><td>16</td><td>8</td><td>2</td><td>0.5 x NVIDIA L4 GPU</td><td>11.18 GiB</td></tr>
  <tr><td colspan="8">G7e</td></tr>
  <tr><td>g7e.2xlarge</td><td>64.00</td><td>Intel Xeon Emerald Rapids</td><td>8</td><td>4</td><td>2</td><td>1 x NVIDIA RTX PRO Server 6000 GPU</td><td>96 GiB (1 x 96 GiB)</td></tr>
  <tr><td>g7e.4xlarge</td><td>128.00</td><td>Intel Xeon Emerald Rapids</td><td>16</td><td>8</td><td>2</td><td>1 x NVIDIA RTX PRO Server 6000 GPU</td><td>96 GiB (1 x 96 GiB)</td></tr>
  <tr><td>g7e.8xlarge</td><td>256.00</td><td>Intel Xeon Emerald Rapids</td><td>32</td><td>16</td><td>2</td><td>1 x NVIDIA RTX PRO Server 6000 GPU</td><td>96 GiB (1 x 96 GiB)</td></tr>
  <tr><td>g7e.12xlarge</td><td>512.00</td><td>Intel Xeon Emerald Rapids</td><td>48</td><td>24</td><td>2</td><td>2 x NVIDIA RTX PRO Server 6000 GPU</td><td>192 GiB (2 x 96 GiB)</td></tr>
  <tr><td>g7e.24xlarge</td><td>1024.00</td><td>Intel Xeon Emerald Rapids</td><td>96</td><td>48</td><td>2</td><td>4 x NVIDIA RTX PRO Server 6000 GPU</td><td>384 GiB (4 x 96 GiB)</td></tr>
  <tr><td>g7e.48xlarge</td><td>2048.00</td><td>Intel Xeon Emerald Rapids</td><td>192</td><td>96</td><td>2</td><td>8 x NVIDIA RTX PRO Server 6000 GPU</td><td>768 GiB (8 x 96 GiB)</td></tr>
  <tr><td colspan="8">Inf1</td></tr>
  <tr><td>inf1.xlarge</td><td>8.00</td><td>Intel Xeon P-8259L</td><td>4</td><td>2</td><td>2</td><td>1 x AWS Inferentia inference accelerator</td><td>8 GiB (1 x 8 GiB)</td></tr>
  <tr><td>inf1.2xlarge</td><td>16.00</td><td>Intel Xeon P-8259L</td><td>8</td><td>4</td><td>2</td><td>1 x AWS Inferentia inference accelerator</td><td>8 GiB (1 x 8 GiB)</td></tr>
  <tr><td>inf1.6xlarge</td><td>48.00</td><td>Intel Xeon P-8259L</td><td>24</td><td>12</td><td>2</td><td>4 x AWS Inferentia inference accelerator</td><td>32 GiB (4 x 8 GiB)</td></tr>
  <tr><td>inf1.24xlarge</td><td>192.00</td><td>Intel Xeon P-8259L</td><td>96</td><td>48</td><td>2</td><td>16 x AWS Inferentia inference accelerator</td><td>128 GiB (16 x 8 GiB)</td></tr>
  <tr><td colspan="8">Inf2</td></tr>
  <tr><td>inf2.xlarge</td><td>16.00</td><td>AMD EPYC 7R13</td><td>4</td><td>2</td><td>2</td><td>1 x AWS Inferentia2 inference accelerator</td><td>32 GiB (1 x 32 GiB)</td></tr>
  <tr><td>inf2.8xlarge</td><td>128.00</td><td>AMD EPYC 7R13</td><td>32</td><td>16</td><td>2</td><td>1 x AWS Inferentia2 inference accelerator</td><td>32 GiB (1 x 32 GiB)</td></tr>
  <tr><td>inf2.24xlarge</td><td>384.00</td><td>AMD EPYC 7R13</td><td>96</td><td>48</td><td>2</td><td>6 x AWS Inferentia2 inference accelerator</td><td>192 GiB (6 x 32 GiB)</td></tr>
  <tr><td>inf2.48xlarge</td><td>768.00</td><td>AMD EPYC 7R13</td><td>192</td><td>96</td><td>2</td><td>12 x AWS Inferentia2 inference accelerator</td><td>384 GiB (12 x 32 GiB)</td></tr>
  <tr><td colspan="8">P4d</td></tr>
  <tr><td>p4d.24xlarge</td><td>1152.00</td><td>Intel Xeon Platinum 8275CL</td><td>96</td><td>48</td><td>2</td><td>8 x NVIDIA A100 GPU</td><td>320 GiB (8 x 40 GiB)</td></tr>
  <tr><td colspan="8">P4de</td></tr>
  <tr><td>p4de.24xlarge</td><td>1152.00</td><td>Intel Xeon Platinum 8275CL</td><td>96</td><td>48</td><td>2</td><td>8 x NVIDIA A100 GPU</td><td>640 GiB (8 x 80 GiB)</td></tr>
  <tr><td colspan="8">P5</td></tr>
  <tr><td>p5.4xlarge</td><td>256.00</td><td>AMD EPYC 7R13</td><td>16</td><td>8</td><td>2</td><td>1 x NVIDIA H100 GPU</td><td>80 GiB (1 x 80 GiB)</td></tr>
  <tr><td>p5.48xlarge</td><td>2048.00</td><td>AMD EPYC 7R13</td><td>192</td><td>96</td><td>2</td><td>8 x NVIDIA H100 GPU</td><td>640 GiB (8 x 80 GiB)</td></tr>
  <tr><td colspan="8">P5e</td></tr>
  <tr><td>p5e.48xlarge</td><td>2048.00</td><td>AMD EPYC 7R13</td><td>192</td><td>96</td><td>2</td><td>8 x NVIDIA H200 GPU</td><td>1128 GiB (8 x 141 GiB)</td></tr>
  <tr><td colspan="8">P5en</td></tr>
  <tr><td>p5en.48xlarge</td><td>2048.00</td><td>Intel Xeon Sapphire Rapids</td><td>192</td><td>96</td><td>2</td><td>8 x NVIDIA H200 GPU</td><td>1128 GiB (8 x 141 GiB)</td></tr>
  <tr><td colspan="8">P6-B200</td></tr>
  <tr><td>p6-b200.48xlarge</td><td>2048.00</td><td>Intel Xeon Emerald Rapids</td><td>192</td><td>96</td><td>2</td><td>8 x NVIDIA B200 GPU</td><td>1432 GiB (8 x 179 GiB)</td></tr>
  <tr><td colspan="8">P6-B300</td></tr>
  <tr><td>p6-b300.48xlarge</td><td>4096.00</td><td>Intel Xeon Emerald Rapids</td><td>192</td><td>96</td><td>2</td><td>8 x NVIDIA B300 GPU</td><td>2148 GiB (8 x 268 GiB)</td></tr>
  <tr><td colspan="8">P6e-GB200</td></tr>
  <tr><td>p6e-gb200.36xlarge</td><td>960.00</td><td>Nvidia Grace CPU</td><td>144</td><td>144</td><td>1</td><td>4 x NVIDIA B200 GPU</td><td>740 GiB (4 x 185 GiB)</td></tr>
  <tr><td colspan="8">Trn1</td></tr>
  <tr><td>trn1.2xlarge</td><td>32.00</td><td>Intel Xeon Ice Lake 8375C</td><td>8</td><td>4</td><td>2</td><td>1 x AWS Trainium accelerators</td><td>32 GiB (1 x 32 GiB)</td></tr>
  <tr><td>trn1.32xlarge</td><td>512.00</td><td>Intel Xeon Ice Lake 8375C</td><td>128</td><td>64</td><td>2</td><td>16 x AWS Trainium accelerators</td><td>512 GiB (16 x 32 GiB)</td></tr>
  <tr><td colspan="8">Trn1n</td></tr>
  <tr><td>trn1n.32xlarge</td><td>512.00</td><td>Intel Xeon Ice Lake</td><td>128</td><td>64</td><td>2</td><td>16 x AWS Trainium accelerators</td><td>512 GiB (16 x 32 GiB)</td></tr>
  <tr><td colspan="8">Trn2</td></tr>
  <tr><td>trn2.3xlarge</td><td>128.00</td><td>Intel Xeon Sapphire Rapids</td><td>12</td><td>6</td><td>2</td><td>1 x AWS Trainium2 accelerators</td><td>512 GiB (1 x 512 GiB)</td></tr>
  <tr><td>trn2.48xlarge</td><td>2048.00</td><td>Intel Xeon Sapphire Rapids</td><td>192</td><td>96</td><td>2</td><td>16 x AWS Trainium2 accelerators</td><td>8192 GiB (16 x 512 GiB)</td></tr>
  <tr><td colspan="8">Trn2u</td></tr>
  <tr><td>trn2u.48xlarge</td><td>2048.00</td><td>Intel Xeon Sapphire Rapids</td><td>192</td><td>96</td><td>2</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="8">VT1</td></tr>
  <tr><td>vt1.3xlarge</td><td>24.00</td><td>Intel Cascade Lake P-8259CL</td><td>12</td><td>6</td><td>2</td><td>1 x Xilinx U30 media accelerator</td><td>24 GiB (1 x 24 GiB)</td></tr>
  <tr><td>vt1.6xlarge</td><td>48.00</td><td>Intel Cascade Lake P-8259CL</td><td>24</td><td>12</td><td>2</td><td>2 x Xilinx U30 media accelerator</td><td>48 GiB (2 x 24 GiB)</td></tr>
  <tr><td>vt1.24xlarge</td><td>192.00</td><td>Intel Cascade Lake P-8259CL</td><td>96</td><td>48</td><td>2</td><td>8 x Xilinx U30 media accelerator</td><td>192 GiB (8 x 24 GiB)</td></tr>
</tbody>
</table>


## Network specifications
<a name="ac_network"></a>


<table>
<thead>
  <tr><th>Instance type</th><th>Baseline / Burst bandwidth (Gbps)</th><th>EFA</th><th>ENA</th><th>ENA Express</th><th>Network cards</th><th>Max. network interfaces</th><th>IP addresses per interface</th><th>IPv6</th></tr>
</thead>
<tbody>
  <tr><td colspan="9">DL1</td></tr>
  <tr><td>dl1.24xlarge</td><td>4x 100 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>4</td><td>60</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">DL2q</td></tr>
  <tr><td>dl2q.24xlarge</td><td>100 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">F2</td></tr>
  <tr><td>f2.6xlarge</td><td>12.5 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>f2.12xlarge</td><td>25 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>f2.48xlarge</td><td>100 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">G4ad</td></tr>
  <tr><td>g4ad.xlarge 1</td><td>2.0 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>2</td><td>4</td><td>✓ Yes</td></tr>
  <tr><td>g4ad.2xlarge 1</td><td>4.167 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>2</td><td>4</td><td>✓ Yes</td></tr>
  <tr><td>g4ad.4xlarge 1</td><td>8.333 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>g4ad.8xlarge</td><td>15 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>g4ad.16xlarge</td><td>25 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">G4dn</td></tr>
  <tr><td>g4dn.xlarge 1</td><td>5.0 / 25.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>g4dn.2xlarge 1</td><td>10.0 / 25.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>g4dn.4xlarge 1</td><td>20.0 / 25.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>3</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>g4dn.8xlarge</td><td>50 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>g4dn.12xlarge</td><td>50 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>g4dn.16xlarge</td><td>50 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>g4dn.metal</td><td>100 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">G5</td></tr>
  <tr><td>g5.xlarge 1</td><td>2.5 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>g5.2xlarge 1</td><td>5.0 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>g5.4xlarge 1</td><td>10.0 / 25.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>g5.8xlarge</td><td>25 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>g5.12xlarge</td><td>40 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>g5.16xlarge</td><td>25 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>g5.24xlarge</td><td>50 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>g5.48xlarge</td><td>100 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>7</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">G5g</td></tr>
  <tr><td>g5g.xlarge 1</td><td>1.25 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>g5g.2xlarge 1</td><td>2.5 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>g5g.4xlarge 1</td><td>5.0 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>g5g.8xlarge</td><td>12 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>g5g.16xlarge</td><td>25 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>g5g.metal</td><td>25 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">G6</td></tr>
  <tr><td>g6.xlarge 1</td><td>2.5 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>g6.2xlarge 1</td><td>5.0 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>g6.4xlarge 1</td><td>10.0 / 25.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>g6.8xlarge</td><td>25 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>g6.12xlarge</td><td>40 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>g6.16xlarge</td><td>25 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>g6.24xlarge</td><td>50 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>g6.48xlarge</td><td>100 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">G6e</td></tr>
  <tr><td>g6e.xlarge 1</td><td>2.5 / 20.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>g6e.2xlarge 1</td><td>5.0 / 20.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>g6e.4xlarge</td><td>20 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>g6e.8xlarge</td><td>25 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>g6e.12xlarge</td><td>100 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>10</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>g6e.16xlarge</td><td>35 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>g6e.24xlarge</td><td>200 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>2</td><td>20</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>g6e.48xlarge</td><td>400 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>4</td><td>40</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">G6f</td></tr>
  <tr><td>g6f.large 1</td><td>1.5 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>2</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>g6f.xlarge 1</td><td>2.5 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>g6f.2xlarge 1</td><td>5.0 / 10.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>g6f.4xlarge 1</td><td>10.0 / 25.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">Gr6</td></tr>
  <tr><td>gr6.4xlarge 1</td><td>10.0 / 25.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>gr6.8xlarge</td><td>25 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">Gr6f</td></tr>
  <tr><td>gr6f.4xlarge 1</td><td>10.0 / 25.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">G7e</td></tr>
  <tr><td>g7e.2xlarge</td><td>50 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>g7e.4xlarge</td><td>50 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>g7e.8xlarge</td><td>100 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>g7e.12xlarge</td><td>400 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>10</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>g7e.24xlarge</td><td>800 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>2</td><td>20</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td>g7e.48xlarge</td><td>1600 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>4</td><td>40</td><td>64</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">Inf1</td></tr>
  <tr><td>inf1.xlarge 1</td><td>5.0 / 25.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>inf1.2xlarge 1</td><td>5.0 / 25.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>10</td><td>✓ Yes</td></tr>
  <tr><td>inf1.6xlarge</td><td>25 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>inf1.24xlarge</td><td>100 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>11</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">Inf2</td></tr>
  <tr><td>inf2.xlarge 1</td><td>2.083 / 15.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>inf2.8xlarge 1</td><td>16.667 / 25.0</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>inf2.24xlarge</td><td>50 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td>inf2.48xlarge</td><td>100 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">P4d</td></tr>
  <tr><td>p4d.24xlarge</td><td>4x 100 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>4</td><td>60</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">P4de</td></tr>
  <tr><td>p4de.24xlarge</td><td>4x 100 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>4</td><td>60</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">P5</td></tr>
  <tr><td>p5.4xlarge</td><td>100 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>1</td><td>4</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>p5.48xlarge</td><td>3200 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>32</td><td>64</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">P5e</td></tr>
  <tr><td>p5e.48xlarge</td><td>3200 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>32</td><td>64</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">P5en</td></tr>
  <tr><td>p5en.48xlarge</td><td>3200 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>16</td><td>64</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">P6-B200</td></tr>
  <tr><td>p6-b200.48xlarge</td><td>3200 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>8</td><td>32</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">P6-B300</td></tr>
  <tr><td>p6-b300.48xlarge</td><td>6400 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>17</td><td>68</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">P6e-GB200</td></tr>
  <tr><td>p6e-gb200.36xlarge</td><td>3200 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>17</td><td>39</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">Trn1</td></tr>
  <tr><td>trn1.2xlarge 1</td><td>3.125 / 12.5</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>trn1.32xlarge</td><td>8x 100 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>8</td><td>40</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">Trn1n</td></tr>
  <tr><td>trn1n.32xlarge</td><td>16x 100 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>16</td><td>80</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">Trn2</td></tr>
  <tr><td>trn2.3xlarge</td><td>200 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>2</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>trn2.48xlarge</td><td>16x 200 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>16</td><td>32</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">Trn2u</td></tr>
  <tr><td>trn2u.48xlarge</td><td>16x 200 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>16</td><td>32</td><td>50</td><td>✓ Yes</td></tr>
  <tr><td colspan="9">VT1</td></tr>
  <tr><td>vt1.3xlarge</td><td>3.12 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>4</td><td>15</td><td>✓ Yes</td></tr>
  <tr><td>vt1.6xlarge</td><td>6.25 Gigabit</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>8</td><td>30</td><td>✓ Yes</td></tr>
  <tr><td>vt1.24xlarge</td><td>25 Gigabit</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>1</td><td>15</td><td>50</td><td>✓ Yes</td></tr>
</tbody>
</table>


**Note**  
1 These instances have a baseline bandwidth and can use a network I/O credit mechanism to burst beyond their baseline bandwidth on a best effort basis. Other instances types can sustain their maximum performance indefinitely. For more information, see [ instance network bandwidth](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-instance-network-bandwidth.html).

## Amazon EBS specifications
<a name="ac_storage-ebs"></a>

The following table indicates which instance types are Amazon EBS optimized by default and which optionally support it. It also describes their EBS-optimized performance, including dedicated bandwidth to Amazon EBS, the typical maximum aggregate throughput that can be achieved on that dedicated connection with a streaming read workload and 128 KiB I/O size, and the maximum IOPS the instance type can support when using a 16 KiB I/O size. Instance types not listed do not support Amazon EBS optimization.

**Important**  
An instance's EBS performance is bounded by the instance's performance limits, or the aggregated performance of its attached volumes, whichever is smaller. To achieve maximum EBS performance, an instance must have attached volumes that provide a combined performance equal to or greater than the maximum instance performance. For example, to achieve `80,000` IOPS for `r6i.16xlarge`, the instance must have at least `5` `gp3` volumes provisioned with `16,000` IOPS each (`5` volumes x `16,000` IOPS = `80,000` IOPS).  
We recommend that you choose an EBS–optimized instance type that provides more dedicated Amazon EBS throughput than your application needs; otherwise, the connection between Amazon EBS and Amazon EC2 can become a performance bottleneck.


<table>
<thead>
  <tr><th>Instance type</th><th>Baseline / Maximum bandwidth (Mbps)</th><th>Baseline / Maximum throughput (MB/s, 128 KiB I/O)</th><th>Baseline / Maximum IOPS (16 KiB I/O)</th><th>NVMe</th><th>Multiple EBS cards</th><th>EBS volume limit</th></tr>
</thead>
<tbody>
  <tr><td colspan="7">DL1</td></tr>
  <tr><td>dl1.24xlarge</td><td>19000.00</td><td>2375.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 28 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td colspan="7">DL2q</td></tr>
  <tr><td>dl2q.24xlarge</td><td>19000.00</td><td>2375.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 19 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td colspan="7">F2</td></tr>
  <tr><td>f2.6xlarge</td><td>7500.00</td><td>937.50</td><td>30000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>f2.12xlarge</td><td>15000.00</td><td>1875.00</td><td>60000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>f2.48xlarge</td><td>60000.00</td><td>7500.00</td><td>240000.00</td><td>✓ Yes</td><td>✗ No</td><td>128 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td colspan="7">G4ad</td></tr>
  <tr><td>g4ad.xlarge 1</td><td>400.00 / 3170.00</td><td>50.00 / 396.25</td><td>1700.00 / 13333.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 25 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>g4ad.2xlarge 1</td><td>800.00 / 3170.00</td><td>100.00 / 396.25</td><td>3400.00 / 13333.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 25 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>g4ad.4xlarge 1</td><td>1580.00 / 3170.00</td><td>197.50 / 396.25</td><td>6700.00 / 13333.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 25 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>g4ad.8xlarge</td><td>3170.00</td><td>396.25</td><td>13333.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 24 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>g4ad.16xlarge</td><td>6300.00</td><td>787.50</td><td>26667.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 21 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td colspan="7">G4dn</td></tr>
  <tr><td>g4dn.xlarge 1</td><td>950.00 / 3500.00</td><td>118.75 / 437.50</td><td>3000.00 / 20000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 25 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>g4dn.2xlarge 1</td><td>1150.00 / 3500.00</td><td>143.75 / 437.50</td><td>6000.00 / 20000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 25 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>g4dn.4xlarge</td><td>4750.00</td><td>593.75</td><td>20000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 25 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>g4dn.8xlarge</td><td>9500.00</td><td>1187.50</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 25 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>g4dn.12xlarge</td><td>9500.00</td><td>1187.50</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 22 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>g4dn.16xlarge</td><td>9500.00</td><td>1187.50</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 25 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>g4dn.metal</td><td>19000.00</td><td>2375.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 31 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td colspan="7">G5</td></tr>
  <tr><td>g5.xlarge 1</td><td>700.00 / 3500.00</td><td>87.50 / 437.50</td><td>3000.00 / 15000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 25 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>g5.2xlarge 1</td><td>850.00 / 3500.00</td><td>106.25 / 437.50</td><td>3500.00 / 15000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 25 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>g5.4xlarge</td><td>4750.00</td><td>593.75</td><td>20000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 25 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>g5.8xlarge</td><td>16000.00</td><td>2000.00</td><td>65000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 25 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>g5.12xlarge</td><td>16000.00</td><td>2000.00</td><td>65000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 22 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>g5.16xlarge</td><td>16000.00</td><td>2000.00</td><td>65000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 25 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>g5.24xlarge</td><td>19000.00</td><td>2375.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 22 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>g5.48xlarge</td><td>19000.00</td><td>2375.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 9 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td colspan="7">G5g</td></tr>
  <tr><td>g5g.xlarge 1</td><td>1188.00 / 4750.00</td><td>148.50 / 593.75</td><td>6000.00 / 20000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>g5g.2xlarge 1</td><td>2375.00 / 4750.00</td><td>296.88 / 593.75</td><td>12000.00 / 20000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>g5g.4xlarge</td><td>4750.00</td><td>593.75</td><td>20000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>g5g.8xlarge</td><td>9500.00</td><td>1187.50</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>g5g.16xlarge</td><td>19000.00</td><td>2375.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 25 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>g5g.metal</td><td>19000.00</td><td>2375.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 31 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td colspan="7">G6</td></tr>
  <tr><td>g6.xlarge 1</td><td>1000.00 / 5000.00</td><td>125.00 / 625.00</td><td>4000.00 / 20000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>g6.2xlarge 1</td><td>2000.00 / 5000.00</td><td>250.00 / 625.00</td><td>8000.00 / 20000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>g6.4xlarge</td><td>8000.00</td><td>1000.00</td><td>32000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>g6.8xlarge</td><td>16000.00</td><td>2000.00</td><td>64000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>g6.12xlarge</td><td>20000.00</td><td>2500.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>g6.16xlarge</td><td>20000.00</td><td>2500.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>48 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>g6.24xlarge</td><td>30000.00</td><td>3750.00</td><td>120000.00</td><td>✓ Yes</td><td>✗ No</td><td>64 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>g6.48xlarge</td><td>60000.00</td><td>7500.00</td><td>240000.00</td><td>✓ Yes</td><td>✗ No</td><td>128 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td colspan="7">G6e</td></tr>
  <tr><td>g6e.xlarge 1</td><td>1000.00 / 5000.00</td><td>125.00 / 625.00</td><td>4000.00 / 20000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>g6e.2xlarge 1</td><td>2000.00 / 5000.00</td><td>250.00 / 625.00</td><td>8000.00 / 20000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>g6e.4xlarge</td><td>8000.00</td><td>1000.00</td><td>32000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>g6e.8xlarge</td><td>16000.00</td><td>2000.00</td><td>64000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>g6e.12xlarge</td><td>20000.00</td><td>2500.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>g6e.16xlarge</td><td>20000.00</td><td>2500.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>48 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>g6e.24xlarge</td><td>30000.00</td><td>3750.00</td><td>120000.00</td><td>✓ Yes</td><td>✗ No</td><td>64 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>g6e.48xlarge</td><td>60000.00</td><td>7500.00</td><td>240000.00</td><td>✓ Yes</td><td>✗ No</td><td>128 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td colspan="7">G6f</td></tr>
  <tr><td>g6f.large 1</td><td>936.00 / 5000.00</td><td>117.00 / 625.00</td><td>3750.00 / 20000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>g6f.xlarge 1</td><td>1000.00 / 5000.00</td><td>125.00 / 625.00</td><td>4000.00 / 20000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>g6f.2xlarge 1</td><td>2000.00 / 5000.00</td><td>250.00 / 625.00</td><td>8000.00 / 20000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>g6f.4xlarge</td><td>6000.00</td><td>750.00</td><td>24000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td colspan="7">Gr6</td></tr>
  <tr><td>gr6.4xlarge</td><td>8000.00</td><td>1000.00</td><td>32000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>gr6.8xlarge</td><td>16000.00</td><td>2000.00</td><td>64000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td colspan="7">Gr6f</td></tr>
  <tr><td>gr6f.4xlarge</td><td>8000.00</td><td>1000.00</td><td>32000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td colspan="7">G7e</td></tr>
  <tr><td>g7e.2xlarge 1</td><td>2000.00 / 5000.00</td><td>250.00 / 625.00</td><td>8000.00 / 20000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>g7e.4xlarge</td><td>8000.00</td><td>1000.00</td><td>32000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>g7e.8xlarge</td><td>16000.00</td><td>2000.00</td><td>64000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>g7e.12xlarge</td><td>25000.00</td><td>3125.00</td><td>100000.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>g7e.24xlarge</td><td>50000.00</td><td>6250.00</td><td>200000.00</td><td>✓ Yes</td><td>✗ No</td><td>64 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>g7e.48xlarge</td><td>100000.00</td><td>12500.00</td><td>400000.00</td><td>✓ Yes</td><td>✗ No</td><td>128 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td colspan="7">Inf1</td></tr>
  <tr><td>inf1.xlarge 1</td><td>1190.00 / 4750.00</td><td>148.75 / 593.75</td><td>4000.00 / 20000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>inf1.2xlarge 1</td><td>1190.00 / 4750.00</td><td>148.75 / 593.75</td><td>6000.00 / 20000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>inf1.6xlarge</td><td>4750.00</td><td>593.75</td><td>20000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 23 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>inf1.24xlarge</td><td>19000.00</td><td>2375.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 11 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td colspan="7">Inf2</td></tr>
  <tr><td>inf2.xlarge 1</td><td>1250.00 / 10000.00</td><td>156.25 / 1250.00</td><td>6000.00 / 40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>inf2.8xlarge</td><td>10000.00</td><td>1250.00</td><td>40000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 26 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>inf2.24xlarge</td><td>30000.00</td><td>3750.00</td><td>120000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 28 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>inf2.48xlarge</td><td>60000.00</td><td>7500.00</td><td>240000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 28 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td colspan="7">P4d</td></tr>
  <tr><td>p4d.24xlarge</td><td>19000.00</td><td>2375.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>28 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td colspan="7">P4de</td></tr>
  <tr><td>p4de.24xlarge</td><td>19000.00</td><td>2375.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>28 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td colspan="7">P5</td></tr>
  <tr><td>p5.4xlarge</td><td>10000.00</td><td>1250.00</td><td>32500.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>p5.48xlarge</td><td>80000.00</td><td>10000.00</td><td>260000.00</td><td>✓ Yes</td><td>✗ No</td><td>64 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td colspan="7">P5e</td></tr>
  <tr><td>p5e.48xlarge</td><td>80000.00</td><td>10000.00</td><td>260000.00</td><td>✓ Yes</td><td>✗ No</td><td>64 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td colspan="7">P5en</td></tr>
  <tr><td>p5en.48xlarge</td><td>100000.00</td><td>12500.00</td><td>400000.00</td><td>✓ Yes</td><td>✗ No</td><td>64 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td colspan="7">P6-B200</td></tr>
  <tr><td>p6-b200.48xlarge</td><td>100000.00</td><td>12500.00</td><td>400000.00</td><td>✓ Yes</td><td>✗ No</td><td>64 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td colspan="7">P6-B300</td></tr>
  <tr><td>p6-b300.48xlarge</td><td>100000.00</td><td>12500.00</td><td>400000.00</td><td>✓ Yes</td><td>✗ No</td><td>64 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td colspan="7">P6e-GB200</td></tr>
  <tr><td>p6e-gb200.36xlarge</td><td>60000.00</td><td>7500.00</td><td>240000.00</td><td>✓ Yes</td><td>✗ No</td><td>64 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td colspan="7">Trn1</td></tr>
  <tr><td>trn1.2xlarge 1</td><td>5000.00 / 20000.00</td><td>625.00 / 2500.00</td><td>16250.00 / 65000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 25 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>trn1.32xlarge</td><td>80000.00</td><td>10000.00</td><td>260000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 28 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td colspan="7">Trn1n</td></tr>
  <tr><td>trn1n.32xlarge</td><td>80000.00</td><td>10000.00</td><td>260000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 28 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td colspan="7">Trn2</td></tr>
  <tr><td>trn2.3xlarge</td><td>5000.00</td><td>625.00</td><td>16250.00</td><td>✓ Yes</td><td>✗ No</td><td>32 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td>trn2.48xlarge</td><td>80000.00</td><td>10000.00</td><td>260000.00</td><td>✓ Yes</td><td>✗ No</td><td>64 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td colspan="7">Trn2u</td></tr>
  <tr><td>trn2u.48xlarge</td><td>80000.00</td><td>10000.00</td><td>260000.00</td><td>✓ Yes</td><td>✗ No</td><td>64 ([Dedicated limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#dedicated-limit))</td></tr>
  <tr><td colspan="7">VT1</td></tr>
  <tr><td>vt1.3xlarge 1</td><td>2375.00 / 4750.00</td><td>296.88 / 593.75</td><td>10000.00 / 20000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 25 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>vt1.6xlarge</td><td>4750.00</td><td>593.75</td><td>20000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 23 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
  <tr><td>vt1.24xlarge</td><td>19000.00</td><td>2375.00</td><td>80000.00</td><td>✓ Yes</td><td>✗ No</td><td>Up to 27 ([Shared limit](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html#shared-limit))</td></tr>
</tbody>
</table>


**Note**  
1 These instances can support maximum performance for 30 minutes at least once every 24 hours, after which they revert to their baseline performance. Other instances can sustain the maximum performance indefinitely. If your workload requires sustained maximum performance for longer than 30 minutes, use one of these instances.

## Instance store specifications
<a name="ac_instance-store"></a>

The following table shows the instance store volume configuration for supported instance types, along with the aggregated IOPS performance with 4,096 byte block size at queue depth saturation. 


<table>
<thead>
  <tr><th>Instance type</th><th>Instance store volumes</th><th>Instance store type</th><th>100% random read IOPS / Write IOPS</th><th>Needs initialization 1</th><th>TRIM support 2</th></tr>
</thead>
<tbody>
  <tr><td colspan="6">DL1</td></tr>
  <tr><td>dl1.24xlarge</td><td>4 x 1000 GB</td><td>NVMe SSD</td><td>1,000,000 / 800,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td colspan="6">F2</td></tr>
  <tr><td>f2.6xlarge</td><td>1 x 940 GB</td><td>NVMe SSD</td><td>400,000 / 125,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>f2.12xlarge</td><td>2 x 940 GB</td><td>NVMe SSD</td><td>800,000 / 250,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>f2.48xlarge</td><td>8 x 940 GB</td><td>NVMe SSD</td><td>3,200,000 / 1,000,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td colspan="6">G4ad</td></tr>
  <tr><td>g4ad.xlarge</td><td>1 x 150 GB</td><td>NVMe SSD</td><td>10,417 / 8,333</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>g4ad.2xlarge</td><td>1 x 300 GB</td><td>NVMe SSD</td><td>20,833 / 16,667</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>g4ad.4xlarge</td><td>1 x 600 GB</td><td>NVMe SSD</td><td>41,667 / 33,333</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>g4ad.8xlarge</td><td>1 x 1200 GB</td><td>NVMe SSD</td><td>83,333 / 66,667</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>g4ad.16xlarge</td><td>2 x 1200 GB</td><td>NVMe SSD</td><td>166,666 / 133,332</td><td> </td><td>✓ Yes</td></tr>
  <tr><td colspan="6">G4dn</td></tr>
  <tr><td>g4dn.xlarge</td><td>1 x 125 GB</td><td>NVMe SSD</td><td>42,500 / 32,500</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>g4dn.2xlarge</td><td>1 x 225 GB</td><td>NVMe SSD</td><td>42,500 / 32,500</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>g4dn.4xlarge</td><td>1 x 225 GB</td><td>NVMe SSD</td><td>85,000 / 65,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>g4dn.8xlarge</td><td>1 x 900 GB</td><td>NVMe SSD</td><td>250,000 / 200,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>g4dn.12xlarge</td><td>1 x 900 GB</td><td>NVMe SSD</td><td>250,000 / 200,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>g4dn.16xlarge</td><td>1 x 900 GB</td><td>NVMe SSD</td><td>250,000 / 200,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>g4dn.metal</td><td>2 x 900 GB</td><td>NVMe SSD</td><td>500,000 / 400,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td colspan="6">G5</td></tr>
  <tr><td>g5.xlarge</td><td>1 x 250 GB</td><td>NVMe SSD</td><td>40,625 / 20,313</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>g5.2xlarge</td><td>1 x 450 GB</td><td>NVMe SSD</td><td>40,625 / 20,313</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>g5.4xlarge</td><td>1 x 600 GB</td><td>NVMe SSD</td><td>125,000 / 62,500</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>g5.8xlarge</td><td>1 x 900 GB</td><td>NVMe SSD</td><td>250,000 / 125,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>g5.12xlarge</td><td>1 x 3800 GB</td><td>NVMe SSD</td><td>312,500 / 156,250</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>g5.16xlarge</td><td>1 x 1900 GB</td><td>NVMe SSD</td><td>250,000 / 125,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>g5.24xlarge</td><td>1 x 3800 GB</td><td>NVMe SSD</td><td>312,500 / 156,250</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>g5.48xlarge</td><td>2 x 3800 GB</td><td>NVMe SSD</td><td>625,000 / 312,500</td><td> </td><td>✓ Yes</td></tr>
  <tr><td colspan="6">G6</td></tr>
  <tr><td>g6.xlarge</td><td>1 x 250 GB</td><td>NVMe SSD</td><td>40,625 / 20,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>g6.2xlarge</td><td>1 x 450 GB</td><td>NVMe SSD</td><td>40,625 / 20,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>g6.4xlarge</td><td>1 x 600 GB</td><td>NVMe SSD</td><td>125,000 / 40,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>g6.8xlarge</td><td>2 x 450 GB</td><td>NVMe SSD</td><td>250,000 / 80,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>g6.12xlarge</td><td>4 x 940 GB</td><td>NVMe SSD</td><td>312,500 / 125,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>g6.16xlarge</td><td>2 x 940 GB</td><td>NVMe SSD</td><td>250,000 / 80,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>g6.24xlarge</td><td>4 x 940 GB</td><td>NVMe SSD</td><td>312,500 / 156,248</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>g6.48xlarge</td><td>8 x 940 GB</td><td>NVMe SSD</td><td>625,000 / 312,496</td><td> </td><td>✓ Yes</td></tr>
  <tr><td colspan="6">G6e</td></tr>
  <tr><td>g6e.xlarge</td><td>1 x 250 GB</td><td>NVMe SSD</td><td>40,625 / 20,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>g6e.2xlarge</td><td>1 x 450 GB</td><td>NVMe SSD</td><td>40,625 / 20,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>g6e.4xlarge</td><td>1 x 600 GB</td><td>NVMe SSD</td><td>125,000 / 40,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>g6e.8xlarge</td><td>2 x 450 GB</td><td>NVMe SSD</td><td>250,000 / 80,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>g6e.12xlarge</td><td>2 x 1900 GB</td><td>NVMe SSD</td><td>312,500 / 125,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>g6e.16xlarge</td><td>2 x 950 GB</td><td>NVMe SSD</td><td>250,000 / 80,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>g6e.24xlarge</td><td>2 x 1900 GB</td><td>NVMe SSD</td><td>312,500 / 156,250</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>g6e.48xlarge</td><td>4 x 1900 GB</td><td>NVMe SSD</td><td>625,000 / 312,500</td><td> </td><td>✓ Yes</td></tr>
  <tr><td colspan="6">G6f</td></tr>
  <tr><td>g6f.large</td><td>1 x 100 GB</td><td>NVMe SSD</td><td>16,250 / 8,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>g6f.xlarge</td><td>1 x 100 GB</td><td>NVMe SSD</td><td>27,100 / 13,333</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>g6f.2xlarge</td><td>1 x 200 GB</td><td>NVMe SSD</td><td>40,625 / 20,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>g6f.4xlarge</td><td>1 x 450 GB</td><td>NVMe SSD</td><td>125,000 / 40,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td colspan="6">Gr6</td></tr>
  <tr><td>gr6.4xlarge</td><td>1 x 600 GB</td><td>NVMe SSD</td><td>125,000 / 40,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>gr6.8xlarge</td><td>2 x 450 GB</td><td>NVMe SSD</td><td>250,000 / 80,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td colspan="6">Gr6f</td></tr>
  <tr><td>gr6f.4xlarge</td><td>1 x 450 GB</td><td>NVMe SSD</td><td>125,000 / 40,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td colspan="6">G7e</td></tr>
  <tr><td>g7e.2xlarge</td><td>1 x 1900 GB</td><td>NVMe SSD</td><td>275,000 / 137,500</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>g7e.4xlarge</td><td>1 x 1900 GB</td><td>NVMe SSD</td><td>275,000 / 137,500</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>g7e.8xlarge</td><td>1 x 1900 GB</td><td>NVMe SSD</td><td>275,000 / 137,500</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>g7e.12xlarge</td><td>1 x 3800 GB</td><td>NVMe SSD</td><td>550,000 / 275,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>g7e.24xlarge</td><td>2 x 3800 GB</td><td>NVMe SSD</td><td>1,100,000 / 550,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>g7e.48xlarge</td><td>4 x 3800 GB</td><td>NVMe SSD</td><td>2,200,000 / 1,100,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td colspan="6">P4d</td></tr>
  <tr><td>p4d.24xlarge</td><td>8 x 1000 GB</td><td>NVMe SSD</td><td>2,000,000 / 1,600,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td colspan="6">P4de</td></tr>
  <tr><td>p4de.24xlarge</td><td>8 x 1000 GB</td><td>NVMe SSD</td><td>2,000,000 / 1,600,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td colspan="6">P5</td></tr>
  <tr><td>p5.4xlarge</td><td>1 x 3800 GB</td><td>NVMe SSD</td><td>550,000 / 275,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>p5.48xlarge</td><td>8 x 3800 GB</td><td>NVMe SSD</td><td>4,400,000 / 2,200,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td colspan="6">P5e</td></tr>
  <tr><td>p5e.48xlarge</td><td>8 x 3800 GB</td><td>NVMe SSD</td><td>4,400,000 / 2,200,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td colspan="6">P5en</td></tr>
  <tr><td>p5en.48xlarge</td><td>8 x 3800 GB</td><td>NVMe SSD</td><td>4,400,000 / 2,200,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td colspan="6">P6-B200</td></tr>
  <tr><td>p6-b200.48xlarge</td><td>8 x 3800 GB</td><td>NVMe SSD</td><td>4,400,000 / 2,200,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td colspan="6">P6-B300</td></tr>
  <tr><td>p6-b300.48xlarge</td><td>8 x 3800 GB</td><td>NVMe SSD</td><td>4,400,000 / 2,200,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td colspan="6">P6e-GB200</td></tr>
  <tr><td>p6e-gb200.36xlarge</td><td>3 x 7500 GB</td><td>NVMe SSD</td><td>2,550,000 / 2,400,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td colspan="6">Trn1</td></tr>
  <tr><td>trn1.2xlarge</td><td>1 x 474 GB</td><td>NVMe SSD</td><td>107,500 / 45,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>trn1.32xlarge</td><td>4 x 1900 GB</td><td>NVMe SSD</td><td>1,720,000 / 720,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td colspan="6">Trn1n</td></tr>
  <tr><td>trn1n.32xlarge</td><td>4 x 1900 GB</td><td>NVMe SSD</td><td>1,720,000 / 720,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td colspan="6">Trn2</td></tr>
  <tr><td>trn2.3xlarge</td><td>1 x 470 GB</td><td>NVMe SSD</td><td>107,500 / 45,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td>trn2.48xlarge</td><td>4 x 1900 GB</td><td>NVMe SSD</td><td>1,720,000 / 720,000</td><td> </td><td>✓ Yes</td></tr>
  <tr><td colspan="6">Trn2u</td></tr>
  <tr><td>trn2u.48xlarge</td><td>4 x 1900 GB</td><td>NVMe SSD</td><td>1,720,000 / 720,000</td><td> </td><td>✓ Yes</td></tr>
</tbody>
</table>


1 Volumes attached to certain instances suffer a first-write penalty unless initialized. For more information, see [Optimize disk performance for instance store volumes](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/disk-performance.html).

2 For more information, see [Instance store volume TRIM support](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ssd-instance-store.html#InstanceStoreTrimSupport).

## Security specifications
<a name="ac_security"></a>


<table>
<thead>
  <tr><th>Instance type</th><th>EBS encryption</th><th>Instance store encryption</th><th>Encryption in transit</th><th>AMD SEV-SNP</th><th>NitroTPM</th><th>Nitro Enclaves</th></tr>
</thead>
<tbody>
  <tr><td colspan="7">DL1</td></tr>
  <tr><td>dl1.24xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td></tr>
  <tr><td colspan="7">DL2q</td></tr>
  <tr><td>dl2q.24xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td></tr>
  <tr><td colspan="7">F2</td></tr>
  <tr><td>f2.6xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>f2.12xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>f2.48xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td colspan="7">G4ad</td></tr>
  <tr><td>g4ad.xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>g4ad.2xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>g4ad.4xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>g4ad.8xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>g4ad.16xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">G4dn</td></tr>
  <tr><td>g4dn.xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>g4dn.2xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>g4dn.4xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>g4dn.8xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>g4dn.12xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>g4dn.16xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>g4dn.metal</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">G5</td></tr>
  <tr><td>g5.xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>g5.2xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>g5.4xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>g5.8xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>g5.12xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>g5.16xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>g5.24xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>g5.48xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td colspan="7">G5g</td></tr>
  <tr><td>g5g.xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>g5g.2xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>g5g.4xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>g5g.8xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>g5g.16xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>g5g.metal</td><td>✓ Yes</td><td>Instance store not supported</td><td>✗ No</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">G6</td></tr>
  <tr><td>g6.xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>g6.2xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>g6.4xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>g6.8xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>g6.12xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>g6.16xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>g6.24xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>g6.48xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td colspan="7">G6e</td></tr>
  <tr><td>g6e.xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>g6e.2xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>g6e.4xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>g6e.8xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>g6e.12xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>g6e.16xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>g6e.24xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>g6e.48xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td colspan="7">G6f</td></tr>
  <tr><td>g6f.large</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td>g6f.xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>g6f.2xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>g6f.4xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td colspan="7">Gr6</td></tr>
  <tr><td>gr6.4xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>gr6.8xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td colspan="7">Gr6f</td></tr>
  <tr><td>gr6f.4xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td colspan="7">G7e</td></tr>
  <tr><td>g7e.2xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>g7e.4xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>g7e.8xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>g7e.12xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>g7e.24xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>g7e.48xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td colspan="7">Inf1</td></tr>
  <tr><td>inf1.xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>inf1.2xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>inf1.6xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>inf1.24xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td colspan="7">Inf2</td></tr>
  <tr><td>inf2.xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>inf2.8xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>inf2.24xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>inf2.48xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td colspan="7">P4d</td></tr>
  <tr><td>p4d.24xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td></tr>
  <tr><td colspan="7">P4de</td></tr>
  <tr><td>p4de.24xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td></tr>
  <tr><td colspan="7">P5</td></tr>
  <tr><td>p5.4xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td>p5.48xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td colspan="7">P5e</td></tr>
  <tr><td>p5e.48xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td colspan="7">P5en</td></tr>
  <tr><td>p5en.48xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td colspan="7">P6-B200</td></tr>
  <tr><td>p6-b200.48xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✗ No</td></tr>
  <tr><td colspan="7">P6-B300</td></tr>
  <tr><td>p6-b300.48xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td colspan="7">P6e-GB200</td></tr>
  <tr><td>p6e-gb200.36xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">Trn1</td></tr>
  <tr><td>trn1.2xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>trn1.32xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">Trn1n</td></tr>
  <tr><td>trn1n.32xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td colspan="7">Trn2</td></tr>
  <tr><td>trn2.3xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✓ Yes</td></tr>
  <tr><td>trn2.48xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td colspan="7">Trn2u</td></tr>
  <tr><td>trn2u.48xlarge</td><td>✓ Yes</td><td>✓ Yes</td><td>✓ Yes</td><td>✗ No</td><td>✓ Yes</td><td>✓ Yes</td></tr>
  <tr><td colspan="7">VT1</td></tr>
  <tr><td>vt1.3xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>vt1.6xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
  <tr><td>vt1.24xlarge</td><td>✓ Yes</td><td>Instance store not supported</td><td>✓ Yes</td><td>✗ No</td><td>✗ No</td><td>✗ No</td></tr>
</tbody>
</table>
