"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import StudentSidebar from "@/Components/student_sidebar";
import ProtectedRoute from "@/components/ProtectedRoute";
import apiClient from "@/lib/api";

type LatLng = { lat: number; lng: number };

export default function Page() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [trips, setTrips] = useState<any[]>([]);
  const [closestTrips, setClosestTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <StudentDashboardContent 
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
    </ProtectedRoute>
  );
}

function StudentDashboardContent({ sidebarOpen, setSidebarOpen }: { sidebarOpen: boolean; setSidebarOpen: (open: boolean) => void }) {
  const [trips, setTrips] = useState<any[]>([]);
  const [closestTrips, setClosestTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // ✅ Student current location (later from GPS)
//   const studentLocation: LatLng = {
//     lat: 31.208162,//,
//     lng:  29.935486 ,
//   };
  const [studentLocation, setStudentLocation] = useState<LatLng>({ lat: 0, lng: 0 });

useEffect(() => {
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition((pos) => {
            setStudentLocation({
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
            });
        });
    }
}, []);

//    const watchId = navigator.geolocation.watchPosition((pos) => {
//       const studentLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };});

  // -----------------------------
  // Haversine distance (KM)
  // -----------------------------
  function getDistanceKm(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;

    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  // -----------------------------
  // Find nearest station per trip
  // -----------------------------
  function getClosestTrips(trips: any[], maxDistanceKm = 1) {
    const results: any[] = [];

    trips.forEach((trip) => {
      const stations = trip?.route?.stations;
      if (!Array.isArray(stations)) return;

      let nearestStation = null;
      let minDistance = Infinity;

      stations.forEach((s: any) => {
        const coords = s?.station?.location?.coordinates;
        if (!coords || coords.length !== 2) return;

        const stationLat = coords[1];
        const stationLng = coords[0];

        const distanceKm = getDistanceKm(
          studentLocation.lat,
          studentLocation.lng,
          stationLat,
          stationLng
        );

        if (distanceKm <= maxDistanceKm && distanceKm < minDistance) {
          minDistance = distanceKm;
          nearestStation = {
            name: s.station.name,
            lat: stationLat,
            lng: stationLng,
            order: s.order,
            arrivalTime: s.arrivalTime,
            departureTime: s.departureTime,
          };
        }
      });

      if (nearestStation) {
        results.push({
          _id: trip._id,
          tripId: trip._id,
          bus: trip.bus,
          driver: trip.driver,
          status: trip.status,
          route: trip.route,
          nearestStation,
          distanceKm: minDistance,
        });
      }
    });

    return results.sort((a, b) => a.distanceKm - b.distanceKm);
  }

  // -----------------------------
  // Fetch active trips
  // -----------------------------
  useEffect(() => {
    const fetchTrips = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get("/active-trips");
        const tripsData = Array.isArray(res.data.trips) ? res.data.trips : [];
        setTrips(tripsData);
      } catch (err) {
        console.error("❌ Error fetching trips:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrips();
  }, []);

  // -----------------------------
  // Update closest trips when student location changes
  // -----------------------------
  useEffect(() => {
    // Only calculate closest trips if student location is available (not 0,0)
    if (studentLocation.lat !== 0 && studentLocation.lng !== 0 && trips.length > 0) {
      const closest = getClosestTrips(trips, 1);
      setClosestTrips(closest);
    } else {
      setClosestTrips([]);
    }
  }, [studentLocation, trips]);

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      <StudentSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        active="trips"
      />

      <div className="flex-1 px-6 py-8">
        <h1 className="text-2xl font-bold mb-4">Nearby Trips</h1>

        {loading && <p>Loading trips...</p>}

        {!loading && closestTrips.length === 0 && (
          <p className="text-gray-500">No nearby trips within 1 KM</p>
        )}

        <div className="space-y-4">
          {closestTrips.map((t, index) => (
            <div
              key={index}
              className="p-4 rounded-lg border bg-gray-800 text-white"
            >
              <p className="_id">{t._id}</p>
              <h2 className="font-semibold">
                🚌 Bus: {t.bus?.plateNumber ?? "N/A"}
              </h2>

              <p>👨‍✈️ Driver: {t.driver?.name}</p>
              <p>📍 Station: {t.nearestStation.name}</p>
              <p>
                ⏱ {t.nearestStation.arrivalTime} →{" "}
                {t.nearestStation.departureTime}
              </p>

              <p className="text-sm text-gray-400">
                Distance: {t.distanceKm.toFixed(2)} KM
              </p>

              <button
                className="mt-3 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition-colors"
                onClick={() =>
                  (window.location.href = `/student-dashboard/trip/${t._id}`)
                }
              >
                View Trip
              </button>
            </div>
          ))}
        </div>
        <div className="space-y-4">
          {trips.map((t, index) => (
            <div
              key={index}
              className="p-4 rounded-lg border bg-gray-800 text-white"
            >
              <h2 className="font-semibold">
                🚌 Bus: {t.bus?.plateNumber ?? "N/A"}
              </h2>

              <p>👨‍✈️ Driver: {t.driver?.name}</p>
              <p>📍 Station: {t.name}</p>
              {/* <p>
                ⏱ {t.nearestStation.arrivalTime} →{" "}
                {t.nearestStation.departureTime}
              </p> */}

              {/* <p className="text-sm text-gray-400">
                Distance: {t.distanceKm.toFixed(2)} KM
              </p> */}

              <button
                className="mt-3 px-4 py-2 bg-blue-600 rounded"
                onClick={() =>
                  (window.location.href = `/student-dashboard/trip/${t._id}`)
                }
              >
                View Trip
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
