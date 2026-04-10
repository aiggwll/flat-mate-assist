import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(JSON.stringify({ error: 'Config error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Parse optional body for manual trigger or retry mode
  let mode = 'scheduled' // 'scheduled' | 'manual' | 'retry'
  let manualPaymentId: string | null = null
  try {
    const body = await req.json()
    if (body?.mode === 'manual' && body?.paymentId) {
      mode = 'manual'
      manualPaymentId = body.paymentId
    } else if (body?.mode === 'retry') {
      mode = 'retry'
    }
  } catch {
    // No body = scheduled run
  }

  let paymentsToRemind: any[] = []

  if (mode === 'manual' && manualPaymentId) {
    // Manual trigger for a specific payment
    const { data, error } = await supabase
      .from('rent_payments')
      .select('id, tenant_name, unit_id, cold_rent, nebenkosten, due_date, user_id, reminder_sent_at')
      .eq('id', manualPaymentId)
      .is('paid_at', null)
      .single()

    if (error || !data) {
      return new Response(JSON.stringify({ error: 'Payment not found or already paid' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check 24h cooldown for manual sends
    if (data.reminder_sent_at) {
      const lastSent = new Date(data.reminder_sent_at)
      const hoursSince = (Date.now() - lastSent.getTime()) / (1000 * 60 * 60)
      if (hoursSince < 24) {
        return new Response(JSON.stringify({ error: 'cooldown', hoursRemaining: Math.ceil(24 - hoursSince) }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    paymentsToRemind = [data]
  } else if (mode === 'retry') {
    // Retry failed reminders from the last 2 hours
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    const { data: failedLogs } = await supabase
      .from('payment_reminders_log')
      .select('payment_id')
      .eq('status', 'failed')
      .gte('created_at', twoHoursAgo)

    if (failedLogs && failedLogs.length > 0) {
      const paymentIds = failedLogs.map(l => l.payment_id).filter(Boolean)
      if (paymentIds.length > 0) {
        const { data } = await supabase
          .from('rent_payments')
          .select('id, tenant_name, unit_id, cold_rent, nebenkosten, due_date, user_id, reminder_sent_at')
          .in('id', paymentIds)
          .is('paid_at', null)
          .is('reminder_sent_at', null)

        paymentsToRemind = data || []
      }
    }
  } else {
    // Scheduled: find payments due in exactly 3 days with no reminder sent
    const threeDaysFromNow = new Date()
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)
    const targetDate = threeDaysFromNow.toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('rent_payments')
      .select('id, tenant_name, unit_id, cold_rent, nebenkosten, due_date, user_id, reminder_sent_at')
      .eq('due_date', targetDate)
      .is('paid_at', null)
      .is('reminder_sent_at', null)

    if (error) {
      console.error('Failed to query payments:', error)
      return new Response(JSON.stringify({ error: 'Query failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    paymentsToRemind = data || []
  }

  let sentCount = 0
  let failedCount = 0
  const results: { paymentId: string; status: string; email?: string }[] = []

  for (const payment of paymentsToRemind) {
    // Find tenant email by name match
    const { data: tenantProfile } = await supabase
      .from('profiles')
      .select('email, user_id')
      .eq('name', payment.tenant_name)
      .eq('role', 'tenant')
      .maybeSingle()

    if (!tenantProfile?.email) {
      // Log as skipped — no email found
      await supabase.from('payment_reminders_log').insert({
        tenant_id: tenantProfile?.user_id || 'unknown',
        property_id: payment.unit_id,
        due_date: payment.due_date,
        amount: payment.cold_rent + payment.nebenkosten,
        email_sent_to: 'N/A',
        status: 'skipped',
        payment_id: payment.id,
        error_message: 'Tenant email not found',
      })
      results.push({ paymentId: payment.id, status: 'skipped' })
      continue
    }

    const dueDate = new Date(payment.due_date)
    const formattedDate = `${String(dueDate.getDate()).padStart(2, '0')}.${String(dueDate.getMonth() + 1).padStart(2, '0')}.${dueDate.getFullYear()}`
    const betrag = (payment.cold_rent + payment.nebenkosten).toFixed(2).replace('.', ',')

    try {
      const { error: sendError } = await supabase.functions.invoke('send-transactional-email', {
        body: {
          templateName: 'zahlung-erinnerung',
          recipientEmail: tenantProfile.email,
          idempotencyKey: `zahlung-erinnerung-${payment.id}-${payment.due_date}`,
          templateData: {
            objektAdresse: payment.unit_id,
            betrag,
            faelligkeitsDatum: formattedDate,
            paymentId: payment.id,
          },
        },
      })

      if (sendError) throw sendError

      // Mark reminder as sent
      await supabase
        .from('rent_payments')
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq('id', payment.id)

      // Log success
      await supabase.from('payment_reminders_log').insert({
        tenant_id: tenantProfile.user_id || 'unknown',
        property_id: payment.unit_id,
        due_date: payment.due_date,
        amount: payment.cold_rent + payment.nebenkosten,
        email_sent_to: tenantProfile.email,
        status: 'sent',
        payment_id: payment.id,
      })

      sentCount++
      results.push({ paymentId: payment.id, status: 'sent', email: tenantProfile.email })
    } catch (err) {
      console.error('Failed to send reminder for payment', payment.id, err)
      failedCount++

      // Log failure
      await supabase.from('payment_reminders_log').insert({
        tenant_id: tenantProfile.user_id || 'unknown',
        property_id: payment.unit_id,
        due_date: payment.due_date,
        amount: payment.cold_rent + payment.nebenkosten,
        email_sent_to: tenantProfile.email,
        status: 'failed',
        payment_id: payment.id,
        error_message: String(err),
      })

      results.push({ paymentId: payment.id, status: 'failed', email: tenantProfile.email })
    }
  }

  console.log(`Payment reminders [${mode}]: ${sentCount} sent, ${failedCount} failed, ${paymentsToRemind.length - sentCount - failedCount} skipped`)

  return new Response(
    JSON.stringify({ success: true, mode, sent: sentCount, failed: failedCount, results }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})
