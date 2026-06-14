import React from 'react';
import { ActionEvent, Manifest } from '../types';
import { DataTable } from './DataTable';
import { ChartRenderer } from './ChartRenderer';

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
    <div style={{ fontFamily: 'var(--font-sans, system-ui, sans-serif)' }}>
      {/* Header */}
      {displayTitle && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <h2 style={{ fontSize: 15, fontWeight: 500, margin: 0 }}>{displayTitle}</h2>
          <span style={{
            fontSize: 11, padding: '2px 10px', borderRadius: 20,
            background: '#E6F1FB', color: '#0C447C',
            border: '0.5px solid #185FA5',
          }}>
            {manifest.renderType}
          </span>
        </div>
      )}

      {/* Route to correct renderer */}
      {manifest.renderType === 'table' && (
        <DataTable manifest={manifest} onAction={onAction} />
      )}

      {manifest.renderType === 'chart' && (
        <ChartRenderer manifest={manifest} />
      )}

      {/* Unknown type fallback */}
      {manifest.renderType !== 'table' && manifest.renderType !== 'chart' && (
        <div style={{ padding: 20, color: '#D85A30', fontSize: 13 }}>
          Unknown renderType: "{(manifest as Manifest).renderType}"
        </div>
      )}

      {/* Debug panel */}
      {showDebug && (
        <details style={{ marginTop: 16 }}>
          <summary style={{ fontSize: 11, color: '#888780', cursor: 'pointer', userSelect: 'none' }}>
            Raw manifest
          </summary>
          <pre style={{
            fontSize: 11, background: '#F1EFE8', padding: 12, borderRadius: 8,
            overflow: 'auto', maxHeight: 300, marginTop: 6,
            color: '#2C2C2A', fontFamily: 'var(--font-mono, monospace)',
          }}>
            {JSON.stringify(manifest, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
};
