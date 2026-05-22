# Phase 1 Demo Video Project

This folder contains the editable video project for the Phase 1 hackathon demo.

## Files

- `render_phase1_video.py`: main renderer for the five-minute subtitled video.
- `storyboard.json`: scene timing and caption structure.
- `phase1-demo-subtitles.srt`: subtitle file used in the final export.
- `phase1-demo-subtitled.mp4`: final silent video with subtitles.
- `assets/`: compressed frontend recordings and static visual assets used by the renderer.
- `DESIGN.md`: visual direction and structure notes.
- `index.html`: HyperFrames-style preview/reference page for the video.

Raw `.mov` recordings and generated intermediate folders are ignored by Git to keep the branch lightweight.

## Render

From the repository root, run:

```bash
/Users/zhaoyan/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 output/video/phase1-hyperframes/render_phase1_video.py
```

The renderer expects Python with Pillow and a local `ffmpeg` command.
