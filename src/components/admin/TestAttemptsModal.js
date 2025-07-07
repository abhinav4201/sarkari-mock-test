"use client";

import { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  orderBy,
  getDocs,
  where,
  documentId,
} from "firebase/firestore";
import toast from "react-hot-toast";
import Modal from "../ui/Modal";

// This component no longer needs to manage or render the details modal.

export default function TestAttemptsModal({ isOpen, onClose, onRowClick }) {
  const [aggregatedAttempts, setAggregatedAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      const fetchAndProcessAllAttempts = async () => {
        setLoading(true);
        try {
          // This logic remains the same: fetch all results and process them
          const resultsQuery = query(
            collection(db, "mockTestResults"),
            orderBy("completedAt", "desc")
          );
          const resultsSnapshot = await getDocs(resultsQuery);
          const allResults = resultsSnapshot.docs.map((doc) => doc.data());

          if (allResults.length === 0) {
            setAggregatedAttempts([]);
            setLoading(false);
            return;
          }

          const summary = new Map();
          allResults.forEach((res) => {
            const key = `${res.userId}_${res.testId}`;
            if (!summary.has(key)) {
              summary.set(key, {
                userId: res.userId,
                testId: res.testId,
                attemptCount: 0,
                mostRecentAttempt: res,
                allAttemptsForPair: [],
              });
            }
            const entry = summary.get(key);
            entry.attemptCount += 1;
            entry.allAttemptsForPair.push(res);
          });

          const userIds = [
            ...new Set([...summary.values()].map((item) => item.userId)),
          ];
          const testIds = [
            ...new Set([...summary.values()].map((item) => item.testId)),
          ];

          const userQuery = query(
            collection(db, "users"),
            where("uid", "in", userIds)
          );
          const testQuery = query(
            collection(db, "mockTests"),
            where(documentId(), "in", testIds)
          );

          const [userSnap, testSnap] = await Promise.all([
            getDocs(userQuery),
            getDocs(testQuery),
          ]);
          const usersMap = new Map(userSnap.docs.map((d) => [d.id, d.data()]));
          const testsMap = new Map(testSnap.docs.map((d) => [d.id, d.data()]));

          const finalData = [...summary.values()].map((item) => ({
            key: `${item.userId}_${item.testId}`,
            userName: usersMap.get(item.userId)?.name || "Unknown User",
            testTitle: testsMap.get(item.testId)?.title || "Unknown Test",
            attemptCount: item.attemptCount,
            recentScore: item.mostRecentAttempt.score,
            totalQuestions: item.mostRecentAttempt.totalQuestions,
            recentDate: item.mostRecentAttempt.completedAt,
            allAttempts: item.allAttemptsForPair,
          }));

          setAggregatedAttempts(finalData);
        } catch (error) {
          toast.error("Failed to load test attempts summary.");
          console.error(error);
        } finally {
          setLoading(false);
        }
      };

      fetchAndProcessAllAttempts();
    }
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title='User Test Attempts (Summary)'
    >
      <div className='space-y-4'>
        {loading ? (
          <p className='text-center p-8'>Generating summary...</p>
        ) : aggregatedAttempts.length > 0 ? (
          <div className='overflow-x-auto'>
            <table className='w-full text-left table-auto'>
              <thead className='bg-slate-100 border-b border-slate-200'>
                <tr>
                  <th className='p-4 text-sm font-semibold text-slate-800'>
                    User
                  </th>
                  <th className='p-4 text-sm font-semibold text-slate-800'>
                    Test Taken
                  </th>
                  <th className='p-4 text-sm font-semibold text-slate-800 text-center'>
                    Attempts
                  </th>
                  <th className='p-4 text-sm font-semibold text-slate-800'>
                    Most Recent Score
                  </th>
                  <th className='p-4 text-sm font-semibold text-slate-800'>
                    Last Attempt
                  </th>
                </tr>
              </thead>
              <tbody>
                {aggregatedAttempts.map((item) => (
                  <tr
                    key={item.key}
                    // FIX: The onClick now calls the onRowClick prop passed from the parent page.
                    onClick={() => onRowClick(item)}
                    className='border-b border-slate-100 hover:bg-slate-200 cursor-pointer'
                  >
                    <td className='p-4 font-semibold text-indigo-600 align-top'>
                      {item.userName}
                    </td>
                    <td className='p-4 font-medium text-slate-800 align-top'>
                      {item.testTitle}
                    </td>
                    <td className='p-4 text-slate-700 text-center font-bold text-lg align-top'>
                      {item.attemptCount}
                    </td>
                    <td className='p-4 text-slate-700 font-semibold align-top'>
                      {item.recentScore} / {item.totalQuestions}
                    </td>
                    <td className='p-4 text-slate-600 text-sm align-top'>
                      {item.recentDate?.toDate
                        ? new Date(
                            item.recentDate.toDate()
                          ).toLocaleDateString()
                        : "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className='text-center p-8 text-slate-600'>
            No test attempts found.
          </p>
        )}
      </div>
    </Modal>
  );
}
