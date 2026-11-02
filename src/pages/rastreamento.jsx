
import { useEffect, useState } from "react";
import { useSircData } from "../data/sircStore";
import L from "leaflet";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  CircleMarker,
  useMap,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";

import {
  Activity,
  AlertTriangle,
  Clock3,
  MapPin,
  Navigation,
  Package,
  Search,
  Signal,
  Truck,
  Warehouse,
} from "lucide-react";

import "./rastreamento.css";

import {
  fetchLatestTelemetry,
  formatTelemetryTime,
} from "../services/telemetry";

const vehicleTemplates = [
  {
    id: "TR-008",
    plate: "DEMO-008",
    load: "Carga LT-2048",
    origin: "Armazém SIRC",
    destination: "Zona Leste",
    status: "Em trânsito",
    lastUpdate: "Sem atualização",
    driver: "Motorista demonstrativo 01",
    position: [-5.0782, -42.7865],
    route: [
      [-5.0895, -42.802],
      [-5.0865, -42.797],
      [-5.082, -42.792],
      [-5.0782, -42.7865],
    ],
  },
  {
    id: "TR-014",
    plate: "DEMO-014",
    load: "Carga LT-2051",
    origin: "Armazém SIRC",
    destination: "Zona Sul",
    status: "Parado",
    lastUpdate: "Sem atualização",
    driver: "Motorista demonstrativo 02",
    position: [-5.099, -42.814],
    route: [
      [-5.0895, -42.802],
      [-5.093, -42.807],
      [-5.096, -42.811],
      [-5.099, -42.814],
    ],
  },
  {
    id: "TR-021",
    plate: "DEMO-021",
    load: "Carga LT-2057",
    origin: "Armazém SIRC",
    destination: "Zona Norte",
    status: "Aguardando saída",
    lastUpdate: "Sem atualização",
    driver: "Motorista demonstrativo 03",
    position: [-5.071, -42.814],
    route: [
      [-5.0895, -42.802],
      [-5.083, -42.809],
      [-5.077, -42.812],
      [-5.071, -42.814],
    ],
  },
];

const EMPTY_VEHICLE = {
  ...vehicleTemplates[0],
  id: "Sem veículo",
  transportId: "sem-transporte",
  load: "Nenhuma carga cadastrada",
  destination: "Sem destino cadastrado",
  status: "Aguardando saída",
  lastUpdate: "Sem atualização",
  position: [-5.0895, -42.802],
  route: [[-5.0895, -42.802]],
};

const statusClass = {
  "Em trânsito": "moving",
  Parado: "stopped",
  "Aguardando saída": "waiting",
  Entregue: "delivered",
  Cancelado: "cancelled",
};

function normalizeTransportStatus(status) {
  const normalized = String(status || "").trim().toLowerCase();

  if (normalized === "em trânsito") return "Em trânsito";
  if (normalized === "parado") return "Parado";
  if (normalized === "entregue") return "Entregue";
  if (normalized === "cancelado") return "Cancelado";

  return "Aguardando saída";
}

const truckSvg = `
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M3 6h11v12H3z M14 10h4l3 4v4h-7z"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linejoin="round"
    />
    <circle cx="7" cy="19" r="1.8" fill="currentColor" />
    <circle cx="18" cy="19" r="1.8" fill="currentColor" />
  </svg>
`;

function createVehicleIcon(status, selected) {
  const variant = statusClass[status] || "waiting";

  return L.divIcon({
    className: "sirc-map-icon",
    html: `
      <div class="sirc-vehicle-marker ${variant} ${
        selected ? "selected" : ""
      }">
        ${truckSvg}
      </div>
    `,
    iconSize: [42, 42],
    iconAnchor: [21, 21],
  });
}

function MapFocus({ position }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.flyTo(position, 14, { duration: 0.6 });
    }
  }, [map, position]);

  return null;
}

export default function Rastreamento() {
  const { transports } = useSircData();

  const [selectedId, setSelectedId] = useState(
    transports[0]?.id || ""
  );

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [telemetry, setTelemetry] = useState([]);
  const [apiState, setApiState] = useState("connecting");

  useEffect(() => {
    let active = true;
    let controller;

    const refreshTelemetry = async () => {
      controller?.abort();
      controller = new AbortController();

      try {
        const items = await fetchLatestTelemetry(controller.signal);

        if (!active) return;

        setTelemetry(items);
        setApiState("online");
      } catch (error) {
        if (!active || error.name === "AbortError") return;

        console.error("Erro ao consultar GPS:", error);
        setApiState("offline");
      }
    };

    refreshTelemetry();

    const interval = window.setInterval(refreshTelemetry, 5000);

    return () => {
      active = false;
      window.clearInterval(interval);
      controller?.abort();
    };
  }, []);

  const telemetryByDevice = new Map(
    telemetry.map((item) => [item.deviceId, item])
  );

  const vehicles = transports.map((transport, index) => {
    const template =
      vehicleTemplates.find(
        (vehicle) =>
          vehicle.id === transport.vehicle ||
          vehicle.id === transport.id
      ) || vehicleTemplates[index % vehicleTemplates.length];

    const id = transport.vehicle || transport.id;

    const livePoint =
      telemetryByDevice.get(id) ||
      telemetryByDevice.get("TR-008");

    const livePosition = livePoint
      ? [livePoint.latitude, livePoint.longitude]
      : null;

    const loadValue =
      transport.load || template.load.replace(/^Carga\s+/, "");

    return {
      ...template,
      id,
      transportId: transport.id,
      load: loadValue.startsWith("Carga ")
        ? loadValue
        : `Carga ${loadValue}`,
      origin: transport.origin || template.origin,
      destination: transport.destination || template.destination,
      status: normalizeTransportStatus(transport.status),
      lastUpdate: livePoint
        ? formatTelemetryTime(livePoint.timestamp)
        : transport.updatedAt || "Sem atualização",
      position: livePosition || template.position,
      route: livePosition ? [livePosition] : template.route,
      isLive: Boolean(livePoint),
    };
  });

  useEffect(() => {
    if (vehicles.length === 0) return;

    if (!vehicles.some((vehicle) => vehicle.transportId === selectedId)) {
      setSelectedId(vehicles[0].transportId);
    }
  }, [vehicles, selectedId]);

  const selectedVehicle =
    vehicles.find((vehicle) => vehicle.transportId === selectedId) ||
    vehicles[0] ||
    EMPTY_VEHICLE;

  const filteredVehicles = vehicles.filter((vehicle) => {
    const searchableText = `
      ${vehicle.id}
      ${vehicle.plate}
      ${vehicle.load}
      ${vehicle.destination}
    `.toLowerCase();

    const matchesSearch = searchableText.includes(
      search.trim().toLowerCase()
    );

    const matchesStatus =
      statusFilter === "Todos" || vehicle.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const movingCount = vehicles.filter(
    (vehicle) => vehicle.status === "Em trânsito"
  ).length;

  const stoppedCount = vehicles.filter(
    (vehicle) => vehicle.status === "Parado"
  ).length;

  const waitingCount = vehicles.filter(
    (vehicle) => vehicle.status === "Aguardando saída"
  ).length;

  const liveCount = vehicles.filter((vehicle) => vehicle.isLive).length;

  return (
    <section className="tracking-page">
      <header className="tracking-header">
        <div>
          <span className="tracking-eyebrow">
            RASTREAMENTO DE FROTAS
          </span>
          <h2>Rastreamento</h2>
          <p>Acompanhe os veículos e consulte as informações das cargas.</p>
        </div>

        <span className="tracking-demo-badge">
          <Activity size={15} />
          {liveCount > 0 ? "GPS INTEGRADO" : "MODO DEMONSTRAÇÃO"}
        </span>
      </header>

      <section className="tracking-metrics">
        <article className="tracking-metric">
          <div className="tracking-metric-icon blue">
            <Truck size={21} />
          </div>
          <div>
            <span>Veículos cadastrados</span>
            <strong>{vehicles.length}</strong>
            <small>Vinculados aos transportes</small>
          </div>
        </article>

        <article className="tracking-metric">
          <div className="tracking-metric-icon green">
            <Navigation size={21} />
          </div>
          <div>
            <span>Em trânsito</span>
            <strong>{movingCount}</strong>
            <small>Status dos transportes</small>
          </div>
        </article>

        <article className="tracking-metric">
          <div className="tracking-metric-icon orange">
            <Clock3 size={21} />
          </div>
          <div>
            <span>Parados</span>
            <strong>{stoppedCount}</strong>
            <small>Status dos transportes</small>
          </div>
        </article>

        <article className="tracking-metric">
          <div className="tracking-metric-icon purple">
            <Warehouse size={21} />
          </div>
          <div>
            <span>Aguardando saída</span>
            <strong>{waitingCount}</strong>
            <small>Antes do início do percurso</small>
          </div>
        </article>
      </section>

      <section className="tracking-workspace">
        <article className="tracking-map-panel">
          <div className="tracking-panel-header">
            <div>
              <h3>Mapa de operações</h3>
              <p>
                <MapPin size={13} />
                {liveCount > 0
                  ? "Posição recebida da API GPS"
                  : "Teresina, PI — localização demonstrativa"}
              </p>
            </div>

            <span className="tracking-map-label">
              <Signal size={14} />
              {apiState === "offline"
                ? "Erro na conexão com a API"
                : `${liveCount} GPS conectado(s)`}
            </span>
          </div>

          <div className="tracking-map-container">
            <MapContainer
              center={[-5.0895, -42.802]}
              zoom={13}
              scrollWheelZoom
              className="tracking-leaflet-map"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                maxZoom={19}
              />

              

              <CircleMarker
                center={[-5.0895, -42.802]}
                radius={8}
                pathOptions={{
                  color: "#ffffff",
                  weight: 3,
                  fillColor: "#347de6",
                  fillOpacity: 1,
                }}
              >
                <Popup>
                  <strong>Armazém SIRC</strong>
                  <br />
                  Ponto de origem ilustrativo.
                </Popup>
              </CircleMarker>

              <Polyline
                positions={selectedVehicle.route}
                pathOptions={{
                  color: "#347de6",
                  weight: 4,
                  opacity: 0.85,
                  dashArray:
                    !selectedVehicle.isLive &&
                    selectedVehicle.status === "Aguardando saída"
                      ? "8 8"
                      : undefined,
                }}
              />

              {vehicles.map((vehicle) => (
                <Marker
                  key={vehicle.transportId}
                  position={vehicle.position}
                  icon={createVehicleIcon(
                    vehicle.status,
                    vehicle.transportId === selectedId
                  )}
                  eventHandlers={{
                    click: () => setSelectedId(vehicle.transportId),
                  }}
                >
                  <Popup>
                    <div className="tracking-popup">
                      <strong>{vehicle.id}</strong>
                      <span>{vehicle.load}</span>
                      <span>Status: {vehicle.status}</span>
                      <span>
                        {vehicle.isLive
                          ? "GPS real — posição recebida da API"
                          : "Posição demonstrativa — sem GPS recebido"}
                      </span>
                      {vehicle.isLive && (
                        <span>Atualizado: {vehicle.lastUpdate}</span>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          <div className="tracking-map-legend">
            <span><i className="legend-circle blue" />Armazém</span>
            <span><i className="legend-circle green" />Em trânsito</span>
            <span><i className="legend-circle orange" />Parado</span>
            <span><i className="legend-circle purple" />Aguardando saída</span>
          </div>

          <div className="tracking-map-notice">
            <AlertTriangle size={16} />
            <span>
              {liveCount > 0
                ? `Coordenadas recebidas da API. Última atualização: ${selectedVehicle.isLive ? selectedVehicle.lastUpdate : "veículo selecionado sem GPS"}.`
                : apiState === "offline"
                  ? "Não foi possível consultar a API. Verifique a conexão e o endpoint."
                  : "Aguardando dados da API GPS. As posições exibidas ainda são demonstrativas."}
            </span>
          </div>
        </article>

        <aside className="tracking-vehicles-panel">
          <div className="tracking-panel-header">
            <div>
              <h3>Veículos</h3>
              <p>Selecione um veículo para consultar o percurso.</p>
            </div>
            <span className="tracking-count">{filteredVehicles.length}</span>
          </div>

          <label className="tracking-search">
            <Search size={17} />
            <input
              type="search"
              placeholder="Buscar veículo ou carga..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Buscar veículos e cargas"
            />
          </label>

          <label className="tracking-filter">
            <span>Status</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="Todos">Todos</option>
              <option value="Em trânsito">Em trânsito</option>
              <option value="Parado">Parado</option>
              <option value="Aguardando saída">Aguardando saída</option>
              <option value="Entregue">Entregue</option>
              <option value="Cancelado">Cancelado</option>
            </select>
          </label>

          <div className="tracking-vehicle-list">
            {filteredVehicles.map((vehicle) => (
              <button
                key={vehicle.transportId}
                type="button"
                className={`tracking-vehicle-card ${
                  selectedId === vehicle.transportId ? "selected" : ""
                }`}
                onClick={() => setSelectedId(vehicle.transportId)}
              >
                <div className="tracking-vehicle-icon">
                  <Truck size={20} />
                </div>

                <div className="tracking-vehicle-info">
                  <div className="tracking-vehicle-title">
                    <strong>{vehicle.id}</strong>
                    <span
                      className={`tracking-status ${
                        statusClass[vehicle.status] || "waiting"
                      }`}
                    >
                      {vehicle.status}
                    </span>
                  </div>

                  <span>{vehicle.load}</span>
                  <small>
                    <MapPin size={12} />
                    {vehicle.destination}
                  </small>
                  {vehicle.isLive && (
                    <small>GPS atualizado: {vehicle.lastUpdate}</small>
                  )}
                </div>
              </button>
            ))}

            {filteredVehicles.length === 0 && (
              <div className="tracking-empty">
                <Search size={23} />
                <strong>
                  {vehicles.length === 0
                    ? "Nenhum transporte cadastrado"
                    : "Nenhum veículo encontrado"}
                </strong>
                <span>
                  {vehicles.length === 0
                    ? "Cadastre um transporte para visualizá-lo aqui."
                    : "Tente alterar a busca ou o status."}
                </span>
              </div>
            )}
          </div>
        </aside>
      </section>

      <section className="tracking-details-panel">
        <div className="tracking-panel-header">
          <div>
            <h3>Detalhes do transporte</h3>
            <p>Informações do veículo selecionado</p>
          </div>

          <span
            className={`tracking-status ${
              statusClass[selectedVehicle.status] || "waiting"
            }`}
          >
            {selectedVehicle.status}
          </span>
        </div>

        <div className="tracking-details-grid">
          <div className="tracking-detail-item">
            <span>Identificação do veículo</span>
            <strong>{selectedVehicle.id}</strong>
          </div>
          <div className="tracking-detail-item">
            <span>Identificação do transporte</span>
            <strong>{selectedVehicle.transportId}</strong>
          </div>
          <div className="tracking-detail-item">
            <span>Carga</span>
            <strong>{selectedVehicle.load}</strong>
          </div>
          <div className="tracking-detail-item">
            <span>Origem</span>
            <strong>{selectedVehicle.origin}</strong>
          </div>
          <div className="tracking-detail-item">
            <span>Destino</span>
            <strong>{selectedVehicle.destination}</strong>
          </div>
          <div className="tracking-detail-item">
            <span>Responsável demonstrativo</span>
            <strong>{selectedVehicle.driver}</strong>
          </div>
          <div className="tracking-detail-item">
            <span>Última atualização</span>
            <strong>{selectedVehicle.lastUpdate}</strong>
          </div>
        </div>
      </section>

      <footer className="tracking-footer">
        <Package size={15} />
        <span>
          SIRC · {liveCount > 0
            ? "Posição GPS recebida pela API."
            : "Aguardando integração GPS com dispositivo físico."}
        </span>
      </footer>
    </section>
  );
}
