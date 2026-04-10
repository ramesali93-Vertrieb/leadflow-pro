"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function HomePage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [leads, setLeads] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      setUser(user);
      await loadProfile(user.id);
      await loadLeads(user.id);
    }
  }

  async function loadProfile(userId) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (!error) {
      setProfile(data);
    }
  }

  async function loadLeads(userId) {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (!profileData) return;

    let query = supabase
      .from("leads")
      .select(`
        id,
        full_name,
        phone,
        email,
        city,
        status,
        next_step,
        due_date,
        offer_amount,
        win_chance,
        base_note,
        owner_id,
        profiles:owner_id ( name )
      `)
      .order("created_at", { ascending: false });

    if (profileData.role !== "admin") {
      query = query.eq("owner_id", userId);
    }

    const { data, error } = await query;

    if (!error && data) {
      setLeads(data);
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("Login fehlgeschlagen");
      setLoading(false);
      return;
    }

    setUser(data.user);
    await loadProfile(data.user.id);
    await loadLeads(data.user.id);

    await supabase.rpc("record_daily_login");

    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setLeads([]);
    setEmail("");
    setPassword("");
  }

  if (!user) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: 24,
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 420,
            background: "#111827",
            border: "1px solid #334155",
            borderRadius: 16,
            padding: 24,
          }}
        >
          <h1 style={{ marginTop: 0 }}>Leadflow Pro</h1>
          <p style={{ color: "#94a3b8" }}>Login für Vertriebsteam</p>

          <form
            onSubmit={handleLogin}
            style={{ display: "grid", gap: 12, marginTop: 20 }}
          >
            <input
              type="email"
              placeholder="E-Mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                padding: 12,
                borderRadius: 10,
                border: "1px solid #334155",
                background: "#020617",
                color: "white",
              }}
            />
            <input
              type="password"
              placeholder="Passwort"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                padding: 12,
                borderRadius: 10,
                border: "1px solid #334155",
                background: "#020617",
                color: "white",
              }}
            />

            {error ? (
              <div
                style={{
                  background: "#450a0a",
                  color: "#fca5a5",
                  padding: 12,
                  borderRadius: 10,
                }}
              >
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: 12,
                borderRadius: 10,
                border: 0,
                background: "#2563eb",
                color: "white",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {loading ? "Lädt..." : "Einloggen"}
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main style={{ padding: 24 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div>
          <h1 style={{ margin: 0 }}>Leadflow Pro</h1>
          <p style={{ color: "#94a3b8", marginTop: 8 }}>
            {profile?.name} · {profile?.role}
          </p>
        </div>

        <button
          onClick={handleLogout}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #334155",
            background: "#111827",
            color: "white",
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <StatCard title="Sichtbare Leads" value={leads.length} />
        <StatCard
          title="Heute fällig"
          value={leads.filter((lead) => lead.due_date === "2026-04-10").length}
        />
        <StatCard
          title="Offene Leads"
          value={
            leads.filter(
              (lead) => lead.status !== "Gewonnen" && lead.status !== "Storno"
            ).length
          }
        />
      </div>

      <div
        style={{
          background: "#111827",
          border: "1px solid #334155",
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
            padding: 16,
            background: "#0b1220",
            fontWeight: 700,
          }}
        >
          <div>Lead</div>
          <div>Status</div>
          <div>Owner</div>
          <div>Nächster Schritt</div>
          <div>Fällig</div>
        </div>

        {leads.map((lead) => (
          <div
            key={lead.id}
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
              padding: 16,
              borderTop: "1px solid #1e293b",
            }}
          >
            <div>
              <div style={{ fontWeight: 700 }}>{lead.full_name}</div>
              <div style={{ color: "#94a3b8", fontSize: 14 }}>
                {lead.city || "—"} · {lead.email || "—"}
              </div>
            </div>
            <div>{lead.status}</div>
            <div>{lead.profiles?.name || "—"}</div>
            <div>{lead.next_step}</div>
            <div>{lead.due_date}</div>
          </div>
        ))}

        {!leads.length ? (
          <div style={{ padding: 24, color: "#94a3b8" }}>
            Noch keine Leads gefunden.
          </div>
        ) : null}
      </div>
    </main>
  );
}

function StatCard({ title, value }) {
  return (
    <div
      style={{
        background: "#111827",
        border: "1px solid #334155",
        borderRadius: 16,
        padding: 20,
      }}
    >
      <div style={{ color: "#94a3b8", fontSize: 14 }}>{title}</div>
      <div style={{ fontSize: 30, fontWeight: 800, marginTop: 8 }}>{value}</div>
    </div>
  );
}
