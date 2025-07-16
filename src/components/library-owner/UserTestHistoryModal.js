// src/components/library-owner/UserTestHistoryModal.js
"use client";

import Modal from "@/components/ui/Modal";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  Timestamp,
  documentId,
} from "firebase/firestore";
import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { BarChart, Check, X, Clock } from "lucide-react";

export default function UserTestHistoryModal({
  isOpen,
  onClose,
  userId,
  userName,
  libraryId,
  selectedMonth,
  selectedYear,
}) {
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUserTestHistory = useCallback(async () => {
    if (!userId || !libraryId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const startDate = Timestamp.fromDate(
        new Date(selectedYear, selectedMonth - 1, 1)
      );
      const endDate = Timestamp.fromDate(
        new Date(selectedYear, selectedMonth, 0, 23, 59, 59)
      );

      // --- THIS IS THE FIX ---
      // The `where("libraryId", "==", libraryId)` clause is added to match the security rule.
      const resultsQuery = query(
        collection(db, "mockTestResults"),
        where("userId", "==", userId),
        where("libraryId", "==", libraryId), // This is the required clause
        where("completedAt", ">=", startDate),
        where("completedAt", "<=", endDate),
        orderBy("completedAt", "desc")
      );
      // --- END OF FIX ---

      const resultsSnapshot = await getDocs(resultsQuery);
      const resultsData = resultsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        completedAt: doc.data().completedAt.toDate(),
      }));

      const testIds = [...new Set(resultsData.map((res) => res.testId))];
      let testsMap = new Map();
      if (testIds.length > 0) {
        for (let i = 0; i < testIds.length; i += 10) {
          const chunk = testIds.slice(i, i + 10);
          const testsQuery = query(
            collection(db, "mockTests"),
            where(documentId(), "in", chunk)
          );
          const testsSnapshot = await getDocs(testsQuery);
          testsSnapshot.forEach((doc) => testsMap.set(doc.id, doc.data()));
        }
      }

      const combinedResults = resultsData.map((result) => ({
        ...result,
        testTitle: testsMap.get(result.testId)?.title || "Unknown Test",
        estimatedTime: testsMap.get(result.testId)?.estimatedTime || 0,
      }));

      setTestResults(combinedResults);
    } catch (err) {
      console.error("Error fetching user test history:", err);
      setError("Failed to load test history. Check permissions or data.");
      toast.error("Failed to load user's test history.");
    } finally {
      setLoading(false);
    }
  }, [userId, libraryId, selectedMonth, selectedYear]);

  useEffect(() => {
    if (isOpen && userId && libraryId) {
      fetchUserTestHistory();
    } else if (!isOpen) {
      setTestResults([]);
      setLoading(true);
      setError(null);
    }
  }, [isOpen, userId, libraryId, fetchUserTestHistory]);

  // ... rest of the component remains the same
  if (!isOpen) return null;

  const formatTime = (seconds) => {
    if (typeof seconds !== "number" || isNaN(seconds)) return "0s";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Test History for ${userName}`}
    >
      <div className='p-4'>
        {loading ? (
          <p className='text-center text-slate-600 py-8'>
            Loading test history...
          </p>
        ) : error ? (
          <p className='text-center text-red-600 py-8'>{error}</p>
        ) : testResults.length > 0 ? (
          <div className='space-y-4 max-h-96 overflow-y-auto'>
            {testResults.map((result) => (
              <div
                key={result.id}
                className='p-4 border border-slate-200 rounded-lg bg-slate-50'
              >
                <h3 className='font-bold text-lg text-slate-900'>
                  {result.testTitle}
                </h3>
                <p className='text-sm text-slate-600'>
                  Completed on: {result.completedAt.toLocaleDateString()} at{" "}
                  {result.completedAt.toLocaleTimeString()}
                </p>
                <div className='mt-3 grid grid-cols-2 gap-3 text-center'>
                  <div className='p-2 bg-white rounded-md shadow-sm'>
                    <p className='text-xs text-slate-500'>Score</p>
                    <p className='font-bold text-lg text-indigo-600'>
                      {result.score} / {result.totalQuestions}
                    </p>
                  </div>
                  <div className='p-2 bg-white rounded-md shadow-sm'>
                    <p className='text-xs text-slate-500'>Time Taken</p>
                    <p className='font-bold text-lg text-blue-600'>
                      {formatTime(result.totalTimeTaken)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className='text-center text-slate-600 py-8'>
            No tests taken by this user in the selected month.
          </p>
        )}
      </div>
    </Modal>
  );
}
