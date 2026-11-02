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
