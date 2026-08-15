# Heuristic Risk Factors & Recommendation Engine

This document details the heuristic rules, thresholds, and classification logic that power the **Risk Factor & Recommendation Engine** in your defect prediction system.

---

## 1. Why Heuristics are Used

While the **XGBoost** model predicts the exact probability that a commit will introduce a defect, it operates as a "black box"—it does not directly explain its decisions to a developer. 

To bridge this gap, the system runs a parallel **Heuristic Risk Extractor**. This module evaluates the commit against predefined, rule-of-thumb thresholds to identify *why* a commit might be risky in plain English. 

By combining Machine Learning (for ranking risk) with Heuristic Rules (for explanation), the system provides developer-friendly feedback without sacrificing predictive accuracy.

---

## 2. Heuristic Rules & Thresholds

The extractor evaluates 8 specific rules based on statistical percentiles (p75/p90) of historical commit metrics:

| Metric checked | Rule Condition | Plain-English Factor Output |
| :--- | :--- | :--- |
| **Author History** | `prior_bugs_author >= 3` | `"Author has X prior bugs"` |
| **Complexity** | `avg_complexity >= 10` | `"High cyclomatic complexity (X.X)"` |
| **Size (Lines)** | `lines_added >= 300` | `"Large commit (X lines added)"` |
| **Size (Files)** | `files_changed >= 10` | `"Many files changed (X)"` |
| **Testing** | `test_ratio == 0` and `files_changed > 0` | `"No test files updated"` |
| **Churn Ratio** | `churn_ratio >= 5` | `"High churn ratio (X.Xx)"` |
| **Timing &amp; Complexity** | `is_night_commit == 1` and `avg_complexity > 5` | `"Night commit with complex changes"` |
| **Timing (Late night)** | `is_night_commit == 1` (only if complexity ≤ 5) | `"Late night commit"` |
| **Timing (Weekend)** | `is_weekend == 1` and `lines_added > 70` | `"Weekend commit with many changes"` |

---

## 3. Prioritization & Payload Formatting

To prevent overwhelming developers with too much information, the engine applies the following formatting rules:

1. **Truncation Limit:** It returns at most the **top 3 triggered factors** (`factors[:3]`).
2. **Default Fallback:** If none of the 8 rules are triggered, it outputs: `["No major risk factors detected"]`.
3. **Response Structure:** The final recommendation and icon are selected based on the calibrated probability value ($P_{\text{calib}}$):

### 🟢 Low Risk Band ($P_{\text{calib}} < 0.240$)
* **Icon:** `🟢`
* **Label:** `LOW RISK`
* **Recommendation:** `"Looks safe to merge. Standard review process applies."`

### 🟡 Medium Risk Band ($0.240 \le P_{\text{calib}} < 0.450$)
* **Icon:** `🟡`
* **Label:** `MEDIUM RISK`
* **Recommendation:** `"Review recommended. Check test coverage and complexity before merging."`

### 🔴 High Risk Band ($P_{\text{calib}} \ge 0.450$)
* **Icon:** `🔴`
* **Label:** `HIGH RISK`
* **Recommendation:** `"Mandatory review required before merge. Consider breaking into smaller commits and adding tests."`
