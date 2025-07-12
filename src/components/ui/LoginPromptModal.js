"use client";

import Modal from "./Modal";
import { useAuth } from "@/context/AuthContext";
import { LogIn } from "lucide-react";

export default function LoginPromptModal() {
  // --- UPDATED: The modal now controls itself using the Auth Context ---
  const { isLoginPromptOpen, closeLoginPrompt, googleSignIn } = useAuth();

  const handleLogin = () => {
    // It calls the same googleSignIn function from the context
    googleSignIn();
  };

  return (
    // It uses the context state to determine if it should be open
    <Modal
      isOpen={isLoginPromptOpen}
      onClose={closeLoginPrompt}
      title='Login Required'
    >
      <div className='p-6 text-center'>
        <div className='flex justify-center mb-4'>
          <div className='p-4 bg-indigo-100 rounded-full'>
            <LogIn className='h-8 w-8 text-indigo-600' />
          </div>
        </div>
        <h3 className='text-xl font-bold text-slate-900'>
          Please Login to Continue
        </h3>
        <p className='mt-2 text-slate-600'>
          You need to be signed in to like tests and save your progress.
        </p>
        <div className='mt-8'>
          <button
            onClick={handleLogin}
            className='w-full px-8 py-3 bg-indigo-600 text-white font-bold rounded-lg text-lg hover:bg-indigo-700'
          >
            Login with Google
          </button>
        </div>
      </div>
    </Modal>
  );
}
