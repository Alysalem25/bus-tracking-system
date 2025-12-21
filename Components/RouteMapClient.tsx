"use client";

import { useEffect } from "react";
import L from "leaflet";

import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";

// Fix marker icons
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl,
  shadowUrl: iconShadow,
});
L.Marker.prototype.options.icon = DefaultIcon;

// Routing Component (PolyLine Builder)
function RoutingMachine({ stations }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !stations.length) return;

    const waypoints = stations.map((st) => {
      const [lng, lat] = st.station.location.coordinates;
      return L.latLng(lat, lng);
    });

    const routingControl = L.Routing.control({
      waypoints,
      addWaypoints: false,
      draggableWaypoints: false,
      routeWhileDragging: false,
      fitSelectedRoutes: true,
      showAlternatives: false,

      createMarker: () => null,

      lineOptions: {
        styles: [{ color: "blue", weight: 5 }],
      },

      router: L.Routing.osrmv1({
        serviceUrl: "https://router.project-osrm.org/route/v1/",
      }),
    }).addTo(map);

    return () => {
      map.removeControl(routingControl);
    };
  }, [map, stations]);

  return null;
}

export default function RouteMapClient({ stations }) {
  if (!stations || stations.length === 0)
    return <p>No stations available</p>;

  const [lng, lat] = stations[0].station.location.coordinates ;

  return (
    <MapContainer
      center={[lat, lng]}
      zoom={14}
      style={{ width: "100%", height: "500px" }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      <RoutingMachine stations={stations} />

      {stations.map((stop) => {
        const [lng, lat] = stop.station.location.coordinates;

        return (
          <Marker key={stop._id} position={[lat, lng]}>
            <Popup>
              <b>{stop.station.name}</b> <br />
              Order: {stop.order} <br />
              Arrival: {stop.arrivalTime} <br />
              Departure: {stop.departureTime}
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
