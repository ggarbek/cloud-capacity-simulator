

# Instances built on the AWS Nitro System
<a name="ec2-nitro-instances"></a>

**End of sale notice**  
The **U-9tb1**, **U-12tb1**, **U-18tb1**, and **U-24tb1** instance types are no longer available for new instance launches. If your workload requires a high-memory instance, we recommend that you use a U7i instance type instead.

The Nitro System is a collection of hardware and software components built by AWS that enable high performance, high availability, and high security.

The Nitro System provides bare metal capabilities that eliminate virtualization overhead and support workloads that require full access to host hardware. Bare metal instances are well suited for the following:
+ Workloads that require access to low-level hardware features (for example, Intel VT) that are not available or fully supported in virtualized environments
+ Applications that require a non-virtualized environment for licensing or support

## Nitro components
<a name="nitro-components"></a>

The following components are part of the Nitro System:
+ Nitro card
  + Local NVMe storage volumes
  + Networking hardware support
  + Management
  + Monitoring
  + Security
+ Nitro security chip, integrated into the motherboard
+ Nitro hypervisor - A lightweight hypervisor that manages memory and CPU allocation and delivers performance that is indistinguishable from bare metal for most workloads.

 For more information, see [AWS Nitro System](https://aws.amazon.com/ec2/nitro/).

## Network feature support
<a name="nitro-version-network-features"></a>

The following content summarizes key networking capabilities for each version of the Nitro System. Versions are shown in descending version release order. If you know the instance type family that your instance belongs to, you can expand the [Specifications](ec2-instance-type-specifications.md) section and select your instance family. The **Platform summary** table for your instance family shows the Nitro version for your instance type in the **Hypervisor** column.

If you're not sure which instance family applies, see the [Naming conventions](instance-type-names.md) section.

**Note**  
Features are cumulative, meaning that newer versions of the Nitro system support the features that are listed in all prior versions, except where explicitly stated otherwise.  
See the [Nitro instance requirements](#nitro-requirements) section for the minimum ENA driver and Linux kernel versions for optimal performance of Nitro v4 and later instance types.

**Nitro v6**
+ Default TCP established timeout for idle TCP connections has been reduced from 432,000 seconds to 350 seconds.
+ Traffic Mirroring is not supported.
+ Up to 400 Gbps\* per network card.

**Nitro v5**
+ Traffic Mirroring is not supported.
+ Up to 200 Gbps\* per network card.

**Nitro v4**
+ GPU accelerated and Trainium based instance types support up to 100 Gbps\* per network card for consistency. Other instance types support up to 170 Gbps\* per network card.
+ Supports ENA Express. For more information about ENA Express, including what specific instance types support it see [Improve network performance with ENA Express on your EC2 instances](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ena-express.html) in the *Amazon EC2 User Guide*.
+ Supports RDMA read and RDMA write for select instance types. For more information, see [ Elastic Fabric Adapter](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/efa.html#efa-instance-types).
+ Traffic Mirroring is supported.

**Nitro v3**
+ Up to 100 Gbps\* per network card.
+ Encryption in transit.
+ Traffic Mirroring is supported.

**Nitro v2**
+ Enhanced networking with Elastic Network Adapter (ENA).
+ Traffic Mirroring is supported.

\* *Your instance type might support a lower maximum bandwidth. For more information, refer to the network specifications for your instance type in the instance family pages.*

## Virtualized instances
<a name="nitro-instance-types"></a>

The following virtualized instances are built on the Nitro System:

------
#### [ Nitro v6 ]
+ **General Purpose**: M8a \| M8azn \| M8gb \| M8gn \| M8i \| M8id \| M8i-flex \| M8in \| M8idn \| M8ine \| M8ib \| M8idb
+ **Compute Optimized**: C8a \| C8gb \| C8gn \| C8i \| C8id \| C8i-flex \| C8in \| C8ine \| C8ib
+ **Memory Optimized**: R8a \| R8gb \| R8gn \| R8i \| R8id \| R8i-flex \| R8in \| R8idn \| R8ib \| R8idb \| X8aedz \| X8i
+ **Storage Optimized**: I8ge
+ **Accelerated Computing**: G7e \| P6-B200 \| P6-B300
+ **High Performance Computing**: Hpc8a

------
#### [ Nitro v5 ]
+ **General Purpose**: M8g \| M8gd
+ **Compute Optimized**: C7gn \| C8g \| C8gd
+ **Memory Optimized**: R8g \| R8gd \| X8g
+ **Storage Optimized**: I7ie \| I8g
+ **Accelerated Computing**: P5en \| P6e-GB200 \| Trn2 \| Trn2u
+ **High Performance Computing**: Hpc7g

------
#### [ Nitro v4 ]
+ **General Purpose**: M6a \| M6i \| M6id \| M6idn \| M6in \| M7a \| M7g \| M7gd \| M7i \| M7i-flex
+ **Compute Optimized**: C6a \| C6gn \| C6i \| C6id \| C6in \| C7a \| C7g \| C7gd \| C7i \| C7i-flex
+ **Memory Optimized**: R6a \| R6i \| R6id \| R6idn \| R6in \| R7a \| R7g \| R7gd \| R7i \| R7iz \| U7i-6tb \| U7i-8tb \| U7i-12tb \| U7in-16tb \| U7in-24tb \| U7in-32tb \| U7inh-32tb \| X2idn \| X2iedn
+ **Storage Optimized**: I4g \| I4i \| I7i \| Im4gn \| Is4gen
+ **Accelerated Computing**: F2 \| G6 \| G6e \| G6f \| Gr6 \| Gr6f \| Inf2 \| P5 \| P5e \| Trn1 \| Trn1n
+ **High Performance Computing**: Hpc6a \| Hpc6id \| Hpc7a

------
#### [ Nitro v3 ]
+ **General Purpose**: M5dn \| M5n \| M5zn
+ **Compute Optimized**: C5n
+ **Memory Optimized**: R5dn \| R5n \| U-3tb1 \| U-6tb1 \| U-9tb1 \| U-12tb1 \| U-18tb1 \| U-24tb1 \| X2iezn
+ **Storage Optimized**: D3 \| D3en \| I3en
+ **Accelerated Computing**: DL1 \| DL2q \| G4ad \| G4dn \| G5 \| Inf1 \| P4d \| P4de \| VT1 \| P3dn
+ **Previous Generation**: P3dn

------
#### [ Nitro v2 ]
+ **General Purpose**: M5 \| M5a \| M5ad \| M5d \| M6g \| M6gd \| T3 \| T3a \| T4g \| A1
+ **Compute Optimized**: C5 \| C5a \| C5ad \| C5d \| C6g \| C6gd
+ **Memory Optimized**: R5 \| R5a \| R5ad \| R5b \| R5d \| R6g \| R6gd \| X2gd \| z1d
+ **Accelerated Computing**: G5g
+ **Previous Generation**: A1

------

## Bare metal instances
<a name="nitro-bare-metal"></a>

The following bare metal instances are built on the Nitro System:

------
#### [ Nitro v6 ]
+ **General Purpose**: M8a \| M8azn \| M8gb \| M8gn \| M8i \| M8id
+ **Compute Optimized**: C8a \| C8gb \| C8gn \| C8i \| C8id \| C8in \| C8ib
+ **Memory Optimized**: R8a \| R8gb \| R8gn \| R8i \| R8id \| X8aedz \| X8i
+ **Storage Optimized**: I8ge

------
#### [ Nitro v5 ]
+ **General Purpose**: M8g \| M8gd \| Mac-m4 \| Mac-m4pro
+ **Compute Optimized**: C7gn \| C8g \| C8gd
+ **Memory Optimized**: R8g \| R8gd \| X8g
+ **Storage Optimized**: I7ie \| I8g

------
#### [ Nitro v4 ]
+ **General Purpose**: M6a \| M6i \| M6id \| M6idn \| M6in \| M7a \| M7g \| M7gd \| M7i
+ **Compute Optimized**: C6a \| C6i \| C6id \| C6in \| C7a \| C7g \| C7gd \| C7i
+ **Memory Optimized**: R6a \| R6i \| R6id \| R6idn \| R6in \| R7a \| R7g \| R7gd \| R7i \| R7iz \| X2idn \| X2iedn
+ **Storage Optimized**: I4i \| I7i

------
#### [ Nitro v3 ]
+ **General Purpose**: M5dn \| M5n \| M5zn
+ **Compute Optimized**: C5n
+ **Memory Optimized**: R5dn \| R5n \| U-6tb1 \| U-9tb1 \| U-12tb1 \| U-18tb1 \| U-24tb1 \| X2iezn
+ **Storage Optimized**: I3en
+ **Accelerated Computing**: G4dn

------
#### [ Nitro v2 ]
+ **General Purpose**: M5 \| M5d \| M6g \| M6gd \| Mac1 \| Mac2 \| Mac2-m1ultra \| Mac2-m2 \| Mac2-m2pro \| Mac-m4max \| A1
+ **Compute Optimized**: C5 \| C5d \| C6g \| C6gd
+ **Memory Optimized**: R5 \| R5b \| R5d \| R6g \| R6gd \| X2gd \| z1d
+ **Storage Optimized**: I3
+ **Accelerated Computing**: G5g
+ **Previous Generation**: A1

------

In most cases, when you launch a bare metal instance, the underlying server goes through its boot process, during which it verifies all hardware and firmware components. This means that it can take up to 20 minutes or more from the time the instance enters the running state until it becomes available over the network.

## Nitro instance requirements
<a name="nitro-requirements"></a>

Instances built on the AWS Nitro System use ENA for enhanced networking, and storage volumes exposed as NVMe block devices. For more information about NVMe drivers, see [Install or upgrade the NVMe driver](https://docs.aws.amazon.com/ebs/latest/userguide/nvme-ebs-volumes.html#install-nvme-driver) in the *Amazon EBS User Guide* for Linux instances, or [AWS NVMe drivers for Windows instances](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/aws-nvme-drivers.html) in the *Amazon EC2 User Guide*. For more information about ENA drivers, see [Requirements for enhanced networking with ENA](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/enhanced-networking-ena.html#ena-requirements) in the *Amazon EC2 User Guide*.

The following tabs show details about which driver or kernel versions are recommended for your operating system.

------
#### [ Linux ]

The ENA Linux kernel driver version 2.2.9g or later, from the Amazon Drivers GitHub repository is recommended for Nitro v4 instance types and required for Nitro v5 (or later) instance types for Linux distributions that expose the version information. ENA drivers for Linux are available on GitHub. For more information, see [Linux kernel driver for Elastic Network Adapter (ENA) family](https://github.com/amzn/amzn-drivers/blob/master/kernel/linux/ena/README.rst). For release notes, see [ENA Linux Kernel Driver Release notes](https://github.com/amzn/amzn-drivers/blob/master/kernel/linux/ena/RELEASENOTES.md).

Linux distributions can also incorporate ENA driver features within the kernel. However, the timing may vary for implementation within the different distributions. The Amazon Linux 2023 and Bottlerocket Linux distributions support ENA features for Nitro v4 and newer instance types by default.

Some Linux distributions might require a minimum kernel version to prevent suboptimal performance of ENA driver features on Nitro v4 and newer instance types. If your Linux distribution appears in the following table, you can verify the kernel version for your instance with the **uname** command as follows:

```
uname -r
```


| Linux distribution | Minimum kernel version | 
| --- | --- | 
| Linux upstream | Kernel version 5.9 | 
| Amazon Linux 2 | Kernel 4.14.186 | 
| Red Hat Enterprise Linux (RHEL) | RHEL 8.4 kernel 4.18.0-305 | 
| SUSE Linux Enterprise Server (SLES) |  [See the AWS documentation website for more details](http://docs.aws.amazon.com/ec2/latest/instancetypes/ec2-nitro-instances.html)  | 
| Linux Ubuntu | 20.04 kernel 5.4.0-1025-aws | 
| Debian | 11 (Bullseye) kernel 5.10.0 | 
| DPDK | v20.11 | 

**Note**  
The following ENA Linux driver versions are not supported, and will result in elastic network interface attachment failures:  
ENA Linux  
Nitro v5 – Earlier than 2.2.9
All Nitro versions prior to v5 – Earlier than v1.2.0
ENA DPDK  
Nitro v5 – Earlier than 20.11
All Nitro versions prior to v5 – Earlier than v1.1.1

------
#### [ Windows ]

ENA Windows driver version: 2.2.3 or later for Windows instances.

**Note**  
The following ENA Windows drivers are not supported:  
ENA Windows: v2.2.0 or earlier

All of the current AWS Windows AMIs meet these requirements. For more information about AMI versions and release notes, see the [AWS Windows AMI reference](https://docs.aws.amazon.com/ec2/latest/windows-ami-reference/windows-amis.html).

------
#### [ FreeBSD ]

ENA FreeBSD driver version: 2.3.1 or later for FreeBSD instances.

**Note**  
ENA FreeBSD driver versions earlier than v2.3.1 are not supported, and will result in elastic network interface attachment failures.

------

### Linux instances with AWS Graviton processors
<a name="nitro-requirements-graviton"></a>

Linux instances with AWS Graviton processors have the following additional requirements:
+ An AMI with 64-bit ARM architecture.
+ Support for UEFI boot with ACPI tables and ACPI hot-plug of PCI devices.

**Note**  
AWS Graviton processors only support Linux operating systems.