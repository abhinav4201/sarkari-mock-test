// src/components/mock-tests/TestHub.js

"use client";

import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
} from "firebase/firestore";
import { CheckCircle, Heart, History, Search, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import TestCard from "./TestCard";

const PAGE_SIZE = 9;

const TabButton = ({ label, icon, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-md transition-all ${
      isActive
        ? "bg-indigo-600 text-white shadow-md"
        : "bg-slate-200 text-slate-700 hover:bg-slate-300"
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

export default function TestHub({ initialTests }) {
  const { user, favoriteTests, userProfile } = useAuth(); // Using userProfile for role check
  const [activeTab, setActiveTab] = useState("all");
  const [tests, setTests] = useState(initialTests);
  const [searchTerm, setSearchTerm] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(initialTests.length === PAGE_SIZE);

  const fetchTests = useCallback(
    async (tab, loadMore = false) => {
      if (loadMore && !hasMore) return;

      loadMore ? setLoadingMore(true) : setLoading(true);

      let q;
      const collectionRef = collection(db, "mockTests");
      const queryConstraints = [orderBy("createdAt", "desc")]; // Base orderBy for all tabs

      // Apply specific filters based on the active tab
      if (tab === "all") {
        // For 'all' tab, no specific 'where' clause here; rules handle visibility.
      } else if (tab === "created" && user) {
        queryConstraints.unshift(where("createdBy", "==", user.uid)); // Add where clause to the beginning
      } else if (tab === "favorites" && user) {
        if (!favoriteTests || favoriteTests.length === 0) {
          setTests([]);
          setLoading(false);
          setLoadingMore(false);
          setHasMore(false);
          return;
        }
        // For favorites, fetch by ID. Firestore 'in' query limit is 10.
        queryConstraints.push(
          where("__name__", "in", favoriteTests.slice(0, 10))
        );
        setHasMore(false); // Favorites tab does not typically paginate, loads all specified favorites
      } else {
        // If tab is 'created' or 'favorites' but user is not logged in, or invalid tab
        setTests([]);
        setLoading(false);
        setLoadingMore(false);
        setHasMore(false);
        return;
      }

      // Add pagination constraints for 'all' and 'created' tabs
      if (tab !== "favorites") {
        if (loadMore && lastDoc) {
          queryConstraints.push(startAfter(lastDoc));
        }
        queryConstraints.push(limit(PAGE_SIZE));
      }

      q = query(collectionRef, ...queryConstraints);

      try {
        const snapshot = await getDocs(q);
        const newTests = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toMillis() || null, // Ensure serializable
        }));

        // Update pagination state based on snapshot size
        if (tab !== "favorites") {
          setHasMore(newTests.length === PAGE_SIZE);
          setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
        }

        if (loadMore) {
          setTests((prev) => [...prev, ...newTests]);
        } else {
          setTests(newTests);
        }
      } catch (error) {
        console.error("Firebase fetchTests error:", error);
        toast.error(`Failed to load tests: ${error.message}`);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [user, lastDoc, hasMore, favoriteTests]
  );

  useEffect(() => {
    // Only fetch if user is defined (for user-specific tabs) or if it's the 'all' tab.
    // The `user` dependency ensures this runs when auth state changes.
    if (user || activeTab === "all") {
      setTests([]); // Clear tests before new fetch
      setLastDoc(null); // Reset pagination
      setHasMore(true); // Assume there's more until proven otherwise
      fetchTests(activeTab, false);
    }
  }, [activeTab, user]); // Added fetchTests as dependency

  const handleLoadMore = () => {
    fetchTests(activeTab, true);
  };

  const filteredTests = useMemo(() => {
    // Client-side filtering based on search term
    return tests.filter((test) => {
      const matchesSearch = searchTerm
        ? (test.title?.toLowerCase() || "").includes(
            searchTerm.toLowerCase()
          ) ||
          (test.topic?.toLowerCase() || "").includes(searchTerm.toLowerCase())
        : true;
      return matchesSearch;
    });
  }, [tests, searchTerm]);

  const [takenTestIds, setTakenTestIds] = useState(new Set());
  useEffect(() => {
    if (user) {
      // Fetch only test IDs from mockTestResults
      const resultsQuery = query(
        collection(db, "mockTestResults"),
        where("userId", "==", user.uid)
      );
      getDocs(resultsQuery)
        .then((snapshot) => {
          setTakenTestIds(
            new Set(snapshot.docs.map((doc) => doc.data().testId))
          );
        })
        .catch((error) => {
          console.error("Error fetching taken test IDs:", error);
        });
    } else {
      setTakenTestIds(new Set()); // Clear if user logs out
    }
  }, [user]);

  return (
    <div>
      <div className='mb-8 max-w-2xl mx-auto'>
        <div className='relative'>
          <Search className='absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400' />
          <input
            type='text'
            placeholder='Search tests by title or topic...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className='w-full p-4 pl-12 text-slate-950 bg-white border-2 border-slate-200 rounded-full shadow-inner focus:ring-2 focus:ring-indigo-500 transition text-lg'
          />
        </div>
      </div>

      <div className='flex flex-col sm:flex-row gap-2 mb-8 p-2 bg-slate-100 rounded-lg'>
        <TabButton
          label='All Tests'
          icon={<CheckCircle size={16} />}
          isActive={activeTab === "all"}
          onClick={() => setActiveTab("all")}
        />
        {user && (
          <>
            <TabButton
              label='My Created Tests'
              icon={<History size={16} />}
              isActive={activeTab === "created"}
              onClick={() => setActiveTab("created")}
            />
            <TabButton
              label='My Favorites'
              icon={<Heart size={16} />}
              isActive={activeTab === "favorites"}
              onClick={() => setActiveTab("favorites")}
            />
          </>
        )}
      </div>

      <div className='p-4 mb-8 bg-blue-50 border-2 border-blue-200 rounded-lg flex items-center gap-4'>
        <ShieldCheck className='h-10 w-10 text-blue-600 flex-shrink-0' />
        <div>
          <h3 className='font-bold text-blue-800'>
            AI-Powered Proctoring Enabled
          </h3>
          <p className='text-sm text-blue-700 mt-1'>
            To ensure a fair testing environment, all tests will be submitted
            automatically if you switch tabs or minimize the browser during the
            attempt.
          </p>
        </div>
      </div>

      {loading ? (
        <div className='text-center py-16'>Loading...</div>
      ) : filteredTests.length > 0 ? (
        <>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
            {filteredTests.map((test) => (
              <TestCard
                key={test.id}
                test={test}
                hasTaken={takenTestIds.has(test.id)}
                isLibraryUser={userProfile?.role === "library-student"}
              />
            ))}
          </div>
          {hasMore && (
            <div className='text-center mt-16'>
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className='px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400'
              >
                {loadingMore ? "Loading..." : "Load More"}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className='text-center py-16 px-6 bg-white rounded-2xl shadow-lg border'>
          <h3 className='text-2xl font-bold text-gray-800'>No Tests Found</h3>
          <p className='mt-2 text-gray-700'>
            There are no tests matching your current selection.
          </p>
        </div>
      )}
    </div>
  );
}
