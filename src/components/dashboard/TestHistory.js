"use client";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function TestHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true); // To know if there are more results to load
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchHistory = async (isInitialLoad = false) => {
    if (!user) return;
    if (isInitialLoad) setLoading(true);
    else setLoadingMore(true);

    try {
      // Determine the cursor for the next page
      const lastItem = history.length > 0 ? history[history.length - 1] : null;
      const cursor = lastItem ? new Date(lastItem.completedAt).getTime() : "";

      const res = await fetch(
        `/api/users/${user.uid}/results?cursor=${cursor}`
      );
      const data = await res.json();

      if (Array.isArray(data)) {
        // Append new data to the existing history
        setHistory((prev) => (isInitialLoad ? data : [...prev, ...data]));
        // If we receive fewer items than the page size, there are no more pages
        if (data.length < 5) {
          setHasMore(false);
        }
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Failed to fetch test history", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchHistory(true);
  }, [user]);

  if (loading) {
    return (
      <p className='mt-2 text-lg text-slate-900'>
        Loading your test history...
      </p>
    );
  }

  if (history.length === 0) {
    return (
      <p className='mt-2 text-lg text-slate-900'>
        You haven't completed any tests yet.{" "}
        <Link
          href='/mock-tests'
          className='font-bold text-indigo-600 underline'
        >
          Start one now!
        </Link>
      </p>
    );
  }

  return (
    <div className='space-y-4'>
      {loading ? (
        // Skeleton Loader remains the same
        [...Array(3)].map((_, i) => (
          <div
            key={i}
            className='p-4 border rounded-xl flex justify-between items-center bg-slate-50 animate-pulse'
          >
            <div className='w-full'>
              <div className='h-6 w-3/5 bg-slate-200 rounded-md'></div>
              <div className='h-4 w-2/5 bg-slate-200 rounded-md mt-2'></div>
            </div>
            <div className='h-10 w-24 bg-slate-200 rounded-lg'></div>
          </div>
        ))
      ) : history.length === 0 ? (
        // "No tests" placeholder with high-contrast text
        <div className='text-center py-10 px-4 border-2 border-dashed rounded-xl border-slate-300'>
          <h3 className='text-lg font-semibold text-slate-900'>
            No Tests Taken Yet
          </h3>
          <p className='mt-1 text-slate-800'>
            Your completed test results will appear here.
          </p>
          <Link
            href='/mock-tests'
            className='mt-4 inline-block px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700'
          >
            Browse Tests
          </Link>
        </div>
      ) : (
        // History items with high-contrast text
        history.map((item) => (
          <div
            key={item.resultId}
            className='p-4 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:justify-between sm:items-center bg-white hover:bg-slate-50 transition-colors'
          >
            <div className='mb-4 sm:mb-0'>
              <h3 className='font-bold text-lg text-slate-900'>
                {item.testTitle}
              </h3>
              <p className='text-sm text-slate-700 mt-1'>
                Completed on: {new Date(item.completedAt).toLocaleDateString()}
              </p>
              <p className='text-slate-800 mt-2'>
                Score:{" "}
                <span className='font-extrabold text-lg text-indigo-600'>
                  {item.score}
                </span>{" "}
                / {item.totalQuestions}
              </p>
            </div>
            <Link
              href={`/mock-tests/results/${item.resultId}`}
              className='flex-shrink-0 px-4 py-2 bg-indigo-100 text-indigo-700 text-sm font-semibold rounded-lg hover:bg-indigo-200 text-center'
            >
              View Result
            </Link>
          </div>
        ))
      )}
      {hasMore && (
        <div className='text-center mt-6'>
          <button
            onClick={() => fetchHistory(false)}
            disabled={loadingMore}
            className='px-6 py-2 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300 disabled:opacity-50'
          >
            {loadingMore ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </div>
  );
}
