import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Dwello"

interface NewLandlordNotificationProps {
  name?: string
  email?: string
  createdAt?: string
  totalOwners?: number
}

const NewLandlordNotificationEmail = ({ name, email, createdAt, totalOwners }: NewLandlordNotificationProps) => (
  <Html lang="de" dir="ltr">
    <Head />
    <Preview>Neuer Vermieter bei {SITE_NAME}: {name || 'Unbekannt'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>🏠 Neuer Vermieter bei {SITE_NAME}</Heading>
        <Text style={text}>Ein neuer Vermieter hat sich registriert:</Text>
        <Text style={detail}><strong>Name:</strong> {name || '–'}</Text>
        <Text style={detail}><strong>E-Mail:</strong> {email || '–'}</Text>
        <Text style={detail}><strong>Datum:</strong> {createdAt || new Date().toLocaleDateString('de-DE')}</Text>
        <Hr style={hr} />
        <Text style={text}>
          Aktuell registrierte Vermieter: <strong>{totalOwners ?? '–'}</strong>
        </Text>
        <Text style={footer}>Diese Benachrichtigung wurde automatisch von {SITE_NAME} gesendet.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: NewLandlordNotificationEmail,
  subject: '🏠 Neuer Vermieter bei Dwello',
  displayName: 'Admin: Neuer Vermieter',
  to: 'gina2406@hotmail.de',
  previewData: { name: 'Max Mustermann', email: 'max@example.com', createdAt: '07.04.2026', totalOwners: 5 },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Plus Jakarta Sans', Arial, sans-serif" }
const container = { padding: '24px 28px' }
const h1 = { fontSize: '20px', fontWeight: 'bold' as const, color: '#1a1a2e', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.6', margin: '0 0 16px' }
const detail = { fontSize: '14px', color: '#333', lineHeight: '1.8', margin: '0 0 4px' }
const hr = { borderColor: '#e8e8e8', margin: '20px 0' }
const footer = { fontSize: '12px', color: '#999999', margin: '24px 0 0' }
