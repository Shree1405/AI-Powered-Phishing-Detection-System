"""
PDF report generation for scan results.
"""
from io import BytesIO
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from bson import ObjectId
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.units import inch

from app.database import get_db
from app.auth import get_current_user

router = APIRouter(prefix="/report", tags=["Reports"])


@router.get("/scan/{scan_id}/pdf")
async def export_scan_pdf(scan_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    try:
        scan = await db.scans.find_one({"_id": ObjectId(scan_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid scan ID")

    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")

    if str(scan["user_id"]) != str(current_user["_id"]) and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Access denied")

    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.5 * inch)
    styles = getSampleStyleSheet()
    story = []

    # Title
    title_style = ParagraphStyle("title", parent=styles["Title"], textColor=colors.HexColor("#00d4ff"))
    story.append(Paragraph("PhishGuard - Scan Report", title_style))
    story.append(Spacer(1, 0.2 * inch))

    # Meta info
    meta = [
        ["Scan ID", str(scan["_id"])],
        ["Scan Type", scan.get("scan_type", "").upper()],
        ["Date", scan.get("created_at", datetime.now()).strftime("%Y-%m-%d %H:%M UTC")],
        ["User", scan.get("username", "Unknown")],
        ["Target", str(scan.get("target", ""))[:80]],
        ["Prediction", scan.get("prediction", "")],
        ["Risk Score", f"{scan.get('risk_score', 0)}/100"],
    ]
    t = Table(meta, colWidths=[2 * inch, 4 * inch])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#1a1a2e")),
        ("TEXTCOLOR", (0, 0), (0, -1), colors.HexColor("#00d4ff")),
        ("TEXTCOLOR", (1, 0), (1, -1), colors.black),
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("ROWBACKGROUNDS", (1, 0), (1, -1), [colors.white, colors.HexColor("#f0f0f0")]),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("PADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(t)
    story.append(Spacer(1, 0.3 * inch))

    # Detected patterns (email scans)
    if scan.get("detected_patterns"):
        story.append(Paragraph("Detected Patterns", styles["Heading2"]))
        for p in scan["detected_patterns"]:
            story.append(Paragraph(f"• {p}", styles["Normal"]))
        story.append(Spacer(1, 0.2 * inch))

    # Explanation
    if scan.get("explanation"):
        story.append(Paragraph("Analysis", styles["Heading2"]))
        story.append(Paragraph(scan["explanation"], styles["Normal"]))

    doc.build(story)
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=scan_{scan_id}.pdf"},
    )
