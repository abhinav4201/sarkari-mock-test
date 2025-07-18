"use client";

import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Library, User, FileText } from "lucide-react";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function LibraryOwnerAnalyticsPage() {
  const params = useParams();
  const libraryId = params.libraryId;
  const {
    user,
    loading: authLoading,
    isLibraryOwner,
    ownedLibraryIds,
  } = useAuth();

  const [libraryDetails, setLibraryDetails] = useState(null);
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
        setLibraryDetails(librarySnap.data());
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

  if (loading || authLoading || !libraryDetails) {
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
          Student List for {libraryDetails.libraryName}
        </h1>
        <p className='text-lg text-slate-600 mb-6'>
          A list of all students who have joined using this library's code.
        </p>
        <div className='bg-white p-6 rounded-2xl shadow-lg border'>
          <h2 className='text-xl font-bold text-slate-800 mb-4'>
            Onboarded Users ({onboardedUsers.length})
          </h2>
          {onboardedUsers.length > 0 ? (
            <div className='overflow-x-auto'>
              <table className='min-w-full divide-y divide-slate-200'>
                <thead className='bg-slate-50'>
                  <tr>
                    <th className='px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider'>
                      Student Name
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider'>
                      Email
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider'>
                      Remaining Tests (This Month)
                    </th>
                  </tr>
                </thead>
                <tbody className='bg-white divide-y divide-slate-200'>
                  {onboardedUsers.map((student) => {
                    const limit = libraryDetails.monthlyTestLimit || 0;
                    const taken = student.testsTakenThisMonth || 0;
                    const remaining = limit - taken;

                    return (
                      <tr key={student.uid}>
                        <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900'>
                          {student.name}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-slate-600'>
                          {student.email}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm font-semibold'>
                          {limit > 0 ? (
                            <span
                              className={
                                remaining > 5
                                  ? "text-green-600"
                                  : "text-amber-600"
                              }
                            >
                              {remaining < 0 ? 0 : remaining} / {limit}
                            </span>
                          ) : (
                            <span className='text-indigo-600'>Unlimited</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
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
