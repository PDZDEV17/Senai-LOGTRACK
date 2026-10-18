
import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Polyline,
  Popup,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  MapPin,
  Package,
  PackageCheck,
  Search,
  ShieldCheck,
  Truck,
  Warehouse,
} from "lucide-react";
import "./Clientes.css";

const deliveries = [
  {
    id: "SIRC-2048",
    order: "PED-2048",
    description: "Materiais de armazenagem",
    status: "Em trânsito",
    progress: 68,
    origin: "Armazém principal",
    destination: "Centro de Distribuição, Teresina - PI",
    expected: "Hoje, até 18h",
    lastUpdate: "16/10/2026 às 14:32",
    location: "Região central de Teresina — exemplo",
    position: [-5.0782, -42.7865],
    originPosition: [-5.0895, -42.802],
    destinationPosition: [-5.064, -42.774],
    route: [
      [-5.0895, -42.802],
      [-5.0865, -42.797],
      [-5.082, -42.792],
      [-5.0782, -42.7865],
      [-5.071, -42.781],
      [-5.064, -42.774],
    ],
    timeline: [
      {
        title: "Pedido registrado",
        description: "O pedido foi registrado no sistema.",
        time: "08:10",
        state: "done",
      },
      {
        title: "Carga preparada",
        description: "A carga foi preparada no armazém.",
        time: "08:50",
        state: "done",
      },
      {
        title: "Saiu para transporte",
        description: "O transporte foi iniciado.",
        time: "09:15",
        state: "done",
      },
      {
        title: "Em trânsito",
        description: "A entrega está em andamento.",
        time: "14:32",
        state: "current",
      },
      {
        title: "Entrega concluída",
        description: "Aguardando confirmação da conclusão.",
        time: "Pendente",
        state: "pending",
      },
    ],
  },
  {
    id: "SIRC-2051",
    order: "PED-2051",
    description: "Equipamentos",
    status: "Em preparação",
    progress: 30,
    origin: "Armazém principal",
    destination: "Zona Sul, Teresina - PI",
    expected: "Previsão a confirmar",
    lastUpdate: "16/10/2026 às 13:45",
    location: "Última etapa: armazém",
    position: [-5.0895, -42.802],
    originPosition: [-5.0895, -42.802],
    destinationPosition: [-5.099, -42.814],
    route: [
      [-5.0895, -42.802],
      [-5.093, -42.807],
      [-5.096, -42.811],
      [-5.099, -42.814],
    ],
    timeline: [
      {
        title: "Pedido registrado",
        description: "O pedido foi registrado no sistema.",
        time: "10:05",
        state: "done",
      },
      {
        title: "Carga em preparação",
        description: "A mercadoria está sendo preparada.",
        time: "13:45",
        state: "current",
      },
      {
        title: "Saiu para transporte",
        description: "Aguardando expedição.",
        time: "Pendente",
        state: "pending",
      },
      {
        title: "Entrega concluída",
        description: "Aguardando confirmação da conclusão.",
        time: "Pendente",
        state: "pending",
      },
    ],
  },
  {
    id: "SIRC-2057",
    order: "PED-2057",
    description: "Embalagens",
    status: "Entregue",
    progress: 100,
    origin: "Armazém principal",
    destination: "Zona Norte, Teresina - PI",
    expected: "Entrega registrada",
    lastUpdate: "16/10/2026 às 12:20",
    location: "Destino — exemplo",
    position: [-5.071, -42.814],
    originPosition: [-5.0895, -42.802],
    destinationPosition: [-5.071, -42.814],
    route: [
      [-5.0895, -42.802],
      [-5.083, -42.809],
      [-5.077, -42.812],
      [-5.071, -42.814],
    ],
    timeline: [
      {
        title: "Pedido registrado",
        description: "O pedido foi registrado no sistema.",
        time: "07:30",
        state: "done",
      },
      {
        title: "Carga preparada",
        description: "A carga foi preparada no armazém.",
        time: "08:15",
        state: "done",
      },
      {
        title: "Saiu para transporte",
        description: "O transporte foi iniciado.",
        time: "09:00",
        state: "done",
      },
      {
        title: "Entrega concluída",
        description: "O status foi marcado como entregue para demonstração.",
        time: "12:20",
        state: "done",
      },
    ],
  },
];

function MapFocus({ position }) {
  const map = useMap();

  useEffect(() => {
    map.flyTo(position, 13, { duration: 0.6 });
  }, [map, position]);

  return null;
}

function getStatusClass(status) {
  if (status === "Entregue") return "delivered";
  if (status === "Em trânsito") return "moving";
  return "preparing";
}

export default function Clientes() {
  const [trackingCode, setTrackingCode] = useState("SIRC-2048");
  const [activeDelivery, setActiveDelivery] = useState(deliveries[0]);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  function handleTracking(event) {
    event.preventDefault();

    const normalizedCode = trackingCode.trim().toUpperCase();

    if (!normalizedCode) {
      setError("Digite o código de rastreamento.");
      setSearched(true);
      return;
    }

    const result = deliveries.find(
      (delivery) => delivery.id === normalizedCode
    );

    setSearched(true);

    if (!result) {
      setError(
        "Não encontramos esse código nos dados de demonstração. Confira o código e tente novamente."
      );
      return;
    }

    setActiveDelivery(result);
    setTrackingCode(result.id);
    setError("");
  }

  const statusClass = getStatusClass(activeDelivery.status);

  return (
    <section className="client-page">
      <header className="client-header">
        <div className="client-brand">
          <div className="client-brand-icon">
            <PackageCheck size={24} />
          </div>
          <div>
            <strong>SIRC</strong>
            <span>PORTAL DO CLIENTE</span>
          </div>
        </div>

        <div className="client-secure-label">
          <ShieldCheck size={16} />
          Acompanhamento de entregas
        </div>
      </header>

      <section className="client-hero">
        <div className="client-hero-content">
          <span className="client-eyebrow">RASTREAMENTO DE ENTREGAS</span>
          <h2>Sua entrega, sempre ao seu alcance.</h2>
          <p>
            Consulte o andamento da sua carga e acompanhe as atualizações
            disponíveis em um só lugar.
          </p>
        </div>

        <div className="client-search-card">
          <label htmlFor="client-tracking-code">
            Código de rastreamento
          </label>

          <form onSubmit={handleTracking}>
            <div className="client-search-input">
              <Search size={18} />
              <input
                id="client-tracking-code"
                value={trackingCode}
                onChange={(event) => {
                  setTrackingCode(event.target.value);
                  setError("");
                }}
                placeholder="Ex.: SIRC-2048"
                autoComplete="off"
                required
              />
            </div>

            <button type="submit" className="client-track-button">
              Rastrear entrega
              <ArrowRight size={17} />
            </button>
          </form>

          {error && (
            <p className="client-search-error" role="alert">
              {error}
            </p>
          )}

          {!error && !searched && (
            <span className="client-search-hint">
              Teste com o código SIRC-2048.
            </span>
          )}
        </div>
      </section>

      <div className="client-demo-notice">
        <Clock3 size={16} />
        <span>
          Versão de demonstração. Os códigos, horários, status e posições
          exibidos são fictícios; o GPS real ainda não está conectado.
        </span>
      </div>

      <section className="client-delivery-overview">
        <div className="client-delivery-heading">
          <div className="client-delivery-symbol">
            <Package size={22} />
          </div>

          <div className="client-delivery-title">
            <span>Pedido {activeDelivery.order}</span>
            <h3>{activeDelivery.description}</h3>
            <small>Código: {activeDelivery.id}</small>
          </div>

          <span className={`client-status-badge ${statusClass}`}>
            <span />
            {activeDelivery.status}
          </span>
        </div>

        <div className="client-progress-section">
          <div className="client-progress-heading">
            <span>Progresso da entrega</span>
            <strong>{activeDelivery.progress}%</strong>
          </div>

          <div
            className="client-progress-track"
            role="progressbar"
            aria-label="Progresso demonstrativo da entrega"
            aria-valuenow={activeDelivery.progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className={`client-progress-fill ${statusClass}`}
              style={{ width: `${activeDelivery.progress}%` }}
            />
          </div>

          <div className="client-route-summary">
            <div>
              <span className="client-route-dot origin" />
              <div>
                <small>ORIGEM</small>
                <strong>{activeDelivery.origin}</strong>
              </div>
            </div>

            <ArrowRight className="client-route-arrow" size={18} />

            <div>
              <span className="client-route-dot destination" />
              <div>
                <small>DESTINO</small>
                <strong>{activeDelivery.destination}</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="client-main-grid">
        <article className="client-panel client-map-panel">
          <div className="client-panel-header">
            <div>
              <h3>Mapa da entrega</h3>
              <p>Visualização do percurso demonstrativo.</p>
            </div>
            <span className="client-map-label">
              <MapPin size={14} />
              Posição ilustrativa
            </span>
          </div>

          <div className="client-map-container">
            <MapContainer
              center={activeDelivery.position}
              zoom={13}
              scrollWheelZoom
              className="client-leaflet-map"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                maxZoom={19}
              />

              <MapFocus position={activeDelivery.position} />

              <Polyline
                positions={activeDelivery.route}
                pathOptions={{
                  color: "#347de6",
                  weight: 4,
                  opacity: 0.82,
                  dashArray:
                    activeDelivery.status === "Em preparação"
                      ? "7 7"
                      : undefined,
                }}
              />

              <CircleMarker
                center={activeDelivery.originPosition}
                radius={7}
                pathOptions={{
                  color: "#fff",
                  weight: 3,
                  fillColor: "#347de6",
                  fillOpacity: 1,
                }}
              >
                <Popup>Origem demonstrativa</Popup>
              </CircleMarker>

              <CircleMarker
                center={activeDelivery.destinationPosition}
                radius={7}
                pathOptions={{
                  color: "#fff",
                  weight: 3,
                  fillColor: "#20a779",
                  fillOpacity: 1,
                }}
              >
                <Popup>Destino demonstrativo</Popup>
              </CircleMarker>

              <CircleMarker
                center={activeDelivery.position}
                radius={9}
                pathOptions={{
                  color: "#fff",
                  weight: 3,
                  fillColor: "#e39749",
                  fillOpacity: 1,
                }}
              >
                <Popup>
                  <strong>Posição de demonstração</strong>
                </Popup>
              </CircleMarker>
            </MapContainer>
          </div>

          <div className="client-map-footer">
            <span>
              <i className="client-legend-dot origin" />
              Origem
            </span>
            <span>
              <i className="client-legend-dot current" />
              Posição ilustrativa
            </span>
            <span>
              <i className="client-legend-dot destination" />
              Destino
            </span>
          </div>
        </article>

        <article className="client-panel client-timeline-panel">
          <div className="client-panel-header">
            <div>
              <h3>Etapas da entrega</h3>
              <p>Acompanhe o histórico do seu pedido.</p>
            </div>
          </div>

          <div className="client-timeline">
            {activeDelivery.timeline.map((event, index) => (
              <article
                className={`client-timeline-event ${event.state}`}
                key={`${activeDelivery.id}-${event.title}-${index}`}
              >
                <div className="client-timeline-marker">
                  <span>
                    {event.state === "done" ? (
                      <Check size={13} />
                    ) : event.state === "current" ? (
                      <Truck size={13} />
                    ) : (
                      <Clock3 size={13} />
                    )}
                  </span>
                  {index < activeDelivery.timeline.length - 1 && <i />}
                </div>

                <div className="client-timeline-content">
                  <div className="client-timeline-title">
                    <strong>{event.title}</strong>
                    <time>{event.time}</time>
                  </div>
                  <p>{event.description}</p>
                </div>
              </article>
            ))}
          </div>
        </article>
      </section>

      <section className="client-info-grid">
        <article className="client-info-card">
          <div className="client-info-icon blue">
            <Truck size={19} />
          </div>
          <div>
            <span>Previsão de entrega</span>
            <strong>{activeDelivery.expected}</strong>
            <small>Conforme os dados disponíveis na demonstração.</small>
          </div>
        </article>

        <article className="client-info-card">
          <div className="client-info-icon purple">
            <MapPin size={19} />
          </div>
          <div>
            <span>Última posição informada</span>
            <strong>{activeDelivery.location}</strong>
            <small>
              Última atualização: {activeDelivery.lastUpdate}
            </small>
          </div>
        </article>

        <article className="client-info-card">
          <div className="client-info-icon green">
            <Warehouse size={19} />
          </div>
          <div>
            <span>Origem da carga</span>
            <strong>{activeDelivery.origin}</strong>
            <small>Informação vinculada ao pedido demonstrativo.</small>
          </div>
        </article>
      </section>

      <footer className="client-footer">
        <div className="client-footer-brand">
          <PackageCheck size={18} />
          <strong>SIRC</strong>
        </div>
        <span>Desenvolvido pela equipe LogTrack</span>
        <span className="client-footer-demo">AMBIENTE DE DEMONSTRAÇÃO</span>
      </footer>
    </section>
  );
}
