// src/app/admin/libraries/analytics/[libraryId]/page.js
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
  limit,
  startAfter,
  orderBy, // NEW: Import orderBy for pagination
} from "firebase/firestore";
import toast from "react-hot-toast";
import { Library, User, FileText } from "lucide-react";

const PAGE_SIZE = 10; // Number of users to load per page

export default function LibraryAnalyticsPage() {
  const params = useParams();
  const libraryId = params.libraryId;

  const [libraryName, setLibraryName] = useState("Loading Library...");
  const [allLibraryUsers, setAllLibraryUsers] = useState([]); // All users for client-side filtering
//   const [displayUsers, setDisplayUsers] = useState([]); // Users currently displayed (paginated)
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false); // NEW: For pagination
  const [lastDoc, setLastDoc] = useState(null); // NEW: For pagination
  const [hasMore, setHasMore] = useState(true); // NEW: For pagination
  const [error, setError] = useState(null);

  // NEW: State for month filter
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // 1-indexed
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const fetchLibraryAnalytics = useCallback(
    async (loadMore = false) => {
      setLoading(true);
      setError(null);
      try {
        // 1. Fetch library details to get its name
        const libraryRef = doc(db, "libraries", libraryId);
        const librarySnap = await getDoc(libraryRef);
        if (!librarySnap.exists()) {
          notFound();
          return;
        }
        setLibraryName(librarySnap.data().libraryName);

        // 2. Fetch all users onboarded through this library (paginated)
        const libraryUsersCollection = collection(db, "libraryUsers");
        let libraryUsersQueryConstraints = [
          where("libraryId", "==", libraryId),
          orderBy("createdAt", "desc"), // Order by creation date for consistent pagination
          limit(PAGE_SIZE),
        ];

        if (loadMore && lastDoc) {
          libraryUsersQueryConstraints.push(startAfter(lastDoc));
        }

        const libraryUsersQuery = query(
          libraryUsersCollection,
          ...libraryUsersQueryConstraints
        );
        const libraryUsersSnapshot = await getDocs(libraryUsersQuery);

        const newUsersData = libraryUsersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Update allLibraryUsers for client-side filtering
        setAllLibraryUsers((prev) =>
          loadMore ? [...prev, ...newUsersData] : newUsersData
        );

        setLastDoc(
          libraryUsersSnapshot.docs[libraryUsersSnapshot.docs.length - 1]
        );
        setHasMore(newUsersData.length === PAGE_SIZE);
      } catch (err) {
        console.error("Error fetching library analytics:", err);
        setError("Failed to load analytics data.");
        toast.error("Failed to load analytics data.");
      } finally {
        setLoading(false);
        setLoadingMore(false); // Reset loadingMore
      }
    },
    [libraryId, lastDoc, hasMore]
  );

  useEffect(() => {
    if (libraryId) {
      fetchLibraryAnalytics(false); // Initial load
    }
  }, [libraryId]);

  // NEW: Memoize filtered and aggregated data for current month/year
  const filteredAndAggregatedUsers = useMemo(async () => {
    if (!allLibraryUsers.length) return [];

    const userUids = allLibraryUsers.map((user) => user.uid);
    const aggregatedData = {};

    // Calculate start and end of the selected month
    const startDate = new Date(selectedYear, selectedMonth - 1, 1);
    const endDate = new Date(selectedYear, selectedMonth, 0, 23, 59, 59);

    // Fetch all test results for all relevant users within the selected month
    // This part is still fetching all results for all users, then filtering by date.
    // For very large datasets, a Cloud Function for aggregation would be necessary.
    const allTestResults = [];
    // Chunk userUids for 'in' query limit (max 10)
    for (let i = 0; i < userUids.length; i += 10) {
      const chunk = userUids.slice(i, i + 10);
      const resultsQuery = query(
        collection(db, "mockTestResults"),
        where("userId", "in", chunk),
        where("completedAt", ">=", startDate),
        where("completedAt", "<=", endDate)
      );
      const resultsSnapshot = await getDocs(resultsQuery);
      resultsSnapshot.forEach((doc) => allTestResults.push(doc.data()));
    }

    // Aggregate test counts per user for the filtered results
    allTestResults.forEach((result) => {
      aggregatedData[result.userId] = (aggregatedData[result.userId] || 0) + 1;
    });

    // Combine user details with their aggregated test counts
    return allLibraryUsers.map((user) => ({
      uid: user.uid,
      name: user.name || "N/A",
      email: user.email || "N/A",
      testsTaken: aggregatedData[user.uid] || 0, // Tests taken in the selected month
    }));
  }, [allLibraryUsers, selectedMonth, selectedYear]);

  // Use another state to hold the resolved promise value
  const [displayedFilteredUsers, setDisplayedFilteredUsers] = useState([]);

  useEffect(() => {
    const updateDisplayedUsers = async () => {
      setDisplayedFilteredUsers(await filteredAndAggregatedUsers);
    };
    updateDisplayedUsers();
  }, [filteredAndAggregatedUsers]);

  const handleLoadMore = () => {
    setLoadingMore(true);
    fetchLibraryAnalytics(true);
  };

  const months = Array.from({ length: 12 }, (v, i) => ({
    value: i + 1,
    name: new Date(0, i).toLocaleString("en-US", { month: "long" }),
  }));
  const years = Array.from(
    { length: 5 },
    (v, i) => new Date().getFullYear() - i
  ); // Last 5 years

  if (loading) {
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

        {/* NEW: Month-wise filter */}
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
            Onboarded Users ({displayedFilteredUsers.length})
          </h2>
          {displayedFilteredUsers.length > 0 ? (
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
                  {displayedFilteredUsers.map((user) => (
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
                No users onboarded through this library yet or no tests taken in
                the selected month.
              </h3>
              <p className='mt-1 text-sm text-slate-500'>
                Share the join link or QR code to onboard students.
              </p>
            </div>
          )}

          {/* NEW: Pagination controls */}
          {hasMore && (
            <div className='text-center mt-6'>
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className='px-6 py-2 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300 disabled:opacity-50'
              >
                {loadingMore ? "Loading More..." : "Load More Users"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
