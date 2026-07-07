"use client";

import * as React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { Map, Palette } from "lucide-react";
import "leaflet/dist/leaflet.css";

import { Button } from "@/components/ui/button";
import type { SerializedEntryListItem } from "@/lib/queries";
import { cn } from "@/lib/utils";

const MAP_STYLE_KEY = "chronikon-map-style";

const TILES = {
  bw: {
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    className: "chronikon-map-tiles-bw",
  },
  color: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
    className: undefined,
  },
} as const;

type MapStyle = keyof typeof TILES;

const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function readStoredStyle(): MapStyle {
  if (typeof window === "undefined") return "bw";
  const stored = localStorage.getItem(MAP_STYLE_KEY);
  return stored === "color" ? "color" : "bw";
}

export function MapInner({
  places,
}: {
  places: SerializedEntryListItem[];
}) {
  const [mapStyle, setMapStyle] = React.useState<MapStyle>("bw");
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    setMapStyle(readStoredStyle());
    setReady(true);
  }, []);

  const toggleStyle = () => {
    setMapStyle((prev) => {
      const next: MapStyle = prev === "bw" ? "color" : "bw";
      localStorage.setItem(MAP_STYLE_KEY, next);
      return next;
    });
  };

  const center: [number, number] =
    places.length > 0
      ? [places[0].lat!, places[0].lng!]
      : [31.2, 29.9];

  const tiles = TILES[mapStyle];

  if (!ready) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Karte wird geladen…
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={center}
        zoom={4}
        className="chronikon-map h-full w-full"
        scrollWheelZoom
      >
        <TileLayer
          key={mapStyle}
          attribution={tiles.attribution}
          url={tiles.url}
          className={tiles.className}
        />
        {places.map((p) => (
          <Marker key={p.id} position={[p.lat!, p.lng!]} icon={icon}>
            <Popup>
              <strong>{p.title}</strong>
              {p.placeName && <div>{p.placeName}</div>}
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <div className="pointer-events-none absolute right-3 top-3 z-[1000]">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={toggleStyle}
          className={cn(
            "pointer-events-auto h-8 gap-1.5 border-border/80 bg-surface/95 px-2.5 text-[0.72rem] text-foreground shadow-md backdrop-blur-sm",
            "hover:border-accent/40 hover:bg-surface-2",
          )}
          title={
            mapStyle === "bw"
              ? "Farbkarte aktivieren"
              : "Schwarz-Weiß-Karte aktivieren"
          }
        >
          {mapStyle === "bw" ? (
            <>
              <Palette className="h-3.5 w-3.5 text-accent" />
              Farbe
            </>
          ) : (
            <>
              <Map className="h-3.5 w-3.5 text-accent" />
              Schwarz-Weiß
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
