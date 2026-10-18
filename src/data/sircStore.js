
import { useEffect, useState } from "react";

const STORAGE_KEY = "sirc-data-v1";
const CHANGE_EVENT = "sirc:data-change";

const initialData = {
  products: [
    {
      id: "SIRC-0001",
      name: "Caixa organizadora",
      category: "Armazenagem",
      quantity: 120,
      minimum: 30,
      location: "A-01-03",
    },
    {
      id: "SIRC-0002",
      name: "Leitor portátil RFID",
      category: "Equipamentos",
      quantity: 8,
      minimum: 5,
      location: "B-02-01",
    },
    {
      id: "SIRC-0003",
      name: "Etiqueta RFID UHF",
      category: "Identificação",
      quantity: 420,
      minimum: 100,
      location: "C-01-02",
    },
    {
      id: "SIRC-0004",
      name: "Bobina stretch",
      category: "Embalagem",
      quantity: 14,
      minimum: 20,
      location: "A-03-01",
    },
    {
      id: "SIRC-0005",
      name: "Palete plástico",
      category: "Armazenagem",
      quantity: 45,
      minimum: 15,
      location: "A-02-04",
    },
    {
      id: "SIRC-0006",
      name: "Caixa de papelão M",
      category: "Embalagem",
      quantity: 65,
      minimum: 25,
      location: "A-03-02",
    },
  ],
  movements: [],
  transports: [
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
          note: "Conferência demonstrativa antes da expedição.",
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
  ],
};

function cloneInitialData() {
  return JSON.parse(JSON.stringify(initialData));
}

function readSircData() {
  const fallback = cloneInitialData();

  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(fallback)
      );
      return fallback;
    }

    const parsed = JSON.parse(saved);

    return {
      ...fallback,
      ...parsed,
      products: Array.isArray(parsed.products)
        ? parsed.products
        : fallback.products,
      movements: Array.isArray(parsed.movements)
        ? parsed.movements
        : fallback.movements,
      transports: Array.isArray(parsed.transports)
        ? parsed.transports
        : fallback.transports,
    };
  } catch (error) {
    console.error("Erro ao ler os dados do SIRC:", error);
    return fallback;
  }
}

function updateSircData(updater) {
  const current = readSircData();
  const next =
    typeof updater === "function"
      ? updater(current)
      : updater;

  if (typeof window === "undefined") {
    return next;
  }

  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(next)
    );

    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch (error) {
    console.error("Erro ao salvar os dados do SIRC:", error);
  }

  return next;
}

function updateCollection(collectionName, value) {
  updateSircData((current) => ({
    ...current,
    [collectionName]:
      typeof value === "function"
        ? value(current[collectionName])
        : value,
  }));
}

export function useSircData() {
  const [data, setData] = useState(readSircData);

  useEffect(() => {
    const refresh = () => setData(readSircData());

    window.addEventListener(CHANGE_EVENT, refresh);
    window.addEventListener("storage", refresh);

    return () => {
      window.removeEventListener(CHANGE_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  return {
    products: data.products,
    movements: data.movements,
    transports: data.transports,

    setProducts: (value) =>
      updateCollection("products", value),

    setMovements: (value) =>
      updateCollection("movements", value),

    setTransports: (value) =>
      updateCollection("transports", value),
  };
}
