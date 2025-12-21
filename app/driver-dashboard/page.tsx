'use client'
import React, { useState, useEffect } from 'react'
import DriverSidebar from '@/Components/driver_sidebar'
import axios from 'axios'
import Link from 'next/link'
import ProtectedRoute from '@/components/ProtectedRoute'
import apiClient from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

export default function Page() {
    return (
        <ProtectedRoute allowedRoles={["driver"]}>
            <DriverDashboardContent />
        </ProtectedRoute>
    );
}

function DriverDashboardContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [driverId, setDriverId] = useState<string | null>(null)
  const [trips, setTrips] = useState<any[]>([])
  const [nextTrips, setNextTrips] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const { user } = useAuthStore();

  // Helper to format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }
  // Load driverId from auth store
  useEffect(() => {
    if (user && user._id) {
      setDriverId(user._id);
    } else if (user && user.id) {
      setDriverId(user.id);
    }
  }, [user])

  // Fetch trips only once driverId is ready
  useEffect(() => {
    if (!driverId) return

    const fetchTrips = async () => {
      try {
        setLoading(true)

        const res = await apiClient.get(`/driver-trips/${driverId}`)
        const allTrips = Array.isArray(res.data?.trips) ? res.data.trips : []
        console.log("Fetched driver trips:", allTrips)
        setTrips(allTrips)

        // Helper to build full trip datetime
        const getTripStartDate = (trip: any) => {
          try {
            const base = new Date(trip.tripDate)
            const [h, m] = trip.departureTime.split(":").map(Number)
            base.setHours(h, m, 0, 0)
            return base
          } catch {
            return null
          }
        }

        const now = new Date()
        const next30 = new Date(Date.now() + 30 * 60 * 1000) // next 30 min

        const filtered = allTrips.filter(trip => {
          const startTime = getTripStartDate(trip)
          if (!startTime) return false
          return startTime >= now && startTime <= next30
        })

        setNextTrips(filtered)
        console.log("Next trips:", filtered)

      } catch (err) {
        console.error("Error fetching driver trips:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchTrips()
  }, [driverId])   // <-- THIS FIXES THE INFINITE LOOP 🎉

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
                  Driver Dashboard - {user.name}
                </h1>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* Upcoming Trips */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Upcoming Trips (Next 30 Minutes): {nextTrips.length}
              </h2>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="text-center text-gray-500">Loading...</div>
              ) : nextTrips.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">🚌</div>
                  <p className="text-gray-600 dark:text-gray-400 text-lg">
                    No trips starting soon
                  </p>
                </div>
              ) : (
                nextTrips.map(trip => (
                  <Link href={`/driver/trip/${trip._id}`} key={trip._id}>
                    <div className="cursor-pointer p-4 bg-gray-100 dark:bg-gray-700 rounded mb-4 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                      <p className="text-lg font-medium text-gray-900 dark:text-white">
                        Trip ID: {trip._id}
                      </p>

                      <p className="text-gray-700 dark:text-gray-300">
                        Date: {trip.tripDate}
                      </p>

                      <p className="text-gray-700 dark:text-gray-300">
                        Starts at: {trip.departureTime}
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 my-6 rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                all Trips: {trips.length}
              </h2>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="text-center text-gray-500">Loading...</div>
              ) : trips.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">🚌</div>
                  <p className="text-gray-600 dark:text-gray-400 text-lg">
                    No trips
                  </p>
                </div>
              ) : (
                trips.map(trip => (
                  <Link href={`/driver/trip/${trip._id}`} key={trip._id}>
                    <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded mb-4 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer">
                      <p className="text-lg font-medium text-gray-900 dark:text-white">
                        Trip name: {trip.name}
                      </p>

                      <p className="text-gray-700 dark:text-gray-300">
                        Date: {formatDate(trip.tripDate)}
                      </p>

                      <p className="text-gray-700 dark:text-gray-300">
                        Starts at: {trip.departureTime}
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

        </main>
      </div>
    </div>
  )
}
