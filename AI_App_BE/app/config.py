# -*- coding: utf-8 -*-
import os
import sys
from dotenv import load_dotenv
import google.generativeai as genai
import firebase_admin
from firebase_admin import credentials, firestore, auth
import cloudinary

# Fix console encoding on Windows/cross-platform
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
load_dotenv(os.path.join(BASE_DIR, ".env.local"))
load_dotenv(os.path.join(BASE_DIR, ".env"))

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
FIREBASE_API_KEY = os.getenv("FIREBASE_API_KEY")
ASTROLOGY_API_KEY = os.getenv("ASTROLOGY_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

# Firebase Admin configuration
FIREBASE_AVAILABLE = False
db = None
try:
    key_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH")
    cred = credentials.Certificate(key_path) if key_path else credentials.ApplicationDefault()
    firebase_admin.initialize_app(cred)
    FIREBASE_AVAILABLE = True
    print("Firebase Admin initialized.")
except Exception as fe:
    print(f"Firebase Admin initialization failed; using fallback mode: {fe}")
    FIREBASE_AVAILABLE = False
    db = None

# Cloudinary configuration
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME", "YOUR_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY", "YOUR_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET", "YOUR_API_SECRET")
)

