// src/components/dashboard/TestHistory.js

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import toast from "react-hot-toast";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  documentId,
} from "firebase/firestore";
import UserAttemptDetailsModal from "./UserAttemptDetailsModal";

export default function TestHistory() {
  const { user } = useAuth();
  const [aggregatedHistory, setAggregatedHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedDetails, setSelectedDetails] = useState(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchAndProcessHistory = async () => {
      setLoading(true);
      try {
        // **THE FIX: Call the new API route instead of querying Firestore directly**
        const idToken = await user.getIdToken();
        const response = await fetch("/api/user/test-history", {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch test history");
        }

        const allResults = await response.json();

        if (allResults.length === 0) {
          setAggregatedHistory([]);
          setLoading(false);
          return;
        }

        // --- The rest of the processing logic remains the same ---
        const summary = new Map();
        allResults.forEach((res) => {
          const key = res.testId;
          if (!summary.has(key)) {
            summary.set(key, {
              testId: res.testId,
              attemptCount: 0,
              mostRecentAttempt: res,
              allAttemptsForTest: [],
            });
          }
          const entry = summary.get(key);
          entry.attemptCount += 1;
          entry.allAttemptsForTest.push({
            ...res,
            completedAt: new Date(res.completedAt), // Convert milliseconds back to Date
          });
        });

        const testIds = [...summary.keys()];
        if (testIds.length === 0) {
          setAggregatedHistory([]);
          setLoading(false);
          return;
        }

        const fetchedTests = [];
        for (let i = 0; i < testIds.length; i += 10) {
          const chunk = testIds.slice(i, i + 10);
          const testsQuery = query(
            collection(db, "mockTests"),
            where(documentId(), "in", chunk)
          );
          const testsSnapshot = await getDocs(testsQuery);
          testsSnapshot.forEach((doc) =>
            fetchedTests.push({ id: doc.id, ...doc.data() })
          );
        }
        const testsMap = new Map(fetchedTests.map((test) => [test.id, test]));

        const finalData = [...summary.values()].map((item) => ({
          ...item,
          testTitle: testsMap.get(item.testId)?.title || "Unknown Test",
        }));

        // Sort the aggregated history by the most recent attempt's completion date
        finalData.sort(
          (a, b) =>
            b.mostRecentAttempt.completedAt - a.mostRecentAttempt.completedAt
        );

        setAggregatedHistory(finalData);
      } catch (error) {
        console.error("Test History Fetch Error:", error);
        toast.error("Could not load your test history.");
      } finally {
        setLoading(false);
      }
    };

    fetchAndProcessHistory();
  }, [user]);

  const handleItemClick = (item) => {
    if (item.attemptCount > 1) {
      setSelectedDetails({
        testTitle: item.testTitle,
        allAttempts: item.allAttemptsForTest,
      });
      setIsDetailsModalOpen(true);
    }
  };

  if (loading) {
    return (
      <p className='mt-2 text-lg text-slate-800'>
        Loading your test history...
      </p>
    );
  }

  return (
    <>
      <UserAttemptDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        details={selectedDetails}
      />
      <div className='space-y-4'>
        {aggregatedHistory.length === 0 ? (
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
          aggregatedHistory.map((item) => {
            const content = (
              <div className='flex flex-col sm:flex-row justify-between items-center w-full gap-4'>
                <div className='text-left'>
                  <h3 className='font-bold text-lg text-slate-900'>
                    {item.testTitle}
                  </h3>
                  <p className='text-sm text-slate-700 mt-1'>
                    Last attempt:{" "}
                    {new Date(
                      item.mostRecentAttempt.completedAt
                    ).toLocaleDateString()}
                  </p>
                  <p className='text-slate-800 mt-2'>
                    Most Recent Score:{" "}
                    <span className='font-extrabold text-lg text-indigo-600'>
                      {item.mostRecentAttempt.score}
                    </span>{" "}
                    / {item.mostRecentAttempt.totalQuestions}
                  </p>
                </div>
                <div className='flex-shrink-0 px-4 py-3 bg-indigo-100 text-indigo-700 text-sm font-semibold rounded-lg hover:bg-indigo-200 text-center'>
                  {item.attemptCount > 1
                    ? `View ${item.attemptCount} Attempts`
                    : "View Result"}
                </div>
              </div>
            );

            const resultPath = item.mostRecentAttempt.isDynamic
              ? `/mock-tests/results/results-dynamic/${item.mostRecentAttempt.id}`
              : `/mock-tests/results/${item.mostRecentAttempt.id}`;

            if (item.attemptCount > 1) {
              return (
                <button
                  key={item.testId}
                  onClick={() => handleItemClick(item)}
                  className='w-full p-4 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 transition-colors'
                >
                  {content}
                </button>
              );
            } else {
              return (
                <Link
                  key={item.testId}
                  href={resultPath}
                  className='block p-4 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 transition-colors'
                >
                  {content}
                </Link>
              );
            }
          })
        )}
      </div>
    </>
  );
}
