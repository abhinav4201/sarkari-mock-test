"use client";

import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { getCachedTests } from "@/lib/indexedDb"; // Import the new function
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
} from "firebase/firestore";
import { CheckCircle, Heart, History, Search } from "lucide-react";
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
  const { user, favoriteTests } = useAuth();
  const [activeTab, setActiveTab] = useState("all");
  const [tests, setTests] = useState(initialTests);
  const [searchTerm, setSearchTerm] = useState("");
  const [isOffline, setIsOffline] = useState(false);

  const [loading, setLoading] = useState(false); // No initial loading as we have server data
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(initialTests.length === PAGE_SIZE);

  const fetchTests = useCallback(
    async (tab, loadMore = false) => {
      if (loadMore && !hasMore) return;
      loadMore ? setLoadingMore(true) : setLoading(true);

      try {
        // --- ONLINE LOGIC ---
        if (!navigator.onLine) {
          throw new Error("Offline");
        }

        let q;
        const collectionRef = collection(db, "mockTests");
        const queryConstraints = [orderBy("createdAt", "desc")];

        // (Your existing query logic for different tabs remains the same)
        if (tab === "favorites" && user) {
          if (!favoriteTests || favoriteTests.length === 0) {
            setTests([]);
            setLoading(false);
            setLoadingMore(false);
            setHasMore(false);
            return;
          }
          queryConstraints.push(
            where("__name__", "in", favoriteTests.slice(0, 10))
          );
          setHasMore(false);
        } else if (tab === "created" && user) {
          queryConstraints.unshift(where("createdBy", "==", user.uid));
        }

        if (tab !== "favorites") {
          if (loadMore && lastDoc) {
            queryConstraints.push(startAfter(lastDoc));
          }
          queryConstraints.push(limit(PAGE_SIZE));
        }

        q = query(collectionRef, ...queryConstraints);
        const snapshot = await getDocs(q);
        const newTests = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toMillis() || null,
        }));

        setIsOffline(false);
        setTests(loadMore ? (prev) => [...prev, ...newTests] : newTests);
        if (tab !== "favorites") {
          setHasMore(newTests.length === PAGE_SIZE);
          setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
        }
      } catch (error) {
        // --- OFFLINE FALLBACK LOGIC ---
        console.warn(
          "Could not fetch from server, trying offline.",
          error.message
        );
        try {
          const cachedTests = await getCachedTests();
          if (cachedTests.length > 0) {
            setTests(cachedTests);
            setHasMore(false);
            setIsOffline(true);
            toast.success("Displaying tests from your offline library.");
          } else {
            toast.error(
              "You are offline. No tests were saved for traveling mode."
            );
          }
        } catch (dbError) {
          toast.error("Could not load tests from the offline cache.");
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [user, lastDoc, hasMore, favoriteTests]
  );

  // (The rest of the component remains largely the same)
  // ... useEffect, handleLoadMore, filteredTests, takenTestIds ...

  useEffect(() => {
    if (user || activeTab === "all") {
      setTests([]);
      setLastDoc(null);
      setHasMore(true);
      fetchTests(activeTab, false);
    }
  }, [activeTab, user, fetchTests]);

  const handleLoadMore = () => {
    fetchTests(activeTab, true);
  };

  const filteredTests = useMemo(() => {
    return tests.filter((test) =>
      searchTerm
        ? (test.title?.toLowerCase() || "").includes(
            searchTerm.toLowerCase()
          ) ||
          (test.topic?.toLowerCase() || "").includes(searchTerm.toLowerCase())
        : true
    );
  }, [tests, searchTerm]);

  const [takenTestIds, setTakenTestIds] = useState(new Set());
  useEffect(() => {
    if (user) {
      const resultsQuery = query(
        collection(db, "mockTestResults"),
        where("userId", "==", user.uid)
      );
      getDocs(resultsQuery).then((snapshot) => {
        setTakenTestIds(new Set(snapshot.docs.map((doc) => doc.data().testId)));
      });
    } else {
      setTakenTestIds(new Set());
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

      {isOffline && (
        <div className='p-4 mb-8 bg-amber-50 border-2 border-amber-200 rounded-lg flex items-center gap-4'>
          <WifiOff className='h-8 w-8 text-amber-600 flex-shrink-0' />
          <div>
            <h3 className='font-bold text-amber-800'>
              You are in Offline Mode
            </h3>
            <p className='text-sm text-amber-700 mt-1'>
              Showing tests saved for Traveling Mode. Your results will be
              synced when you reconnect.
            </p>
          </div>
        </div>
      )}

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
              />
            ))}
          </div>
          {hasMore && !isOffline && (
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
