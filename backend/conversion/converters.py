import subprocess
from PIL import Image
import fitz  # PyMuPDF
import docx2pdf
import mammoth
import pypandoc

def convert_docx_to_pdf(in_path, out_path):
    docx2pdf.convert(in_path, out_path)

def convert_pdf_to_docx(in_path, out_path):
    pypandoc.convert_file(in_path, 'docx', outputfile=out_path)

def convert_pptx_to_pdf(in_path, out_path):
    subprocess.run(['libreoffice', '--headless', '--convert-to', 'pdf', in_path, '--outdir', out_path.rsplit("/",1)[0]], check=True)

def convert_odt_to_docx(in_path, out_path):
    subprocess.run(['libreoffice', '--headless', '--convert-to', 'docx', in_path, '--outdir', out_path.rsplit("/",1)[0]], check=True)

def convert_odt_to_pdf(in_path, out_path):
    subprocess.run(['libreoffice', '--headless', '--convert-to', 'pdf', in_path, '--outdir', out_path.rsplit("/",1)[0]], check=True)

def convert_image_to_pdf(in_path, out_path):
    img = Image.open(in_path)
    img.convert("RGB").save(out_path, "PDF")

def convert_webp_to_jpg(in_path, out_path):
    img = Image.open(in_path)
    img.convert("RGB").save(out_path, "JPEG")

def convert_webp_to_png(in_path, out_path):
    img = Image.open(in_path)
    img.save(out_path, "PNG")

def convert_heic_to_jpg(in_path, out_path):
    img = Image.open(in_path)
    img.convert("RGB").save(out_path, "JPEG")

def convert_heic_to_png(in_path, out_path):
    img = Image.open(in_path)
    img.save(out_path, "PNG")

def convert_svg_to_png(in_path, out_path):
    subprocess.run(['inkscape', in_path, '--export-type=png', f'--export-filename={out_path}'], check=True)

def convert_svg_to_pdf(in_path, out_path):
    subprocess.run(['inkscape', in_path, '--export-type=pdf', f'--export-filename={out_path}'], check=True)

def convert_txt_to_pdf(in_path, out_path):
    pypandoc.convert_file(in_path, 'pdf', outputfile=out_path)

def convert_txt_to_docx(in_path, out_path):
    pypandoc.convert_file(in_path, 'docx', outputfile=out_path)

def convert_md_to_html(in_path, out_path):
    pypandoc.convert_file(in_path, 'html', outputfile=out_path)

def convert_md_to_pdf(in_path, out_path):
    pypandoc.convert_file(in_path, 'pdf', outputfile=out_path)

def convert_epub_to_pdf(in_path, out_path):
    pypandoc.convert_file(in_path, 'pdf', outputfile=out_path)

def convert_pdf_to_epub(in_path, out_path):
    pypandoc.convert_file(in_path, 'epub', outputfile=out_path)

def convert_pdf_to_txt(in_path, out_path):
    pypandoc.convert_file(in_path, 'plain', outputfile=out_path)

def convert_mp4_to_gif(in_path, out_path):
    subprocess.run(['ffmpeg', '-i', in_path, out_path], check=True)

def convert_mp4_to_webm(in_path, out_path):
    subprocess.run(['ffmpeg', '-i', in_path, out_path], check=True)

def convert_wav_to_mp3(in_path, out_path):
    subprocess.run(['ffmpeg', '-i', in_path, out_path], check=True)

def convert_aac_to_mp3(in_path, out_path):
    subprocess.run(['ffmpeg', '-i', in_path, out_path], check=True)

def convert_mp3_to_wav(in_path, out_path):
    subprocess.run(['ffmpeg', '-i', in_path, out_path], check=True)

def convert_csv_to_xls(in_path, out_path):
    import pandas as pd
    df = pd.read_csv(in_path)
    df.to_excel(out_path, index=False)

def convert_csv_to_xlsx(in_path, out_path):
    import pandas as pd
    df = pd.read_csv(in_path)
    df.to_excel(out_path, index=False, engine='openpyxl')

def convert_xls_to_csv(in_path, out_path):
    import pandas as pd
    df = pd.read_excel(in_path)
    df.to_csv(out_path, index=False)

def convert_xls_to_pdf(in_path, out_path):
    # Use LibreOffice
    subprocess.run(['libreoffice', '--headless', '--convert-to', 'pdf', in_path, '--outdir', out_path.rsplit("/",1)[0]], check=True)

def convert_tsv_to_csv(in_path, out_path):
    import pandas as pd
    df = pd.read_csv(in_path, sep='\t')
    df.to_csv(out_path, index=False)

def convert_zip_to_targz(in_path, out_path):
    shutil.unpack_archive(in_path, out_path + "_extracted", "zip")
    shutil.make_archive(out_path[:-7], 'gztar', out_path + "_extracted")
    shutil.rmtree(out_path + "_extracted")

def convert_zip_to_rar(in_path, out_path):
    # Requires rar utility
    shutil.unpack_archive(in_path, out_path + "_extracted", "zip")
    subprocess.run(['rar', 'a', out_path, out_path + "_extracted"], check=True)
    shutil.rmtree(out_path + "_extracted")

def convert_html_to_pdf(in_path, out_path):
    subprocess.run(['wkhtmltopdf', in_path, out_path], check=True)

CONVERTER_MAP = {
    # Documents
    ("docx", "pdf"): convert_docx_to_pdf,
    ("pdf", "docx"): convert_pdf_to_docx,
    ("pptx", "pdf"): convert_pptx_to_pdf,
    ("odt", "docx"): convert_odt_to_docx,
    ("odt", "pdf"): convert_odt_to_pdf,
    # Images
    ("png", "pdf"): convert_image_to_pdf,
    ("jpg", "pdf"): convert_image_to_pdf,
    ("jpeg", "pdf"): convert_image_to_pdf,
    ("webp", "jpg"): convert_webp_to_jpg,
    ("webp", "png"): convert_webp_to_png,
    ("heic", "jpg"): convert_heic_to_jpg,
    ("heic", "png"): convert_heic_to_png,
    ("svg", "png"): convert_svg_to_png,
    ("svg", "pdf"): convert_svg_to_pdf,
    # Notes
    ("txt", "pdf"): convert_txt_to_pdf,
    ("txt", "docx"): convert_txt_to_docx,
    ("md", "html"): convert_md_to_html,
    ("md", "pdf"): convert_md_to_pdf,
    ("epub", "pdf"): convert_epub_to_pdf,
    ("pdf", "epub"): convert_pdf_to_epub,
    ("pdf", "txt"): convert_pdf_to_txt,
    # Multimedia
    ("mp4", "gif"): convert_mp4_to_gif,
    ("mp4", "webm"): convert_mp4_to_webm,
    ("mov", "gif"): convert_mp4_to_gif,
    ("mov", "webm"): convert_mp4_to_webm,
    ("wav", "mp3"): convert_wav_to_mp3,
    ("aac", "mp3"): convert_aac_to_mp3,
    ("mp3", "wav"): convert_mp3_to_wav,
    # Data
    ("csv", "xls"): convert_csv_to_xls,
    ("csv", "xlsx"): convert_csv_to_xlsx,
    ("xls", "csv"): convert_xls_to_csv,
    ("xls", "pdf"): convert_xls_to_pdf,
    ("tsv", "csv"): convert_tsv_to_csv,
    # Misc
    ("zip", "tar.gz"): convert_zip_to_targz,
    ("zip", "rar"): convert_zip_to_rar,
    ("html", "pdf"): convert_html_to_pdf,
}

def get_converter(in_ext, out_ext):
    return CONVERTER_MAP.get((in_ext, out_ext))