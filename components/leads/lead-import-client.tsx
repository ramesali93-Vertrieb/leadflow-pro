"use client";

import Link from "next/link";
import { CSSProperties, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "../../lib/supabase-browser";

type ParsedLead = {
  full_name: string;
  salutation: string | null;
  email: string | null;
  phone: string | null;
  street: string | null;
  postal_code: string | null;
  city: string | null;
  address: string | null;
  status: string;
  priority: string;
  next_step: string;
  due_date: string;
  base_note: string | null;
  source: string | null;
  project_start: string | null;
  roof_type: string | null;
  storage_interest: string | null;
  financing: string | null;
  offer_amount: number;
  win_chance: number;
};

type ParseResult = {
  leads: ParsedLead[];
  warnings: string[];
  errors: string[];
};

// =======================
// UI STYLES
// =======================

const pageStyle: CSSProperties = { display: "grid", gap: "24px" };
const cardStyle: CSSProperties = { padding: "24px" };

const textareaStyle: CSSProperties = {
  width: "100%",
  minHeight: "320px",
  padding: "16px",
  borderRadius: "18px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.05)",
  color: "#f4f4f5",
  backdropFilter: "blur(16px)",
};

const primaryButton: CSSProperties = {
  padding: "12px 18px",
  borderRadius: "999px",
  border: "none",
  background: "white",
  fontWeight: 700,
  cursor: "pointer",
};

// =======================
// HELPERS
// =======================

function normalizeKey(value: string) {
  return value
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[?]/g, "")
    .trim();
}

function cleanupValue(v: string) {
  return v.trim().replace(/\.$/, "");
}

function getDefaultDueDate() {
  const d = new Date();
  d.setDate(d.getDate() + 3);
  return d.toISOString().split("T")[0];
}

// =======================
// BLOCK SPLIT FIX
// =======================

function splitBlocks(raw: string) {
  return raw
    .replace(/\r\n/g, "\n")
    .replace(/\nLead ID:/gi, " Lead ID:")
    .split(/\n-{3,}\n+/)
    .map((b) => b.trim())
    .filter(Boolean);
}

function extractFieldMap(block: string) {
  const map = new Map<string, string>();

  block.split("\n").forEach((line) => {
    const match = line.match(/^([^:]+):\s*(.*)$/);
    if (!match) return;

    const key = normalizeKey(match[1]);
    const value = cleanupValue(match[2]);
    map.set(key, value);
  });

  return map;
}

// =======================
// PARSER
// =======================

function parseBlock(block: string, index: number) {
  const map = extractFieldMap(block);

  if (map.size === 0) return { lead: null, warnings: [], errors: [], ignored: true };

  const isCRM = map.has("vorname") || map.has("strasse");

  let full_name = "";
  let salutation = null;
  let email = map.get("emailadresse") || map.get("e-mail") || null;
  let phone = map.get("telefonnummer") || map.get("telefon") || null;

  let street = null;
  let postal = null;
  let city = null;
  let address = null;

  if (isCRM) {
    full_name = `${map.get("vorname") || ""} ${map.get("name") || ""}`.trim();
    salutation = map.get("anrede") || null;

    street = map.get("strasse") || null;
    postal = map.get("plz") || null;
    city = map.get("ort") || null;

    address = `${street || ""}, ${postal || ""} ${city || ""}`.trim();
  } else {
    const rawName = map.get("name") || "";
    full_name = rawName.replace(/^herr |^frau /i, "").trim();

    if (rawName.toLowerCase().includes("herr")) salutation = "Herr";
    if (rawName.toLowerCase().includes("frau")) salutation = "Frau";

    if (map.get("adresse")) address = map.get("adresse")!;
  }

  const errors: string[] = [];
  const warnings: string[] = [];

  if (!full_name) errors.push(`Block ${index + 1}: Kein Name erkannt.`);
  if (!email && !phone)
    warnings.push(`Block ${index + 1}: Weder E-Mail noch Telefon gefunden.`);

  return {
    lead: {
      full_name,
      salutation,
      email,
      phone,
      street,
      postal_code: postal,
      city,
      address,
      status: "Neu",
      priority: "Mittel",
      next_step: "Erstkontakt",
      due_date: getDefaultDueDate(),
      base_note: block,
      source: "Import",
      project_start: map.get("gewuenschter projektstart") || null,
      roof_type: map.get("dachform") || null,
      storage_interest: map.get("stromspeicher") || null,
      financing: map.get("finanzierungsmodell") || null,
      offer_amount: 0,
      win_chance: 0,
    },
    warnings,
    errors,
    ignored: false,
  };
}

function parseLeadText(raw: string): ParseResult {
  const blocks = splitBlocks(raw);

  const leads: ParsedLead[] = [];
  const warnings: string[] = [];
  const errors: string[] = [];

  blocks.forEach((b, i) => {
    const r = parseBlock(b, i);

    if (r.ignored) return;

    warnings.push(...r.warnings);
    errors.push(...r.errors);

    if (r.lead && r.errors.length === 0) leads.push(r.lead);
  });

  return { leads, warnings, errors };
}

// =======================
// COMPONENT
// =======================

export function LeadImportClient() {
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();

  const [rawText, setRawText] = useState("");
  const [preview, setPreview] = useState<ParseResult | null>(null);

  async function handleImport() {
    if (!preview?.leads.length) return;

    await supabase.from("leads").insert(preview.leads);

    router.push("/leads");
    router.refresh();
  }

  return (
    <div style={pageStyle}>
      <section className="card" style={cardStyle}>
        <h2>Lead Import</h2>

        <textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          style={textareaStyle}
        />

        <button onClick={() => setPreview(parseLeadText(rawText))} style={primaryButton}>
          Vorschau
        </button>
      </section>

      {preview && (
        <section className="card" style={cardStyle}>
          <h2>Preview</h2>

          <div>{preview.leads.length} Leads erkannt</div>

          {preview.errors.map((e, i) => (
            <div key={i} style={{ color: "red" }}>
              {e}
            </div>
          ))}

          {preview.leads.map((l, i) => (
            <div key={i}>
              <strong>{l.full_name}</strong>
              <div>{l.email}</div>
            </div>
          ))}

          <button onClick={handleImport} style={primaryButton}>
            Importieren
          </button>
        </section>
      )}
    </div>
  );
}
