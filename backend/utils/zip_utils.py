import zipfile

def zip_files(filepaths, zip_path, arc_names=None):
    with zipfile.ZipFile(zip_path, 'w') as zf:
        for i, f in enumerate(filepaths):
            arc_name = arc_names[i] if arc_names else None
            zf.write(f, arcname=arc_name or f.split("/")[-1])