import { ActionEvent, ActionType } from '../types';

export type ActionHandler = (event: ActionEvent) => void;

// ─── Default handler implementations ─────────────────────────────────────────
// Each handler receives the full ActionEvent and can be overridden by consumers.

const defaultHandlers: Record<ActionType, ActionHandler> = {
  drilldown: ({ event, row }) => {
    console.log(`[drilldown] ${event}`, row);
  },

  filter: ({ event, row, column }) => {
    console.log(`[filter] ${event} → ${column.key}: "${row[column.key]}"`);
  },

  modal: ({ event, row }) => {
    console.log(`[modal] ${event}`, row);
  },

  copy: ({ row, column }) => {
    const val = String(row[column.key] ?? '');
    navigator.clipboard?.writeText(val).catch(() => {});
    console.log(`[copy] copied "${val}"`);
  },

  api: ({ event, row, column }) => {
    console.log(`[api] POST ${event}`, { id: row[column.key] });
  },
};

// ─── Handler registry class ───────────────────────────────────────────────────
// Consumers can override individual handlers or add new ones at runtime.

class ActionHandlerRegistry {
  private handlers: Record<string, ActionHandler> = { ...defaultHandlers };

  /** Register or override a handler for a given action type. */
  register(type: ActionType | string, handler: ActionHandler): void {
    this.handlers[type] = handler;
  }

  /** Dispatch an action event to the appropriate handler. */
  dispatch(event: ActionEvent): void {
    const handler = this.handlers[event.type];
    if (handler) {
      handler(event);
    } else {
      console.warn(`[ActionRegistry] No handler for action type: "${event.type}"`);
    }
  }
}

export const actionRegistry = new ActionHandlerRegistry();

// ─── React hook for dispatching actions ───────────────────────────────────────

import { useCallback } from 'react';
import { ColumnSchema } from '../types';

export function useActionDispatch(
  onAction?: (event: ActionEvent) => void
) {
  return useCallback(
    (col: ColumnSchema, row: Record<string, unknown>) => {
      if (!col.action) return;
      const actionEvent: ActionEvent = {
        type: col.action.type,
        event: col.action.event,
        row,
        column: col,
      };
      // Call consumer callback first (for logging, UI updates, etc.)
      onAction?.(actionEvent);
      // Then dispatch to the registry
      actionRegistry.dispatch(actionEvent);
    },
    [onAction]
  );
}
