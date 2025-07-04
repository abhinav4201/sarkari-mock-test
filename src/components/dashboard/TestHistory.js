"use client";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function TestHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState(null);

  // This function fetches a page of results
  const fetchPage = async (pageCursor) => {
    if (!user) return;
    try {
      const res = await fetch(
        `/api/users/${user.uid}/results?cursor=${pageCursor || ""}`
      );
      const data = await res.json();

      if (data.results && Array.isArray(data.results)) {
        // De-duplicate results to prevent any API overlap issues
        const newResults = data.results;
        setHistory((prev) => {
          const combined = [...prev, ...newResults];
          return Array.from(
            new Map(combined.map((item) => [item.id, item])).values()
          );
        });

        // Set the cursor for the next page
        setCursor(data.nextCursor);
        setHasMore(!!data.nextCursor);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Failed to fetch test history", error);
    }
  };

  // Effect for the initial load when the component mounts or user changes
  useEffect(() => {
    const initialFetch = async () => {
      setLoading(true);
      setHistory([]); // Reset history
      setCursor(null);
      await fetchPage(null); // Fetch the very first page
      setLoading(false);
    };

    if (user) {
      initialFetch();
    }
  }, [user]);

  // Handler for the "Load More" button
  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    await fetchPage(cursor); // Fetch the next page using the saved cursor
    setLoadingMore(false);
  };

  if (loading) {
    return (
      <p className='mt-2 text-lg text-slate-900'>
        Loading your test history...
      </p>
    );
  }

  if (history.length === 0) {
    return (
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
    );
  }

  return (
    <div className='space-y-4'>
      {history.map((item) => (
        <div
          key={item.id} // Each test attempt has a unique document ID
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
            href={`/mock-tests/results/${item.id}`}
            className='flex-shrink-0 px-4 py-2 bg-indigo-100 text-indigo-700 text-sm font-semibold rounded-lg hover:bg-indigo-200 text-center'
          >
            View Result
          </Link>
        </div>
      ))}
      {hasMore && (
        <div className='text-center mt-6'>
          <button
            onClick={handleLoadMore}
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
