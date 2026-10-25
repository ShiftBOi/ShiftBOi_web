/** Shared Trace helpers for CMS assistant turns. */

export type TraceToolStatus = "running" | "done" | "error";

/** Map our tool chip status → TraceLine `status` prop. */
export function toolTraceStatus(
  status: TraceToolStatus
): "running" | "error" | undefined {
  if (status === "running") return "running";
  if (status === "error") return "error";
  return undefined;
}

/** Aggregate status for a Chain-of-Thought summary line. */
export function toolsSummaryStatus(
  tools: Array<{ status: TraceToolStatus }>
): "running" | "error" | undefined {
  if (tools.some((t) => t.status === "running")) return "running";
  if (tools.some((t) => t.status === "error")) return "error";
  return undefined;
}

export function toolsSummaryTitle(
  tools: Array<{ status: TraceToolStatus }>,
  running: boolean
): string {
  const n = tools.length;
  if (running && tools.some((t) => t.status === "running")) {
    return n === 1 ? "Running tool" : `Running ${n} tools`;
  }
  return n === 1 ? "Ran 1 tool" : `Ran ${n} tools`;
}

export function toolLineTitle(
  name: string,
  status: TraceToolStatus,
  summary?: string
): string {
  const base =
    status === "running"
      ? `Running ${name}`
      : status === "error"
        ? `Failed ${name}`
        : `Ran ${name}`;
  return summary ? `${base} · ${summary}` : base;
}
