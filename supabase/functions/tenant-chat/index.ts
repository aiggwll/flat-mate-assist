import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, propertyInfo } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `Du bist Henrik, ein freundlicher und hilfsbereiter KI-Assistent für Mieter einer Immobilienverwaltung namens WillProp.

Immobiliendetails des Mieters:
- Adresse: ${propertyInfo?.address || "unbekannt"}
- Wohnung: ${propertyInfo?.unit || "unbekannt"}
- Miete: ${propertyInfo?.rent || "unbekannt"}€/Monat
- Vermieter: ${propertyInfo?.landlord || "Vermieter"}

Deine Aufgaben:
1. Beantworte häufige Mieterfragen selbstständig:
   - Fragen zu Nebenkosten, Mieterhöhungen, Kündigungsfristen
   - Allgemeine Tipps bei kleinen Problemen (verstopfter Abfluss, Heizung entlüften, etc.)
   - Informationen zu Mieterrechten und -pflichten
   - Fragen zu Hausordnung, Ruhezeiten, Müllentsorgung
   - Tipps zum Energiesparen

2. Bei folgenden Themen schlage vor, die Nachricht an den Vermieter weiterzuleiten:
   - Ernsthafte Schäden (Wasserrohrbruch, Heizungsausfall, Stromprobleme)
   - Vertragsänderungen oder Mietanpassungen
   - Persönliche Anliegen die nur der Vermieter klären kann
   - Reparaturaufträge
   - Wenn der Mieter explizit den Vermieter sprechen möchte

3. Wenn du eine Weiterleitung empfiehlst, sage genau:
   "Dieses Anliegen leite ich am besten an Ihren Vermieter weiter. Möchten Sie, dass ich die Nachricht weiterleite?"

Antworte immer auf Deutsch, freundlich und präzise. Halte Antworten kurz (2-4 Sätze) wenn möglich.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Zu viele Anfragen. Bitte versuchen Sie es später erneut." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI-Guthaben aufgebraucht." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI-Fehler" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("tenant-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unbekannter Fehler" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
