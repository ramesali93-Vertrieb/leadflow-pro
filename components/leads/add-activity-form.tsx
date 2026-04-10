"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "../../lib/supabase-browser";

type AddActivityFormProps = {
  leadId: string;
};

export function AddActivityForm({ leadId }: AddActivityFormProps) {
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

    setIsSaving(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw new Error(userError.message);
      }

      if (!user) {
        throw new Error("Kein eingeloggter Benutzer gefunden.");
      }

      const { error: insertError } = await supabase.from("lead_activities").insert({
        lead_id: leadId,
        user_id: user.id,
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
    <section className="card" style={{ padding: "24px" }}>
      <h2 style={{ marginTop: 0 }}>Neue Aktivität</h2>

      <form
        onSubmit={handleSubmit}
        style={{
          display: "grid",
          gap: "16px",
        }}
      >
        <div>
          <label
            htmlFor="activityType"
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: 600,
            }}
          >
            Aktivitätstyp
          </label>

          <select
            id="activityType"
            value={activityType}
            onChange={(event) => setActivityType(event.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "10px",
              border: "1px solid #27272a",
              background: "#111113",
              color: "#f4f4f5",
            }}
          >
            <option value="note">Notiz</option>
            <option value="call">Anruf</option>
            <option value="email">E-Mail</option>
            <option value="followup">Follow-up</option>
            <option value="offer">Angebot</option>
            <option value="system">System</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="activityBody"
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: 600,
            }}
          >
            Inhalt
          </label>

          <textarea
            id="activityBody"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={6}
            placeholder="Notiz oder Aktivität eingeben..."
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "10px",
              border: "1px solid #27272a",
              background: "#111113",
              color: "#f4f4f5",
              resize: "vertical",
            }}
          />
        </div>

        {errorMessage ? (
          <div
            style={{
              color: "#fda4af",
              fontSize: "14px",
            }}
          >
            {errorMessage}
          </div>
        ) : null}

        {successMessage ? (
          <div
            style={{
              color: "#86efac",
              fontSize: "14px",
            }}
          >
            {successMessage}
          </div>
        ) : null}

        <div>
          <button
            type="submit"
            disabled={isSaving}
            style={{
              padding: "12px 16px",
              borderRadius: "10px",
              border: "1px solid #27272a",
              background: "#ffffff",
              color: "#09090b",
              fontWeight: 600,
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
