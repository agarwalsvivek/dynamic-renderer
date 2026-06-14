import React from 'react';
import { BadgeVariant, CellType, ColumnSchema } from '../types';

// ─── Badge ────────────────────────────────────────────────────────────────────

const BADGE_STYLES: Record<BadgeVariant, React.CSSProperties> = {
  success: { background: '#E1F5EE', color: '#085041' },
  danger:  { background: '#FCEBEB', color: '#791F1F' },
  warning: { background: '#FAEEDA', color: '#633806' },
  info:    { background: '#E6F1FB', color: '#0C447C' },
  gray:    { background: '#F1EFE8', color: '#444441' },
};

const badgeStyle: React.CSSProperties = {
  display: 'inline-block',
  fontSize: 11,
  padding: '2px 8px',
  borderRadius: 10,
  fontWeight: 500,
};

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
    <span style={{ color: up ? '#1D9E75' : '#D85A30', fontWeight: 500 }}>
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
  return <span style={{ ...badgeStyle, ...BADGE_STYLES[variant] }}>{val}</span>;
}

export function ProgressCell({ value }: { value: unknown }): React.ReactElement {
  const v = Math.min(100, Math.max(0, parseFloat(String(value))));
  const color = v >= 75 ? '#1D9E75' : v >= 50 ? '#BA7517' : '#D85A30';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ flex: 1, height: 5, borderRadius: 3, background: 'rgba(136,135,128,0.2)', overflow: 'hidden', minWidth: 40 }}>
        <div style={{ width: `${v}%`, height: 5, borderRadius: 3, background: color }} />
      </div>
      <span style={{ fontSize: 11, color: '#888780', minWidth: 28 }}>{Math.round(v)}%</span>
    </div>
  );
}

export function SparklineCell({ value }: { value: unknown }): React.ReactElement {
  const arr = Array.isArray(value) ? (value as number[]) : [];
  if (!arr.length) return <span style={{ color: '#888780' }}>—</span>;
  const mn = Math.min(...arr);
  const mx = Math.max(...arr);
  const range = mx - mn || 1;
  const trend = arr[arr.length - 1] >= arr[0] ? '#1D9E75' : '#D85A30';
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: 22 }}>
      {arr.map((v, i) => (
        <div
          key={i}
          style={{
            width: 5,
            height: Math.round(((v - mn) / range) * 18 + 4),
            borderRadius: 1,
            background: trend,
          }}
        />
      ))}
    </div>
  );
}

export function AvatarTextCell({ value }: { value: unknown }): React.ReactElement {
  const name = String(value ?? '');
  const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
      <div
        style={{
          width: 24, height: 24, borderRadius: '50%',
          background: '#E6F1FB', color: '#0C447C',
          fontSize: 10, fontWeight: 500,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {initials}
      </div>
      <span>{name}</span>
    </div>
  );
}

export function DateCell({ value }: { value: unknown }): React.ReactElement {
  try {
    const d = new Date(String(value));
    return (
      <span style={{ color: '#888780' }}>
        {d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
      </span>
    );
  } catch {
    return <span>{String(value)}</span>;
  }
}

export function LinkBtnCell({ col }: { col: ColumnSchema }): React.ReactElement {
  return (
    <span style={{ color: '#185FA5', cursor: 'pointer', fontSize: 11, textDecoration: 'underline', textUnderlineOffset: 2 }}>
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
