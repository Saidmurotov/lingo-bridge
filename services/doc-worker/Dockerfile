FROM python:3.12-slim

# Tesseract OCR with the languages the center works in (docs/07: TESSERACT_LANGS)
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        tesseract-ocr tesseract-ocr-eng tesseract-ocr-rus tesseract-ocr-uzb \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY worker.py .

CMD ["python", "worker.py"]
