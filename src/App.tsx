import { useState } from "react";
import { DynamicRenderer } from "./components/DynamicRenderer";
import { actionRegistry } from "./utils/actionHandlers";
import { PRESETS } from "./data/presets";
import { ActionEvent, Manifest } from "./types";
import styles from "./App.module.scss";

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
    <div className={styles.container}>
      {/* Page title */}
      <div className={styles.headerSection}>
        <h1 className={styles.title}>Dynamic render engine</h1>
        <p className={styles.subtitle}>Schema in → table or chart out</p>
      </div>

      {/* Preset selector */}
      <div className={styles.presetSelector}>
        {presetKeys.map((key) => (
          <button
            key={key}
            onClick={() => handlePreset(key)}
            className={`${styles.presetButton} ${activePreset === key ? styles.active : ""}`}
          >
            {key}
          </button>
        ))}
      </div>

      {/* Two-column: JSON editor + parsed schema */}
      <div className={styles.editorGrid}>
        <div className={styles.editorPanel}>
          <div className={styles.panelHeader}>
            <span>manifest.json</span>
            {jsonError && (
              <span className={styles.errorMessage}>
                ⚠ {jsonError.split("\n")[0]}
              </span>
            )}
          </div>
          <textarea
            value={jsonInput}
            onChange={(e) => handleJsonChange(e.target.value)}
            spellCheck={false}
            className={`${styles.textarea} ${styles.input}`}
          />
        </div>

        <div className={styles.editorPanel}>
          <div className={styles.panelHeader}>
            <span>parsed schema</span>
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
            className={`${styles.textarea} ${styles.readonly}`}
          />
        </div>
      </div>

      {/* Renderer output */}
      <div className={styles.outputSection}>
        <div className={styles.outputLabel}>
          output · {manifest.renderType} · {manifest.data.length} rows
        </div>
        <DynamicRenderer
          manifest={manifest}
          onAction={handleAction}
          showDebug={false}
        />
      </div>

      {/* Action log */}
      <div className={styles.logSection}>
        <div className={styles.logHeader}>action log</div>
        <div className={styles.logContent}>
          {log.length === 0 ? (
            <div className={styles.logEmpty}>— waiting for cell actions —</div>
          ) : (
            log.map((entry) => (
              <div key={entry.id} className={styles.logEntry}>
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
