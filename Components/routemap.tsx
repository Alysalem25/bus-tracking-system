// "use client";

// import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
// import { useState } from "react";
// import L from "leaflet";

// // custom marker
// const markerIcon = new L.Icon({
//   iconUrl: "/marker-icon.png",
//   iconSize: [25, 41],
//   iconAnchor: [12, 41],
// });

// interface MapSelectorProps {
//   onSelect: (lat: number, lng: number) => void;
// }

// const MapSelector = ({ onSelect }: MapSelectorProps) => {
//   const [position, setPosition] = useState<any>(null);

//   function LocationMarker() {
//     useMapEvents({
//       click(e) {
//         const { lat, lng } = e.latlng;
//         setPosition([lat, lng]);
//         onSelect(lat, lng);
//       },
//     });

//     return position ? <Marker position={position} icon={markerIcon} /> : null;
//   }

//   return (
//     <MapContainer
//       center={[31.205753, 29.924526]} // Alexandria
//       zoom={13}
//       style={{ height: "400px", width: "100%", borderRadius: "10px" }}
//     >
//       <TileLayer
//         url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//       />
//       <LocationMarker />
//     </MapContainer>
//   );
// };

// export default RouterMap;


// /===================================================================================================================================================


// "use client";

// import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
// import "leaflet/dist/leaflet.css";
// import L from "leaflet";

// // Fix default icons
// import iconUrl from "leaflet/dist/images/marker-icon.png";
// import iconShadow from "leaflet/dist/images/marker-shadow.png";

// const DefaultIcon = L.icon({
//   iconUrl,
//   shadowUrl: iconShadow,
// });
// L.Marker.prototype.options.icon = DefaultIcon;

// interface StationData {
//   station: {
//     name: string;
//     location: {
//       coordinates: [number, number]; // [lng, lat]
//     };
//   };
//   order: number;
//   arrivalTime: string;
//   departureTime: string;
//   _id: string;
// }

// export default function Map({ stations }: { stations: StationData[] }) {
//   if (!stations || stations.length === 0) {
//     return <p>No station data available</p>;
//   }

//   // Convert stations into [lat, lng] pairs
//   const routeCoordinates = stations.map((stop) => {
//     const [lng, lat] = stop.station.location.coordinates;
//     return [lat, lng] as [number, number];
//   });

//   // Center map on the first station
//   const center = routeCoordinates[0];

//   return (
//     <MapContainer
//       center={center}
//       zoom={13}
//       style={{ height: "500px", width: "100%" }}
//     >
//       <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

//       {/* Route line connecting stations */}
//       <Polyline positions={routeCoordinates} color="blue" weight={4} />

//       {/* Markers for all stations */}
//       {stations.map((stop, index) => {
//         const [lng, lat] = stop.station.location.coordinates;

//         return (
//           <Marker key={stop._id} position={[lat, lng]}>
//             <Popup>
//               <b>{stop.station.name}</b> <br />
//               Order: {stop.order} <br />
//               Arrival: {stop.arrivalTime} <br />
//               Departure: {stop.departureTime}
//             </Popup>
//           </Marker>
//         );
//       })}
//     </MapContainer>
//   );
// }

// /===================================================================================================================================================





// "use client";

// import { useEffect } from "react";
// import {
//   MapContainer,
//   TileLayer,
//   Marker,
//   Popup,
//   useMap,
// } from "react-leaflet";
// import L from "leaflet";

// // Import Leaflet CSS
// import "leaflet/dist/leaflet.css";

// // Routing Machine
// import "leaflet-routing-machine";
// import "leaflet-routing-machine/dist/leaflet-routing-machine.css";

// // Fix marker icons
// import iconUrl from "leaflet/dist/images/marker-icon.png";
// import iconShadow from "leaflet/dist/images/marker-shadow.png";

// const DefaultIcon = L.icon({
//   iconUrl,
//   shadowUrl: iconShadow,
// });
// L.Marker.prototype.options.icon = DefaultIcon;

// interface StationData {
//   station: {
//     name: string;
//     location: {
//       coordinates: [number, number]; // [lng, lat]
//     };
//   };
//   order: number;
//   arrivalTime: string;
//   departureTime: string;
//   _id: string;
// }

// function Routing({ stations }: { stations: StationData[] }) {
//   const map = useMap();

//   useEffect(() => {
//     if (!map || stations.length === 0) return;

//     // Convert to [lat, lng] for Leaflet
//     const waypoints = stations.map((s) => {
//       const [lng, lat] = s.station.location.coordinates;
//       return L.latLng(lat, lng);
//     });

//     // Create route control
//     const control = L.Routing.control({
//       waypoints,
//       addWaypoints: false,
//       draggableWaypoints: false,
//       showAlternatives: false,
//       createMarker: () => null, // We handle markers separately
//       lineOptions: {
//         styles: [{ color: "blue", weight: 5 }],
//       },
//       router: L.Routing.osrmv1({
//         serviceUrl: "https://router.project-osrm.org/route/v1/",
//       }),
//     }).addTo(map);

//     return () => {
//       map.removeControl(control);
//     };
//   }, [map, stations]);

//   return null;
// }

// export default function RouteMap({ stations }: { stations: StationData[] }) {
//   if (!stations || stations.length === 0) {
//     return <p>No station data available</p>;
//   }

//   const [lng0, lat0] = stations[0].station.location.coordinates;

//   return (
//     <MapContainer
//       center={[lat0, lng0]}
//       zoom={14}
//       style={{ height: "500px", width: "100%" }}
//     >
//       {/* OpenStreetMap layer */}
//       <TileLayer
//         url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//       />

//       {/* Routing Machine */}
//       <Routing stations={stations} />

//       {/* Markers */}
//       {stations.map((stop) => {
//         const [lng, lat] = stop.station.location.coordinates;
//         return (
//           <Marker key={stop._id} position={[lat, lng]}>
//             <Popup>
//               <b>{stop.station.name}</b>
//               <br />
//               Order: {stop.order}
//               <br />
//               Arrival: {stop.arrivalTime}
//               <br />
//               Departure: {stop.departureTime}
//             </Popup>
//           </Marker>
//         );
//       })}
//     </MapContainer>
//   );
// }

// ===================================================================================================================================================


"use client";

import dynamic from "next/dynamic";

const RouteMapClient = dynamic(() => import("./RouteMapClient"), {
  ssr: false,
});

export default function RouteMap({ stations }) {
  return <RouteMapClient stations={stations} />;
}
