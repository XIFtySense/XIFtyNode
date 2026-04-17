"use strict";

import path from "node:path";
import nodeGypBuild from "node-gyp-build";

export type ViewName = "full" | "raw" | "interpreted" | "normalized" | "report";

export interface ExtractOptions {
  view?: ViewName | number;
}

export interface InputSummary {
  path: string;
  detected_format: string;
  container: string;
  [key: string]: unknown;
}

export interface Provenance {
  container?: string;
  namespace?: string;
  path?: string;
  offset_start?: number;
  offset_end?: number;
  [key: string]: unknown;
}

export interface TypedValue {
  kind: string;
  value: unknown;
  [key: string]: unknown;
}

export interface NormalizedField {
  field: string;
  value: TypedValue;
  confidence?: number;
  sources: Provenance[];
  notes?: string[];
  [key: string]: unknown;
}

export interface ReportIssue {
  severity?: string;
  code?: string;
  message: string;
  [key: string]: unknown;
}

export interface ReportConflict {
  field?: string;
  [key: string]: unknown;
}

export interface XiftyEnvelope {
  schema_version: string;
  input: InputSummary;
  raw?: Record<string, unknown>;
  interpreted?: Record<string, unknown>;
  normalized?: {
    fields: NormalizedField[];
    [key: string]: unknown;
  };
  report?: {
    issues: ReportIssue[];
    conflicts: ReportConflict[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface NativeBinding {
  version(): string;
  probeJson(filePath: string): string;
  extractJson(filePath: string, viewMode: number): string;
}

const packageRoot = path.resolve(__dirname, "..");

function loadNativeBinding(): NativeBinding {
  try {
    return nodeGypBuild(packageRoot) as NativeBinding;
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "message" in error &&
      typeof error.message === "string" &&
      error.message.includes("No native build was found")
    ) {
      throw new Error(
        [
          "xifty does not ship a native build for this platform.",
          "Current local publish flow ships macos-arm64 prebuilds.",
          "linux-x64 remains CI-validated but is not assembled automatically for local publish yet.",
          "Unsupported platforms include macos-x64, windows, and other Linux architectures.",
        ].join(" "),
        { cause: error },
      );
    }
    throw error;
  }
}

const native = loadNativeBinding();

const viewByName: Record<ViewName, number> = {
  full: 0,
  raw: 1,
  interpreted: 2,
  normalized: 3,
  report: 4,
};

export function packageVersion(): string {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require("../package.json").version as string;
}

export function version(): string {
  return native.version();
}

export function probe(filePath: string): XiftyEnvelope {
  return JSON.parse(native.probeJson(filePath)) as XiftyEnvelope;
}

export function extract(filePath: string, options: ExtractOptions = {}): XiftyEnvelope {
  const view = options.view ?? "full";
  const viewMode = typeof view === "number" ? view : viewByName[String(view) as ViewName];
  if (viewMode === undefined) {
    throw new TypeError(`unsupported view: ${view}`);
  }
  return JSON.parse(native.extractJson(filePath, viewMode)) as XiftyEnvelope;
}

export default {
  packageVersion,
  version,
  probe,
  extract,
};
