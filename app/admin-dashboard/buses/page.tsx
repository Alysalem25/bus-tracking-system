"use client";

import React, { useState } from "react";
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminSidebar from "@/Components/admin_sidebar";
import apiClient from "@/lib/api";

interface Bus {
  _id: string;
  plateNumber: string;
  capacity: number;
  status: string;
}

// Fetch all buses
const fetchBuses = async () => {
  const response = await apiClient.get("/buses");
  return response.data;
};

const Page = () => {
  const queryClient = useQueryClient();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const [plateNumber, setPlateNumber] = useState("");
  const [capacity, setCapacity] = useState("");
  const [busStatus, setBusStatus] = useState("");

  const [showEditForm, setShowEditForm] = useState(false);
  const [editBusId, setEditBusId] = useState("");
  const [editPlateNumber, setEditPlateNumber] = useState("");
  const [editCapacity, setEditCapacity] = useState("");
  const [editBusStatus, setEditBusStatus] = useState("");

  // --------------------------
  // REACT QUERY: Fetch buses
  // --------------------------
  const { data: buses = [], isLoading, isError } = useQuery({
    queryKey: ["buses"],
    queryFn: fetchBuses,
  });

  // --------------------------
  // ADD BUS Mutation
  // --------------------------
  const addBusMutation = useMutation({
    mutationFn: (newBus: any) => apiClient.post("/add-bus", newBus),
    onSuccess: () => {
      queryClient.invalidateQueries(["buses"]);
      setShowAddForm(false);
      setPlateNumber("");
      setCapacity("");
      setBusStatus("");
    },
  });

  // --------------------------
  // DELETE BUS Mutation
  // --------------------------
  const deleteBusMutation = useMutation({
    mutationFn: (busId: string) => apiClient.delete(`/delete-bus/${busId}`),
    onSuccess: () => queryClient.invalidateQueries(["buses"]),
  });

  // --------------------------
  // UPDATE BUS Mutation
  // --------------------------
  const updateBusMutation = useMutation({
    mutationFn: (updatedBus: any) => apiClient.put(`/update-bus/${updatedBus._id}`, updatedBus),
    onSuccess: () => {
      queryClient.invalidateQueries(["buses"]);
      setShowEditForm(false);
      setEditBusId("");
      setEditPlateNumber("");
      setEditCapacity("");
      setEditBusStatus("");
    },
  });

  // --------------------------
  // Handlers
  // --------------------------
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addBusMutation.mutate({
      plateNumber,
      capacity: Number(capacity),
      status: busStatus,
    });
  };

  const handleDelete = (busId: string) => {
    deleteBusMutation.mutate(busId);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateBusMutation.mutate({
      _id: editBusId,
      plateNumber: editPlateNumber,
      capacity: Number(editCapacity),
      status: editBusStatus,
    });
  };

  const openEditForm = (bus: Bus) => {
    setEditBusId(bus._id);
    setEditPlateNumber(bus.plateNumber);
    setEditCapacity(bus.capacity.toString());
    setEditBusStatus(bus.status);
    setShowEditForm(true);
  };

  // --------------------------
  // Loading/Error UI
  // --------------------------
  // if (isLoading) {
  //   return (
  //     <div className="flex justify-center items-center h-screen text-xl font-bold">
  //       Loading buses...
  //     </div>
  //   );
  // }

  if (isError) {
    return <p className="text-center text-red-500 mt-10">Error loading buses ❌</p>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      <AdminSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} active={"buses"} />

      <div className="flex-1 flex flex-col overflow-hidden">
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
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">bus Management</h1>
            </div>


            <div className="flex items-center gap-4">
              <button
                onClick={() => { setShowAddForm(!showAddForm) }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                {showAddForm ? 'Cancel' : 'Add Bus'}
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Add Bus Form */}
          {showAddForm && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-8 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Add New Trip</h2>
              <form onSubmit={handleAddSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <label className="block">
                    <span className="text-gray-700 dark:text-gray-300">Plate Number</span>
                    <input
                      type="text"
                      value={plateNumber}
                      onChange={(e) => setPlateNumber(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      required
                    />
                  </label>
                  <label className="block">
                    <span className="text-gray-700 dark:text-gray-300">Capacity</span>
                    <input
                      type="number"
                      value={capacity}
                      onChange={(e) => setCapacity(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      required
                    />
                  </label>
                  <label className="block">
                    <span className="text-gray-700 dark:text-gray-300">Status</span>
                    <select
                      value={busStatus}
                      onChange={(e) => setBusStatus(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      required
                    >
                      <option value="">Select a Status</option>
                      <option value="active">Active</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </label>
                </div>

                <div className="flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addBusMutation.isLoading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {addBusMutation.isLoading ? "Adding..." : "Add Bus"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Edit Bus Form */}
          {showEditForm && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-8 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Edit Trip</h2>
              <form onSubmit={handleEditSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <label className="block">
                    <span className="text-gray-700 dark:text-gray-300">Plate Number</span>
                    <input
                      type="text"
                      value={editPlateNumber}
                      onChange={(e) => setEditPlateNumber(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      required
                    />
                  </label>
                  <label className="block">
                    <span className="text-gray-700 dark:text-gray-300">Capacity</span>
                    <input
                      type="number"
                      value={editCapacity}
                      onChange={(e) => setEditCapacity(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      required
                    />
                  </label>
                  <label className="block">
                    <span className="text-gray-700 dark:text-gray-300">Status</span>
                    <select
                      value={editBusStatus}
                      onChange={(e) => setEditBusStatus(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      required
                    >
                      <option value="">Select a Status</option>
                      <option value="active">Active</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </label>
                </div>

                <div className="flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => setShowEditForm(false)}
                    className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateBusMutation.isLoading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {updateBusMutation.isLoading ? "Updating..." : "Update Bus"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Bus List */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">All Buses ({buses.length})</h2>
            </div>
            <div className="p-6 space-y-4">
              {buses.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">🚌</div>
                  <p className="text-gray-600 dark:text-gray-400 text-lg">No buses found. Add your first bus!</p>
                </div>
              ) : (
                buses.map((bus) => (
                  <div key={bus._id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Bus plate number</p>
                        <p className="font-semibold text-gray-900 dark:text-white">{bus.plateNumber}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Bus Capacity</p>
                        <p className="font-semibold text-gray-900 dark:text-white">{bus.capacity}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Bus Status</p>
                        <p className={`font-semibold ${bus.status === "active" ? "text-green-500" : "text-red-500"}`}>
                          {bus.status}
                        </p>
                      </div>
                      <div>
                        <button
                          onClick={() => handleDelete(bus._id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => openEditForm(bus)}
                          className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg ml-2 transition-colors"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Page;