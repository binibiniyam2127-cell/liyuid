import os
import sys

# Ensure backend directory is in sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "liyuid-backend"))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Extend package search path to include liyuid-backend/app
backend_app_dir = os.path.join(backend_dir, "app")
if os.path.exists(backend_app_dir) and backend_app_dir not in __path__:
    __path__.append(backend_app_dir)
