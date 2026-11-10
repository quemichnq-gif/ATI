# -*- coding: utf-8 -*-
"""
Main Entry Point for Resonancia Backend
Uses Flask Application Factory pattern via app.create_app()
"""
import sys
import os

# Fix console encoding on Windows/cross-platform
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

# Ensure backend root is on sys.path
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from app import create_app

app = create_app()

if __name__ == "__main__":
    print("Starting Resonancia Backend API on http://127.0.0.1:5001")
    app.run(port=5001, debug=True)
