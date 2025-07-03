"use client";
import { useAuth } from "@/context/AuthContext";

export default function WelcomeHeader() {
  const { user } = useAuth();
  return (
    <div>
      <h1 className='text-3xl sm:text-4xl font-bold text-slate-800'>
        Welcome back, {user ? user.displayName.split(" ")[0] : "User"}!
      </h1>
      <p className='mt-2 text-lg text-slate-600'>
        Let's continue your journey to success.
      </p>
    </div>
  );

}
