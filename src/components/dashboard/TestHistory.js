"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  startAfter,
  doc,
  getDoc,
} from "firebase/firestore";
import toast from "react-hot-toast";

const PAGE_SIZE = 5;

export default function TestHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState(null);

  const fetchHistoryPage = useCallback(
    async (cursorDoc = null) => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const resultsRef = collection(db, "mockTestResults");
        const queryConstraints = [
          where("userId", "==", user.uid),
          orderBy("completedAt", "desc"),
          limit(PAGE_SIZE),
        ];

        const q = cursorDoc
          ? query(resultsRef, ...queryConstraints, startAfter(cursorDoc))
          : query(resultsRef, ...queryConstraints);

        const querySnapshot = await getDocs(q);

        const newHistory = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          newHistory.push({
            id: doc.id,
            ...data,
            completedAt: data.completedAt.toDate().toISOString(),
          });
        });

        if (newHistory.length > 0) {
          const testIds = [...new Set(newHistory.map((res) => res.testId))];
          const testsQuery = query(
            collection(db, "mockTests"),
            where("__name__", "in", testIds)
          );
          const testsSnapshot = await getDocs(testsQuery);
          const testsMap = new Map();
          testsSnapshot.forEach((doc) => testsMap.set(doc.id, doc.data()));

          newHistory.forEach((res) => {
            res.testTitle = testsMap.get(res.testId)?.title || "Unknown Test";
          });
        }

        setHistory((prev) =>
          cursorDoc ? [...prev, ...newHistory] : newHistory
        );
        setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1]);
        setHasMore(querySnapshot.docs.length === PAGE_SIZE);
      } catch (error) {
        toast.error("Could not load your test history.");
        console.error("Failed to fetch test history", error);
      }
    },
    [user]
  );

  useEffect(() => {
    setLoading(true);
    fetchHistoryPage(null).finally(() => setLoading(false));
  }, [fetchHistoryPage]);

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    await fetchHistoryPage(lastDoc);
    setLoadingMore(false);
  };

  if (loading) {
    return (
      <p className='mt-2 text-lg text-slate-800'>
        Loading your test history...
      </p>
    );
  }

  return (
    <div className='space-y-4'>
      {history.length === 0 ? (
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
        history.map((item) => (
          <div
            key={item.id}
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
        ))
      )}
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
