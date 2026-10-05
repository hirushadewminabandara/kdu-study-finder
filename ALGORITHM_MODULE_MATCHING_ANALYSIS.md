# Technical Analysis: Module Cardinality & The 60% Compatibility Phenomenon

## Executive Summary

In **KDU StudyConnect**, a peer compatibility score between two students is calculated using a **60 / 40 dual-factor algorithm**:
* **60%** allocated to **Course Overlap** ($S_{\text{course}}$).
* **40%** allocated to **Weekly Availability Overlap** ($S_{\text{avail}}$).

A notable algorithmic phenomenon occurs when evaluating two students who share **1 module** versus two students who share **5 modules**: under conditions of zero timetable overlap, **both pairs receive an identical match score of 60%**.

This document provides a comprehensive technical breakdown of:
1. Why this mathematical equivalence occurs.
2. The architectural rationale behind choosing Min-Normalized Intersection over standard Jaccard similarity.
3. The operational trade-off (Cardinality & Scale Insensitivity).
4. Proposed mathematical solutions to differentiate pairs with higher shared module counts.

---

## 1. The Core Formulation

The system executes the peer matching algorithm in [`app.js`](app.js#L150-L181):

$$\text{Final Compatibility Score} = \left( 0.60 \times S_{\text{course}} + 0.40 \times S_{\text{avail}} \right) \times 100\%$$

### Min-Normalized Course Overlap ($S_{\text{course}}$)
Rather than using standard Jaccard intersection over union, the course score is defined using the **Overlap Coefficient (Szymkiewicz–Simpson Coefficient)**:

$$S_{\text{course}}(A, B) = \frac{|\mathcal{C}_A \cap \mathcal{C}_B|}{\min(|\mathcal{C}_A|, |\mathcal{C}_B|)}$$

Where:
* $\mathcal{C}_A$ is the set of course/module IDs registered to Student $A$.
* $\mathcal{C}_B$ is the set of course/module IDs registered to Student $B$.
* $|\mathcal{C}_A \cap \mathcal{C}_B|$ represents the count of identical shared modules.
* $\min(|\mathcal{C}_A|, |\mathcal{C}_B|)$ is the size of the smaller student course load.

---

## 2. Mathematical Proof: Why 1 Shared Module = 5 Shared Modules = 60%

When two students have no overlapping free hours ($S_{\text{avail}} = 0$), the schedule component vanishes:

$$\text{Score} = \left( 0.60 \times S_{\text{course}} + 0.40 \times 0 \right) \times 100\% = 0.60 \times S_{\text{course}} \times 100\%$$

The total score is thus strictly determined by $S_{\text{course}}$.

### Scenario A: Sharing 1 Module
Consider Student $A$ enrolled in 1 module (e.g., a student clearing a repeat module or a single elective) and Student $B$ enrolled in 1 module (or multiple modules containing that 1 module):
* $|\mathcal{C}_A| = 1$
* $|\mathcal{C}_A \cap \mathcal{C}_B| = 1$
* $\min(|\mathcal{C}_A|, |\mathcal{C}_B|) = 1$

$$S_{\text{course}} = \frac{1}{\min(1, |\mathcal{C}_B|)} = \frac{1}{1} = 1.0 \quad (100\%)$$

$$\text{Final Score} = (0.60 \times 1.0 + 0.40 \times 0) \times 100\% = \mathbf{60\%}$$

### Scenario B: Sharing 5 Modules
Consider Student $A$ and Student $B$ both enrolled in 5 semester modules and sharing all 5:
* $|\mathcal{C}_A| = 5, \quad |\mathcal{C}_B| = 5$
* $|\mathcal{C}_A \cap \mathcal{C}_B| = 5$
* $\min(|\mathcal{C}_A|, |\mathcal{C}_B|) = \min(5, 5) = 5$

$$S_{\text{course}} = \frac{5}{\min(5, 5)} = \frac{5}{5} = 1.0 \quad (100\%)$$

$$\text{Final Score} = (0.60 \times 1.0 + 0.40 \times 0) \times 100\% = \mathbf{60\%}$$

### Fundamental Principle
Mathematically, for any positive integer $k \ge 1$:

$$\frac{k}{k} \equiv 1.0 \implies 0.60 \times 1.0 = 0.60 \quad (60\%)$$

Because Min-Normalization evaluates **relative coverage of the smaller set**, $1$ out of $1$ and $5$ out of $5$ both represent **100% academic fulfillment** from the standpoint of the student taking the smaller load.

---

## 3. Institutional Justification: Why KDU Chose This Model

This design decision was deliberately adopted in KDU StudyConnect to solve specific institutional requirements at General Sir John Kotelawala Defence University:

### 1. Eliminating the Repeat/Junior Workload Penalty
At KDU, students who fail a prerequisite may register solely for 1 or 2 repeat modules alongside an irregular schedule. Under a standard Jaccard metric:

$$J(A, B) = \frac{|\mathcal{C}_A \cap \mathcal{C}_B|}{|\mathcal{C}_A \cup \mathcal{C}_B|}$$

If Repeat Student $A$ (1 module) seeks a peer among regular Intake students (5 modules):
$$J(A, B) = \frac{1}{1 + 5 - 1} = \frac{1}{5} = 0.20 \quad (20\%)$$
$$\text{Final Score}_{\text{Jaccard}} = 0.60 \times 0.20 = \mathbf{12\%}$$

A score of 12% deprioritizes the candidate completely, excluding them from peer recommendations. However, for Student $A$, that 1 module represents **100% of their academic universe**. Min-normalization guarantees that Student $A$ is paired with peers taking that module ($S_{\text{course}} = 1.0$).

### 2. The 60% Ceiling Guardrail Against "Ghost Syndicates"
Even with a 100% module match ($S_{\text{course}} = 1.0$), capping the academic contribution at 60% ensures that peers with completely conflicting daily routines (e.g., Officer Cadets with mandatory morning drills and evening curfews vs. civilian Day Scholars commuting during evenings) cannot achieve a "High Compatibility" badge (>75%) without schedule synchronization.

---

## 4. The Trade-Off: Cardinality & Scale Insensitivity

While Min-Normalization prevents workload discrimination, it introduces **Cardinality Insensitivity**:

| Characteristic | 1 Shared Module | 5 Shared Modules |
| :--- | :--- | :--- |
| **Academic Surface Area** | 1 subject (~3 credits) | Full semester (~15–18 credits) |
| **Collaborative Lifespan** | Limited to single exam/coursework | Continuous semester-long partnership |
| **Synergy Potential** | Low | Very High |
| **Pure Min-Norm Score** | **60%** (if $S_{\text{avail}} = 0$) | **60%** (if $S_{\text{avail}} = 0$) |

To the algorithm, sharing 1 course with a peer who only takes that 1 course is indistinguishable from sharing an entire semester curriculum with a peer.

---

## 5. Algorithmic Enhancement Strategies

If the system needs to prioritize larger volumes of shared modules while preserving fairness for lighter loads, three mathematical enhancements can be applied:

### Strategy 1: The Balanced Hybrid Index (Recommended)
Blend Min-Normalized coverage (protecting small course loads) with Jaccard Union similarity (rewarding larger mutual overlap):

$$S_{\text{course}}(A, B) = \alpha \cdot \frac{|\mathcal{C}_A \cap \mathcal{C}_B|}{\min(|\mathcal{C}_A|, |\mathcal{C}_B|)} + (1 - \alpha) \cdot \frac{|\mathcal{C}_A \cap \mathcal{C}_B|}{|\mathcal{C}_A \cup \mathcal{C}_B|}, \quad \text{with } \alpha = 0.5$$

#### Numerical Comparison:
* **1 Shared Module (1 vs 5 modules):**
  $$S_{\text{course}} = 0.5\left(\frac{1}{1}\right) + 0.5\left(\frac{1}{5}\right) = 0.50 + 0.10 = 0.60 \implies \mathbf{36\% \text{ final score}}$$
* **5 Shared Modules (5 vs 5 modules):**
  $$S_{\text{course}} = 0.5\left(\frac{5}{5}\right) + 0.5\left(\frac{5}{5}\right) = 0.50 + 0.50 = 1.00 \implies \mathbf{60\% \text{ final score}}$$

The 5-module pair now decisively outranks the 1-module pair by **24 percentage points**, while the 1-module student still retains a viable 36% score.

```javascript
// Implementation in app.js
function calculateHybridCourseScore(coursesA, coursesB) {
  const setA = new Set(coursesA);
  const setB = new Set(coursesB);
  const shared = [...setA].filter(c => setB.has(c)).length;
  
  if (shared === 0) return 0;
  
  const minDenom = Math.min(setA.size, setB.size);
  const unionDenom = new Set([...coursesA, ...coursesB]).size;
  
  const minNormScore = shared / minDenom;
  const jaccardScore = shared / unionDenom;
  
  return (0.5 * minNormScore) + (0.5 * jaccardScore);
}
```

---

### Strategy 2: Cardinality Volume Bonus
Retain the original Min-Normalization as the base, but award a marginal volume boost for each additional shared course beyond the first:

$$S_{\text{course}}(A, B) = \min\left(1.0, \frac{|\mathcal{C}_A \cap \mathcal{C}_B|}{\min(|\mathcal{C}_A|, |\mathcal{C}_B|)} \cdot \left[ 0.70 + 0.06 \cdot |\mathcal{C}_A \cap \mathcal{C}_B| \right] \right)$$

* **1 Shared Course:** $1.0 \times [0.70 + 0.06(1)] = 0.76 \implies 0.60 \times 0.76 = \mathbf{45.6\%}$
* **3 Shared Courses:** $1.0 \times [0.70 + 0.06(3)] = 0.88 \implies 0.60 \times 0.88 = \mathbf{52.8\%}$
* **5 Shared Courses:** $1.0 \times [0.70 + 0.06(5)] = 1.00 \implies 0.60 \times 1.00 = \mathbf{60.0\%}$

---

### Strategy 3: Credit-Weighted Overlap
Instead of unit-weighting each module, weight each course by its academic credit count (e.g., from the KDU catalog):

$$S_{\text{course}}(A, B) = \frac{\sum_{c \in (\mathcal{C}_A \cap \mathcal{C}_B)} \text{Credits}(c)}{\min\left(\sum_{a \in \mathcal{C}_A} \text{Credits}(a), \sum_{b \in \mathcal{C}_B} \text{Credits}(b)\right)}$$

This ensures that major 3-credit or 4-credit core technical modules contribute proportionately more than 2-credit general electives.

---

## 6. Comparison Matrix Across Models

Assuming zero timetable availability overlap ($S_{\text{avail}} = 0$):

| Scenario | Shared Modules | Pure Min-Norm (Current) | Standard Jaccard | Hybrid (50/50) | Cardinality Bonus |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Student 1 (1 mod) & Student 2 (1 mod)** | 1 | 60% | 60% | 60% | 45.6% |
| **Student 1 (1 mod) & Student 2 (5 mods)** | 1 | 60% | 12% | 36% | 45.6% |
| **Student 1 (3 mods) & Student 2 (5 mods)** | 3 | 60% | 36% | 48% | 52.8% |
| **Student 1 (5 mods) & Student 2 (5 mods)** | 5 | 60% | 60% | 60% | 60.0% |

---

## 7. Conclusion

* **Why it happens:** The algorithm divides by $\min(|\mathcal{C}_A|, |\mathcal{C}_B|)$, making $1/1 = 1.0$ and $5/5 = 1.0$. Multiplied by the 60% course weight, both produce 60%.
* **Why it was intended:** To protect students with low module loads (repeats, electives) from being unfairly penalized by standard Jaccard denominators.
* **The solution:** Implementing the **Balanced Hybrid Index** ($\text{Min-Norm} + \text{Jaccard}$) gracefully preserves fairness for asymmetric course loads while appropriately rewarding students who share their full semester curriculum.
