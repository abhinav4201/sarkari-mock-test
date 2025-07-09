"use client";

import { useState, useEffect, useCallback } from "react";
import MockTestManager from "@/components/admin/MockTestManager";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  orderBy,
  getDocs,
  limit,
  startAfter,
} from "firebase/firestore";
import toast from "react-hot-toast";
import Link from "next/link";
import { Plus, Settings } from "lucide-react";

const PAGE_SIZE = 10; // Number of tests to load at a time

const toSentenceCase = (str) => {
  if (!str || typeof str !== "string") return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export default function AdminMockTestsPage() {
  const [tests, setTests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const fetchTests = useCallback(
    async (loadMore = false) => {
      if (!loadMore) {
        setIsLoading(true);
        setTests([]); // Reset the list for a fresh fetch
        setLastDoc(null);
        setHasMore(true);
      } else {
        if (!hasMore || isLoadingMore) return;
        setIsLoadingMore(true);
      }

      try {
        const queryConstraints = [
          collection(db, "mockTests"),
          orderBy("createdAt", "desc"),
          limit(PAGE_SIZE),
        ];

        if (loadMore && lastDoc) {
          queryConstraints.push(startAfter(lastDoc));
        }

        const q = query(...queryConstraints);
        const snapshot = await getDocs(q);

        const fetchedTests = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setTests((prev) =>
          loadMore ? [...prev, ...fetchedTests] : fetchedTests
        );
        setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
        setHasMore(fetchedTests.length === PAGE_SIZE);
      } catch (error) {
        toast.error("Failed to fetch tests.");
        console.error("Error fetching tests:", error);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [lastDoc, hasMore, isLoadingMore]
  );

  useEffect(() => {
    fetchTests();
  }, []); // Initial fetch

  const handleTestCreated = () => {
    fetchTests(false); // This triggers a full refresh of the list
  };

  return (
    <div>
      <h1 className='text-3xl font-bold text-slate-900 mb-8'>
        Mock Test Management
      </h1>
      {/* --- UPDATED UI LAYOUT --- */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
        {/* Column 1: Create New Test */}
        <div className='lg:col-span-1'>
          <div className='bg-white p-6 rounded-2xl shadow-lg border'>
            <h2 className='text-xl font-bold text-slate-900 mb-4 flex items-center gap-2'>
              <Plus /> Create New Test
            </h2>
            <MockTestManager onTestCreated={handleTestCreated} />
          </div>
        </div>

        {/* Column 2: Existing Tests List */}
        <div className='lg:col-span-2 bg-white p-6 rounded-2xl shadow-lg border'>
          <h2 className='text-xl font-bold text-slate-900 mb-4'>
            Existing Tests
          </h2>
          {isLoading ? (
            <p className='text-center p-8 text-slate-600'>Loading tests...</p>
          ) : (
            <div className='space-y-3'>
              {tests.length > 0 ? (
                tests.map((test) => (
                  <div
                    key={test.id}
                    className='flex justify-between items-center p-4 border rounded-lg hover:bg-slate-50 transition-colors'
                  >
                    <div>
                      <p className='font-semibold text-slate-800'>
                        {test.title}
                      </p>
                      {/* --- UPDATED: Shows more details for dynamic tests --- */}
                      {test.isDynamic ? (
                        <p className='text-sm text-slate-500'>
                          {test.questionCount || 0} Questions (Dynamic) | Topic:{" "}
                          {toSentenceCase(test.sourceCriteria?.topic) || "N/A"}{" "}
                          | Subject:{" "}
                          {toSentenceCase(test.sourceCriteria?.subject) ||
                            "N/A"}
                        </p>
                      ) : (
                        <p className='text-sm text-slate-500'>
                          {test.questionCount || 0} Questions (Static)
                        </p>
                      )}
                    </div>
                    {/* --- UPDATED: Disables "Manage" button for dynamic tests --- */}
                    {test.isDynamic ? (
                      <span
                        className='px-4 py-2 text-sm bg-slate-100 text-slate-500 font-semibold rounded-lg cursor-not-allowed flex items-center gap-2'
                        title='Questions are managed in the Question Bank'
                      >
                        <Settings className='h-4 w-4' /> Dynamic
                      </span>
                    ) : (
                      <Link
                        href={`/admin/mock-tests/${test.id}`}
                        className='px-4 py-2 text-sm  bg-indigo-700 text-center text-white font-semibold rounded-lg hover:bg-slate-300'
                      >
                        Manage Questions
                      </Link>
                    )}
                  </div>
                ))
              ) : (
                <p className='text-center p-8 text-slate-600'>
                  No tests created yet.
                </p>
              )}

              {/* --- UPDATED: Pagination button --- */}
              {hasMore && (
                <div className='text-center mt-6'>
                  <button
                    onClick={() => fetchTests(true)}
                    disabled={isLoadingMore}
                    className='px-6 py-2 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300 disabled:opacity-50'
                  >
                    {isLoadingMore ? "Loading..." : "Load More"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
