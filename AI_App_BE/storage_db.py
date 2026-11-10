# -*- coding: utf-8 -*-
"""
Facade re-export for storage_db.
The implementation has been moved to app.repositories.storage_db.
This file ensures 100% backward compatibility for existing tests and legacy imports.
"""
from app.repositories.storage_db import *
