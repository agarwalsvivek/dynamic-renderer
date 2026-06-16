import React from "react";
import { ActionEvent, Manifest } from "../types";
import { DataTable } from "./DataTable";
import { ChartRenderer } from "./ChartRenderer";
import styles from "./DynamicRenderer.module.scss";

interface DynamicRendererProps {
  /** The manifest JSON from your LLM or API. */
  manifest: Manifest;
  /**
   * Callback fired whenever the user clicks a cell with an action.
   * Wire this to your routing/modal/filter system.
   */
  onAction?: (event: ActionEvent) => void;
  /** Optional title override. Falls back to manifest.title. */
  title?: string;
  /** Show a debug panel with the raw manifest. Default: false. */
  showDebug?: boolean;
}

/**
 * DynamicRenderer
 *
 * The top-level schema-driven renderer. Pass a Manifest and it renders
 * the appropriate UI: DataTable for renderType="table", ChartRenderer
 * for renderType="chart".
 *
 * Usage:
 *   const manifest = await fetchManifestFromLLM(userQuery);
 *   <DynamicRenderer manifest={manifest} onAction={handleAction} />
 */
export const DynamicRenderer: React.FC<DynamicRendererProps> = ({
  manifest,
  onAction,
  title,
  showDebug = false,
}) => {
  const displayTitle = title ?? manifest.title;

  return (
    <div className={styles.root}>
      {/* Header */}
      {displayTitle && (
        <div className={styles.header}>
          <h2 className={styles.title}>{displayTitle}</h2>
          <span className={styles.renderTypeBadge}>{manifest.renderType}</span>
        </div>
      )}

      {/* Route to correct renderer */}
      {manifest.renderType === "table" && (
        <DataTable manifest={manifest} onAction={onAction} />
      )}

      {manifest.renderType === "chart" && <ChartRenderer manifest={manifest} />}

      {/* Unknown type fallback */}
      {manifest.renderType !== "table" && manifest.renderType !== "chart" && (
        <div className={styles.unknownType}>
          Unknown renderType: "{(manifest as Manifest).renderType}"
        </div>
      )}

      {/* Debug panel */}
      {showDebug && (
        <details className={styles.debugPanel}>
          <summary className={styles.debugSummary}>Raw manifest</summary>
          <pre className={styles.debugPre}>
            {JSON.stringify(manifest, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
};
