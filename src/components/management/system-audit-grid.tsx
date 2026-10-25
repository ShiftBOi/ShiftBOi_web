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
import { FileText, Loader2, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

export type AuditRow = {
  id: string;
  actor: string;
  action: string;
  resource: string;
  path: string;
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

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || "?";
}

function actionDot(action: string) {
  const a = action.toUpperCase();
  if (a === "CREATE" || a === "LOGIN") return "bg-emerald-500";
  if (a === "UPDATE" || a === "PATCH") return "bg-amber-500";
  if (a === "DELETE" || a === "LOGOUT") return "bg-red-500";
  return "bg-sky-500";
}

export function SystemAuditGrid({
  rows,
  onDeleteIds,
}: {
  rows: AuditRow[];
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

  const columns = useMemo<ColumnDef<DataGridFeatures, AuditRow>[]>(
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
        accessorKey: "actor",
        header: "Actor",
        cell: ({ row }) => {
          const r = row.original;
          return (
            <div className="flex items-center gap-3 py-0.5">
              <Avatar size="default">
                <AvatarFallback className="bg-muted text-foreground text-xs font-semibold">
                  {initials(r.actor)}
                </AvatarFallback>
                <AvatarBadge className={actionDot(r.action)} />
              </Avatar>
              <div className="min-w-0 space-y-0.5">
                <div className="text-foreground truncate text-sm font-medium">
                  {r.actor}
                </div>
                <div className="text-muted-foreground truncate text-xs">
                  {r.action}
                </div>
              </div>
            </div>
          );
        },
        size: 220,
      },
      {
        accessorKey: "resource",
        header: "Resource",
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5">
            <span className="bg-muted text-muted-foreground inline-flex size-5 items-center justify-center rounded-full">
              <FileText className="size-3" />
            </span>
            <span className="text-foreground text-sm">
              {row.original.resource}
            </span>
          </div>
        ),
        size: 160,
      },
      {
        accessorKey: "path",
        header: "Path",
        cell: ({ row }) => (
          <span className="text-muted-foreground font-mono text-xs">
            {row.original.path}
          </span>
        ),
        size: 240,
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
    getRowId: (row: AuditRow) => row.id,
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
                    : "Delete this event"}
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
