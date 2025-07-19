"use client";

import UserTestHistoryModal from "@/components/admin/UserTestHistoryModal";
import AnalyticsStatCard from "@/components/dashboard/AnalyticsStatCard";
import Modal from "@/components/ui/Modal";
import { db } from "@/lib/firebase";
import {
  collection,
  deleteField,
  doc,
  getDoc,
  getDocs,
  query,
  Timestamp,
  updateDoc,
  where,
  limit,
  orderBy,
  startAfter,
} from "firebase/firestore";
import {
  FileText,
  History,
  IndianRupee,
  Library,
  User,
  XCircle,
} from "lucide-react";
import { notFound, useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

const PAGE_SIZE = 10;

export default function LibraryAnalyticsPage() {
  const params = useParams();
  const libraryId = params.libraryId;

  const [libraryDetails, setLibraryDetails] = useState(null);
  const [allLibraryUsers, setAllLibraryUsers] = useState([]);
  const [removedLibraryUsers, setRemovedLibraryUsers] = useState([]);
  const [displayedUsers, setDisplayedUsers] = useState([]);
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

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [userToRemove, setUserToRemove] = useState(null);

  // --- ADDED FOR PAGINATION ---
  // Function to fetch the next page of users
  const fetchNextPage = useCallback(async () => {
    if (!hasMore) return;

    setLoading(true);
    try {
      const usersQuery = query(
        collection(db, "users"),
        where("libraryId", "==", libraryId),
        where("role", "==", "library-student"),
        orderBy("name"), // Order by name for consistent pagination
        startAfter(lastDoc),
        limit(PAGE_SIZE)
      );

      const usersSnapshot = await getDocs(usersQuery);
      const newUsers = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setDisplayedUsers((prev) => [...prev, ...newUsers]);
      setLastDoc(usersSnapshot.docs[usersSnapshot.docs.length - 1] || null);
      setHasMore(newUsers.length === PAGE_SIZE);
    } catch (err) {
      console.error("Error fetching next page:", err);
      toast.error("Failed to load more users.");
    } finally {
      setLoading(false);
    }
  }, [lastDoc, hasMore, libraryId]);

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
        where("role", "==", "library-student"),
        orderBy("name"), // --- ADDED FOR PAGINATION --- Ensure consistent ordering
        limit(PAGE_SIZE) // --- ADDED FOR PAGINATION --- Limit initial fetch
      );

      const [librarySnap, usersSnapshot] = await Promise.all([
        getDoc(libraryRef),
        getDocs(usersQuery),
      ]);

      if (!librarySnap.exists()) {
        notFound();
      }
      const libData = librarySnap.data();
      setLibraryDetails(libData);

      const usersData = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const activeUsers = usersData.filter(
        (user) =>
          user.libraryId === libraryId && user.role === "library-student"
      );
      setAllLibraryUsers(activeUsers);
      setDisplayedUsers(activeUsers); // --- MODIFIED FOR PAGINATION --- Set initial page
      setLastDoc(usersSnapshot.docs[usersSnapshot.docs.length - 1] || null); // --- ADDED FOR PAGINATION ---
      setHasMore(usersSnapshot.size === PAGE_SIZE); // --- ADDED FOR PAGINATION ---

      const removedUsers = usersData.filter(
        (user) =>
          user.removedLibraryAssociations &&
          user.removedLibraryAssociations.some(
            (assoc) => assoc.libraryId === libraryId
          )
      );
      setRemovedLibraryUsers(removedUsers);

      // 2. Decide Calculation Strategy ("Plan A" vs "Plan B")
      const commission = libData.commissionPerTest || 0;
      const allUserUids = usersData.map((user) => user.uid);

      if (libData.testCompletions) {
        // --- PLAN A: New, efficient method from denormalized data ---
        const completions = libData.testCompletions || [];
        const activeUserCompletions = completions.filter((c) =>
          activeUsers.some((au) => au.uid === c.takerId)
        );
        setTotalEarnings(activeUserCompletions.length * commission);

        const monthlyCompletions = activeUserCompletions.filter((c) => {
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
          where("libraryId", "==", libraryId),
          where("userId", "in", allUserUids)
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
          where("completedAt", "<=", endDate),
          where("userId", "in", allUserUids)
        );
        const monthlyResultsSnap = await getDocs(monthlyResultsQuery);

        const counts = {};
        monthlyResultsSnap.forEach((doc) => {
          const userId = doc.data().userId;
          counts[userId] = (counts[userId] || 0) + 1;
        });
        setMonthlyTestCounts(counts);
      } else {
        setTotalEarnings(0);
        setMonthlyTestCounts({});
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

  const handleRemoveClick = (userId, userName) => {
    setUserToRemove({ id: userId, name: userName });
    setIsConfirmModalOpen(true);
  };

  const confirmAndRemoveUser = async () => {
    if (!userToRemove) return;

    const { id: userId, name: userName } = userToRemove;

    setIsConfirmModalOpen(false);
    toast.loading(`Removing ${userName}...`);

    try {
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        toast.error("User not found.");
        return;
      }

      const userData = userSnap.data();
      const currentLibraryId = userData.libraryId;
      const currentOwnerId = userData.ownerId;

      const associationToRemove = {};
      if (currentLibraryId) associationToRemove.libraryId = currentLibraryId;
      if (currentOwnerId) associationToRemove.ownerId = currentOwnerId;
      associationToRemove.removedAt = serverTimestamp();

      const updatePayload = {
        role: "regular",
        premiumAccessExpires: deleteField(),
        removedLibraryAssociations: arrayUnion(associationToRemove),
      };

      if (userData.libraryId) {
        updatePayload.libraryId = deleteField();
      }
      if (userData.ownerId) {
        updatePayload.ownerId = deleteField();
      }

      await updateDoc(userRef, updatePayload);

      setAllLibraryUsers((prev) => prev.filter((user) => user.uid !== userId));
      setDisplayedUsers((prev) => prev.filter((user) => user.uid !== userId));
      await fetchAndProcessData();

      toast.dismiss();
      toast.success(`${userName} has been removed and premium access revoked.`);
    } catch (error) {
      toast.dismiss();
      console.error("Error removing user:", error);
      toast.error("Failed to remove user. Please try again.");
    } finally {
      setUserToRemove(null);
    }
  };

  const finalDisplayedUsers = useMemo(() => {
    return displayedUsers.map((user) => ({
      ...user,
      testsTaken: monthlyTestCounts[user.uid] || 0,
    }));
  }, [displayedUsers, monthlyTestCounts]);

  const finalRemovedUsers = useMemo(() => {
    return removedLibraryUsers.map((user) => ({
      ...user,
    }));
  }, [removedLibraryUsers]);

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
              Active Onboarded Users
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
                      <th className='px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider'>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className='bg-white divide-y divide-slate-200'>
                    {finalDisplayedUsers.map((student) => {
                      const limit = libraryDetails.monthlyTestLimit || 0;
                      const taken = student.testsTaken;
                      const remaining = limit - taken;
                      const usagePercentage = limit > 0 ? taken / limit : 0;
                      let statusColorClass = "text-green-600";

                      if (usagePercentage >= 0.9) {
                        statusColorClass = "text-red-600";
                      } else if (usagePercentage >= 0.7) {
                        statusColorClass = "text-amber-600";
                      }

                      return (
                        <tr key={student.uid} className='hover:bg-slate-50'>
                          <td
                            onClick={() => handleUserClick(student)}
                            className='px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 cursor-pointer'
                          >
                            {student.name}
                          </td>
                          <td
                            onClick={() => handleUserClick(student)}
                            className='px-6 py-4 whitespace-nowrap text-sm text-slate-600 cursor-pointer'
                          >
                            {student.email}
                          </td>
                          <td
                            onClick={() => handleUserClick(student)}
                            className='px-6 py-4 whitespace-nowrap text-sm text-slate-800 font-semibold cursor-pointer'
                          >
                            <span className={statusColorClass}>{taken}</span>
                          </td>
                          <td
                            onClick={() => handleUserClick(student)}
                            className='px-6 py-4 whitespace-nowrap text-sm font-semibold cursor-pointer'
                          >
                            {limit > 0 ? (
                              <span className={statusColorClass}>
                                {remaining < 0 ? 0 : remaining} / {limit}
                              </span>
                            ) : (
                              <span className='text-indigo-600'>Unlimited</span>
                            )}
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap text-center text-sm font-medium'>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveClick(student.uid, student.name);
                              }}
                              className='inline-flex items-center gap-2 text-red-600 hover:text-red-800 transition-colors'
                              title={`Remove ${student.name}`}
                            >
                              <XCircle className='h-4 w-4' />
                              Remove
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {/* --- ADDED FOR PAGINATION --- Load More Button */}
                {hasMore && (
                  <div className='mt-6 text-center'>
                    <button
                      onClick={fetchNextPage}
                      disabled={loading}
                      className={`px-5 py-2 font-semibold rounded-lg transition-colors ${
                        loading
                          ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                          : "bg-indigo-600 text-white hover:bg-indigo-700"
                      }`}
                    >
                      {loading ? "Loading..." : "Load More Users"}
                    </button>
                  </div>
                )}
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
          <div className='bg-white p-6 rounded-2xl shadow-lg border'>
            <h2 className='text-xl font-bold text-slate-800 mb-4 flex items-center gap-2'>
              <History className='h-6 w-6 text-slate-600' />
              Previously Onboarded (Removed) Users
            </h2>
            {finalRemovedUsers.length > 0 ? (
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
                        Date Removed
                      </th>
                    </tr>
                  </thead>
                  <tbody className='bg-white divide-y divide-slate-200'>
                    {finalRemovedUsers.map((student) => {
                      const removalEntry =
                        student.removedLibraryAssociations.find(
                          (assoc) => assoc.libraryId === libraryId
                        );
                      const removedDate =
                        removalEntry?.removedAt
                          ?.toDate()
                          .toLocaleDateString() || "N/A";

                      return (
                        <tr key={student.uid} className='hover:bg-slate-50'>
                          <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900'>
                            {student.name}
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap text-sm text-slate-600'>
                            {student.email}
                          </td>
                          <td className='px-6 py-4 whitespace-nowrap text-sm text-slate-600'>
                            {removedDate}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className='text-center py-8'>
                <User className='mx-auto h-10 w-10 text-slate-400' />
                <p className='mt-2 text-md text-slate-500'>
                  No users have been removed from this library yet.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title='Confirm User Removal'
        size='md'
      >
        <div>
          <p className='text-slate-700 text-base'>
            Are you sure you want to remove{" "}
            <span className='font-bold text-slate-900'>
              {userToRemove?.name}
            </span>
            ?
          </p>
          <p className='mt-2 text-sm text-slate-500'>
            Their role will be reverted to 'regular', and they will lose all
            library-associated access. This action cannot be undone.
          </p>
        </div>
        <div className='mt-6 flex justify-end gap-3'>
          <button
            onClick={() => setIsConfirmModalOpen(false)}
            className='px-5 py-2 bg-slate-100 text-slate-800 font-semibold rounded-lg hover:bg-slate-200 transition-colors'
          >
            Cancel
          </button>
          <button
            onClick={confirmAndRemoveUser}
            className='px-5 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors'
          >
            Remove User
          </button>
        </div>
      </Modal>
    </>
  );
}
