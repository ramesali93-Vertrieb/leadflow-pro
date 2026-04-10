"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "../../lib/supabase-browser";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        router.replace("/dashboard");
        return;
      }

      setIsCheckingSession(false);
    }

    checkSession();
  }, [router, supabase.auth]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        throw new Error(error.message);
      }

      router.replace("/dashboard");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Login fehlgeschlagen.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isCheckingSession) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#09090b",
          color: "#f4f4f5",
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        Session wird geprüft...
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#09090b",
        color: "#f4f4f5",
        fontFamily: "Arial, Helvetica, sans-serif",
        padding: "24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "#18181b",
          border: "1px solid #27272a",
          borderRadius: "18px",
          padding: "24px",
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: "32px",
            fontWeight: 700,
          }}
        >
          Leadflow Pro
        </h1>

        <p
          style={{
            marginTop: "8px",
            color: "#a1a1aa",
            lineHeight: 1.5,
          }}
        >
          Bitte melde dich an, um dein CRM zu öffnen.
        </p>

        <form
          onSubmit={handleSubmit}
          style={{
            display: "grid",
            gap: "16px",
            marginTop: "24px",
          }}
        >
          <div>
            <label
              htmlFor="email"
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: 600,
              }}
            >
              E-Mail
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="dein.name@firma.de"
              required
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "10px",
                border: "1px solid #27272a",
                background: "#111113",
                color: "#f4f4f5",
              }}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: 600,
              }}
            >
              Passwort
            </label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Passwort eingeben"
              required
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "10px",
                border: "1px solid #27272a",
                background: "#111113",
                color: "#f4f4f5",
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

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              padding: "12px 16px",
              borderRadius: "10px",
              border: "1px solid #27272a",
              background: "#ffffff",
              color: "#09090b",
              fontWeight: 700,
              cursor: isSubmitting ? "not-allowed" : "pointer",
              opacity: isSubmitting ? 0.7 : 1,
            }}
          >
            {isSubmitting ? "Anmeldung läuft..." : "Einloggen"}
          </button>
        </form>
      </div>
    </div>
  );
}
