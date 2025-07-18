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
  orderBy,
  limit,
  startAfter,
} from "firebase/firestore";
import toast from "react-hot-toast";
import { Library, User, FileText, IndianRupee, Banknote } from "lucide-react";
import AnalyticsStatCard from "@/components/dashboard/AnalyticsStatCard";
import UserTestHistoryModal from "@/components/admin/UserTestHistoryModal";

const PAGE_SIZE = 10;

export default function LibraryAnalyticsPage() {
  const params = useParams();
  const libraryId = params.libraryId;

  const [libraryDetails, setLibraryDetails] = useState(null);
  const [allLibraryUsers, setAllLibraryUsers] = useState([]); // Holds all users for this library
  const [displayedUsers, setDisplayedUsers] = useState([]); // Paginated users for display
  const [monthlyTestCounts, setMonthlyTestCounts] = useState({});
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // --- THIS IS THE COMBINED AND CORRECTED DATA FETCHING LOGIC ---
  const fetchAndProcessData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Core Library and All User Data
      const libraryRef = doc(db, "libraries", libraryId);
      const usersQuery = query(
        collection(db, "users"),
        where("libraryId", "==", libraryId),
        where("role", "==", "library-student")
      );

      const [librarySnap, usersSnapshot] = await Promise.all([
        getDoc(libraryRef),
        getDocs(usersQuery),
      ]);

      if (!librarySnap.exists()) {
        notFound();
        return;
      }
      const libData = librarySnap.data();
      setLibraryDetails(libData);

      const usersData = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAllLibraryUsers(usersData);
      setDisplayedUsers(usersData.slice(0, PAGE_SIZE)); // Set initial page

      // 2. Decide Calculation Strategy ("Plan A" vs "Plan B")
      const commission = libData.commissionPerTest || 0;
      const allUserUids = usersData.map((user) => user.uid);

      if (libData.testCompletions) {
        // --- PLAN A: New, efficient method from denormalized data ---
        const completions = libData.testCompletions || [];
        setTotalEarnings(completions.length * commission);

        const monthlyCompletions = completions.filter((c) => {
          if (!c.completedAt) return false;
          const date = c.completedAt.toDate();
          return (
            date.getFullYear() === selectedYear &&
            date.getMonth() + 1 === selectedMonth
          );
        });

        const counts = {};
        monthlyCompletions.forEach((c) => {
          counts[c.takerId] = (counts[c.takerId] || 0) + 1;
        });
        setMonthlyTestCounts(counts);
      } else if (allUserUids.length > 0) {
        // --- PLAN B: Backward compatibility for old data by querying results ---
        const allResultsQuery = query(
          collection(db, "mockTestResults"),
          where("libraryId", "==", libraryId)
        );
        const allResultsSnap = await getDocs(allResultsQuery);
        setTotalEarnings(allResultsSnap.size * commission);

        const startDate = Timestamp.fromDate(
          new Date(selectedYear, selectedMonth - 1, 1)
        );
        const endDate = Timestamp.fromDate(
          new Date(selectedYear, selectedMonth, 0, 23, 59, 59)
        );

        const monthlyResultsQuery = query(
          collection(db, "mockTestResults"),
          where("libraryId", "==", libraryId),
          where("completedAt", ">=", startDate),
          where("completedAt", "<=", endDate)
        );
        const monthlyResultsSnap = await getDocs(monthlyResultsQuery);

        const counts = {};
        monthlyResultsSnap.forEach((doc) => {
          const userId = doc.data().userId;
          counts[userId] = (counts[userId] || 0) + 1;
        });
        setMonthlyTestCounts(counts);
      }
    } catch (err) {
      console.error("Error fetching library analytics:", err);
      setError("Failed to load analytics data.");
      toast.error("Failed to load analytics data.");
    } finally {
      setLoading(false);
    }
  }, [libraryId, selectedMonth, selectedYear]);

  useEffect(() => {
    fetchAndProcessData();
  }, [fetchAndProcessData]);

  const handleUserClick = (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const finalDisplayedUsers = useMemo(() => {
    return displayedUsers.map((user) => ({
      ...user,
      testsTaken: monthlyTestCounts[user.uid] || 0,
    }));
  }, [displayedUsers, monthlyTestCounts]);

  // Months and years arrays remain the same...
  const months = Array.from({ length: 12 }, (v, i) => ({
    value: i + 1,
    name: new Date(0, i).toLocaleString("en-US", { month: "long" }),
  }));
  const years = Array.from(
    { length: 5 },
    (v, i) => new Date().getFullYear() - i
  );

  if (loading) {
    return (
      <div className='text-center p-12 text-lg font-medium'>
        Loading Library Analytics...
      </div>
    );
  }

  return (
    <>
      <UserTestHistoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userId={selectedUser?.uid}
        userName={selectedUser?.name}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
      />
      <div className='bg-slate-100 min-h-screen py-8'>
        <div className='container mx-auto px-4'>
          <h1 className='text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3'>
            <Library className='h-8 w-8 text-indigo-600' />
            Analytics for {libraryDetails?.libraryName || "..."}
          </h1>
          <p className='text-lg text-slate-600 mb-6'>
            Overview of users and earnings for this library partner.
          </p>

          <div className='mb-6 grid grid-cols-1 md:grid-cols-3 gap-6'>
            <AnalyticsStatCard
              title='Total Onboarded Students'
              value={allLibraryUsers.length}
              icon={<User />}
              isLoading={loading}
            />
            <AnalyticsStatCard
              title='Total Gross Earnings'
              value={`₹${totalEarnings.toLocaleString()}`}
              icon={<IndianRupee />}
              isLoading={loading}
            />
            <AnalyticsStatCard
              title='Tests Taken This Month'
              value={Object.values(monthlyTestCounts).reduce(
                (a, b) => a + b,
                0
              )}
              icon={<FileText />}
              isLoading={loading}
            />
          </div>

          <div className='bg-white p-6 rounded-2xl shadow-lg border mb-6'>
            <h2 className='text-xl font-bold text-slate-800 mb-4'>
              Filter Activity by Month
            </h2>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              {/* Month and Year Selectors */}
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
              Onboarded Users
            </h2>
            {finalDisplayedUsers.length > 0 ? (
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
                        Tests Taken (Selected Month)
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider'>
                        Remaining Tests
                      </th>
                    </tr>
                  </thead>
                  <tbody className='bg-white divide-y divide-slate-200'>
                    {finalDisplayedUsers.map((student) => {
                      const limit = libraryDetails.monthlyTestLimit || 0;
                      const taken = student.testsTaken;
                      const remaining = limit - taken;
                      return (
                        <tr
                          key={student.uid}
                          onClick={() => handleUserClick(student)}
                          className='cursor-pointer hover:bg-slate-50'
                        >
                          <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900'>
                            {student.name}
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap text-sm text-slate-600'>
                            {student.email}
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap text-sm text-slate-800 font-semibold'>
                            {taken}
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
                  No users onboarded through this library yet.
                </h3>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
