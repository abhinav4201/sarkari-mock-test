// src/app/library-dashboard/layout.js

"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
// REMOVED: No longer need to import LibraryNavbar here

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

  // The layout now only renders the main content, not its own navbar.
  return (
    <div className='bg-slate-100 min-h-screen'>
      <main>{children}</main>
    </div>
  );
}
