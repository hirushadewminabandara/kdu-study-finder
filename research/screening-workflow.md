# Paper Screening and Annotation Workflow

## Phase 1: Title/Abstract Screening (Speed: ~2 min/paper)
**Goal:** Rapid exclusion of clearly irrelevant papers.
**Criteria:**
- [ ] Clearly not about aerial/satellite comms (e.g., ground IoT only)
- [ ] No mention of jamming, interference, or EW
- [ ] Purely theoretical with no simulation/experiment
- [ ] Published before 2020 (unless seminal)
- [ ] Not accessible (paywall without uni access)

**Output:** 
- Move PDF to `research/papers/to-review/` if passes
- Log excluded papers in `research/search-logs/excluded.csv` with reason

## Phase 2: Full-Text Review (Depth: ~15-20 min/paper)
**Goal:** Extract key details for synthesis.
**Template for each paper (`research/annotations/[first-author]-[year].md`):**
```markdown
# [Full Title]
**Authors:** [List]
**Venue:** [Journal/Conference, Year]
**DOI/URL:** [Link]
**Access:** [Open Access / Uni Paywall / Requested]

## 1. Core Contribution (2-3 sentences)
[What problem does this solve? How?]

## 2. Platform & Setup
- **Platform Type:** [Satellite/HAPS/UAV/Ground]
- **Specific Hardware:** [e.g., USRP, Raspberry Pi, specific UAV model]
- **Frequency Band:** [e.g., 2.4 GHz, 5.8 GHz, L-band]
- **Network Scale:** [Number of nodes, topology]

## 3. Jamming Scenario
- **Jammer Type:** [Barrage, sweep-tone, reactive, etc.]
- **Power:** [If specified, e.g., 20 dBm]
- **Detection Method:** [RSSI, PER, spectrum sensing]

## 4. Countermeasure Employed
- **Primary Technique:** [FHSS, DSSS, cognitive radio, etc.]
- **Parameters:** [e.g., hop rate, sequence length]
- **Adaptation Logic:** [How does it respond to jamming?]

## 5. Results & Metrics
- **Key Metric:** [e.g., Packet Delivery Ratio, throughput]
- **Baseline:** [Performance without countermeasure]
- **Improvement:** [e.g., "PDR increased from 0.3 to 0.85 under barrage jamming"]
- **Limitations:** [Scalability, power cost, latency]

## 6. Relevance to Indo-Pacific Low-Cost Goal
- **Strengths:** [e.g., "Uses RTL-SDR for sensing - under $30"]
- **Gaps:** [e.g., "Tested in lab, no weather/tropical attenuation considered"]
- **Adaptable For:** [e.g., "FHSS logic could apply to HALE UAV mesh links"]

## 7. References to Follow
- [List 2-3 relevant citations from this paper]
```

## Phase 3: Categorization and Tagging
**Goal:** Enable cross-paper analysis by theme.
**Tags to apply in each annotation file (add to frontmatter or bottom):**
```
tags: [#fhsstt, #cognitive-radio, #haps-comms, #uav-mesh, #indo-pacific, #low-cost, #sdr-testbed]
```
**Tag Definitions:**
- `#fhsstt`: Frequency Hopping or Spread Spectrum Techniques
- `#cognitive-radio`: Dynamic spectrum access, spectrum sensing
- `#haps-comms`: Specific to HAPS platform communications
- `#uav-mesh`: UAV-to-UAV or UAV-to-ground mesh
- `#indo-pacific`: Explicitly considers regional factors
- `#low-cost`: Uses COTS <$500/node or similar
- `#sdr-testbed`: Validated with hardware like USRP, RTL-SDR, HackRF

## Synthesis Preparation
**Weekly:** Run script to extract tagged insights:
```bash
# Example: Find all papers mentioning FHSS for low-cost UAV
grep -r "#fhsstt .* #low-cost .* #uav-mesh" research/annotations/ --include="*.md"
```
Output feeds directly into gap analysis and algorithm design.