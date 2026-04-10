import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Hr, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "dwello"
const APP_URL = "https://dwello-app.lovable.app"

interface NebenkostenabrechnungProps {
  objektAdresse?: string
  abrechnungsZeitraum?: string
  jahr?: string
  gesamtKosten?: string
  anteil?: string
  vorauszahlungen?: string
  ergebnis?: string
  istNachzahlung?: boolean
}

const NebenkostenabrechnungEmail = ({
  objektAdresse, abrechnungsZeitraum, jahr, gesamtKosten, anteil, vorauszahlungen, ergebnis, istNachzahlung,
}: NebenkostenabrechnungProps) => (
  <Html lang="de" dir="ltr">
    <Head />
    <Preview>Ihre Nebenkostenabrechnung {jahr || ''} – {objektAdresse || ''}</Preview>
    <Body style={main}>
      <Container style={card}>
        <div style={topBorder} />
        <div style={logoWrap}><span style={logo}>{SITE_NAME}</span></div>
        <Heading style={h1}>Nebenkostenabrechnung {abrechnungsZeitraum || jahr || ''}</Heading>
        <Text style={text}>
          Anbei finden Sie Ihre Nebenkostenabrechnung für {objektAdresse || 'Ihr Mietobjekt'}.
        </Text>
        <Section style={table}>
          <div style={row}><span style={label}>Gesamtkosten</span><span style={value}>{gesamtKosten ? `${gesamtKosten} €` : '–'}</span></div>
          <div style={row}><span style={label}>Ihr Anteil</span><span style={value}>{anteil ? `${anteil} €` : '–'}</span></div>
          <div style={row}><span style={label}>Vorauszahlungen</span><span style={value}>{vorauszahlungen ? `${vorauszahlungen} €` : '–'}</span></div>
          <div style={{ ...row, borderBottom: 'none' }}>
            <span style={{ ...label, fontWeight: '700' }}>Ergebnis</span>
            <span style={{ ...value, fontWeight: '700', color: istNachzahlung ? '#dc2626' : '#2D5A3D' }}>
              {istNachzahlung ? 'Nachzahlung' : 'Guthaben'}: {ergebnis ? `${ergebnis} €` : '–'}
            </span>
          </div>
        </Section>
        <Text style={text}>
          Die vollständige Abrechnung können Sie in Ihrem dwello-Konto einsehen.
        </Text>
        <Button style={button} href={`${APP_URL}/nebenkostenabrechnung`}>
          In dwello öffnen
        </Button>
        <Hr style={hr} />
        <Text style={footer}>{SITE_NAME} Immobilienverwaltung · dwello.de</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: NebenkostenabrechnungEmail,
  subject: (data: Record<string, any>) => `Ihre Nebenkostenabrechnung ${data.jahr || ''} – ${data.objektAdresse || ''}`,
  displayName: 'Nebenkostenabrechnung',
  previewData: {
    objektAdresse: 'Musterstraße 1, Whg. 3', abrechnungsZeitraum: '01.01.2025 – 31.12.2025',
    jahr: '2025', gesamtKosten: '3.240,00', anteil: '1.080,00', vorauszahlungen: '1.200,00',
    ergebnis: '120,00', istNachzahlung: false,
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#F5F3EF', fontFamily: "system-ui, -apple-system, sans-serif", padding: '40px 20px' }
const card = { backgroundColor: '#ffffff', maxWidth: '560px', margin: '0 auto', borderRadius: '8px', padding: '0 32px 32px', overflow: 'hidden' as const }
const topBorder = { height: '4px', backgroundColor: '#2D5A3D', margin: '0 -32px', marginBottom: '24px' }
const logoWrap = { textAlign: 'center' as const, margin: '24px 0 16px' }
const logo = { fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '24px', color: '#2D5A3D' }
const h1 = { fontSize: '20px', fontWeight: '700' as const, color: '#1A1814', margin: '0 0 16px' }
const text = { fontSize: '15px', color: '#1A1814', lineHeight: '1.7', margin: '0 0 20px' }
const table = { backgroundColor: '#F5F3EF', borderRadius: '8px', padding: '16px', margin: '0 0 20px' }
const row = { display: 'flex' as const, justifyContent: 'space-between' as const, padding: '8px 0', borderBottom: '1px solid #E0DBD3' }
const label = { fontSize: '14px', color: '#7A7570' }
const value = { fontSize: '14px', color: '#1A1814', fontWeight: '500' as const }
const button = { backgroundColor: '#2D5A3D', color: '#ffffff', padding: '12px 24px', borderRadius: '8px', fontSize: '15px', fontWeight: '600' as const, textDecoration: 'none', display: 'inline-block' as const }
const hr = { borderColor: '#E0DBD3', margin: '28px 0 16px' }
const footer = { fontSize: '12px', color: '#7A7570', textAlign: 'center' as const, margin: '0' }
