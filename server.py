"""
server.py  –  BTS Client Forms backend
Run with:  python3 server.py
Then open: http://localhost:8080
"""
import json
import csv
import io
import os
from flask import Flask, request, jsonify, send_from_directory, Response

import database as db

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

app = Flask(__name__, static_folder=BASE_DIR, static_url_path="")

# ─── Initialise DB on startup ────────────────────────────────────────────────
db.init_db()


# ─── Serve static files ──────────────────────────────────────────────────────
@app.route("/")
def index():
    return send_from_directory(BASE_DIR, "index.html")


@app.route("/<path:filename>")
def static_files(filename):
    return send_from_directory(BASE_DIR, filename)


# ─── API: Submit a form ───────────────────────────────────────────────────────
@app.route("/api/submit", methods=["POST"])
def submit():
    payload = request.get_json(force=True, silent=True) or {}
    form_id   = payload.get("form_id", "unknown")
    form_name = payload.get("form_name", form_id)
    data      = payload.get("data", {})

    if not data:
        return jsonify({"ok": False, "error": "No form data received"}), 400

    row_id = db.insert_submission(form_id, form_name, data)
    print(f"[DB] Saved {form_id} → id={row_id}")
    return jsonify({"ok": True, "id": row_id})


# ─── API: List submissions ────────────────────────────────────────────────────
@app.route("/api/submissions", methods=["GET"])
def list_submissions():
    form_id = request.args.get("form_id")
    search  = request.args.get("search")
    rows    = db.get_submissions(form_id=form_id, search=search)
    return jsonify(rows)


# ─── API: Get single submission ───────────────────────────────────────────────
@app.route("/api/submissions/<int:row_id>", methods=["GET"])
def get_submission(row_id):
    row = db.get_submission(row_id)
    if not row:
        return jsonify({"error": "Not found"}), 404
    return jsonify(row)


# ─── API: Delete submission ───────────────────────────────────────────────────
@app.route("/api/submissions/<int:row_id>", methods=["DELETE"])
def delete_submission(row_id):
    deleted = db.delete_submission(row_id)
    return jsonify({"ok": deleted})


# ─── API: Stats ───────────────────────────────────────────────────────────────
@app.route("/api/stats", methods=["GET"])
def stats():
    return jsonify(db.get_stats())


# ─── API: CSV export ──────────────────────────────────────────────────────────
@app.route("/api/export.csv", methods=["GET"])
def export_csv():
    form_id = request.args.get("form_id")
    rows    = db.get_submissions(form_id=form_id, limit=10000)

    # Flatten all data keys across all rows
    all_keys = []
    seen = set()
    for row in rows:
        for k in json.loads(row["data"]).keys():
            if k not in seen:
                all_keys.append(k)
                seen.add(k)

    output = io.StringIO()
    base_cols = ["id", "form_id", "form_name", "submitted_at", "client_name"]
    writer = csv.DictWriter(output, fieldnames=base_cols + all_keys, extrasaction="ignore")
    writer.writeheader()
    for row in rows:
        flat = {k: row[k] for k in base_cols}
        flat.update(json.loads(row["data"]))
        writer.writerow(flat)

    fname = f"bts_submissions{'_' + form_id if form_id else ''}.csv"
    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": f"attachment; filename={fname}"}
    )


# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("\n  BTS Client Forms Server")
    print("  ─────────────────────────────────────")
    print("  Open in browser: http://localhost:8080")
    print("  Admin panel:     http://localhost:8080/admin.html")
    print("  Press Ctrl+C to stop\n")
    app.run(host="0.0.0.0", port=8080, debug=False)
