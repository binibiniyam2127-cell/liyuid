import os
import re
from PIL import Image, ImageDraw
import pytesseract

from tasks.config import app


@app.task(name="tasks.sanitize_document_image")
def sanitize_document_image(raw_image_path: str, output_image_path: str):
    """
    FR-08: Performs OCR scanning, isolates PII sequences (passports, national IDs,
    emails, long numerical/alphanumeric tokens), and writes redacted preview to disk.
    """
    try:
        if not os.path.exists(raw_image_path):
            return {"status": "error", "detail": f"File not found: {raw_image_path}"}

        img = Image.open(raw_image_path).convert("RGB")
        draw = ImageDraw.Draw(img)
        ocr_data = pytesseract.image_to_data(img, output_type=pytesseract.Output.DICT)

        pii_patterns = [
            r"^\d{6,}$",                                            # Sequential ID / passport numbers
            r"^[A-Z0-9]{8,}$",                                      # Alphanumeric document serials
            r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b" # Email addresses
        ]

        n_boxes = len(ocr_data["text"])
        redaction_count = 0

        for i in range(n_boxes):
            word = ocr_data["text"][i].strip()
            if not word:
                continue

            for pattern in pii_patterns:
                if re.search(pattern, word, re.IGNORECASE):
                    x, y, w, h = (
                        ocr_data["left"][i],
                        ocr_data["top"][i],
                        ocr_data["width"][i],
                        ocr_data["height"][i],
                    )
                    # Apply black bounding-box fill with a 2px padding margin
                    draw.rectangle([x - 2, y - 2, x + w + 2, y + h + 2], fill="black")
                    redaction_count += 1
                    break

        os.makedirs(os.path.dirname(output_image_path), exist_ok=True)
        img.save(output_image_path)

        return {
            "status": "sanitized",
            "redactions_applied": redaction_count,
            "output_path": output_image_path
        }
    except Exception as exc:
        print(f"[Sanitize Error] {exc}")
        return {"status": "error", "detail": str(exc)}
