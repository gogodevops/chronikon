"use client";

import dynamic from "next/dynamic";

import type { SerializedEntryListItem } from "@/lib/queries";

const MapInner = dynamic(
  () => import("@/components/views/map-inner").then((m) => m.MapInner),
  { ssr: false, loading: () => <MapPlaceholder /> },
);

function MapPlaceholder() {
  return (
    <div className="flex h-full items-center justify-center text-muted-foreground">
      Karte wird geladen…
    </div>
  );
}

export function MapView({ entries }: { entries: SerializedEntryListItem[] }) {
  const places = entries.filter((e) => e.lat != null && e.lng != null);

  return (
    <div className="h-full w-full">
      <MapInner places={places} />
    </div>
  );
}
