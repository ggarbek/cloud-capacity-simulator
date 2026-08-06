

# Amazon EC2 instance types by Region
<a name="ec2-instance-regions"></a>

An Amazon EC2 instance is tied to the zone in which it was launched. The ID of an instance is tied to the Region for the instance, and can only be used in this Region.

**Considerations**
+ When you create your AWS account, we set default quotas on these resources on a per-Region basis. We monitor your usage within each Region and raise your quotas automatically based on your use of Amazon EC2. For more information, see [Amazon EC2 instance type quotas](ec2-instance-quotas.md).
+ Each Region supports a subset of the available instance types. An instance type that is supported in a Region might not be supported in all of the Availability Zones for that Region.
+ Each Local Zone supports a subset of the available instance types. For more information, see [AWS Local Zones Features](https://aws.amazon.com/about-aws/global-infrastructure/localzones/features/).
+ Each Wavelength Zone supports a subset of the available instance types. For more information, see [Amazon EC2 considerations](https://docs.aws.amazon.com/wavelength/latest/developerguide/wavelength-quotas.html#ec2-considerations).

## US East (N. Virginia) — `us-east-1`
<a name="instance-types-us-east-1"></a>

The following instance types are available in US East (N. Virginia).
+ **General Purpose:** A1 \| M1 \| M2 \| M3 \| M4 \| M5 \| M5a \| M5ad \| M5d \| M5dn \| M5n \| M5zn \| M6a \| M6g \| M6gd \| M6i \| M6id \| M6idn \| M6in \| M7a \| M7g \| M7gd \| M7i \| M7i-flex \| M8a \| M8azn \| M8g \| M8gb \| M8gd \| M8gn \| M8i \| M8id \| M8i-flex \| M8in \| M8idn \| M8ine \| M8ib \| M8idb \| M9g \| M9gd \| Mac1 \| Mac2 \| Mac2-m1ultra \| Mac2-m2 \| Mac2-m2pro \| Mac-m4 \| Mac-m4pro \| Mac-m4max \| T1 \| T2 \| T3 \| T3a \| T4g
+ **Compute Optimized:** C1 \| C3 \| C4 \| C5 \| C5a \| C5ad \| C5d \| C5n \| C6a \| C6g \| C6gd \| C6gn \| C6i \| C6id \| C6in \| C7a \| C7g \| C7gd \| C7gn \| C7i \| C7i-flex \| C8a \| C8g \| C8gb \| C8gd \| C8gn \| C8i \| C8id \| C8i-flex \| C8in \| C8ine \| C8ib
+ **Memory Optimized:** R3 \| R4 \| R5 \| R5a \| R5ad \| R5b \| R5d \| R5dn \| R5n \| R6a \| R6g \| R6gd \| R6i \| R6id \| R6idn \| R6in \| R7a \| R7g \| R7gd \| R7i \| R7iz \| R8a \| R8g \| R8gb \| R8gd \| R8gn \| R8i \| R8id \| R8i-flex \| R8in \| R8idn \| R8ib \| R8idb \| U-3tb1 \| U-6tb1 \| U7i-6tb \| U7i-8tb \| U7i-12tb \| U7in-16tb \| U7in-24tb \| U7in-32tb \| X1 \| X1e \| X2gd \| X2idn \| X2iedn \| X2iezn \| X8g \| X8i \| z1d
+ **Storage Optimized:** D2 \| D3 \| D3en \| H1 \| I2 \| I3 \| I3en \| I4g \| I4i \| I7i \| I7ie \| I8g \| I8ge \| Im4gn \| Is4gen
+ **Accelerated Computing:** DL1 \| F2 \| G4ad \| G4dn \| G5 \| G5g \| G6 \| G6e \| G6f \| Gr6 \| Gr6f \| G7e \| Inf1 \| Inf2 \| P3dn \| P4d \| P4de \| P5 \| P5en \| P6-B200 \| P6-B300 \| Trn1 \| Trn1n \| VT1
+ **High Performance Computing:** Hpc7g
+ **Previous Generation:** A1 \| C1 \| C3 \| C4 \| I2 \| M1 \| M2 \| M3 \| M4 \| P3dn \| R3 \| R4 \| T1

## US East (Ohio) — `us-east-2`
<a name="instance-types-us-east-2"></a>

The following instance types are available in US East (Ohio).
+ **General Purpose:** A1 \| M4 \| M5 \| M5a \| M5ad \| M5d \| M5dn \| M5n \| M5zn \| M6a \| M6g \| M6gd \| M6i \| M6id \| M6idn \| M6in \| M7a \| M7g \| M7gd \| M7i \| M7i-flex \| M8a \| M8azn \| M8g \| M8gd \| M8i \| M8id \| M8i-flex \| M9g \| M9gd \| Mac1 \| Mac2 \| Mac2-m2 \| Mac2-m2pro \| Mac-m4 \| Mac-m4pro \| T2 \| T3 \| T3a \| T4g
+ **Compute Optimized:** C4 \| C5 \| C5a \| C5ad \| C5d \| C5n \| C6a \| C6g \| C6gd \| C6gn \| C6i \| C6id \| C6in \| C7a \| C7g \| C7gd \| C7gn \| C7i \| C7i-flex \| C8a \| C8g \| C8gd \| C8gn \| C8i \| C8id \| C8i-flex
+ **Memory Optimized:** R3 \| R4 \| R5 \| R5a \| R5ad \| R5b \| R5d \| R5dn \| R5n \| R6a \| R6g \| R6gd \| R6i \| R6id \| R6idn \| R6in \| R7a \| R7g \| R7gd \| R7i \| R7iz \| R8a \| R8g \| R8gd \| R8i \| R8id \| R8i-flex \| R8in \| R8idn \| R8ib \| R8idb \| U-3tb1 \| U-6tb1 \| U7i-6tb \| U7i-8tb \| U7i-12tb \| U7in-16tb \| U7in-24tb \| X1 \| X1e \| X2gd \| X2idn \| X2iedn \| X8g \| X8i \| z1d
+ **Storage Optimized:** D2 \| D3 \| H1 \| I2 \| I3 \| I3en \| I4g \| I4i \| I7i \| I7ie \| I8g \| I8ge \| Im4gn \| Is4gen
+ **Accelerated Computing:** G4ad \| G4dn \| G5 \| G6 \| G6e \| G6f \| Gr6 \| Gr6f \| G7e \| Inf1 \| Inf2 \| P4d \| P5 \| P5e \| P5en \| P6-B200 \| Trn1 \| Trn1n \| Trn2
+ **High Performance Computing:** Hpc6a \| Hpc6id \| Hpc7a \| Hpc8a
+ **Previous Generation:** A1 \| C4 \| I2 \| M4 \| R3 \| R4

## US West (N. California) — `us-west-1`
<a name="instance-types-us-west-1"></a>

The following instance types are available in US West (N. California).
+ **General Purpose:** M1 \| M2 \| M3 \| M4 \| M5 \| M5a \| M5ad \| M5d \| M5zn \| M6a \| M6g \| M6gd \| M6i \| M6id \| M6idn \| M6in \| M7g \| M7gd \| M7i \| M7i-flex \| M8g \| M8i \| M8i-flex \| T1 \| T2 \| T3 \| T3a \| T4g
+ **Compute Optimized:** C1 \| C3 \| C4 \| C5 \| C5a \| C5d \| C5n \| C6a \| C6g \| C6gd \| C6gn \| C6i \| C6in \| C7g \| C7gd \| C7i \| C7i-flex \| C8g \| C8gn \| C8i \| C8i-flex
+ **Memory Optimized:** R3 \| R4 \| R5 \| R5a \| R5ad \| R5d \| R5n \| R6a \| R6g \| R6gd \| R6i \| R7g \| R7gd \| R7i \| R8g \| R8gd \| R8i \| R8i-flex \| X2idn \| X2iedn \| z1d
+ **Storage Optimized:** D2 \| I2 \| I3 \| I3en \| I4i \| I7i \| I7ie
+ **Accelerated Computing:** G4dn \| Inf1 \| P5 \| P5en
+ **Previous Generation:** C1 \| C3 \| C4 \| I2 \| M1 \| M2 \| M3 \| M4 \| R3 \| R4 \| T1

## US West (Oregon) — `us-west-2`
<a name="instance-types-us-west-2"></a>

The following instance types are available in US West (Oregon).
+ **General Purpose:** A1 \| M1 \| M2 \| M3 \| M4 \| M5 \| M5a \| M5ad \| M5d \| M5dn \| M5n \| M5zn \| M6a \| M6g \| M6gd \| M6i \| M6id \| M6idn \| M6in \| M7a \| M7g \| M7gd \| M7i \| M7i-flex \| M8a \| M8azn \| M8g \| M8gb \| M8gd \| M8gn \| M8i \| M8id \| M8i-flex \| M8in \| M8idn \| M8ine \| M8ib \| M8idb \| M9g \| M9gd \| Mac1 \| Mac2 \| Mac2-m1ultra \| Mac2-m2 \| Mac2-m2pro \| Mac-m4 \| Mac-m4pro \| Mac-m4max \| T1 \| T2 \| T3 \| T3a \| T4g
+ **Compute Optimized:** C1 \| C3 \| C4 \| C5 \| C5a \| C5ad \| C5d \| C5n \| C6a \| C6g \| C6gd \| C6gn \| C6i \| C6id \| C6in \| C7a \| C7g \| C7gd \| C7gn \| C7i \| C7i-flex \| C8a \| C8g \| C8gb \| C8gd \| C8gn \| C8i \| C8id \| C8i-flex \| C8in \| C8ine \| C8ib
+ **Memory Optimized:** R3 \| R4 \| R5 \| R5a \| R5ad \| R5b \| R5d \| R5dn \| R5n \| R6a \| R6g \| R6gd \| R6i \| R6id \| R6idn \| R6in \| R7a \| R7g \| R7gd \| R7i \| R7iz \| R8a \| R8g \| R8gb \| R8gd \| R8gn \| R8i \| R8id \| R8i-flex \| R8in \| R8idn \| R8ib \| R8idb \| U-3tb1 \| U-6tb1 \| U7i-6tb \| U7i-8tb \| U7i-12tb \| U7in-16tb \| U7in-24tb \| U7in-32tb \| X1 \| X1e \| X2gd \| X2idn \| X2iedn \| X2iezn \| X8g \| X8aedz \| X8i \| z1d
+ **Storage Optimized:** D2 \| D3 \| D3en \| H1 \| I2 \| I3 \| I3en \| I4g \| I4i \| I7i \| I7ie \| I8g \| I8ge \| Im4gn \| Is4gen
+ **Accelerated Computing:** DL1 \| DL2q \| F2 \| G4ad \| G4dn \| G5 \| G5g \| G6 \| G6e \| G6f \| Gr6 \| Gr6f \| G7e \| Inf1 \| Inf2 \| P3dn \| P4d \| P4de \| P5 \| P5e \| P5en \| P6-B200 \| P6-B300 \| Trn1 \| Trn1n \| VT1
+ **Previous Generation:** A1 \| C1 \| C3 \| C4 \| I2 \| M1 \| M2 \| M3 \| M4 \| P3dn \| R3 \| R4 \| T1

## Africa (Cape Town) — `af-south-1`
<a name="instance-types-af-south-1"></a>

The following instance types are available in Africa (Cape Town).
+ **General Purpose:** M5 \| M5d \| M6g \| M6gd \| M6i \| M7g \| M7i \| M8g \| M8i \| M8i-flex \| T3 \| T4g
+ **Compute Optimized:** C5 \| C5a \| C5ad \| C5d \| C5n \| C6g \| C6gd \| C6i \| C6in \| C7g \| C7i \| C7i-flex \| C8gn \| C8i \| C8i-flex
+ **Memory Optimized:** R5 \| R5d \| R5dn \| R5n \| R6g \| R6gd \| R6i \| R6id \| R7g \| R7gd \| R8gd \| R8i \| R8i-flex \| U-6tb1 \| X1 \| X1e \| X2idn \| X2iedn
+ **Storage Optimized:** D2 \| I3 \| I3en \| I4i \| I7i \| I7ie
+ **Accelerated Computing:** G4dn \| Inf1

## Asia Pacific (Hong Kong) — `ap-east-1`
<a name="instance-types-ap-east-1"></a>

The following instance types are available in Asia Pacific (Hong Kong).
+ **General Purpose:** M5 \| M5d \| M6g \| M6gd \| M6i \| M7g \| M7i \| M7i-flex \| M8g \| T3 \| T4g
+ **Compute Optimized:** C5 \| C5a \| C5d \| C5n \| C6a \| C6g \| C6gn \| C6i \| C6in \| C7g \| C7i \| C7i-flex \| C8g \| C8gn
+ **Memory Optimized:** R5 \| R5d \| R5n \| R6g \| R6i \| R7g \| R7gd \| R8g \| R8gd \| U-3tb1 \| X1
+ **Storage Optimized:** D2 \| I3 \| I3en \| I4i \| I7i \| I7ie \| I8ge
+ **Accelerated Computing:** G4dn \| G5 \| Inf1

## Asia Pacific (Hyderabad) — `ap-south-2`
<a name="instance-types-ap-south-2"></a>

The following instance types are available in Asia Pacific (Hyderabad).
+ **General Purpose:** M5 \| M5d \| M6a \| M6g \| M6gd \| M6i \| M7g \| M7i \| M7i-flex \| M8g \| M8i \| M8i-flex \| T3 \| T4g
+ **Compute Optimized:** C5 \| C5d \| C6a \| C6g \| C6i \| C6in \| C7g \| C7i \| C7i-flex \| C8g \| C8gn \| C8i \| C8i-flex
+ **Memory Optimized:** R5 \| R5d \| R6a \| R6g \| R6i \| R7a \| R7g \| R7gd \| R7i \| R8g \| R8i \| R8i-flex \| U-6tb1 \| U7i-8tb \| U7i-12tb \| X2idn \| X2iedn
+ **Storage Optimized:** I3 \| I3en \| I4i \| I7i

## Asia Pacific (Jakarta) — `ap-southeast-3`
<a name="instance-types-ap-southeast-3"></a>

The following instance types are available in Asia Pacific (Jakarta).
+ **General Purpose:** M5 \| M5d \| M6g \| M6gd \| M6i \| M7g \| M7i \| M7i-flex \| M8g \| T3 \| T4g
+ **Compute Optimized:** C5 \| C5d \| C5n \| C6g \| C6gd \| C6gn \| C6in \| C7g \| C7gd \| C7i \| C7i-flex \| C8g \| C8gn
+ **Memory Optimized:** R5 \| R5d \| R6g \| R6gd \| R7g \| R7gd \| R7i \| R8g \| R8gd \| U-6tb1 \| U7i-6tb \| X2idn \| X2iedn
+ **Storage Optimized:** D3en \| I3 \| I3en \| I4i \| I7i \| I7ie
+ **Accelerated Computing:** G5 \| G5g \| P5 \| P5e \| P5en

## Asia Pacific (Malaysia) — `ap-southeast-5`
<a name="instance-types-ap-southeast-5"></a>

The following instance types are available in Asia Pacific (Malaysia).
+ **General Purpose:** M6g \| M6gd \| M6i \| M6id \| M7g \| M7gd \| M7i \| M7i-flex \| M8g \| M8gd \| M8i \| M8i-flex \| T3 \| T4g
+ **Compute Optimized:** C6g \| C6gn \| C6i \| C6id \| C6in \| C7g \| C7gd \| C7i \| C7i-flex \| C8g \| C8gd \| C8gn \| C8i \| C8i-flex
+ **Memory Optimized:** R6g \| R6i \| R6id \| R7g \| R7gd \| R7i \| R8g \| R8gd \| R8i \| R8i-flex \| U7i-6tb \| U7i-8tb \| X2idn \| X2iedn
+ **Storage Optimized:** I3en \| I4i \| I7i \| I7ie \| I8ge
+ **Accelerated Computing:** G6 \| Gr6

## Asia Pacific (Melbourne) — `ap-southeast-4`
<a name="instance-types-ap-southeast-4"></a>

The following instance types are available in Asia Pacific (Melbourne).
+ **General Purpose:** M5 \| M5d \| M6g \| M6gd \| M7g \| M7i \| M7i-flex \| M8g \| T3 \| T4g
+ **Compute Optimized:** C5 \| C5d \| C6g \| C6in \| C7i \| C8g \| C8gn
+ **Memory Optimized:** R5 \| R5d \| R6g \| R7g \| R7i \| R8g \| X2idn
+ **Storage Optimized:** I3 \| I3en \| I4i \| I7i \| I7ie
+ **Accelerated Computing:** Trn1 \| Trn2

## Asia Pacific (Mumbai) — `ap-south-1`
<a name="instance-types-ap-south-1"></a>

The following instance types are available in Asia Pacific (Mumbai).
+ **General Purpose:** A1 \| M4 \| M5 \| M5a \| M5ad \| M5d \| M6a \| M6g \| M6gd \| M6i \| M6id \| M6idn \| M6in \| M7g \| M7gd \| M7i \| M7i-flex \| M8g \| M8i \| M8i-flex \| Mac1 \| T2 \| T3 \| T3a \| T4g
+ **Compute Optimized:** C4 \| C5 \| C5a \| C5d \| C5n \| C6a \| C6g \| C6gd \| C6gn \| C6i \| C6in \| C7g \| C7gd \| C7i \| C7i-flex \| C8g \| C8gn \| C8i \| C8i-flex
+ **Memory Optimized:** R3 \| R4 \| R5 \| R5a \| R5ad \| R5d \| R5n \| R6a \| R6g \| R6gd \| R6i \| R6id \| R7g \| R7gd \| R7i \| R8g \| R8i \| R8i-flex \| U-6tb1 \| U7i-6tb \| U7i-8tb \| U7i-12tb \| U7in-16tb \| X1 \| X1e \| X2idn \| X2iedn \| X8aedz \| X8i \| z1d
+ **Storage Optimized:** D2 \| D3 \| I2 \| I3 \| I3en \| I4i \| I7i \| I7ie \| I8g \| I8ge \| Im4gn \| Is4gen
+ **Accelerated Computing:** G4dn \| G5 \| G6 \| G6e \| G6f \| Gr6 \| Gr6f \| Inf1 \| Inf2 \| P4d \| P5 \| P5en \| Trn1
+ **Previous Generation:** A1 \| C4 \| I2 \| M4 \| R3 \| R4

## Asia Pacific (New Zealand) — `ap-southeast-6`
<a name="instance-types-ap-southeast-6"></a>

The following instance types are available in Asia Pacific (New Zealand).
+ **General Purpose:** M6g \| M6gd \| M6i \| M6id \| M7g \| M7gd \| M7i \| M7i-flex \| T3 \| T4g
+ **Compute Optimized:** C6g \| C6gn \| C6i \| C6id \| C7g \| C7i \| C7i-flex \| C8i \| C8i-flex
+ **Memory Optimized:** R6g \| R6i \| R6id \| R7g \| R7gd \| R7i \| R8i \| R8i-flex
+ **Storage Optimized:** I3en \| I4i

## Asia Pacific (Osaka) — `ap-northeast-3`
<a name="instance-types-ap-northeast-3"></a>

The following instance types are available in Asia Pacific (Osaka).
+ **General Purpose:** M4 \| M5 \| M5d \| M6g \| M6gd \| M6i \| M7g \| M7i \| M7i-flex \| M8g \| T2 \| T3 \| T4g
+ **Compute Optimized:** C4 \| C5 \| C5d \| C5n \| C6g \| C6gd \| C6gn \| C6i \| C6in \| C7g \| C7gd \| C7i \| C8g
+ **Memory Optimized:** R4 \| R5 \| R5d \| R6g \| R6gd \| R6i \| R7g \| R7gd \| R7i \| R8g \| U-6tb1 \| X1 \| X1e \| X2idn \| X2iedn
+ **Storage Optimized:** D2 \| I3 \| I3en \| I4i \| I7i \| I8g
+ **Accelerated Computing:** G4dn \| G6e
+ **Previous Generation:** C4 \| M4 \| R4

## Asia Pacific (Seoul) — `ap-northeast-2`
<a name="instance-types-ap-northeast-2"></a>

The following instance types are available in Asia Pacific (Seoul).
+ **General Purpose:** M4 \| M5 \| M5a \| M5ad \| M5d \| M5zn \| M6g \| M6gd \| M6i \| M6id \| M6idn \| M6in \| M7g \| M7gd \| M7i \| M7i-flex \| M8g \| M8i \| M8i-flex \| Mac1 \| T2 \| T3 \| T3a \| T4g
+ **Compute Optimized:** C4 \| C5 \| C5a \| C5d \| C5n \| C6g \| C6gd \| C6gn \| C6i \| C6id \| C6in \| C7g \| C7gd \| C7i \| C7i-flex \| C8g \| C8gn \| C8i \| C8i-flex
+ **Memory Optimized:** R3 \| R4 \| R5 \| R5a \| R5ad \| R5b \| R5d \| R5dn \| R5n \| R6g \| R6gd \| R6i \| R6id \| R7g \| R7gd \| R7i \| R8g \| R8gd \| R8i \| R8i-flex \| U-6tb1 \| U7i-6tb \| U7i-8tb \| U7i-12tb \| U7in-16tb \| X1 \| X1e \| X2idn \| X2iedn \| X8aedz \| z1d
+ **Storage Optimized:** D2 \| I2 \| I3 \| I3en \| I4i \| I7i \| I7ie \| I8g \| I8ge
+ **Accelerated Computing:** F2 \| G4dn \| G5 \| G5g \| G6 \| G6e \| G6f \| Gr6 \| Gr6f \| G7e \| Inf1 \| Inf2 \| P4d \| P5 \| P5en
+ **Previous Generation:** C4 \| I2 \| M4 \| R3 \| R4

## Asia Pacific (Singapore) — `ap-southeast-1`
<a name="instance-types-ap-southeast-1"></a>

The following instance types are available in Asia Pacific (Singapore).
+ **General Purpose:** A1 \| M1 \| M2 \| M3 \| M4 \| M5 \| M5a \| M5ad \| M5d \| M5dn \| M5n \| M5zn \| M6a \| M6g \| M6gd \| M6i \| M6id \| M6idn \| M6in \| M7g \| M7gd \| M7i \| M7i-flex \| M8g \| M8i \| M8i-flex \| Mac1 \| Mac2 \| T1 \| T2 \| T3 \| T3a \| T4g
+ **Compute Optimized:** C1 \| C3 \| C4 \| C5 \| C5a \| C5ad \| C5d \| C5n \| C6a \| C6g \| C6gd \| C6gn \| C6i \| C6id \| C6in \| C7a \| C7g \| C7gd \| C7i \| C7i-flex \| C8g \| C8gn \| C8i \| C8i-flex
+ **Memory Optimized:** R3 \| R4 \| R5 \| R5a \| R5ad \| R5b \| R5d \| R5dn \| R5n \| R6a \| R6g \| R6gd \| R6i \| R6id \| R6idn \| R6in \| R7g \| R7gd \| R7i \| R8g \| R8i \| R8i-flex \| U-3tb1 \| U-6tb1 \| U7i-6tb \| U7i-8tb \| U7i-12tb \| U7in-16tb \| X1 \| X1e \| X2idn \| X2iedn \| z1d
+ **Storage Optimized:** D2 \| D3 \| D3en \| I2 \| I3 \| I3en \| I4g \| I4i \| I7i \| I7ie \| I8g \| I8ge \| Im4gn \| Is4gen
+ **Accelerated Computing:** G4dn \| G5g \| Inf1 \| Inf2 \| P4de
+ **High Performance Computing:** Hpc6a
+ **Previous Generation:** A1 \| C1 \| C3 \| C4 \| I2 \| M1 \| M2 \| M3 \| M4 \| R3 \| R4 \| T1

## Asia Pacific (Sydney) — `ap-southeast-2`
<a name="instance-types-ap-southeast-2"></a>

The following instance types are available in Asia Pacific (Sydney).
+ **General Purpose:** A1 \| M1 \| M2 \| M3 \| M4 \| M5 \| M5a \| M5ad \| M5d \| M5zn \| M6a \| M6g \| M6gd \| M6i \| M6id \| M6idn \| M6in \| M7a \| M7g \| M7gd \| M7i \| M7i-flex \| M8g \| M8gd \| M8i \| M8i-flex \| Mac1 \| Mac2-m2 \| Mac2-m2pro \| Mac-m4 \| T1 \| T2 \| T3 \| T3a \| T4g
+ **Compute Optimized:** C1 \| C3 \| C4 \| C5 \| C5a \| C5ad \| C5d \| C5n \| C6a \| C6g \| C6gd \| C6gn \| C6i \| C6id \| C6in \| C7g \| C7gd \| C7i \| C7i-flex \| C8g \| C8gd \| C8gn \| C8i \| C8i-flex
+ **Memory Optimized:** R3 \| R4 \| R5 \| R5a \| R5ad \| R5b \| R5d \| R5dn \| R5n \| R6a \| R6g \| R6gd \| R6i \| R6id \| R6idn \| R6in \| R7g \| R7gd \| R7i \| R8g \| R8gd \| R8i \| R8i-flex \| U-3tb1 \| U-6tb1 \| U7i-6tb \| U7i-12tb \| U7in-16tb \| X1 \| X1e \| X2idn \| X2iedn \| X8g \| z1d
+ **Storage Optimized:** D2 \| D3 \| D3en \| I2 \| I3 \| I3en \| I4g \| I4i \| I7i \| I7ie \| I8g \| I8ge \| Im4gn \| Is4gen
+ **Accelerated Computing:** F2 \| G4dn \| G5 \| G6 \| G6f \| Gr6 \| Gr6f \| Inf1 \| Inf2 \| P4d \| P5 \| P5e \| Trn1
+ **High Performance Computing:** Hpc6a
+ **Previous Generation:** A1 \| C1 \| C3 \| C4 \| I2 \| M1 \| M2 \| M3 \| M4 \| R3 \| R4 \| T1

## Asia Pacific (Taipei) — `ap-east-2`
<a name="instance-types-ap-east-2"></a>

The following instance types are available in Asia Pacific (Taipei).
+ **General Purpose:** M6g \| M6gd \| M6i \| M6id \| M7g \| M7gd \| M7i \| M7i-flex \| T3 \| T4g
+ **Compute Optimized:** C6g \| C6gn \| C6i \| C6id \| C7g \| C7i \| C7i-flex
+ **Memory Optimized:** R6g \| R6i \| R6id \| R7g \| R7gd \| R7i
+ **Storage Optimized:** I3en \| I4i

## Asia Pacific (Thailand) — `ap-southeast-7`
<a name="instance-types-ap-southeast-7"></a>

The following instance types are available in Asia Pacific (Thailand).
+ **General Purpose:** M6g \| M6gd \| M6i \| M6id \| M7g \| M7gd \| M7i \| M7i-flex \| M8g \| T3 \| T4g
+ **Compute Optimized:** C6g \| C6gn \| C6i \| C6id \| C6in \| C7g \| C7i \| C7i-flex \| C8g \| C8gn
+ **Memory Optimized:** R6g \| R6i \| R6id \| R7g \| R7gd \| R7i \| U7i-6tb \| X2idn \| X2iedn
+ **Storage Optimized:** I3en \| I4i \| I7ie \| I8ge

## Asia Pacific (Tokyo) — `ap-northeast-1`
<a name="instance-types-ap-northeast-1"></a>

The following instance types are available in Asia Pacific (Tokyo).
+ **General Purpose:** A1 \| M1 \| M2 \| M3 \| M4 \| M5 \| M5a \| M5ad \| M5d \| M5dn \| M5n \| M5zn \| M6a \| M6g \| M6gd \| M6i \| M6id \| M6idn \| M6in \| M7a \| M7g \| M7gd \| M7i \| M7i-flex \| M8a \| M8azn \| M8g \| M8gd \| M8i \| M8id \| M8i-flex \| Mac1 \| T1 \| T2 \| T3 \| T3a \| T4g
+ **Compute Optimized:** C1 \| C3 \| C4 \| C5 \| C5a \| C5d \| C5n \| C6a \| C6g \| C6gd \| C6gn \| C6i \| C6id \| C6in \| C7a \| C7g \| C7gd \| C7gn \| C7i \| C7i-flex \| C8a \| C8g \| C8gd \| C8gn \| C8i \| C8id \| C8i-flex \| C8in \| C8ine
+ **Memory Optimized:** R3 \| R4 \| R5 \| R5a \| R5ad \| R5b \| R5d \| R5dn \| R5n \| R6a \| R6g \| R6gd \| R6i \| R6id \| R6idn \| R6in \| R7a \| R7g \| R7gd \| R7i \| R7iz \| R8a \| R8g \| R8gd \| R8i \| R8id \| R8i-flex \| U-3tb1 \| U-6tb1 \| U7i-6tb \| X1 \| X1e \| X2idn \| X2iedn \| X2iezn \| X8aedz \| z1d
+ **Storage Optimized:** D2 \| D3 \| D3en \| I2 \| I3 \| I3en \| I4i \| I7i \| I7ie \| I8g \| I8ge \| Im4gn \| Is4gen
+ **Accelerated Computing:** F2 \| G4ad \| G4dn \| G5 \| G5g \| G6 \| G6e \| G6f \| Gr6 \| Gr6f \| G7e \| Inf1 \| Inf2 \| P3dn \| P4d \| P4de \| P5 \| P5en \| VT1
+ **High Performance Computing:** Hpc7g \| Hpc8a
+ **Previous Generation:** A1 \| C1 \| C3 \| C4 \| I2 \| M1 \| M2 \| M3 \| M4 \| P3dn \| R3 \| R4 \| T1

## Canada (Central) — `ca-central-1`
<a name="instance-types-ca-central-1"></a>

The following instance types are available in Canada (Central).
+ **General Purpose:** M4 \| M5 \| M5a \| M5ad \| M5d \| M6a \| M6g \| M6gd \| M6i \| M6id \| M6idn \| M6in \| M7g \| M7i \| M7i-flex \| M8g \| M8gd \| M8i \| M8i-flex \| Mac2-m2 \| T2 \| T3 \| T3a \| T4g
+ **Compute Optimized:** C4 \| C5 \| C5a \| C5d \| C5n \| C6a \| C6g \| C6gd \| C6gn \| C6i \| C6id \| C6in \| C7g \| C7gd \| C7i \| C7i-flex \| C8g \| C8gd \| C8gn \| C8i \| C8i-flex
+ **Memory Optimized:** R4 \| R5 \| R5a \| R5ad \| R5b \| R5d \| R5n \| R6a \| R6g \| R6gd \| R6i \| R7g \| R7i \| R8g \| R8gd \| R8i \| R8i-flex \| U-3tb1 \| U-6tb1 \| U7i-6tb \| X1 \| X1e \| X2idn \| X2iedn
+ **Storage Optimized:** D2 \| D3 \| I3 \| I3en \| I4g \| I4i \| I7i \| I7ie \| I8g \| Im4gn \| Is4gen
+ **Accelerated Computing:** F2 \| G4ad \| G4dn \| G5 \| G6 \| G6f \| Gr6 \| Gr6f \| Inf1 \| P4d \| P5
+ **Previous Generation:** C4 \| M4 \| R4

## Canada West (Calgary) — `ca-west-1`
<a name="instance-types-ca-west-1"></a>

The following instance types are available in Canada West (Calgary).
+ **General Purpose:** M5 \| M5d \| M6g \| M6gd \| M6i \| M6id \| M8g \| T3 \| T4g
+ **Compute Optimized:** C5 \| C6g \| C6gn \| C6i \| C6id \| C6in \| C7g \| C8gn
+ **Memory Optimized:** R5 \| R6g \| R6i \| R6id \| R7g \| R8gd
+ **Storage Optimized:** I3en \| I4i \| I7i \| I7ie

## China (Beijing) — `cn-north-1`
<a name="instance-types-cn-north-1"></a>

The following instance types are available in China (Beijing).
+ **General Purpose:** M1 \| M3 \| M4 \| M5 \| M5a \| M5d \| M6g \| M6i \| M7g \| M8g \| T1 \| T2 \| T3 \| T3a \| T4g
+ **Compute Optimized:** C3 \| C4 \| C5 \| C5a \| C5d \| C6g \| C6gn \| C6i \| C7g \| C8g \| C8gn
+ **Memory Optimized:** R3 \| R4 \| R5 \| R5a \| R5d \| R6g \| R6gd \| R6i \| R7g \| R8g \| U-6tb1 \| X1 \| X2idn \| X2iedn
+ **Storage Optimized:** D2 \| I2 \| I3 \| I3en \| I4i \| I7ie
+ **Accelerated Computing:** G4dn \| G5 \| Inf1
+ **Previous Generation:** C3 \| C4 \| I2 \| M1 \| M3 \| M4 \| R3 \| R4 \| T1

## China (Ningxia) — `cn-northwest-1`
<a name="instance-types-cn-northwest-1"></a>

The following instance types are available in China (Ningxia).
+ **General Purpose:** M4 \| M5 \| M5a \| M5d \| M6g \| M6i \| M7g \| M8g \| T2 \| T3 \| T3a \| T4g
+ **Compute Optimized:** C4 \| C5 \| C5a \| C5d \| C6g \| C6gd \| C6gn \| C6i \| C6in \| C7g \| C8g \| C8gd \| C8gn
+ **Memory Optimized:** R4 \| R5 \| R5a \| R5d \| R6g \| R6gd \| R6i \| R7g \| R8g \| R8gd \| U-6tb1 \| X1 \| X2idn \| X2iedn \| z1d
+ **Storage Optimized:** D2 \| I3 \| I3en \| I4i \| I7ie
+ **Accelerated Computing:** G4dn \| G5 \| Inf1
+ **Previous Generation:** C4 \| M4 \| R4

## Europe (Frankfurt) — `eu-central-1`
<a name="instance-types-eu-central-1"></a>

The following instance types are available in Europe (Frankfurt).
+ **General Purpose:** A1 \| M3 \| M4 \| M5 \| M5a \| M5ad \| M5d \| M5dn \| M5n \| M5zn \| M6a \| M6g \| M6gd \| M6i \| M6id \| M6idn \| M6in \| M7a \| M7g \| M7gd \| M7i \| M7i-flex \| M8a \| M8azn \| M8g \| M8gd \| M8i \| M8id \| M8i-flex \| M9g \| M9gd \| Mac1 \| Mac2-m2 \| Mac-m4 \| T2 \| T3 \| T3a \| T4g
+ **Compute Optimized:** C3 \| C4 \| C5 \| C5a \| C5ad \| C5d \| C5n \| C6a \| C6g \| C6gd \| C6gn \| C6i \| C6id \| C6in \| C7a \| C7g \| C7gd \| C7i \| C7i-flex \| C8a \| C8g \| C8gd \| C8gn \| C8i \| C8id \| C8i-flex
+ **Memory Optimized:** R3 \| R4 \| R5 \| R5a \| R5ad \| R5b \| R5d \| R5dn \| R5n \| R6a \| R6g \| R6gd \| R6i \| R6id \| R6idn \| R6in \| R7a \| R7g \| R7gd \| R7i \| R7iz \| R8a \| R8g \| R8gd \| R8i \| R8id \| R8i-flex \| U-3tb1 \| U-6tb1 \| U7i-6tb \| U7i-8tb \| U7i-12tb \| U7in-16tb \| U7in-24tb \| X1 \| X1e \| X2idn \| X2iedn \| X8g \| X8i \| z1d
+ **Storage Optimized:** D2 \| D3 \| D3en \| I2 \| I3 \| I3en \| I4i \| I7i \| I7ie \| I8g \| I8ge \| Im4gn \| Is4gen
+ **Accelerated Computing:** DL2q \| F2 \| G4ad \| G4dn \| G5 \| G5g \| G6 \| G6e \| G6f \| Gr6 \| Gr6f \| Inf1 \| Inf2 \| P4d \| P4de
+ **Previous Generation:** A1 \| C3 \| C4 \| I2 \| M3 \| M4 \| R3 \| R4

## Europe (Ireland) — `eu-west-1`
<a name="instance-types-eu-west-1"></a>

The following instance types are available in Europe (Ireland).
+ **General Purpose:** A1 \| M1 \| M2 \| M3 \| M4 \| M5 \| M5a \| M5ad \| M5d \| M5dn \| M5n \| M5zn \| M6a \| M6g \| M6gd \| M6i \| M6id \| M6idn \| M6in \| M7a \| M7g \| M7gd \| M7i \| M7i-flex \| M8a \| M8g \| M8gb \| M8gd \| M8gn \| M8i \| M8i-flex \| Mac1 \| Mac2 \| Mac-m4 \| T1 \| T2 \| T3 \| T3a \| T4g
+ **Compute Optimized:** C1 \| C3 \| C4 \| C5 \| C5a \| C5ad \| C5d \| C5n \| C6a \| C6g \| C6gd \| C6gn \| C6i \| C6id \| C6in \| C7a \| C7g \| C7gd \| C7gn \| C7i \| C7i-flex \| C8a \| C8g \| C8gd \| C8gn \| C8i \| C8i-flex
+ **Memory Optimized:** R3 \| R4 \| R5 \| R5a \| R5ad \| R5b \| R5d \| R5dn \| R5n \| R6a \| R6g \| R6gd \| R6i \| R6id \| R6idn \| R6in \| R7a \| R7g \| R7gd \| R7i \| R7iz \| R8a \| R8g \| R8gd \| R8i \| R8i-flex \| U-3tb1 \| U-6tb1 \| U7i-6tb \| U7i-8tb \| U7i-12tb \| U7in-16tb \| X1 \| X1e \| X2gd \| X2idn \| X2iedn \| X2iezn \| X8g \| X8aedz \| X8i \| z1d
+ **Storage Optimized:** D2 \| D3 \| D3en \| H1 \| I2 \| I3 \| I3en \| I4g \| I4i \| I7i \| I7ie \| I8g \| I8ge \| Im4gn \| Is4gen
+ **Accelerated Computing:** G4ad \| G4dn \| G5 \| Inf1 \| Inf2 \| P3dn \| P4d \| VT1
+ **High Performance Computing:** Hpc7a \| Hpc7g
+ **Previous Generation:** A1 \| C1 \| C3 \| C4 \| I2 \| M1 \| M2 \| M3 \| M4 \| P3dn \| R3 \| R4 \| T1

## Europe (London) — `eu-west-2`
<a name="instance-types-eu-west-2"></a>

The following instance types are available in Europe (London).
+ **General Purpose:** M4 \| M5 \| M5a \| M5ad \| M5d \| M6a \| M6g \| M6gd \| M6i \| M6id \| M6idn \| M6in \| M7a \| M7g \| M7i \| M7i-flex \| M8g \| M8gd \| M8i \| M8i-flex \| Mac1 \| T2 \| T3 \| T3a \| T4g
+ **Compute Optimized:** C4 \| C5 \| C5a \| C5d \| C5n \| C6a \| C6g \| C6gd \| C6gn \| C6i \| C6id \| C6in \| C7a \| C7g \| C7gd \| C7i \| C7i-flex \| C8g \| C8gd \| C8gn \| C8i \| C8i-flex
+ **Memory Optimized:** R4 \| R5 \| R5a \| R5ad \| R5b \| R5d \| R5n \| R6a \| R6g \| R6gd \| R6i \| R6id \| R7g \| R7gd \| R7i \| R8g \| R8gd \| R8i \| R8i-flex \| U-6tb1 \| U7i-6tb \| U7i-8tb \| U7in-16tb \| X1 \| X2idn \| X2iedn \| z1d
+ **Storage Optimized:** D2 \| D3 \| I3 \| I3en \| I4i \| I7i \| I7ie \| I8g \| Im4gn \| Is4gen
+ **Accelerated Computing:** F2 \| G4ad \| G4dn \| G5 \| G6 \| G6f \| Gr6 \| Gr6f \| G7e \| Inf1 \| Inf2 \| P4d \| P5 \| P5e
+ **Previous Generation:** C4 \| M4 \| R4

## Europe (Milan) — `eu-south-1`
<a name="instance-types-eu-south-1"></a>

The following instance types are available in Europe (Milan).
+ **General Purpose:** M5 \| M5a \| M5d \| M6a \| M6g \| M6gd \| M6i \| M6id \| M7i \| M8g \| T3 \| T3a \| T4g
+ **Compute Optimized:** C5 \| C5a \| C5ad \| C5d \| C5n \| C6g \| C6gn \| C6i \| C6id \| C6in \| C7g \| C8g \| C8gn
+ **Memory Optimized:** R5 \| R5a \| R5b \| R5d \| R5dn \| R5n \| R6g \| R6i \| R7g \| R7gd \| R7i \| U-3tb1 \| U-6tb1 \| U7i-6tb \| U7i-8tb \| U7i-12tb \| X2idn \| X2iedn
+ **Storage Optimized:** D2 \| I3 \| I3en \| I4i \| I7i \| I7ie \| Im4gn
+ **Accelerated Computing:** G4dn \| Inf1

## Europe (Paris) — `eu-west-3`
<a name="instance-types-eu-west-3"></a>

The following instance types are available in Europe (Paris).
+ **General Purpose:** M5 \| M5a \| M5ad \| M5d \| M6a \| M6g \| M6gd \| M6i \| M7g \| M7gd \| M7i \| M7i-flex \| M8g \| M8i \| M8i-flex \| T2 \| T3 \| T3a \| T4g
+ **Compute Optimized:** C5 \| C5a \| C5d \| C5n \| C6g \| C6gd \| C6gn \| C6i \| C6id \| C6in \| C7g \| C7gd \| C7i \| C7i-flex \| C8i \| C8i-flex
+ **Memory Optimized:** R4 \| R5 \| R5a \| R5ad \| R5d \| R5dn \| R5n \| R6g \| R6gd \| R6i \| R7g \| R7gd \| R7i \| R8g \| R8i \| R8i-flex \| U-3tb1 \| U-6tb1 \| U7i-6tb \| U7i-12tb \| U7in-16tb \| X1 \| X2idn \| X2iedn \| X8i
+ **Storage Optimized:** D2 \| D3 \| I3 \| I3en \| I4i \| I7ie \| I8ge \| Im4gn \| Is4gen
+ **Accelerated Computing:** G4dn \| G6 \| Gr6 \| Inf1 \| Inf2
+ **High Performance Computing:** Hpc6id \| Hpc7a
+ **Previous Generation:** R4

## Europe (Spain) — `eu-south-2`
<a name="instance-types-eu-south-2"></a>

The following instance types are available in Europe (Spain).
+ **General Purpose:** M5 \| M5d \| M6g \| M6gd \| M6id \| M6idn \| M6in \| M7a \| M7g \| M7gd \| M7i \| M7i-flex \| M8a \| M8g \| M8gd \| M8i \| M8id \| M8i-flex \| M8in \| M8idn \| M8ib \| M8idb \| T3 \| T4g
+ **Compute Optimized:** C5 \| C5d \| C6g \| C6gd \| C6in \| C7a \| C7g \| C7gd \| C7i \| C7i-flex \| C8a \| C8g \| C8gd \| C8gn \| C8i \| C8id \| C8i-flex \| C8in
+ **Memory Optimized:** R5 \| R5d \| R6g \| R6gd \| R6id \| R7a \| R7g \| R7gd \| R7i \| R8a \| R8g \| R8gd \| R8i \| R8id \| R8i-flex \| R8in \| R8idn \| R8ib \| R8idb \| U-6tb1 \| U7i-12tb \| X2idn \| X2iedn
+ **Storage Optimized:** I3 \| I3en \| I4i \| I7i \| I7ie \| I8g \| Im4gn
+ **Accelerated Computing:** G5g \| G6 \| G6e \| G6f \| Gr6 \| Gr6f \| G7e \| P5en

## Europe (Stockholm) — `eu-north-1`
<a name="instance-types-eu-north-1"></a>

The following instance types are available in Europe (Stockholm).
+ **General Purpose:** M5 \| M5d \| M6g \| M6gd \| M6i \| M6idn \| M6in \| M7a \| M7g \| M7gd \| M7i \| M7i-flex \| M8g \| Mac1 \| T3 \| T4g
+ **Compute Optimized:** C5 \| C5a \| C5d \| C5n \| C6g \| C6gd \| C6gn \| C6i \| C6in \| C7a \| C7g \| C7gd \| C7i \| C7i-flex \| C8g \| C8gn
+ **Memory Optimized:** R5 \| R5b \| R5d \| R5dn \| R5n \| R6g \| R6gd \| R6i \| R6idn \| R6in \| R7a \| R7g \| R7gd \| R7i \| R8g \| U-6tb1 \| U7i-6tb \| U7i-8tb \| U7i-12tb \| U7in-24tb \| X2idn \| X2iedn \| X8g \| X8aedz \| X8i
+ **Storage Optimized:** D2 \| I3 \| I3en \| I4i \| I7i \| I7ie \| I8g \| I8ge
+ **Accelerated Computing:** G4dn \| G5 \| G6 \| G6e \| G6f \| Gr6 \| Gr6f \| Inf1 \| Inf2 \| P4d \| P5 \| P5e \| P5en
+ **High Performance Computing:** Hpc6a \| Hpc6id \| Hpc7a \| Hpc8a

## Europe (Zurich) — `eu-central-2`
<a name="instance-types-eu-central-2"></a>

The following instance types are available in Europe (Zurich).
+ **General Purpose:** M5 \| M5d \| M6g \| M6gd \| M6i \| M6id \| M6idn \| M6in \| M7g \| M7i \| M8g \| T3 \| T4g
+ **Compute Optimized:** C5 \| C5d \| C6g \| C6gd \| C6in \| C7g \| C7gd \| C7i \| C7i-flex \| C8g \| C8gn
+ **Memory Optimized:** R5 \| R5d \| R6g \| R6gd \| R6i \| R7g \| R8g \| U-3tb1 \| U-6tb1 \| U7i-8tb \| X2idn \| X2iedn
+ **Storage Optimized:** D3 \| I3 \| I3en \| I4i \| I7i \| I7ie
+ **Accelerated Computing:** G6 \| Gr6

## Israel (Tel Aviv) — `il-central-1`
<a name="instance-types-il-central-1"></a>

The following instance types are available in Israel (Tel Aviv).
+ **General Purpose:** M5 \| M5d \| M6g \| M6gd \| M6i \| M6id \| M7g \| M7i \| T3 \| T3a \| T4g
+ **Compute Optimized:** C5 \| C5d \| C6g \| C6gn \| C6i \| C6id \| C6in \| C7g
+ **Memory Optimized:** R5 \| R5d \| R6g \| R6i \| R6id \| R7g \| R7gd \| U-6tb1 \| X2idn
+ **Storage Optimized:** D3 \| I3 \| I3en \| I4i
+ **Accelerated Computing:** G5 \| P4de

## Mexico (Central) — `mx-central-1`
<a name="instance-types-mx-central-1"></a>

The following instance types are available in Mexico (Central).
+ **General Purpose:** M6g \| M6gd \| M6i \| M6id \| M7g \| M7gd \| M7i \| M7i-flex \| T3 \| T4g
+ **Compute Optimized:** C6g \| C6gn \| C6i \| C6id \| C6in \| C7g \| C7i \| C7i-flex
+ **Memory Optimized:** R6g \| R6i \| R6id \| R7g \| R7gd \| R7i \| R8g
+ **Storage Optimized:** I3en \| I4i \| I7ie

## Middle East (Bahrain) — `me-south-1`
<a name="instance-types-me-south-1"></a>

The following instance types are available in Middle East (Bahrain).
+ **General Purpose:** M5 \| M5d \| M6g \| M6gd \| M6i \| M7g \| M8g \| T3 \| T4g
+ **Compute Optimized:** C5 \| C5a \| C5ad \| C5d \| C5n \| C6g \| C6gn \| C6i \| C6in \| C7g
+ **Memory Optimized:** R5 \| R5d \| R6g \| R6i \| R7g \| X2idn
+ **Storage Optimized:** D2 \| I3 \| I3en \| I4i
+ **Accelerated Computing:** G4dn \| Inf1

## Middle East (UAE) — `me-central-1`
<a name="instance-types-me-central-1"></a>

The following instance types are available in Middle East (UAE).
+ **General Purpose:** M5 \| M5d \| M6g \| M6gd \| M6i \| M7g \| M7gd \| M7i \| M8g
+ **Compute Optimized:** C5 \| C5d \| C6g \| C6in \| C7i \| C8gn
+ **Memory Optimized:** R5 \| R5d \| R6g \| R6i \| R7g \| R7gd \| R8g \| R8i \| X2idn \| X2iezn
+ **Storage Optimized:** I3 \| I3en \| I4i \| I7i
+ **Accelerated Computing:** G5 \| G6 \| G6e \| P5en

## South America (Sao Paulo) — `sa-east-1`
<a name="instance-types-sa-east-1"></a>

The following instance types are available in South America (Sao Paulo).
+ **General Purpose:** M1 \| M2 \| M3 \| M4 \| M5 \| M5a \| M5ad \| M5d \| M5zn \| M6a \| M6g \| M6gd \| M6i \| M6id \| M7g \| M7gd \| M7i \| M7i-flex \| M8g \| M8gd \| M8i \| M8i-flex \| T1 \| T2 \| T3 \| T3a \| T4g
+ **Compute Optimized:** C1 \| C3 \| C4 \| C5 \| C5a \| C5ad \| C5d \| C5n \| C6a \| C6g \| C6gd \| C6gn \| C6i \| C6id \| C6in \| C7g \| C7gd \| C7i \| C7i-flex \| C8g \| C8gd \| C8gn \| C8i \| C8i-flex
+ **Memory Optimized:** R3 \| R4 \| R5 \| R5a \| R5ad \| R5b \| R5d \| R5n \| R6g \| R6gd \| R6i \| R7g \| R7gd \| R7i \| R8g \| R8gd \| R8i \| R8i-flex \| U-3tb1 \| U-6tb1 \| U7i-6tb \| U7i-8tb \| U7i-12tb \| X1 \| X1e \| X2idn \| X2iedn
+ **Storage Optimized:** I3 \| I3en \| I4g \| I4i \| I7i \| I7ie \| I8g
+ **Accelerated Computing:** G4dn \| G5 \| G6 \| G6f \| Gr6 \| Gr6f \| Inf1 \| Inf2 \| P4d \| P5 \| P5e \| Trn2
+ **Previous Generation:** C1 \| C3 \| C4 \| M1 \| M2 \| M3 \| M4 \| R3 \| R4 \| T1

## AWS GovCloud (US-East) — `us-gov-east-1`
<a name="instance-types-us-gov-east-1"></a>

The following instance types are available in AWS GovCloud (US-East).
+ **General Purpose:** M5 \| M5a \| M5d \| M5dn \| M5n \| M6g \| M6gd \| M6i \| M7g \| M7i \| M7i-flex \| M8g \| T3 \| T3a \| T4g
+ **Compute Optimized:** C5 \| C5a \| C5d \| C5n \| C6g \| C6gd \| C6gn \| C6i \| C6in \| C7g \| C7gd \| C7i \| C8gn
+ **Memory Optimized:** R5 \| R5a \| R5d \| R5dn \| R5n \| R6g \| R6gd \| R6i \| R7g \| R7gd \| R7i \| R8g \| U-6tb1 \| U7i-6tb \| U7i-12tb \| U7in-16tb \| U7in-24tb \| X1 \| X1e \| X2idn \| X2iedn
+ **Storage Optimized:** I3 \| I3en \| I4i \| I7i \| I7ie
+ **Accelerated Computing:** G4dn \| G6 \| Gr6 \| Inf1 \| P3dn \| P6-B300
+ **High Performance Computing:** Hpc6a

## AWS GovCloud (US-West) — `us-gov-west-1`
<a name="instance-types-us-gov-west-1"></a>

The following instance types are available in AWS GovCloud (US-West).
+ **General Purpose:** M5 \| M5a \| M5ad \| M5d \| M5dn \| M5n \| M6g \| M6gd \| M6i \| M6id \| M6idn \| M6in \| M7g \| M7i \| M7i-flex \| M8a \| M8g \| M8i \| M8i-flex \| T2 \| T3 \| T3a \| T4g
+ **Compute Optimized:** C5 \| C5a \| C5d \| C5n \| C6g \| C6gd \| C6gn \| C6i \| C6id \| C6in \| C7g \| C7gd \| C7i \| C7i-flex \| C8g \| C8gn
+ **Memory Optimized:** R5 \| R5a \| R5ad \| R5d \| R5dn \| R5n \| R6g \| R6gd \| R6i \| R6id \| R6idn \| R6in \| R7g \| R7gd \| R7i \| R8g \| R8i \| R8i-flex \| U-3tb1 \| U-6tb1 \| U7i-6tb \| U7i-8tb \| U7i-12tb \| U7in-16tb \| U7in-24tb \| X1 \| X1e \| X2idn \| X2iedn
+ **Storage Optimized:** D3 \| I3 \| I3en \| I3p \| I4i \| I7i \| I7ie
+ **Accelerated Computing:** F1 \| G3 \| G3s \| G4dn \| G6 \| Gr6 \| Inf1 \| P2 \| P3 \| P3dn \| P4d \| P5 \| P5en \| P6-B200
+ **High Performance Computing:** Hpc6a \| Hpc6id \| Hpc7a \| Hpc7g \| Hpc8a
+ **Previous Generation:** C4 \| G3 \| M4 \| R4

## AWS European Sovereign Cloud — `eusc-de-east-1`
<a name="instance-types-eusc-de-east-1"></a>

The following instance types are available in AWS European Sovereign Cloud.
+ **General Purpose:** M6g \| M6gd \| M6i \| M6id \| M7g \| M7gd \| M7i \| M7i-flex \| T3 \| T4g
+ **Compute Optimized:** C6g \| C6gn \| C6i \| C6id \| C7g \| C7i \| C7i-flex
+ **Memory Optimized:** R6g \| R6i \| R6id \| R7g \| R7gd \| R7i
+ **Storage Optimized:** I3en \| I4i
+ **Accelerated Computing:** G6