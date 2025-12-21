"use client";

import React, { use, useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "next/navigation";
import DriverSidebar from "@/Components/driver_sidebar";

import dynamic from "next/dynamic";
import { start } from "repl";
import apiClient from "@/lib/api";

const DriverMap = dynamic(() => import("@/Components/DriverMap"), {
  ssr: false,
});

type PageProps = {
  params: {
    tripId: string;
  };
};

export default function DriverTripPage({ params }: PageProps) {
  const { tripId } = params;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tripStarted, setTripStarted] = useState(false);
  // const [endtrip, setEndTrip] = useState(false);

  // Types for trip data
  interface RouteRef { _id?: string; name?: string; stations?: any }
  interface EntityRef { _id?: string; name?: string }
  interface TripType {
    _id: string
    name?: string
    route?: RouteRef | string
    driver?: EntityRef | string
    bus?: { plateNumber?: string } | string
    departureTime?: string
    tripDate?: string
    status?: string
    students?: any[]
  }

  const [trip, setTrip] = useState<TripType | null>(null);
  const [driverPos, setDriverPos] = useState<{ lat: number; lng: number } | null>(null);
  const [route, setRoute] = useState<[number, number][]>([]);

  const [stations, setStations] = useState<
    Array<{
      position: [number, number];
      name?: string ;
    order?: number;
      arrivalTime?: string;
      departureTime?: string;
    }>
  >([]);

  useEffect(() => {
    apiClient
      .get(`/trips/${tripId}`)
      .then(async (res) => {
        console.log("Fetched trip data:", res.data);
        setTrip(res.data as TripType);

        // attempt to fetch full route details (stations with locations)
        try {
          const routeProp = res.data.route;
          const routeId = routeProp && typeof routeProp === "object" ? (routeProp as { _id?: string })._id ?? routeProp : routeProp;
          if (routeId) {
            const routeRes = await apiClient.get(`/routes/${routeId}`);
            const routeData = routeRes.data;
            type RouteStationRaw = {
              station?: { name?: string; location?: { coordinates?: number[] } } | null;
              order?: number;
              arrivalTime?: string;
              departureTime?: string;
            };
            const stationsRaw = (routeData.stations || []) as RouteStationRaw[];
            const stationsMapped = stationsRaw.map((s: RouteStationRaw) => {
              const station = s.station || {};
              const coords = station.location && Array.isArray(station.location.coordinates) ? station.location.coordinates : null; // [lng, lat]
              const latLng = coords ? ([coords[1], coords[0]] as [number, number]) : null;
              return {
                position: latLng,
                name: station.name,
                order: s.order,
                arrivalTime: s.arrivalTime,
                departureTime: s.departureTime,
              };
            });

            const routePositions = stationsMapped
              .map((s) => s.position)
              .filter((p): p is [number, number] => p !== null);
            setRoute(routePositions);
            // pass stations with metadata to map (filter out null positions)
            const filteredStations = stationsMapped
              .filter((s) => s.position !== null)
              .map((s) => ({
                position: s.position as [number, number],
                name: s.name,
                order: s.order,
                arrivalTime: s.arrivalTime,
                departureTime: s.departureTime,
              }));
            setStations(filteredStations);
            return;
          }
        } catch (e) {
          console.error("Error fetching route details:", e);
        }

        // fallback: if route stations already included in trip response and contain coords
        type FallbackStationRaw = {
          station?: { location?: { coordinates?: number[] }; name?: string } | null;
          order?: number;
          arrivalTime?: string;
          departureTime?: string;
        };
        const fallbackStations = (res.data.route?.stations || []) as FallbackStationRaw[];
        const fallbackMapped = fallbackStations.map((station) => ({
          position: station.station?.location?.coordinates ? ([station.station.location.coordinates[1], station.station.location.coordinates[0]] as [number, number]) : null,
          name: station.station?.name,
          order: station.order,
          arrivalTime: station.arrivalTime,
          departureTime: station.departureTime,
        }));
        const fallbackPositions = fallbackMapped.map((s) => s.position).filter((p): p is [number, number] => p !== null);
        setRoute(fallbackPositions);
        const filteredFallbackStations = fallbackMapped
          .filter(
            (
              s
            ): s is {
              position: [number, number];
              name: string | undefined;
              order: number | undefined;
              arrivalTime: string | undefined;
              departureTime: string | undefined;
            } => s.position !== null
          )

          .map((s) => ({
            position: s.position as [number, number],
            name: s.name,
            order: s.order,
            arrivalTime: s.arrivalTime,
            departureTime: s.departureTime,
          }));
        setStations(filteredFallbackStations);
      })
      .catch((err) => console.error("Error fetching trip:", err));
  }, [tripId]);

  // Track real-time driver location
  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition((pos) => {
      const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      // const loc = { lat: 31.245552 , lng: 29.966245 };
      setDriverPos(loc);

      apiClient.post(`/trips/update-location/${tripId}`, loc).catch((e) => console.error(e));
      // console.log("Last station:", route[route.length - 1], "Current location:", loc);
      // if (trip && Array.isArray(trip.route) && trip.route.length > 0) {
      //   const lastStation = trip.route[trip.route.length - 1];
      //   console.log("Last station:", lastStation, "Current location:", loc);
      //   if (lastStation && typeof lastStation === 'object' && 'position' in lastStation && loc === lastStation.position) {
      //     setEndTrip(true);
      //   }
      // }
    });

    return () => navigator.geolocation.clearWatch(watchId);
  }, [tripId]);

  if (!trip) return <p>Loading trip...</p>;
  console.log("Driver position:", driverPos);
  console.log("Route data:", route);

  // Get first station for route calculation
  const firstStation = stations.length > 0 && stations[0].position
    ? { lat: stations[0].position[0], lng: stations[0].position[1] }
    : null;


  const start_trip = async () => {
    try {
      await apiClient.post(`/start-trip/${tripId}`);
      setTripStarted(true);
      alert('Trip started successfully!');
    } catch (err) {
      console.error('Error starting trip:', err);
      alert('Error starting trip');
    }
  };

  // const end_trip = async () => {
  //   try {
  //     await axios.post(`http://localhost:5000/end-trip/${tripId}`);
  //     setEndTrip(false);
  //     alert('Trip ended successfully!');
  //   } catch (err) {
  //     console.error('Error ending trip:', err);
  //     alert('Error ending trip');
  //   } 
  // };

  // return (
  //   <div>

  //     <DriverSidebar
  //       sidebarOpen={sidebarOpen}
  //       setSidebarOpen={setSidebarOpen}
  //       active="dashboard"
  //     />
  //     <h1>Trip: {typeof trip.route === 'object' ? trip.route.name ?? tripId : (typeof trip.route === 'string' ? trip.route : tripId)}</h1>

  //     <div style={{ display: "flex", gap: 20 }}>
  //       <div style={{ flex: 1 }}>
  //       <DriverMap
  //         driverPos={driverPos ? [driverPos.lat, driverPos.lng] : null}
  //         stations={stations}
  //         firstStation={firstStation}
  //         isTracking={!!driverPos}
  //       />
  //       </div>

  //       <div style={{ width: 320 }}>
  //         <h2>Trip Details</h2>
  //         <div><strong>Driver:</strong> {trip.driver?.name ?? trip.driver}</div>
  //         <div><strong>Bus:</strong> {trip.bus?.plateNumber ?? "-"}</div>
  //         <div><strong>Departure:</strong> {trip.departureTime}</div>
  //         <div><strong>Date:</strong> {new Date(trip.tripDate).toLocaleString()}</div>
  //         <div><strong>Status:</strong> {trip.status}</div>
  //         <div><strong>Students:</strong> {Array.isArray(trip.students) ? trip.students.length : 0}</div>

  //         <h3 style={{ marginTop: 12 }}>Live Driver Location</h3>
  //         <div>{driverPos ? `${driverPos.lat.toFixed(6)}, ${driverPos.lng.toFixed(6)}` : "Waiting for location..."}</div>

  //         <h3 style={{ marginTop: 12 }}>Route Stations</h3>
  //         <ol>
  //           {stations.map((s, idx) => (
  //             <li key={idx}>
  //               <div><strong>{s.name ?? `Station ${s.order ?? idx + 1}`}</strong></div>
  //               <div>Coords: {s.position ? `${s.position[0].toFixed(6)}, ${s.position[1].toFixed(6)}` : "-"}</div>
  //               <div>Arrival: {s.arrivalTime ?? "-"} — Departure: {s.departureTime ?? "-"}</div>
  //             </li>
  //           ))}
  //         </ol>
  //       </div>
  //     </div>
  //   </div>
  // );




  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">

      <DriverSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        active="trips"
      />

      <div className="flex-1 flex flex-col overflow-hidden">

        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mr-4"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>

                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Driver Dashboard
                </h1>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-8">

          <h1>Trip: {typeof trip.route === 'object' ? trip.route.name ?? tripId : (typeof trip.route === 'string' ? trip.route : tripId)}</h1>
          {/* <DriverMap
                  driverPos={driverPos ? [driverPos.lat, driverPos.lng] : null}
                  stations={stations}
                  firstStation={firstStation}
                  isTracking={!!driverPos}
                /> */}
          <div style={{ display: "flex", gap: 20 }}>
            {tripStarted ? (
              <div style={{ flex: 1 }}>
                <DriverMap
                  driverPos={driverPos ? [driverPos.lat, driverPos.lng] : null}
                  stations={stations}
                  firstStation={firstStation}
                  isTracking={!!driverPos}
                />
              </div>
            ) : (
              <button
                onClick={() => start_trip()}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 mt-4"
              >
                Start Trip
              </button>
            )}
            {/* {
              endtrip && (<div style={{ flex: 1 }}>
                <button
                  onClick={end_trip()}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 mt-4"
                >
                  End Trip
                </button>
              </div>)
            } */}

            <div style={{ width: 320 }}>
              <h1>Trip Details</h1>
              <div><strong>Driver:</strong> {typeof trip.driver === 'object' ? (trip.driver.name ?? String(trip.driver)) : (typeof trip.driver === 'string' ? trip.driver : '-')}</div>
              <div><strong>Bus:</strong> {typeof trip.bus === 'object' ? (trip.bus.plateNumber ?? '-') : (typeof trip.bus === 'string' ? trip.bus : '-')}</div>
              <div><strong>Departure:</strong> {trip.departureTime ?? '-'}</div>
              <div><strong>Date:</strong> {trip.tripDate ? new Date(trip.tripDate).toLocaleString() : '-'}</div>
              <div><strong>Status:</strong> {trip.status}</div>
              <div><strong>Students:</strong> {Array.isArray(trip.students) ? trip.students.length : 0}</div>

              <h3 style={{ marginTop: 12 }}>Live Driver Location</h3>
              <div>{driverPos ? `${driverPos.lat.toFixed(6)}, ${driverPos.lng.toFixed(6)}` : "Waiting for location..."}</div>

              <h3 style={{ marginTop: 12 }}>Route Stations</h3>
              <ol>
                {stations.map((s, idx) => (
                  <li key={idx}>
                    <div><strong>{s.name ?? `Station ${s.order ?? idx + 1}`}</strong></div>
                    <div>Coords: {s.position ? `${s.position[0].toFixed(6)}, ${s.position[1].toFixed(6)}` : "-"}</div>
                    <div>Arrival: {s.arrivalTime ?? "-"} — Departure: {s.departureTime ?? "-"}</div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </main>
      </div>
    </div>

  )

}
