
import json
import urllib.request
import urllib.error
from pathlib import Path

API_URL = "http://127.0.0.1:8000/api"
BACKUP_FILE = Path(__file__).resolve().parent.parent / "sirc-backup.json"

COLLECTIONS = ["products", "movements", "transports"]


def api_request(path, method="GET", data=None):
    url = f"{API_URL}{path}"
    body = None

    headers = {"Content-Type": "application/json"}

    if data is not None:
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")

    request = urllib.request.Request(
        url,
        data=body,
        headers=headers,
        method=method,
    )

    with urllib.request.urlopen(request, timeout=10) as response:
        content = response.read().decode("utf-8")
        return json.loads(content) if content else None


def main():
    if not BACKUP_FILE.exists():
        print(f"ERRO: arquivo não encontrado: {BACKUP_FILE}")
        return

    try:
        with BACKUP_FILE.open("r", encoding="utf-8") as file:
            backup = json.load(file)
    except (json.JSONDecodeError, OSError) as error:
        print(f"ERRO ao ler o backup: {error}")
        return

    total_imported = 0
    total_skipped = 0

    for collection in COLLECTIONS:
        items = backup.get(collection, [])

        if not isinstance(items, list):
            print(f"ERRO: '{collection}' não contém uma lista.")
            return

        existing_items = api_request(f"/{collection}")
        existing_ids = {
            str(item["id"])
            for item in existing_items
            if "id" in item
        }

        imported = 0
        skipped = 0

        for item in items:
            if not isinstance(item, dict) or "id" not in item:
                print(f"AVISO: registro inválido em {collection}; ignorado.")
                skipped += 1
                continue

            item_id = str(item["id"])

            if item_id in existing_ids:
                print(f"PULADO: {collection} — {item_id} já existe.")
                skipped += 1
                continue

            try:
                api_request(f"/{collection}", method="POST", data=item)
                existing_ids.add(item_id)
                imported += 1
                print(f"IMPORTADO: {collection} — {item_id}")
            except urllib.error.HTTPError as error:
                if error.code == 409:
                    print(f"PULADO: {item_id} já existe no banco.")
                    skipped += 1
                else:
                    print(f"ERRO ao importar {item_id}: HTTP {error.code}")
                    print(error.read().decode("utf-8", errors="replace"))
                    return
            except urllib.error.URLError as error:
                print(f"ERRO de conexão com a API: {error.reason}")
                print("Confira se o servidor FastAPI está ligado.")
                return

        total_imported += imported
        total_skipped += skipped

        print(
            f"\n{collection}: {imported} importado(s), "
            f"{skipped} ignorado(s).\n"
        )

    print("MIGRAÇÃO CONCLUÍDA!")
    print(f"Total importado: {total_imported}")
    print(f"Total ignorado: {total_skipped}")


if __name__ == "__main__":
    try:
        main()
    except urllib.error.URLError as error:
        print(f"Não foi possível acessar a API: {error}")
        print("Deixe o servidor FastAPI ligado e tente novamente.")
