/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="de" dir="ltr">
    <Head />
    <Preview>Bestätigen Sie Ihre E-Mail-Adresse für dwello</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>E-Mail-Adresse bestätigen</Heading>
        <Text style={text}>
          Vielen Dank für Ihre Registrierung bei{' '}
          <Link href={siteUrl} style={link}>
            <strong>dwello</strong>
          </Link>
          .
        </Text>
        <Text style={text}>
          Bitte bestätigen Sie Ihre E-Mail-Adresse (
          <Link href={`mailto:${recipient}`} style={link}>
            {recipient}
          </Link>
          ), damit Sie sich anmelden und Ihr Konto nutzen können.
        </Text>
        <Button style={button} href={confirmationUrl}>
          E-Mail bestätigen
        </Button>
        <Text style={footer}>
          Falls Sie kein Konto erstellt haben, können Sie diese E-Mail ignorieren.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Plus Jakarta Sans, Arial, sans-serif' }
const container = { padding: '32px 28px', maxWidth: '560px', margin: '0 auto' }
const h1 = {
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: 'hsl(220, 25%, 16%)',
  margin: '0 0 20px',
}
const text = {
  fontSize: '14px',
  color: 'hsl(220, 10%, 46%)',
  lineHeight: '1.5',
  margin: '0 0 25px',
}
const link = { color: 'hsl(153, 44%, 29%)', textDecoration: 'underline' }
const button = {
  backgroundColor: 'hsl(153, 44%, 29%)',
  color: 'hsl(0, 0%, 100%)',
  fontSize: '14px',
  borderRadius: '12px',
  padding: '12px 20px',
  textDecoration: 'none',
}
const footer = { fontSize: '12px', color: 'hsl(220, 10%, 46%)', margin: '30px 0 0' }
