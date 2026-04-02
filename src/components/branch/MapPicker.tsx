import type { LeafletMouseEvent } from "leaflet";
import { CircleMarker, MapContainer, TileLayer, useMapEvents } from "react-leaflet";

const DEFAULT_CENTER: [number, number] = [30.0289, 31.4913];

function MapClickHandler({
  onChange,
}: {
  onChange: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e: LeafletMouseEvent) {
      const lat = Math.round(e.latlng.lat * 1_000_000) / 1_000_000;
      const lng = Math.round(e.latlng.lng * 1_000_000) / 1_000_000;
      onChange(lat, lng);
    },
  });

  return null;
}

export default function MapPicker({
  latitude,
  longitude,
  onChange,
}: {
  latitude: number | null;
  longitude: number | null;
  onChange: (lat: number, lng: number) => void;
}) {
  const position: [number, number] = [
    latitude ?? DEFAULT_CENTER[0],
    longitude ?? DEFAULT_CENTER[1],
  ];

  return (
    <div className="surface-muted">
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          marginBottom: 8,
          color: "#111827",
        }}
      >
        Choose Branch Location
      </div>

      <div style={{ color: "#6b7280", fontSize: 12, marginBottom: 12 }}>
        Click on the map to set latitude and longitude. Initial focus is New Cairo, Cairo, Egypt.
      </div>

      <div
        style={{
          width: "100%",
          height: 360,
          borderRadius: 12,
          overflow: "hidden",
          border: "1px solid #e5e7eb",
          background: "#ffffff",
        }}
      >
        <MapContainer
          center={position}
          zoom={13}
          scrollWheelZoom={true}
          style={{ width: "100%", height: "100%" }}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <CircleMarker
            center={position}
            radius={8}
            pathOptions={{
              color: "#2563eb",
              fillColor: "#2563eb",
              fillOpacity: 0.9,
            }}
          />
          <MapClickHandler onChange={onChange} />
        </MapContainer>
      </div>

      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          marginTop: 12,
          alignItems: "center",
        }}
      >
        <div style={{ fontSize: 13, color: "#374151" }}>
          <strong>Latitude:</strong> {position[0]}
        </div>
        <div style={{ fontSize: 13, color: "#374151" }}>
          <strong>Longitude:</strong> {position[1]}
        </div>

        <button
          type="button"
          className="button button-secondary"
          onClick={() => onChange(DEFAULT_CENTER[0], DEFAULT_CENTER[1])}
        >
          Reset to New Cairo
        </button>
      </div>
    </div>
  );
}
