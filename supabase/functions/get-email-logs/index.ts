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

  // Check if user is an owner
  const serviceClient = createClient(supabaseUrl, supabaseServiceKey)
  const { data: profile } = await serviceClient
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle()

  if (profile?.role !== 'owner') {
    return new Response(JSON.stringify({ logs: [] }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Get deduplicated email logs (latest status per message_id), last 50
  const { data: logs, error } = await serviceClient
    .from('email_send_log')
    .select('id, template_name, recipient_email, status, created_at, message_id')
    .not('message_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    return new Response(JSON.stringify({ error: 'Query failed' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Deduplicate by message_id (keep latest)
  const seen = new Set<string>()
  const deduped = (logs || []).filter(l => {
    if (!l.message_id || seen.has(l.message_id)) return false
    seen.add(l.message_id)
    return true
  }).slice(0, 50)

  return new Response(JSON.stringify({ logs: deduped }), {
    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
