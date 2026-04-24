import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

export type UserRole = "admin" | "driver" | "student";

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  number?: string;
  studentCode?: string;
  licenseNumber?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

const http = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" }
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (value?: unknown) => void; reject: (error?: unknown) => void }> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
}

http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  if (token && config.headers) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    if (!original) return Promise.reject(error);

    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => failedQueue.push({ resolve, reject }))
          .then((token) => {
            if (original.headers && token) original.headers.Authorization = `Bearer ${String(token)}`;
            return http(original);
          })
          .catch((e) => Promise.reject(e));
      }

      original._retry = true;
      isRefreshing = true;
      try {
        const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {}, { withCredentials: true });
        const accessToken: string = response.data?.data?.accessToken;
        if (typeof window !== "undefined" && accessToken) localStorage.setItem("accessToken", accessToken);
        processQueue(null, accessToken);
        if (original.headers) original.headers.Authorization = `Bearer ${accessToken}`;
        return http(original);
      } catch (refreshError) {
        processQueue(refreshError, null);
        if (typeof window !== "undefined") {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("user");
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (email: string, password: string) => http.post("/login", { email, password }),
  signup: (payload: Partial<User> & { password: string }) => http.post("/signup", payload),
  refresh: () => http.post("/api/auth/refresh"),
  logout: () => http.post("/api/auth/logout"),
  me: () => http.get("/api/auth/me")
};

export const userApi = {
  updateProfile: (id: string, payload: { name?: string; email?: string; phone?: string; currentPassword?: string; newPassword?: string }) =>
    http.put(`/update-profile/${id}`, payload),
  listUsers: () => http.get("/users")
};

export const driverApi = {
  list: () => http.get("/drivers"),
  create: (payload: { name: string; email: string; password: string; number?: string; licenseNumber: string }) => http.post("/add-driver", payload),
  remove: (id: string) => http.delete(`/delete-driver/${id}`)
};

export const studentApi = {
  list: () => http.get("/students"),
  create: (payload: { name: string; email: string; password: string; number?: string; studentCode: string }) => http.post("/add-student", payload),
  remove: (id: string) => http.delete(`/delete-student/${id}`)
};

export const stationApi = {
  list: () => http.get("/stations"),
  create: (payload: { name: string; address?: string; location?: { coordinates: [number, number] } }) => http.post("/add-station", payload),
  update: (id: string, payload: unknown) => http.put(`/update-station/${id}`, payload),
  remove: (id: string) => http.delete(`/delete-station/${id}`)
};

export const routeApi = {
  list: () => http.get("/routes"),
  byId: (id: string) => http.get(`/routes/${id}`),
  create: (payload: unknown) => http.post("/add-route", payload),
  update: (id: string, payload: unknown) => http.put(`/update-route/${id}`, payload),
  remove: (id: string) => http.delete(`/delete-route/${id}`)
};

export const tripApi = {
  list: () => http.get("/trips"),
  byId: (id: string) => http.get(`/trips/${id}`),
  create: (payload: unknown) => http.post("/add-trip", payload),
  update: (id: string, payload: unknown) => http.put(`/trips/${id}`, payload),
  remove: (id: string) => http.delete(`/trips/${id}`),
  active: () => http.get("/active-trips"),
  driverTrips: (driverId: string) => http.get(`/driver-trips/${driverId}`),
  start: (id: string) => http.post(`/start-trip/${id}`),
  pause: (id: string) => http.post(`/pause-trip/${id}`),
  end: (id: string) => http.post(`/end-trip/${id}`),
  updateLocation: (tripId: string, payload: { lat: number; lng: number }) => http.post(`/trips/update-location/${tripId}`, payload),
  busTrip: (id: string) => http.get(`/bus-trip/${id}`),
  addStudentByCode: (id: string, studentCode: string) => http.post(`/bus-trip/${id}/add-student`, { studentCode })
};

export const busApi = {
  list: () => http.get("/buses"),
  create: (payload: { plateNumber: string; capacity: number; status: string }) => http.post("/add-bus", payload),
  update: (id: string, payload: unknown) => http.put(`/update-bus/${id}`, payload),
  remove: (id: string) => http.delete(`/delete-bus/${id}`)
};

export const statsApi = {
  get: () => http.get("/stats")
};

export default http;


