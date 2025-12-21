"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import DriverSidebar from "@/Components/driver_sidebar";
import ProtectedRoute from "@/components/ProtectedRoute";
import apiClient from "@/lib/api";

const DriverMap = dynamic(() => import("@/Components/DriverMap"), {
  ssr: false,
});

interface Station {
  station: {
    _id: string;
    name: string;
    location: {
      coordinates: [number, number]; // [lng, lat]
    };
  };
  order: number;
  arrivalTime: string;
  departureTime: string;
}

interface Trip {
  _id: string;
  bus: {
    plateNumber: string;
  };
  driver: {
    name: string;
    email: string;
  };
  route: {
    _id: string;
    name: string;
    stations: Station[];
  };
  tripDate: string;
  departureTime: string;
  status: string;
}

export default function DriverTripPage() {
  return (
    <ProtectedRoute allowedRoles={["driver"]}>
      <DriverTripPageContent />
    </ProtectedRoute>
  );
}

function DriverTripPageContent() {
  const params = useParams();
  const router = useRouter();
  const tripId = params?.id as string;

  const [trip, setTrip] = useState<Trip | null>(null);
  const [driverPos, setDriverPos] = useState<{ lat: number; lng: number } | null>(null);
  const [tripStatus, setTripStatus] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch trip data
  useEffect(() => {
    if (!tripId) return;

    const fetchTrip = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get(`/trips/${tripId}`);
        setTrip(res.data);
        console.log("Fetched trip data:", res.data);
        if (res.data.status === "ongoing") {
          setTripStatus("ongoing");
          setIsTracking(true);
        }else if(res.data.status === "completed"){
          setTripStatus("completed");
          setIsTracking(false);
        }
        setError(null);
      } catch (err: unknown) {
        console.error("Error fetching trip:", err);
        const error = err as { response?: { data?: { message?: string } } };
        setError(error.response?.data?.message || "Failed to load trip");
      } finally {
        setLoading(false);
      }
    };

    fetchTrip();
  }, [tripId]);

  // Start trip and begin tracking
  const handleStartTrip = async () => {

     try {
      await apiClient.post(`/start-trip/${tripId}`);   
      setTripStatus("ongoing");
      alert('Trip started successfully!');
    } catch (err) {
      console.error('Error starting trip:', err);
      alert('Error starting trip');
    }

    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }



    // Request initial position
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const initialPos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setDriverPos(initialPos);
        setIsTracking(true);
      },
      (err) => {
        console.error("Error getting location:", err);
        alert("Failed to get your location. Please enable location permissions.");
      }
    );
  };

//  end trip function
  const endTrip = async () => {
    try {
      await apiClient.post(`/end-trip/${tripId}`);   
      setIsTracking(false);
      alert('Trip ended successfully!');
      router.push("/driver-dashboard");
    } catch (err) {
      console.error('Error ending trip:', err);
      alert('Error ending trip');
    }
  };

  // Real-time GPS tracking
  useEffect(() => {
    if (!isTracking || !tripId) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const loc = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setDriverPos(loc);

        // Send location to backend
        apiClient
          .post(`/trips/update-location/${tripId}`, loc)
          .catch((err) => console.error("Error updating location:", err));
      },
      (err) => {
        console.error("Geolocation error:", err);
        setError("Failed to track location");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [isTracking, tripId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Loading trip...
          </div>
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="text-2xl font-semibold text-red-600 mb-4">
            {error || "Trip not found"}
          </div>
          <button
            onClick={() => router.push("/driver-dashboard")}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Extract first station for route calculation
  const firstStation = trip.route?.stations?.[0];
  const firstStationCoords = firstStation?.station?.location?.coordinates
    ? {
        lng: firstStation.station.location.coordinates[0],
        lat: firstStation.station.location.coordinates[1],
      }
    : null;

  // Prepare stations data for map
  const stations = trip.route?.stations?.map((s) => ({
    position: [
      s.station.location.coordinates[1], // lat
      s.station.location.coordinates[0], // lng
    ] as [number, number],
    name: s.station.name,
    order: s.order,
    arrivalTime: s.arrivalTime,
    departureTime: s.departureTime,
  })) || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      <DriverSidebar
        sidebarOpen={false}
        setSidebarOpen={() => {}}
        active="trips"
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Trip Details
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {trip.route?.name || "Route"} • {trip.tripDate} • {trip.departureTime}
                </p>
              </div>
              <button
                onClick={() => router.push("/driver-dashboard")}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                ← Back
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Start Trip Button */}
            {!isTracking && tripStatus !== "completed" && (
              <div className="mb-6">
                <button
                  onClick={handleStartTrip}
                  className="w-full sm:w-auto px-8 py-4 bg-green-600 hover:bg-green-700 text-white text-lg font-semibold rounded-lg shadow-lg transition-colors"
                >
                  🚌 Start Trip
                </button>
              </div>)}

            {/* Trip Completed Status */}
            {tripStatus === "completed" ? (
              <div className="mb-6 p-4 bg-gray-200 dark:bg-green-900 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                  <span className="text-gray-800 dark:text-gray-200 font-semibold">
                    Trip Completed
                  </span>
                </div>
              </div>
            ) : null
            }

            {/* Trip Status */}
            {isTracking && (
              <div className="mb-6 p-4 bg-green-100 dark:bg-green-900 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-600 rounded-full animate-pulse"></div>
                  <span className="text-green-800 dark:text-green-200 font-semibold">
                    Trip Active • Tracking Location
                  </span>
                </div>
                {driverPos && (
                  <p className="text-sm text-green-700 dark:text-green-300 mt-2">
                    Current Location: {driverPos.lat.toFixed(6)}, {driverPos.lng.toFixed(6)}
                  </p>
                )}
                <button
                  onClick={endTrip}
                 className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                  End Trip
                </button>
              </div>
            )}

            {/* Map */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden mb-6">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Live Map
                </h2>
              </div>
              <div className="h-[600px] w-full">
                <DriverMap
                  driverPos={driverPos ? [driverPos.lat, driverPos.lng] : null}
                  firstStation={firstStationCoords}
                  stations={stations}
                  isTracking={isTracking}
                />
              </div>
            </div>

            {/* Trip Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Trip Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Bus:</span>
                    <span className="ml-2 text-gray-900 dark:text-white font-medium">
                      {trip.bus?.plateNumber || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Driver:</span>
                    <span className="ml-2 text-gray-900 dark:text-white font-medium">
                      {trip.driver?.name || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Date:</span>
                    <span className="ml-2 text-gray-900 dark:text-white font-medium">
                      {new Date(trip.tripDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Departure Time:</span>
                    <span className="ml-2 text-gray-900 dark:text-white font-medium">
                      {trip.departureTime}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Status:</span>
                    <span className="ml-2 text-gray-900 dark:text-white font-medium">
                      {trip.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Route Stations ({stations.length})
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {stations.map((station, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600"
                    >
                      <div className="font-medium text-gray-900 dark:text-white">
                        {idx + 1}. {station.name || `Station ${station.order}`}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Arrival: {station.arrivalTime} • Departure: {station.departureTime}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

