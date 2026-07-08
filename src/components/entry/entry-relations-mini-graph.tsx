"use client";

import * as React from "react";
import dynamic from "next/dynamic";

import { TYPE_META } from "@/lib/constants";
import type { SerializedRelation } from "@/lib/queries";

const ForceGraph2D = dynamic(
  () => import("react-force-graph-2d").then((m) => m.default),
  { ssr: false },
);

type GraphNode = {
  id: string;
  name: string;
  color: string;
  isCenter?: boolean;
};

type GraphLink = {
  source: string;
  target: string;
  label?: string;
};

export function EntryRelationsMiniGraph({
  entryId,
  entryTitle,
  entryType,
  relations,
  onSelect,
}: {
  entryId: string;
  entryTitle: string;
  entryType: string;
  relations: SerializedRelation[];
  onSelect?: (id: string) => void;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [size, setSize] = React.useState({ width: 280, height: 160 });

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width } = entry.contentRect;
      setSize({ width: Math.max(200, width), height: 160 });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const graphData = React.useMemo(() => {
    const centerColor = TYPE_META[entryType as keyof typeof TYPE_META]?.color ?? "#888";
    const nodeMap = new Map<string, GraphNode>();
    nodeMap.set(entryId, {
      id: entryId,
      name: entryTitle,
      color: centerColor,
      isCenter: true,
    });

    const links: GraphLink[] = [];
    for (const r of relations) {
      if (!nodeMap.has(r.otherEntryId)) {
        nodeMap.set(r.otherEntryId, {
          id: r.otherEntryId,
          name: r.otherEntryTitle,
          color: r.otherEntryTypeColor,
        });
      }
      links.push({
        source: entryId,
        target: r.otherEntryId,
        label: r.typeLabel,
      });
    }

    return { nodes: [...nodeMap.values()], links };
  }, [entryId, entryTitle, entryType, relations]);

  if (relations.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border/60 bg-surface/40 px-3 py-4 text-center text-[0.72rem] text-muted-foreground">
        Noch keine Verknüpfungen — oben auf „Verknüpfung“ klicken.
      </p>
    );
  }

  return (
    <div
      ref={containerRef}
      className="overflow-hidden rounded-lg border border-border/70 bg-surface"
    >
      <ForceGraph2D
        graphData={graphData}
        width={size.width}
        height={size.height}
        nodeLabel={(n) => (n as GraphNode).name}
        nodeColor={(n) => (n as GraphNode).color}
        nodeVal={(n) => ((n as GraphNode).isCenter ? 8 : 5)}
        linkColor={() => "rgba(255,255,255,0.5)"}
        linkWidth={1.5}
        linkDirectionalArrowLength={4}
        linkDirectionalArrowRelPos={1}
        linkLabel={(l) => (l as GraphLink).label ?? ""}
        onNodeClick={(node) => {
          const id = (node as GraphNode).id;
          if (id !== entryId) onSelect?.(id);
        }}
        cooldownTicks={80}
        d3AlphaDecay={0.05}
      />
    </div>
  );
}
