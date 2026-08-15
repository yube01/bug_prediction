# Defect Prediction System: Model Evaluation Report

This document provides a detailed breakdown of the model evaluation metrics and curves for **Bug Prediction V4** (XGBoost + Isotonic Calibration).

---

## 1. How Probability Calibration Helped

Looking at your **Calibration Curve** plot:
* **The Problem (Blue Line - Uncalibrated):** The blue line sits far to the right and bottom of the ideal diagonal dashed line. This shows that the uncalibrated model is highly **paranoid**. For example, when the uncalibrated model predicts a **75% probability** of a bug, the actual real-world defect rate for those commits is only **26%**. This paranoia is caused by `scale_pos_weight = 18.17`, which was used during training to force the model to focus on rare bugs.
* **The Solution (Orange Line - Calibrated):** The orange line representing the Isotonic Calibrated model aligns almost perfectly with the ideal $y = x$ (`Perfect`) diagonal. By using a separate calibration dataset, the system maps the exaggerated uncalibrated scores back to real-world frequencies.
  * **Result:** If the calibrated model now predicts a **30% risk**, exactly **30 out of 100** similar commits will contain a bug. This ensures the percentages shown to developers are honest and prevents alert fatigue.

---

## 2. Understanding the ROC Curve (AUC-ROC: 0.8635)

The **Receiver Operating Characteristic (ROC)** curve plots the **True Positive Rate** (Recall) against the **False Positive Rate** (FPR) at every possible prediction threshold:

* **FPR (False Positive Rate):** The fraction of clean commits that are incorrectly flagged as buggy.
* **TPR (True Positive Rate / Recall):** The fraction of actual buggy commits that are correctly caught.
* **AUC-ROC (0.8635 / 86.35%):** The Area Under the ROC Curve. An AUC of 0.8635 means that if you randomly select one buggy commit and one clean commit, there is an **86.35% probability** that the model will assign a higher risk score to the buggy commit. It indicates that the model has **excellent discrimination/ranking capability**.

---

## 3. Understanding the Precision-Recall Curve (PR-AUC: 0.3638)

In datasets with extreme class imbalance (where bugs represent only **5.2%** of all commits), the ROC curve can look deceptively optimistic because the huge number of true negatives keeps the False Positive Rate low. The **Precision-Recall (PR) Curve** is a much tougher and more honest evaluator:

* **Baseline (0.052 / 5.2%):** Shown by the horizontal dashed line at the bottom. A dummy model that guesses randomly would have a precision of only 5.2%.
* **PR-AUC (0.3638 / 36.38%):** The Area Under the Precision-Recall Curve. A value of 36.38% is **7 times better** than the random baseline, showing that the model is highly effective at extracting true bug patterns from a mountain of clean code commits.

---

## 4. Performance Metrics at the Optimal Threshold (0.240)

To turn probabilities into actions (e.g., triggering developer warnings), we select an **optimal decision threshold of 0.240 (24%)** to maximize the F1-score:

* **Decision Rule:** Any commit with a calibrated bug probability $\ge 0.240$ is flagged for review.
* **Precision (48.02%):** Out of all commits flagged by the system as buggy, **48.02%** actually contain defects. This is a very high signal-to-noise ratio considering the base bug rate is only 5.2%.
* **Recall (48.57%):** The system successfully intercepts **48.57%** of all buggy commits submitted.
* **F1-Score (48.30%):** The harmonic mean of Precision and Recall. It acts as a balanced measure of overall effectiveness, confirming that the system catches roughly half of all defects while keeping half of its warnings completely accurate.
