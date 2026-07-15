"use client";

import { useControls, folder, LevaPanel, useCreateStore } from "leva";
import type { Schema } from "leva/dist/declarations/src/types";
import { useEffect, useId, useMemo, useRef } from "react";

/**
 * Schema value types that ParamPanel supports.
 */
export interface SliderParam {
  type: "slider";
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
}

export interface SelectParam {
  type: "select";
  label: string;
  value: string;
  options: string[];
}

export interface BooleanParam {
  type: "boolean";
  label: string;
  value: boolean;
}

export interface ColorParam {
  type: "color";
  label: string;
  value: string;
}

export type ParamDef = SliderParam | SelectParam | BooleanParam | ColorParam;

export interface ParamSchema {
  [key: string]: ParamDef;
}

/** The values object emitted by onChange, keyed by param names */
export type ParamValues<T extends ParamSchema> = {
  [K in keyof T]: T[K] extends SliderParam
    ? number
    : T[K] extends SelectParam
      ? string
      : T[K] extends BooleanParam
        ? boolean
        : T[K] extends ColorParam
          ? string
          : never;
};

interface ParamPanelProps<T extends ParamSchema> {
  /** Parameter definitions */
  schema: T;
  /** Called whenever any parameter changes */
  onChange: (values: ParamValues<T>) => void;
  /** Optional title for the panel */
  title?: string;
  /** If true, panel is collapsed by default */
  collapsed?: boolean;
}

/**
 * Convert our typed schema to leva's expected format.
 */
function toLeva(schema: ParamSchema, title?: string, collapsed?: boolean): Schema {
  // Build a leva-compatible schema object
  const converted: Record<string, Record<string, unknown>> = {};
  for (const [key, def] of Object.entries(schema)) {
    switch (def.type) {
      case "slider":
        converted[key] = {
          value: def.value,
          min: def.min,
          max: def.max,
          step: def.step ?? (def.max - def.min) / 100,
          label: def.label,
        };
        break;
      case "select":
        converted[key] = {
          value: def.value,
          options: def.options,
          label: def.label,
        };
        break;
      case "boolean":
        converted[key] = {
          value: def.value,
          label: def.label,
        };
        break;
      case "color":
        converted[key] = {
          value: def.value,
          label: def.label,
        };
        break;
    }
  }
  if (collapsed && title) {
    return { [title]: folder(converted as Schema, { collapsed: true }) } as Schema;
  }
  return converted as Schema;
}

/**
 * Consistent parameter control panel wrapping leva.
 * Every interactive widget with adjustable numbers uses this
 * instead of building bespoke sliders.
 */
export default function ParamPanel<T extends ParamSchema>({
  schema,
  onChange,
  title = "Parameters",
  collapsed = false,
}: ParamPanelProps<T>) {
  const panelId = useId();
  const store = useCreateStore();
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const levaSchema = useMemo(() => toLeva(schema, title, collapsed), []);

  const values = useControls(levaSchema, { store });

  useEffect(() => {
    // Extract values, stripping folder wrapper if collapsed
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = collapsed && title ? (values as Record<string, any>)[title] ?? values : values;
    onChangeRef.current(raw as ParamValues<T>);
  }, [values, collapsed, title]);

  return (
    <div
      className="param-panel rounded-lg border border-border bg-surface p-1"
      data-panel-id={panelId}
    >
      <LevaPanel
        store={store}
        fill
        flat
        titleBar={collapsed ? { title } : false}
        hideCopyButton
        theme={{
          colors: {
            elevation1: "var(--surface)",
            elevation2: "var(--background-secondary)",
            elevation3: "var(--background)",
            accent1: "var(--accent)",
            accent2: "var(--accent-hover)",
            accent3: "var(--accent-muted)",
            highlight1: "var(--foreground)",
            highlight2: "var(--foreground-muted)",
            highlight3: "var(--foreground-subtle)",
          },
          fonts: {
            mono: "var(--font-mono)",
          },
          sizes: {
            controlWidth: "66%",
          },
        }}
      />
    </div>
  );
}
