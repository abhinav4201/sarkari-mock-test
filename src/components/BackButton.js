"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function BackButton() {
  const router = useRouter();
  const { isLibraryUser, isLibraryOwner, ownedLibraryIds } = useAuth();

  const handleBackClick = () => {
    let path = "/dashboard"; // Default for regular users

    if (isLibraryOwner && ownedLibraryIds.length > 0) {
      path = `/library-owner/${ownedLibraryIds[0]}`;
    } else if (isLibraryUser) {
      path = "/library-dashboard";
    }

    router.push(path);
  };

  return (
    <button
      onClick={handleBackClick}
      className='px-6 py-2 bg-slate-600 text-white font-semibold rounded-lg hover:bg-slate-700 transition-all shadow-md hover:shadow-lg'
    >
      Back to Dashboard
    </button>
  );
}
