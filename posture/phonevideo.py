"""
PostureGuard — Step 1 (Phone Video Version)
============================================
Instead of using a live webcam, this script reads posture
videos recorded on your Android phone and extracts frames.

HOW TO USE:
1. Record 30–60 second videos on your phone for each posture:
     - Sit in GOOD posture       → record video, name it: good.mp4
     - Sit hunching forward      → record video, name it: slouch.mp4
     - Push head forward         → record video, name it: head_forward.mp4
     - Tilt shoulders unevenly   → record video, name it: shoulder_tilt.mp4
     - Bend neck sideways        → record video, name it: neck_bend.mp4

2. Transfer all videos to your laptop into the folder:
     videos/

3. Run this script:
     python step1_from_phone_videos.py

Tips for recording:
  - Use rear camera for better quality
  - Film yourself from the SIDE or FRONT (front works best)
  - Keep your full upper body visible (head to waist)
  - Move slightly while recording — don't stay frozen
  - Good lighting on your face and torso
  - 1080p or 720p is fine
"""

import cv2
import os
from pathlib import Path

# ── Config ──────────────────────────────────────────────────
VIDEO_DIR   = "videos"          # folder where your phone videos are
SAVE_DIR    = "data/raw_frames" # where frames will be saved
FRAME_SKIP  = 5                 # save every Nth frame (5 = ~6 fps from 30fps video)
                                # increase to get fewer frames, decrease for more

# Map video filename → posture class label
# Edit these to match whatever you named your video files
VIDEO_CLASS_MAP = {
    "good.mp4":           "good",
    "slouch.mp4":         "slouch",
    "head_forward.mp4":   "head_forward",
    "shoulder_tilt.mp4":  "shoulder_tilt",
    "neck_bend.mp4":      "neck_bend",

    # Also support common phone naming patterns:
    "good.MOV":           "good",
    "slouch.MOV":         "slouch",
    "head_forward.MOV":   "head_forward",
    "shoulder_tilt.MOV":  "shoulder_tilt",
    "neck_bend.MOV":      "neck_bend",
}

# ── Setup ────────────────────────────────────────────────────
os.makedirs(VIDEO_DIR, exist_ok=True)
for cls in set(VIDEO_CLASS_MAP.values()):
    os.makedirs(os.path.join(SAVE_DIR, cls), exist_ok=True)

# ── Auto-detect videos in folder ─────────────────────────────
def find_videos():
    """
    Finds all video files in the videos/ folder.
    If filenames don't match the map above, prompts user to assign a class.
    """
    video_extensions = {".mp4", ".mov", ".avi", ".mkv", ".3gp", ".webm"}
    found = {}

    for f in Path(VIDEO_DIR).iterdir():
        if f.suffix.lower() in video_extensions:
            name = f.name
            if name in VIDEO_CLASS_MAP:
                found[str(f)] = VIDEO_CLASS_MAP[name]
            else:
                # Ask user what class this video belongs to
                print(f"\n  Found video: {name}")
                print(f"  What posture class is this?")
                classes = ["good", "slouch", "head_forward", "shoulder_tilt", "neck_bend", "skip"]
                for i, c in enumerate(classes):
                    print(f"    [{i+1}] {c}")
                while True:
                    try:
                        choice = int(input("  Enter number: ")) - 1
                        if 0 <= choice < len(classes):
                            if classes[choice] != "skip":
                                found[str(f)] = classes[choice]
                            break
                    except ValueError:
                        pass
                    print("  Please enter a valid number.")
    return found

# ── Extract frames from a video ───────────────────────────────
def extract_frames(video_path, posture_class, frame_skip=5):
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print(f"  ✗ Could not open: {video_path}")
        return 0

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps          = cap.get(cv2.CAP_PROP_FPS)
    duration     = total_frames / fps if fps > 0 else 0

    # Count existing frames for this class
    save_dir  = os.path.join(SAVE_DIR, posture_class)
    existing  = len(os.listdir(save_dir))
    saved     = 0
    frame_idx = 0

    print(f"\n  Video  : {Path(video_path).name}")
    print(f"  Class  : {posture_class}")
    print(f"  Length : {duration:.1f}s  ({total_frames} frames @ {fps:.0f}fps)")
    print(f"  Saving every {frame_skip} frames → ~{total_frames // frame_skip} images")

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        if frame_idx % frame_skip == 0:
            # Rotate if phone was held vertically (portrait mode)
            h, w = frame.shape[:2]
            if h > w:
                frame = cv2.rotate(frame, cv2.ROTATE_90_CLOCKWISE)

            # Resize to consistent size
            frame = cv2.resize(frame, (640, 480))

            filename = os.path.join(save_dir, f"{posture_class}_{existing + saved:05d}.jpg")
            cv2.imwrite(filename, frame, [cv2.IMWRITE_JPEG_QUALITY, 92])
            saved += 1

        frame_idx += 1

        if frame_idx % 300 == 0:
            pct = int((frame_idx / total_frames) * 100)
            print(f"    {pct}% — {saved} frames saved so far...")

    cap.release()
    print(f"  ✓ Done — saved {saved} frames for '{posture_class}'")
    return saved

# ── Main ─────────────────────────────────────────────────────
print("\n📱 PostureGuard — Phone Video Frame Extractor")
print("=" * 50)

videos = find_videos()

if not videos:
    print(f"\n  ⚠ No videos found in '{VIDEO_DIR}/' folder!")
    print(f"  Please transfer your phone videos there and try again.")
    print(f"\n  Supported formats: .mp4  .mov  .avi  .mkv  .3gp")
    print(f"\n  Expected filenames (or you'll be asked to label them):")
    for name, cls in VIDEO_CLASS_MAP.items():
        print(f"    {name:25s} → {cls}")
else:
    print(f"\n  Found {len(videos)} video(s) to process:")
    for path, cls in videos.items():
        print(f"    {Path(path).name:30s} → {cls}")

    total_saved = 0
    class_counts = {}

    for video_path, posture_class in videos.items():
        n = extract_frames(video_path, posture_class, FRAME_SKIP)
        total_saved += n
        class_counts[posture_class] = class_counts.get(posture_class, 0) + n

    print(f"\n{'='*50}")
    print(f"✅ Extraction complete!")
    print(f"   Total frames saved: {total_saved}")
    print(f"\n   Per class:")
    for cls, count in sorted(class_counts.items()):
        status = "✓ Ready" if count >= 200 else "⚠ Consider recording more (aim for 300+)"
        print(f"   {cls:20s}: {count:>4} frames  [{status}]")

    print(f"\n▶ Next step:")
    print(f"   python step2_extract_features.py")