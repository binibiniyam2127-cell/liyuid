import os
import sys

# Ensure backend directory is in Python path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "liyuid-backend"))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from app.main import app

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, workers=1)
