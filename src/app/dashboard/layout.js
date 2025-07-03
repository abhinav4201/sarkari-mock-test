"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/"); // Redirect to home page if not logged in
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className='flex justify-center items-center h-screen'>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  if (user) {
    return <>{children}</>; // If user is logged in, show the page content
  }

  return null; // or a login prompt, but the redirect handles it.
}
