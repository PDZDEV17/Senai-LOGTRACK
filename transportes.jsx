
import { useSircData } from "../data/sircStore";
import { useState } from "react";
import {
  Activity,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  CircleDot,
  Clock3,
  MapPin,
  Package,
  Plus,
  Route,
  Search,
  Truck,
  X,
} from "lucide-react";
import "./transportes.css";

const initialTransports = [
  {
    id: "TRP-1024",
    load: "LT-2048 — Materiais de armazenagem",
    vehicle: "TR-008",
    origin: "Armazém principal",
    destination: "Centro de Distribuição, Teresina - PI",
    status: "Em trânsito",
    departure: "16/10/2026, 09:15",
    expected: "16/10/2026, 17:30",
    updatedAt: "16/10/2026, 14:32",
    history: [
      {
        id: "evt-1",
        title: "Transporte iniciado",
        date: "16/10/2026, 09:15",
        note: "Evento demonstrativo de saída.",
      },
      {
        id: "evt-2",
        title: "Carga preparada",
        date: "16/10/2026, 08:50",
        note: "Conferência ilustrativa antes da expedição.",
      },
    ],
  },
  {
    id: "TRP-1025",
    load: "LT-2051 — Equipamentos",
    vehicle: "TR-014",
    origin: "Armazém principal",
    destination: "Zona Sul, Teresina - PI",
    status: "Parado",
    departure: "16/10/2026, 10:20",
    expected: "16/10/2026, 16:00",
    updatedAt: "16/10/2026, 14:18",
    history: [
      {
        id: "evt-3",
        title: "Veículo parado",
        date: "16/10/2026, 14:18",
        note: "Status demonstrativo, sem confirmação por GPS.",
      },
      {
        id: "evt-4",
        title: "Transporte iniciado",
        date: "16/10/2026, 10:20",
        note: "Evento demonstrativo de saída.",
      },
    ],
  },
  {
    id: "TRP-1026",
    load: "LT-2057 — Embalagens",
    vehicle: "TR-021",
    origin: "Armazém principal",
    destination: "Zona Norte, Teresina - PI",
    status: "Planejado",
    departure: "Ainda não iniciado",
    expected: "16/10/2026, 18:00",
    updatedAt: "16/10/2026, 08:45",
    history: [
      {
        id: "evt-5",
        title: "Transporte planejado",
        date: "16/10/2026, 08:45",
        note: "Registro demonstrativo de planejamento.",
      },
    ],
  },
];

const statuses = [
  "Planejado",
  "Preparando carga",
  "Em trânsito",
  "Parado",
  "Entregue",
  "Cancelado",
];

const statusClass = {
  Planejado: "planned",
  "Preparando carga": "preparing",
  "Em trânsito": "moving",
  Parado: "stopped",
  Entregue: "delivered",
  Cancelado: "cancelled",
};


const emptyForm = {
  load: "",
  vehicle: "",
  origin: "Armazém principal",
  destination: "",
  expectedDate: "",
  expectedTime: "",
};


function getTimestamp() {
  return new Date().toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function formatDateTime(value) {
  if (!value) return "Não informada";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default function Transportes() {
  const { transports, setTransports } = useSircData();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [historyId, setHistoryId] = useState(null);

  const inTransit = transports.filter(
    (transport) => transport.status === "Em trânsito"
  ).length;

  const pending = transports.filter((transport) =>
    ["Planejado", "Preparando carga"].includes(transport.status)
  ).length;

  const delivered = transports.filter(
    (transport) => transport.status === "Entregue"
  ).length;

  const filteredTransports = transports.filter((transport) => {
    const searchableText = [
      transport.id,
      transport.load,
      transport.vehicle,
      transport.origin,
      transport.destination,
      transport.status,
    ]
      .join(" ")
      .toLowerCase();

    return (
      searchableText.includes(search.toLowerCase()) &&
      (statusFilter === "Todos" || transport.status === statusFilter)
    );
  });

  const selectedHistory = transports.find(
    (transport) => transport.id === historyId
  );

  function handleFormChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function createTransport(event) {
    event.preventDefault();

    const now = getTimestamp();
    const id = `TRP-${String(Date.now()).slice(-6)}`;

    const newTransport = {
      id,
      load: form.load.trim(),
      vehicle: form.vehicle.trim().toUpperCase(),
      origin: form.origin.trim(),
      destination: form.destination.trim(),
      status: "Planejado",
      departure: "Ainda não iniciado",
      expected: formatDateTime(
  `${form.expectedDate}T${form.expectedTime}`
),
      updatedAt: now,
      history: [
        {
          id: `evt-${Date.now()}`,
          title: "Transporte planejado",
          date: now,
          note: "Registro criado manualmente no SIRC.",
        },
      ],
    };

    setTransports((current) => [newTransport, ...current]);
    setForm(emptyForm);
    setShowForm(false);
    setSearch("");
    setStatusFilter("Todos");
  }

  function updateStatus(transportId, newStatus) {
    const now = getTimestamp();
    const eventId = `evt-${Date.now()}`;

    setTransports((current) =>
      current.map((transport) => {
        if (transport.id !== transportId) return transport;
        if (transport.status === newStatus) return transport;

        const eventTitle = `Status atualizado: ${newStatus}`;

        return {
          ...transport,
          status: newStatus,
          departure:
            newStatus === "Em trânsito" &&
            transport.departure === "Ainda não iniciado"
              ? now
              : transport.departure,
          updatedAt: now,
          history: [
            {
              id: eventId,
              title: eventTitle,
              date: now,
              note: "Atualização manual de status no painel.",
            },
            ...transport.history,
          ],
        };
      })
    );
  }

  return (
    <section className="transport-page">
      <header className="transport-header">
        <div>
          <span className="transport-eyebrow">OPERAÇÃO LOGÍSTICA</span>
          <h2>Transportes</h2>
          <p>
            Gerencie cargas, veículos, destinos e etapas do transporte.
          </p>
        </div>

        <button
          className="transport-primary-button"
          onClick={() => setShowForm(true)}
        >
          <Plus size={18} />
          Novo transporte
        </button>
      </header>

      <section className="transport-metrics">
        <article className="transport-metric-card">
          <div className="transport-metric-icon blue">
            <Truck size={21} />
          </div>
          <div>
            <span>Total de transportes</span>
            <strong>{transports.length}</strong>
            <small>Registros no sistema</small>
          </div>
        </article>

        <article className="transport-metric-card">
          <div className="transport-metric-icon green">
            <Route size={21} />
          </div>
          <div>
            <span>Em trânsito</span>
            <strong>{inTransit}</strong>
            <small>Status atual dos transportes</small>
          </div>
        </article>

        <article className="transport-metric-card">
          <div className="transport-metric-icon orange">
            <Clock3 size={21} />
          </div>
          <div>
            <span>Pendentes de saída</span>
            <strong>{pending}</strong>
            <small>Planejados ou em preparação</small>
          </div>
        </article>

        <article className="transport-metric-card">
          <div className="transport-metric-icon purple">
            <CheckCircle2 size={21} />
          </div>
          <div>
            <span>Entregues</span>
            <strong>{delivered}</strong>
            <small>Marcados como concluídos</small>
          </div>
        </article>
      </section>

      <section className="transport-panel">
        <div className="transport-panel-heading">
          <div>
            <h3>Controle de transportes</h3>
            <p>
              Consulte viagens e atualize os status operacionais.
            </p>
          </div>
          <span className="transport-record-count">
            {filteredTransports.length} registros
          </span>
        </div>

        <div className="transport-filters">
          <label className="transport-search">
            <Search size={18} />
            <input
              type="search"
              placeholder="Buscar carga, veículo, rota ou código..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Buscar transportes"
            />
          </label>

          <label className="transport-status-filter">
            <span>Status</span>
            <span className="transport-select-wrap">
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                aria-label="Filtrar transportes por status"
              >
                <option>Todos</option>
                {statuses.map((status) => (
                  <option value={status} key={status}>
                    {status}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} />
            </span>
          </label>
        </div>

        <div className="transport-table-scroll">
          <table className="transport-table">
            <thead>
              <tr>
                <th>Transporte / carga</th>
                <th>Origem e destino</th>
                <th>Veículo</th>
                <th>Status</th>
                <th>Previsão de chegada</th>
                <th>Histórico</th>
              </tr>
            </thead>

            <tbody>
              {filteredTransports.map((transport) => (
                <tr key={transport.id}>
                  <td>
                    <div className="transport-identification">
                      <div className="transport-row-icon">
                        <Package size={18} />
                      </div>
                      <div>
                        <strong>{transport.id}</strong>
                        <span>{transport.load}</span>
                      </div>
                    </div>
                  </td>

                  <td>
                    <div className="transport-route-cell">
                      <span>
                        <CircleDot size={12} />
                        {transport.origin}
                      </span>
                      <ArrowRight size={13} className="route-arrow" />
                      <span>
                        <MapPin size={12} />
                        {transport.destination}
                      </span>
                    </div>
                  </td>

                  <td>
                    <span className="transport-vehicle">
                      <Truck size={15} />
                      {transport.vehicle}
                    </span>
                  </td>

                  <td>
                    <label className="transport-status-control">
                      <span
                        className={`transport-status-dot ${statusClass[transport.status]}`}
                      />
                      <select
                        value={transport.status}
                        onChange={(event) =>
                          updateStatus(transport.id, event.target.value)
                        }
                        aria-label={`Alterar status de ${transport.id}`}
                      >
                        {statuses.map((status) => (
                          <option value={status} key={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={13} />
                    </label>
                  </td>

                  <td>
                    <div className="transport-date-cell">
                      <CalendarClock size={15} />
                      <span>{transport.expected}</span>
                    </div>
                  </td>

                  <td>
                    <button
                      className="transport-history-button"
                      onClick={() => setHistoryId(transport.id)}
                    >
                      Histórico <ArrowRight size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredTransports.length === 0 && (
            <div className="transport-empty">
              <Search size={26} />
              <strong>Nenhum transporte encontrado</strong>
              <p>Altere os filtros ou tente buscar por outro termo.</p>
              <button
                onClick={() => {
                  setSearch("");
                  setStatusFilter("Todos");
                }}
              >
                Limpar filtros
              </button>
            </div>
          )}
        </div>

        <footer className="transport-panel-footer">
          <Activity size={15} />
          Registros de demonstração: ainda sem sincronização com o backend.
        </footer>
      </section>

      <section className="transport-info">
        <div className="transport-info-icon">
          <Route size={21} />
        </div>
        <div>
          <strong>Da expedição à entrega</strong>
          <p>
            Cada transporte possui origem, destino, veículo, previsão de
            chegada e histórico de alterações de status. A localização real
            será integrada posteriormente ao módulo de rastreamento.
          </p>
        </div>
      </section>

      {showForm && (
        <div
          className="transport-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowForm(false);
            }
          }}
        >
          <section
            className="transport-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="transport-modal-title"
          >
            <header className="transport-modal-header">
              <div>
                <span className="transport-eyebrow">
                  CADASTRO OPERACIONAL
                </span>
                <h3 id="transport-modal-title">Novo transporte</h3>
                <p>Preencha os dados básicos da viagem.</p>
              </div>

              <button
                className="transport-close-button"
                type="button"
                onClick={() => setShowForm(false)}
                aria-label="Fechar formulário"
              >
                <X size={19} />
              </button>
            </header>

            <form
              className="transport-form"
              onSubmit={createTransport}
            >
              <label className="transport-field">
                Identificação da carga
                <input
                  name="load"
                  value={form.load}
                  onChange={handleFormChange}
                  maxLength={120}
                  placeholder="Ex.: LT-2060 — Embalagens"
                  required
                />
              </label>

              <label className="transport-field">
                Identificação do veículo
                <input
                  name="vehicle"
                  value={form.vehicle}
                  onChange={handleFormChange}
                  maxLength={30}
                  placeholder="Ex.: TR-030"
                  required
                />
              </label>

              <label className="transport-field">
                Origem
                <input
                  name="origin"
                  value={form.origin}
                  onChange={handleFormChange}
                  maxLength={120}
                  required
                />
              </label>

              <label className="transport-field">
                Destino
                <input
                  name="destination"
                  value={form.destination}
                  onChange={handleFormChange}
                  maxLength={150}
                  placeholder="Ex.: Centro de distribuição"
                  required
                />
              </label>

                <div className="transport-date-time-fields">
                  <label className="transport-field">
                    Data de chegada
                    <input  
                      type="date"
                      name="expectedDate"
                      value={form.expectedDate}
                      onChange={handleFormChange}
                      required
                    />
                  </label>

                  <label className="transport-field">
                    Horário de chegada
                    <input
                      type="time"
                      name="expectedTime"
                      value={form.expectedTime}
                      onChange={handleFormChange}
                      required
                    />
                  </label>
                </div>

              <div className="transport-modal-note">
                <Activity size={16} />
                O transporte será criado com status Planejado. O registro não
                comprova que o veículo saiu nem que a carga foi expedida.
              </div>

              <div className="transport-modal-actions">
                <button
                  type="button"
                  className="transport-secondary-button"
                  onClick={() => {
                    setShowForm(false);
                    setForm(emptyForm);
                  }}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="transport-primary-button"
                >
                  <Plus size={17} />
                  Criar transporte
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {selectedHistory && (
        <div
          className="transport-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setHistoryId(null);
            }
          }}
        >
          <section
            className="transport-modal transport-history-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="transport-history-title"
          >
            <header className="transport-modal-header">
              <div>
                <span className="transport-eyebrow">
                  LINHA DO TEMPO
                </span>
                <h3 id="transport-history-title">
                  {selectedHistory.id}
                </h3>
                <p>{selectedHistory.load}</p>
              </div>

              <button
                className="transport-close-button"
                onClick={() => setHistoryId(null)}
                aria-label="Fechar histórico"
              >
                <X size={19} />
              </button>
            </header>

            <div className="transport-history-summary">
              <span>Status atual</span>
              <strong>{selectedHistory.status}</strong>
              <span>Última atualização: {selectedHistory.updatedAt}</span>
            </div>

            <div className="transport-timeline">
              {selectedHistory.history.map((event, index) => (
                <article className="transport-timeline-event" key={event.id}>
                  <div className="transport-timeline-marker">
                    <span />
                    {index < selectedHistory.history.length - 1 && (
                      <i />
                    )}
                  </div>

                  <div className="transport-timeline-content">
                    <strong>{event.title}</strong>
                    <time>{event.date}</time>
                    <p>{event.note}</p>
                  </div>
                </article>
              ))}
            </div>

            <div className="transport-modal-actions">
              <button
                className="transport-secondary-button"
                onClick={() => setHistoryId(null)}
              >
                Fechar histórico
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
