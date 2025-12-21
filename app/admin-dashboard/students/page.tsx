'use client'

import React from 'react'
import axios from 'axios'
import AdminSidebar from '@/Components/admin_sidebar'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/api'

interface Student {
  _id: string
  name: string
  email: string
  studentCode: string
  number?: string
}

const StudentsPage = () => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState('')
  const [showForm, setShowForm] = React.useState(false)
  const [editingStudent, setEditingStudent] = React.useState<Student | null>(null)

  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    password: '',
    number: '',
    studentCode: ''
  })

  const queryClient = useQueryClient()

  // Fetch Data
  const { data: students = [], isLoading } = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const response = await apiClient.get('/students')
      return response.data.students || response.data
    }
  })

  // Mutations
  const addStudentMutation = useMutation({
    mutationFn: (newStudent: any) => apiClient.post('/add-student', {
      ...newStudent,
      role: 'student'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] as const })
      resetForm()
      alert('Student added successfully!')
    },
    onError: (err: any) => {
      console.error(err)
      alert(err.response?.data?.message || 'Error adding student')
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await addStudentMutation.mutateAsync(formData)
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
      studentCode: ''
    })
    setEditingStudent(null)
    setShowForm(false)
  }

  // Filter students based on search term
  const filteredStudents = students.filter((student: Student) =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.studentCode.toLowerCase().includes(searchTerm.toLowerCase())
  )


  const delete_student = async (student_id: string) => {
    try {
      await apiClient.delete(`/delete-student/${student_id}`);
      queryClient.invalidateQueries({ queryKey: ['students'] as const });
      alert('Student deleted successfully!');
    } catch (error) {
      console.error('Error deleting student:', error);
      alert('Failed to delete student.');
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-800">
      <AdminSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} active="students" />

      <div className="flex-1 overflow-y-auto bg-gray-900">
        {/* Header */}
        <header className=" dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
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
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Students Management</h1>
            </div>


            <div className="flex items-center gap-4">

              <button
                onClick={() => { setShowForm(!showForm) }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                {showForm ? 'Cancel' : 'Add Student'}
              </button>
            </div>
          </div>
        </header>

        {/* Search Bar */}
        <div className="p-4 m-6 dark:bg-gray-800 ">
          <input
            type="text"
            placeholder="Search students..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded bg-gray-700 text-white"
          />
          <span className="text-gray-400">
            {filteredStudents.length} of {students.length} students
          </span>
        </div>

        {showForm && (
          <div className="bg-gray-800 m-6 p-6 rounded-lg mb-6">
            <h2 className="text-xl font-semibold mb-3 text-white">Add Student</h2>

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
                  placeholder="Student Code"
                  value={formData.studentCode}
                  onChange={e => setFormData({ ...formData, studentCode: e.target.value })}
                  className="border p-2 rounded bg-gray-700 text-white"
                />
                <input
                  type="tel"
                  placeholder="Number (optional)"
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
                  disabled={addStudentMutation.isPending}
                >
                  {addStudentMutation.isPending ? 'Adding...' : 'Add Student'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Students List */}
        <div className="bg-gray-800 p-4 m-6 rounded">
          <h2 className="text-lg font-semibold mb-3 text-white">All Students</h2>

          <div className="space-y-4">
            {filteredStudents.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p>{searchTerm ? 'No students found matching your search.' : 'No students found.'}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredStudents.map((student: Student) => (
                  <div key={student._id} className="border border-gray-700 p-4 rounded hover:bg-gray-800 transition">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-white">{student.name}</h3>
                        <div className="mt-2 space-y-1">
                          <p className="text-gray-400 text-sm">
                            <span className="font-semibold">Email:</span> {student.email}
                          </p>
                          <p className="text-gray-400 text-sm">
                            <span className="font-semibold">Student Code:</span> {student.studentCode}
                          </p>
                          {student.number && (
                            <p className="text-gray-400 text-sm">
                              <span className="font-semibold">Number:</span> {student.number}
                            </p>
                          )}
                        </div>
                        <div className="mt-4">
                          {/* Future Edit/Delete Buttons can go here */}
                          <button onClick={() => delete_student(student._id)}
                            className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                          >delete student</button>
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

export default StudentsPage