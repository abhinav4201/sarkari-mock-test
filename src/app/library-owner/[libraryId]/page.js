// src/app/library-owner/[libraryId]/page.js
"use client";

import UserTestHistoryModal from "@/components/library-owner/UserTestHistoryModal";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
} from "firebase/firestore";
import { Library, User } from "lucide-react";
import { notFound, useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

const PAGE_SIZE = 10;

export default function LibraryOwnerAnalyticsPage() {
  const params = useParams();
  const libraryId = params.libraryId;
  const {
    user,
    loading: authLoading,
    isLibraryOwner,
    ownedLibraryIds,
  } = useAuth();

  // --- DEBUGGING: Log initial auth state ---
  console.log("%c[Auth State]", "color: orange; font-weight: bold;", {
    user: user?.email,
    authLoading,
    isLibraryOwner,
    ownedLibraryIds,
    libraryId,
  });

  const [libraryName, setLibraryName] = useState("Loading Library...");
  const [onboardedUsers, setOnboardedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [isUserHistoryModalOpen, setIsUserHistoryModalOpen] = useState(false);
  const [selectedUserForHistory, setSelectedUserForHistory] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    // --- DEBUGGING: Log inside the main useEffect ---
    console.log("%c[Effect Triggered]", "color: cyan;");

    if (authLoading) {
      console.log(
        "%c[Effect] Waiting for auth to finish loading...",
        "color: gray;"
      );
      return;
    }

    const isAuthorizedOwner =
      isLibraryOwner && ownedLibraryIds.includes(libraryId);
    const isAdminUser =
      user && user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;

    // --- DEBUGGING: Log authorization check results ---
    console.log("%c[Authorization Check]", "color: blue; font-weight: bold;", {
      isAuthorizedOwner,
      isAdminUser,
    });

    if (!isAdminUser && !isAuthorizedOwner) {
      const errorMessage =
        "Access Denied: You do not have permission to view this library's analytics.";
      console.error(errorMessage);
      setError(errorMessage);
      setLoading(false);
      return;
    }

    console.log(
      "%c[Authorization Check] Access granted. Fetching users...",
      "color: green;"
    );
    fetchLibraryUsers(false);
  }, [libraryId, user, authLoading, isLibraryOwner, ownedLibraryIds]);

  const fetchLibraryUsers = useCallback(
    async (loadMore = false) => {
      // --- DEBUGGING: Log when fetch starts ---
      console.log(
        `%c[fetchLibraryUsers] Called with loadMore: ${loadMore}`,
        "color: purple;"
      );

      setLoading(true);
      setError(null);
      try {
        const libraryRef = doc(db, "libraries", libraryId);
        const librarySnap = await getDoc(libraryRef);
        if (!librarySnap.exists()) {
          notFound();
        }
        setLibraryName(librarySnap.data().libraryName);

        const libraryUsersCollection = collection(db, "libraryUsers");
        let libraryUsersQueryConstraints = [
          where("libraryId", "==", libraryId),
          orderBy("createdAt", "desc"),
          limit(PAGE_SIZE),
        ];

        if (loadMore && lastDoc) {
          libraryUsersQueryConstraints.push(startAfter(lastDoc));
        }

        const libraryUsersQuery = query(
          libraryUsersCollection,
          ...libraryUsersQueryConstraints
        );

        // --- DEBUGGING: Log the actual query being sent ---
        console.log(
          "%c[Firestore Query]",
          "color: brown;",
          libraryUsersQueryConstraints
        );

        const libraryUsersSnapshot = await getDocs(libraryUsersQuery);

        const newUsersData = libraryUsersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // --- DEBUGGING: Log fetched data ---
        console.log(
          `%c[fetchLibraryUsers] Fetched ${newUsersData.length} users.`,
          "color: purple;",
          newUsersData
        );

        setOnboardedUsers((prev) =>
          loadMore ? [...prev, ...newUsersData] : newUsersData
        );

        setLastDoc(
          libraryUsersSnapshot.docs[libraryUsersSnapshot.docs.length - 1]
        );
        setHasMore(newUsersData.length === PAGE_SIZE);
      } catch (err) {
        // --- DEBUGGING: Log the exact error from Firestore ---
        console.error("%c[FETCH ERROR]", "color: red; font-weight: bold;", err);
        setError(
          "Failed to load library users. Please check your permissions and network connection."
        );
        toast.error("Failed to load library users.");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [libraryId, lastDoc, hasMore]
  );

  // ... rest of the component remains the same
  // ...

  const handleLoadMoreUsers = () => {
    setLoadingMore(true);
    fetchLibraryUsers(true);
  };

  const handleUserClick = (user) => {
    setSelectedUserForHistory(user);
    setIsUserHistoryModalOpen(true);
  };

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
    <>
      <UserTestHistoryModal
        isOpen={isUserHistoryModalOpen}
        onClose={() => setIsUserHistoryModalOpen(false)}
        userId={selectedUserForHistory?.uid}
        userName={selectedUserForHistory?.name}
        libraryId={libraryId}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
      />

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
              Filter Student Activity
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
                  className='mt-1 block w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500'
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
                  className='mt-1 block w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500'
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
                        User Name
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider'>
                        Email
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider'>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className='bg-white divide-y divide-slate-200'>
                    {onboardedUsers.map((user) => (
                      <tr
                        key={user.uid}
                        className='hover:bg-slate-50 cursor-pointer'
                        onClick={() => handleUserClick(user)}
                      >
                        <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900'>
                          <div className='flex items-center'>
                            <User className='h-4 w-4 mr-2 text-slate-500' />
                            {user.name}
                          </div>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-indigo-600'>
                          {user.email}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm'>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUserClick(user);
                            }}
                            className='px-3 py-1 bg-indigo-100 text-indigo-700 rounded-md text-xs font-semibold hover:bg-indigo-200'
                          >
                            View Tests
                          </button>
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

            {hasMore && (
              <div className='text-center mt-6'>
                <button
                  onClick={handleLoadMoreUsers}
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
    </>
  );
}
