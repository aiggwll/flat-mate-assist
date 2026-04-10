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

  // Find payments due in 3 days that are still pending
  const threeDaysFromNow = new Date()
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)
  const targetDate = threeDaysFromNow.toISOString().split('T')[0]

  const { data: payments, error: paymentsError } = await supabase
    .from('rent_payments')
    .select('id, tenant_name, unit_id, cold_rent, nebenkosten, due_date, user_id')
    .eq('due_date', targetDate)
    .is('paid_at', null)

  if (paymentsError) {
    console.error('Failed to query payments:', paymentsError)
    return new Response(JSON.stringify({ error: 'Query failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let sentCount = 0

  for (const payment of (payments || [])) {
    // Find tenant email by name match
    const { data: tenantProfile } = await supabase
      .from('profiles')
      .select('email')
      .eq('name', payment.tenant_name)
      .eq('role', 'tenant')
      .maybeSingle()

    if (!tenantProfile?.email) continue

    const dueDate = new Date(payment.due_date)
    const formattedDate = `${String(dueDate.getDate()).padStart(2, '0')}.${String(dueDate.getMonth() + 1).padStart(2, '0')}.${dueDate.getFullYear()}`
    const betrag = (payment.cold_rent + payment.nebenkosten).toFixed(2).replace('.', ',')

    try {
      await supabase.functions.invoke('send-transactional-email', {
        body: {
          templateName: 'zahlung-erinnerung',
          recipientEmail: tenantProfile.email,
          idempotencyKey: `zahlung-erinnerung-${payment.id}-${targetDate}`,
          templateData: {
            objektAdresse: payment.unit_id,
            betrag,
            faelligkeitsDatum: formattedDate,
          },
        },
      })
      sentCount++
    } catch (err) {
      console.error('Failed to send reminder for payment', payment.id, err)
    }
  }

  console.log(`Payment reminders: ${sentCount} sent for due date ${targetDate}`)

  return new Response(
    JSON.stringify({ success: true, sent: sentCount, targetDate }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})
