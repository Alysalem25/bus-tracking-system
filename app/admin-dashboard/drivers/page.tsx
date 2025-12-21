'use client'

import React from 'react'
import axios from 'axios'
import AdminSidebar from '@/Components/admin_sidebar'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/api'

interface Driver {
  _id: string
  name: string
  email: string
  number?: string
  licenseNumber?: string
}

const DriversPage = () => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState('')
  const [showForm, setShowForm] = React.useState(false)
  const [editingDriver, setEditingDriver] = React.useState<Driver | null>(null)
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    password: '',
    number: '',
    licenseNumber: ''
  })

  const queryClient = useQueryClient()

  // Fetch Data
  const { data: drivers = [], isLoading } = useQuery({
    queryKey: ['drivers'],
    queryFn: async () => {
      const response = await apiClient.get('/drivers')
      return response.data.drivers || response.data
    }
  })

  // Mutations
  const addDriverMutation = useMutation({
    mutationFn: (newDriver: any) => apiClient.post('/add-driver', {
      ...newDriver,
      role: 'driver'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] as const })
      resetForm()
      alert('Driver added successfully!')
    },
    onError: (err: any) => {
      console.error(err)
      alert(err.response?.data?.message || 'Error adding driver.')
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await addDriverMutation.mutateAsync(formData)
    } catch (err: any) {
      // Error is handled in onError callback
      console.error(err)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      number: '',
      licenseNumber: ''
    })
    setEditingDriver(null)
    setShowForm(false)
  }

  // Filter drivers based on search term
  const filteredDrivers = drivers.filter((driver: Driver) =>
    driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (driver.number || '').toLowerCase().includes(searchTerm.toLowerCase())
  )


  const delete_driver = async (driver_id: string) => {
    try {
      await apiClient.delete(`/delete-driver/${driver_id}`);
      queryClient.invalidateQueries({ queryKey: ['drivers'] as const });
      alert('Driver deleted successfully!');
    } catch (error) {
      console.error('Error deleting driver:', error);
      alert('Failed to delete driver.');
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-900">
      <AdminSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} active="drivers" />

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
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">driver Management</h1>
            </div>


            <div className="flex items-center gap-4">

              <button
                onClick={() => { setShowForm(!showForm) }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                {showForm ? 'Cancel' : 'Add Driver'}
              </button>
            </div>
          </div>
        </header>

        {/* Search Bar */}
        <div className="p-4 m-6 dark:bg-gray-800 ">
          <input
            type="text"
            placeholder="Search drivers..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="border p-2 rounded bg-gray-700 text-white w-full"
          />
          <span className="text-gray-400">
            {filteredDrivers.length} of {drivers.length} drivers
          </span>
        </div>

        {showForm && (
          <div className="bg-gray-800 m-6 p-6 rounded-lg mb-6">
            <h2 className="text-xl font-semibold mb-3 text-white">Add Driver</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  required
                  placeholder="Name"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="border p-2 rounded bg-gray-700 text-white"
                />
                <input
                  type="email"
                  required
                  placeholder="Email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="border p-2 rounded bg-gray-700 text-white"
                />
                <input
                  type="password"
                  required
                  placeholder="Password"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  className="border p-2 rounded bg-gray-700 text-white"
                />
                <input
                  type="text"
                  required
                  placeholder="License Number"
                  value={formData.licenseNumber}
                  onChange={e => setFormData({ ...formData, licenseNumber: e.target.value })}
                  className="border p-2 rounded bg-gray-700 text-white"
                />
                <input
                  type="text"
                  required
                  placeholder="Phone Number"
                  value={formData.number}
                  onChange={e => setFormData({ ...formData, number: e.target.value })}
                  className="border p-2 rounded bg-gray-700 text-white"
                />
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
                  disabled={addDriverMutation.isPending}
                >
                  {addDriverMutation.isPending ? 'Adding...' : 'Add Driver'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Drivers List */}
        <div className="bg-gray-800 p-4 m-6 rounded">
          <h2 className="text-lg font-semibold mb-3 text-white">All Drivers</h2>

          <div className="space-y-4">
            {filteredDrivers.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p>{searchTerm ? 'No drivers found matching your search.' : 'No drivers found.'}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDrivers.map((driver: Driver) => (
                  <div key={driver._id} className="border border-gray-700 p-4 rounded hover:bg-gray-800 transition">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-white">{driver.name}</h3>
                        <div className="mt-2 space-y-1">
                          <p className="text-gray-400 text-sm">
                            <span className="font-semibold">Email:</span> {driver.email}
                          </p>
                          <p className="text-gray-400 text-sm">
                            <span className="font-semibold">License Number:</span> {driver.licenseNumber || '-'}
                          </p>
                          {driver.number && (
                            <p className="text-gray-400 text-sm">
                              <span className="font-semibold">Number:</span> {driver.number}
                            </p>
                          )}
                        </div>
                        <div className="mt-4">
                          {/* Future Edit/Delete Buttons can go here */}
                          <button onClick={() => delete_driver(driver._id)}
                            className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                          >delete driver</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DriversPage