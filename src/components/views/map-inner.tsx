"use client";

import * as React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import type { SerializedEntryListItem } from "@/lib/queries";

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

export function MapInner({
  places,
}: {
  places: SerializedEntryListItem[];
}) {
  const center: [number, number] =
    places.length > 0
      ? [places[0].lat!, places[0].lng!]
      : [31.2, 29.9];

  return (
    <MapContainer
      center={center}
      zoom={4}
      className="h-full w-full"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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
  );
}
