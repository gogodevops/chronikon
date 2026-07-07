"use client";

import * as React from "react";
import dynamic from "next/dynamic";

import { TYPE_META } from "@/lib/constants";
import type { SerializedEntryListItem } from "@/lib/queries";

const ForceGraph2D = dynamic(
  () => import("react-force-graph-2d").then((m) => m.default),
  { ssr: false },
);

type GraphNode = { id: string; name: string; color: string };
type GraphLink = { source: string; target: string };

export function GraphView({
  entries,
  relations,
  onSelect,
}: {
  entries: SerializedEntryListItem[];
  relations: GraphLink[];
  onSelect?: (id: string) => void;
}) {
  const graphData = React.useMemo(() => {
    const nodes: GraphNode[] = entries.map((e) => ({
      id: e.id,
      name: e.title,
      color: TYPE_META[e.type].color,
    }));
    return { nodes, links: relations };
  }, [entries, relations]);

  return (
    <div className="flex h-full flex-col p-4">
      <h2 className="mb-4 text-lg font-semibold">Beziehungsgraph</h2>
      <div className="flex-1 overflow-hidden rounded-lg border border-border bg-surface">
        <ForceGraph2D
          graphData={graphData}
          nodeLabel="name"
          nodeColor={(n) => (n as GraphNode).color}
          linkDirectionalParticles={1}
          linkDirectionalParticleWidth={2}
          onNodeClick={(node) => onSelect?.((node as GraphNode).id)}
          width={undefined}
          height={undefined}
        />
      </div>
    </div>
  );
}
