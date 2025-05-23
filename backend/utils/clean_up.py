import os
import threading
import time

def schedule_cleanup(files, after_seconds):
    def cleanup():
        time.sleep(after_seconds)
        for f in files:
            try:
                os.remove(f['path'] if isinstance(f, dict) else f)
            except Exception:
                pass
    threading.Thread(target=cleanup, daemon=True).start()