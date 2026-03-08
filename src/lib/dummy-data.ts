export interface Property {
  id: string;
  address: string;
  city: string;
  zipCode: string;
  yearBuilt: number;
  units: Unit[];
  image?: string;
}

export interface Unit {
  id: string;
  propertyId: string;
  number: string;
  size: number;
  rent: number;
  tenant?: Tenant;
  documents: Document[];
  damages: Damage[];
}

export interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  moveInDate: string;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  uploadedAt: string;
}

export interface Damage {
  id: string;
  title: string;
  description: string;
  category: "Heizung" | "Wasser" | "Elektrik" | "Sonstiges";
  status: "offen" | "in Bearbeitung" | "erledigt";
  reportedAt: string;
  reportedBy: string;
}

export interface Message {
  id: string;
  from: string;
  to: string;
  text: string;
  timestamp: string;
  read: boolean;
}

export interface MarketplaceListing {
  id: string;
  address: string;
  city: string;
  price: number;
  livingArea: number;
  rentYield: number;
  description: string;
  image?: string;
}

export const properties: Property[] = [
  {
    id: "p1",
    address: "Berliner Str. 42",
    city: "Berlin",
    zipCode: "10115",
    yearBuilt: 1998,
    units: [
      {
        id: "u1",
        propertyId: "p1",
        number: "1.OG Links",
        size: 65,
        rent: 780,
        tenant: { id: "t1", name: "Anna Müller", email: "anna@mail.de", phone: "+49 170 1234567", moveInDate: "2022-03-01" },
        documents: [
          { id: "d1", name: "Mietvertrag_Mueller.pdf", type: "Mietvertrag", uploadedAt: "2022-03-01" },
        ],
        damages: [
          { id: "dm1", title: "Heizung defekt", description: "Heizung im Wohnzimmer wird nicht warm", category: "Heizung", status: "offen", reportedAt: "2025-12-15", reportedBy: "Anna Müller" },
        ],
      },
      {
        id: "u2",
        propertyId: "p1",
        number: "2.OG Rechts",
        size: 82,
        rent: 950,
        tenant: { id: "t2", name: "Max Schmidt", email: "max@mail.de", phone: "+49 171 9876543", moveInDate: "2021-08-15" },
        documents: [
          { id: "d2", name: "Mietvertrag_Schmidt.pdf", type: "Mietvertrag", uploadedAt: "2021-08-15" },
          { id: "d3", name: "Rechnung_Sanitaer.pdf", type: "Rechnung", uploadedAt: "2024-05-20" },
        ],
        damages: [],
      },
      {
        id: "u3",
        propertyId: "p1",
        number: "EG Rechts",
        size: 55,
        rent: 620,
        documents: [],
        damages: [],
      },
    ],
  },
  {
    id: "p2",
    address: "Mozartstraße 15",
    city: "München",
    zipCode: "80336",
    yearBuilt: 2010,
    units: [
      {
        id: "u4",
        propertyId: "p2",
        number: "1.OG",
        size: 90,
        rent: 1400,
        tenant: { id: "t3", name: "Lisa Weber", email: "lisa@mail.de", phone: "+49 172 5554321", moveInDate: "2023-01-01" },
        documents: [
          { id: "d4", name: "Mietvertrag_Weber.pdf", type: "Mietvertrag", uploadedAt: "2023-01-01" },
        ],
        damages: [
          { id: "dm2", title: "Wasserhahn tropft", description: "Wasserhahn in der Küche tropft ständig", category: "Wasser", status: "in Bearbeitung", reportedAt: "2026-01-05", reportedBy: "Lisa Weber" },
        ],
      },
      {
        id: "u5",
        propertyId: "p2",
        number: "2.OG",
        size: 75,
        rent: 1200,
        tenant: { id: "t4", name: "Tom Fischer", email: "tom@mail.de", phone: "+49 173 6667890", moveInDate: "2024-06-01" },
        documents: [],
        damages: [],
      },
    ],
  },
  {
    id: "p3",
    address: "Hauptstraße 8",
    city: "Hamburg",
    zipCode: "20095",
    yearBuilt: 1985,
    units: [
      {
        id: "u6",
        propertyId: "p3",
        number: "1.OG",
        size: 70,
        rent: 850,
        tenant: { id: "t5", name: "Sarah Klein", email: "sarah@mail.de", phone: "+49 174 1112233", moveInDate: "2020-11-01" },
        documents: [],
        damages: [
          { id: "dm3", title: "Steckdose defekt", description: "Steckdose im Schlafzimmer funktioniert nicht", category: "Elektrik", status: "offen", reportedAt: "2026-02-20", reportedBy: "Sarah Klein" },
        ],
      },
    ],
  },
];

export const messages: Message[] = [
  { id: "m1", from: "Anna Müller", to: "Eigentümer", text: "Guten Tag, die Heizung im Wohnzimmer ist seit gestern kalt. Können Sie bitte einen Techniker schicken?", timestamp: "2025-12-15T10:30:00", read: true },
  { id: "m2", from: "Eigentümer", to: "Anna Müller", text: "Hallo Frau Müller, ich kümmere mich darum. Der Techniker kommt morgen zwischen 10 und 12 Uhr.", timestamp: "2025-12-15T11:00:00", read: true },
  { id: "m3", from: "Lisa Weber", to: "Eigentümer", text: "Hallo, wann wird der tropfende Wasserhahn repariert?", timestamp: "2026-01-06T09:15:00", read: false },
  { id: "m4", from: "Max Schmidt", to: "Eigentümer", text: "Die Nebenkostenabrechnung ist angekommen. Vielen Dank!", timestamp: "2026-02-01T14:20:00", read: true },
  { id: "m5", from: "Sarah Klein", to: "Eigentümer", text: "Die Steckdose im Schlafzimmer funktioniert seit heute Morgen nicht mehr.", timestamp: "2026-02-20T08:45:00", read: false },
];

export const marketplaceListings: MarketplaceListing[] = [
  {
    id: "ml1",
    address: "Schillerstraße 22",
    city: "Frankfurt",
    price: 420000,
    livingArea: 120,
    rentYield: 5.2,
    description: "Gepflegtes Mehrfamilienhaus mit 4 Wohneinheiten in zentraler Lage. Vollvermietet.",
  },
  {
    id: "ml2",
    address: "Goetheweg 5",
    city: "Düsseldorf",
    price: 285000,
    livingArea: 85,
    rentYield: 4.8,
    description: "Moderne 3-Zimmer-Wohnung als Kapitalanlage. Aktuell vermietet für 1.140€/Monat.",
  },
  {
    id: "ml3",
    address: "Am Marktplatz 11",
    city: "Leipzig",
    price: 195000,
    livingArea: 95,
    rentYield: 6.1,
    description: "Altbauwohnung mit Stuck und hohen Decken. Top Rendite in aufstrebendem Viertel.",
  },
  {
    id: "ml4",
    address: "Rosenweg 3",
    city: "Köln",
    price: 350000,
    livingArea: 110,
    rentYield: 4.5,
    description: "Neubau-Wohnung im beliebten Ehrenfeld. Energieeffizient und modern ausgestattet.",
  },
];

export const payments = properties.flatMap(p =>
  p.units.filter(u => u.tenant).map(u => ({
    id: `pay-${u.id}`,
    propertyAddress: p.address,
    unitNumber: u.number,
    tenantName: u.tenant!.name,
    amount: u.rent,
    dueDate: "2026-03-01",
    paid: Math.random() > 0.3,
  }))
);
