import sys
import os
import uvicorn

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from backend.app.main import app

import time

if __name__ == "__main__":
    while True:
        try:
            config = uvicorn.Config(
                app="backend.app.main:app",
                host="127.0.0.1",
                port=8000,
                log_level="info",
                access_log=True,
                reload=True,
                reload_dirs=[os.path.join(os.path.abspath(os.path.dirname(__file__)), "backend")]
            )
            server = uvicorn.Server(config)
            server.run()
        except KeyboardInterrupt:
            break
        except Exception as e:
            print(f"[RECOVERY] Backend exited with error: {e}. Restarting in 2s...")
            time.sleep(2)

