"""
PostureGuard — Step 4: Real-Time Inference
===========================================
Loads your trained model and runs live posture detection
from your webcam. This replaces the rule-based logic with
your custom ML classifier.

Run after step3_train_model.py.
"""

import cv2
import mediapipe as mp
import numpy as np
import pickle
import math
import time
from collections import deque

# ── Load model ───────────────────────────────────────────────
MODEL_PATH = "models/posture_model.pkl"
bundle     = pickle.load(open(MODEL_PATH, "rb"))
model      = bundle["model"]
le         = bundle["label_encoder"]
print(f"✅ Loaded: {bundle['model_name']}")
print(f"   Classes: {list(le.classes_)}")

# ── MediaPipe setup ──────────────────────────────────────────
mp_pose    = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils
pose       = mp_pose.Pose(min_detection_confidence=0.6, min_tracking_confidence=0.6)
L          = mp_pose.PoseLandmark

# ── Feature extraction (must match step2) ────────────────────
def angle_3pts(a, b, c):
    ba = np.array([a.x - b.x, a.y - b.y])
    bc = np.array([c.x - b.x, c.y - b.y])
    cos_a = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc) + 1e-6)
    return math.degrees(math.acos(np.clip(cos_a, -1.0, 1.0)))

def extract_features(landmarks):
    lm = landmarks.landmark
    coords = []
    for i in range(33):
        coords += [lm[i].x, lm[i].y, lm[i].visibility]

    shoulder_mid_y = (lm[L.LEFT_SHOULDER].y + lm[L.RIGHT_SHOULDER].y) / 2
    shoulder_mid_x = (lm[L.LEFT_SHOULDER].x + lm[L.RIGHT_SHOULDER].x) / 2
    hip_mid_x      = (lm[L.LEFT_HIP].x      + lm[L.RIGHT_HIP].x)      / 2
    hip_mid_y      = (lm[L.LEFT_HIP].y      + lm[L.RIGHT_HIP].y)      / 2

    angles = [
        angle_3pts(lm[L.LEFT_EAR],  lm[L.LEFT_SHOULDER],  lm[L.LEFT_HIP]),
        angle_3pts(lm[L.RIGHT_EAR], lm[L.RIGHT_SHOULDER], lm[L.RIGHT_HIP]),
        shoulder_mid_y - lm[L.NOSE].y,
        abs(lm[L.LEFT_SHOULDER].y - lm[L.RIGHT_SHOULDER].y),
        abs(lm[L.LEFT_EAR].y      - lm[L.RIGHT_EAR].y),
        abs(shoulder_mid_x - hip_mid_x),
        abs(hip_mid_y - shoulder_mid_y),
        abs(lm[L.NOSE].x - shoulder_mid_x),
    ]
    return np.array(coords + angles, dtype=np.float32)

# ── Smoothing: majority vote over last N frames ───────────────
SMOOTH_WINDOW = 10
recent_preds  = deque(maxlen=SMOOTH_WINDOW)

# ── Alert state ──────────────────────────────────────────────
ALERT_INTERVAL   = 30   # seconds
BAD_CLASSES      = {"head_forward", "slouch", "shoulder_tilt", "neck_bend"}
last_alert_time  = 0
session_start    = time.time()
good_frames      = 0
total_frames     = 0
alert_count      = 0

# ── Color map ────────────────────────────────────────────────
CLASS_COLORS = {
    "good":           (0, 220, 120),
    "head_forward":   (0, 140, 255),
    "slouch":         (0, 80, 255),
    "shoulder_tilt":  (0, 165, 255),
    "neck_bend":      (80, 80, 255),
}

ADVICE = {
    "good":           "Great posture! Keep it up.",
    "head_forward":   "Bring your head back — ears over shoulders.",
    "slouch":         "Straighten your back — sit tall.",
    "shoulder_tilt":  "Level your shoulders evenly.",
    "neck_bend":      "Straighten your neck — look straight ahead.",
}

# ── Main loop ────────────────────────────────────────────────
cap = cv2.VideoCapture(0)
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

print("\n🎥  Live posture monitor running  (press Q to quit)\n")

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break

    frame = cv2.flip(frame, 1)
    rgb   = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = pose.process(rgb)

    label       = "no_person"
    confidence  = 0.0
    color       = (150, 150, 150)
    advice      = "Move into frame so your upper body is visible."

    if results.pose_landmarks:
        lm = results.pose_landmarks
        mp_drawing.draw_landmarks(
            frame, lm, mp_pose.POSE_CONNECTIONS,
            mp_drawing.DrawingSpec(color=(0, 255, 157), thickness=2, circle_radius=3),
            mp_drawing.DrawingSpec(color=(0, 180, 100), thickness=2),
        )

        feats = extract_features(lm).reshape(1, -1)
        proba = model.predict_proba(feats)[0]
        pred  = le.classes_[np.argmax(proba)]
        conf  = np.max(proba)

        recent_preds.append(pred)

        # Majority vote smoothing
        from collections import Counter
        label      = Counter(recent_preds).most_common(1)[0][0]
        confidence = conf
        color      = CLASS_COLORS.get(label, (200, 200, 200))
        advice     = ADVICE.get(label, "")

        total_frames += 1
        if label == "good":
            good_frames += 1

        # Alert check
        now = time.time()
        if label in BAD_CLASSES and (now - last_alert_time) > ALERT_INTERVAL:
            last_alert_time = now
            alert_count += 1
            print(f"  ⚠ [{time.strftime('%H:%M:%S')}] Posture alert #{alert_count}: {label}")

    # ── Draw HUD ─────────────────────────────────────────────
    # Background bar
    cv2.rectangle(frame, (0, 0), (640, 110), (15, 15, 15), -1)
    cv2.rectangle(frame, (0, 0), (640, 110), color, 2)

    # Prediction + confidence
    label_display = label.replace("_", " ").upper()
    cv2.putText(frame, label_display, (14, 38),
                cv2.FONT_HERSHEY_DUPLEX, 1.0, color, 2)
    cv2.putText(frame, f"{confidence*100:.0f}% confidence", (14, 65),
                cv2.FONT_HERSHEY_SIMPLEX, 0.55, (180, 180, 180), 1)

    # Advice
    cv2.putText(frame, advice, (14, 90),
                cv2.FONT_HERSHEY_SIMPLEX, 0.48, (220, 220, 220), 1)

    # Session stats
    elapsed   = int(time.time() - session_start)
    good_pct  = int((good_frames / max(total_frames, 1)) * 100)
    mins, sec = divmod(elapsed, 60)
    stats = f"Session: {mins}m{sec:02d}s  |  Good: {good_pct}%  |  Alerts: {alert_count}"
    cv2.putText(frame, stats, (14, 460),
                cv2.FONT_HERSHEY_SIMPLEX, 0.45, (120, 120, 120), 1)

    # Probability bars for each class
    bar_x, bar_y = 400, 15
    for cls in le.classes_:
        idx   = list(le.classes_).index(cls)
        prob  = model.predict_proba(feats)[0][idx] if results.pose_landmarks else 0
        bw    = int(prob * 120)
        bcol  = CLASS_COLORS.get(cls, (150, 150, 150))
        cv2.rectangle(frame, (bar_x, bar_y), (bar_x + bw, bar_y + 12), bcol, -1)
        cv2.rectangle(frame, (bar_x, bar_y), (bar_x + 120, bar_y + 12), (60, 60, 60), 1)
        cv2.putText(frame, f"{cls[:14]}", (bar_x - 110, bar_y + 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.38, (180, 180, 180), 1)
        bar_y += 18

    cv2.imshow("PostureGuard — Live ML Inference", frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()

elapsed  = int(time.time() - session_start)
good_pct = int((good_frames / max(total_frames, 1)) * 100)
mins, sec = divmod(elapsed, 60)
print(f"\n📊 Session Summary")
print(f"   Duration   : {mins}m {sec}s")
print(f"   Good posture: {good_pct}%")
print(f"   Alerts sent : {alert_count}")