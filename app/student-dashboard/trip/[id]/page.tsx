"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import L from "leaflet";
import StudentSidebar from "@/Components/student_sidebar";
import ProtectedRoute from "@/Components/ProtectedRoute";
import apiClient from "@/lib/api";

const MapContainer = dynamic(()=>import("react-leaflet").then(m=>m.MapContainer),{ssr:false});
const TileLayer   = dynamic(()=>import("react-leaflet").then(m=>m.TileLayer),{ssr:false});
const Marker      = dynamic(()=>import("react-leaflet").then(m=>m.Marker),{ssr:false});
const Popup       = dynamic(()=>import("react-leaflet").then(m=>m.Popup),{ssr:false});
const Polyline    = dynamic(()=>import("react-leaflet").then(m=>m.Polyline),{ssr:false});
 const busIcon = new L.Icon({
  iconUrl: "/bus.png", // حط صورة الباص في public/
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

export default function StudentTripPage(){
  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <StudentTripPageContent />
    </ProtectedRoute>
  );
}

function StudentTripPageContent(){
  const { id } = useParams();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [trip,setTrip] = useState<any>(null);
  const [studentLoc,setStudentLoc] = useState<any>(null);
  const [station,setStation] = useState<any>(null);
  const [actualBusRoute,setActualBusRoute] = useState<any[]>([]); // Actual route from stations
  const [studentRoute,setStudentRoute] = useState<any[]>([]);
  const [busLocation, setBusLocation] = useState<any>(null);
  const [routeLoading, setRouteLoading] = useState(true);
  const [loading, setLoading] = useState(true);

  function haversineKm(lat1:number,lng1:number,lat2:number,lng2:number){
  const R = 6371;
  const dLat = (lat2-lat1)*Math.PI/180;
  const dLng = (lng2-lng1)*Math.PI/180;
  const a =
    Math.sin(dLat/2)**2 +
    Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*
    Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}

function findNearestStation(stations:any[], studentLoc:any) {
  let nearest = null;
  let min = Infinity;

  stations.forEach(s => {
    const coords = s.station?.location?.coordinates;
    if (!coords) return;

    const lat = coords[1];
    const lng = coords[0];
    const d = haversineKm(
      studentLoc.lat,
      studentLoc.lng,
      lat,
      lng
    );

    if (d < min) {
      min = d;
      nearest = { ...s, lat, lng, distanceKm: d };
    }
  });

  return nearest;
}


// Fetch route from OSRM between two points (follows actual roads)
async function fetchRoute(from:any, to:any) {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.routes && data.routes[0] && data.routes[0].geometry) {
      return data.routes[0].geometry.coordinates.map(
        ([lng,lat]:[number,number]) => [lat,lng]
      );
    }
    return [];
  } catch (error) {
    console.error("Error fetching route:", error);
    return [];
  }
}

// Build actual bus route from stations following real roads (OSRM)
async function buildActualBusRoute(stations: any[]): Promise<any[]> {
  if (!stations || !Array.isArray(stations) || stations.length < 2) return [];
  
  // Sort stations by order
  const sortedStations = [...stations].sort((a, b) => (a.order || 0) - (b.order || 0));
  
  // Extract valid station coordinates
  const stationCoords: any[] = [];
  sortedStations.forEach((s) => {
    const coords = s.station?.location?.coordinates;
    if (coords && coords.length === 2) {
      stationCoords.push({
        lat: coords[1],
        lng: coords[0],
        station: s
      });
    }
  });
  
  if (stationCoords.length < 2) return [];
  
  // Build route by connecting stations in order using OSRM
  const fullRoute: any[] = [];
  
  // For each pair of consecutive stations, fetch the route
  for (let i = 0; i < stationCoords.length - 1; i++) {
    const from = stationCoords[i];
    const to = stationCoords[i + 1];
    
    try {
      const segment = await fetchRoute(from, to);
      if (segment.length > 0) {
        // Add segment to full route (avoid duplicates at connection points)
        if (fullRoute.length > 0) {
          // Remove last point if it's the same as first point of next segment
          fullRoute.pop();
        }
        fullRoute.push(...segment);
      } else {
        // If OSRM fails, add straight line as fallback
        fullRoute.push([from.lat, from.lng]);
        fullRoute.push([to.lat, to.lng]);
      }
    } catch (error) {
      console.error(`Error fetching route segment ${i} to ${i+1}:`, error);
      // Fallback to straight line
      fullRoute.push([from.lat, from.lng]);
      fullRoute.push([to.lat, to.lng]);
    }
    
    // Add small delay to avoid rate limiting
    if (i < stationCoords.length - 2) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return fullRoute;
}


  // fetch trip and build real bus route
  useEffect(()=>{
    const fetchTrip = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get(`/trips/${id}`);
        const tripData = res.data;
        setTrip(tripData);
        
        // Set bus location if available
        if (tripData.driverLocation) {
          setBusLocation({
            lat: tripData.driverLocation.lat || 31.206856,
            lng: tripData.driverLocation.lng || 29.942034
          });
        }
        
        // Build actual bus route from stations following real roads
        if (tripData.route?.stations && tripData.route.stations.length > 0) {
          setRouteLoading(true);
          try {
            const route = await buildActualBusRoute(tripData.route.stations);
            setActualBusRoute(route);
          } catch (error) {
            console.error("Error building bus route:", error);
          } finally {
            setRouteLoading(false);
          }
        } else {
          setRouteLoading(false);
        }
      } catch (error) {
        console.error("Error fetching trip:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTrip();
  },[id]);

  // student GPS
  useEffect(()=>{
    navigator.geolocation.watchPosition(
      pos=>setStudentLoc({
        lat:pos.coords.latitude || 31.205753,
        lng:pos.coords.longitude || 29.924526
      }),
      console.error,
      { enableHighAccuracy:true }
    );
  },[]);
    console.log("Student location:", studentLoc);
  // Update bus location when trip data changes (for real-time updates)
  useEffect(() => {
    if (trip?.driverLocation) {
      setBusLocation({
        lat: trip.driverLocation.lat,
        lng: trip.driverLocation.lng
      });
    }
  }, [trip?.driverLocation]);

  // compute nearest station and student route
  useEffect(()=>{
    if(!trip || !studentLoc || !trip.route?.stations) return;

    const nearest = findNearestStation(
      trip.route.stations,
      studentLoc
    );
    if(!nearest) return;

    setStation(nearest);

    // Only fetch route from student to station (not bus route - use actual route)
    fetchRoute(studentLoc, { lat: nearest.lat, lng: nearest.lng })
      .then(setStudentRoute)
      .catch(console.error);

  },[trip, studentLoc]);

  if(loading || !trip) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading trip details...</p>
      </div>
    </div>
  );

  if(!studentLoc || !station) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Getting your location...</p>
      </div>
    </div>
  );

  // Calculate map center (between student and nearest station)
  const mapCenter: [number, number] = [
    (studentLoc.lat + station.lat) / 2,
    (studentLoc.lng + station.lng) / 2
  ];

  const stationIcon = new L.Icon({
    iconUrl: "/bus-stop.png",
    iconSize: [30, 30],
    iconAnchor: [15, 30],
  });

  const getStatusColor = (status: string) => {
    switch(status?.toLowerCase()) {
      case 'ongoing': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'scheduled': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'completed': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      <StudentSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        active="trips"
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push("/student-dashboard")}
                  className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Live Trip Tracking
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {trip.route?.name || "Route"} • {new Date(trip.tripDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(trip.status)}`}>
                {trip.status?.toUpperCase() || "UNKNOWN"}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            {/* Info Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {/* Bus Info Card */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Bus</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {trip.bus?.plateNumber || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Driver Info Card */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Driver</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {trip.driver?.name || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Nearest Station Card */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                    <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Nearest Station</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                      {station.station.name}
                    </p>
                  </div>
                </div>
              </div>

              {/* Distance Card */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
                    <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Distance</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {station.distanceKm.toFixed(2)} km
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Route Loading Indicator */}
            {routeLoading && (
              <div className="mb-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Loading bus route...
                  </p>
                </div>
              </div>
            )}

            {/* Map Container */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Live Map
                  </h2>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-gray-600 dark:text-gray-400">Bus Route</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full border-2 border-dashed border-blue-500"></div>
                      <span className="text-gray-600 dark:text-gray-400">Your Route</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="h-[600px] w-full">
                <MapContainer
                  center={mapCenter}
                  zoom={13}
                  style={{height:"100%",width:"100%"}}
                  className="z-0"
                >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>

                  {/* Student marker */}
                  <Marker position={[studentLoc.lat, studentLoc.lng]}>
                    <Popup>
                      <div className="text-center">
                        <p className="font-semibold">📍 Your Location</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {studentLoc.lat.toFixed(6)}, {studentLoc.lng.toFixed(6)}
                        </p>
                      </div>
                    </Popup>
                  </Marker>

                  {/* Bus marker (if location available) */}
                  {busLocation && (
                    <Marker
                      position={[busLocation.lat, busLocation.lng]}
                      icon={busIcon}
                    >
                      <Popup>
                        <div className="text-center">
                          <p className="font-semibold">🚍 Bus {trip.bus?.plateNumber}</p>
                          <p className="text-xs text-gray-500 mt-1">Live Location</p>
                        </div>
                      </Popup>
                    </Marker>
                  )}

                  {/* Nearest station marker */}
                  <Marker position={[station.lat, station.lng]} icon={stationIcon}>
                    <Popup>
                      <div className="text-center">
                        <p className="font-semibold">🚏 {station.station.name}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Arrival: {station.arrivalTime} • Departure: {station.departureTime}
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                          {station.distanceKm.toFixed(2)} km away
                        </p>
                      </div>
                    </Popup>
                  </Marker>

                  {/* All route stations markers */}
                  {trip.route?.stations?.map((s: any, idx: number) => {
                    const coords = s.station?.location?.coordinates;
                    if (!coords || coords.length !== 2) return null;
                    
                    const isNearest = s.station._id === station.station._id;
                    
                    return (
                      <Marker
                        key={idx}
                        position={[coords[1], coords[0]]}
                        icon={isNearest ? stationIcon : new L.Icon({
                          iconUrl: "/bus-stop.png",
                          iconSize: [25, 25],
                          iconAnchor: [12, 25],
                          className: "opacity-60"
                        })}
                      >
                        <Popup>
                          <div className="text-center">
                            <p className="font-semibold">🚏 {s.station.name}</p>
                            <p className="text-xs text-gray-500 mt-1">Station #{s.order}</p>
                            <p className="text-xs text-gray-500">
                              {s.arrivalTime} - {s.departureTime}
                            </p>
                            {isNearest && (
                              <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-semibold">
                                ✓ Nearest to you
                              </p>
                            )}
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}

                  {/* Actual bus route (from stations in order) - RED */}
                  {actualBusRoute.length > 0 && (
                    <Polyline 
                      positions={actualBusRoute} 
                      pathOptions={{
                        color: "#ef4444", 
                        weight: 5,
                        opacity: 0.8
                      }} 
                    />
                  )}

                  {/* Student route to nearest station - BLUE */}
                  {studentRoute.length > 0 && (
                    <Polyline 
                      positions={studentRoute} 
                      pathOptions={{
                        color: "#3b82f6", 
                        weight: 4,
                        opacity: 0.7,
                        dashArray: "10, 10"
                      }} 
                    />
                  )}

                </MapContainer>
              </div>
            </div>

            {/* Route Stations List */}
            <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Route Stations ({trip.route?.stations?.length || 0})
                </h3>
              </div>
              <div className="p-4">
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {trip.route?.stations
                    ?.sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
                    ?.map((s: any, idx: number) => {
                      const isNearest = s.station._id === station.station._id;
                      return (
                        <div
                          key={idx}
                          className={`p-4 rounded-lg border transition-colors ${
                            isNearest
                              ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                              : "bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                                isNearest
                                  ? "bg-blue-600 text-white"
                                  : "bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300"
                              }`}>
                                {s.order || idx + 1}
                              </div>
                              <div>
                                <p className={`font-medium ${
                                  isNearest
                                    ? "text-blue-900 dark:text-blue-200"
                                    : "text-gray-900 dark:text-white"
                                }`}>
                                  {s.station.name}
                                  {isNearest && (
                                    <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">
                                      Nearest
                                    </span>
                                  )}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                  Arrival: {s.arrivalTime} • Departure: {s.departureTime}
                                </p>
                              </div>
                            </div>
                            {isNearest && (
                              <div className="text-blue-600 dark:text-blue-400">
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
