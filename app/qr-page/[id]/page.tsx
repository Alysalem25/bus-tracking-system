'use client'
import { useParams } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import apiClient from '@/lib/api'

const Page = () => {
  const { id } = useParams()
  const [trip, setTrip] = useState(null)
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    if (!id) return

    apiClient
      .get(`/bus-trip/${id}`)
      .then(res => {
        setTrip(res.data.trips[0])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  const addStudent = async () => {
    const studentId = prompt('Enter Student ID')
    if (!studentId) return

    try {
      setAdding(true)
      await apiClient.post(
        `/bus-trip/${trip._id}/add-student`,
        { studentId }
      )

      const res = await apiClient.get(`/bus-trip/${id}`)
      setTrip(res.data.trips[0])
      alert('Student added successfully')
    } catch (err) {
      alert('Failed to add student')
      console.error(err)
    } finally {
      setAdding(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (!trip) {
    return (
      <div className="text-center mt-20 text-gray-800">
        No trip found
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-900 p-6">
      <div className="max-w-4xl mx-auto bg-gray-800 rounded-2xl shadow-xl p-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Bus Trip</h1>
            <p className="text-sm text-white">
              Trip ID: {trip.name}
            </p>
          </div>

          <span
            className={`px-4 py-1 rounded-full text-sm font-medium
            ${trip.status === 'ongoing'
              ? 'bg-green-800 text-white'
              : 'bg-gray-800 text-gray-600'}`}
          >
            {trip.status}
          </span>
        </div>

        {/* Grid Info */}
        <div className="grid grid-cols-1 md:grid-cols-1 gap-6">

          {/* Driver */}
          <div className="bg-gray-50 rounded-xl p-5">
            <h3 className="font-semibold text-gray-700 mb-2">Driver</h3>
            <p className="text-gray-800">{trip.driver.name}</p>
            <p className="text-sm text-gray-500">{trip.driver.email}</p>
          </div>

          {/* Bus */}
          <div className="bg-gray-50 rounded-xl p-5">
            <h3 className="font-semibold text-gray-700 mb-2">Bus</h3>
            <p className="text-gray-800">
              Plate: {trip.bus.plateNumber}
            </p>
            <p className="text-sm text-gray-800">
              Capacity: {trip.bus.capacity}
            </p>
          </div>

          {/* Schedule */}
          <div className="bg-gray-50 text-gray-800 rounded-xl p-5">
            <h3 className="font-semibold text-gray-700 mb-2">Schedule</h3>
            <p>Departure: {trip.departureTime}</p>
            <p>
              Date:{' '}
              {new Date(trip.tripDate).toLocaleDateString()}
            </p>
          </div>

          {/* Students */}
          <div className="bg-gray-50 rounded-xl p-5">
            <h3 className="font-semibold text-gray-700 mb-2">Students</h3>
            <p className="text-lg font-bold text-blue-600">
              {trip.students.length}
            </p>
          </div>
        </div>

        {/* Action */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={addStudent}
            disabled={adding}
            className="px-6 py-3 rounded-xl bg-blue-600 text-gray-800 font-medium
              hover:bg-blue-700 transition
              disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            {adding ? 'Adding...' : '➕ Add Student'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Page
