import { useState } from "react";
import { DynamicRenderer } from "./components/DynamicRenderer";
import { actionRegistry } from "./utils/actionHandlers";
import { PRESETS } from "./data/presets";
import { ActionEvent, Manifest } from "./types";

// ─── Register custom action handlers (override defaults) ───────────────────────
actionRegistry.register("drilldown", ({ event, row }) => {
  alert(`[${event}] Clicked row: ${JSON.stringify(row, null, 2)}`);
});

actionRegistry.register("modal", ({ event, row }) => {
  alert(`[${event}] Open modal for: ${row.name ?? row.id}`);
});

// ─── Action log ───────────────────────────────────────────────────────────────
interface LogEntry {
  id: number;
  timestamp: string;
  type: string;
  event: string;
  target: string;
}

let logId = 0;

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const presetKeys = Object.keys(PRESETS) as (keyof typeof PRESETS)[];
  const [activePreset, setActivePreset] = useState<string>("funds");
  const [manifest, setManifest] = useState<Manifest>(PRESETS["funds"]);
  const [jsonInput, setJsonInput] = useState(
    JSON.stringify(PRESETS["funds"], null, 2),
  );
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);

  const handlePreset = (key: string) => {
    setActivePreset(key);
    const m = PRESETS[key as keyof typeof PRESETS];
    setManifest(m);
    setJsonInput(JSON.stringify(m, null, 2));
    setJsonError(null);
  };

  const handleJsonChange = (raw: string) => {
    setJsonInput(raw);
    try {
      const parsed = JSON.parse(raw) as Manifest;
      setManifest(parsed);
      setJsonError(null);
    } catch (e) {
      setJsonError((e as Error).message);
    }
  };

  const handleAction = (event: ActionEvent) => {
    setLog((prev) => [
      {
        id: ++logId,
        timestamp: new Date().toLocaleTimeString(),
        type: event.type,
        event: event.event,
        target: String(event.row.name ?? event.row.id ?? "?"),
      },
      ...prev.slice(0, 19),
    ]);
  };

  return (
    <div
      style={{
        maxWidth: 900,
        margin: "0 auto",
        padding: "24px 16px",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {/* Page title */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 500, margin: "0 0 4px" }}>
          Dynamic render engine
        </h1>
        <p style={{ fontSize: 13, color: "#888780", margin: 0 }}>
          Schema in → table or chart out
        </p>
      </div>

      {/* Preset selector */}
      <div
        style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}
      >
        {presetKeys.map((key) => (
          <button
            key={key}
            onClick={() => handlePreset(key)}
            style={{
              fontSize: 12,
              padding: "5px 14px",
              borderRadius: 20,
              cursor: "pointer",
              border:
                activePreset === key
                  ? "0.5px solid #185FA5"
                  : "0.5px solid rgba(136,135,128,0.3)",
              background: activePreset === key ? "#E6F1FB" : "transparent",
              color: activePreset === key ? "#0C447C" : "#888780",
              fontFamily: "inherit",
            }}
          >
            {key}
          </button>
        ))}
      </div>

      {/* Two-column: JSON editor + parsed schema */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            border: "0.5px solid rgba(136,135,128,0.3)",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: "#888780",
              padding: "6px 12px",
              borderBottom: "0.5px solid rgba(136,135,128,0.15)",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>manifest.json</span>
            {jsonError && (
              <span style={{ color: "#D85A30" }}>
                ⚠ {jsonError.split("\n")[0]}
              </span>
            )}
          </div>
          <textarea
            value={jsonInput}
            onChange={(e) => handleJsonChange(e.target.value)}
            spellCheck={false}
            style={{
              width: "100%",
              border: "none",
              outline: "none",
              resize: "none",
              fontSize: 11,
              fontFamily: "monospace",
              padding: "10px 12px",
              background: "#f9f9f7",
              color: "#2C2C2A",
              height: 200,
              display: "block",
            }}
          />
        </div>

        <div
          style={{
            border: "0.5px solid rgba(136,135,128,0.3)",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: "#888780",
              padding: "6px 12px",
              borderBottom: "0.5px solid rgba(136,135,128,0.15)",
            }}
          >
            parsed schema
          </div>
          <textarea
            readOnly
            value={JSON.stringify(
              {
                renderType: manifest.renderType,
                columns: (
                  manifest as {
                    columns?: {
                      key: string;
                      type: string;
                      action?: { type: string } | null;
                    }[];
                  }
                ).columns?.map((c) => ({
                  key: c.key,
                  type: c.type,
                  action: c.action?.type ?? null,
                })),
                rowCount: manifest.data?.length,
                yAxes: (manifest as { yAxes?: { key: string }[] }).yAxes?.map(
                  (a) => a.key,
                ),
              },
              null,
              2,
            )}
            style={{
              width: "100%",
              border: "none",
              outline: "none",
              resize: "none",
              fontSize: 11,
              fontFamily: "monospace",
              padding: "10px 12px",
              background: "#f9f9f7",
              color: "#888780",
              height: 200,
              display: "block",
            }}
          />
        </div>
      </div>

      {/* Renderer output */}
      <div
        style={{
          border: "0.5px solid rgba(136,135,128,0.15)",
          borderRadius: 12,
          padding: "12px 16px",
          marginBottom: 16,
        }}
      >
        <div style={{ fontSize: 11, color: "#888780", marginBottom: 10 }}>
          output · {manifest.renderType} · {manifest.data.length} rows
        </div>
        <DynamicRenderer
          manifest={manifest}
          onAction={handleAction}
          showDebug={false}
        />
      </div>

      {/* Action log */}
      <div
        style={{
          border: "0.5px solid rgba(136,135,128,0.15)",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            fontSize: 11,
            color: "#888780",
            padding: "6px 12px",
            borderBottom: "0.5px solid rgba(136,135,128,0.15)",
          }}
        >
          action log
        </div>
        <div
          style={{
            maxHeight: 130,
            overflowY: "auto",
            padding: "6px 12px",
            background: "#f9f9f7",
            fontFamily: "monospace",
            fontSize: 11,
          }}
        >
          {log.length === 0 ? (
            <div style={{ color: "#888780" }}>— waiting for cell actions —</div>
          ) : (
            log.map((entry) => (
              <div
                key={entry.id}
                style={{ color: "#185FA5", margin: "2px 0", lineHeight: 1.5 }}
              >
                {entry.timestamp} [{entry.type}] {entry.event} → "{entry.target}
                "
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
