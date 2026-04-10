"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [leads, setLeads] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [activities, setActivities] = useState([]);
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

  // 🔥 Lade Aktivitäten für Lead
  const loadActivities = async (leadId) => {
    const { data } = await supabase
      .from("lead_activities")
      .select("*")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false });

    setActivities(data || []);
  };

  // 🔥 Notiz speichern
  const saveNote = async () => {
    if (!selectedLead || !note) return;

    await supabase.from("lead_activities").insert({
      lead_id: selectedLead.id,
      user_id: user.id,
      activity_type: "note",
      body: note,
    });

    setNote("");

    loadActivities(selectedLead.id);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Leadflow Pro</h1>

      {/* LEADS */}
      <h2>Leads</h2>

      {leads.map((lead) => (
        <div
          key={lead.id}
          onClick={() => {
            setSelectedLead(lead);
            loadActivities(lead.id);
          }}
          style={{
            border: "1px solid #333",
            padding: 10,
            marginBottom: 10,
            cursor: "pointer",
          }}
        >
          <strong>{lead.full_name}</strong>
          <br />
          {lead.email}
        </div>
      ))}

      {/* DETAILS */}
      {selectedLead && (
        <div style={{ marginTop: 30 }}>
          <h2>{selectedLead.full_name}</h2>

          <p>Status: {selectedLead.status}</p>

          {/* 🔥 NOTIZ */}
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Neue Notiz..."
            style={{ width: "100%", height: 80 }}
          />

          <button onClick={saveNote}>Notiz speichern</button>

          {/* 🔥 AKTIVITÄTEN */}
          <h3 style={{ marginTop: 30 }}>Verlauf</h3>

          {activities.map((a) => (
            <div
              key={a.id}
              style={{
                borderBottom: "1px solid #444",
                padding: 10,
              }}
            >
              <strong>{a.activity_type}</strong>
              <br />
              {a.body}
              <br />
              <small>{new Date(a.created_at).toLocaleString()}</small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
