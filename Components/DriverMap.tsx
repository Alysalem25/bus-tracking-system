"use client";

import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState, useRef } from "react";

// Fix default marker icons
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import iconRetina from "leaflet/dist/images/marker-icon-2x.png";

const DefaultIcon = L.icon({
  iconUrl,
  iconRetinaUrl: iconRetina,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom driver icon
const driverIcon = new L.Icon({
  iconUrl: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiMxNjYzMzQiLz4KPHN2ZyB4PSI4IiB5PSI4IiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4KPC9zdmc+",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

// Custom station icon
const stationIcon = new L.Icon({
  iconUrl: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAiIGhlaWdodD0iMzAiIHZpZXdCb3g9IjAgMCAzMCAzMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTUiIGN5PSIxNSIgcj0iMTUiIGZpbGw9IiMxNjYzMzQiLz4KPGNpcmNsZSBjeD0iMTUiIGN5PSIxNSIgcj0iOCIgZmlsbD0id2hpdGUiLz4KPC9zdmc+",
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30],
});

type LatLngTuple = [number, number];

interface StationInfo {
  position: LatLngTuple;
  name?: string;
  order?: number;
  arrivalTime?: string;
  departureTime?: string;
}

interface DriverMapProps {
  driverPos: LatLngTuple | null;
  firstStation?: { lat: number; lng: number } | null;
  stations?: StationInfo[];
  isTracking?: boolean;
}

// Component to center map on driver position
function MapCenter({ position }: { position: LatLngTuple | null }) {
  const map = useMap();
  
  useEffect(() => {
    if (position) {
      map.setView(position, map.getZoom(), {
        animate: true,
        duration: 1,
      });
    }
  }, [position, map]);

  return null;
}

export default function DriverMap({
  driverPos,
  firstStation = null,
  stations = [],
  isTracking = false,
}: DriverMapProps) {
  // Ensure stations is always an array
  const safeStations: StationInfo[] = Array.isArray(stations) ? stations : [];
  
  const [routePolyline, setRoutePolyline] = useState<LatLngTuple[]>([]);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const lastFetchRef = useRef<{ driverLat: number; driverLng: number } | null>(null);

  // Auto-detect first station from stations array if firstStation not provided
  const effectiveFirstStation = firstStation || (safeStations.length > 0 ? {
    lat: safeStations[0].position[0],
    lng: safeStations[0].position[1],
  } : null);

  // Fetch route from driver to first station using OSRM
  useEffect(() => {
    if (!isTracking || !driverPos || !effectiveFirstStation) {
      setRoutePolyline([]);
      return;
    }

    // Throttle route fetching - only fetch if driver moved significantly (50m)
    const [driverLat, driverLng] = driverPos;
    const lastFetch = lastFetchRef.current;
    
    if (lastFetch) {
      const distance = Math.sqrt(
        Math.pow(driverLat - lastFetch.driverLat, 2) +
        Math.pow(driverLng - lastFetch.driverLng, 2)
      );
      // Skip if moved less than ~0.0005 degrees (roughly 50m)
      if (distance < 0.0005) {
        return;
      }
    }

    const fetchRoute = async () => {
      setLoadingRoute(true);
      setRouteError(null);

      try {
        // OSRM expects coordinates as lng,lat
        const coordsString = `${driverLng},${driverLat};${effectiveFirstStation.lng},${effectiveFirstStation.lat}`;
        const url = `https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=full&geometries=geojson`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.code === "Ok" && data.routes && data.routes.length > 0) {
          // Parse GeoJSON coordinates: [lng, lat] -> [lat, lng]
          const coordinates = data.routes[0].geometry.coordinates.map(
            ([lng, lat]: [number, number]): LatLngTuple => [lat, lng]
          );
          setRoutePolyline(coordinates);
          lastFetchRef.current = { driverLat, driverLng };
        } else {
          setRouteError("No route found");
          setRoutePolyline([]);
        }
      } catch (err: any) {
        console.error("Error fetching route:", err);
        setRouteError(err.message || "Failed to fetch route");
        setRoutePolyline([]);
      } finally {
        setLoadingRoute(false);
      }
    };

    fetchRoute();
  }, [driverPos, effectiveFirstStation, isTracking]);

  // Determine map center
  const mapCenter: LatLngTuple = driverPos
    ? driverPos
    : safeStations.length > 0
    ? safeStations[0].position
    : [31.205753, 29.924526]; // Default: Alexandria 31.090278, 29.753344
    console.log("DriverMap render - mapCenter:", mapCenter, "driverPos:", driverPos, "stations:", safeStations);

  return (
    <MapContainer
      center={mapCenter}
      zoom={14}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Center map on driver */}
      {isTracking && driverPos && <MapCenter position={driverPos} />}

      {/* Driver marker */}
      {driverPos && (
        <Marker position={driverPos} icon={driverIcon}>
          <Popup>
            <div className="text-center">
              <strong>🚌 Driver Location</strong>
              <br />
              <small>
                {driverPos[0].toFixed(6)}, {driverPos[1].toFixed(6)}
              </small>
            </div>
          </Popup>
        </Marker>
      )}

      {/* Route polyline from driver to first station */}
      {routePolyline.length > 0 && (
        <Polyline
          positions={routePolyline}
          pathOptions={{
            color: "#3b82f6",
            weight: 5,
            opacity: 0.8,
          }}
        />
      )}

      {/* Station markers */}
      {safeStations.length > 0 && safeStations.map((station, idx) => (
        <Marker key={idx} position={station.position} icon={stationIcon}>
          <Popup>
            <div>
              <strong>{station.name || `Station ${station.order || idx + 1}`}</strong>
              {station.arrivalTime && (
                <>
                  <br />
                  <small>Arrival: {station.arrivalTime}</small>
                </>
              )}
              {station.departureTime && (
                <>
                  <br />
                  <small>Departure: {station.departureTime}</small>
                </>
              )}
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Loading indicator */}
      {loadingRoute && (
        <div
          style={{
            position: "absolute",
            top: "10px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1000,
            background: "rgba(255, 255, 255, 0.9)",
            padding: "8px 16px",
            borderRadius: "4px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
            fontSize: "14px",
          }}
        >
          Loading route...
        </div>
      )}

      {/* Route error indicator */}
      {routeError && (
        <div
          style={{
            position: "absolute",
            top: "10px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1000,
            background: "rgba(239, 68, 68, 0.9)",
            color: "white",
            padding: "8px 16px",
            borderRadius: "4px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
            fontSize: "14px",
          }}
        >
          {routeError}
        </div>
      )}
    </MapContainer>
  );
}
