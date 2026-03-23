#!/bin/bash
cd "$(dirname "$0")"
source .venv/bin/activate 2>/dev/null || {
  python3 -m venv .venv && source .venv/bin/activate
  pip install flask --quiet
}
python3 -c "import flask" 2>/dev/null || pip install flask --quiet
(sleep 1.5 && open "http://localhost:8080" 2>/dev/null) &
python3 server.py
