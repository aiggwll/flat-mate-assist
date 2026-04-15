export const demoOwnerProperties = [
  {
    id: "demo-p1",
    address: "Musterstraße 12",
    city: "Berlin",
    zipCode: "10115",
    yearBuilt: 2002,
    units: 3,
  },
  {
    id: "demo-p2",
    address: "Hauptweg 5",
    city: "Hamburg",
    zipCode: "20095",
    yearBuilt: 1995,
    units: 1,
  },
];

export const demoOwnerPayments = [
  {
    id: "demo-pay1",
    tenant_name: "Max Mustermann",
    unit_id: "1. OG links",
    amount: 850,
    cold_rent: 650,
    nebenkosten: 200,
    warm_rent: 850,
    due_date: "2026-04-01",
    status: "bezahlt",
    paid_at: "2026-03-29",
    reminder_sent_at: null,
    user_id: "demo-owner",
  },
  {
    id: "demo-pay2",
    tenant_name: "Sabine Schneider",
    unit_id: "2. OG rechts",
    amount: 1100,
    cold_rent: 820,
    nebenkosten: 280,
    warm_rent: 1100,
    due_date: "2026-04-01",
    status: "ausstehend",
    paid_at: null,
    reminder_sent_at: null,
    user_id: "demo-owner",
  },
  {
    id: "demo-pay3",
    tenant_name: "Lukas Braun",
    unit_id: "EG",
    amount: 720,
    cold_rent: 550,
    nebenkosten: 170,
    warm_rent: 720,
    due_date: "2026-03-01",
    status: "überfällig",
    paid_at: null,
    reminder_sent_at: "2026-02-26T09:00:00Z",
    user_id: "demo-owner",
  },
];

export const demoTenantData = {
  property: {
    address: "Musterstraße 12",
    city: "Berlin",
    unit: "2. OG links",
  },
  landlordName: "Anna Müller",
  rent: {
    coldRent: 650,
    nebenkosten: 200,
    warmRent: 850,
  },
  payments: [
    { month: "April 2026", status: "ausstehend", amount: 850 },
    { month: "März 2026", status: "bezahlt", amount: 850 },
    { month: "Februar 2026", status: "bezahlt", amount: 850 },
    { month: "Januar 2026", status: "bezahlt", amount: 850 },
  ],
};

export const demoDocuments = [
  {
    id: "demo-doc1",
    filename: "Mietvertrag_Mustermann.pdf",
    category: "Mietvertrag",
    file_size: 245000,
    created_at: "2024-03-01T10:00:00Z",
  },
  {
    id: "demo-doc2",
    filename: "Nebenkostenabrechnung_2024.pdf",
    category: "Nebenkostenabrechnung",
    file_size: 182000,
    created_at: "2025-06-15T14:30:00Z",
  },
];
