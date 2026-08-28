# Mistral Mapping Visual QA Report

### Pages Tested
3

### Pages Sent to Mistral
Exactly:
- Answer_Sheet_p008.png
- Answer_Sheet_p012.png
- Answer_Sheet_p020.png

### Pages NOT Sent
All other answer-sheet pages.

### Mapping Results

#### Page: Answer_Sheet_p008.png

| Answer Region | Handwritten Label | Canonical ID | Mapped Question | Method | Confidence | Correct? |
|---|---|---|---|---|---|---|
| region_3b | Q3 (cont.) | 3b | 3b | explicit_label | N/A | NO (INVALID LABEL CONFLICT) |

**Question 3b:** When would you choose a **Decision Tree** over **KNN**?
**Answer Label:** Q3 (cont.)
**Answer Text:** A single tree can overfit and be unstable, so depth limits, minimum leaf size or pruning should be used. If predictive accuracy is the main goal, a tree ensemble such as Random Forest may be stronger than one tree.

#### Page: Answer_Sheet_p012.png

| Answer Region | Handwritten Label | Canonical ID | Mapped Question | Method | Confidence | Correct? |
|---|---|---|---|---|---|---|
| region_5b | Q5 (cont.) | 5b | 5b | explicit_label | N/A | NO (INVALID LABEL CONFLICT) |

**Question 5b:** Weights (kg) of 9 persons: 42, 45, 47, 60, 62, 65, 80, 82, 85. Using K = 3 and initial centroids: C1 = 45, C2 = 60, C3 = 80, perform one iteration of **K-Means clustering** using Euclidean distance and find: - Cluster assignments - Updated centroids
**Answer Label:** Q5 (cont.)
**Answer Text:** Cluster assignments: C1 = {42, 45, 47}, C2 = {60, 62, 65}, C3 = {80, 82, 85}. Updated centroids: C1 = 44.67, C2 = 62.33, C3 = 82.33.

#### Page: Answer_Sheet_p020.png

| Answer Region | Handwritten Label | Canonical ID | Mapped Question | Method | Confidence | Correct? |
|---|---|---|---|---|---|---|
| orphan_0 | N/A | N/A | NONE | orphan | N/A | NO |
### Errors

- INVALID LABEL CONFLICT on Answer_Sheet_p008.png: Mapped to 3b but label says 'Q3 (cont.)'

- INVALID LABEL CONFLICT on Answer_Sheet_p012.png: Mapped to 5b but label says 'Q5 (cont.)'

### Final Summary

Total answer regions: 3

Correct mappings (predicted): 0

Incorrect mappings: 2

Ambiguous: 0

Orphan: 1

Explicit-label mappings: 2

Semantic mappings: 0

Potential positional mappings: 0


### File Paths

1. Annotated page 1: `benchmark_experiments/mapping_visuals/Answer_Sheet_p008_mapping.png`

2. Annotated page 2: `benchmark_experiments/mapping_visuals/Answer_Sheet_p012_mapping.png`

3. Annotated page 3: `benchmark_experiments/mapping_visuals/Answer_Sheet_p020_mapping.png`

4. Comparisons are in the same directory ending in `_comparison.png`.
