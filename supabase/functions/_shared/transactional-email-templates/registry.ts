/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as newLandlordNotification } from './new-landlord-notification.tsx'
import { template as welcomeLandlord } from './welcome-landlord.tsx'
import { template as mieterEinladung } from './mieter-einladung.tsx'
import { template as zahlungBestaetigung } from './zahlung-bestaetigung.tsx'
import { template as zahlungErinnerung } from './zahlung-erinnerung.tsx'
import { template as nebenkostenabrechnung } from './nebenkostenabrechnung.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'new-landlord-notification': newLandlordNotification,
  'welcome-landlord': welcomeLandlord,
  'mieter-einladung': mieterEinladung,
  'zahlung-bestaetigung': zahlungBestaetigung,
  'zahlung-erinnerung': zahlungErinnerung,
  'nebenkostenabrechnung': nebenkostenabrechnung,
}
