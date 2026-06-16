import React from 'react';
import { BadgeVariant, CellType, ColumnSchema } from '../types';
import styles from './cell-renderer.module.scss';

// ─── Individual cell renderers ────────────────────────────────────────────────

export function TextCell({ value }: { value: unknown }): React.ReactElement {
  return <span>{String(value ?? '')}</span>;
}

export function CurrencyCell({ value }: { value: unknown }): React.ReactElement {
  const num = parseFloat(String(value));
  return (
    <span>
      ${isNaN(num) ? '—' : num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </span>
  );
}

export function NumberCell({ value }: { value: unknown }): React.ReactElement {
  const num = parseFloat(String(value));
  return <span>{isNaN(num) ? '—' : num.toLocaleString()}</span>;
}

export function PercentChangeCell({ value }: { value: unknown }): React.ReactElement {
  const v = parseFloat(String(value));
  const up = v >= 0;
  return (
    <span className={up ? styles.percentUp : styles.percentDown}>
      {up ? '▲' : '▼'} {Math.abs(v * 100).toFixed(2)}%
    </span>
  );
}

export function BadgeCell({
  value,
  col,
}: {
  value: unknown;
  col: ColumnSchema;
}): React.ReactElement {
  const val = String(value ?? '');
  const variant: BadgeVariant = (col.badgeMap?.[val] as BadgeVariant) ?? 'gray';
  return <span className={`${styles.badge} ${styles[variant]}`}>{val}</span>;
}

export function ProgressCell({ value }: { value: unknown }): React.ReactElement {
  const v = Math.min(100, Math.max(0, parseFloat(String(value))));
  const fillClass = v >= 75 ? styles.high : v >= 50 ? styles.mid : styles.low;
  return (
    <div className={styles.progressCell}>
      <div className={styles.progressTrack}>
        <div className={`${styles.progressFill} ${fillClass}`} style={{ width: `${v}%` }} />
      </div>
      <span className={styles.progressLabel}>{Math.round(v)}%</span>
    </div>
  );
}

export function SparklineCell({ value }: { value: unknown }): React.ReactElement {
  const arr = Array.isArray(value) ? (value as number[]) : [];
  if (!arr.length) return <span className={styles.sparklineEmpty}>—</span>;
  const mn = Math.min(...arr);
  const mx = Math.max(...arr);
  const range = mx - mn || 1;
  const trendClass = arr[arr.length - 1] >= arr[0] ? styles.up : styles.down;
  return (
    <div className={styles.sparklineCell}>
      {arr.map((v, i) => (
        <div
          key={i}
          className={`${styles.sparklineBar} ${trendClass}`}
          style={{ height: Math.round(((v - mn) / range) * 18 + 4) }}
        />
      ))}
    </div>
  );
}

export function AvatarTextCell({ value }: { value: unknown }): React.ReactElement {
  const name = String(value ?? '');
  const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div className={styles.avatarCell}>
      <div className={styles.avatar}>{initials}</div>
      <span>{name}</span>
    </div>
  );
}

export function DateCell({ value }: { value: unknown }): React.ReactElement {
  try {
    const d = new Date(String(value));
    return (
      <span className={styles.dateText}>
        {d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
      </span>
    );
  } catch {
    return <span>{String(value)}</span>;
  }
}

export function LinkBtnCell({ col }: { col: ColumnSchema }): React.ReactElement {
  return (
    <span className={styles.linkBtn}>
      {col.label2 ?? 'View'}
    </span>
  );
}

// ─── Renderer registry ────────────────────────────────────────────────────────

type CellRendererProps = {
  value: unknown;
  col: ColumnSchema;
  row: Record<string, unknown>;
};

const RENDERERS: Record<CellType, React.FC<CellRendererProps>> = {
  text:           ({ value }) => <TextCell value={value} />,
  currency:       ({ value }) => <CurrencyCell value={value} />,
  number:         ({ value }) => <NumberCell value={value} />,
  percent_change: ({ value }) => <PercentChangeCell value={value} />,
  badge:          ({ value, col }) => <BadgeCell value={value} col={col} />,
  progress:       ({ value }) => <ProgressCell value={value} />,
  sparkline:      ({ value }) => <SparklineCell value={value} />,
  avatar_text:    ({ value }) => <AvatarTextCell value={value} />,
  date:           ({ value }) => <DateCell value={value} />,
  link_btn:       ({ col }) => <LinkBtnCell col={col} />,
};

export function CellRenderer({ value, col, row }: CellRendererProps): React.ReactElement {
  const Renderer = RENDERERS[col.type] ?? RENDERERS['text'];
  return <Renderer value={value} col={col} row={row} />;
}
