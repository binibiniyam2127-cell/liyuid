#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "==> LIYUID Backend Build Script Starting..."
python -m pip install --upgrade pip
# Pre-install lightweight CPU PyTorch wheel
pip install --no-cache-dir --extra-index-url https://download.pytorch.org/whl/cpu torch
# Install dependencies
if [ -f requirements.txt ]; then
    pip install --no-cache-dir -r requirements.txt
fi
echo "==> LIYUID Backend Build Completed Successfully!"
