# Proposed Algorithm: Adaptive Hybrid FHSS with Jammer-Aware Mesh Routing (AHF-JAMR)

## Proposed Algorithm

**Core Idea:** Combine link-layer FHSS with network-layer routing that avoids geographic regions where jamming is detected, using low-cost SDRs for sensing.

### 1. Link Layer: Collaborative FHSS
- **Structure:** 
  - Global FHSS sequence (known to all nodes) for initial sync.
  - Per-cluster adaptive offset: UAV/HAPS clusters adjust sequence start time based on local jammed channels.
- **Low-Cost Mechanism:**
  - Each node uses its comms radio (e.g., ESP32-WROOM with LoRa) to monitor PER on current channel.
  - If PER > threshold (e.g., 30%) for 10 consecutive packets, trigger:
    - Local: Switch to next channel in FHSS sequence.
    - Cluster Head: Broadcast jammed channel report to neighbors.
- **Why Low-Cost:** Uses existing comms radio for sensing; no extra SDR needed for basic detection.

### 2. Network Layer: Jammer-Aware Geographic Routing
- **Jammeed Map Building:**
  - Nodes report: (timestamp, location, jammed_channel, duration) to mesh via low-priority beacon.
  - Each node maintains decaying heatmap of jammed areas (simple grid-based).
- **Routing Decision:**
  - When selecting next hop, penalize paths going through recently jammed grid cells.
  - Use modified ETX (Expected Transmission Count) metric: `ETX_adj = ETX_base * (1 + jam_factor)`
  - `jam_factor` = 0 if no recent jamming, up to 1.0 if persistent jamming in cell.
- **Why Low-Cost:** 
  - Location from cheap GPS module (~$25) or dead reckoning from IMU.
  - Heatmap stored as small array in node memory (e.g., 10x10 grid = 100 bytes).

### 3. Cross-Layer Trigger for HAPS/Satellite Assist
- If mesh network detects widespread jamming (e.g., >40% nodes reporting), trigger:
  - HAPS/UAV to activate high-gain, narrow-beam link to satellite (using different frequency band).
  - Satellite acts as jammed-bypass relay for critical traffic.
- **Low-Cost Angle:** 
  - Satellite link only activated during jamming events (saves power).
  - Uses same SDR for both mesh and satellite bands (if frequency agile).

### Validation Path for Simulation
1. **NS-3 Module:** Extend `ns3::WifiMac` or create custom MAC for FHSS logic.
2. **Jammer Model:** Implement mobile barrage jammer with configurable power/mobility.
3. **Metrics:** 
   - PDR under jamming vs. baseline (no FHSS, no geo-avoidance)
   - Control overhead (bytes for jam reports)
   - Convergence time after jammer appearance
4. **Scenario:** 
   - 5 HALE UAVs forming line-of-sight mesh over Indonesian archipelago.
   - One jammer targeting central link.
   - Monitor how quickly mesh reroutes around jammed zone via UAVs on flanks.