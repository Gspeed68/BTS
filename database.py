"""
database.py  –  SQLite (local) / PostgreSQL (hosted) for BTS Client Forms

Automatically uses PostgreSQL when the DATABASE_URL environment variable is
set (e.g. on Render), and falls back to SQLite for local development.
"""
import json
import os
import sqlite3
from datetime import datetime

DATABASE_URL = os.environ.get("DATABASE_URL", "")

# Render supplies  postgres://…  but psycopg2 needs  postgresql://…
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

USE_PG = bool(DATABASE_URL)

if USE_PG:
    import psycopg2
    import psycopg2.extras

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "bts_forms.db")


# ─── Connection helpers ───────────────────────────────────────────────────────

def _pg_conn():
    conn = psycopg2.connect(DATABASE_URL)
    return conn


def _sqlite_conn():
    conn = sqlite3.connect(DB_PATH, timeout=10)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=DELETE")
    return conn


# ─── Unified execute (handles ? vs %s placeholder difference) ────────────────

def _exec(sql, params=None, fetchone=False, fetchall=False, commit=False):
    """Run a query against whichever database is configured."""
    if USE_PG:
        sql_pg = sql.replace("?", "%s")
        conn = _pg_conn()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(sql_pg, params or [])
        result = None
        if fetchone:
            result = cur.fetchone()
            result = dict(result) if result else None
        elif fetchall:
            result = [dict(r) for r in cur.fetchall()]
        if commit:
            conn.commit()
            result = cur.lastrowid if result is None else result
        conn.close()
        return result
    else:
        conn = _sqlite_conn()
        cur = conn.execute(sql, params or [])
        result = None
        if fetchone:
            row = cur.fetchone()
            result = dict(row) if row else None
        elif fetchall:
            result = [dict(r) for r in cur.fetchall()]
        if commit:
            conn.commit()
            result = cur.lastrowid if result is None else result
        conn.close()
        return result


# ─── Schema ───────────────────────────────────────────────────────────────────

def init_db():
    """Create tables if they don't already exist."""
    if USE_PG:
        conn = _pg_conn()
        conn.cursor().execute("""
            CREATE TABLE IF NOT EXISTS submissions (
                id           SERIAL PRIMARY KEY,
                form_id      TEXT    NOT NULL,
                form_name    TEXT    NOT NULL,
                submitted_at TEXT    NOT NULL,
                client_name  TEXT,
                data         TEXT    NOT NULL
            )
        """)
        conn.commit()
        conn.close()
    else:
        conn = _sqlite_conn()
        conn.execute("""
            CREATE TABLE IF NOT EXISTS submissions (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                form_id      TEXT    NOT NULL,
                form_name    TEXT    NOT NULL,
                submitted_at TEXT    NOT NULL,
                client_name  TEXT,
                data         TEXT    NOT NULL
            )
        """)
        conn.commit()
        conn.close()
    print(f"[DB] Initialized ({'PostgreSQL' if USE_PG else 'SQLite'})")


# ─── CRUD ─────────────────────────────────────────────────────────────────────

def insert_submission(form_id, form_name, data):
    """Save a form submission. Returns the new row id."""
    client_name = (
        data.get("client_name") or data.get("spouse_name") or
        data.get("secretary_name") or data.get("corporation_name") or
        data.get("company_name") or data.get("company") or ""
    )
    now = datetime.utcnow().isoformat(timespec="seconds") + "Z"

    if USE_PG:
        conn = _pg_conn()
        cur = conn.cursor()
        cur.execute(
            """INSERT INTO submissions (form_id, form_name, submitted_at, client_name, data)
               VALUES (%s, %s, %s, %s, %s) RETURNING id""",
            (form_id, form_name, now, client_name, json.dumps(data))
        )
        row_id = cur.fetchone()[0]
        conn.commit()
        conn.close()
    else:
        conn = _sqlite_conn()
        cur = conn.execute(
            """INSERT INTO submissions (form_id, form_name, submitted_at, client_name, data)
               VALUES (?, ?, ?, ?, ?)""",
            (form_id, form_name, now, client_name, json.dumps(data))
        )
        conn.commit()
        row_id = cur.lastrowid
        conn.close()

    return row_id


def get_submissions(form_id=None, search=None, limit=200):
    """Return list of submissions, optionally filtered."""
    clauses, params = [], []
    if form_id:
        clauses.append("form_id = ?")
        params.append(form_id)
    if search:
        clauses.append("(client_name LIKE ? OR data LIKE ?)")
        params.extend([f"%{search}%", f"%{search}%"])
    where = ("WHERE " + " AND ".join(clauses)) if clauses else ""
    return _exec(
        f"SELECT id, form_id, form_name, submitted_at, client_name, data "
        f"FROM submissions {where} ORDER BY submitted_at DESC LIMIT ?",
        params + [limit],
        fetchall=True
    ) or []


def get_submission(row_id):
    """Return a single submission by id."""
    return _exec(
        "SELECT * FROM submissions WHERE id = ?",
        [row_id], fetchone=True
    )


def delete_submission(row_id):
    """Delete a submission. Returns True if a row was removed."""
    if USE_PG:
        conn = _pg_conn()
        cur = conn.cursor()
        cur.execute("DELETE FROM submissions WHERE id = %s", (row_id,))
        deleted = cur.rowcount > 0
        conn.commit()
        conn.close()
        return deleted
    else:
        conn = _sqlite_conn()
        cur = conn.execute("DELETE FROM submissions WHERE id = ?", (row_id,))
        conn.commit()
        deleted = cur.rowcount > 0
        conn.close()
        return deleted


def get_stats():
    """Return counts per form for the dashboard."""
    rows = _exec(
        "SELECT form_id, form_name, COUNT(*) as count "
        "FROM submissions GROUP BY form_id ORDER BY form_id",
        fetchall=True
    ) or []
    total_row = _exec("SELECT COUNT(*) as n FROM submissions", fetchone=True)
    total = total_row["n"] if total_row else 0
    return {"total": total, "by_form": rows}
