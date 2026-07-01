# DevForge AI – Python FastAPI Service
# AI Chat, OCR, Whisper STT, Document Analysis, Image Captioning
# Run: uvicorn main:app --host 0.0.0.0 --port 8765 --reload

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
import uvicorn
import os
import io
import base64
import json
import time
import logging
from typing import Optional

# ─── Setup ────────────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("devforge")

app = FastAPI(
    title="DevForge AI Python Service",
    description="AI backend for DevForge AI – OCR, Chat, STT, Document Analysis",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Lazy imports (fail gracefully) ───────────────────────────────────────────
def try_import(module_name):
    try:
        import importlib
        return importlib.import_module(module_name)
    except ImportError:
        return None

# ─── Health Check ─────────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "DevForge AI Python Service",
        "version": "1.0.0",
        "timestamp": int(time.time()),
        "features": {
            "ocr":          _has_easyocr() or _has_pytesseract(),
            "whisper":      _has_whisper(),
            "transformers": _has_transformers(),
        }
    }

def _has_easyocr():
    try: import easyocr; return True
    except: return False

def _has_pytesseract():
    try: import pytesseract; return True
    except: return False

def _has_whisper():
    try: import whisper; return True
    except: return False

def _has_transformers():
    try: import transformers; return True
    except: return False

# ─── OCR Endpoint ─────────────────────────────────────────────────────────────
@app.post("/ocr")
async def ocr_image(file: UploadFile = File(...)):
    """Extract text from an image using EasyOCR or Pytesseract."""
    try:
        content = await file.read()

        # Try EasyOCR first
        try:
            import easyocr
            import numpy as np
            from PIL import Image
            img = Image.open(io.BytesIO(content)).convert("RGB")
            reader = easyocr.Reader(['en'], gpu=False, verbose=False)
            results = reader.readtext(np.array(img))
            text = "\n".join([r[1] for r in results])
            return {"success": True, "text": text, "engine": "easyocr", "confidence": results[0][2] if results else 0}
        except ImportError:
            pass

        # Fallback to pytesseract
        try:
            import pytesseract
            from PIL import Image
            img = Image.open(io.BytesIO(content))
            text = pytesseract.image_to_string(img)
            return {"success": True, "text": text.strip(), "engine": "pytesseract"}
        except ImportError:
            pass

        return {"success": False, "error": "No OCR engine available. Install: pip install easyocr OR pip install pytesseract pillow"}

    except Exception as e:
        logger.error(f"OCR error: {e}")
        return {"success": False, "error": str(e)}

# ─── Image Captioning ──────────────────────────────────────────────────────────
@app.post("/caption")
async def caption_image(file: UploadFile = File(...)):
    """Generate AI caption for an image."""
    try:
        content = await file.read()

        try:
            from transformers import BlipProcessor, BlipForConditionalGeneration
            from PIL import Image
            import torch

            img = Image.open(io.BytesIO(content)).convert("RGB")
            processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-base")
            model     = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-base")

            inputs  = processor(img, return_tensors="pt")
            out     = model.generate(**inputs, max_new_tokens=50)
            caption = processor.decode(out[0], skip_special_tokens=True)

            return {"success": True, "caption": caption, "model": "BLIP"}
        except ImportError:
            return {"success": False, "error": "Install transformers: pip install transformers torch pillow"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    except Exception as e:
        return {"success": False, "error": str(e)}

# ─── Whisper Speech-to-Text ────────────────────────────────────────────────────
@app.post("/whisper")
async def transcribe_audio(file: UploadFile = File(...), language: str = Form("en")):
    """Transcribe audio using OpenAI Whisper."""
    try:
        content = await file.read()

        try:
            import whisper
            import tempfile

            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
                tmp.write(content)
                tmp_path = tmp.name

            model   = whisper.load_model("base")
            result  = model.transcribe(tmp_path, language=language)
            os.unlink(tmp_path)

            return {
                "success": True,
                "text":     result["text"],
                "language": result.get("language", language),
                "segments": result.get("segments", []),
            }
        except ImportError:
            return {"success": False, "error": "Install whisper: pip install openai-whisper"}

    except Exception as e:
        return {"success": False, "error": str(e)}

# ─── Document Analysis ────────────────────────────────────────────────────────
@app.post("/document/analyze")
async def analyze_document(file: UploadFile = File(...), action: str = Form("summarize")):
    """Analyze uploaded document: summarize, translate, keywords."""
    try:
        content = await file.read()
        text    = ""

        filename = file.filename or ""
        ext      = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

        if ext == "pdf":
            try:
                import pdfplumber
                with pdfplumber.open(io.BytesIO(content)) as pdf:
                    text = "\n".join(p.extract_text() or "" for p in pdf.pages)
            except ImportError:
                try:
                    import PyPDF2
                    reader = PyPDF2.PdfReader(io.BytesIO(content))
                    text = "\n".join(p.extract_text() or "" for p in reader.pages)
                except ImportError:
                    return {"success": False, "error": "Install pdfplumber: pip install pdfplumber"}

        elif ext in ("txt", "md"):
            text = content.decode("utf-8", errors="ignore")

        elif ext == "docx":
            try:
                from docx import Document as DocxDocument
                doc  = DocxDocument(io.BytesIO(content))
                text = "\n".join(p.text for p in doc.paragraphs)
            except ImportError:
                return {"success": False, "error": "Install python-docx: pip install python-docx"}

        if not text.strip():
            return {"success": False, "error": "Could not extract text from document"}

        # Use local LLM for analysis
        import httpx
        prompt_map = {
            "summarize": "Summarize this document concisely:",
            "keywords":  "Extract the top 20 keywords from this document:",
            "translate": "Translate this document to English:",
            "notes":     "Create structured study notes from this document:",
        }
        prompt = prompt_map.get(action, f"Perform {action} on this document:")
        doc_excerpt = text[:3000]

        try:
            async with httpx.AsyncClient(timeout=60) as client:
                res = await client.post("http://localhost:11434/api/chat", json={
                    "model": "llama3.2",
                    "messages": [{"role": "user", "content": f"{prompt}\n\n{doc_excerpt}"}],
                    "stream": False,
                })
                data = res.json()
                answer = data.get("message", {}).get("content", "")
        except Exception:
            answer = f"[Ollama unavailable] Extracted {len(text)} characters. First 500: {text[:500]}"

        return {"success": True, "result": answer, "word_count": len(text.split()), "action": action}

    except Exception as e:
        return {"success": False, "error": str(e)}

# ─── Embeddings / RAG ─────────────────────────────────────────────────────────
@app.post("/embeddings")
async def get_embeddings(text: str = Form(...)):
    """Generate text embeddings using sentence-transformers."""
    try:
        from sentence_transformers import SentenceTransformer
        model  = SentenceTransformer("all-MiniLM-L6-v2")
        embs   = model.encode([text]).tolist()
        return {"success": True, "embeddings": embs[0], "model": "all-MiniLM-L6-v2"}
    except ImportError:
        return {"success": False, "error": "Install: pip install sentence-transformers"}
    except Exception as e:
        return {"success": False, "error": str(e)}

# ─── Run ──────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8765, reload=True)
