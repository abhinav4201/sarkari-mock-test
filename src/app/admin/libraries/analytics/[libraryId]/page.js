"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, notFound } from "next/navigation";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  Timestamp,
} from "firebase/firestore";
import toast from "react-hot-toast";
import { Library, User, FileText } from "lucide-react";

export default function LibraryAnalyticsPage() {
  const params = useParams();
  const libraryId = params.libraryId;

  const [libraryName, setLibraryName] = useState("Loading Library...");
  const [libraryUsers, setLibraryUsers] = useState([]);
  const [monthlyTestCounts, setMonthlyTestCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const fetchLibraryAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch library details
      const libraryRef = doc(db, "libraries", libraryId);
      const librarySnap = await getDoc(libraryRef);
      if (!librarySnap.exists()) {
        notFound();
        return;
      }
      setLibraryName(librarySnap.data().libraryName);

      // 2. Fetch all users for this library from the 'users' collection
      const usersQuery = query(
        collection(db, "users"),
        where("libraryId", "==", libraryId),
        where("role", "==", "library-student")
      );
      const usersSnapshot = await getDocs(usersQuery);
      const usersData = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setLibraryUsers(usersData);
    } catch (err) {
      console.error("Error fetching library users:", err);
      setError("Failed to load library data.");
      toast.error("Failed to load library data.");
    } finally {
      setLoading(false);
    }
  }, [libraryId]);

  // Fetch test counts for the selected month whenever the month, year, or user list changes
  useEffect(() => {
    const fetchMonthlyCounts = async () => {
      if (libraryUsers.length === 0) {
        setMonthlyTestCounts({});
        return;
      }

      setLoading(true);
      const userUids = libraryUsers.map((user) => user.uid);
      const counts = {};

      const startDate = Timestamp.fromDate(
        new Date(selectedYear, selectedMonth - 1, 1)
      );
      const endDate = Timestamp.fromDate(
        new Date(selectedYear, selectedMonth, 0, 23, 59, 59)
      );

      // Fetch results in chunks to stay within 'in' query limits
      for (let i = 0; i < userUids.length; i += 10) {
        const chunk = userUids.slice(i, i + 10);
        const resultsQuery = query(
          collection(db, "mockTestResults"),
          where("userId", "in", chunk),
          where("completedAt", ">=", startDate),
          where("completedAt", "<=", endDate)
        );
        const resultsSnapshot = await getDocs(resultsQuery);
        resultsSnapshot.forEach((doc) => {
          const result = doc.data();
          counts[result.userId] = (counts[result.userId] || 0) + 1;
        });
      }
      setMonthlyTestCounts(counts);
      setLoading(false);
    };

    fetchMonthlyCounts();
  }, [libraryUsers, selectedMonth, selectedYear]);

  useEffect(() => {
    if (libraryId) {
      fetchLibraryAnalytics();
    }
  }, [libraryId, fetchLibraryAnalytics]);

  const displayedUsers = useMemo(() => {
    return libraryUsers.map((user) => ({
      ...user,
      testsTaken: monthlyTestCounts[user.uid] || 0,
    }));
  }, [libraryUsers, monthlyTestCounts]);

  const months = Array.from({ length: 12 }, (v, i) => ({
    value: i + 1,
    name: new Date(0, i).toLocaleString("en-US", { month: "long" }),
  }));
  const years = Array.from(
    { length: 5 },
    (v, i) => new Date().getFullYear() - i
  );

  if (loading && libraryUsers.length === 0) {
    return (
      <div className='text-center p-12 text-lg font-medium'>
        Loading Library Analytics...
      </div>
    );
  }

  if (error) {
    return (
      <div className='text-center p-12 text-red-600 font-semibold'>
        Error: {error}
      </div>
    );
  }

  return (
    <div className='bg-slate-100 min-h-screen py-8'>
      <div className='container mx-auto px-4'>
        <h1 className='text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3'>
          <Library className='h-8 w-8 text-indigo-600' />
          Analytics for {libraryName}
        </h1>
        <p className='text-lg text-slate-600 mb-6'>
          Overview of users onboarded through this library and their test
          activity.
        </p>

        <div className='bg-white p-6 rounded-2xl shadow-lg border mb-6'>
          <h2 className='text-xl font-bold text-slate-800 mb-4'>
            Filter by Month
          </h2>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <div>
              <label
                htmlFor='month-select'
                className='block text-sm font-medium text-slate-700'
              >
                Month
              </label>
              <select
                id='month-select'
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className='mt-1 block w-full p-2 border text-slate-900 border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500'
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
                className='block text-sm font-medium text-slate-700'
              >
                Year
              </label>
              <select
                id='year-select'
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className='mt-1 block w-full p-2 border text-slate-900 border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500'
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
            Onboarded Users ({displayedUsers.length})
          </h2>
          {displayedUsers.length > 0 ? (
            <div className='overflow-x-auto'>
              <table className='min-w-full divide-y divide-slate-200'>
                <thead className='bg-slate-50'>
                  <tr>
                    <th className='px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider'>
                      User Name
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider'>
                      Email
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider'>
                      Tests Taken (Selected Month)
                    </th>
                  </tr>
                </thead>
                <tbody className='bg-white divide-y divide-slate-200'>
                  {displayedUsers.map((user) => (
                    <tr key={user.uid}>
                      <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900'>
                        <div className='flex items-center'>
                          <User className='h-4 w-4 mr-2 text-slate-500' />
                          {user.name}
                        </div>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-indigo-600'>
                        {user.email}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-slate-800 font-semibold'>
                        <div className='flex items-center'>
                          <FileText className='h-4 w-4 mr-2 text-green-500' />
                          {user.testsTaken}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className='text-center py-12'>
              <User className='mx-auto h-12 w-12 text-slate-400' />
              <h3 className='mt-2 text-lg font-semibold text-slate-900'>
                No users onboarded through this library yet.
              </h3>
              <p className='mt-1 text-sm text-slate-500'>
                Share the join link or QR code to onboard students.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
