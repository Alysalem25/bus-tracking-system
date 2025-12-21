"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "next/navigation";
import AdminSidebar from '@/Components/admin_sidebar';
import RouterMap from '@/Components/routemap';
import apiClient from "@/lib/api";

const TripDetails = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const { id } = useParams();
  const [trip, setTrip] = useState<any>(null);
  const [route, setRoute] = useState<any>(null);

  // ❗ ADD THIS FUNCTION
  const handleLocationSelect = (lat: number, lng: number) => {
    setSelectedLocation({ lat, lng });
  };

  useEffect(() => {
    if (!id) return;

    const fetchTrip = async () => {
      try {
        const res = await apiClient.get(`/trips/${id}`);
        console.log("Fetched trip data:", res.data);
        const routereq = await apiClient.get(`/routes/${res.data.route._id}`);
        console.log("Fetched route data:", routereq.data.stations);
        setTrip(res.data);
        setRoute(routereq.data.stations);

      } catch (err) {
        console.error("Error fetching trip:", err);
      }
    };

    fetchTrip();
  }, [id]);

  if (!trip) return <p>Loading trip details...</p>;

  return (
    <div className="min-h-screen flex bg-gray-900">
      <AdminSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} active="trips" />
      {/* Header */}
     <div className="flex-1 overflow-y-auto bg-gray-900">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mr-4"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">trip details</h1>
            </div>

          </div>
        </header>
      <div className="flex-1 p-6">



        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Trip Info Card */}
          <div className="col-span-1 bg-gray-800 border border-gray-700 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Trip Information</h2>

            <div className="space-y-3 text-gray-300">
              <p><strong className="text-white">Bus:</strong> {trip.bus?.plateNumber}</p>
              <p><strong className="text-white">Driver:</strong> {trip.driver?.name}</p>
              <p><strong className="text-white">Route:</strong> {trip.route?.name || trip.route}</p>
              <p><strong className="text-white">Date:</strong> {trip.tripDate ? new Date(trip.tripDate).toLocaleDateString() : "N/A"}</p>
              <p><strong className="text-white">Time:</strong> {trip.departureTime || "N/A"}</p>
            </div>
          </div>

          {/* Map Section */}
          <div className="col-span-2 bg-gray-800 border border-gray-700 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Route Map</h2>

            <div className="h-[500px] rounded-lg overflow-hidden border border-gray-700">
              <RouterMap stations={route || []} />
            </div>
          </div>

        </div>
      </div>
    </div>
</div>
  );
};

export default TripDetails;
