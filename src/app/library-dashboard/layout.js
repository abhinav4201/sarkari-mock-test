// src/app/library-dashboard/layout.js

"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import LibraryNavbar from "@/components/LibraryNavbar"; // Import the new navbar

export default function LibraryDashboardLayout({ children }) {
  const { user, loading, isLibraryUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If auth is done loading and the user is NOT a library user, redirect them away.
    if (!loading && !isLibraryUser) {
      router.push("/");
    }
  }, [user, loading, isLibraryUser, router]);

  if (loading || !isLibraryUser) {
    return (
      <div className='flex justify-center items-center h-screen'>
        <p>Loading...</p>
      </div>
    );
  }

  // If the user is a library user, show the special layout
  return (
    <div className='bg-slate-100 min-h-screen'>
      <LibraryNavbar />
      <main>{children}</main>
    </div>
  );
}
