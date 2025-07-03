"use client";

import { useAuth } from "@/context/AuthContext";

export default function SignUpButton() {
  const { googleSignIn } = useAuth();

  const handleSignIn = async () => {
    try {
      await googleSignIn();
    } catch (error) {
      console.error("Login Failed:", error);
    }
  };

  return (
    <button
      onClick={handleSignIn}
      className='px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg text-lg font-semibold'
    >
      Sign Up / Login
    </button>
  );
}
