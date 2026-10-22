
import json
import sqlite3
from contextlib import closing
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware


BASE_DIR = Path(__file__).resolve().parent
DATABASE_PATH = BASE_DIR / "sirc.db"

COLLECTIONS = {
    "products": "products",
    "movements": "movements",
    "transports": "transports",
}

app = FastAPI(
    title="SIRC API",
    description="API do Sistema Integrado de Rastreamento e Controle",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def get_connection():
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_database():
    with closing(get_connection()) as connection:
        for table in COLLECTIONS.values():
            connection.execute(
                f"""
                CREATE TABLE IF NOT EXISTS {table} (
                    id TEXT PRIMARY KEY,
                    data TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )
                """
            )
            connection.execute(
            """
            CREATE TABLE IF NOT EXISTS gps_positions (
                id TEXT PRIMARY KEY,
                truck_id TEXT NOT NULL,
                latitude REAL NOT NULL,
                longitude REAL NOT NULL,
                recorded_at TEXT,
                received_at TEXT NOT NULL
            )
            """
        )
        connection.commit()


def validate_collection(collection: str):
    if collection not in COLLECTIONS:
        raise HTTPException(
            status_code=404,
            detail="Coleção não encontrada. Use products, movements ou transports.",
        )
    return COLLECTIONS[collection]


def serialize_row(row):
    item = json.loads(row["data"])
    item["id"] = row["id"]
    item["created_at"] = row["created_at"]
    item["updated_at"] = row["updated_at"]
    return item


@app.get("/")
def home():
    return {"message": "API do SIRC está funcionando!"}


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "SIRC API"}


@app.get("/api/{collection}")
def list_items(collection: str):
    table = validate_collection(collection)

    with closing(get_connection()) as connection:
        rows = connection.execute(
            f"SELECT * FROM {table} ORDER BY created_at DESC"
        ).fetchall()

    return [serialize_row(row) for row in rows]


@app.get("/api/{collection}/{item_id}")
def get_item(collection: str, item_id: str):
    table = validate_collection(collection)

    with closing(get_connection()) as connection:
        row = connection.execute(
            f"SELECT * FROM {table} WHERE id = ?",
            (item_id,),
        ).fetchone()

    if row is None:
        raise HTTPException(status_code=404, detail="Registro não encontrado.")

    return serialize_row(row)


@app.post("/api/{collection}", status_code=201)
def create_item(
    collection: str,
    item: dict = Body(...),
):
    table = validate_collection(collection)
    data = dict(item)
    item_id = str(data.get("id") or uuid4())
    timestamp = now_iso()
    data["id"] = item_id

    with closing(get_connection()) as connection:
        existing = connection.execute(
            f"SELECT id FROM {table} WHERE id = ?",
            (item_id,),
        ).fetchone()

        if existing:
            raise HTTPException(
                status_code=409,
                detail="Já existe um registro com esse ID.",
            )

        connection.execute(
            f"""
            INSERT INTO {table} (id, data, created_at, updated_at)
            VALUES (?, ?, ?, ?)
            """,
            (item_id, json.dumps(data, ensure_ascii=False), timestamp, timestamp),
        )
        connection.commit()

    return {
        **data,
        "created_at": timestamp,
        "updated_at": timestamp,
    }


@app.put("/api/{collection}/{item_id}")
def update_item(
    collection: str,
    item_id: str,
    item: dict = Body(...),
):
    table = validate_collection(collection)

    with closing(get_connection()) as connection:
        row = connection.execute(
            f"SELECT * FROM {table} WHERE id = ?",
            (item_id,),
        ).fetchone()

        if row is None:
            raise HTTPException(status_code=404, detail="Registro não encontrado.")

        data = dict(item)
        data["id"] = item_id
        timestamp = now_iso()

        connection.execute(
            f"UPDATE {table} SET data = ?, updated_at = ? WHERE id = ?",
            (json.dumps(data, ensure_ascii=False), timestamp, item_id),
        )
        connection.commit()

    return {
        **data,
        "created_at": row["created_at"],
        "updated_at": timestamp,
    }


@app.delete("/api/{collection}/{item_id}")
def delete_item(collection: str, item_id: str):
    table = validate_collection(collection)

    with closing(get_connection()) as connection:
        cursor = connection.execute(
            f"DELETE FROM {table} WHERE id = ?",
            (item_id,),
        )
        connection.commit()

    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Registro não encontrado.")

    return {"message": "Registro excluído com sucesso.", "id": item_id}


@app.patch("/api/transports/{transport_id}/status")
def update_transport_status(
    transport_id: str,
    payload: dict = Body(...),
):
    table = COLLECTIONS["transports"]
    new_status = payload.get("status")

    if not new_status:
        raise HTTPException(
            status_code=400,
            detail="Informe o campo status.",
        )

    with closing(get_connection()) as connection:
        row = connection.execute(
            f"SELECT * FROM {table} WHERE id = ?",
            (transport_id,),
        ).fetchone()

        if row is None:
            raise HTTPException(status_code=404, detail="Transporte não encontrado.")

        data = json.loads(row["data"])
        data["status"] = new_status
        timestamp = now_iso()

        history = data.get("history", [])
        if not isinstance(history, list):
            history = []

        history.append({
            "status": new_status,
            "timestamp": timestamp,
        })
        data["history"] = history

        connection.execute(
            f"UPDATE {table} SET data = ?, updated_at = ? WHERE id = ?",
            (json.dumps(data, ensure_ascii=False), timestamp, transport_id),
        )
        connection.commit()

    return {
        **data,
        "created_at": row["created_at"],
        "updated_at": timestamp,
    }


@app.post("/api/gps/positions", status_code=201)
def create_gps_position(payload: dict = Body(...)):
    truck_id = payload.get("truck_id")
    latitude = payload.get("latitude")
    longitude = payload.get("longitude")
    recorded_at = payload.get("timestamp")

    if not truck_id:
        raise HTTPException(
            status_code=400,
            detail="Informe truck_id.",
        )

    try:
        latitude = float(latitude)
        longitude = float(longitude)
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=400,
            detail="Latitude e longitude devem ser números.",
        )

    if not (-90 <= latitude <= 90):
        raise HTTPException(
            status_code=400,
            detail="Latitude inválida.",
        )

    if not (-180 <= longitude <= 180):
        raise HTTPException(
            status_code=400,
            detail="Longitude inválida.",
        )

    received_at = now_iso()
    position_id = str(uuid4())

    with closing(get_connection()) as connection:
        connection.execute(
            """
            INSERT INTO gps_positions (
                id, truck_id, latitude, longitude,
                recorded_at, received_at
            )
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                position_id,
                str(truck_id),
                latitude,
                longitude,
                str(recorded_at) if recorded_at else None,
                received_at,
            ),
        )
        connection.commit()

    return {
        "id": position_id,
        "truck_id": str(truck_id),
        "latitude": latitude,
        "longitude": longitude,
        "timestamp": recorded_at,
        "received_at": received_at,
    }


@app.get("/api/gps/latest/{truck_id}")
def get_latest_gps_position(truck_id: str):
    with closing(get_connection()) as connection:
        row = connection.execute(
            """
            SELECT * FROM gps_positions
            WHERE truck_id = ?
            ORDER BY received_at DESC
            LIMIT 1
            """,
            (truck_id,),
        ).fetchone()

    if row is None:
        raise HTTPException(
            status_code=404,
            detail="Nenhuma posição encontrada para esse caminhão.",
        )

    return dict(row)


@app.get("/api/gps/history/{truck_id}")
def get_gps_history(truck_id: str, limit: int = 100):
    if not 1 <= limit <= 1000:
        raise HTTPException(
            status_code=400,
            detail="O limite deve estar entre 1 e 1000.",
        )

    with closing(get_connection()) as connection:
        rows = connection.execute(
            """
            SELECT * FROM gps_positions
            WHERE truck_id = ?
            ORDER BY received_at DESC
            LIMIT ?
            """,
            (truck_id, limit),
        ).fetchall()

    return [dict(row) for row in rows]


initialize_database()
