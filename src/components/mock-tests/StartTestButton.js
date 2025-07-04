"use client";

import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { usePathname } from "next/navigation"; // Import the usePathname hook
import { Shield } from "lucide-react";

export default function StartTestButton({ test }) {
  const { user, googleSignIn } = useAuth();
  const pathname = usePathname(); // Get the current URL path (e.g., /mock-tests/some-id)

  // THIS IS THE FIX: This function now calls googleSignIn with the current path.
  const handleLogin = () => {
    googleSignIn(pathname);
  };

  // Case 1: User is not logged in
  if (!user) {
    return (
      <button
        onClick={handleLogin}
        className='w-full sm:w-auto inline-block px-12 py-4 bg-indigo-600 text-white rounded-lg text-lg font-bold hover:bg-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105'
      >
        Login to Start Test
      </button>
    );
  }

  // Case 2: Test is premium (future-proofing)
  if (test.isPremium) {
    return (
      <button
        disabled
        className='w-full sm:w-auto inline-flex items-center justify-center px-12 py-4 bg-slate-400 text-white rounded-lg text-lg font-bold cursor-not-allowed'
      >
        <Shield className='mr-2 h-5 w-5' /> Upgrade to Start
      </button>
    );
  }

  // Case 3: User is logged in and test is free
  return (
    <Link
      href={`/mock-tests/take/${test.id}`}
      className='w-full sm:w-auto inline-block px-12 py-4 bg-green-600 text-white rounded-lg text-lg font-bold hover:bg-green-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105'
    >
      Start Test Now
    </Link>
  );
}
