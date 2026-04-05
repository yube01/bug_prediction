"""
PostureGuard — Step 2: Feature Extraction
==========================================
Runs MediaPipe Pose on every collected frame.
Extracts 33 landmark (x, y, z, visibility) coords + computed angles.
Saves everything to data/features.csv  — the actual training data.

Run after step1_collect_data.py.
"""

import cv2
import mediapipe as mp
import numpy as np
import pandas as pd
import os
import math
from pathlib import Path

# ── Config ──────────────────────────────────────────────────
RAW_DIR  = "data/raw_frames"
OUT_CSV  = "data/features.csv"
CLASSES  = ["good", "head_forward", "slouch", "shoulder_tilt", "neck_bend"]

mp_pose = mp.solutions.pose

# ── Angle helpers ────────────────────────────────────────────
def angle_3pts(a, b, c):
    """Angle at point B formed by A-B-C (degrees)."""
    ba = np.array([a.x - b.x, a.y - b.y])
    bc = np.array([c.x - b.x, c.y - b.y])
    cos_angle = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc) + 1e-6)
    return math.degrees(math.acos(np.clip(cos_angle, -1.0, 1.0)))

def dist(a, b):
    return math.sqrt((a.x - b.x)**2 + (a.y - b.y)**2)

def extract_features(landmarks):
    """
    Returns a flat feature vector from 33 MediaPipe landmarks.
    Features = normalized coords + key joint angles + posture ratios.
    """
    lm = landmarks.landmark
    L = mp_pose.PoseLandmark

    # Raw normalized coords (x, y only — z is less reliable)
    coords = []
    for i in range(33):
        coords += [lm[i].x, lm[i].y, lm[i].visibility]

    # ── Key angles ──────────────────────────────────────────
    # Neck tilt: ear-shoulder-hip
    neck_angle_L = angle_3pts(lm[L.LEFT_EAR], lm[L.LEFT_SHOULDER], lm[L.LEFT_HIP])
    neck_angle_R = angle_3pts(lm[L.RIGHT_EAR], lm[L.RIGHT_SHOULDER], lm[L.RIGHT_HIP])

    # Head forward lean: nose vs shoulder midpoint (vertical ratio)
    shoulder_mid_y = (lm[L.LEFT_SHOULDER].y + lm[L.RIGHT_SHOULDER].y) / 2
    head_forward   = shoulder_mid_y - lm[L.NOSE].y          # positive = head above shoulders

    # Shoulder level difference (tilt)
    shoulder_tilt  = abs(lm[L.LEFT_SHOULDER].y - lm[L.RIGHT_SHOULDER].y)

    # Ear level difference (head tilt sideways)
    ear_tilt       = abs(lm[L.LEFT_EAR].y - lm[L.RIGHT_EAR].y)

    # Spine lean: shoulder midX vs hip midX
    shoulder_mid_x = (lm[L.LEFT_SHOULDER].x + lm[L.RIGHT_SHOULDER].x) / 2
    hip_mid_x      = (lm[L.LEFT_HIP].x      + lm[L.RIGHT_HIP].x)      / 2
    spine_lateral  = abs(shoulder_mid_x - hip_mid_x)

    # Shoulder-to-hip vertical distance (slouch indicator)
    shoulder_mid_y2 = (lm[L.LEFT_SHOULDER].y + lm[L.RIGHT_SHOULDER].y) / 2
    hip_mid_y       = (lm[L.LEFT_HIP].y      + lm[L.RIGHT_HIP].y)      / 2
    torso_height    = abs(hip_mid_y - shoulder_mid_y2)

    # Nose-to-shoulder horizontal offset
    nose_offset_x  = abs(lm[L.NOSE].x - shoulder_mid_x)

    angles = [
        neck_angle_L, neck_angle_R,
        head_forward, shoulder_tilt, ear_tilt,
        spine_lateral, torso_height, nose_offset_x,
    ]

    return coords + angles

# ── Main extraction loop ─────────────────────────────────────
rows = []
failed = 0

with mp_pose.Pose(static_image_mode=True, min_detection_confidence=0.5) as pose:
    for cls in CLASSES:
        cls_dir = Path(RAW_DIR) / cls
        if not cls_dir.exists():
            print(f"  ⚠  Skipping {cls} — folder not found")
            continue

        files = list(cls_dir.glob("*.jpg")) + list(cls_dir.glob("*.png"))
        print(f"\n  Processing {cls}: {len(files)} frames")

        for i, img_path in enumerate(files):
            img = cv2.imread(str(img_path))
            if img is None:
                continue
            rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            results = pose.process(rgb)

            if results.pose_landmarks:
                feats = extract_features(results.pose_landmarks)
                rows.append(feats + [cls])
            else:
                failed += 1

            if (i + 1) % 50 == 0:
                print(f"    {i+1}/{len(files)} done...")

# ── Build column names ───────────────────────────────────────
coord_cols = []
for i in range(33):
    coord_cols += [f"lm{i}_x", f"lm{i}_y", f"lm{i}_vis"]

angle_cols = [
    "neck_angle_L", "neck_angle_R",
    "head_forward", "shoulder_tilt", "ear_tilt",
    "spine_lateral", "torso_height", "nose_offset_x",
]

columns = coord_cols + angle_cols + ["label"]

# ── Save ─────────────────────────────────────────────────────
os.makedirs("data", exist_ok=True)
df = pd.DataFrame(rows, columns=columns)
df.to_csv(OUT_CSV, index=False)

print(f"\n✅ Feature extraction complete!")
print(f"   Total samples : {len(df)}")
print(f"   Failed frames : {failed} (no person detected)")
print(f"   Saved to      : {OUT_CSV}")
print(f"\n   Class distribution:")
print(df["label"].value_counts().to_string())