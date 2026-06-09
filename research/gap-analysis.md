# Gap Analysis: Jamming-Resistant Comms for Low-Cost Aerial Networks

## Identified Gaps (from literature review)
1. **Cross-Layer FHSS for Heterogeneous Networks**: Most FHSS studies assume homogeneous nodes (all same radio). Little work on synchronizing FHSS across dissimilar platforms (e.g., HAPS gateway using different radio than UAV mesh nodes).
   - *Evidence:* [Annotated papers lacking cross-platform sync discussion]
   
2. **Real-Time Jammer Localization for Adaptive Routing**: Papers detect jamming via RSSI/PER but rarely use that data to actively route *around* the jammer's geographic footprint (especially relevant for mobile UAV/HAPS).
   - *Evidence:* [Papers focus on channel hopping, not path reconfiguration]

3. **Tropical Weather Modeling in Simulations**: NS-3/GNU Radio studies often use free-space or simple rain fade models, not specific to Indo-Pacific convection/scintillation.
   - *Evidence:* [Simulation papers citing generic ITU-R models without regional validation]

4. **Ultra-Low-Cost Jammer Detection**: Many techniques require spectrum sensing hardware (costly SDRs). Few explore using comms radio itself for detection (e.g., PER-based triggering on existing link).
   - *Evidence:* [Survey papers highlighting SDR cost as barrier]

5. **Hybrid Satellite-HAPS-UAV Handover**: Most works study pairs (sat-UAV or HAPS-ground). Seamless handover across all three layers under jamming is unexplored.
   - *Evidence:* [Review papers noting lack of integrated tri-layer studies]
