import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "dwello"
const APP_URL = "https://dwello-app.lovable.app"

interface WelcomeLandlordProps {
  name?: string
}

const WelcomeLandlordEmail = ({ name }: WelcomeLandlordProps) => (
  <Html lang="de" dir="ltr">
    <Head />
    <Preview>Willkommen bei {SITE_NAME}, {name || 'Vermieter'}!</Preview>
    <Body style={main}>
      <Container style={card}>
        <div style={topBorder} />
        <div style={logoWrap}><span style={logo}>{SITE_NAME}</span></div>
        <Heading style={h1}>Schön, dass Sie dabei sind.</Heading>
        <Text style={text}>
          {name ? `Hallo ${name}, ` : ''}Ihr {SITE_NAME}-Konto ist bereit und Ihre erste Immobilie ist bereits angelegt. Jetzt können Sie Ihre Mieter einladen und Ihre Verwaltung starten.
        </Text>
        <Text style={steps}>
          1. Mieter einladen{'\n'}
          2. Mietzahlungen verwalten{'\n'}
          3. Dokumente & Nebenkosten organisieren
        </Text>
        <Button style={button} href={`${APP_URL}/dashboard`}>
          Zum Dashboard
        </Button>
        <Hr style={hr} />
        <Text style={footer}>{SITE_NAME} Immobilienverwaltung · dwello.de</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: WelcomeLandlordEmail,
  subject: (data: Record<string, any>) => `Willkommen bei dwello, ${data.name || 'Vermieter'}!`,
  displayName: 'Willkommen Vermieter',
  previewData: { name: 'Max Mustermann' },
} satisfies TemplateEntry

const main = { backgroundColor: '#F5F3EF', fontFamily: "system-ui, -apple-system, sans-serif", padding: '40px 20px' }
const card = { backgroundColor: '#ffffff', maxWidth: '560px', margin: '0 auto', borderRadius: '8px', padding: '0 32px 32px', overflow: 'hidden' as const }
const topBorder = { height: '4px', backgroundColor: '#2D5A3D', margin: '0 -32px', marginBottom: '24px' }
const logoWrap = { textAlign: 'center' as const, margin: '24px 0 16px' }
const logo = { fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '24px', color: '#2D5A3D' }
const h1 = { fontSize: '20px', fontWeight: '700' as const, color: '#1A1814', margin: '0 0 16px' }
const text = { fontSize: '15px', color: '#1A1814', lineHeight: '1.7', margin: '0 0 20px' }
const steps = { fontSize: '15px', color: '#1A1814', lineHeight: '2', margin: '0 0 20px', whiteSpace: 'pre-line' as const }
const button = { backgroundColor: '#2D5A3D', color: '#ffffff', padding: '12px 24px', borderRadius: '8px', fontSize: '15px', fontWeight: '600' as const, textDecoration: 'none', display: 'inline-block' as const }
const hr = { borderColor: '#E0DBD3', margin: '28px 0 16px' }
const footer = { fontSize: '12px', color: '#7A7570', textAlign: 'center' as const, margin: '0' }
