// 'use client'

// import React from 'react'
// import axios from 'axios'
// import AdminSidebar from '@/Components/admin_sidebar'
// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// interface Bus { _id: string; plateNumber: string; capacity: number }
// interface Driver { _id: string; name: string; email: string }
// interface Station { _id: string; name: string; address: string }
// interface Student { _id: string; name: string; studentCode: string }

// interface RouteStation {
//   station: string | Station
//   arrivalTime: string
//   departureTime: string
//   order: number
// }

// interface Trip {
//   _id: string
//   bus: Bus
//   driver: Driver
//   students: Student[]
//   route: RouteStation[]
//   tripDate: string
//   departureTime: string
//   daysOfWeek: number[]
//   repeatWeekly: boolean
//   status: string
// }

// const TripsPage = () => {
//   const [sidebarOpen, setSidebarOpen] = React.useState(false)
//   const [showForm, setShowForm] = React.useState(false)
//   const [editingTrip, setEditingTrip] = React.useState<Trip | null>(null)

//   const [formData, setFormData] = React.useState({
//     bus: '',
//     driver: '',
//     students: [] as string[],
//     tripDate: '',
//     departureTime: '',
//     daysOfWeek: [] as number[],
//     repeatWeekly: false,
//     route: [] as Array<{ station: string; arrivalTime: string; departureTime: string; order: number }>
//   })

//   const [newRouteStation, setNewRouteStation] = React.useState({
//     station: '',
//     arrivalTime: '',
//     departureTime: ''
//   })

//   const queryClient = useQueryClient()

//   // Fetch Data
//   const { data: buses = [] } = useQuery({
//     queryKey: ['buses'],
//     queryFn: async () => (await axios.get('http://localhost:5000/buses')).data
//   })

//   const { data: drivers = [] } = useQuery({
//     queryKey: ['drivers'],
//     queryFn: async () => (await axios.get('http://localhost:5000/drivers')).data.drivers || []
//   })

//   const { data: stations = [] } = useQuery({
//     queryKey: ['stations'],
//     queryFn: async () => (await axios.get('http://localhost:5000/stations')).data.stations || []
//   })

//   const { data: students = [] } = useQuery({
//     queryKey: ['students'],
//     queryFn: async () => (await axios.get('http://localhost:5000/students')).data.students || []
//   })

//   const { data: trips = [] } = useQuery({
//     queryKey: ['trips'],
//     queryFn: async () => {
//       const response = await axios.get('http://localhost:5000/trips')
//       return response.data || []
//     }
//   })

//   // Mutations
//   const addTripMutation = useMutation({
//     mutationFn: (newTrip: any) => axios.post('http://localhost:5000/add-trip', newTrip),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['trips'] as const })
//       resetForm()
//     }
//   })

//   const deleteTripMutation = useMutation({
//     mutationFn: (id: string) => axios.delete(`http://localhost:5000/trips/${id}`),
//     onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trips'] as const })
//   })

//   const handleAddRouteStation = () => {
//     if (newRouteStation.station && newRouteStation.arrivalTime && newRouteStation.departureTime) {
//       setFormData({
//         ...formData,
//         route: [...formData.route, {
//           ...newRouteStation,
//           order: formData.route.length + 1
//         }]
//       })
//       setNewRouteStation({ station: '', arrivalTime: '', departureTime: '' })
//     }
//   }

//   const handleRemoveRouteStation = (index: number) => {
//     setFormData({
//       ...formData,
//       route: formData.route.filter((_, i) => i !== index).map((r, i) => ({ ...r, order: i + 1 }))
//     })
//   }

//   const handleDayToggle = (day: number) => {
//     if (formData.daysOfWeek.includes(day)) {
//       setFormData({
//         ...formData,
//         daysOfWeek: formData.daysOfWeek.filter(d => d !== day)
//       })
//     } else {
//       setFormData({
//         ...formData,
//         daysOfWeek: [...formData.daysOfWeek, day]
//       })
//     }
//   }

//   const handleStudentToggle = (studentId: string) => {
//     if (formData.students.includes(studentId)) {
//       setFormData({
//         ...formData,
//         students: formData.students.filter(id => id !== studentId)
//       })
//     } else {
//       setFormData({
//         ...formData,
//         students: [...formData.students, studentId]
//       })
//     }
//   }

//   // Submit Logic
//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault()

//     const tripPayload = {
//       bus: formData.bus,
//       driver: formData.driver,
//       students: formData.students,
//       route: formData.route.map(rs => ({
//         station: rs.station,
//         arrivalTime: `${formData.tripDate}T${rs.arrivalTime}`,
//         departureTime: `${formData.tripDate}T${rs.departureTime}`,
//         order: rs.order
//       })),
//       tripDate: formData.tripDate,
//       departureTime: formData.departureTime,
//       daysOfWeek: formData.daysOfWeek,
//       repeatWeekly: formData.repeatWeekly
//     }

//     try {
//       await addTripMutation.mutateAsync(tripPayload)
//       alert('Trip added successfully!')
//     } catch (err: any) {
//       console.error(err)
//       alert(err.response?.data?.error || 'Error saving trip')
//     }
//   }

//   const resetForm = () => {
//     setFormData({
//       bus: '',
//       driver: '',
//       students: [],
//       tripDate: '',
//       departureTime: '',
//       daysOfWeek: [],
//       repeatWeekly: false,
//       route: []
//     })
//     setEditingTrip(null)
//     setShowForm(false)
//   }

//   const handleDeleteTrip = (id: string) => {
//     if (confirm('Delete this trip?')) {
//       deleteTripMutation.mutate(id)
//     }
//   }

//   const formatDate = (dateString: string) => {
//     if (!dateString) return 'N/A'
//     const date = new Date(dateString)
//     return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
//   }

//   const formatTime = (timeString: string) => {
//     if (!timeString) return 'N/A'
//     return timeString
//   }

//   const getDayName = (day: number) => {
//     const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
//     return days[day] || day.toString()
//   }

//   return (
//     <div className="min-h-screen flex bg-gray-800">
//       <AdminSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} active="trips" />

//       <div className="flex-1 p-6 overflow-y-auto">
//         {/* Header */}
//         <div className="flex justify-between items-center mb-6">
//           <h1 className="text-2xl font-bold text-white">Trips Management</h1>
//           <button
//             onClick={() => { setShowForm(!showForm); setEditingTrip(null); resetForm() }}
//             className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
//           >
//             {showForm ? 'Cancel' : 'Add Trip'}
//           </button>
//         </div>

//         {/* Form */}
//         {showForm && (
//           <div className="bg-gray-900 p-6 rounded-lg mb-6">
//             <h2 className="text-xl font-semibold mb-3 text-white">Add Trip</h2>

//             <form onSubmit={handleSubmit} className="space-y-4">
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 {/* Bus */}
//                 <select required value={formData.bus}
//                   onChange={e => setFormData({ ...formData, bus: e.target.value })}
//                   className="border p-2 rounded bg-gray-700 text-white">
//                   <option value="">Select Bus</option>
//                   {buses.map((b: Bus) => (
//                     <option key={b._id} value={b._id}>{b.plateNumber} (Capacity: {b.capacity})</option>
//                   ))}
//                 </select>

//                 {/* Driver */}
//                 <select required value={formData.driver}
//                   onChange={e => setFormData({ ...formData, driver: e.target.value })}
//                   className="border p-2 rounded bg-gray-700 text-white">
//                   <option value="">Select Driver</option>
//                   {drivers.map((d: Driver) => (
//                     <option key={d._id} value={d._id}>{d.name} ({d.email})</option>
//                   ))}
//                 </select>

//                 {/* Trip Date */}
//                 <input type="date" required value={formData.tripDate}
//                   onChange={e => setFormData({ ...formData, tripDate: e.target.value })}
//                   className="border p-2 rounded bg-gray-700 text-white" />

//                 {/* Departure Time */}
//                 <input type="time" required value={formData.departureTime}
//                   onChange={e => setFormData({ ...formData, departureTime: e.target.value })}
//                   className="border p-2 rounded bg-gray-700 text-white" />
//               </div>

//               {/* Days of Week */}
//               <div>
//                 <label className="text-white mb-2 block">Days of Week</label>
//                 <div className="flex flex-wrap gap-2">
//                   {[0, 1, 2, 3, 4, 5, 6].map(day => (
//                     <button
//                       key={day}
//                       type="button"
//                       onClick={() => handleDayToggle(day)}
//                       className={`px-4 py-2 rounded-lg ${
//                         formData.daysOfWeek.includes(day)
//                           ? 'bg-blue-600 text-white'
//                           : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
//                       }`}
//                     >
//                       {getDayName(day)}
//                     </button>
//                   ))}
//                 </div>
//               </div>

//               {/* Repeat Weekly */}
//               <div className="flex items-center">
//                 <input
//                   type="checkbox"
//                   id="repeatWeekly"
//                   checked={formData.repeatWeekly}
//                   onChange={e => setFormData({ ...formData, repeatWeekly: e.target.checked })}
//                   className="w-4 h-4 text-blue-600"
//                 />
//                 <label htmlFor="repeatWeekly" className="ml-2 text-white">
//                   Repeat Weekly
//                 </label>
//               </div>

//               {/* Route Stations */}
//               <div>
//                 <label className="text-white mb-2 block">Route Stations</label>
//                 <div className="space-y-2 mb-2">
//                   {formData.route.map((rs, index) => (
//                     <div key={index} className="flex items-center gap-2 p-2 bg-gray-700 rounded">
//                       <span className="text-white text-sm flex-1">
//                         {stations.find((s: Station) => s._id === rs.station)?.name || 'Station'} - 
//                         Arrival: {rs.arrivalTime} - Departure: {rs.departureTime}
//                       </span>
//                       <button
//                         type="button"
//                         onClick={() => handleRemoveRouteStation(index)}
//                         className="text-red-500 hover:text-red-700"
//                       >
//                         Remove
//                       </button>
//                     </div>
//                   ))}
//                 </div>
//                 <div className="flex gap-2">
//                   <select
//                     value={newRouteStation.station}
//                     onChange={e => setNewRouteStation({ ...newRouteStation, station: e.target.value })}
//                     className="flex-1 border p-2 rounded bg-gray-700 text-white"
//                   >
//                     <option value="">Select station</option>
//                     {stations.map((s: Station) => (
//                       <option key={s._id} value={s._id}>{s.name}</option>
//                     ))}
//                   </select>
//                   <input
//                     type="time"
//                     placeholder="Arrival"
//                     value={newRouteStation.arrivalTime}
//                     onChange={e => setNewRouteStation({ ...newRouteStation, arrivalTime: e.target.value })}
//                     className="border p-2 rounded bg-gray-700 text-white"
//                   />
//                   <input
//                     type="time"
//                     placeholder="Departure"
//                     value={newRouteStation.departureTime}
//                     onChange={e => setNewRouteStation({ ...newRouteStation, departureTime: e.target.value })}
//                     className="border p-2 rounded bg-gray-700 text-white"
//                   />
//                   <button
//                     type="button"
//                     onClick={handleAddRouteStation}
//                     className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
//                   >
//                     Add
//                   </button>
//                 </div>
//               </div>

//               {/* Students */}
//               <div>
//                 <label className="text-white mb-2 block">Students</label>
//                 <div className="max-h-40 overflow-y-auto border border-gray-600 rounded p-2">
//                   {students.map((student: Student) => (
//                     <label key={student._id} className="flex items-center p-2 hover:bg-gray-700 rounded">
//                       <input
//                         type="checkbox"
//                         checked={formData.students.includes(student._id)}
//                         onChange={() => handleStudentToggle(student._id)}
//                         className="w-4 h-4 text-blue-600"
//                       />
//                       <span className="ml-2 text-white text-sm">
//                         {student.name} ({student.studentCode})
//                       </span>
//                     </label>
//                   ))}
//                 </div>
//               </div>

//               <button type="submit"
//                 className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
//                 disabled={addTripMutation.isPending}
//               >
//                 {addTripMutation.isPending ? 'Adding...' : 'Add Trip'}
//               </button>
//             </form>
//           </div>
//         )}

//         {/* Trip List */}
//         <div className="bg-gray-900 p-4 rounded">
//           <h2 className="text-lg font-semibold mb-3 text-white">All Trips ({trips.length})</h2>

//           <div className="space-y-4">
//             {trips.length === 0 ? (
//               <div className="text-center py-12 text-gray-400">
//                 <p>No trips found. Add your first trip!</p>
//               </div>
//             ) : (
//               trips.map((trip: Trip) => (
//                 <div key={trip._id} className="border border-gray-700 p-4 rounded flex justify-between items-start">
//                   <div className="flex-1">
//                     <p className="text-white"><strong>Bus:</strong> {typeof trip.bus === 'object' ? trip.bus?.plateNumber : 'N/A'}</p>
//                     <p className="text-white"><strong>Driver:</strong> {typeof trip.driver === 'object' ? trip.driver?.name : 'N/A'}</p>
//                     <p className="text-white"><strong>Date:</strong> {formatDate(trip.tripDate)}</p>
//                     <p className="text-white"><strong>Time:</strong> {formatTime(trip.departureTime)}</p>
//                     {trip.daysOfWeek && trip.daysOfWeek.length > 0 && (
//                       <div className="mt-2">
//                         <span className="text-white mr-2">Days:</span>
//                         {trip.daysOfWeek.map(day => (
//                           <span key={day} className="px-2 py-1 bg-blue-600 text-white rounded text-xs mr-1">
//                             {getDayName(day)}
//                           </span>
//                         ))}
//                       </div>
//                     )}
//                     {trip.route && trip.route.length > 0 && (
//                       <div className="mt-2">
//                         <p className="text-white"><strong>Stations:</strong> {trip.route.length}</p>
//                       </div>
//                     )}
//                     {trip.students && trip.students.length > 0 && (
//                       <p className="text-white"><strong>Students:</strong> {trip.students.length}</p>
//                     )}
//                     <p className="text-white"><strong>Status:</strong> {trip.status || 'scheduled'}</p>
//                   </div>

//                   <div className="flex gap-2">
//                     <button onClick={() => handleDeleteTrip(trip._id)}
//                       className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700">Delete</button>
//                   </div>
//                 </div>
//               ))
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }

// export default TripsPage

// =-=-------------------------------------------------------------======================================================================================================================================

// 'use client'

// import axios from 'axios'
// import React from 'react'
// import Link from 'next/link'
// import AdminSidebar from '@/Components/admin_sidebar'

// interface Bus {
//     _id: string;
//     plateNumber: string;
//     capacity: number;
// }

// interface Driver {
//     _id: string;
//     name: string;
//     email: string;
//     phone: string;
// }

// interface Station {
//     _id: string;
//     name: string;
//     address: string;
// }

// interface Student {
//     _id: string;
//     name: string;
//     email: string;
//     studentCode: string;
// }

// interface RouteStation {
//     station: string;
//     arrivalTime: string;
//     departureTime: string;
//     order: number;
// }

// interface Trip {
//     _id: string;
//     bus: Bus;
//     driver: Driver;
//     students: Student[];
//     route: RouteStation[];
//     tripDate: string;
//     departureTime: string;
//     daysOfWeek: number[];
//     repeatWeekly: boolean;
//     createdAt: string;
// }

// const TripsPage = () => {
//     const [sidebarOpen, setSidebarOpen] = React.useState(false);
//     const [trips, setTrips] = React.useState<Trip[]>([]);
//     const [buses, setBuses] = React.useState<Bus[]>([]);
//     const [drivers, setDrivers] = React.useState<Driver[]>([]);
//     const [stations, setStations] = React.useState<Station[]>([]);
//     const [students, setStudents] = React.useState<Student[]>([]);
//     const [loading, setLoading] = React.useState(false);
//     const [showAddForm, setShowAddForm] = React.useState(false);
//     const [formData, setFormData] = React.useState({
//         bus: '',
//         driver: '',
//         students: [] as string[],
//         tripDate: '',
//         departureTime: '',
//         daysOfWeek: [] as number[],
//         repeatWeekly: false,
//         route: [] as RouteStation[]
//     });
//     const [routeStations, setRouteStations] = React.useState<RouteStation[]>([]);
//     const [newRouteStation, setNewRouteStation] = React.useState({
//         station: '',
//         arrivalTime: '',
//         departureTime: '',
//         order: 0
//     });

//     // Fetch all data on component mount
//     React.useEffect(() => {
//         fetchTrips();
//         fetchBuses();
//         fetchDrivers();
//         fetchStations();
//         fetchStudents();
//     }, []);

//     const fetchTrips = async () => {
//         try {
//             const response = await axios.get('http://localhost:5000/trips');
//             setTrips(response.data);
//         } catch (error) {
//             console.error('Error fetching trips:', error);
//         }
//     };

//     const fetchBuses = async () => {
//         try {
//             const response = await axios.get('http://localhost:5000/buses');
//             setBuses(response.data);
//         } catch (error) {
//             console.error('Error fetching buses:', error);
//         }
//     };

//     const fetchDrivers = async () => {
//         try {
//             const response = await axios.get('http://localhost:5000/drivers');
//             setDrivers(response.data.drivers || []);
//         } catch (error) {
//             console.error('Error fetching drivers:', error);
//         }
//     };

//     const fetchStations = async () => {
//         try {
//             const response = await axios.get('http://localhost:5000/stations');
//             setStations(response.data.stations || []);
//         } catch (error) {
//             console.error('Error fetching stations:', error);
//         }
//     };

//     const fetchStudents = async () => {
//         try {
//             const response = await axios.get('http://localhost:5000/students');
//             setStudents(response.data.students || []);
//         } catch (error) {
//             console.error('Error fetching students:', error);
//         }
//     };

//     const handleAddRouteStation = () => {
//         if (newRouteStation.station && newRouteStation.arrivalTime && newRouteStation.departureTime) {
//             const station = {
//                 ...newRouteStation,
//                 order: routeStations.length + 1
//             };
//             setRouteStations([...routeStations, station]);
//             setNewRouteStation({
//                 station: '',
//                 arrivalTime: '',
//                 departureTime: '',
//                 order: 0
//             });
//         }
//     };

//     const handleRemoveRouteStation = (index: number) => {
//         setRouteStations(routeStations.filter((_, i) => i !== index));
//     };

//     const handleDayToggle = (day: number) => {
//         if (formData.daysOfWeek.includes(day)) {
//             setFormData({
//                 ...formData,
//                 daysOfWeek: formData.daysOfWeek.filter(d => d !== day)
//             });
//         } else {
//             setFormData({
//                 ...formData,
//                 daysOfWeek: [...formData.daysOfWeek, day]
//             });
//         }
//     };

//     const handleStudentToggle = (studentId: string) => {
//         if (formData.students.includes(studentId)) {
//             setFormData({
//                 ...formData,
//                 students: formData.students.filter(id => id !== studentId)
//             });
//         } else {
//             setFormData({
//                 ...formData,
//                 students: [...formData.students, studentId]
//             });
//         }
//     };

//     const handleSubmit = async (e: React.FormEvent) => {
//         e.preventDefault();
//         setLoading(true);

//         try {
//             const tripData = {
//                 ...formData,
//                 route: routeStations.map(rs => ({
//                     station: rs.station,
//                     arrivalTime: new Date(`${formData.tripDate}T${rs.arrivalTime}`),
//                     departureTime: new Date(`${formData.tripDate}T${rs.departureTime}`),
//                     order: rs.order
//                 }))
//             };

//             await axios.post('http://localhost:5000/add-trip', tripData);

//             // Reset form
//             setFormData({
//                 bus: '',
//                 driver: '',
//                 students: [],
//                 tripDate: '',
//                 departureTime: '',
//                 daysOfWeek: [],
//                 repeatWeekly: false,
//                 route: []
//             });
//             setRouteStations([]);
//             setShowAddForm(false);

//             // Refresh trips list
//             fetchTrips();

//             alert('Trip added successfully!');
//         } catch (error: any) {
//             console.error('Error adding trip:', error);
//             alert(error.response?.data?.error || 'Failed to add trip');
//         } finally {
//             setLoading(false);
//         }
//     };

//     const formatDate = (dateString: string) => {
//         const date = new Date(dateString);
//         return date.toLocaleDateString('en-US', { 
//             year: 'numeric', 
//             month: 'short', 
//             day: 'numeric' 
//         });
//     };

//     const formatTime = (timeString: string) => {
//         if (!timeString) return 'N/A';
//         return timeString;
//     };

//     const getDayName = (day: number) => {
//         const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
//         return days[day] || day.toString();
//     };

//     return (
//         <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
//             <AdminSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} active={"trips"} />

//             {/* Main Content */}
//             <div className="flex-1 flex flex-col overflow-hidden">
//                 <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
//                     <div className="px-4 sm:px-6 lg:px-8 py-4">
//                         <div className="flex items-center justify-between">
//                             <div className="flex items-center">
//                                 <button
//                                     onClick={() => setSidebarOpen(true)}
//                                     className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mr-4"
//                                 >
//                                     <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
//                                     </svg>
//                                 </button>
//                                 <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Trips Management</h1>
//                             </div>
//                             <button
//                                 onClick={() => setShowAddForm(!showAddForm)}
//                                 className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
//                             >
//                                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
//                                 </svg>
//                                 {showAddForm ? 'Cancel' : 'Add Trip'}
//                             </button>
//                         </div>
//                     </div>
//                 </header>

//                 <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-8">
//                     {/* Add Trip Form */}
//                     {showAddForm && (
//                         <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-8 p-6">
//                             <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Add New Trip</h2>
//                             <form onSubmit={handleSubmit} className="space-y-6">
//                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                                     <div>
//                                         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//                                             Bus *
//                                         </label>
//                                         <select
//                                             required
//                                             value={formData.bus}
//                                             onChange={(e) => setFormData({ ...formData, bus: e.target.value })}
//                                             className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
//                                         >
//                                             <option value="">Select a bus</option>
//                                             {buses.map(bus => (
//                                                 <option key={bus._id} value={bus._id}>
//                                                     {bus.plateNumber} (Capacity: {bus.capacity})
//                                                 </option>
//                                             ))}
//                                         </select>
//                                     </div>

//                                     <div>
//                                         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//                                             Driver *
//                                         </label>
//                                         <select
//                                             required
//                                             value={formData.driver}
//                                             onChange={(e) => setFormData({ ...formData, driver: e.target.value })}
//                                             className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
//                                         >
//                                             <option value="">Select a driver</option>
//                                             {drivers.map(driver => (
//                                                 <option key={driver._id} value={driver._id}>
//                                                     {driver.name} ({driver.email})
//                                                 </option>
//                                             ))}
//                                         </select>
//                                     </div>

//                                     <div>
//                                         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//                                             Trip Date *
//                                         </label>
//                                         <input
//                                             type="date"
//                                             required
//                                             value={formData.tripDate}
//                                             onChange={(e) => setFormData({ ...formData, tripDate: e.target.value })}
//                                             className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
//                                         />
//                                     </div>

//                                     <div>
//                                         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//                                             Departure Time *
//                                         </label>
//                                         <input
//                                             type="time"
//                                             required
//                                             value={formData.departureTime}
//                                             onChange={(e) => setFormData({ ...formData, departureTime: e.target.value })}
//                                             className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
//                                         />
//                                     </div>
//                                 </div>

//                                 {/* Days of Week */}
//                                 <div>
//                                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//                                         Days of Week
//                                     </label>
//                                     <div className="flex flex-wrap gap-2">
//                                         {[0, 1, 2, 3, 4, 5, 6].map(day => (
//                                             <button
//                                                 key={day}
//                                                 type="button"
//                                                 onClick={() => handleDayToggle(day)}
//                                                 className={`px-4 py-2 rounded-lg transition-colors ${
//                                                     formData.daysOfWeek.includes(day)
//                                                         ? 'bg-blue-600 text-white'
//                                                         : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
//                                                 }`}
//                                             >
//                                                 {getDayName(day)}
//                                             </button>
//                                         ))}
//                                     </div>
//                                 </div>

//                                 {/* Repeat Weekly */}
//                                 <div className="flex items-center">
//                                     <input
//                                         type="checkbox"
//                                         id="repeatWeekly"
//                                         checked={formData.repeatWeekly}
//                                         onChange={(e) => setFormData({ ...formData, repeatWeekly: e.target.checked })}
//                                         className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
//                                     />
//                                     <label htmlFor="repeatWeekly" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
//                                         Repeat Weekly
//                                     </label>
//                                 </div>

//                                 {/* Route Stations */}
//                                 <div>
//                                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//                                         Route Stations
//                                     </label>
//                                     <div className="space-y-4">
//                                         {routeStations.map((rs, index) => (
//                                             <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
//                                                 <div className="flex-1 grid grid-cols-3 gap-2">
//                                                     <select
//                                                         value={rs.station}
//                                                         disabled
//                                                         className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
//                                                     >
//                                                         <option>{stations.find(s => s._id === rs.station)?.name || 'Station'}</option>
//                                                     </select>
//                                                     <input
//                                                         type="time"
//                                                         value={rs.arrivalTime}
//                                                         disabled
//                                                         className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
//                                                     />
//                                                     <input
//                                                         type="time"
//                                                         value={rs.departureTime}
//                                                         disabled
//                                                         className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
//                                                     />
//                                                 </div>
//                                                 <button
//                                                     type="button"
//                                                     onClick={() => handleRemoveRouteStation(index)}
//                                                     className="text-red-600 hover:text-red-800"
//                                                 >
//                                                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                                                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//                                                     </svg>
//                                                 </button>
//                                             </div>
//                                         ))}
//                                         <div className="flex gap-2">
//                                             <select
//                                                 value={newRouteStation.station}
//                                                 onChange={(e) => setNewRouteStation({ ...newRouteStation, station: e.target.value })}
//                                                 className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
//                                             >
//                                                 <option value="">Select station</option>
//                                                 {stations.map(station => (
//                                                     <option key={station._id} value={station._id}>{station.name}</option>
//                                                 ))}
//                                             </select>
//                                             <input
//                                                 type="time"
//                                                 placeholder="Arrival"
//                                                 value={newRouteStation.arrivalTime}
//                                                 onChange={(e) => setNewRouteStation({ ...newRouteStation, arrivalTime: e.target.value })}
//                                                 className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
//                                             />
//                                             <input
//                                                 type="time"
//                                                 placeholder="Departure"
//                                                 value={newRouteStation.departureTime}
//                                                 onChange={(e) => setNewRouteStation({ ...newRouteStation, departureTime: e.target.value })}
//                                                 className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
//                                             />
//                                             <button
//                                                 type="button"
//                                                 onClick={handleAddRouteStation}
//                                                 className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
//                                             >
//                                                 Add
//                                             </button>
//                                         </div>
//                                     </div>
//                                 </div>

//                                 {/* Students */}
//                                 <div>
//                                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//                                         Students
//                                     </label>
//                                     <div className="max-h-40 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-2">
//                                         {students.map(student => (
//                                             <label key={student._id} className="flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
//                                                 <input
//                                                     type="checkbox"
//                                                     checked={formData.students.includes(student._id)}
//                                                     onChange={() => handleStudentToggle(student._id)}
//                                                     className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
//                                                 />
//                                                 <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
//                                                     {student.name} ({student.studentCode})
//                                                 </span>
//                                             </label>
//                                         ))}
//                                     </div>
//                                 </div>

//                                 <div className="flex justify-end gap-4">
//                                     <button
//                                         type="button"
//                                         onClick={() => setShowAddForm(false)}
//                                         className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
//                                     >
//                                         Cancel
//                                     </button>
//                                     <button
//                                         type="submit"
//                                         disabled={loading}
//                                         className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
//                                     >
//                                         {loading ? 'Adding...' : 'Add Trip'}
//                                     </button>
//                                 </div>
//                             </form>
//                         </div>
//                     )}

//                     {/* Trips List */}
//                     <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
//                         <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
//                             <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
//                                 All Trips ({trips.length})
//                             </h2>
//                         </div>
//                         <div className="p-6">
//                             {trips.length === 0 ? (
//                                 <div className="text-center py-12">
//                                     <div className="text-5xl mb-4">🚌</div>
//                                     <p className="text-gray-600 dark:text-gray-400 text-lg">
//                                         No trips found. Add your first trip!
//                                     </p>
//                                 </div>
//                             ) : (
//                                 <div className="space-y-4">
//                                     {trips.map((trip) => (
//                                         <div
//                                             key={trip._id}
//                                             className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow"
//                                         >
//                                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//                                                 <div>
//                                                     <p className="text-sm text-gray-500 dark:text-gray-400">Bus</p>
//                                                     <p className="font-semibold text-gray-900 dark:text-white">
//                                                         {trip.bus?.plateNumber || 'N/A'}
//                                                     </p>
//                                                 </div>
//                                                 <div>
//                                                     <p className="text-sm text-gray-500 dark:text-gray-400">Driver</p>
//                                                     <p className="font-semibold text-gray-900 dark:text-white">
//                                                         {trip.driver?.name || 'N/A'}
//                                                     </p>
//                                                 </div>
//                                                 <div>
//                                                     <p className="text-sm text-gray-500 dark:text-gray-400">Date</p>
//                                                     <p className="font-semibold text-gray-900 dark:text-white">
//                                                         {formatDate(trip.tripDate)}
//                                                     </p>
//                                                 </div>
//                                                 <div>
//                                                     <p className="text-sm text-gray-500 dark:text-gray-400">Time</p>
//                                                     <p className="font-semibold text-gray-900 dark:text-white">
//                                                         {formatTime(trip.departureTime)}
//                                                     </p>
//                                                 </div>
//                                             </div>
//                                             {trip.daysOfWeek && trip.daysOfWeek.length > 0 && (
//                                                 <div className="mt-4">
//                                                     <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Days</p>
//                                                     <div className="flex flex-wrap gap-2">
//                                                         {trip.daysOfWeek.map(day => (
//                                                             <span
//                                                                 key={day}
//                                                                 className="px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-full text-sm"
//                                                             >
//                                                                 {getDayName(day)}
//                                                             </span>
//                                                         ))}
//                                                     </div>
//                                                 </div>
//                                             )}
//                                             {trip.route && trip.route.length > 0 && (
//                                                 <div className="mt-4">
//                                                     <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Route</p>
//                                                     <div className="space-y-2">
//                                                         {trip.route.map((routeItem, index) => (
//                                                             <div key={index} className="flex items-center gap-2 text-sm">
//                                                                 <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">
//                                                                     {index + 1}
//                                                                 </span>
//                                                                 <span className="text-gray-700 dark:text-gray-300">
//                                                                     {typeof routeItem.station === 'object' && routeItem.station?.name
//                                                                         ? routeItem.station.name
//                                                                         : 'Station'}
//                                                                 </span>
//                                                             </div>
//                                                         ))}
//                                                     </div>
//                                                 </div>
//                                             )}
//                                             {trip.students && trip.students.length > 0 && (
//                                                 <div className="mt-4">
//                                                     <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
//                                                         Students ({trip.students.length})
//                                                     </p>
//                                                     <div className="flex flex-wrap gap-2">
//                                                         {trip.students.slice(0, 5).map((student: any) => (
//                                                             <span
//                                                                 key={student._id || student}
//                                                                 className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs"
//                                                             >
//                                                                 {typeof student === 'object' ? student.name : 'Student'}
//                                                             </span>
//                                                         ))}
//                                                         {trip.students.length > 5 && (
//                                                             <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs">
//                                                                 +{trip.students.length - 5} more
//                                                             </span>
//                                                         )}
//                                                     </div>
//                                                 </div>
//                                             )}
//                                         </div>
//                                     ))}
//                                 </div>
//                             )}
//                         </div>
//                     </div>
//                 </main>
//             </div>
//         </div>
//     )
// }

// export default TripsPage



// =======================================================================================================================================================================================================
'use client'

import React from 'react'
import axios from 'axios'
import Link from 'next/link'
import AdminSidebar from '@/Components/admin_sidebar'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/api'

interface Bus { _id: string; plateNumber: string; capacity: number }
interface Driver { _id: string; name: string }
interface Student { _id: string; name: string; studentCode: string }
interface Route { _id: string; name: string }

interface Trip {
  _id: string
  bus: Bus | null
  driver: Driver | null
  students: Student[]
  route: string        // route name only
  tripDate: string
  departureTime: string
  daysOfWeek: number[]
  repeatWeekly: boolean
}

const getDayNumber = (dateString: string) => new Date(dateString).getDay()

const TripsPage = () => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const [showForm, setShowForm] = React.useState(false)
  const [editingTrip, setEditingTrip] = React.useState<Trip | null>(null)

  const [formData, setFormData] = React.useState({
    bus: '',
    driver: '',
    students: [] as string[],
    tripDate: '',
    departureTime: '',
    daysOfWeek: [] as number[],
    repeatWeekly: false,
    route: ''      // route ID,
  })

  const queryClient = useQueryClient()

  // Fetching Data
  const { data: buses = [] } = useQuery<Bus[]>({
    queryKey: ['buses'],
    queryFn: async () => (await apiClient.get('/buses')).data
  })

  const { data: drivers = [] } = useQuery<Driver[]>({
    queryKey: ['drivers'],
    queryFn: async () => (await apiClient.get('/drivers')).data
  })

  const { data: routes = [] } = useQuery<Route[]>({
    queryKey: ['routes'],
    queryFn: async () => {
      const response = await apiClient.get('/routes')
      return response.data.routes || []
    }
  })

  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ['students'],
    queryFn: async () => (await apiClient.get('/students')).data
  })

  const { data: trips = [] } = useQuery<Trip[]>({
    queryKey: ['trips'],
    queryFn: async () => (await apiClient.get('/trips')).data
  })

  // ————————— MUTATIONS —————————

  const addTripMutation = useMutation<any, any, any>({
    mutationFn: (newTrip: any) => apiClient.post('/add-trip', newTrip),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trips'] as const })
  })

  const editTripMutation = useMutation<any, any, any>({
    mutationFn: (updated: any) =>
      apiClient.put(`/trips/${updated._id}`, updated),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trips'] as const })
  })

  const deleteTripMutation = useMutation<any, any, string>({
    mutationFn: (id: string) =>
      apiClient.delete(`/trips/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trips'] as const })
  })

  // ————————— HANDLERS —————————

  const handleStudentToggle = (id: string) => {
    setFormData({
      ...formData,
      students: formData.students.includes(id)
        ? formData.students.filter(s => s !== id)
        : [...formData.students, id]
    })
  }

  const handleDayToggle = (day: number) => {
    setFormData({
      ...formData,
      daysOfWeek: formData.daysOfWeek.includes(day)
        ? formData.daysOfWeek.filter(d => d !== day)
        : [...formData.daysOfWeek, day]
    })
  }

  // Prevent Selecting Past Dates
  const handleDateChange = (date: string) => {
    const selected = new Date(date)
    const now = new Date()

    now.setHours(0, 0, 0, 0)
    selected.setHours(0, 0, 0, 0)

    if (selected < now) {
      alert("❌ You cannot select a past date.")
      return
    }

    const day = getDayNumber(date)
    setFormData({ ...formData, tripDate: date, daysOfWeek: [day] })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const payload = { ...formData }

    try {
      if (editingTrip) {
        await editTripMutation.mutateAsync({ ...payload, _id: editingTrip._id })
        alert("Trip updated!")
      } else {
        await addTripMutation.mutateAsync(payload)
        alert("Trip added!")
      }

      resetForm()
    } catch (err) {
      console.error(err)
      // alert("Error saving trip")
    }
  }

  const resetForm = () => {
    setFormData({
      bus: '',
      driver: '',
      students: [],
      tripDate: '',
      departureTime: '',
      daysOfWeek: [],
      repeatWeekly: false,
      route: ''
    })
    setEditingTrip(null)
    setShowForm(false)
  }

  // LOAD trip for editing
  const startEditTrip = (trip: Trip) => {
    setEditingTrip(trip)
    setFormData({
      bus: trip.bus?._id || '',
      driver: trip.driver?._id || '',
      students: trip.students.map(s => s._id),
      tripDate: trip.tripDate,
      departureTime: trip.departureTime,
      daysOfWeek: trip.daysOfWeek || [],
      repeatWeekly: trip.repeatWeekly,
      route: trip.route   // route NAME
    })
    setShowForm(true)
  }

  const getDayName = (day: number) =>
    ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day]

  const formatDate = (d: string) =>
    d ? new Date(d).toLocaleDateString() : 'N/A'

  // ————————— JSX —————————

  return (
    <div className="min-h-screen flex bg-gray-900">
      <AdminSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} active="trips" />

      <div className="flex-1 p-0">

        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-700">
          <div className="px-4 py-4 flex justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mr-4"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Trips Management
            </h1>

            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              {showForm ? "Cancel" : "Add Trip"}
            </button>
          </div>
        </header>

        {/* Form */}
        {showForm && (
          <div className="bg-gray-800   lg:p-6 p-4 m-4 rounded-lg shadow lg:m-6">
            <h2 className="text-xl font-semibold mb-3">
              {editingTrip ? "Edit Trip" : "Add Trip"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4 flex flex-col">

              {/* Bus & Driver */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Bus */}
                <select
                  required
                  value={formData.bus}
                  onChange={e => setFormData({ ...formData, bus: e.target.value })}
                  className="border p-2 rounded"
                >
                  <option value="">Select Bus</option>
                  {buses.map(b => (
                    <option key={b._id} value={b._id}>
                      {b.plateNumber}
                    </option>
                  ))}
                </select>

                {/* Driver */}
                <select
                  required
                  value={formData.driver}
                  onChange={e => setFormData({ ...formData, driver: e.target.value })}
                  className="border p-2 rounded"
                >
                  <option value="">Select Driver</option>
                  {drivers.map(d => (
                    <option key={d._id} value={d._id}>
                      {d.name}
                    </option>
                  ))}
                </select>

                <input
                  type="date"
                  required
                  value={formData.tripDate}
                  onChange={e => handleDateChange(e.target.value)}
                  className="border p-2 rounded"
                />

                <input
                  type="time"
                  required
                  value={formData.departureTime}
                  onChange={e => setFormData({ ...formData, departureTime: e.target.value })}
                  className="border p-2 rounded"
                />
              </div>

              {/* Days */}
              <div className="flex gap-2 flex-wrap">
                {[0, 1, 2, 3, 4, 5, 6].map(day => (
                  <button
                    type="button"
                    key={day}
                    onClick={() => handleDayToggle(day)}
                    className={`px-3 py-1 rounded ${formData.daysOfWeek.includes(day)
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200"
                      }`}
                  >
                    {getDayName(day)}
                  </button>
                ))}
              </div>

              {/* Students */}
              <div>
                <p className="font-semibold">Students</p>
                <div className="max-h-40 overflow-y-auto border p-2 rounded">
                  {students.map(s => (
                    <label key={s._id} className="block">
                      <input
                        type="checkbox"
                        checked={formData.students.includes(s._id)}
                        onChange={() => handleStudentToggle(s._id)}
                      />
                      <span className="ml-2">{s.name} ({s.studentCode})</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Route — NOW route name only */}
              <div>
                <p className="font-semibold">Route</p>
                <select
                  required
                  value={formData.route}
                  onChange={e => setFormData({ ...formData, route: e.target.value })}
                  className="border p-2 rounded w-full"
                >
                  <option value="">Select Route</option>
                  {routes.map((route: Route) => (
                    <option key={route._id} value={route._id}>
                      {route.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* repeatWeekly */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.repeatWeekly}
                  onChange={e => setFormData({ ...formData, repeatWeekly: e.target.checked })}
                  id="repeatWeekly"
                />
                <label htmlFor="repeatWeekly">Repeat Weekly</label>
              </div>

              <button className="bg-blue-600 text-white px-4 py-2 rounded">
                {editingTrip ? "Update Trip" : "Add Trip"}
              </button>

            </form>
          </div>
        )}

        {/* Trips List */}
        <div className="bg-gray-800 m-4 p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-3">
            All Trips ({trips.length})
          </h2>

          {trips.length === 0 && <p>No trips found.</p>}

          <div className="space-y-4 flex flex-col">
            {trips.map(trip => (
              <Link
                key={trip._id}
                href={`/admin-dashboard/trip/${trip._id}`}
                className="block"
              >
                <div className="border p-4 rounded flex justify-between hover:bg-gray-700 cursor-pointer">

                  <div>
                    <p><strong>Bus:</strong> {trip.bus?.plateNumber}</p>
                    <p><strong>Driver:</strong> {trip.driver?.name}</p>
                    <p><strong>Route:</strong> {trip.route}</p>
                    <p><strong>Date:</strong> {formatDate(trip.tripDate)}</p>
                    <p><strong>Time:</strong> {trip.departureTime}</p>
                  </div>

                  <div className="flex flex-col justify-center gap-2">

                    {/* EDIT BUTTON */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // STOP link navigation
                        e.preventDefault(); // STOP link navigation
                        startEditTrip(trip);
                      }}
                      className="px-3 py-1 bg-yellow-500 text-white rounded"
                    >
                      Edit
                    </button>

                    {/* DELETE BUTTON */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        deleteTripMutation.mutate(trip._id);
                      }}
                      className="px-3 py-1 bg-red-600 text-white rounded"
                    >
                      Delete
                    </button>

                  </div>
                </div>
              </Link>
            ))}
          </div>

        </div>

      </div>
    </div>
  )
}

export default TripsPage
