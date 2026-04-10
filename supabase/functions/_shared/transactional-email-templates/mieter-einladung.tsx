import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "dwello"
const APP_URL = "https://dwello-app.lovable.app"

interface MieterEinladungProps {
  mieterName?: string
  vermieterName?: string
  objektAdresse?: string
  einladungsLink?: string
}

const MieterEinladungEmail = ({ mieterName, vermieterName, objektAdresse, einladungsLink }: MieterEinladungProps) => (
  <Html lang="de" dir="ltr">
    <Head />
    <Preview>Sie wurden zu {objektAdresse || 'einer Immobilie'} eingeladen – {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={card}>
        <div style={topBorder} />
        <div style={logoWrap}>
          <span style={logo}>{SITE_NAME}</span>
        </div>
        <Heading style={h1}>Herzlich willkommen, {mieterName || 'Mieter'}</Heading>
        <Text style={text}>
          Ihr Vermieter {vermieterName || ''} hat Sie zur digitalen Verwaltung Ihrer Mietwohnung {objektAdresse ? `(${objektAdresse})` : ''} eingeladen.
        </Text>
        <Button style={button} href={einladungsLink || APP_URL}>
          Einladung annehmen
        </Button>
        <Text style={small}>Dieser Link ist 7 Tage gültig.</Text>
        <Hr style={hr} />
        <Text style={footer}>{SITE_NAME} Immobilienverwaltung · dwello.de</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: MieterEinladungEmail,
  subject: (data: Record<string, any>) => `Sie wurden zu ${data.objektAdresse || 'einer Immobilie'} eingeladen – dwello`,
  displayName: 'Mieter Einladung',
  previewData: { mieterName: 'Max Mustermann', vermieterName: 'Anna Schmidt', objektAdresse: 'Musterstraße 1, Berlin', einladungsLink: 'https://dwello-app.lovable.app/register?role=tenant' },
} satisfies TemplateEntry

const main = { backgroundColor: '#F5F3EF', fontFamily: "system-ui, -apple-system, sans-serif", padding: '40px 20px' }
const card = { backgroundColor: '#ffffff', maxWidth: '560px', margin: '0 auto', borderRadius: '8px', padding: '0 32px 32px', overflow: 'hidden' as const }
const topBorder = { height: '4px', backgroundColor: '#2D5A3D', margin: '0 -32px', marginBottom: '24px' }
const logoWrap = { textAlign: 'center' as const, margin: '24px 0 16px' }
const logo = { fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '24px', color: '#2D5A3D', fontWeight: '400' as const }
const h1 = { fontSize: '20px', fontWeight: '700' as const, color: '#1A1814', margin: '0 0 16px', lineHeight: '1.4' }
const text = { fontSize: '15px', color: '#1A1814', lineHeight: '1.7', margin: '0 0 20px' }
const small = { fontSize: '13px', color: '#7A7570', margin: '12px 0 0' }
const button = { backgroundColor: '#2D5A3D', color: '#ffffff', padding: '12px 24px', borderRadius: '8px', fontSize: '15px', fontWeight: '600' as const, textDecoration: 'none', display: 'inline-block' as const }
const hr = { borderColor: '#E0DBD3', margin: '28px 0 16px' }
const footer = { fontSize: '12px', color: '#7A7570', textAlign: 'center' as const, margin: '0' }
