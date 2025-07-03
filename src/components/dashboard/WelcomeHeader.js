"use client";
import { useAuth } from "@/context/AuthContext";

export default function WelcomeHeader() {
  const { user } = useAuth();
  return (
    <h1 className='text-3xl font-bold text-gray-800'>
      Welcome back, {user ? user.displayName : "User"}!
    </h1>
  );
}
