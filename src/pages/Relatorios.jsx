
import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Boxes,
  CalendarRange,
  CheckCircle2,
  Clock3,
  Download,
  FileSpreadsheet,
  PackageCheck,
  TrendingUp,
  Truck,
  Warehouse,
} from "lucide-react";
import "./Relatorios.css";

const reports = {
  "7 dias": {
    total: 52,
    delivered: 42,
    transit: 8,
    pending: 2,
    stockUnits: 2480,
    lowStock: 3,
    chartTitle: "Entregas concluídas por dia",
    chart: [
      { label: "Seg", value: 5 },
      { label: "Ter", value: 7 },
      { label: "Qua", value: 4 },
      { label: "Qui", value: 8 },
      { label: "Sex", value: 6 },
      { label: "Sáb", value: 7 },
      { label: "Dom", value: 5 },
    ],
  },
  "30 dias": {
    total: 183,
    delivered: 156,
    transit: 24,
    pending: 3,
    stockUnits: 2480,
    lowStock: 3,
    chartTitle: "Entregas concluídas por semana",
    chart: [
      { label: "Sem. 1", value: 32 },
      { label: "Sem. 2", value: 37 },
      { label: "Sem. 3", value: 41 },
      { label: "Sem. 4", value: 46 },
    ],
  },
  "90 dias": {
    total: 528,
    delivered: 468,
    transit: 24,
    pending: 36,
    stockUnits: 2480,
    lowStock: 3,
    chartTitle: "Entregas concluídas por mês",
    chart: [
      { label: "Mês 1", value: 142 },
      { label: "Mês 2", value: 158 },
      { label: "Mês 3", value: 168 },
    ],
  },
};

const recentActivities = [
  {
    id: "TRP-1024",
    title: "Transporte iniciado",
    type: "Transporte",
    time: "14:32",
    status: "Registrado",
    color: "blue",
  },
  {
    id: "SIRC-0003",
    title: "Leitura de etiqueta",
    type: "Estoque",
    time: "14:18",
    status: "Registrado",
    color: "purple",
  },
  {
    id: "TRP-1025",
    title: "Status atualizado",
    type: "Transporte",
    time: "13:54",
    status: "Registrado",
    color: "orange",
  },
  {
    id: "PED-1032",
    title: "Entrega atualizada",
    type: "Entrega",
    time: "13:20",
    status: "Registrado",
    color: "green",
  },
];

function downloadCsv(period, report) {
  const deliveryRate = ((report.delivered / report.total) * 100).toFixed(1);

  const rows = [
    ["SIRC - Relatório operacional"],
    ["Período", period],
    ["Dados", "Demonstrativos"],
    [],
    ["Indicador", "Valor"],
    ["Total de entregas", report.total],
    ["Entregas concluídas", report.delivered],
    ["Taxa de conclusão (%)", deliveryRate],
    ["Cargas em trânsito", report.transit],
    ["Pendências", report.pending],
    ["Unidades em estoque", report.stockUnits],
    ["Produtos com estoque baixo", report.lowStock],
    [],
    [report.chartTitle],
    ["Intervalo", "Entregas concluídas"],
    ...report.chart.map((item) => [item.label, item.value]),
    [],
    ["Código", "Evento", "Categoria", "Horário", "Registro"],
    ...recentActivities.map((item) => [
      item.id,
      item.title,
      item.type,
      item.time,
      item.status,
    ]),
    [],
    ["Observação", "Relatório ilustrativo; não representa dados reais do banco."],
  ];

  const escapeCell = (value) =>
    `"${String(value ?? "").replace(/"/g, '""')}"`;

  const csv = "\uFEFF" + rows
    .map((row) => row.map(escapeCell).join(";"))
    .join("\r\n");

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `sirc-relatorio-${period.replace(" ", "-")}.csv`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.URL.revokeObjectURL(url);
}

export default function Relatorios() {
  const [period, setPeriod] = useState("30 dias");
  const report = reports[period];

  const deliveryRate =
    report.total > 0
      ? (report.delivered / report.total) * 100
      : 0;

  const maximumValue = Math.max(
    ...report.chart.map((item) => item.value),
    1
  );

  const metrics = [
    {
      label: "Total de entregas",
      value: report.total.toLocaleString("pt-BR"),
      description: `Período: ${period}`,
      icon: PackageCheck,
      color: "blue",
    },
    {
      label: "Taxa de conclusão",
      value: `${deliveryRate.toFixed(1).replace(".", ",")}%`,
      description: "Entregas concluídas / total",
      icon: TrendingUp,
      color: "green",
    },
    {
      label: "Cargas em trânsito",
      value: report.transit.toLocaleString("pt-BR"),
      description: "Status demonstrativo",
      icon: Truck,
      color: "purple",
    },
    {
      label: "Pendências",
      value: report.pending.toLocaleString("pt-BR"),
      description: "Acompanhar no painel operacional",
      icon: AlertTriangle,
      color: "orange",
    },
  ];

  const statusBreakdown = [
    {
      label: "Entregues",
      value: report.delivered,
      color: "green",
    },
    {
      label: "Em trânsito",
      value: report.transit,
      color: "blue",
    },
    {
      label: "Pendentes",
      value: report.pending,
      color: "orange",
    },
  ];

  return (
    <section className="reports-page">
      <header className="reports-header">
        <div>
          <span className="reports-eyebrow">
            INDICADORES E DESEMPENHO
          </span>
          <h2>Relatórios</h2>
          <p>
            Acompanhe os resultados do estoque, dos transportes e das entregas.
          </p>
        </div>

        <div className="reports-header-actions">
          <label className="reports-period-control">
            <CalendarRange size={17} />
            <select
              value={period}
              onChange={(event) => setPeriod(event.target.value)}
              aria-label="Selecionar período do relatório"
            >
              {Object.keys(reports).map((item) => (
                <option value={item} key={item}>
                  Últimos {item}
                </option>
              ))}
            </select>
          </label>

          <button
            className="reports-export-button"
            onClick={() => downloadCsv(period, report)}
          >
            <Download size={17} />
            Exportar CSV
          </button>
        </div>
      </header>

      <div className="reports-demo-notice">
        <Activity size={17} />
        <div>
          <strong>Relatório demonstrativo</strong>
          <span>
            Os indicadores são fictícios e servem para testar a interface.
            Os dados reais serão obtidos pelo backend futuramente.
          </span>
        </div>
      </div>

      <section className="reports-metrics">
        {metrics.map((metric) => {
          const Icon = metric.icon;

          return (
            <article className="reports-metric-card" key={metric.label}>
              <div className="reports-metric-top">
                <div className={`reports-metric-icon ${metric.color}`}>
                  <Icon size={21} />
                </div>
                <span className="reports-metric-context">
                  {period}
                </span>
              </div>

              <strong className="reports-metric-value">
                {metric.value}
              </strong>

              <span className="reports-metric-label">
                {metric.label}
              </span>

              <small className="reports-metric-description">
                {metric.description}
              </small>
            </article>
          );
        })}
      </section>

      <section className="reports-main-grid">
        <article className="reports-panel">
          <header className="reports-panel-header">
            <div>
              <h3>{report.chartTitle}</h3>
              <p>
                Distribuição das entregas concluídas no período selecionado.
              </p>
            </div>

            <span className="reports-chart-badge">
              <TrendingUp size={14} />
              {report.delivered} entregas
            </span>
          </header>

          <div className="reports-chart-summary">
            <div>
              <span>Total concluído</span>
              <strong>{report.delivered}</strong>
            </div>
            <div>
              <span>Taxa de conclusão</span>
              <strong>
                {deliveryRate.toFixed(1).replace(".", ",")}%
              </strong>
            </div>
          </div>

          <div className="reports-chart">
            <div className="reports-chart-grid-lines">
              <i />
              <i />
              <i />
              <i />
            </div>

            <div className="reports-bar-list">
              {report.chart.map((item) => (
                <div className="reports-bar-column" key={item.label}>
                  <strong className="reports-bar-value">
                    {item.value}
                  </strong>

                  <div className="reports-bar-track">
                    <div
                      className="reports-bar-fill"
                      style={{
                        height: `${Math.max(
                          (item.value / maximumValue) * 100,
                          5
                        )}%`,
                      }}
                      title={`${item.value} entregas concluídas`}
                    />
                  </div>

                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <footer className="reports-chart-footer">
            <span className="reports-legend-dot" />
            Entregas concluídas
            <span className="reports-chart-caption">
              Valores ilustrativos
            </span>
          </footer>
        </article>

        <article className="reports-panel reports-status-panel">
          <header className="reports-panel-header">
            <div>
              <h3>Status das entregas</h3>
              <p>Distribuição por situação operacional.</p>
            </div>
          </header>

          <div className="reports-status-total">
            <div>
              <span>Total de registros</span>
              <strong>{report.total}</strong>
            </div>
            <span className="reports-period-badge">{period}</span>
          </div>

          <div className="reports-status-list">
            {statusBreakdown.map((item) => {
              const percentage =
                report.total > 0
                  ? (item.value / report.total) * 100
                  : 0;

              return (
                <div className="reports-status-item" key={item.label}>
                  <div className="reports-status-label-row">
                    <span className={`reports-status-dot ${item.color}`} />
                    <span className="reports-status-name">
                      {item.label}
                    </span>
                    <strong>{item.value}</strong>
                    <small>
                      {percentage.toFixed(1).replace(".", ",")}%
                    </small>
                  </div>

                  <div className="reports-status-track">
                    <div
                      className={`reports-status-fill ${item.color}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="reports-stock-summary">
            <div className="reports-stock-icon">
              <Boxes size={20} />
            </div>

            <div>
              <span>Unidades em estoque</span>
              <strong>
                {report.stockUnits.toLocaleString("pt-BR")}
              </strong>
            </div>

            <div className="reports-stock-alert">
              <AlertTriangle size={15} />
              <span>{report.lowStock} itens abaixo do mínimo</span>
            </div>
          </div>
        </article>
      </section>

      <section className="reports-panel reports-activity-panel">
        <header className="reports-panel-header">
          <div>
            <h3>Atividade operacional recente</h3>
            <p>
              Exemplos de eventos registrados nos módulos do SIRC.
            </p>
          </div>

          <span className="reports-record-count">
            {recentActivities.length} eventos
          </span>
        </header>

        <div className="reports-table-scroll">
          <table className="reports-table">
            <thead>
              <tr>
                <th>Identificação</th>
                <th>Evento</th>
                <th>Módulo</th>
                <th>Horário de exemplo</th>
                <th>Status do registro</th>
              </tr>
            </thead>

            <tbody>
              {recentActivities.map((activity) => (
                <tr key={activity.id}>
                  <td>
                    <span className="reports-id">{activity.id}</span>
                  </td>

                  <td>
                    <div className="reports-activity-name">
                      <span className={`reports-activity-icon ${activity.color}`}>
                        {activity.type === "Transporte" ? (
                          <Truck size={16} />
                        ) : activity.type === "Estoque" ? (
                          <Warehouse size={16} />
                        ) : (
                          <PackageCheck size={16} />
                        )}
                      </span>
                      <strong>{activity.title}</strong>
                    </div>
                  </td>

                  <td>{activity.type}</td>

                  <td>
                    <span className="reports-time">
                      <Clock3 size={14} />
                      {activity.time}
                    </span>
                  </td>

                  <td>
                    <span className="reports-recorded-status">
                      <CheckCircle2 size={14} />
                      {activity.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <footer className="reports-table-footer">
          <FileSpreadsheet size={16} />
          <span>
            A exportação CSV inclui os indicadores do período e os dados
            ilustrativos de atividade operacional.
          </span>
        </footer>
      </section>

      <footer className="reports-footer">
        <span>SIRC · Relatórios operacionais</span>
        <span>Desenvolvido pela equipe LogTrack</span>
        <span className="reports-demo-tag">AMBIENTE DE DESENVOLVIMENTO</span>
      </footer>
    </section>
  );
}
