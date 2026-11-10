# -*- coding: utf-8 -*-
"""
Facade re-export for rag_service.
The implementation has been moved to app.services.rag_service.
This file ensures 100% backward compatibility for existing tests and legacy imports.
"""
from app.services.rag_service import *
