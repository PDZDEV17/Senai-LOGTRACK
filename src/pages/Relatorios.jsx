import { useSircData } from "../data/sircStore";
import { useState } from "react";
import {
  Activity,
  AlertTriangle,
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

function normalizeReportText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function parseReportDate(value) {
  if (value == null || value === "") return null;

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  const text = String(value).trim();

  // Reconhece datas no formato brasileiro: 19/10/2026, 14:30.
  const localDate = text.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:,?\s*(\d{1,2}):(\d{2}))?/
  );

  if (localDate) {
    const [, day, month, year, hour = "0", minute = "0"] =
      localDate;

    const timestamp = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute)
    ).getTime();

    return Number.isNaN(timestamp) ? null : timestamp;
  }

  const timestamp = Date.parse(text);
  return Number.isNaN(timestamp) ? null : timestamp;
}

function isReportDateInRange(value, startMs, endMs) {
  const timestamp = parseReportDate(value);

  // Não descarta registros que ainda não têm data cadastrada.
  return (
    timestamp === null ||
    (timestamp >= startMs && timestamp <= endMs)
  );
}

function formatReportDate(value) {
  const timestamp = parseReportDate(value);

  if (timestamp === null) {
    return String(value || "Data não informada");
  }

  return new Date(timestamp).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function getProductQuantity(product) {
  const rawQuantity =
    product?.quantity ??
    product?.stock ??
    product?.currentStock ??
    product?.currentQuantity ??
    product?.qty ??
    product?.amount ??
    product?.quantidade ??
    product?.estoque ??
    0;

  const quantity =
    typeof rawQuantity === "string"
      ? Number(rawQuantity.trim().replace(",", "."))
      : Number(rawQuantity);

  return Number.isFinite(quantity) ? quantity : 0;
}

function getProductMinimum(product) {
  const rawMinimum =
    product?.minimum ??
    product?.minStock ??
    product?.minimumStock ??
    product?.minQuantity ??
    product?.minimumQuantity ??
    product?.min ??
    product?.estoqueMinimo;

  if (rawMinimum == null || rawMinimum === "") {
    return null;
  }

  const minimum = Number(rawMinimum);

  return Number.isFinite(minimum) ? minimum : null;
}

function getTransportStatus(transport) {
  return normalizeReportText(transport?.status);
}

function getCompletionDate(transport) {
  const history = Array.isArray(transport?.history)
    ? transport.history
    : [];

  const completionEvent = history.find((event) => {
    const description = normalizeReportText(
      `${event.title || ""} ${event.note || ""}`
    );

    return (
      description.includes("entregue") ||
      description.includes("entrega concluida")
    );
  });

  return (
    parseReportDate(completionEvent?.date) ??
    parseReportDate(transport?.updatedAt)
  );
}

function buildReportChart(transports, days, startMs, endMs) {
  const bucketCount = days === 7 ? 7 : days === 30 ? 5 : 3;

  const chart = Array.from({ length: bucketCount }, (_, index) => {
    let label;

    if (days === 7) {
      const date = new Date(startMs);
      date.setDate(date.getDate() + index);

      label = date
        .toLocaleDateString("pt-BR", { weekday: "short" })
        .replace(".", "");
    } else if (days === 30) {
      label = `Sem. ${index + 1}`;
    } else {
      label = `Mês ${index + 1}`;
    }

    return { label, value: 0 };
  });

  const duration = endMs - startMs + 1;

  transports.forEach((transport) => {
    const timestamp = getCompletionDate(transport);

    if (
      timestamp === null ||
      timestamp < startMs ||
      timestamp > endMs
    ) {
      return;
    }

    const bucketIndex = Math.min(
      bucketCount - 1,
      Math.floor(((timestamp - startMs) / duration) * bucketCount)
    );

    chart[bucketIndex].value += 1;
  });

  return chart;
}

function downloadCsv(period, report, recentActivities) {
  const deliveryRate =
    report.total > 0
      ? ((report.delivered / report.total) * 100).toFixed(1)
      : "0.0";

  const rows = [
    ["SIRC - Relatório operacional"],
    ["Período", period],
    ["Origem dos dados", "Armazenamento local do SIRC"],
    [],
    ["Indicador", "Valor"],
    ["Total de transportes", report.total],
    ["Entregas concluídas", report.delivered],
    ["Taxa de conclusão (%)", deliveryRate],
    ["Cargas em trânsito", report.transit],
    ["Pendências", report.pending],
    ["Transportes cancelados", report.cancelled],
    ["Unidades em estoque", report.stockUnits],
    ["Produtos com estoque baixo", report.lowStock],
    [],
    [report.chartTitle],
    ["Intervalo", "Entregas concluídas"],
    ...report.chart.map((item) => [item.label, item.value]),
    [],
    ["Código", "Evento", "Categoria", "Data", "Status"],
    ...recentActivities.map((item) => [
      item.id,
      item.title,
      item.type,
      item.time,
      item.status,
    ]),
    [],
    [
      "Observação",
      "Valores calculados a partir dos dados disponíveis localmente no SIRC.",
    ],
  ];

  const escapeCell = (value) =>
    `"${String(value ?? "").replace(/"/g, '""')}"`;

  const csv =
    "\uFEFF" +
    rows.map((row) => row.map(escapeCell).join(";")).join("\r\n");

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
  const {
    products = [],
    movements = [],
    transports = [],
  } = useSircData();

  const [period, setPeriod] = useState("30 dias");

  const periodDays = Number.parseInt(period, 10) || 30;

  const now = new Date();

  const rangeStart = new Date(now);
  rangeStart.setHours(0, 0, 0, 0);
  rangeStart.setDate(rangeStart.getDate() - periodDays + 1);

  const rangeEnd = new Date(now);
  rangeEnd.setHours(23, 59, 59, 999);

  const startMs = rangeStart.getTime();
  const endMs = rangeEnd.getTime();

  // Seleciona transportes que tenham alguma atividade no período.
  const periodTransports = transports.filter((transport) => {
    const history = Array.isArray(transport.history)
      ? transport.history
      : [];

    const dates = [
      transport.updatedAt,
      ...history.map((event) => event.date),
    ];

    const timestamps = dates
      .map(parseReportDate)
      .filter((timestamp) => timestamp !== null);

    return (
      timestamps.length === 0 ||
      timestamps.some(
        (timestamp) => timestamp >= startMs && timestamp <= endMs
      )
    );
  });

  const total = periodTransports.length;

  const delivered = periodTransports.filter(
    (transport) => getTransportStatus(transport) === "entregue"
  ).length;

  const transit = periodTransports.filter(
    (transport) => getTransportStatus(transport) === "em transito"
  ).length;

  const cancelled = periodTransports.filter(
    (transport) => getTransportStatus(transport) === "cancelado"
  ).length;

  const pending = periodTransports.filter((transport) => {
    const status = getTransportStatus(transport);

    return !["entregue", "em transito", "cancelado"].includes(status);
  }).length;

  // Estoque representa a posição atual, independentemente do período.
  const stockUnits = products.reduce(
    (totalQuantity, product) =>
      totalQuantity + getProductQuantity(product),
    0
  );

  // Só considera estoque baixo quando existe um mínimo configurado.
  const lowStock = products.filter((product) => {
    const minimum = getProductMinimum(product);

    return (
      minimum !== null &&
      getProductQuantity(product) <= minimum
    );
  }).length;

  const chart = buildReportChart(
    periodTransports.filter(
      (transport) => getTransportStatus(transport) === "entregue"
    ),
    periodDays,
    startMs,
    endMs
  );

  const report = {
    total,
    delivered,
    transit,
    pending,
    cancelled,
    stockUnits,
    lowStock,
    chartTitle:
      periodDays === 7
        ? "Entregas concluídas por dia"
        : periodDays === 30
          ? "Entregas concluídas por semana"
          : "Entregas concluídas por mês",
    chart,
  };

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
      label: "Total de transportes",
      value: report.total.toLocaleString("pt-BR"),
      description: `Transportes com atividade nos últimos ${period}`,
      icon: PackageCheck,
      color: "blue",
    },
    {
      label: "Taxa de conclusão",
      value: `${deliveryRate.toFixed(1).replace(".", ",")}%`,
      description: "Entregues / total de transportes no período",
      icon: TrendingUp,
      color: "green",
    },
    {
      label: "Cargas em trânsito",
      value: report.transit.toLocaleString("pt-BR"),
      description: "Transportes atualmente em trânsito",
      icon: Truck,
      color: "purple",
    },
    {
      label: "Pendências",
      value: report.pending.toLocaleString("pt-BR"),
      description: "Transportes ainda não concluídos ou cancelados",
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
    {
      label: "Cancelados",
      value: report.cancelled,
      color: "purple",
    },
  ];

  // Atividades provenientes das movimentações de estoque.
  const stockActivities = movements
    .map((movement, index) => {
      const rawType = normalizeReportText(
        movement.type ||
        movement.action ||
        movement.movementType ||
        movement.category
      );

      const isExit =
        rawType.includes("saida") || rawType.includes("exit");

      const isEntry =
        rawType.includes("entrada") || rawType.includes("entry");

      const productName =
        movement.productName ||
        movement.itemName ||
        (typeof movement.product === "string"
          ? movement.product
          : movement.product?.name) ||
        movement.name;

      const quantity =
        movement.quantity ??
        movement.amount ??
        movement.qty;

      const rawDate =
        movement.date ||
        movement.createdAt ||
        movement.timestamp ||
        movement.time ||
        movement.updatedAt;

      const description =
        movement.description ||
        [
          productName,
          quantity != null ? `Quantidade: ${quantity}` : null,
        ]
          .filter(Boolean)
          .join(" • ") ||
        "Movimentação registrada no estoque.";

      return {
        id: movement.id ?? `estoque-${index}`,
        title:
          movement.title ||
          (isExit
            ? "Saída de mercadoria"
            : isEntry
              ? "Entrada de mercadoria"
              : "Movimentação de estoque"),
        type: "Estoque",
        rawDate,
        time: formatReportDate(rawDate),
        status: movement.status || "Registrado",
        color: isExit ? "orange" : "purple",
        description,
        sortValue: parseReportDate(rawDate) ?? 0,
      };
    })
    .filter((activity) =>
      isReportDateInRange(activity.rawDate, startMs, endMs)
    );

  // Atividades geradas pelo histórico dos transportes.
  const transportActivities = periodTransports.flatMap((transport) => {
    const history =
      Array.isArray(transport.history) && transport.history.length > 0
        ? transport.history
        : [
            {
              id: `${transport.id}-atual`,
              title: `Status atual: ${transport.status || "Não informado"}`,
              date: transport.updatedAt,
              note: transport.load || "",
            },
          ];

    return history
      .filter((event) =>
        isReportDateInRange(
          event.date || transport.updatedAt,
          startMs,
          endMs
        )
      )
      .map((event, index) => {
        const rawDate = event.date || transport.updatedAt;

        const title = event.title || "Atualização do transporte";

        const isDelivered = normalizeReportText(title).includes("entregue");

        return {
          id: event.id ?? `${transport.id}-evento-${index}`,
          title,
          type: "Transporte",
          rawDate,
          time: formatReportDate(rawDate),
          status: transport.status || "Registrado",
          color: isDelivered ? "green" : "blue",
          description: [
            transport.id,
            transport.load,
            event.note,
          ]
            .filter(Boolean)
            .join(" • "),
          sortValue: parseReportDate(rawDate) ?? 0,
        };
      });
  });

  const recentActivities = [
    ...stockActivities,
    ...transportActivities,
  ]
    .sort((a, b) => b.sortValue - a.sortValue)
    .slice(0, 10);

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
              {["7 dias", "30 dias", "90 dias"].map((item) => (
                <option value={item} key={item}>
                  Últimos {item}
                </option>
              ))}
            </select>
          </label>

          <button
            className="reports-export-button"
            onClick={() => downloadCsv(period, report, recentActivities)}
          >
            <Download size={17} />
            Exportar CSV
          </button>
        </div>
      </header>

    <div className="reports-demo-notice">
      <Activity size={17} />

      <div>
        <strong>Relatório baseado nos dados do SIRC</strong>

        <span>
          Os indicadores utilizam os transportes, produtos e movimentações
          disponíveis no armazenamento local. O histórico depende dos eventos
          registrados no sistema.
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
              Dados calculados dos transportes disponíveis
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
              Eventos registrados nas movimentações do estoque e nos históricos
              dos transportes.
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
                <th>Data do evento</th>
                <th>Status do registro</th>
              </tr>
            </thead>

            <tbody>
              {recentActivities.length > 0 ? (
                recentActivities.map((activity) => (
                  <tr key={activity.id}>
                      <td>
                        <span className="reports-id">
                          {activity.id}
                        </span>
                      </td>

                      <td>
                        <div className="reports-activity-name">
                          <span
                            className={`reports-activity-icon ${activity.color}`}
                          >
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
                  ))
                ) : (
                  <tr>
                    <td colSpan={5}>
                      Nenhuma atividade registrada neste período.
                    </td>
                  </tr>
                )}
              </tbody>
          </table>
        </div>

        <footer className="reports-table-footer">
          <FileSpreadsheet size={16} />

          <span>
            O CSV contém os indicadores calculados e as atividades disponíveis
            no armazenamento local do SIRC.
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
