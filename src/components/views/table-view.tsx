"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";

import { CONF_META, TYPE_META } from "@/lib/constants";
import { formatEntryYearSummary } from "@/lib/entry-form-config";
import type { SerializedEntryListItem } from "@/lib/queries";

const columns: ColumnDef<SerializedEntryListItem>[] = [
  { accessorKey: "title", header: "Titel", size: 280 },
  {
    accessorKey: "type",
    header: "Typ",
    cell: ({ row }) => TYPE_META[row.original.type].label,
    size: 90,
  },
  {
    id: "year",
    header: "Jahre",
    cell: ({ row }) => formatEntryYearSummary(row.original),
    size: 180,
  },
  {
    accessorKey: "confidence",
    header: "Confidence",
    cell: ({ row }) => CONF_META[row.original.confidence].label,
    size: 100,
  },
  { accessorKey: "topic", header: "Thema", size: 140 },
  { accessorKey: "sourceCount", header: "Quellen", size: 70 },
  {
    id: "discussionCount",
    header: "Diskussion",
    cell: ({ row }) =>
      row.original.questionCount + row.original.commentCount,
    size: 80,
  },
];

export function TableView({
  entries,
  onSelect,
}: {
  entries: SerializedEntryListItem[];
  onSelect?: (id: string) => void;
}) {
  const parentRef = React.useRef<HTMLDivElement>(null);

  const table = useReactTable({
    data: entries,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const { rows } = table.getRowModel();

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    overscan: 10,
  });

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden p-4">
      <h2 className="mb-3 shrink-0 text-lg font-semibold">
        Tabelle ({entries.length} Einträge)
      </h2>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border">
        <div className="flex shrink-0 border-b border-border bg-surface-2 text-[0.75rem] font-medium uppercase tracking-wide text-muted-foreground">
          {table.getHeaderGroups().map((hg) =>
            hg.headers.map((header) => (
              <div
                key={header.id}
                className="px-3 py-2"
                style={{ width: header.column.getSize() }}
              >
                {flexRender(header.column.columnDef.header, header.getContext())}
              </div>
            )),
          )}
        </div>
        <div ref={parentRef} className="min-h-0 flex-1 overflow-auto">
          <div
            style={{ height: `${virtualizer.getTotalSize()}px`, position: "relative" }}
          >
            {virtualizer.getVirtualItems().map((vRow) => {
              const row = rows[vRow.index];
              return (
                <div
                  key={row.id}
                  className="absolute flex w-full cursor-pointer border-b border-border text-[0.82rem] hover:bg-surface-2"
                  style={{
                    height: `${vRow.size}px`,
                    transform: `translateY(${vRow.start}px)`,
                  }}
                  onClick={() => onSelect?.(row.original.id)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <div
                      key={cell.id}
                      className="truncate px-3 py-2"
                      style={{ width: cell.column.getSize() }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
