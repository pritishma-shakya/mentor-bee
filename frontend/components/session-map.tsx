"use client";

import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Fix Leaflet marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Clickable map for selecting location
function ClickableMap({
  setLocation,
  isLocked,
}: {
  setLocation: (loc: { lat: number; lng: number; address: string }) => void;
  isLocked: boolean;
}) {
  useMapEvents({
    click: async (e) => {
      if (isLocked) return;
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;

      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
        );
        const data = await res.json();
        setLocation({
          lat,
          lng,
          address: data.display_name || "Unknown location",
        });
      } catch (err) {
        setLocation({
          lat,
          lng,
          address: "Unknown location",
        });
      }
    },
  });
  return null;
}

export default function SessionMap({
  locationResult,
  setLocationResult,
  isLocked,
}: {
  locationResult: { lat: number; lng: number; address: string } | null;
  setLocationResult: (loc: { lat: number; lng: number; address: string }) => void;
  isLocked: boolean;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}`
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const firstResult = data[0];
        const lat = parseFloat(firstResult.lat);
        const lng = parseFloat(firstResult.lon);
        setLocationResult({
          lat,
          lng,
          address: firstResult.display_name,
        });
      } else {
        alert("Location not found");
      }
    } catch (err) {
      console.error("Search failed:", err);
      // alert("Search failed"); 
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSearch} className="mb-3 flex gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search location..."
          className="flex-1 p-2 border border-gray-300 rounded-lg text-sm text-gray-900"
          disabled={isLocked}
        />
        <button
          type="submit"
          disabled={isLocked || isSearching}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:bg-gray-400"
        >
          {isSearching ? "Searching..." : "Search"}
        </button>
      </form>

      <MapContainer
        center={locationResult ? [locationResult.lat, locationResult.lng] : [27.7172, 85.324]}
        zoom={13}
        className="h-56 w-full rounded-lg"
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <ClickableMap setLocation={setLocationResult} isLocked={isLocked} />
        {locationResult && (
          <>
            <Marker position={[locationResult.lat, locationResult.lng]} />
            <MapUpdater center={[locationResult.lat, locationResult.lng]} />
          </>
        )}
      </MapContainer>
    </div>
  );
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 13);
  }, [center, map]);
  return null;
}


