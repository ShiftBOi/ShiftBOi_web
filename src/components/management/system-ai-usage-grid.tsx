"use client";

import {
  ArcContextMenu,
  ArcContextMenuContent,
  ArcContextMenuItem,
  ArcContextMenuSeparator,
  ArcContextMenuTrigger,
} from "@/components/arc/context-menu/context-menu";
import {
  DataGrid,
  DataGridContainer,
  dataGridFeatures,
  type DataGridFeatures,
} from "@/components/reui/data-grid/data-grid";
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination";
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area";
import {
  DataGridTable,
  DataGridTableRowSelect,
  DataGridTableRowSelectAll,
} from "@/components/reui/data-grid/data-grid-table";
import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  ColumnDef,
  PaginationState,
  RowSelectionState,
  SortingState,
  useTable,
} from "@tanstack/react-table";
import { FolderOpen, Loader2, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

export type AiUsageRow = {
  id: string;
  provider: string;
  model: string;
  status: string;
  totalTokens?: number | null;
  cost?: number | null;
  latency: number;
  projectSlug?: string | null;
  route?: string | null;
  contentFields?: string | null;
  sourceLanguage?: string | null;
  targetLanguage?: string | null;
  createdAt: string;
};

function formatJoined(dateString: string) {
  try {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function providerInitials(provider: string, model: string) {
  if (provider === "openai") return "OA";
  if (provider === "groq") return "GQ";
  if (provider === "gemini") return "GE";
  return (model || provider || "?").slice(0, 2).toUpperCase();
}

function statusDot(status: string) {
  if (status === "success") return "bg-emerald-500";
  if (status === "error") return "bg-red-500";
  return "bg-zinc-500";
}

export function SystemAiUsageGrid({
  rows,
  onDeleteIds,
}: {
  rows: AiUsageRow[];
  onDeleteIds?: (ids: string[]) => Promise<void> | void;
}) {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 5,
  });
  const [sorting, setSorting] = useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [contextRowId, setContextRowId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const columns = useMemo<ColumnDef<DataGridFeatures, AiUsageRow>[]>(
    () => [
      {
        id: "select",
        header: () => <DataGridTableRowSelectAll />,
        cell: ({ row }) => <DataGridTableRowSelect row={row} />,
        size: 40,
        enableSorting: false,
        enableResizing: false,
        meta: {
          headerClassName: "w-10 px-3",
          cellClassName: "w-10 px-3",
        },
      },
      {
        accessorKey: "model",
        header: "Model",
        cell: ({ row }) => {
          const r = row.original;
          return (
            <div className="flex items-center gap-3 py-0.5">
              <Avatar size="default">
                <AvatarFallback className="bg-muted text-foreground text-xs font-semibold">
                  {providerInitials(r.provider, r.model)}
                </AvatarFallback>
                <AvatarBadge className={statusDot(r.status)} />
              </Avatar>
              <div className="min-w-0 space-y-0.5">
                <div className="text-foreground truncate text-sm font-medium">
                  {r.model}
                </div>
                <div className="text-muted-foreground truncate text-xs capitalize">
                  {r.provider}
                  {r.route ? ` · ${r.route}` : ""}
                </div>
              </div>
            </div>
          );
        },
        size: 260,
      },
      {
        accessorKey: "projectSlug",
        header: "Project",
        cell: ({ row }) => {
          const slug = row.original.projectSlug;
          return (
            <div className="flex items-center gap-1.5">
              <span className="bg-muted text-muted-foreground inline-flex size-5 items-center justify-center rounded-full">
                <FolderOpen className="size-3" />
              </span>
              <span className="text-foreground text-sm">{slug || "—"}</span>
            </div>
          );
        },
        size: 160,
      },
      {
        id: "lang",
        header: "Lang",
        accessorFn: (row) =>
          row.sourceLanguage && row.targetLanguage
            ? `${row.sourceLanguage} → ${row.targetLanguage}`
            : "",
        cell: ({ row }) => {
          const { sourceLanguage, targetLanguage } = row.original;
          if (!sourceLanguage || !targetLanguage) {
            return <span className="text-muted-foreground text-sm">—</span>;
          }
          return (
            <span className="text-foreground text-sm">
              {sourceLanguage} → {targetLanguage}
            </span>
          );
        },
        size: 110,
      },
      {
        accessorKey: "cost",
        header: "Cost",
        cell: ({ row }) => {
          const cost = row.original.cost;
          const tokens = row.original.totalTokens;
          return (
            <div className="space-y-0.5 text-right">
              <div className="text-foreground text-sm tabular-nums">
                {cost != null ? `$${cost.toFixed(4)}` : "—"}
              </div>
              <div className="text-muted-foreground text-xs tabular-nums">
                {tokens != null ? `${tokens.toLocaleString()} tok` : "—"}
              </div>
            </div>
          );
        },
        size: 110,
        meta: {
          headerClassName: "text-right",
          cellClassName: "text-right",
        },
      },
      {
        accessorKey: "createdAt",
        header: "When",
        cell: (info) => (
          <span className="text-foreground text-sm whitespace-nowrap">
            {formatJoined(String(info.getValue()))}
          </span>
        ),
        size: 110,
      },
    ],
    []
  );

  const table = useTable({
    features: dataGridFeatures,
    columns,
    data: rows,
    pageCount: Math.ceil((rows.length || 0) / pagination.pageSize),
    getRowId: (row: AiUsageRow) => row.id,
    enableRowSelection: true,
    state: {
      pagination,
      sorting,
      rowSelection,
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
  });

  const selectedIds = Object.keys(rowSelection).filter((id) => rowSelection[id]);
  const selectedCount = selectedIds.length;

  async function deleteIds(ids: string[]) {
    if (!onDeleteIds || ids.length === 0) return;
    setDeleting(true);
    try {
      await onDeleteIds(ids);
      setRowSelection({});
      setContextRowId(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="cms-data-grid">
      {onDeleteIds && selectedCount > 0 ? (
        <div className="cms-log-toolbar">
          <p>
            <strong>{selectedCount}</strong> selected
          </p>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            disabled={deleting}
            onClick={() => void deleteIds(selectedIds)}
          >
            {deleting ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Trash2 className="size-3.5" />
            )}
            Delete selected
          </Button>
        </div>
      ) : null}

      <DataGrid
        table={table}
        recordCount={rows.length}
        tableLayout={{
          dense: false,
          rowBorder: true,
          headerBorder: true,
          headerBackground: false,
          cellBorder: false,
          width: "auto",
        }}
      >
        <div className="w-full space-y-2.5">
          <ArcContextMenu
            onOpenChange={(open) => {
              if (!open) setContextRowId(null);
            }}
          >
            <ArcContextMenuTrigger asChild>
              <div
                onContextMenu={(e) => {
                  const tr = (e.target as HTMLElement).closest("tr[data-row-id]");
                  const id = tr?.getAttribute("data-row-id");
                  setContextRowId(id ?? null);
                  if (id && !rowSelection[id]) {
                    setRowSelection({ [id]: true });
                  }
                }}
              >
                <DataGridContainer>
                  <DataGridScrollArea>
                    <DataGridTable />
                  </DataGridScrollArea>
                </DataGridContainer>
              </div>
            </ArcContextMenuTrigger>
            {onDeleteIds ? (
              <ArcContextMenuContent>
                <ArcContextMenuItem
                  destructive
                  disabled={deleting || (!contextRowId && selectedCount === 0)}
                  icon={<Trash2 className="size-4" />}
                  onSelect={() => {
                    const ids =
                      selectedCount > 0
                        ? selectedIds
                        : contextRowId
                          ? [contextRowId]
                          : [];
                    void deleteIds(ids);
                  }}
                >
                  {selectedCount > 1
                    ? `Delete ${selectedCount} selected`
                    : "Delete this log"}
                </ArcContextMenuItem>
                {selectedCount > 0 ? (
                  <>
                    <ArcContextMenuSeparator />
                    <ArcContextMenuItem
                      onSelect={() => setRowSelection({})}
                    >
                      Clear selection
                    </ArcContextMenuItem>
                  </>
                ) : null}
              </ArcContextMenuContent>
            ) : null}
          </ArcContextMenu>
          <DataGridPagination more sizes={[5, 10, 20, 50]} />
        </div>
      </DataGrid>
    </div>
  );
}
