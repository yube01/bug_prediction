"""
PostureGuard — Step 3: Train Classifier
========================================
Trains a Random Forest on the extracted landmark features.
Evaluates accuracy, shows confusion matrix, saves the model.

Run after step2_extract_features.py.
"""

import pandas as pd
import numpy as np
import pickle
import os
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.ensemble         import RandomForestClassifier, GradientBoostingClassifier
from sklearn.svm              import SVC
from sklearn.preprocessing    import LabelEncoder, StandardScaler
from sklearn.model_selection  import train_test_split, cross_val_score
from sklearn.metrics          import classification_report, confusion_matrix, accuracy_score
from sklearn.pipeline         import Pipeline

# ── Config ──────────────────────────────────────────────────
CSV_PATH   = "data/features.csv"
MODEL_DIR  = "models"
MODEL_PATH = "models/posture_model.pkl"
os.makedirs(MODEL_DIR, exist_ok=True)

# ── Load data ────────────────────────────────────────────────
print("📂 Loading features...")
df = pd.read_csv(CSV_PATH)
print(f"   {len(df)} samples, {df.shape[1]-1} features")
print(f"\n   Class distribution:")
print(df["label"].value_counts().to_string())

X = df.drop("label", axis=1).values
y = df["label"].values

# Encode labels
le = LabelEncoder()
y_enc = le.fit_transform(y)
print(f"\n   Classes: {list(le.classes_)}")

# ── Train / test split ───────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X, y_enc, test_size=0.2, random_state=42, stratify=y_enc
)
print(f"\n   Train: {len(X_train)} | Test: {len(X_test)}")

# ── Try multiple models ──────────────────────────────────────
models = {
    "Random Forest": Pipeline([
        ("scaler", StandardScaler()),
        ("clf", RandomForestClassifier(n_estimators=200, max_depth=15,
                                        min_samples_leaf=2, random_state=42, n_jobs=-1))
    ]),
    "Gradient Boosting": Pipeline([
        ("scaler", StandardScaler()),
        ("clf", GradientBoostingClassifier(n_estimators=150, max_depth=5,
                                            learning_rate=0.1, random_state=42))
    ]),
    "SVM (RBF)": Pipeline([
        ("scaler", StandardScaler()),
        ("clf", SVC(kernel="rbf", C=10, gamma="scale", probability=True))
    ]),
}

print("\n🏋️  Training models...")
results = {}
for name, model in models.items():
    cv_scores = cross_val_score(model, X_train, y_train, cv=5, scoring="accuracy", n_jobs=-1)
    model.fit(X_train, y_train)
    test_acc = accuracy_score(y_test, model.predict(X_test))
    results[name] = {"cv_mean": cv_scores.mean(), "cv_std": cv_scores.std(), "test_acc": test_acc, "model": model}
    print(f"   {name:25s}  CV: {cv_scores.mean()*100:.1f}% ± {cv_scores.std()*100:.1f}%  |  Test: {test_acc*100:.1f}%")

# ── Pick best model ──────────────────────────────────────────
best_name = max(results, key=lambda k: results[k]["test_acc"])
best_model = results[best_name]["model"]
print(f"\n🏆 Best model: {best_name}  ({results[best_name]['test_acc']*100:.1f}% test accuracy)")

# ── Detailed report ──────────────────────────────────────────
y_pred = best_model.predict(X_test)
print(f"\n📊 Classification Report ({best_name}):")
print(classification_report(y_test, y_pred, target_names=le.classes_))

# ── Confusion matrix plot ────────────────────────────────────
cm = confusion_matrix(y_test, y_pred)
plt.figure(figsize=(8, 6))
sns.heatmap(cm, annot=True, fmt="d", cmap="Blues",
            xticklabels=le.classes_, yticklabels=le.classes_)
plt.title(f"Confusion Matrix — {best_name}", fontsize=14, fontweight="bold")
plt.ylabel("True label")
plt.xlabel("Predicted label")
plt.tight_layout()
plt.savefig("models/confusion_matrix.png", dpi=150)
print("   Confusion matrix saved → models/confusion_matrix.png")

# ── Feature importance (Random Forest only) ──────────────────
if "Random Forest" in best_name:
    feature_names = list(df.drop("label", axis=1).columns)
    importances = best_model.named_steps["clf"].feature_importances_
    top_idx = np.argsort(importances)[-15:][::-1]
    print(f"\n   Top 15 most important features:")
    for i in top_idx:
        print(f"   {feature_names[i]:25s}: {importances[i]:.4f}")

# ── Save model + label encoder ───────────────────────────────
save_bundle = {"model": best_model, "label_encoder": le, "model_name": best_name}
with open(MODEL_PATH, "wb") as f:
    pickle.dump(save_bundle, f)

print(f"\n✅ Model saved → {MODEL_PATH}")
print(f"   Classes: {list(le.classes_)}")
print(f"   Load with: pickle.load(open('{MODEL_PATH}', 'rb'))")