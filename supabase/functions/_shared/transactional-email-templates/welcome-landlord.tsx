import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Dwello"

interface WelcomeLandlordProps {
  name?: string
}

const WelcomeLandlordEmail = ({ name }: WelcomeLandlordProps) => (
  <Html lang="de" dir="ltr">
    <Head />
    <Preview>Willkommen bei {SITE_NAME}, {name || 'Vermieter'}!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Willkommen bei {SITE_NAME}{name ? `, ${name}` : ''}!</Heading>
        <Text style={text}>
          Guten Tag{name ? ` ${name}` : ''},
        </Text>
        <Text style={text}>
          wir freuen uns, Sie bei {SITE_NAME} begrüßen zu dürfen. Ihr Konto ist eingerichtet und Sie können sofort loslegen.
        </Text>
        <Text style={text}>
          Bei Fragen stehen wir Ihnen jederzeit zur Verfügung.
        </Text>
        <Button style={button} href="https://dwello-app.lovable.app">
          Jetzt starten →
        </Button>
        <Text style={footer}>Ihr {SITE_NAME}-Team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: WelcomeLandlordEmail,
  subject: (data: Record<string, any>) => `Willkommen bei Dwello, ${data.name || 'Vermieter'}!`,
  displayName: 'Willkommen Vermieter',
  previewData: { name: 'Max Mustermann' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Plus Jakarta Sans', Arial, sans-serif" }
const container = { padding: '24px 28px' }
const h1 = { fontSize: '20px', fontWeight: 'bold' as const, color: '#1a1a2e', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.6', margin: '0 0 16px' }
const button = {
  backgroundColor: '#2D6A4F',
  color: '#ffffff',
  padding: '12px 24px',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: '600' as const,
  textDecoration: 'none',
  display: 'inline-block' as const,
  margin: '8px 0 24px',
}
const footer = { fontSize: '12px', color: '#999999', margin: '24px 0 0' }
