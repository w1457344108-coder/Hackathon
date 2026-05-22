from __future__ import annotations

import json
import subprocess
import textwrap
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parent
ASSETS = ROOT / "assets"
SLIDES = ROOT / "slides"
RENDERS = ROOT / "renders"
OUT = ROOT / "phase1-demo-subtitled.mp4"
BASE = RENDERS / "phase1-demo-base.mp4"
CONCAT_LIST = RENDERS / "concat.txt"
SRT = ROOT / "phase1-demo-subtitles.srt"
STORYBOARD = ROOT / "storyboard.json"

W, H = 1920, 1080
FPS = 30

FONT_REG = "/System/Library/Fonts/Supplemental/Arial.ttf"
FONT_BOLD = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
FONT_BLACK = "/System/Library/Fonts/Supplemental/Arial Black.ttf"

PAPER = "#F7F8FA"
INK = "#111418"
MUTED = "#596273"
NAVY = "#123A63"
EVIDENCE = "#2D6CDF"
BORDER = "#D8DEE8"
GREEN = "#16885D"
RED = "#B42318"
GOLD = "#A15C00"


SCENES = [
    {
        "id": "s01-title",
        "type": "slide",
        "duration": 16,
        "layout": "title",
        "kicker": "PHASE 1 DEMO",
        "title": "From Legal Documents to Traceable Cross-Border Data Answers",
        "body": "A review-first prototype for cross-border data policy analysis.",
        "caption": "This demo shows how legal documents become traceable evidence for cross-border data answers.",
    },
    {
        "id": "s02-problem",
        "type": "slide",
        "duration": 24,
        "layout": "cards",
        "kicker": "WHY THIS MATTERS",
        "title": "A fluent answer is not enough for legal review.",
        "cards": [
            ("Source", "Which legal text supports the answer?"),
            ("Application", "How does the rule apply to the facts?"),
            ("Review", "What still needs human confirmation?"),
        ],
        "caption": "For legal users, the answer must show its source, reasoning path, and review boundary.",
    },
    {
        "id": "s03-pipeline",
        "type": "slide",
        "duration": 34,
        "layout": "pipeline",
        "kicker": "LLM WIKI + LEGAL NODES",
        "title": "The system turns documents into reviewable evidence cards.",
        "steps": [
            "Original documents",
            "Legal text chunks",
            "Structured evidence nodes",
            "LLM Wiki pages",
            "Evidence-backed answer",
        ],
        "caption": "AST-like nodes are simply structured legal evidence cards: obligation, condition, exception, and source.",
    },
    {
        "id": "s04-graph",
        "type": "slide",
        "duration": 22,
        "layout": "graph",
        "kicker": "COMPONENT GRAPH",
        "title": "A document-to-answer pipeline with source traceability.",
        "image": str(ASSETS / "component_graph_visual.png"),
        "caption": "The Wiki is not the final legal answer. It is the searchable knowledge layer behind the answer.",
    },
    {
        "id": "s05-metrics",
        "type": "slide",
        "duration": 18,
        "layout": "metrics",
        "kicker": "CURRENT BUILD",
        "title": "Phase 1 already produces a working knowledge base.",
        "metrics": [
            ("9", "source documents"),
            ("1,769", "text chunks"),
            ("1,769", "legal nodes"),
            ("1,848", "Wiki pages"),
            ("5,690", "candidate terms"),
        ],
        "caption": "All generated knowledge remains pending review, so uncertainty is visible instead of hidden.",
    },
    {
        "id": "s06-questions",
        "type": "slide",
        "duration": 18,
        "layout": "questions",
        "kicker": "THREE DEMO QUESTIONS",
        "title": "The same workflow handles three legal tasks.",
        "cards": [
            ("Q1", "Explain PIPL Article 38"),
            ("Q2", "Analyze the ShopPilot transfer case"),
            ("Q3", "Advise a Singapore AI SaaS before launch"),
        ],
        "caption": "We move from regulation explanation, to case analysis, to forward-looking advisory.",
    },
    {
        "id": "s07-recording-article38",
        "type": "video",
        "duration": 24,
        "source": str(ASSETS / "recording-article38.mp4"),
        "caption": "First, the frontend asks the system to explain Article 38 and map it to RDTII Pillar 6.",
    },
    {
        "id": "s08-article38-routes",
        "type": "slide",
        "duration": 20,
        "layout": "routes",
        "kicker": "QUESTION 1 RESULT",
        "title": "Article 38 creates a conditional transfer regime.",
        "routes": [
            "Security assessment",
            "Protection certification",
            "Standard contract",
            "Other lawful conditions",
        ],
        "caption": "The key point is not a total export ban. The transfer is allowed only after a recognized legal route is satisfied.",
    },
    {
        "id": "s09-recording-shoppilot",
        "type": "video",
        "duration": 30,
        "source": str(ASSETS / "recording-shoppilot.mp4"),
        "caption": "Second, the frontend applies the framework to ShopPilot AI's China-to-Singapore transfer case.",
    },
    {
        "id": "s10-linkage",
        "type": "slide",
        "duration": 20,
        "layout": "split",
        "kicker": "QUESTION 2 RESULT",
        "title": "The primary issue is Pillar 7, with a direct Pillar 6 linkage.",
        "left": ("P7:7.4", "Impact assessment, necessity, risk, safeguards, and records."),
        "right": ("P6:6.4", "The overseas transfer still needs a lawful Article 38 route."),
        "caption": "ShopPilot should not treat the transfer as a technical routing issue. It is a governed legal transfer.",
    },
    {
        "id": "s11-recording-advisory",
        "type": "video",
        "duration": 35,
        "source": str(ASSETS / "recording-advisory.mp4"),
        "caption": "Third, the frontend produces a forward-looking advisory for a Singapore AI SaaS entering China.",
    },
    {
        "id": "s12-roadmap",
        "type": "slide",
        "duration": 24,
        "layout": "roadmap",
        "kicker": "QUESTION 3 RESULT",
        "title": "Recommendation: No-Go until remediation is completed.",
        "steps": [
            ("Freeze", "high-risk transfer design"),
            ("Classify", "data and minimize raw logs"),
            ("Select", "the Pillar 6 transfer route"),
            ("Build", "notice and separate consent"),
            ("Complete", "impact assessment and recipient controls"),
        ],
        "caption": "The business model may be feasible, but not with a launch-first, paperwork-later design.",
    },
    {
        "id": "s13-closing",
        "type": "slide",
        "duration": 18,
        "layout": "closing",
        "kicker": "WHAT THE PROTOTYPE DEMONSTRATES",
        "title": "Traceable. Reviewable. Exportable.",
        "body": "The system connects user questions back to source documents, structured nodes, Wiki pages, RDTII indicators, and human review notes.",
        "caption": "This is a prototype, not legal advice. Its value is evidence-backed legal review.",
    },
]


def font(path: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(path, size=size)


def wrapped(draw: ImageDraw.ImageDraw, text: str, font_obj, width: int) -> list[str]:
    words = text.split()
    lines: list[str] = []
    line = ""
    for word in words:
        test = f"{line} {word}".strip()
        if draw.textbbox((0, 0), test, font=font_obj)[2] <= width:
            line = test
        else:
            if line:
                lines.append(line)
            line = word
    if line:
        lines.append(line)
    return lines


def draw_wrapped(draw: ImageDraw.ImageDraw, xy: tuple[int, int], text: str, font_obj, fill: str, width: int, line_gap: int = 12) -> int:
    x, y = xy
    for line in wrapped(draw, text, font_obj, width):
        draw.text((x, y), line, font=font_obj, fill=fill)
        y += draw.textbbox((0, 0), line, font=font_obj)[3] + line_gap
    return y


def rounded_card(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], fill: str = "white", outline: str = BORDER) -> None:
    draw.rounded_rectangle(box, radius=18, fill=fill, outline=outline, width=2)


def base_slide(scene: dict) -> tuple[Image.Image, ImageDraw.ImageDraw]:
    img = Image.new("RGB", (W, H), PAPER)
    draw = ImageDraw.Draw(img)
    draw.rectangle((0, 0, W, 14), fill=NAVY)
    draw.text((110, 84), scene.get("kicker", ""), font=font(FONT_BOLD, 27), fill=EVIDENCE)
    return img, draw


def draw_title(scene: dict, path: Path) -> None:
    img, draw = base_slide(scene)
    draw_wrapped(draw, (110, 205), scene["title"], font(FONT_BLACK, 78), INK, 1280, 18)
    draw_wrapped(draw, (118, 510), scene["body"], font(FONT_REG, 35), MUTED, 1020, 14)
    x0, y0 = 118, 710
    for i, label in enumerate(["Source evidence", "RDTII mapping", "Human review"]):
        x = x0 + i * 420
        rounded_card(draw, (x, y0, x + 360, y0 + 132))
        draw.text((x + 28, y0 + 36), label, font=font(FONT_BOLD, 30), fill=INK)
    img.save(path)


def draw_cards(scene: dict, path: Path) -> None:
    img, draw = base_slide(scene)
    draw_wrapped(draw, (110, 176), scene["title"], font(FONT_BLACK, 62), INK, 1280, 14)
    for i, (head, body) in enumerate(scene["cards"]):
        x = 110 + i * 575
        y = 475
        rounded_card(draw, (x, y, x + 505, y + 260))
        draw.text((x + 34, y + 34), head, font=font(FONT_BLACK, 38), fill=NAVY)
        draw_wrapped(draw, (x + 34, y + 104), body, font(FONT_REG, 29), MUTED, 420, 12)
    img.save(path)


def draw_pipeline(scene: dict, path: Path) -> None:
    img, draw = base_slide(scene)
    draw_wrapped(draw, (110, 160), scene["title"], font(FONT_BLACK, 58), INK, 1240, 12)
    y = 520
    box_w, box_h = 292, 150
    for i, step in enumerate(scene["steps"]):
        x = 84 + i * 360
        rounded_card(draw, (x, y, x + box_w, y + box_h))
        draw.text((x + 24, y + 34), f"{i + 1}", font=font(FONT_BLACK, 34), fill=EVIDENCE)
        draw_wrapped(draw, (x + 78, y + 34), step, font(FONT_BOLD, 27), INK, 182, 8)
        if i < len(scene["steps"]) - 1:
            draw.line((x + box_w + 20, y + 75, x + 338, y + 75), fill=EVIDENCE, width=5)
            draw.polygon([(x + 338, y + 75), (x + 320, y + 62), (x + 320, y + 88)], fill=EVIDENCE)
    draw.text((110, 790), "Plain-language meaning:", font=font(FONT_BOLD, 31), fill=NAVY)
    draw_wrapped(
        draw,
        (110, 840),
        "A legal node is a structured card that keeps the rule, condition, obligation, and source together.",
        font(FONT_REG, 31),
        MUTED,
        1400,
        10,
    )
    img.save(path)


def draw_graph(scene: dict, path: Path) -> None:
    img, draw = base_slide(scene)
    draw_wrapped(draw, (110, 130), scene["title"], font(FONT_BLACK, 52), INK, 1200, 10)
    graph = Image.open(scene["image"]).convert("RGB")
    graph.thumbnail((1340, 700))
    gx = 520
    gy = 300
    rounded_card(draw, (gx - 24, gy - 24, gx + graph.width + 24, gy + graph.height + 24))
    img.paste(graph, (gx, gy))
    draw_wrapped(draw, (110, 360), "Documents", font(FONT_BOLD, 34), NAVY, 330)
    draw_wrapped(draw, (110, 430), "Chunks", font(FONT_BOLD, 34), NAVY, 330)
    draw_wrapped(draw, (110, 500), "Nodes", font(FONT_BOLD, 34), NAVY, 330)
    draw_wrapped(draw, (110, 570), "Wiki", font(FONT_BOLD, 34), NAVY, 330)
    draw_wrapped(draw, (110, 640), "Answer draft", font(FONT_BOLD, 34), NAVY, 330)
    img.save(path)


def draw_metrics(scene: dict, path: Path) -> None:
    img, draw = base_slide(scene)
    draw_wrapped(draw, (110, 160), scene["title"], font(FONT_BLACK, 58), INK, 1260, 12)
    for i, (num, label) in enumerate(scene["metrics"]):
        x = 110 + (i % 3) * 560
        y = 420 + (i // 3) * 230
        rounded_card(draw, (x, y, x + 500, y + 170))
        draw.text((x + 32, y + 28), num, font=font(FONT_BLACK, 58), fill=EVIDENCE)
        draw.text((x + 34, y + 108), label, font=font(FONT_BOLD, 28), fill=MUTED)
    img.save(path)


def draw_questions(scene: dict, path: Path) -> None:
    draw_cards(scene, path)


def draw_routes(scene: dict, path: Path) -> None:
    img, draw = base_slide(scene)
    draw_wrapped(draw, (110, 160), scene["title"], font(FONT_BLACK, 62), INK, 1260, 12)
    for i, route in enumerate(scene["routes"]):
        x = 150 + (i % 2) * 780
        y = 430 + (i // 2) * 190
        rounded_card(draw, (x, y, x + 650, y + 130))
        draw.text((x + 34, y + 41), route, font=font(FONT_BOLD, 32), fill=INK)
    draw.text((150, 830), "RDTII mapping: Pillar 6, Indicator 6.4 Conditional Flow Regimes", font=font(FONT_BOLD, 34), fill=NAVY)
    img.save(path)


def draw_split(scene: dict, path: Path) -> None:
    img, draw = base_slide(scene)
    draw_wrapped(draw, (110, 150), scene["title"], font(FONT_BLACK, 58), INK, 1320, 12)
    for x, data, color in [(170, scene["left"], GREEN), (1000, scene["right"], EVIDENCE)]:
        rounded_card(draw, (x, 440, x + 720, 250 + 440))
        draw.text((x + 40, 480), data[0], font=font(FONT_BLACK, 56), fill=color)
        draw_wrapped(draw, (x + 44, 575), data[1], font(FONT_REG, 33), MUTED, 610, 14)
    draw.line((910, 560, 980, 560), fill=BORDER, width=6)
    draw.polygon([(980, 560), (955, 542), (955, 578)], fill=BORDER)
    img.save(path)


def draw_roadmap(scene: dict, path: Path) -> None:
    img, draw = base_slide(scene)
    draw_wrapped(draw, (110, 145), scene["title"], font(FONT_BLACK, 58), INK, 1350, 12)
    colors = [RED, GOLD, GOLD, EVIDENCE, GREEN]
    for i, ((head, body), color) in enumerate(zip(scene["steps"], colors)):
        x = 118 + i * 350
        y = 520
        rounded_card(draw, (x, y, x + 300, y + 220))
        draw.ellipse((x + 28, y + 28, x + 78, y + 78), fill=color)
        draw.text((x + 100, y + 28), head, font=font(FONT_BLACK, 31), fill=INK)
        draw_wrapped(draw, (x + 30, y + 106), body, font(FONT_REG, 26), MUTED, 230, 10)
        if i < 4:
            draw.line((x + 300, y + 110, x + 344, y + 110), fill=BORDER, width=5)
    img.save(path)


def draw_closing(scene: dict, path: Path) -> None:
    img, draw = base_slide(scene)
    draw_wrapped(draw, (110, 240), scene["title"], font(FONT_BLACK, 82), INK, 1300, 16)
    draw_wrapped(draw, (118, 500), scene["body"], font(FONT_REG, 34), MUTED, 1300, 14)
    draw.text((118, 730), "Prototype, not legal advice.", font=font(FONT_BLACK, 42), fill=RED)
    draw.text((118, 800), "Built for evidence-backed legal review.", font=font(FONT_BOLD, 38), fill=NAVY)
    img.save(path)


DRAWERS = {
    "title": draw_title,
    "cards": draw_cards,
    "pipeline": draw_pipeline,
    "graph": draw_graph,
    "metrics": draw_metrics,
    "questions": draw_questions,
    "routes": draw_routes,
    "split": draw_split,
    "roadmap": draw_roadmap,
    "closing": draw_closing,
}


def run(cmd: list[str]) -> None:
    print("+", " ".join(cmd))
    subprocess.run(cmd, check=True)


def fmt_time(seconds: float) -> str:
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int(round((seconds - int(seconds)) * 1000))
    return f"{hours:02}:{minutes:02}:{secs:02},{millis:03}"


def write_srt() -> None:
    current = 0.0
    blocks = []
    for idx, scene in enumerate(SCENES, start=1):
        start = current + 0.4
        end = current + scene["duration"] - 0.4
        caption = textwrap.fill(scene["caption"], width=78)
        blocks.append(f"{idx}\n{fmt_time(start)} --> {fmt_time(end)}\n{caption}\n")
        current += scene["duration"]
    SRT.write_text("\n".join(blocks), encoding="utf-8")


def render_slide(scene: dict) -> Path:
    slide_path = SLIDES / f"{scene['id']}.png"
    DRAWERS[scene["layout"]](scene, slide_path)
    segment = RENDERS / f"{scene['id']}.mp4"
    run(
        [
            "ffmpeg",
            "-y",
            "-loop",
            "1",
            "-t",
            str(scene["duration"]),
            "-i",
            str(slide_path),
            "-vf",
            f"fps={FPS},format=yuv420p",
            "-an",
            "-c:v",
            "libx264",
            "-preset",
            "veryfast",
            "-crf",
            "18",
            str(segment),
        ]
    )
    return segment


def render_video(scene: dict) -> Path:
    segment = RENDERS / f"{scene['id']}.mp4"
    run(
        [
            "ffmpeg",
            "-y",
            "-i",
            scene["source"],
            "-t",
            str(scene["duration"]),
            "-vf",
            (
                f"scale={W}:{H}:force_original_aspect_ratio=decrease,"
                f"pad={W}:{H}:(ow-iw)/2:(oh-ih)/2:color=0xF7F8FA,"
                f"tpad=stop_mode=clone:stop_duration=12,"
                f"fps={FPS},format=yuv420p"
            ),
            "-an",
            "-c:v",
            "libx264",
            "-preset",
            "veryfast",
            "-crf",
            "18",
            str(segment),
        ]
    )
    return segment


def burn_subtitles() -> None:
    style = (
        "FontName=Arial,"
        "FontSize=11,"
        "PrimaryColour=&H00FFFFFF,"
        "BackColour=&HA0000000,"
        "BorderStyle=4,"
        "Outline=0,"
        "Shadow=0,"
        "Alignment=2,"
        "MarginV=34"
    )
    run(
        [
            "ffmpeg",
            "-y",
            "-i",
            str(BASE),
            "-vf",
            f"subtitles={SRT}:force_style='{style}'",
            "-an",
            "-c:v",
            "libx264",
            "-preset",
            "medium",
            "-crf",
            "18",
            str(OUT),
        ]
    )


def main() -> None:
    SLIDES.mkdir(parents=True, exist_ok=True)
    RENDERS.mkdir(parents=True, exist_ok=True)
    write_srt()
    STORYBOARD.write_text(json.dumps(SCENES, indent=2), encoding="utf-8")

    segments: list[Path] = []
    for scene in SCENES:
        if scene["type"] == "slide":
            segments.append(render_slide(scene))
        else:
            segments.append(render_video(scene))

    CONCAT_LIST.write_text(
        "\n".join(f"file '{segment.resolve()}'" for segment in segments) + "\n",
        encoding="utf-8",
    )
    run(
        [
            "ffmpeg",
            "-y",
            "-f",
            "concat",
            "-safe",
            "0",
            "-i",
            str(CONCAT_LIST),
            "-c",
            "copy",
            "-an",
            str(BASE),
        ]
    )
    burn_subtitles()
    print(f"Rendered {OUT}")


if __name__ == "__main__":
    main()
