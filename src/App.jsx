import Relatorios from "./pages/Relatorios";
import Clientes from "./pages/Clientes";
import Transportes from "./pages/transportes";
import Rastreamento from "./pages/rastreamento";
import Estoque from "./pages/Estoque";
import { useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  Boxes,
  CalendarDays,
  ChartNoAxesCombined,
  ChevronRight,
  CircleHelp,
  Clock3,
  LayoutDashboard,
  MapPin,
  MapPinned,
  Package,
  PackageCheck,
  Plus,
  Route,
  Search,
  Settings,
  Truck,
  Users,
  Warehouse,
} from "lucide-react";
import "./App.css";

const navigation = [
  { id: "dashboard", label: "Visão geral", icon: LayoutDashboard },
  { id: "estoque", label: "Estoque", icon: Boxes },
  { id: "rastreamento", label: "Rastreamento", icon: MapPinned },
  { id: "transportes", label: "Transportes", icon: Truck },
  { id: "clientes", label: "Clientes", icon: Users },
  { id: "relatorios", label: "Relatórios", icon: ChartNoAxesCombined },
];

const movements = [
  {
    id: 1,
    title: "Entrada de mercadoria",
    description: "Lote LT-2048 • Armazém principal",
    time: "14:32",
    category: "Entrada",
    icon: PackageCheck,
    color: "blue",
  },
  {
    id: 2,
    title: "Carga em transporte",
    description: "TR-008 • Destino: Teresina, PI",
    time: "14:18",
    category: "Transporte",
    icon: Truck,
    color: "purple",
  },
  {
    id: 3,
    title: "Leitura de etiqueta",
    description: "Identificação RFID • Lote LT-2045",
    time: "13:54",
    category: "RFID",
    icon: Boxes,
    color: "orange",
  },
  {
    id: 4,
    title: "Entrega atualizada",
    description: "Pedido PD-1032 • Em trânsito",
    time: "13:20",
    category: "Entrega",
    icon: Route,
    color: "green",
  },
];

const metrics = [
  {
    label: "Itens em estoque",
    value: "2.480",
    variation: "+8,2%",
    description: "em relação ao mês anterior",
    icon: Boxes,
    color: "blue",
    direction: "up",
  },
  {
    label: "Cargas em trânsito",
    value: "24",
    variation: "+4",
    description: "comparado à semana anterior",
    icon: Truck,
    color: "purple",
    direction: "up",
  },
  {
    label: "Entregas concluídas",
    value: "156",
    variation: "+12,5%",
    description: "em relação ao mês anterior",
    icon: PackageCheck,
    color: "green",
    direction: "up",
  },
  {
    label: "Pendências",
    value: "03",
    variation: "-2",
    description: "em relação à semana anterior",
    icon: Activity,
    color: "orange",
    direction: "down",
  },
];

const weekdays = [
  { day: "Seg", height: 42 },
  { day: "Ter", height: 62 },
  { day: "Qua", height: 48 },
  { day: "Qui", height: 78 },
  { day: "Sex", height: 56 },
  { day: "Sáb", height: 88 },
  { day: "Dom", height: 34 },
];

export default function App() {
  const [activePage, setActivePage] = useState("dashboard");
  const [search, setSearch] = useState("");

  const currentPage = navigation.find(
    (item) => item.id === activePage
  );

  const filteredMovements = movements.filter((movement) =>
    `${movement.title} ${movement.description} ${movement.category}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const formattedDate = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          

<div className="brand">
  <img
    src="/sirc-logo.jpg"
    alt="SIRC — Gestão Logística"
    className="brand-logo"
  />
</div>


          <div className="brand-copy">
            <h1>SIRC</h1>
            <span>GESTÃO LOGÍSTICA</span>
          </div>
        </div>

        <div className="sidebar-label">MENU PRINCIPAL</div>

        <nav className="navigation">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;

            return (
              <button
                key={item.id}
                className={`nav-item ${isActive ? "active" : ""}`}
                onClick={() => setActivePage(item.id)}
              >
                <Icon size={19} />
                <span>{item.label}</span>

                {item.id === "estoque" && (
                  <span className="nav-count">3</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-spacer" />

        <div className="sidebar-help">
          <div className="help-icon">
            <CircleHelp size={20} />
          </div>

          <div>
            <strong>Precisa de ajuda?</strong>
            <p>Consulte as informações do sistema.</p>
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="team-avatar">LT</div>
          <div className="team-info">
            <strong>LogTrack</strong>
            <span>Equipe responsável</span>
          </div>
          <Settings size={18} className="settings-icon" />
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb">
            <span>SIRC</span>
            <ChevronRight size={15} />
            <strong>{currentPage?.label}</strong>
          </div>

          <div className="topbar-actions">
            <label className="search-box">
              <Search size={18} />
              <input
                type="search"
                placeholder="Buscar movimentações..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Buscar movimentações"
              />
              <kbd> / </kbd>
            </label>

            <button
              className="icon-button notification-button"
              aria-label="Notificações"
              title="Notificações"
            >
              <Bell size={19} />
              <span className="notification-dot" />
            </button>

            <div className="topbar-avatar">LT</div>
          </div>
        </header>

        {activePage === "dashboard" ? (
          <div className="dashboard-content">
            <section className="welcome-section">
              <div>
                <div className="eyebrow">
                  <span className="status-dot" />
                  PAINEL OPERACIONAL
                </div>

                <h2>Visão geral</h2>
                <p>
                  Acompanhe o que acontece na sua operação logística.
                </p>
              </div>

              <div className="date-display">
                <CalendarDays size={18} />
                <span>{formattedDate}</span>
              </div>
            </section>

            <section className="metrics-grid">
              {metrics.map((metric) => {
                const Icon = metric.icon;
                const TrendIcon =
                  metric.direction === "up"
                    ? ArrowUpRight
                    : ArrowDownRight;

                return (
                  <article className="metric-card" key={metric.label}>
                    <div className="metric-top">
                      <div className={`metric-icon ${metric.color}`}>
                        <Icon size={21} />
                      </div>

                      <span className={`variation ${metric.color}`}>
                        <TrendIcon size={14} />
                        {metric.variation}
                      </span>
                    </div>

                    <div className="metric-value">{metric.value}</div>
                    <div className="metric-label">{metric.label}</div>
                    <p className="metric-description">
                      {metric.description}
                    </p>
                  </article>
                );
              })}
            </section>

            <section className="content-grid">
              <article className="panel movements-panel">
                <div className="panel-header">
                  <div>
                    <h3>Movimentações recentes</h3>
                    <p>Últimos eventos registrados na operação</p>
                  </div>

                  <button
                    className="text-button"
                    onClick={() => setActivePage("relatorios")}
                  >
                    Ver histórico <ChevronRight size={16} />
                  </button>
                </div>

                <div className="movement-list">
                  {filteredMovements.length > 0 ? (
                    filteredMovements.map((movement) => {
                      const Icon = movement.icon;

                      return (
                        <div
                          className="movement-item"
                          key={movement.id}
                        >
                          <div
                            className={`movement-icon ${movement.color}`}
                          >
                            <Icon size={19} />
                          </div>

                          <div className="movement-info">
                            <strong>{movement.title}</strong>
                            <span>{movement.description}</span>
                          </div>

                          <div className="movement-meta">
                            <span className="movement-category">
                              {movement.category}
                            </span>
                            <time>{movement.time}</time>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="empty-state">
                      Nenhuma movimentação corresponde à busca.
                    </div>
                  )}
                </div>

                <div className="panel-footer">
                  <Clock3 size={15} />
                  Dados ilustrativos para a primeira versão do SIRC.
                </div>
              </article>

              <article className="panel operations-panel">
                <div className="panel-header">
                  <div>
                    <h3>Resumo da operação</h3>
                    <p>Visão geral das atividades</p>
                  </div>

                  <button
                    className="icon-button small"
                    aria-label="Ver transportes"
                    onClick={() => setActivePage("transportes")}
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>

                <div className="operation-total">
                  <div>
                    <span>Total de entregas no período</span>
                    <strong>183</strong>
                  </div>
                  <span className="operation-badge">Esta semana</span>
                </div>

                <div className="chart-area">
                  <div className="chart-grid">
                    <span>100</span>
                    <span>75</span>
                    <span>50</span>
                    <span>25</span>
                  </div>

                  <div className="bar-chart">
                    {weekdays.map((item) => (
                      <div className="bar-column" key={item.day}>
                        <div className="bar-track">
                          <div
                            className={`bar-fill ${
                              item.day === "Sáb" ? "highlight" : ""
                            }`}
                            style={{ height: `${item.height}%` }}
                            title={`${item.day}: valor demonstrativo`}
                          />
                        </div>
                        <span>{item.day}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="chart-legend">
                  <span className="legend-dot" />
                  Entregas registradas
                  <span className="chart-note">Dados ilustrativos</span>
                </div>
              </article>
            </section>

            <section className="bottom-grid">
              <article className="quick-card">
                <div className="quick-card-icon blue">
                  <Warehouse size={21} />
                </div>
                <div className="quick-card-text">
                  <strong>Controle de estoque</strong>
                  <p>Consulte e gerencie os produtos armazenados.</p>
                  <button
                    onClick={() => setActivePage("estoque")}
                  >
                    Acessar estoque <ChevronRight size={15} />
                  </button>
                </div>
              </article>

              <article className="quick-card">
                <div className="quick-card-icon purple">
                  <MapPin size={21} />
                </div>
                <div className="quick-card-text">
                  <strong>Rastreamento de cargas</strong>
                  <p>Consulte o acompanhamento das entregas.</p>
                  <button
                    onClick={() => setActivePage("rastreamento")}
                  >
                    Acompanhar cargas <ChevronRight size={15} />
                  </button>
                </div>
              </article>

              <article className="quick-card">
                <div className="quick-card-icon green">
                  <Package size={21} />
                </div>
                <div className="quick-card-text">
                  <strong>Nova movimentação</strong>
                  <p>Prepare o controle de entradas e saídas.</p>
                  <button
                    onClick={() => setActivePage("estoque")}
                  >
                    Acessar módulo <Plus size={15} />
                  </button>
                </div>
              </article>
            </section>

            <footer className="dashboard-footer">
              <span>SIRC</span>
              <span>Desenvolvido pela equipe LogTrack</span>
              <span className="demo-label">VERSÃO DE DESENVOLVIMENTO</span>
            </footer>
          </div>
) : activePage === "estoque" ? (
  <Estoque />
) : activePage === "rastreamento" ? (
  <Rastreamento />
) : activePage === "transportes" ? (
  <Transportes />
) : activePage === "clientes" ? (
  <Clientes />
) : activePage === "relatorios" ? (
  <Relatorios />
) : (
  <section className="module-placeholder">
            <div className="placeholder-icon">
              {currentPage && (
                <currentPage.icon size={30} />
              )}
            </div>
            <span className="eyebrow">SIRC • MÓDULO</span>
            <h2>{currentPage?.label}</h2>
            <p>
              Estamos preparando esta área. Em breve, ela será integrada
              às funcionalidades do sistema.
            </p>
            <button
              className="primary-button"
              onClick={() => setActivePage("dashboard")}
            >
              <LayoutDashboard size={17} />
              Voltar à visão geral
            </button>
          </section>
        )}
      </main>
    </div>
  );
}
