# Simplified XGBoost Formulation & Probability Calibration

This document explains the simplified logic, formulas, and calibration pipeline of the **XGBoost** defect prediction model.

---

## 1. Additive Prediction Rule (Making a Prediction)

For every code commit, the model calculates a risk score by summing the outputs of 100 sequential decision trees:

$$\text{raw\_score} = \text{Tree}_1 + \text{Tree}_2 + \dots + \text{Tree}_{100}$$

This raw score is squashed into a raw uncalibrated probability (0% to 100%) using a Sigmoid curve:

$$\text{raw\_prob} = \frac{1}{1 + e^{-\text{raw\_score}}}$$

---

## 2. Decision Tree Penalties (Preventing Overfitting)

To make sure trees don't become too complex or make overly specific rules, the training cost penalizes large trees:

$$\text{Total Cost} = \text{Prediction Error} + \text{Complexity Penalty}$$

$$\text{Complexity Penalty} = \gamma \cdot (\text{Number of Leaves}) + \frac{1}{2} \lambda \cdot \sum(\text{Leaf Weights})^2$$

* $\gamma$ (gamma) prevents splits that don't help much.
* $\lambda$ (lambda) keeps the prediction weights small and steady.

---

## 3. Node Splitting and Weight Updates

1. **Optimal Weights:** The value output by each leaf node is the ratio of prediction errors (Gradients) to prediction uncertainty (Hessians):
   $$\text{Leaf Weight} = -\frac{\text{Sum of Errors}}{\text{Sum of Uncertainty} + \lambda}$$
2. **Node Split Gain:** Trees decide to branch out only if the new split adds value:
   $$\text{Split Gain} = \text{Left Node Score} + \text{Right Node Score} - \text{Parent Node Score} - \gamma$$

---

## 4. Class Imbalance Adjustment (`scale_pos_weight`)

Since bugs are rare in clean code (only **5.2%** of commits), the model is configured to pay **18.17 times more attention** to bugs:

$$\text{Loss Weight} = \begin{cases} 18.17 & \text{if commit has a bug } (y = 1) \\ 1.00 & \text{if commit is safe } (y = 0) \end{cases}$$

This forces the model to learn bug patterns, but it also makes the raw output scores highly paranoid.

---

## 5. Isotonic Probability Calibration (Bending Scores Back)

### The Problem (Paranoid Thermometer Analogy)
Imagine a thermometer placed right next to a heater (the $18.17\text{x}$ bug weight). It gets paranoid and reads $92^\circ\text{C}$ even though the actual room temperature is only $38.5^\circ\text{C}$. The raw scores are distorted.

### The Solution (Calibration Lookup Table)
We use a separate 12% Calibration Pool to build a **lookup table** (an Isotonic step function $m$) that maps paranoid raw scores back to real frequencies:

$$\text{minimize } \sum \left( \text{Actual Bug (0 or 1)} - m(\text{raw\_prob}) \right)^2$$

### The Core Rule (Monotonicity Constraint)
$$\text{subject to } m(p_a) \le m(p_b) \quad \text{whenever } p_a \le p_b$$

---

## Concrete Commit Example (Walkthrough)

Here is a step-by-step example of how a single commit is evaluated by your system:

1. **Input Commit:** A developer submits a commit at **11:00 PM** with **450 lines added** and an average code complexity of **10**.
2. **Feature Calculation:** The system computes the interaction feature:
   $$\text{night\_x\_complexity} = 1 \text{ (is\_night\_commit)} \times 10 \text{ (avg\_complexity)} = 10.0$$
3. **XGBoost Raw Prediction:** Because of the $18.17\text{x}$ bug multiplier, XGBoost outputs a highly paranoid raw score that translates to a **92% raw probability** of being buggy.
4. **Isotonic Calibration:** The system passes this 92% raw score through the calibration step function. It corrects this score down to a realistic **38.5% calibrated probability**, based on actual defect rates in matching historical commits.
5. **Final Decision:** Since $38.5\%$ is greater than or equal to your tuned warning threshold of **0.240** but less than **0.450**, the commit is categorized as **MEDIUM RISK (🟡)** and flagged for review.
