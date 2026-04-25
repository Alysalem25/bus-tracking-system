"use client";

import React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useAuthStore } from "@/store/authStore";
import apiClient from "@/lib/api";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [errormsg, setErrormsg] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "",
    studentCode: "",
  });

  const API_URL = "https://ddf7-154-180-27-58.ngrok-free.app";

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      alert("You are already logged in. Redirecting to your dashboard...");
      if (user.role === "admin") {
        router.push("/admin-dashboard");
      } else if (user.role === "driver") {
        router.push("/driver-dashboard");
      } else {
        router.push("/student-dashboard");
      }
    } else {
      alert("You are not logged in. ...");

      router.push("/login");
    }
  }, [isAuthenticated, user, router]);


  // const handleChange = (e) => {
  //   setFormData({
  //     ...formData,
  //     [e.target.name]: e.target.value,
  //   });
  // };

  // const handleSubmit = async (e) => {
  //   e.preventDefault(); // prevent page reload

  //   try {
  //     setLoading(true);
  //     const response = await axios.post(
  //       "http://localhost:5000/signup",
  //       formData
  //     );
  //     console.log("✅ User registered:");
  //     gotoDashboard(response.data.user);
  //     setLoading(false);
  //   } catch (error) {
  //     if (error.response && error.response.status === 400) {
  //       console.error("❌ Registration error:", error.response.data);
  //       // alert(`Registration error: ${error.response.data.message}`);
  //       setErrormsg(error.response.data.message);
  //       return;
  //     }
  //     console.error("❌ Error registering user:", error.response?.data || error.message);
  //     setErrormsg(error.response.data.message);
  //     alert("Failed to register user. Check the console for details.");
  //   }
  // }; 

  const handellogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const target = e.target as HTMLFormElement & { email: { value: string }; password: { value: string } };
    const email = target.email.value;
    const password = target.password.value;

    try {
      const response = await apiClient.post(`${API_URL}/login`, { email, password }
      );
      console.log(" User logged in:");
      gotoDashboard(response.data.user);
    } catch (err: unknown) {
      const error = err as any;
      const message = error.response?.data?.message || error.message || "Login failed";
      console.error(" Error logging in user:", message);
      setErrormsg(message);
    }
  }


  const gotoDashboard = (user: any) => {
    if (user.role === "admin") {
      window.location.href = "/admin-dashboard";
    } else if (user.role === "driver") {
      localStorage.setItem("driverId", user._id);
      window.location.href = `/driver-dashboard`;
    } else {
      window.location.href = "/student-dashboard";
    }
  }

  // Show loading while checking auth
  if (isAuthenticated === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // This should not render as useEffect redirects
  return null;
}










