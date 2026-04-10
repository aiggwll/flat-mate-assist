import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Mail } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface EmailLogEntry {
  id: string;
  template_name: string;
  recipient_email: string;
  status: string;
  created_at: string;
  message_id: string | null;
}

const TEMPLATE_LABELS: Record<string, string> = {
  "mieter-einladung": "Mieter Einladung",
  "zahlung-bestaetigung": "Zahlungsbestätigung",
  "zahlung-erinnerung": "Zahlungserinnerung",
  "nebenkostenabrechnung": "Nebenkostenabrechnung",
  "welcome-landlord": "Willkommen Vermieter",
  "new-landlord-notification": "Registrierungsbenachrichtigung",
};

const EmailHistory = () => {
  const [logs, setLogs] = useState<EmailLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      // email_send_log is service_role only, so we use an RPC or just show what we can
      // Since email_send_log requires service_role, we'll query via edge function
      // For now, show a simplified view
      setLoading(false);
    };
    fetchLogs();
  }, []);

  // We use the edge function to fetch logs since the table has service_role RLS
  useEffect(() => {
    const loadLogs = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("get-email-logs", {
          method: "GET",
        });
        if (!error && data?.logs) {
          setLogs(data.logs);
        }
      } catch {
        // silently fail - logs are optional UI
      } finally {
        setLoading(false);
      }
    };
    loadLogs();
  }, []);

  if (loading) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        Lade E-Mail-Verlauf...
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="p-6 text-center">
        <Mail className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Noch keine E-Mails versendet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {logs.map((log) => (
        <div key={log.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
          <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {TEMPLATE_LABELS[log.template_name] || log.template_name}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {log.recipient_email} · {format(new Date(log.created_at), "dd. MMM yyyy, HH:mm", { locale: de })}
            </p>
          </div>
          <Badge
            variant={log.status === "sent" ? "default" : log.status === "pending" ? "secondary" : "destructive"}
            className="shrink-0"
          >
            {log.status === "sent" ? "Gesendet" : log.status === "pending" ? "Ausstehend" : "Fehlgeschlagen"}
          </Badge>
        </div>
      ))}
    </div>
  );
};

export default EmailHistory;
