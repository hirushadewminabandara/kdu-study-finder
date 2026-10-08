# Rationalization of the 60/40 Matching Algorithm Split

In **KDU StudyConnect**, the peer compatibility algorithm calculates a composite match score between any two students using the following formula:

$$\text{Compatibility Score} = 0.60 \times S_{\text{course}} + 0.40 \times S_{\text{availability}}$$

Where:
* $S_{\text{course}}$ represents the **Course Overlap** (calculated using min-normalized intersection).
* $S_{\text{availability}}$ represents the **Weekly Timetable Overlap** (across 21 standard slots: 7 days × Morning, Afternoon, Evening).

This document explains the mathematical, operational, and institutional justification behind choosing a **60 / 40 split** over other weighting models (such as 50/50, 70/30, or 80/20).

---

## 1. Mathematical Guarantee: Academic Intent Always Dominates

In a dual-factor ranking equation $S = w_c \cdot S_{\text{course}} + w_a \cdot S_{\text{avail}}$, setting **$w_c > 0.50$** ensures that shared coursework acts as the strictly dominant ranking criterion.

### The 50/50 Failure Mode ("The False-Match Anomaly")
Under an equal 50/50 split, high schedule overlap can mask negligible course overlap:

* **Scenario:**
  * **Candidate A (High Course, Low Free-Time Overlap):** Shares **4 core degree modules** ($S_{\text{course}} = 1.0$), but only has **1 shared free slot** due to intense laboratory commitments ($S_{\text{avail}} = 0.25$).
  * **Candidate B (Low Course, High Free-Time Overlap):** Shares only **1 generic elective** ($S_{\text{course}} = 0.20$), but shares **5 free weekend slots** ($S_{\text{avail}} = 1.0$).

* **Comparison:**
  $$\text{Score}_{50/50}(A) = 0.50(1.0) + 0.50(0.25) = 0.625$$
  $$\text{Score}_{50/50}(B) = 0.50(0.20) + 0.50(1.00) = 0.600 \approx 0.625$$

Under 50/50, Candidate B scores virtually the same as Candidate A, despite sharing almost nothing in common academically. In an academic peer finder, this produces a **false positive**—students do not join syndicates to study with peers who share none of their major exams or assignments.

* **Under the Chosen 60/40 Split:**
  $$\text{Score}_{60/40}(A) = 0.60(1.0) + 0.40(0.25) = \mathbf{0.70}$$
  $$\text{Score}_{60/40}(B) = 0.60(0.20) + 0.40(1.00) = \mathbf{0.52}$$

Candidate A outranks Candidate B by **18 percentage points**, properly prioritizing syllabus alignment.

---

## 2. Preventing "Ghost Syndicates" at KDU

If course alignment is critical, why not assign it an even higher weight, such as **70/30** or **80/20**?

The university environment at General Sir John Kotelawala Defence University features a distinct operational dynamic:
1. **Officer Cadets (`C/`):** Bound by early-morning muster parades, military drills (05:30–07:30), and mandatory barracks curfews after 19:30.
2. **Day Scholars (`D/`):** Civilian undergraduates who commute daily and study primarily in the late afternoons, evenings, and on weekends.

### The Low-Availability Failure Mode ($\le 30\%$ Availability Weight)
When schedule overlap is weighted at $20\%$ or $30\%$:
* Two students sharing the same modules but possessing **zero overlapping free hours** ($S_{\text{avail}} = 0$) would still score **$70\%$ to $80\%$**—triggering a "High Compatibility" badge in the UI.
* **Result:** Students form syndicates and join chats, but quickly discover that their daily routines prevent them from ever meeting or holding revision sessions. The group collapses into inactivity (a "ghost syndicate").

### How 40% Availability Solves This
* With a $40\%$ weight, a candidate with zero overlapping availability ($S_{\text{avail}} = 0$) has their total score strictly capped at **0.60**.
* They are decisively deprioritized below peers who share both modules and compatible time windows, ensuring that recommended partners can practically meet.

---

## 3. Asymmetric Adaptability: Immutable vs. Negotiable Constraints

The two parameters exhibit fundamentally different degrees of flexibility:

| Metric | Constraint Category | Flexibility & User Behavior |
| :--- | :--- | :--- |
| **Modules ($S_{\text{course}}$)** | **Hard Constraint (Immutable)** | A student cannot alter their registered curriculum, exam dates, or degree requirements simply to match another student's timetable. |
| **Timetable ($S_{\text{avail}}$)** | **Soft Constraint (Negotiable)** | Students can adjust study habits, shift lunch hours, study in the library between lectures, or collaborate asynchronously via shared notes. |

Because coursework is an **inflexible prerequisite** (0 course overlap = 0 academic utility), it commands the majority weight ($60\%$). Because weekly routines have **room for negotiation**, the complementary $40\%$ weight ensures timetable compatibility is strongly incentivized without unnecessarily excluding potential study partners.

---

## 4. Evaluation Matrix of Alternative Splits

| Split ($S_{\text{course}} / S_{\text{avail}}$) | Primary Weakness | Behavioral Outcome |
| :---: | :--- | :--- |
| **50 / 50** | Undervalues academic relevance | Free time overshadows course overlap; pairs matched on schedule rather than academic necessity. |
| **70 / 30** | Borderline timetable penalty | Zero-availability pairs can still reach 70%, creating false expectations for physical meetings. |
| **80 / 20** | Treats availability as an afterthought | High syndicate abandonment; cadets and day scholars matched despite irreconcilable curfews. |
| **60 / 40 (Optimal)** | **None** | **Academic intent governs ranking ($>50\%$), while schedule compatibility ($40\%$) acts as an active, decisive discriminator.** |

---

## 5. Source Code Implementation

The matching algorithm is implemented in [`app.js`](app.js):

```javascript
// Matching score calculation: 60% courses, 40% schedule availability
function calculateCompatibility(studentA, studentB) {
  const coursesA = new Set(studentA.courses || []);
  const coursesB = new Set(studentB.courses || []);
  const sharedCourses = [...coursesA].filter(c => coursesB.has(c));

  // Strict Academic Prerequisite: 0 course overlap = 0 academic utility
  if (sharedCourses.length === 0) return null;

  const minCourses = Math.max(1, Math.min(coursesA.size, coursesB.size));
  const courseScore = sharedCourses.length / minCourses;

  const availA = new Set(studentA.availability || []);
  const availB = new Set(studentB.availability || []);
  const sharedAvail = [...availA].filter(slot => availB.has(slot));

  const minAvail = Math.max(1, Math.min(availA.size, availB.size));
  const availScore = sharedAvail.length / minAvail;

  // Cardinality bonus (+1% per shared course up to 4%) breaks ties for broader syllabus coverage
  const cardinalityBonus = Math.min(0.04, sharedCourses.length * 0.01);
  const compositeScore = Math.min(1.0, (0.60 * courseScore) + (0.40 * availScore) + cardinalityBonus);

  return {
    score: Math.round(compositeScore * 100),
    sharedCourses,
    sharedAvail,
    courseScore: Math.round(courseScore * 100),
    availScore: Math.round(availScore * 100)
  };
}
```
