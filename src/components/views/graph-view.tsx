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

  if (relations.length === 0) {
    return (
      <div className="flex h-full flex-col p-4">
        <h2 className="mb-4 text-lg font-semibold">Beziehungsgraph</h2>
        <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface p-8 text-center">
          <p className="text-[0.9rem] font-medium text-foreground">
            Noch keine Verknüpfungen
          </p>
          <p className="mt-2 max-w-md text-[0.82rem] text-muted-foreground">
            Öffne einen Eintrag und lege unter „Verknüpfungen“ Beziehungen zu
            anderen Einträgen an — dann erscheinen Knoten und Linien hier.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col p-4">
      <h2 className="mb-4 text-lg font-semibold">Beziehungsgraph</h2>
      <div className="flex-1 overflow-hidden rounded-lg border border-border bg-surface">
        <ForceGraph2D
          graphData={graphData}
          nodeLabel="name"
          nodeColor={(n) => (n as GraphNode).color}
          linkColor={() => "rgba(255, 255, 255, 0.5)"}
          linkWidth={1.5}
          linkDirectionalArrowLength={5}
          linkDirectionalArrowRelPos={1}
          linkDirectionalParticles={2}
          linkDirectionalParticleWidth={2}
          onNodeClick={(node) => onSelect?.((node as GraphNode).id)}
          width={undefined}
          height={undefined}
        />
      </div>
    </div>
  );
}
