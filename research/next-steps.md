# Next Steps: From Research to Simulation

## Immediate Actions (Next 1-3 Days)
1. **Set up simulation environment** (NS-3 + GNU Radio) in WSL Ubuntu
   - Follow Hermes-guided installation steps
   - Verify with `./ns3 run "first"`
2. **Create baseline FHSS simulation**
   - Modify NS-3's `wifi-adhoc-txpower` or similar example
   - Implement simple channel hopping based on timer
   - Test with stationary jammer (constant interference on one channel)
3. **Extract parameters from literature**
   - From annotated bibliographies: typical hop dwell times, PER thresholds, jammer power levels
   - Populate `config/simulation-parameters.yaml`

## Short-Term Goals (Week 2)
1. **Implement jammer detection via PER**
   - Add RSSI/PER monitoring to MAC layer
   - Trigger channel switch when PER > 30% for 10 packets
2. **Build geographic jammer map**
   - Add GPS module simulation to nodes
   - Implement decaying heatmap array (10x10 grid)
   - Modify routing to avoid jammed cells (use OLSR or simple flooding)
3. **Run Indo-Pacific scenario**
   - 5-node UAV mesh over 10kmx10km area
   - Mobile jammer (barrage, 20dBm) sweeping across center
   - Measure PDR vs. baseline (no adaptation)

## Medium-Term Goals (Week 3-4)
1. **Integrate HAPS/satellite bypass**
   - Simulate HAPS node with dual-radio (mesh + satellite band)
   - Trigger satellite link when mesh PDR < 0.4
   - Model satellite relay with higher altitude, less jamming susceptibility
2. **Add weather effects**
   - Implement ITU-R P.618 rain fade model for tropical convection
   - Vary attenuation based on simulated altitude/location
3. **Prepare for hardware testbed**
   - Bill of Materials: Raspberry Pi 4 + RTL-SDR + GPS module (~$120/node)
   - Simple test: Two nodes with FHSS, jammer using HackRF

## Success Criteria for Algorithm Validation
- **Primary:** PDR > 0.6 under sustained jamming (barrage, 20dBm) where baseline PDR < 0.2
- **Secondary:** Control overhead < 15% of total bandwidth
- **Tertiary:** Convergence to new path < 5 seconds after jammer appearance

## Open Questions for Further Research
- How does FHSS sequence length affect resurgence vs. reactive jamming?
- Can we use machine learning (on-node) to predict jammer movement with low compute?
- What is the optimal tradeoff between hop frequency and synchronization overhead in mobile networks?