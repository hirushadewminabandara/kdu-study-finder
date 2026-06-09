# Technology Assessment Matrix: Platforms vs. Techniques

**Purpose:** Evaluate feasibility of combining each platform with jamming countermeasures for low-cost Indo-Pacific deployment.

| Platform | FHSS Feasibility | Cognitive Radio Feasibility | Spatial Nulling Feasibility | Low-Cost Path (<$500/node) | Indo-Pacific Suitability | Key References |
|----------|------------------|-----------------------------|-----------------------------|----------------------------|--------------------------|----------------|
| Satellite | Medium: Crosslink FHSS possible but complex | Low: Requires agile payload; power-intensive | Very Low: Beamforming needs large antenna array | **Low**: User terminal ~$500, but satellite itself not low-cost | Medium: Weather affects links; orbital prediction helps avoid jamming zones | [Ref 1], [Ref 2] |
| HAPS | High: Stationary-ish, predictable motion aids FHSS sync | High: Ample power/solar for agile radio | Medium: Platform size allows some beamforming | **Medium**: Platform expensive, but payload can be COTS radio + Pi | **High**: Above weather, long dwell time over target area | [Ref 3], [Ref 4] |
| HALE UAV | High: Proven in systems like Global Hawk datalinks | Medium: Depends on payload capacity | Low-Medium: Smaller platform limits antenna array | **High**: Can retrofit COTS SDR + Pi to existing UAV | **High**: Flexible deployment, can loiter in gaps; weather mitigated by altitude | [Ref 5], [Ref 6] |
| Mesh Nodes | High: Standard in Wi-Fi/LoRa | High: Cognitive radio mesh active research | Low: Requires antenna arrays per node | **Very High**: RTL-SDR + Pi ~$100/node | **Low**: Vulnerable to terrain blockage; needs line-of-sight | [Ref 7], [Ref 8] |

## Notes Column Guidance
- **Feasibility**: High/Medium/Low based on literature evidence of implementation
- **Low-Cost Path**: Estimated cost for comms payload only (not whole platform)
- **Indo-Pacific Suitability**: Considers weather, terrain, threat environment
- **Key References**: Top 1-2 papers from annotation set supporting assessment

## Example Entry (to be filled after literature review)
| **HAPS** | High: Zephyr program tested frequency agility | High: HAPSMobile testing LTE/5G NR with dynamic spectrum | Medium: Wingspan allows phased array experiments | Medium: Stratos platform ~$M, but comms pod could be <$50k using SDR | **High**: 20km altitude avoids monsoon convection, provides LOS over islands | [Zephyr Comms Paper 2023], [HAPSMobile Trial Report] |