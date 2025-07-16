// src/app/join/page.js
"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  query,
  where,
  limit,
  getDocs, // Ensure getDocs is imported
} from "firebase/firestore"; //
import { Library, LogIn, UserCog } from "lucide-react";
import toast from "react-hot-toast";

// A smaller component to handle the logic, wrapped in Suspense
function JoinPageContent() {
  const searchParams = useSearchParams();
  const { googleSignInForLibrary, googleSignInForLibraryOwner } = useAuth();

  const [library, setLibrary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const libraryId = searchParams.get("libraryId");
  const ownerJoinCode = searchParams.get("ownerJoinCode");

  const isOwnerJoin = !!ownerJoinCode;
  const targetCode = isOwnerJoin ? ownerJoinCode : libraryId;

  useEffect(() => {
    if (!targetCode) {
      setError(
        "No join code provided. Please use the link or QR code from your library."
      );
      setLoading(false);
      return;
    }

    const fetchLibraryInfo = async () => {
      try {
        let librarySnap;

        if (isOwnerJoin) {
          const q = query(
            collection(db, "libraries"),
            where("ownerJoinCode", "==", ownerJoinCode),
            limit(1)
          );
          const querySnapshot = await getDocs(q); //
          if (!querySnapshot.empty) {
            // Check if snapshot is not empty
            librarySnap = querySnapshot.docs[0];
          } else {
            librarySnap = null; // No matching library found
          }
        } else {
          const libraryRef = doc(db, "libraries", libraryId);
          librarySnap = await getDoc(libraryRef); //
        }

        if (librarySnap && librarySnap.exists()) {
          //
          setLibrary(librarySnap.data());
        } else {
          setError(
            "This join link is invalid or the library is no longer a partner."
          );
        }
      } catch (e) {
        setError("Could not verify the library link.");
        console.error("Error fetching library info:", e); // Log the actual error
      } finally {
        setLoading(false);
      }
    };

    fetchLibraryInfo();
  }, [libraryId, ownerJoinCode, isOwnerJoin, targetCode]);

  const handleJoin = async () => {
    if (!targetCode) return toast.error("Cannot join without a code.");
    if (isOwnerJoin) {
      await googleSignInForLibraryOwner(ownerJoinCode);
    } else {
      await googleSignInForLibrary(libraryId);
    }
  };

  if (loading) {
    return <p className='text-center'>Verifying your library link...</p>;
  }

  if (error) {
    return <p className='text-center text-red-600 font-semibold'>{error}</p>;
  }

  return (
    <>
      {isOwnerJoin ? (
        <UserCog className='mx-auto h-16 w-16 text-purple-500' />
      ) : (
        <Library className='mx-auto h-16 w-16 text-indigo-500' />
      )}
      <h2 className='mt-4 text-2xl font-bold text-center text-slate-800'>
        Welcome to Sarkari Mock Test
      </h2>
      <p className='mt-2 text-lg text-center text-slate-600'>
        You have been invited to join as a{" "}
        <strong>{isOwnerJoin ? "Library Owner" : "Student"}</strong> via{" "}
        <strong>{library?.libraryName || "your library"}</strong>.
      </p>
      <div className='mt-8'>
        <button
          onClick={handleJoin}
          className='w-full flex items-center justify-center gap-3 px-6 py-4 bg-indigo-600 text-white font-bold text-lg rounded-lg hover:bg-indigo-700'
        >
          <LogIn size={20} />
          Join with Google
        </button>
      </div>
    </>
  );
}

// The main page component that uses Suspense
export default function Join() {
  return (
    <div className='min-h-screen bg-slate-100 flex items-center justify-center p-4'>
      <div className='max-w-md w-full bg-white p-8 rounded-2xl shadow-lg'>
        <Suspense fallback={<p className='text-center'>Loading...</p>}>
          <JoinPageContent />
        </Suspense>
      </div>
    </div>
  );
}
