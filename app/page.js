"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [leads, setLeads] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [note, setNote] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    setUser(user);

    const { data: leadsData } = await supabase.from("leads").select("*");

    setLeads(leadsData);
  };

  // 🔥 NEU: Notiz speichern + Aktivität loggen
  const saveNote = async () => {
    if (!selectedLead || !note) return;

    await supabase.from("lead_activities").insert({
      lead_id: selectedLead.id,
      user_id: user.id,
      type: "note",
      note: note,
    });

    await supabase
      .from("leads")
      .update({
        last_contact_at: new Date().toISOString(),
      })
      .eq("id", selectedLead.id);

    setNote("");
    alert("Notiz gespeichert");
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Leadflow Pro</h1>

      {/* LEADS LISTE */}
      <div>
        <h2>Leads</h2>

        {leads.map((lead) => (
          <div
            key={lead.id}
            onClick={() => setSelectedLead(lead)}
            style={{
              border: "1px solid #333",
              padding: 10,
              marginBottom: 10,
              cursor: "pointer",
            }}
          >
            <strong>{lead.full_name}</strong>
            <br />
            {lead.email} - {lead.city}
          </div>
        ))}
      </div>

      {/* DETAIL BEREICH */}
      {selectedLead && (
        <div style={{ marginTop: 30 }}>
          <h2>Lead Details</h2>

          <p>
            <strong>Name:</strong> {selectedLead.full_name}
          </p>
          <p>
            <strong>Email:</strong> {selectedLead.email}
          </p>
          <p>
            <strong>Telefon:</strong> {selectedLead.phone}
          </p>
          <p>
            <strong>Status:</strong> {selectedLead.status}
          </p>

          {/* NOTIZ FELD */}
          <h3>Neue Notiz</h3>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="z.B. Kunde angerufen, interessiert..."
            style={{ width: "100%", height: 100 }}
          />

          <br />

          <button onClick={saveNote} style={{ marginTop: 10 }}>
            Notiz speichern
          </button>
        </div>
      )}
    </div>
  );
}
