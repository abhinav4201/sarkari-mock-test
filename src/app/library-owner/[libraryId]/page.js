"use client";

import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Library, User } from "lucide-react";
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

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const fetchLibraryData = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch library details first to get the name
      const libraryRef = doc(db, "libraries", libraryId);
      const librarySnap = await getDoc(libraryRef);
      if (librarySnap.exists()) {
        setLibraryDetails(librarySnap.data());
      } else {
        throw new Error("Library not found.");
      }

      // Now fetch student data for the selected month
      const idToken = await user.getIdToken();
      const response = await fetch("/api/library-owner/get-students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          libraryId,
          month: selectedMonth,
          year: selectedYear,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to fetch students from server."
        );
      }

      const usersData = await response.json();
      setOnboardedUsers(usersData);
    } catch (err) {
      console.error("[PAGE FETCH ERROR]", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [libraryId, user, selectedMonth, selectedYear]);

  useEffect(() => {
    if (authLoading || !user) return;

    if (!isLibraryOwner || !ownedLibraryIds.includes(libraryId)) {
      setError("Access Denied: You do not have permission to view this page.");
      setLoading(false);
      return;
    }

    fetchLibraryData();
  }, [
    libraryId,
    authLoading,
    isLibraryOwner,
    ownedLibraryIds,
    user,
    fetchLibraryData,
  ]);

  const months = Array.from({ length: 12 }, (v, i) => ({
    value: i + 1,
    name: new Date(0, i).toLocaleString("en-US", { month: "long" }),
  }));
  const years = Array.from(
    { length: 5 },
    (v, i) => new Date().getFullYear() - i
  );

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
          Student List for {libraryDetails.libraryName}
        </h1>
        <p className='text-lg text-slate-600 mb-6'>
          A list of all students who have joined using this library's code.
        </p>

        <div className='bg-white p-6 rounded-2xl shadow-lg border mb-6'>
          <h2 className='text-xl font-bold text-slate-800 mb-4'>
            Filter Activity by Month
          </h2>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <div>
              <label
                htmlFor='month-select'
                className='block text-sm text-slate-900 font-medium'
              >
                Month
              </label>
              <select
                id='month-select'
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className='mt-1 block w-full p-2 border text-slate-900 border-slate-300 rounded-md'
              >
                {months.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor='year-select'
                className='block text-sm text-slate-900 font-medium'
              >
                Year
              </label>
              <select
                id='year-select'
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className='mt-1 block w-full p-2 border text-slate-900 border-slate-300 rounded-md'
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

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
                                remaining > limit / 2
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
