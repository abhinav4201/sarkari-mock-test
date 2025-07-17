"use client";

import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Library, User } from "lucide-react";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function LibraryOwnerAnalyticsPage() {
  const params = useParams();
  const libraryId = params.libraryId;
  const {
    user,
    loading: authLoading,
    isLibraryOwner,
    ownedLibraryIds,
  } = useAuth();

  const [libraryName, setLibraryName] = useState("Loading...");
  const [onboardedUsers, setOnboardedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLibraryUsers = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const idToken = await user.getIdToken();
      const response = await fetch("/api/library-owner/get-students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ libraryId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to fetch students from server."
        );
      }

      const usersData = await response.json();

      // Convert timestamp back to Date object for display
      const formattedUsers = usersData.map((u) => ({
        ...u,
        createdAt: u.createdAt ? new Date(u.createdAt) : null,
      }));

      setOnboardedUsers(formattedUsers);
    } catch (err) {
      console.error("[PAGE FETCH ERROR]", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [libraryId, user]);

  useEffect(() => {
    if (authLoading) return;

    if (!isLibraryOwner || !ownedLibraryIds.includes(libraryId)) {
      setError("Access Denied: You do not have permission to view this page.");
      setLoading(false);
      return;
    }

    const fetchLibraryInfo = async () => {
      const libraryRef = doc(db, "libraries", libraryId);
      const librarySnap = await getDoc(libraryRef);
      if (librarySnap.exists()) {
        setLibraryName(librarySnap.data().libraryName);
      }
    };

    fetchLibraryInfo();
    fetchLibraryUsers();
  }, [
    libraryId,
    authLoading,
    isLibraryOwner,
    ownedLibraryIds,
    fetchLibraryUsers,
  ]);

  if (loading || authLoading) {
    return (
      <div className='text-center p-12 text-lg font-medium'>
        Loading Analytics...
      </div>
    );
  }

  if (error) {
    return (
      <div className='text-center p-12 text-red-600 font-semibold'>{error}</div>
    );
  }

  return (
    <div className='bg-slate-100 min-h-screen py-8'>
      <div className='container mx-auto px-4'>
        <h1 className='text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3'>
          <Library className='h-8 w-8 text-indigo-600' />
          Student List for {libraryName}
        </h1>
        <p className='text-lg text-slate-600 mb-6'>
          A list of all students who have joined using this library's code.
        </p>
        <div className='bg-white p-6 rounded-2xl shadow-lg border'>
          <h2 className='text-xl font-bold text-slate-800 mb-4'>
            Onboarded Users ({onboardedUsers.length})
          </h2>
          {onboardedUsers.length > 0 ? (
            <div className='space-y-3'>
              {onboardedUsers.map((student) => (
                <div
                  key={student.uid}
                  className='flex items-center justify-between p-4 rounded-lg bg-slate-50 border'
                >
                  <div>
                    <p className='font-semibold text-slate-800'>
                      {student.name}
                    </p>
                    <p className='text-sm text-slate-600'>{student.email}</p>
                  </div>
                  <p className='text-xs text-slate-500'>
                    Joined: {student.createdAt?.toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className='text-center py-12'>
              <User className='mx-auto h-12 w-12 text-slate-400' />
              <h3 className='mt-2 text-lg font-semibold text-slate-900'>
                No users onboarded yet.
              </h3>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
