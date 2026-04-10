import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Hr, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "dwello"
const APP_URL = "https://dwello-app.lovable.app"

interface ZahlungErinnerungProps {
  objektAdresse?: string
  betrag?: string
  faelligkeitsDatum?: string
  iban?: string
}

const ZahlungErinnerungEmail = ({ objektAdresse, betrag, faelligkeitsDatum, iban }: ZahlungErinnerungProps) => (
  <Html lang="de" dir="ltr">
    <Head />
    <Preview>Erinnerung: Miete fällig am {faelligkeitsDatum || ''}</Preview>
    <Body style={main}>
      <Container style={card}>
        <div style={topBorder} />
        <div style={logoWrap}><span style={logo}>{SITE_NAME}</span></div>
        <Heading style={h1}>Freundliche Zahlungserinnerung</Heading>
        <Text style={text}>
          Ihre Miete für {objektAdresse || 'Ihre Wohnung'} in Höhe von {betrag ? `${betrag} €` : '–'} ist am {faelligkeitsDatum || '–'} fällig.
        </Text>
        <Section style={table}>
          <div style={row}><span style={label}>Mietobjekt</span><span style={value}>{objektAdresse || '–'}</span></div>
          <div style={row}><span style={label}>Fälligkeitsdatum</span><span style={value}>{faelligkeitsDatum || '–'}</span></div>
          <div style={row}><span style={label}>Betrag</span><span style={value}>{betrag ? `${betrag} €` : '–'}</span></div>
          {iban && <div style={row}><span style={label}>IBAN</span><span style={value}>{iban}</span></div>}
        </Section>
        <Button style={button} href={APP_URL}>
          Zahlung bestätigen
        </Button>
        <Hr style={hr} />
        <Text style={footer}>{SITE_NAME} Immobilienverwaltung · dwello.de</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ZahlungErinnerungEmail,
  subject: (data: Record<string, any>) => `Erinnerung: Miete fällig am ${data.faelligkeitsDatum || ''}`,
  displayName: 'Zahlungserinnerung',
  previewData: { objektAdresse: 'Musterstraße 1, Whg. 3', betrag: '850,00', faelligkeitsDatum: '01.02.2026', iban: 'DE89 3704 0044 0532 0130 00' },
} satisfies TemplateEntry

const main = { backgroundColor: '#F5F3EF', fontFamily: "system-ui, -apple-system, sans-serif", padding: '40px 20px' }
const card = { backgroundColor: '#ffffff', maxWidth: '560px', margin: '0 auto', borderRadius: '8px', padding: '0 32px 32px', overflow: 'hidden' as const }
const topBorder = { height: '4px', backgroundColor: '#2D5A3D', margin: '0 -32px', marginBottom: '24px' }
const logoWrap = { textAlign: 'center' as const, margin: '24px 0 16px' }
const logo = { fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '24px', color: '#2D5A3D' }
const h1 = { fontSize: '20px', fontWeight: '700' as const, color: '#1A1814', margin: '0 0 16px' }
const text = { fontSize: '15px', color: '#1A1814', lineHeight: '1.7', margin: '0 0 20px' }
const table = { backgroundColor: '#F5F3EF', borderRadius: '8px', padding: '16px', margin: '0 0 20px' }
const row = { display: 'flex' as const, justifyContent: 'space-between' as const, padding: '6px 0', borderBottom: '1px solid #E0DBD3' }
const label = { fontSize: '14px', color: '#7A7570' }
const value = { fontSize: '14px', color: '#1A1814', fontWeight: '500' as const }
const button = { backgroundColor: '#2D5A3D', color: '#ffffff', padding: '12px 24px', borderRadius: '8px', fontSize: '15px', fontWeight: '600' as const, textDecoration: 'none', display: 'inline-block' as const }
const hr = { borderColor: '#E0DBD3', margin: '28px 0 16px' }
const footer = { fontSize: '12px', color: '#7A7570', textAlign: 'center' as const, margin: '0' }
