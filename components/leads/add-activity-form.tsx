"use client";

import { CSSProperties, FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "../../lib/supabase-browser";

type AddActivityFormProps = {
  leadId: string;
  fallbackUserId: string;
};

const cardStyle: CSSProperties = {
  padding: "24px",
};

const titleStyle: CSSProperties = {
  marginTop: 0,
  marginBottom: "20px",
  fontSize: "clamp(28px, 4vw, 38px)",
  lineHeight: 1.05,
  letterSpacing: "-0.04em",
};

const formStyle: CSSProperties = {
  display: "grid",
  gap: "18px",
};

const fieldStyle: CSSProperties = {
  minWidth: 0,
};

const labelStyle: CSSProperties = {
  display: "block",
  marginBottom: "8px",
  fontWeight: 700,
  fontSize: "14px",
  lineHeight: 1.4,
};

const inputBaseStyle: CSSProperties = {
  width: "100%",
  minHeight: "52px",
  padding: "14px 16px",
  borderRadius: "16px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.05)",
  color: "#f4f4f5",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  outline: "none",
  fontSize: "16px",
  lineHeight: 1.5,
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
};

const textareaStyle: CSSProperties = {
  ...inputBaseStyle,
  minHeight: "160px",
  resize: "vertical",
};

const helperStyle: CSSProperties = {
  marginTop: "8px",
  fontSize: "13px",
  lineHeight: 1.5,
  color: "rgba(255,255,255,0.52)",
};

const messageBaseStyle: CSSProperties = {
  padding: "12px 14px",
  borderRadius: "14px",
  fontSize: "14px",
  lineHeight: 1.5,
  border: "1px solid transparent",
};

const errorStyle: CSSProperties = {
  ...messageBaseStyle,
  color: "#fecdd3",
  background: "rgba(244, 63, 94, 0.10)",
  borderColor: "rgba(244, 63, 94, 0.18)",
};

const successStyle: CSSProperties = {
  ...messageBaseStyle,
  color: "#bbf7d0",
  background: "rgba(34, 197, 94, 0.10)",
  borderColor: "rgba(34, 197, 94, 0.18)",
};

const actionsStyle: CSSProperties = {
  display: "flex",
  justifyContent: "flex-start",
};

const buttonStyle: CSSProperties = {
  minHeight: "52px",
  padding: "0 18px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.92)",
  color: "#09090b",
  fontWeight: 700,
  fontSize: "15px",
  cursor: "pointer",
  transition: "transform 160ms ease, opacity 160ms ease, filter 160ms ease",
  width: "100%",
  maxWidth: "280px",
};

export function AddActivityForm({
  leadId,
  fallbackUserId,
}: AddActivityFormProps) {
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();

  const [activityType, setActivityType] = useState("note");
  const [body, setBody] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    const trimmedBody = body.trim();

    if (!trimmedBody) {
      setErrorMessage("Bitte einen Inhalt für die Aktivität eingeben.");
      return;
    }

    if (!fallbackUserId) {
      setErrorMessage("Kein gültiger User für die Aktivität gefunden.");
      return;
    }

    setIsSaving(true);

    try {
      const { error: insertError } = await supabase.from("lead_activities").insert({
        lead_id: leadId,
        user_id: fallbackUserId,
        activity_type: activityType,
        body: trimmedBody,
        metadata: {},
      });

      if (insertError) {
        throw new Error(insertError.message);
      }

      setBody("");
      setSuccessMessage("Aktivität erfolgreich gespeichert.");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unbekannter Fehler beim Speichern.";
      setErrorMessage(message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="card" style={cardStyle}>
      <h2 style={titleStyle}>Neue Aktivität</h2>

      <form onSubmit={handleSubmit} style={formStyle}>
        <div style={fieldStyle}>
          <label htmlFor="activityType" style={labelStyle}>
            Aktivitätstyp
          </label>

          <select
            id="activityType"
            value={activityType}
            onChange={(event) => setActivityType(event.target.value)}
            style={inputBaseStyle}
          >
            <option value="note">Notiz</option>
            <option value="call">Anruf</option>
            <option value="email">E-Mail</option>
            <option value="followup">Follow-up</option>
            <option value="offer">Angebot</option>
            <option value="system">System</option>
          </select>

          <div style={helperStyle}>
            Wähle aus, welche Art von Aktivität du dokumentieren möchtest.
          </div>
        </div>

        <div style={fieldStyle}>
          <label htmlFor="activityBody" style={labelStyle}>
            Inhalt
          </label>

          <textarea
            id="activityBody"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={6}
            placeholder="Notiz oder Aktivität eingeben..."
            style={textareaStyle}
          />

          <div style={helperStyle}>
            Halte fest, was passiert ist, was als Nächstes ansteht oder welche Infos wichtig sind.
          </div>
        </div>

        {errorMessage ? <div style={errorStyle}>{errorMessage}</div> : null}

        {successMessage ? <div style={successStyle}>{successMessage}</div> : null}

        <div style={actionsStyle}>
          <button
            type="submit"
            disabled={isSaving}
            style={{
              ...buttonStyle,
              cursor: isSaving ? "not-allowed" : "pointer",
              opacity: isSaving ? 0.7 : 1,
            }}
          >
            {isSaving ? "Speichert..." : "Aktivität speichern"}
          </button>
        </div>
      </form>
    </section>
  );
}
