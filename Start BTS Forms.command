#!/bin/bash
# ══════════════════════════════════════════════════════
#  BTS Client Forms — Start Server
#  Double-click this file to launch the web app.
# ══════════════════════════════════════════════════════

cd "$(dirname "$0")"

echo ""
echo "  ╔══════════════════════════════════════╗"
echo "  ║      BTS Client Forms Server         ║"
echo "  ╚══════════════════════════════════════╝"
echo ""

# ── Check Python 3 ──────────────────────────────────
if ! command -v python3 &>/dev/null; then
  echo "  ERROR: Python 3 is not installed."
  echo ""
  echo "  To install it, go to: https://www.python.org/downloads/"
  echo "  Then double-click this file again."
  echo ""
  read -p "  Press Enter to close..."
  exit 1
fi

echo "  Python: $(python3 --version)"

# ── Set up virtual environment ───────────────────────
VENV_DIR=".venv"

if [ ! -d "$VENV_DIR" ]; then
  echo "  Setting up environment (first-time only)..."
  python3 -m venv "$VENV_DIR"
  if [ $? -ne 0 ]; then
    echo ""
    echo "  ERROR: Could not create virtual environment."
    read -p "  Press Enter to close..."
    exit 1
  fi
fi

source "$VENV_DIR/bin/activate"

# ── Install Flask if needed ──────────────────────────
if ! python3 -c "import flask" 2>/dev/null; then
  echo "  Installing Flask (one-time, ~5 seconds)..."
  pip install flask --quiet
  if [ $? -ne 0 ]; then
    echo ""
    echo "  ERROR: Could not install Flask."
    read -p "  Press Enter to close..."
    exit 1
  fi
fi

echo "  Flask: ready"
echo ""
echo "  ─────────────────────────────────────────────"
echo "  Forms:  http://localhost:8080"
echo "  Admin:  http://localhost:8080/admin.html"
echo "  ─────────────────────────────────────────────"
echo "  Close this window (or press Ctrl+C) to stop."
echo ""

# ── Open browser after server has a moment to bind ──
(sleep 2 && open "http://localhost:8080") &

# ── Start server ─────────────────────────────────────
python3 server.py

echo ""
echo "  Server stopped."
read -p "  Press Enter to close..."
