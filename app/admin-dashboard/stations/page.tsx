'use client'

import React from 'react'
import axios from 'axios'
import AdminSidebar from '@/Components/admin_sidebar'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import dynamic from 'next/dynamic'
import apiClient from '@/lib/api'

const StationLeafletMap = dynamic(() => import('@/Components/StationLeafletMap'), {
  ssr: false
})

interface Station {
  _id: string
  name: string
  address?: string
  location?: {
    type: string
    coordinates: [number, number] // [lng, lat]
  }
}

const StationsPage = () => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const [showForm, setShowForm] = React.useState(false)
  const [editingStation, setEditingStation] = React.useState<Station | null>(null)
  const [mapVisible, setMapVisible] = React.useState(false)
  const [selectedLocation, setSelectedLocation] = React.useState<{ lat: number; lng: number } | null>(null)

  const [formData, setFormData] = React.useState({
    name: '',
    address: '',
    lat: '',
    lng: ''
  })

  const queryClient = useQueryClient()

  // Fetch Data
  const { data: stations = [] } = useQuery({
    queryKey: ['stations'],
    queryFn: async () => {
      const response = await apiClient.get('/stations')
      return response.data.stations || []
    }
  })

  // Mutations
  const addStationMutation = useMutation({
    mutationFn: (newStation: any) => apiClient.post('/add-station', newStation),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stations'] })
      resetForm()
      alert('Station added successfully!')
    },
    onError: (err: any) => {
      console.error(err)
      alert(err.response?.data?.message || err.response?.data?.error || 'Error adding station')
    }
  })

  const updateStationMutation = useMutation({
    mutationFn: (updatedStation: any) =>
      apiClient.put(`/update-station/${updatedStation._id}`, updatedStation),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stations'] })
      resetForm()
      alert('Station updated successfully!')
    },
    onError: (err: any) => {
      console.error(err)
      alert(err.response?.data?.message || err.response?.data?.error || 'Error updating station')
    }
  })

  const deleteStationMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/delete-station/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['stations'] })
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const stationPayload: any = {
      name: formData.name,
      address: formData.address
    }

    // Add location if coordinates are provided
    if (formData.lat && formData.lng) {
      stationPayload.location = {
        coordinates: [parseFloat(formData.lng), parseFloat(formData.lat)] // [lng, lat]
      }
    } else if (selectedLocation) {
      stationPayload.location = {
        coordinates: [selectedLocation.lng, selectedLocation.lat]
      }
    }

    try {
      if (editingStation) {
        await updateStationMutation.mutateAsync({ ...stationPayload, _id: editingStation._id })
      } else {
        await addStationMutation.mutateAsync(stationPayload)
      }
    } catch (err: any) {
      // Error is handled in onError callback
      console.error(err)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      lat: '',
      lng: ''
    })
    setEditingStation(null)
    setShowForm(false)
    setMapVisible(false)
    setSelectedLocation(null)
  }

  const startEditStation = (station: Station) => {
    setEditingStation(station)
    setFormData({
      name: station.name,
      address: station.address || '',
      lat: station.location?.coordinates ? station.location.coordinates[1].toString() : '',
      lng: station.location?.coordinates ? station.location.coordinates[0].toString() : ''
    })
    if (station.location?.coordinates) {
      setSelectedLocation({
        lat: station.location.coordinates[1],
        lng: station.location.coordinates[0]
      })
    }
    setShowForm(true)
  }

  const handleDeleteStation = (id: string) => {
    if (confirm('Delete this station?')) {
      deleteStationMutation.mutate(id)
    }
  }

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setSelectedLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
          setFormData({
            ...formData,
            lat: position.coords.latitude.toFixed(6),
            lng: position.coords.longitude.toFixed(6)
          })
        },
        (error) => {
          alert('Error getting location: ' + error.message)
        }
      )
    } else {
      alert('Geolocation is not supported by this browser')
    }
  }

  return (
    <div className="min-h-screen flex bg-gray-900">
      <AdminSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} active="stations" />

      <div className="flex-1 overflow-y-auto">
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
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Buses Management</h1>
            </div>

            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {showForm ? "Cancel" : "Add Station"}
            </button>
          </div>
        </header>
        {/* Form */}
        {showForm && (
          <div className="bg-gray-800 m-6 p-6 rounded-lg mb-6">
            <h2 className="text-xl font-semibold mb-3 text-white">
              {editingStation ? 'Edit Station' : 'Add Station'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Station Name */}
                <input
                  type="text"
                  required
                  placeholder="Station Name"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="border p-2 rounded bg-gray-700 text-white"
                />

                {/* Address */}
                <input
                  type="text"
                  placeholder="Address (optional)"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="border p-2 rounded bg-gray-700 text-white"
                />
              </div>

              {/* Location Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-white">Location (optional)</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={getCurrentLocation}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                    >
                      Use Current Location
                    </button>
                    <button
                      type="button"
                      onClick={() => setMapVisible(!mapVisible)}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    >
                      {mapVisible ? 'Hide Map' : 'Show Map'}
                    </button>
                  </div>
                </div>

                {/* Map or Manual Input */}
                {mapVisible ? (
                  <div className="mb-4">
                    <StationLeafletMap
                      selectedLocation={selectedLocation}
                      onLocationSelect={({ lat, lng }) => {
                        setSelectedLocation({ lat, lng })
                        setFormData(prev => ({
                          ...prev,
                          lat: lat.toFixed(6),
                          lng: lng.toFixed(6)
                        }))
                      }}
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="number"
                      step="any"
                      placeholder="Latitude"
                      value={formData.lat}
                      onChange={e => {
                        setFormData({ ...formData, lat: e.target.value })
                        if (e.target.value) {
                          setSelectedLocation({ lat: parseFloat(e.target.value), lng: parseFloat(formData.lng) || 0 })
                        }
                      }}
                      className="border p-2 rounded bg-gray-700 text-white"
                    />
                    <input
                      type="number"
                      step="any"
                      placeholder="Longitude"
                      value={formData.lng}
                      onChange={e => {
                        setFormData({ ...formData, lng: e.target.value })
                        if (e.target.value) {
                          setSelectedLocation({ lat: parseFloat(formData.lat) || 0, lng: parseFloat(e.target.value) })
                        }
                      }}
                      className="border p-2 rounded bg-gray-700 text-white"
                    />
                  </div>
                )}

                {selectedLocation && (
                  <p className="text-gray-400 text-sm">
                    Selected: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                  </p>
                )}
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2 border border-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
                  disabled={addStationMutation.isPending || updateStationMutation.isPending}
                >
                  {addStationMutation.isPending || updateStationMutation.isPending
                    ? 'Saving...'
                    : editingStation
                    ? 'Update Station'
                    : 'Add Station'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Stations List */}
        <div className="bg-gray-800 p-4 m-6 rounded">
          <h2 className="text-lg font-semibold mb-3 text-white">All Stations ({stations.length})</h2>

          <div className="space-y-4">
            {stations.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p>No stations found. Add your first station!</p>
              </div>
            ) : (
              stations.map((station: Station) => (
                <div key={station._id} className="border border-gray-700 p-4 rounded">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-white">{station.name}</h3>
                      {station.address && (
                        <p className="text-gray-400 mt-1">{station.address}</p>
                      )}
                      {station.location?.coordinates && (
                        <p className="text-gray-400 text-sm mt-1">
                          Location: {station.location.coordinates[1].toFixed(6)}, {station.location.coordinates[0]}
                        </p>
                      )}
                      {station.location?.coordinates && (
                        <a
                          href={`https://www.google.com/maps?q=${station.location.coordinates[1]},${station.location.coordinates[0]}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 text-sm mt-2 inline-block"
                        >
                          View on Google Maps →
                        </a>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEditStation(station)}
                        className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteStation(station._id)}
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default StationsPage
