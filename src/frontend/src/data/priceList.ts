export type PriceTier = {
  minQty: number;
  maxQty: number | null; // null = no upper limit
  unitPrice: number | null; // null = "da concordare"
};

export type Accessory = {
  id: string;
  name: string;
  price: number;
  unit: "pz" | "km";
};

export type SubType = {
  id: string;
  name: string;
  tiers: PriceTier[];
};

export type Category = {
  id: string;
  name: string;
  subTypes?: SubType[];
  tiers?: PriceTier[];
  accessories: Accessory[];
  note?: string;
  quantityLabel?: string;
  isAssistenza?: boolean;
};

// ─── Shared accessory sets ─────────────────────────────────────────────────

const TRASFERTA: Accessory = {
  id: "trasferta",
  name: "Trasferta fuori zona (>30 km)",
  price: 0.7,
  unit: "km",
};

const BASCULANTI_ACCESSORIES: Accessory[] = [
  { id: "distrib", name: "Distribuzione basculanti", price: 15, unit: "pz" },
  {
    id: "smontaggio",
    name: "Smontaggio basculante esistente",
    price: 70,
    unit: "pz",
  },
  {
    id: "smaltimento",
    name: "Smaltimento basculante (solo acciaio)",
    price: 50,
    unit: "pz",
  },
  { id: "tubolare", name: "Posa tubolare", price: 20, unit: "pz" },
  { id: "veletta", name: "Posa veletta / sopraluce", price: 30, unit: "pz" },
  { id: "coprifili", name: "Posa coprifili", price: 10, unit: "pz" },
  { id: "supporto", name: "Supporto non debordante", price: 100, unit: "pz" },
  TRASFERTA,
];

const SEZIONALI_ACCESSORIES: Accessory[] = [
  { id: "distrib", name: "Distribuzione", price: 15, unit: "pz" },
  {
    id: "smontaggio",
    name: "Smontaggio basculante esistente",
    price: 70,
    unit: "pz",
  },
  {
    id: "smaltimento",
    name: "Smaltimento basculante esistente",
    price: 50,
    unit: "pz",
  },
  { id: "tubolare", name: "Posa tubolare", price: 20, unit: "pz" },
  { id: "veletta", name: "Posa veletta / sopraluce", price: 30, unit: "pz" },
  { id: "coprifili", name: "Posa coprifili", price: 10, unit: "pz" },
  {
    id: "cablaggio-centralina",
    name: "Cablaggio centralina",
    price: 30,
    unit: "pz",
  },
  {
    id: "cablaggio-lampeggiante",
    name: "Cablaggio lampeggiante",
    price: 30,
    unit: "pz",
  },
  {
    id: "fotocellule-parete",
    name: "Cablaggio fotocellule (centralina a parete)",
    price: 100,
    unit: "pz",
  },
  {
    id: "fotocellule-soffitto",
    name: "Cablaggio fotocellule (centralina a soffitto)",
    price: 120,
    unit: "pz",
  },
  { id: "telecody", name: "Cablaggio telecody", price: 10, unit: "pz" },
  {
    id: "guide-inclinate",
    name: "Supplemento guide inclinate",
    price: 30,
    unit: "pz",
  },
  TRASFERTA,
];

const PORTE_UNIVERSALI_ACCESSORIES: Accessory[] = [
  { id: "distrib", name: "Distribuzione", price: 11, unit: "pz" },
  {
    id: "smontaggio",
    name: "Smontaggio porta esistente",
    price: 60,
    unit: "pz",
  },
  { id: "tubolare", name: "Posa tubolare", price: 20, unit: "pz" },
  { id: "veletta", name: "Posa veletta / sopraluce", price: 20, unit: "pz" },
  { id: "coprifili", name: "Posa coprifili", price: 5, unit: "pz" },
  TRASFERTA,
];

const TAGLIAFUOCO_ACCESSORIES: Accessory[] = [
  { id: "chiudiporta", name: "Chiudiporta", price: 15, unit: "pz" },
  { id: "maniglione", name: "Maniglione antipanico", price: 15, unit: "pz" },
  { id: "guarnizione", name: "Guarnizione fumi freddi", price: 7, unit: "pz" },
  { id: "schiumatura", name: "Schiumatura", price: 22, unit: "pz" },
  {
    id: "dist-piani",
    name: "Distribuzione piani diversi",
    price: 20,
    unit: "pz",
  },
  {
    id: "dist-interrati",
    name: "Distribuzione interrati",
    price: 12,
    unit: "pz",
  },
  { id: "rimozione", name: "Rimozione porta", price: 60, unit: "pz" },
  { id: "tubolare", name: "Posa tubolare", price: 20, unit: "pz" },
  { id: "veletta", name: "Posa velletta / sopraluce", price: 20, unit: "pz" },
  { id: "siliconatura", name: "Siliconatura", price: 15, unit: "pz" },
  { id: "coprifili", name: "Posa coprifili", price: 5, unit: "pz" },
  TRASFERTA,
];

// ─── Categories ────────────────────────────────────────────────────────────

export const CATEGORIES: Category[] = [
  {
    id: "basc-401-500",
    name: "Basculanti 401–500",
    tiers: [
      { minQty: 1, maxQty: 2, unitPrice: 300 },
      { minQty: 3, maxQty: 5, unitPrice: 265 },
      { minQty: 6, maxQty: 10, unitPrice: 240 },
    ],
    accessories: BASCULANTI_ACCESSORIES,
  },
  {
    id: "basc-200-400",
    name: "Basculanti 200–400",
    tiers: [
      { minQty: 1, maxQty: 1, unitPrice: 200 },
      { minQty: 2, maxQty: 5, unitPrice: 170 },
      { minQty: 6, maxQty: 11, unitPrice: 115 },
      { minQty: 22, maxQty: null, unitPrice: null },
    ],
    accessories: BASCULANTI_ACCESSORIES,
  },
  {
    id: "sezionali",
    name: "Sezionali Iron / Iron Ten",
    subTypes: [
      {
        id: "sez-iron-le4000",
        name: "Iron – L ≤ 4000",
        tiers: [
          { minQty: 1, maxQty: 2, unitPrice: 380 },
          { minQty: 3, maxQty: 5, unitPrice: 360 },
        ],
      },
      {
        id: "sez-iron-gt4000",
        name: "Iron – L > 4000",
        tiers: [
          { minQty: 1, maxQty: 2, unitPrice: 425 },
          { minQty: 3, maxQty: 5, unitPrice: 420 },
        ],
      },
      {
        id: "sez-ironten-gt4000",
        name: "Iron Ten – L > 4000",
        tiers: [
          { minQty: 1, maxQty: 2, unitPrice: 450 },
          { minQty: 3, maxQty: 5, unitPrice: 408 },
        ],
      },
      {
        id: "sez-ironten-le4000",
        name: "Iron Ten – L ≤ 4000",
        tiers: [
          { minQty: 1, maxQty: 2, unitPrice: 485 },
          { minQty: 3, maxQty: 5, unitPrice: 460 },
        ],
      },
    ],
    accessories: SEZIONALI_ACCESSORIES,
    note: "Collegamento alla rete di casa sempre escluso.",
  },
  {
    id: "porte-univ",
    name: "Porte Universali",
    subTypes: [
      {
        id: "univ-1b",
        name: "Porta a 1 Battente",
        tiers: [
          { minQty: 1, maxQty: 2, unitPrice: 105 },
          { minQty: 3, maxQty: 5, unitPrice: 80 },
          { minQty: 6, maxQty: 10, unitPrice: 75 },
        ],
      },
      {
        id: "univ-2b",
        name: "Porta a 2 Battenti",
        tiers: [
          { minQty: 1, maxQty: 2, unitPrice: 130 },
          { minQty: 3, maxQty: 5, unitPrice: 115 },
          { minQty: 6, maxQty: 10, unitPrice: 110 },
        ],
      },
    ],
    accessories: PORTE_UNIVERSALI_ACCESSORIES,
  },
  {
    id: "porte-tf",
    name: "Porte Tagliafuoco",
    subTypes: [
      {
        id: "tf-1b",
        name: "1 Battente",
        tiers: [
          { minQty: 1, maxQty: 2, unitPrice: 120 },
          { minQty: 3, maxQty: 5, unitPrice: 70 },
          { minQty: 6, maxQty: 20, unitPrice: 55 },
        ],
      },
      {
        id: "tf-2b",
        name: "2 Battenti",
        tiers: [
          { minQty: 1, maxQty: 2, unitPrice: 130 },
          { minQty: 3, maxQty: 10, unitPrice: 80 },
          { minQty: 6, maxQty: 20, unitPrice: 65 },
        ],
      },
      {
        id: "tf-3b",
        name: "3 Battenti",
        tiers: [
          { minQty: 1, maxQty: 2, unitPrice: 140 },
          { minQty: 3, maxQty: 5, unitPrice: 90 },
          { minQty: 6, maxQty: 20, unitPrice: 75 },
        ],
      },
    ],
    accessories: TAGLIAFUOCO_ACCESSORIES,
  },
  {
    id: "assistenza",
    name: "Assistenza Tecnica",
    tiers: [],
    accessories: [],
    isAssistenza: true,
    note: "25€/ora per persona · 10€/ora viaggio per persona · 0,70€/km",
  },
];

export function getCategoryById(id: string): Category | undefined {
  return CATEGORIES.find((c) => c.id === id);
}

export function getActiveTier(
  tiers: PriceTier[],
  qty: number,
): PriceTier | null {
  return (
    tiers.find(
      (t) => qty >= t.minQty && (t.maxQty === null || qty <= t.maxQty),
    ) ?? null
  );
}

export function formatEur(n: number): string {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(n);
}

export function tierLabel(tier: PriceTier): string {
  const max = tier.maxQty === null ? "+" : `–${tier.maxQty}`;
  const priceStr =
    tier.unitPrice === null
      ? "da concordare"
      : `${formatEur(tier.unitPrice)}/pz`;
  return `${tier.minQty}${max} pz → ${priceStr}`;
}

/** Format decimal hours (e.g. 1.25) as "1h 15min" */
export function formatOre(ore: number): string {
  const h = Math.floor(ore);
  const min = Math.round((ore - h) * 60);
  if (h === 0) return `${min} min`;
  if (min === 0) return `${h}h`;
  return `${h}h ${min}min`;
}
