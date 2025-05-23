# Multi Extension Conversion Website

## Features

- Upload single or multiple files (drag & drop)
- Smart suggestions for compatible output formats
- Batch conversion (with ZIP download)
- Secure (hashed) download links, temp storage auto-cleans
- Progress and notifications

## Extension Conversion Matrix

See `backend/conversion/conversion_matrix.py` for all supported conversions.

## Setup

### Backend

1. Install Python (3.8+ recommended)
2. `cd backend`
3. `pip install -r requirements.txt`
4. Install system dependencies:
   - LibreOffice (for docx/pptx/odt/pdf conversions)
   - ffmpeg (video/audio)
   - inkscape (svg)
   - rar, wkhtmltopdf as needed
5. `python app.py`

### Frontend

Open `frontend/index.html` in browser (or serve via Flask).

---

**Note:** For production, set a strong random `SECRET` in `utils/security.py`.
