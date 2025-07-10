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

// --- NEW: Helper function to format the submission reason nicely ---
// const formatReason = (reason) => {
//   switch (reason) {
//     case "tab_switched":
//       return "Tab Switched";
//     case "time_up":
//       return "Time Up";
//     case "user_submitted":
//     default:
//       return "Completed";
//   }
// };

export default function TestAttemptsModal({ isOpen, onClose, onRowClick }) {
  const [aggregatedAttempts, setAggregatedAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      const fetchAndProcessAllAttempts = async () => {
        setLoading(true);
        try {
          const resultsQuery = query(
            collection(db, "mockTestResults"),
            orderBy("completedAt", "desc")
          );
          const resultsSnapshot = await getDocs(resultsQuery);
          // Use doc.id and doc.data() to get all fields
          const allResults = resultsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

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
          ].filter(Boolean);
          const testIds = [
            ...new Set([...summary.values()].map((item) => item.testId)),
          ].filter(Boolean);

          let usersMap = new Map();
          if (userIds.length > 0) {
            const userQuery = query(
              collection(db, "users"),
              where("uid", "in", userIds)
            );
            const userSnap = await getDocs(userQuery);
            usersMap = new Map(
              userSnap.docs.map((d) => [d.data().uid, d.data()])
            );
          }

          let testsMap = new Map();
          if (testIds.length > 0) {
            const testQuery = query(
              collection(db, "mockTests"),
              where(documentId(), "in", testIds)
            );
            const testSnap = await getDocs(testQuery);
            testsMap = new Map(testSnap.docs.map((d) => [d.id, d.data()]));
          }

          // --- UPDATED: Data processing now includes the new fields ---
          const finalData = [...summary.values()].map((item) => ({
            key: `${item.userId}_${item.testId}`,
            userName: usersMap.get(item.userId)?.name || "Unknown User",
            testTitle: testsMap.get(item.testId)?.title || "Unknown Test",
            attemptCount: item.attemptCount,
            recentScore: item.mostRecentAttempt.score,
            totalQuestions: item.mostRecentAttempt.totalQuestions,
            recentDate: item.mostRecentAttempt.completedAt,
            isDynamic: item.mostRecentAttempt.isDynamic || false, // Add isDynamic field
            submissionReason: item.mostRecentAttempt.submissionReason, // Add submissionReason
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
      <div className='p-1'>
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
                  {/* --- NEW: Table Header for Test Type --- */}
                  <th className='p-4 text-sm font-semibold text-slate-800'>
                    Test Type
                  </th>
                  {/* --- NEW: Table Header for Submission Reason --- */}
                  {/* <th className='p-4 text-sm font-semibold text-slate-800'>
                    Submission
                  </th> */}
                </tr>
              </thead>
              <tbody>
                {aggregatedAttempts.map((item) => (
                  <tr
                    key={item.key}
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
                    {/* --- NEW: Table Cell for Test Type --- */}
                    <td className='p-4 text-sm align-top'>
                      {item.isDynamic ? (
                        <span className='px-2 py-1 font-semibold text-xs rounded-full bg-blue-800 text-white'>
                          Dynamic
                        </span>
                      ) : (
                        <span className='px-2 py-1 font-semibold text-xs rounded-full bg-green-800 text-white'>
                          Static
                        </span>
                      )}
                    </td>
                    {/* --- NEW: Table Cell for Submission Reason --- */}
                    {/* <td className='p-4 text-sm text-slate-600 align-top'>
                      {formatReason(item.submissionReason)}
                    </td> */}
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
