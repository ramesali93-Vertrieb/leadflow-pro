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

const pageStyle: CSSProperties = {
  display: "grid",
  gap: "24px",
};

const cardStyle: CSSProperties = {
  padding: "24px",
};

const sectionTitleStyle: CSSProperties = {
  marginTop: 0,
  marginBottom: "18px",
  fontSize: "clamp(28px, 4vw, 38px)",
  lineHeight: 1.05,
  letterSpacing: "-0.04em",
};

const textStyle: CSSProperties = {
  fontSize: "15px",
  lineHeight: 1.7,
  color: "rgba(255,255,255,0.62)",
};

const textareaStyle: CSSProperties = {
  width: "100%",
  minHeight: "320px",
  padding: "16px",
  borderRadius: "18px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.05)",
  color: "#f4f4f5",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  outline: "none",
  fontSize: "15px",
  lineHeight: 1.6,
  resize: "vertical",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
};

const rowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "12px",
};

const primaryButtonStyle: CSSProperties = {
  minHeight: "48px",
  padding: "0 18px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.92)",
  color: "#09090b",
  fontWeight: 700,
  fontSize: "15px",
  cursor: "pointer",
};

const secondaryButtonStyle: CSSProperties = {
  minHeight: "48px",
  padding: "0 18px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.06)",
  color: "#f4f4f5",
  fontWeight: 700,
  fontSize: "15px",
  cursor: "pointer",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
};

const helperStyle: CSSProperties = {
  fontSize: "14px",
  lineHeight: 1.6,
  color: "rgba(255,255,255,0.56)",
};

const blockStyle: CSSProperties = {
  padding: "14px 16px",
  borderRadius: "16px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.04)",
};

const errorStyle: CSSProperties = {
  ...blockStyle,
  color: "#fecdd3",
  background: "rgba(244,63,94,0.10)",
  borderColor: "rgba(244,63,94,0.18)",
};

const warningStyle: CSSProperties = {
  ...blockStyle,
  color: "#fde68a",
  background: "rgba(245,158,11,0.10)",
  borderColor: "rgba(245,158,11,0.18)",
};

const successStyle: CSSProperties = {
  ...blockStyle,
  color: "#bbf7d0",
  background: "rgba(34,197,94,0.10)",
  borderColor: "rgba(34,197,94,0.18)",
};

const previewGridStyle: CSSProperties = {
  display: "grid",
  gap: "16px",
};

const previewCardStyle: CSSProperties = {
  padding: "18px",
  borderRadius: "20px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.04)",
  backdropFilter: "blur(18px)",
  WebkitBackdropFilter: "blur(18px)",
};

const previewTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "20px",
  fontWeight: 700,
  lineHeight: 1.2,
  letterSpacing: "-0.03em",
};

const previewMetaStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "14px 18px",
  marginTop: "14px",
};

const fieldLabelStyle: CSSProperties = {
  display: "block",
  marginBottom: "6px",
  fontSize: "13px",
  fontWeight: 700,
  color: "rgba(255,255,255,0.52)",
};

const fieldValueStyle: CSSProperties = {
  fontSize: "15px",
  lineHeight: 1.5,
  overflowWrap: "anywhere",
  wordBreak: "break-word",
};

function normalizeKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[?]/g, "")
    .replace(/\s+/g, " ");
}

function cleanupValue(value: string) {
  return value.trim().replace(/\s+/g, " ").replace(/\.$/, "").trim();
}

function getDefaultDueDate() {
  const date = new Date();
  date.setDate(date.getDate() + 3);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function splitBlocks(raw: string) {
  return raw
    .replace(/\r\n/g, "\n")
    .split(/\n-{3,}\n+/)
    .map((block) => block.trim())
    .filter(Boolean);
}

function extractFieldMap(block: string) {
  const lines = block
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const map = new Map<string, string>();

  for (const line of lines) {
    const match = line.match(/^([^:]+):\s*(.*)$/);
    if (!match) continue;

    const key = normalizeKey(match[1]);
    const value = cleanupValue(match[2]);
    map.set(key, value);
  }

  return map;
}

function isIgnorableMetaBlock(block: string, map: Map<string, string>) {
  const cleanedBlock = block.trim();

  if (!cleanedBlock) return true;

  const keys = Array.from(map.keys());

  if (keys.length === 0) {
    return /^lead[\s_]?id\s*:/i.test(cleanedBlock);
  }

  const allowedMetaKeys = new Set(["lead id", "lead_id"]);
  return keys.every((key) => allowedMetaKeys.has(key));
}

function parseGermanAddress(address: string) {
  const cleaned = cleanupValue(address);

  const parts = cleaned.split(",").map((part) => part.trim()).filter(Boolean);

  let street: string | null = null;
  let postalCode: string | null = null;
  let city: string | null = null;

  if (parts.length > 0) {
    street = parts[0] || null;
  }

  const locationPart = parts[1] || "";
  const locationMatch = locationPart.match(/(\d{5})\s+(.+?)(?:\s+[A-Z]{2})?$/);

  if (locationMatch) {
    postalCode = locationMatch[1];
    city = locationMatch[2].trim();
  }

  return {
    address: cleaned,
    street,
    postalCode,
    city,
  };
}

function normalizeBooleanLike(value: string | null) {
  if (!value) return null;
  const normalized = normalizeKey(value);

  if (normalized.includes("ja")) return "Ja";
  if (normalized.includes("nein")) return "Nein";
  return cleanupValue(value);
}

function extractEmail(map: Map<string, string>) {
  return map.get("emailadresse") || map.get("e-mail") || map.get("email") || null;
}

function extractPhone(map: Map<string, string>) {
  return (
    map.get("contact_mobile_e164") ||
    map.get("telefonnummer") ||
    map.get("telefon") ||
    map.get("contact_mobile") ||
    map.get("contact_tel_e164") ||
    map.get("contact_tel_normalized") ||
    null
  );
}

function extractSalutation(map: Map<string, string>, rawName: string | null) {
  const explicit = map.get("anrede");
  if (explicit) {
    if (explicit.toLowerCase().includes("frau")) return "Frau";
    if (explicit.toLowerCase().includes("herr")) return "Herr";
    return cleanupValue(explicit);
  }

  if (rawName) {
    if (rawName.toLowerCase().startsWith("frau ")) return "Frau";
    if (rawName.toLowerCase().startsWith("herr ")) return "Herr";
  }

  return null;
}

function extractFullName(map: Map<string, string>) {
  const firstName = map.get("vorname");
  const explicitName = map.get("name");

  if (firstName || explicitName) {
    const first = cleanupValue(firstName || "");
    let last = cleanupValue(explicitName || "");

    if (last.toLowerCase().startsWith("frau ")) {
      last = last.slice(5).trim();
    }

    if (last.toLowerCase().startsWith("herr ")) {
      last = last.slice(5).trim();
    }

    const combined = [first, last].filter(Boolean).join(" ").trim();
    if (combined) return combined;
  }

  if (explicitName) {
    const name = cleanupValue(explicitName)
      .replace(/^frau\s+/i, "")
      .replace(/^herr\s+/i, "")
      .trim();

    if (name) return name;
  }

  return "";
}

function extractProjectStart(map: Map<string, string>) {
  return map.get("gewuenschter projektstart") || map.get("umsetzung_zeitraum") || null;
}

function extractRoofType(map: Map<string, string>) {
  return map.get("dachform") || null;
}

function extractStorageInterest(map: Map<string, string>) {
  return (
    normalizeBooleanLike(map.get("stromspeicher gewuenscht")) ||
    normalizeBooleanLike(map.get("stromspeicher")) ||
    null
  );
}

function extractFinancing(map: Map<string, string>) {
  return map.get("finanzierungswunsch") || map.get("finanzierungsmodell") || null;
}

function collectBaseNote(map: Map<string, string>) {
  const noteEntries: Array<[string, string]> = [];

  const keysForNote = [
    "anfragedetails",
    "sonstige kommentare",
    "anmerkung von ajaska",
    "dachgroesse",
    "dachoberflaeche",
    "stromverbrauch",
    "stromverbrauch_range",
    "personen_im_haushalt",
    "installationsort",
    "flaeche",
    "nutzen",
    "interesse_stromtarif",
    "verschattung",
    "dacheindeckung_vorhanden_typ",
    "dachgroesse_in_qm",
    "ist_eigentuemer",
    "termin_erwuenscht",
    "lead id",
    "lead_id",
  ];

  for (const key of keysForNote) {
    const value = map.get(key);
    if (value) {
      noteEntries.push([key, value]);
    }
  }

  if (noteEntries.length === 0) return null;

  return noteEntries.map(([key, value]) => `${key}: ${value}`).join("\n");
}

function parseBlock(
  block: string,
  index: number
): { lead: ParsedLead | null; warnings: string[]; errors: string[]; ignored: boolean } {
  const map = extractFieldMap(block);
  const warnings: string[] = [];
  const errors: string[] = [];

  if (isIgnorableMetaBlock(block, map)) {
    return {
      lead: null,
      warnings: [],
      errors: [],
      ignored: true,
    };
  }

  const fullName = extractFullName(map);
  const salutation = extractSalutation(map, map.get("name") || null);
  const email = extractEmail(map);
  const phone = extractPhone(map);

  let street: string | null = map.get("strasse") || null;
  let postalCode: string | null = map.get("plz") || null;
  let city: string | null = map.get("ort") || null;
  let address: string | null = null;

  if (map.get("adresse")) {
    const parsedAddress = parseGermanAddress(map.get("adresse") || "");
    address = parsedAddress.address;
    street = street || parsedAddress.street;
    postalCode = postalCode || parsedAddress.postalCode;
    city = city || parsedAddress.city;
  } else {
    const builtAddress = [street, [postalCode, city].filter(Boolean).join(" ")]
      .filter(Boolean)
      .join(", ");
    address = builtAddress || null;
  }

  if (!fullName) {
    errors.push(`Block ${index + 1}: Kein Name erkannt.`);
  }

  if (!email && !phone) {
    warnings.push(`Block ${index + 1}: Weder E-Mail noch Telefon gefunden.`);
  }

  const lead: ParsedLead = {
    full_name: fullName,
    salutation,
    email,
    phone,
    street,
    postal_code: postalCode,
    city,
    address,
    status: "Neu",
    priority: "Mittel",
    next_step: "Erstkontakt",
    due_date: getDefaultDueDate(),
    base_note: collectBaseNote(map),
    source: "Import",
    project_start: extractProjectStart(map),
    roof_type: extractRoofType(map),
    storage_interest: extractStorageInterest(map),
    financing: extractFinancing(map),
    offer_amount: 0,
    win_chance: 0,
  };

  if (errors.length > 0) {
    return {
      lead: null,
      warnings,
      errors,
      ignored: false,
    };
  }

  return {
    lead,
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

  if (blocks.length === 0) {
    return {
      leads: [],
      warnings: [],
      errors: ["Keine importierbaren Lead-Blöcke gefunden."],
    };
  }

  blocks.forEach((block, index) => {
    const result = parseBlock(block, index);

    if (result.ignored) return;

    warnings.push(...result.warnings);
    errors.push(...result.errors);

    if (result.lead) {
      leads.push(result.lead);
    }
  });

  if (leads.length === 0 && errors.length === 0) {
    errors.push("Es konnten keine gültigen Leads erkannt werden.");
  }

  return {
    leads,
    warnings,
    errors,
  };
}

export function LeadImportClient() {
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();

  const [rawText, setRawText] = useState("");
  const [preview, setPreview] = useState<ParseResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importMessage, setImportMessage] = useState("");

  const hasPreviewLeads = (preview?.leads.length ?? 0) > 0;

  const exampleText = useMemo(
    () => `Name: Frau Stefanie Bastian
Telefonnummer: +49 170 8968145
Emailadresse: stefanie.bastian82@gmx.de
Adresse: Oberm Tiergarten 26, 35684 Dillenburg DE
Anfragedetails: Ein-/Zweifamilienhaus - Freistehendes Haus Eigentümer? Ja Anzahl Personen im Haushalt: 4
Dachform: Satteldach
Dachgröße: 50 - 100qm
Dachoberfläche: Ziegel (Ton / Beton)
Stromspeicher gewünscht? Ja
Finanzierungswunsch? Ich bin offen für verschiedene Optionen
Gewünschter Projektstart: So schnell wie möglich
Stromverbrauch: Mehr als 3.500 kWh
Sonstige Kommentare:
-----------------------------------
lead_id: 617848.
Anrede: Herr.
Vorname: Philipp.
Name: Baro.
Straße: Sandgasse 43.
PLZ: 77731.
Ort: Willstätt.
Telefon: +4915237724769.
Anmerkung von Ajaska: mit Stromspeicher ergänzen Eigentümer VOT abgeklärt.
E-Mail: pbaro@hotmail.de.
installationsort: Ein-Zweifamilienhaus.
Dachform: Satteldach.
stromspeicher: Ja.
umsetzung_zeitraum: Umgehend.
finanzierungsmodell: Kaufen.
stromverbrauch: 4400.
personen_im_haushalt: 3.
dacheindeckung_vorhanden_typ: Ziegel.
ist_eigentuemer: Ja.`,
    []
  );

  function handlePreview() {
    setImportMessage("");
    setPreview(parseLeadText(rawText));
  }

  function handleLoadExample() {
    setImportMessage("");
    setRawText(exampleText);
    setPreview(parseLeadText(exampleText));
  }

  async function handleImport() {
    if (!preview || preview.leads.length === 0) {
      setImportMessage("Bitte zuerst eine gültige Vorschau erzeugen.");
      return;
    }

    setIsImporting(true);
    setImportMessage("");

    try {
      const { error } = await supabase.from("leads").insert(preview.leads);

      if (error) {
        throw new Error(error.message);
      }

      setImportMessage(`${preview.leads.length} Lead(s) erfolgreich importiert.`);
      setRawText("");
      setPreview(null);
      router.push("/leads");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unbekannter Fehler beim Import.";
      setImportMessage(message);
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <div style={pageStyle}>
      <section className="card" style={cardStyle}>
        <h2 style={sectionTitleStyle}>Importtext einfügen</h2>

        <div style={textStyle}>
          Füge hier deine Lead-Blöcke aus dem Quellsystem ein. Mehrere Leads können mit einer
          Trennlinie wie <code>-----------------------------------</code> nacheinander eingefügt
          werden.
        </div>

        <div style={{ marginTop: "18px" }}>
          <textarea
            value={rawText}
            onChange={(event) => setRawText(event.target.value)}
            placeholder="Lead-Blöcke hier einfügen..."
            style={textareaStyle}
          />
        </div>

        <div style={{ ...rowStyle, marginTop: "18px" }}>
          <button type="button" onClick={handlePreview} style={primaryButtonStyle}>
            Vorschau erzeugen
          </button>

          <button type="button" onClick={handleLoadExample} style={secondaryButtonStyle}>
            Beispiel laden
          </button>

          <Link href="/leads" className="dashboard-primary-link">
            Zurück zu Leads
          </Link>
        </div>

        <div style={{ ...helperStyle, marginTop: "14px" }}>
          Standardwerte beim Import: Status = Neu, Priorität = Mittel, nächster Schritt =
          Erstkontakt, Fälligkeit = in 3 Tagen.
        </div>
      </section>

      {preview ? (
        <section className="card" style={cardStyle}>
          <h2 style={sectionTitleStyle}>Prüfung & Vorschau</h2>

          <div style={{ display: "grid", gap: "12px", marginBottom: "18px" }}>
            <div style={blockStyle}>{preview.leads.length} gültige Lead(s) erkannt.</div>

            {preview.warnings.map((warning, index) => (
              <div key={`warning-${index}`} style={warningStyle}>
                {warning}
              </div>
            ))}

            {preview.errors.map((error, index) => (
              <div key={`error-${index}`} style={errorStyle}>
                {error}
              </div>
            ))}

            {importMessage ? (
              <div
                style={
                  preview.errors.length === 0 && hasPreviewLeads ? successStyle : errorStyle
                }
              >
                {importMessage}
              </div>
            ) : null}
          </div>

          {hasPreviewLeads ? (
            <>
              <div style={previewGridStyle}>
                {preview.leads.map((lead, index) => (
                  <div key={`${lead.full_name}-${index}`} style={previewCardStyle}>
                    <h3 style={previewTitleStyle}>{lead.full_name}</h3>

                    <div style={previewMetaStyle}>
                      <div>
                        <span style={fieldLabelStyle}>E-Mail</span>
                        <div style={fieldValueStyle}>{lead.email || "—"}</div>
                      </div>

                      <div>
                        <span style={fieldLabelStyle}>Telefon</span>
                        <div style={fieldValueStyle}>{lead.phone || "—"}</div>
                      </div>

                      <div>
                        <span style={fieldLabelStyle}>Adresse</span>
                        <div style={fieldValueStyle}>{lead.address || "—"}</div>
                      </div>

                      <div>
                        <span style={fieldLabelStyle}>Dachform</span>
                        <div style={fieldValueStyle}>{lead.roof_type || "—"}</div>
                      </div>

                      <div>
                        <span style={fieldLabelStyle}>Speicher</span>
                        <div style={fieldValueStyle}>{lead.storage_interest || "—"}</div>
                      </div>

                      <div>
                        <span style={fieldLabelStyle}>Finanzierung</span>
                        <div style={fieldValueStyle}>{lead.financing || "—"}</div>
                      </div>

                      <div>
                        <span style={fieldLabelStyle}>Projektstart</span>
                        <div style={fieldValueStyle}>{lead.project_start || "—"}</div>
                      </div>

                      <div>
                        <span style={fieldLabelStyle}>Fällig</span>
                        <div style={fieldValueStyle}>{lead.due_date}</div>
                      </div>

                      <div>
                        <span style={fieldLabelStyle}>Quelle</span>
                        <div style={fieldValueStyle}>{lead.source || "—"}</div>
                      </div>

                      <div style={{ gridColumn: "1 / -1" }}>
                        <span style={fieldLabelStyle}>Basisnotiz</span>
                        <div style={fieldValueStyle}>{lead.base_note || "—"}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ ...rowStyle, marginTop: "20px" }}>
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={isImporting}
                  style={{
                    ...primaryButtonStyle,
                    opacity: isImporting ? 0.7 : 1,
                    cursor: isImporting ? "not-allowed" : "pointer",
                  }}
                >
                  {isImporting ? "Import läuft..." : "Jetzt importieren"}
                </button>
              </div>
            </>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
