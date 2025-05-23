CONVERSION_MATRIX = {
    # Document Conversions
    "docx": ["pdf"],
    "pdf": ["docx", "pptx", "epub", "txt"],
    "pptx": ["pdf"],
    "odt": ["docx", "pdf"],
    # Images
    "png": ["pdf"],
    "jpg": ["pdf"],
    "jpeg": ["pdf"],
    "heic": ["jpg", "png"],
    "webp": ["jpg", "png"],
    "svg": ["png", "pdf"],
    # Notes & Study
    "txt": ["pdf", "docx"],
    "md": ["html", "pdf"],
    "epub": ["pdf"],
    # Multimedia
    "mp4": ["gif", "webm"],
    "mov": ["gif", "webm"],
    "wav": ["mp3"],
    "aac": ["mp3"],
    "mp3": ["wav"],
    # Data & Spreadsheet
    "csv": ["xls", "xlsx"],
    "xls": ["csv", "pdf"],
    "tsv": ["csv"],
    "zip": ["tar.gz", "rar"],
    "html": ["pdf"],
}