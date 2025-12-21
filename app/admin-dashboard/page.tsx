'use client'

import axios from 'axios'
import React from 'react'
import Link from 'next/link'
import AdminSidebar from '@/Components/admin_sidebar'
import ProtectedRoute from '@/components/ProtectedRoute'
import apiClient from '@/lib/api'

export default function AdminDashboard() {
    return (
        <ProtectedRoute allowedRoles={["admin"]}>
            <AdminDashboardContent />
        </ProtectedRoute>
    );
}

function AdminDashboardContent() {
    const [stats, setStats] = React.useState({
        activeTrips: 0,
        activeBuses: 0,
        totalStudents: 0,
        totalDrivers: 0,
        scheduledTrips: 0,
        completedTrips: 0,
        totalTrips: 0,
        totalBuses: 0
    });

    const [sidebarOpen, setSidebarOpen] = React.useState(false);

    React.useEffect(() => {
        apiClient.get('/stats').then(response => {
            console.log(response.data)
            setStats(response.data.stats)
        }).catch(error => {
            console.error('Error fetching admin stats:', error)
        })
    }, []);


    const getStatusBadgeColor = (status: string) => {
        switch (status) {
            case 'ongoing':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            case 'scheduled':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
            case 'completed':
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
            case 'cancelled':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
        }
    }

    return (

        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
            {/* Mobile Sidebar Overlay */}

            <AdminSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} active="dashboard"  />

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
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
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-8">

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <StatCard
                            title="Active Trips"
                            value={stats.activeTrips}
                            subtitle={`of ${stats.totalTrips} total`}
                            icon="🚌"
                            color="blue"
                        />


                        <StatCard
                            title="Active Buses"
                            value={stats.activeBuses}
                            subtitle={`of ${stats.totalBuses} total`}
                            icon="🚐"
                            color="green"
                        />


                        <StatCard
                            title="Students"
                            value={stats.totalStudents}
                            subtitle="Registered"
                            icon="👥"
                            color="purple"
                        />
                        <StatCard
                            title="Drivers"
                            value={stats.totalDrivers}
                            subtitle="Available"
                            icon="👤"
                            color="orange"
                        />
                    </div>

                    {/* Additional Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Scheduled</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.scheduledTrips}</p>
                                </div>
                                <div className="text-3xl">📅</div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.completedTrips}</p>
                                </div>
                                <div className="text-3xl">✅</div>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Trips</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">0</p>
                                </div>
                                <div className="text-3xl">📊</div>
                            </div>
                        </div>
                    </div>

                    {/* Active Trips Section */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                Active Trips (0)
                            </h2>
                        </div>
                        <div className="p-6">
                            <div className="text-center py-12">
                                <div className="text-5xl mb-4">🚌</div>
                                <p className="text-gray-600 dark:text-gray-400 text-lg">
                                    No active trips at the moment
                                </p>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div >
    )
}

interface StatCardProps {
    title: string
    value: number
    subtitle: string
    icon: string
    color: 'blue' | 'green' | 'purple' | 'orange'
}

function StatCard({ title, value, subtitle, icon, color }: StatCardProps) {
    const colorClasses = {
        blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
        green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
        purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
        orange: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
    }

    return (
        <div className={`bg-white dark:bg-gray-800 rounded-lg shadow border-2 ${colorClasses[color]} p-6`}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{value}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{subtitle}</p>
                </div>
                <div className="text-4xl">{icon}</div>
            </div>
        </div>
    )
}
