'use client'

import React from 'react'
import axios from 'axios'
import AdminSidebar from '@/Components/admin_sidebar'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/api'

interface Station {
  _id: string
  name: string
  address?: string
  location?: {
    coordinates: [number, number]
  }
}

interface RouteStation {
  station: string | Station
  order: number
  arrivalTime: string
  departureTime: string
}

interface Route {
  _id: string
  name: string
  description?: string
  stations: RouteStation[]
  isActive: boolean
}

const RoutesPage = () => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const [showForm, setShowForm] = React.useState(false)
  const [editingRoute, setEditingRoute] = React.useState<Route | null>(null)

  const [formData, setFormData] = React.useState({
    name: '',
    description: '',
    stations: [] as Array<{ station: string; order: number; arrivalTime: string; departureTime: string }>
  })

  const [newRouteStation, setNewRouteStation] = React.useState({
    station: '',
    arrivalTime: '',
    departureTime: ''
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

  const { data: routes = [] } = useQuery({
    queryKey: ['routes'],
    queryFn: async () => {
      const response = await apiClient.get('/routes')
      return response.data.routes || []
    }
  })

  // Mutations
  const addRouteMutation = useMutation({
    mutationFn: (newRoute: any) => apiClient.post('/add-route', newRoute),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] as const })
      resetForm()
      alert('Route created successfully!')
    },
    onError: (err: any) => {
      console.error(err)
      alert(err.response?.data?.message || err.response?.data?.error || 'Error creating route')
    }
  })

  const updateRouteMutation = useMutation({
    mutationFn: (updatedRoute: any) =>
      apiClient.put(`/update-route/${updatedRoute._id}`, updatedRoute),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] as const })
      resetForm()
      alert('Route updated successfully!')
    },
    onError: (err: any) => {
      console.error(err)
      alert(err.response?.data?.message || err.response?.data?.error || 'Error updating route')
    }
  })

  const deleteRouteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/delete-route/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['routes'] as const })
  })

  const handleAddRouteStation = () => {
    if (newRouteStation.station && newRouteStation.arrivalTime && newRouteStation.departureTime) {
      setFormData({
        ...formData,
        stations: [...formData.stations, {
          ...newRouteStation,
          order: formData.stations.length + 1
        }]
      })
      setNewRouteStation({ station: '', arrivalTime: '', departureTime: '' })
    }
  }

  const handleRemoveRouteStation = (index: number) => {
    setFormData({
      ...formData,
      stations: formData.stations.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i + 1 }))
    })
  }

  const handleMoveStation = (index: number, direction: 'up' | 'down') => {
    const newStations = [...formData.stations]
    if (direction === 'up' && index > 0) {
      [newStations[index], newStations[index - 1]] = [newStations[index - 1], newStations[index]]
    } else if (direction === 'down' && index < newStations.length - 1) {
      [newStations[index], newStations[index + 1]] = [newStations[index + 1], newStations[index]]
    }
    setFormData({
      ...formData,
      stations: newStations.map((s, i) => ({ ...s, order: i + 1 }))
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.stations.length === 0) {
      alert('Please add at least one station to the route')
      return
    }

    const routePayload = {
      name: formData.name,
      description: formData.description,
      stations: formData.stations
    }

    try {
      if (editingRoute) {
        await updateRouteMutation.mutateAsync({ ...routePayload, _id: editingRoute._id })
      } else {
        await addRouteMutation.mutateAsync(routePayload)
      }
    } catch (err: any) {
      // Error is handled in onError callback
      console.error(err)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      stations: []
    })
    setNewRouteStation({ station: '', arrivalTime: '', departureTime: '' })
    setEditingRoute(null)
    setShowForm(false)
  }

  const startEditRoute = (route: Route) => {
    setEditingRoute(route)
    setFormData({
      name: route.name,
      description: route.description || '',
      stations: route.stations.map((s, index) => ({
        station: typeof s.station === 'object' ? s.station._id : s.station,
        order: s.order || index + 1,
        arrivalTime: s.arrivalTime,
        departureTime: s.departureTime
      }))
    })
    setShowForm(true)
  }

  const handleDeleteRoute = (id: string) => {
    if (confirm('Delete this route?')) {
      deleteRouteMutation.mutate(id)
    }
  }

  const getStationName = (stationId: string | Station) => {
    if (typeof stationId === 'object') return stationId.name
    const station = stations.find((s: Station) => s._id === stationId)
    return station?.name || 'Unknown Station'
  }

  return (
    <div className="min-h-screen flex bg-gray-900">
      <AdminSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} active="route" />

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
              {showForm ? "Cancel" : "Add Route"}
            </button>
          </div>
        </header>

        {/* Form */}
        {showForm && (
          <div className="bg-gray-800 m-6 p-6 rounded-lg mb-6">
            <h2 className="text-xl font-semibold mb-3 text-white">
              {editingRoute ? 'Edit Route' : 'Add Route'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Route Name */}
                <input
                  type="text"
                  required
                  placeholder="Route Name"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="border p-2 rounded bg-gray-700 text-white"
                />

                {/* Description */}
                <input
                  type="text"
                  placeholder="Description (optional)"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="border p-2 rounded bg-gray-700 text-white"
                />
              </div>

              {/* Route Stations */}
              <div>
                <label className="text-white mb-2 block">Route Stations (in order)</label>
                <div className="space-y-2 mb-2 flex">
                  {formData.stations.map((rs, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 bg-gray-700 rounded">
                      <span className="text-white text-sm font-semibold w-8">{rs.order}.</span>
                      <span className="text-white text-sm flex-1">
                        {getStationName(rs.station)} - Arrival: {rs.arrivalTime} - Departure: {rs.departureTime}
                      </span>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => handleMoveStation(index, 'up')}
                          disabled={index === 0}
                          className="px-2 py-1 bg-gray-600 text-white rounded text-xs disabled:opacity-50"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveStation(index, 'down')}
                          disabled={index === formData.stations.length - 1}
                          className="px-2 py-1 bg-gray-600 text-white rounded text-xs disabled:opacity-50"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveRouteStation(index)}
                          className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col lg:flex-row gap-2">
                  <select
                    value={newRouteStation.station}
                    onChange={e => setNewRouteStation({ ...newRouteStation, station: e.target.value })}
                    className="flex-1 border p-2 rounded bg-gray-700 text-white"
                  >
                    <option value="">Select station</option>
                    {stations.map((s: Station) => (
                      <option key={s._id} value={s._id}>{s.name} {s.address ? `- ${s.address}` : ''}</option>
                    ))}
                  </select>
                  <input
                    type="time"
                    placeholder="Arrival Time"
                    value={newRouteStation.arrivalTime}
                    onChange={e => setNewRouteStation({ ...newRouteStation, arrivalTime: e.target.value })}
                    className="border p-2 rounded bg-gray-700 text-white"
                    required={!!newRouteStation.station}
                  />
                  <input
                    type="time"
                    placeholder="Departure Time"
                    value={newRouteStation.departureTime}
                    onChange={e => setNewRouteStation({ ...newRouteStation, departureTime: e.target.value })}
                    className="border p-2 rounded bg-gray-700 text-white"
                    required={!!newRouteStation.station}
                  />
                  <button
                    type="button"
                    onClick={handleAddRouteStation}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Add Station
                  </button>
                </div>
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
                  disabled={addRouteMutation.isPending || updateRouteMutation.isPending}
                >
                  {addRouteMutation.isPending || updateRouteMutation.isPending
                    ? 'Saving...'
                    : editingRoute
                    ? 'Update Route'
                    : 'Create Route'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Routes List */}
        <div className="bg-gray-800 m-6 p-6 rounded">
          <h2 className="text-lg font-semibold mb-3 text-white">All Routes ({routes.length})</h2>

          <div className="space-y-4">
            {routes.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p>No routes found. Create your first route!</p>
              </div>
            ) : (
              routes.map((route: Route) => (
                <div key={route._id} className="border border-gray-700 p-4 rounded">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-xl font-semibold text-white">{route.name}</h3>
                      {route.description && (
                        <p className="text-gray-400 text-sm mt-1">{route.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEditRoute(route)}
                        className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteRoute(route._id)}
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="mt-3">
                    <h4 className="text-white font-semibold mb-2">Stations ({route.stations.length}):</h4>
                    <ol className="list-decimal list-inside space-y-1">
                      {route.stations.map((rs, index) => (
                        <li key={index} className="text-gray-300 text-sm">
                          {getStationName(rs.station)} - Arrival: {rs.arrivalTime} - Departure: {rs.departureTime}
                        </li>
                      ))}
                    </ol>
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

export default RoutesPage
