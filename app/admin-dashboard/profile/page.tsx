'use client'

import React from 'react'
import { useAuthStore } from '@/store/authStore'
import AdminSidebar from '@/Components/admin_sidebar'
import DriverSidebar from '@/Components/driver_sidebar'
import StudentSidebar from '@/Components/student_sidebar'
import { useMutation } from '@tanstack/react-query'
import apiClient from '@/lib/api'

// Using centralized auth store for user data

const ProfilePage = () => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const { user: authUser, isLoading: authLoading, checkAuth, setUser: setAuthUser } = useAuthStore()

  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  React.useEffect(() => {
    if (!authUser) {
      checkAuth().catch(() => {})
      return
    }

    setFormData({
      name: authUser.name || '',
      email: authUser.email || '',
      phone: (authUser as any).number || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
  }, [authUser, checkAuth])

  const updateProfileMutation = useMutation({
    mutationFn: async (updatedData: any) => {
      return apiClient.put(`update-profile/${authUser?._id}`, updatedData)
    },
    onSuccess: (response) => {
      if (response.data.user) {
        const updatedUser = response.data.user
        setAuthUser(updatedUser)
        alert('Profile updated successfully!')
        setFormData({
          ...formData,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
      }
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      alert('New passwords do not match')
      return
    }

    const updateData: any = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone
    }

    if (formData.newPassword) {
      if (!formData.currentPassword) {
        alert('Please enter your current password to change it')
        return
      }
      updateData.currentPassword = formData.currentPassword
      updateData.newPassword = formData.newPassword
    }

    try {
      await updateProfileMutation.mutateAsync(updateData)
    } catch (err: any) {
      console.error(err)
      alert(err.response?.data?.message || 'Error updating profile')
    }
  }

  if (authLoading && !authUser) {
    const Sidebar = (authUser as any)?.role === 'driver' ? DriverSidebar : (authUser as any)?.role === 'student' ? StudentSidebar : AdminSidebar
    return (
      <div className="min-h-screen flex bg-gray-800">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} active="profile" />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-white text-xl">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!authUser) {
    const Sidebar = AdminSidebar
    return (
      <div className="min-h-screen flex bg-gray-800">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} active="profile" />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-white text-xl">Please log in to view your profile</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-gray-800">
      {authUser.role === 'driver' ? (
        <DriverSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} active="profile" />
      ) : authUser.role === 'student' ? (
        <StudentSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} active="profile" />
      ) : (
        <AdminSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} active="profile" />
      )}

      <div className="flex-1 p-6 overflow-y-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">My Profile</h1>
          <p className="text-gray-400 mt-1">Manage your account information</p>
        </div>

        {/* Profile Info Card */}
        <div className="bg-gray-900 p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-4 text-white">Profile Information</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div>
                <label className="block text-white mb-2">Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border p-2 rounded bg-gray-700 text-white"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-white mb-2">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full border p-2 rounded bg-gray-700 text-white"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-white mb-2">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full border p-2 rounded bg-gray-700 text-white"
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-white mb-2">Role</label>
                <input
                  type="text"
                  value={authUser.role || 'N/A'}
                  disabled
                  className="w-full border p-2 rounded bg-gray-600 text-gray-400 cursor-not-allowed"
                />
              </div>
            </div>

            {/* Password Change Section */}
            <div className="mt-6 pt-6 border-t border-gray-700">
              <h3 className="text-lg font-semibold mb-4 text-white">Change Password</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-white mb-2">Current Password</label>
                  <input
                    type="password"
                    value={formData.currentPassword}
                    onChange={e => setFormData({ ...formData, currentPassword: e.target.value })}
                    className="w-full border p-2 rounded bg-gray-700 text-white"
                    placeholder="Enter current password"
                  />
                </div>
                <div>
                  <label className="block text-white mb-2">New Password</label>
                  <input
                    type="password"
                    value={formData.newPassword}
                    onChange={e => setFormData({ ...formData, newPassword: e.target.value })}
                    className="w-full border p-2 rounded bg-gray-700 text-white"
                    placeholder="Enter new password"
                  />
                </div>
                <div>
                  <label className="block text-white mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full border p-2 rounded bg-gray-700 text-white"
                    placeholder="Confirm new password"
                  />
                </div>
              </div>
              <p className="text-gray-400 text-sm mt-2">
                Leave password fields empty if you do not want to change your password
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
                disabled={updateProfileMutation.status === 'pending'}
              >
                {updateProfileMutation.status === 'pending' ? 'Updating...' : 'Update Profile'}
              </button>
              <button
                type="button"
                onClick={() => {
                    setFormData({
                      name: authUser.name || '',
                      email: authUser.email || '',
                      phone: (authUser as any).number || '',
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: ''
                    })
                  }}
                className="px-6 py-2 border border-gray-600 text-white rounded hover:bg-gray-700"
              >
                Reset
              </button>
            </div>
          </form>
        </div>

        {/* Account Info */}
        <div className="bg-gray-900 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-white">Account Information</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">User ID:</span>
              <span className="text-white">{authUser._id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Role:</span>
              <span className="text-white capitalize">{authUser.role || 'N/A'}</span>
            </div>
            {authUser.studentCode && (
              <div className="flex justify-between">
                <span className="text-gray-400">Student Code:</span>
                <span className="text-white">{authUser.studentCode}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage


