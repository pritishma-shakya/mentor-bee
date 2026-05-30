"use client";

import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Polyline, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { LocateFixed, MapPin, Route, X } from "lucide-react";

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: string })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

type LatLng = {
  lat: number;
  lng: number;
};

type RouteGeometry = LatLng[];

interface SessionRouteMapProps {
  destinationAddress: string;
  studentName: string;
  onClose?: () => void;
  fullPage?: boolean;
}

const DEFAULT_CENTER: [number, number] = [27.7172, 85.324];

async function geocodeAddress(address: string): Promise<LatLng | null> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`
  );
  const data: Array<{ lat: string; lon: string }> = await res.json();
  const first = data[0];

  if (!first) return null;

  return {
    lat: Number(first.lat),
    lng: Number(first.lon),
  };
}

async function fetchRoute(origin: LatLng, destination: LatLng): Promise<RouteGeometry> {
  const res = await fetch(
    `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`
  );
  const data: {
    routes?: Array<{
      geometry?: {
        coordinates?: Array<[number, number]>;
      };
    }>;
  } = await res.json();

  const coordinates = data.routes?.[0]?.geometry?.coordinates;
  if (!coordinates?.length) return [origin, destination];

  return coordinates.map(([lng, lat]) => ({ lat, lng }));
}

function FitRouteBounds({
  origin,
  destination,
  route,
}: {
  origin: LatLng | null;
  destination: LatLng | null;
  route: RouteGeometry;
}) {
  const map = useMap();

  useEffect(() => {
    const points = route.length ? route : [origin, destination].filter(Boolean) as LatLng[];
    if (!points.length) return;

    const bounds = L.latLngBounds(points.map((point) => [point.lat, point.lng]));
    map.fitBounds(bounds, { padding: [28, 28], maxZoom: 15 });
  }, [destination, map, origin, route]);

  return null;
}

export default function SessionRouteMap({
  destinationAddress,
  studentName,
  onClose,
  fullPage = false,
}: SessionRouteMapProps) {
  const [origin, setOrigin] = useState<LatLng | null>(null);
  const [destination, setDestination] = useState<LatLng | null>(null);
  const [route, setRoute] = useState<RouteGeometry>([]);
  const [status, setStatus] = useState("Finding student location...");
  const [error, setError] = useState("");

  const center = useMemo<[number, number]>(() => {
    if (destination) return [destination.lat, destination.lng];
    if (origin) return [origin.lat, origin.lng];
    return DEFAULT_CENTER;
  }, [destination, origin]);

  const requestMentorLocation = () => {
    if (!navigator.geolocation) {
      setStatus("Your browser does not support current location.");
      return;
    }

    setStatus("Getting your current location...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setOrigin({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setStatus("Building route...");
      },
      () => {
        setStatus("Allow location access to draw the route from your current position.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    let cancelled = false;

    const loadDestination = async () => {
      try {
        const result = await geocodeAddress(destinationAddress);
        if (cancelled) return;

        if (!result) {
          setError("Could not find this address on the map.");
          setStatus("");
          return;
        }

        setDestination(result);
        setStatus("Student location found. Allow location access to draw the route.");
        requestMentorLocation();
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError("Could not load the map location.");
          setStatus("");
        }
      }
    };

    loadDestination();

    return () => {
      cancelled = true;
    };
  }, [destinationAddress]);

  useEffect(() => {
    let cancelled = false;

    const loadRoute = async () => {
      if (!origin || !destination) return;

      try {
        setStatus("Building route...");
        const result = await fetchRoute(origin, destination);
        if (!cancelled) {
          setRoute(result);
          setStatus("Route ready");
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setRoute([origin, destination]);
          setStatus("Route service unavailable, showing direct path.");
        }
      }
    };

    loadRoute();

    return () => {
      cancelled = true;
    };
  }, [destination, origin]);

  const content = (
    <div className="w-full overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <div className="flex items-center gap-2 text-blue-700">
              <Route className="h-5 w-5" />
              <h3 className="text-sm font-bold text-gray-900">Route to {studentName}</h3>
            </div>
            <p className="mt-1 text-xs text-gray-500">{destinationAddress}</p>
          </div>
          {onClose && (
            <button onClick={onClose} className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <MapPin className="h-4 w-4 text-blue-600" />
              <span>{error || status}</span>
            </div>
            <button
              type="button"
              onClick={requestMentorLocation}
              className="flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-50"
            >
              <LocateFixed className="h-4 w-4" />
              Use My Location
            </button>
          </div>

          <MapContainer center={center} zoom={13} className="h-[420px] w-full rounded-lg border border-gray-100">
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {origin && <Marker position={[origin.lat, origin.lng]} />}
            {destination && <Marker position={[destination.lat, destination.lng]} />}
            {route.length > 0 && (
              <Polyline positions={route.map((point) => [point.lat, point.lng])} pathOptions={{ color: "#2563eb", weight: 5 }} />
            )}
            <FitRouteBounds origin={origin} destination={destination} route={route} />
          </MapContainer>
        </div>
    </div>
  );

  if (fullPage) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl">
        {content}
      </div>
    </div>
  );
}
