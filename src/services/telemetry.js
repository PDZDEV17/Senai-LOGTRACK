const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  "https://logtrack-2444.onrender.com"
).replace(/\/$/, "");

export async function fetchLatestTelemetry(signal) {
  const response = await fetch(
    `${API_BASE_URL}/api/gps/latest/TR-008`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal,
    }
  );

  if (response.status === 404) {
    return [];
  }

  if (!response.ok) {
    throw new Error(`API respondeu HTTP ${response.status}`);
  }

  const payload = await response.json();

  if (
    typeof payload.latitude !== "number" ||
    typeof payload.longitude !== "number"
  ) {
    throw new Error("A API não retornou coordenadas válidas.");
  }

  return [
    {
      deviceId: payload.truck_id || "TR-008",
      latitude: payload.latitude,
      longitude: payload.longitude,
      timestamp:
        payload.timestamp ||
        payload.recorded_at ||
        payload.received_at,
      accuracy: payload.accuracy,
    },
  ];
}

export function formatTelemetryTime(timestamp) {
  if (!timestamp) return "Sem atualização";

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "Data inválida";
  }

  return date.toLocaleString("pt-BR");
}


export async function fetchTelemetryHistory(truckId = "TR-008", signal) {
  const response = await fetch(
    `${API_BASE_URL}/api/gps/history/${encodeURIComponent(truckId)}?limit=1000`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal,
    }
  );

  if (!response.ok) {
    throw new Error(`API respondeu HTTP ${response.status}`);
  }

  const payload = await response.json();
  if (!Array.isArray(payload)) {
    throw new Error("A API não retornou uma lista de posições.");
  }

  return payload
    .filter(
      (item) =>
        Number.isFinite(Number(item.latitude)) &&
        Number.isFinite(Number(item.longitude))
    )
    .map((item) => ({
      latitude: Number(item.latitude),
      longitude: Number(item.longitude),
      timestamp: item.timestamp || item.recorded_at || item.received_at,
    }))
    .reverse();
}
