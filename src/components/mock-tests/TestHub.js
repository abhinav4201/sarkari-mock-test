// src/components/mock-tests/TestHub.js

"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  startAfter,
} from "firebase/firestore";
import toast from "react-hot-toast";
import TestCard from "./TestCard";
import { Search, History, Heart, CheckCircle } from "lucide-react";

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
      const queryConstraints = [orderBy("createdAt", "desc"), limit(PAGE_SIZE)];

      if (tab === "all") {
        if (loadMore && lastDoc) queryConstraints.push(startAfter(lastDoc));
        q = query(collectionRef, ...queryConstraints);
      } else if (tab === "created" && user) {
        queryConstraints.unshift(where("createdBy", "==", user.uid));
        if (loadMore && lastDoc) queryConstraints.push(startAfter(lastDoc));
        q = query(collectionRef, ...queryConstraints);
      } else if (tab === "favorites" && user) {
        if (!favoriteTests || favoriteTests.length === 0) {
          setTests([]);
          setLoading(false);
          return;
        }
        q = query(
          collectionRef,
          where("__name__", "in", favoriteTests.slice(0, 10))
        );
      } else {
        setLoading(false);
        setLoadingMore(false);
        return;
      }

      try {
        const snapshot = await getDocs(q);
        const newTests = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setHasMore(newTests.length === PAGE_SIZE && tab !== "favorites");
        setLastDoc(snapshot.docs[snapshot.docs.length - 1]);

        if (loadMore) {
          setTests((prev) => [...prev, ...newTests]);
        } else {
          setTests(newTests);
        }
      } catch (error) {
        toast.error(`Failed to load tests.`);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [user, lastDoc, hasMore, favoriteTests]
  );

  // --- THE useEffect FIX ---
  // This effect runs when the component first mounts and whenever the active tab changes.
  useEffect(() => {
    // We clear the tests and reset pagination state for a clean fetch.
    setTests([]);
    setLastDoc(null);
    setHasMore(true);
    fetchTests(activeTab, false);
  }, [activeTab]);

  const handleLoadMore = () => {
    fetchTests(activeTab, true);
  };

  const filteredTests = useMemo(() => {
    return tests.filter((test) => {
      const isVisible =
        test.status === "approved" || typeof test.status === "undefined";
      if (!isVisible) return false;
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
      const resultsQuery = query(
        collection(db, "mockTestResults"),
        where("userId", "==", user.uid)
      );
      getDocs(resultsQuery).then((snapshot) => {
        setTakenTestIds(new Set(snapshot.docs.map((doc) => doc.data().testId)));
      });
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
