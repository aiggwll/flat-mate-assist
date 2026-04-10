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
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let paymentId: string
  try {
    const body = await req.json()
    paymentId = body.paymentId
    if (!paymentId) throw new Error('Missing paymentId')
  } catch {
    return new Response(JSON.stringify({ error: 'paymentId required' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Validate the caller's JWT
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const anonClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') || '')
  const { data: { user }, error: authError } = await anonClient.auth.getUser(
    authHeader.replace('Bearer ', '')
  )
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Get payment details
  const { data: payment, error: paymentError } = await supabase
    .from('rent_payments')
    .select('*')
    .eq('id', paymentId)
    .single()

  if (paymentError || !payment) {
    return new Response(JSON.stringify({ error: 'Payment not found' }), {
      status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Update status to "überwiesen"
  const { error: updateError } = await supabase
    .from('rent_payments')
    .update({ status: 'überwiesen' })
    .eq('id', paymentId)

  if (updateError) {
    return new Response(JSON.stringify({ error: 'Update failed' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Find landlord's email
  const { data: landlordProfile } = await supabase
    .from('profiles')
    .select('email, name')
    .eq('user_id', payment.user_id)
    .maybeSingle()

  // Notify landlord
  if (landlordProfile?.email) {
    try {
      await supabase.functions.invoke('send-transactional-email', {
        body: {
          templateName: 'zahlung-bestaetigung',
          recipientEmail: landlordProfile.email,
          idempotencyKey: `tenant-confirmed-${paymentId}`,
          templateData: {
            mietObjekt: payment.unit_id,
            zeitraum: new Date(payment.due_date).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' }),
            betrag: (payment.cold_rent + payment.nebenkosten).toFixed(2).replace('.', ','),
          },
        },
      })
    } catch (err) {
      console.error('Failed to notify landlord:', err)
    }
  }

  return new Response(
    JSON.stringify({ success: true }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})
