# Research Scope: Jamming-Resistant Comms in Indo-Pacific

## Indo-Pacific geographic constraints
- Archipelagic terrain (Indonesia, Philippines)
- Tropical weather (monsoons affecting UAV/HAPS operations)
- Dense urban environments (Singapore, Hong Kong)
- Remote oceanic areas (limited ground infrastructure)

## Threat Model
- Adversary jamming: barrage, sweep-tone, reactive (follows FHSS)
- Frequency bands: L-band (satellite), S/C-band (HAPS/UAV), 2.4/5.8 GHz (ISM for mesh)
- Power constraints: Assume low-cost jammers (SDR-based) vs. high-power military systems

## Platform Focus
- **Satellite**: LEO constellations (Starlink, OneWeb) - focus on crosslink potential
- **HAPS**: Solar-powered stratospheric platforms (Zephyr, HAPSMobile)
- **HALE UAV**: Long-endurance fixed-wing (Global Hawk, Solar Eagle)
- **Mesh Network**: Node-to-node communication using commercial Wi-Fi/LoRa modems

## Jamming Countermeasures of Interest
- Frequency Hopping Spread Spectrum (FHSS)
- Direct Sequence Spread Spectrum (DSSS)
- Cognitive Radio / Dynamic Spectrum Access
- Spatial Nulling (beamforming)
- Adaptive Power Control
- Hybrid Terrestrial-Satellite Routing

## Low-Cost Emphasis
- Target: <$500 per node for prototyping
- Prefer COTS components (Raspberry Pi, RTL-SDR, Wi-Fi adapters)
- Avoid classified/military-specific techniques