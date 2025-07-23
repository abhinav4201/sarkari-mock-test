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
import { AlertTriangle, CheckCircle, Clock, Ban } from "lucide-react";

// Helper to format submission reasons with icons and colors
const formatReason = (reason) => {
  switch (reason) {
    case "tab_switched":
      return {
        text: "Tab Switched",
        icon: <Ban className='h-4 w-4' />,
        color: "text-red-700 bg-red-100",
      };
    case "time_up":
      return {
        text: "Time Up",
        icon: <Clock className='h-4 w-4' />,
        color: "text-amber-700 bg-amber-100",
      };
    case "user_submitted":
    default:
      return {
        text: "Completed",
        icon: <CheckCircle className='h-4 w-4' />,
        color: "text-green-700 bg-green-100",
      };
  }
};

export default function TestAttemptsModal({ isOpen, onClose, onRowClick }) {
  const [aggregatedAttempts, setAggregatedAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAndProcessAllAttempts = useCallback(async () => {
    setLoading(true);
    try {
      const resultsQuery = query(
        collection(db, "mockTestResults"),
        orderBy("completedAt", "desc")
      );
      const resultsSnapshot = await getDocs(resultsQuery);
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
        if (
          res.completedAt.toMillis() >
          entry.mostRecentAttempt.completedAt.toMillis()
        ) {
          entry.mostRecentAttempt = res;
        }
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
        usersMap = new Map(userSnap.docs.map((d) => [d.data().uid, d.data()]));
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

      const finalData = [...summary.values()].map((item) => ({
        key: `${item.userId}_${item.testId}`,
        userName: usersMap.get(item.userId)?.name || "Unknown User",
        testTitle: testsMap.get(item.testId)?.title || "Unknown Test",
        attemptCount: item.attemptCount,
        recentScore: item.mostRecentAttempt.score,
        totalQuestions: item.mostRecentAttempt.totalQuestions,
        recentDate: item.mostRecentAttempt.completedAt,
        isDynamic: item.mostRecentAttempt.isDynamic || false,
        submissionReason: item.mostRecentAttempt.submissionReason,
        reviewFlag: item.mostRecentAttempt.reviewFlag, // <-- Pass the flag
        allAttempts: item.allAttemptsForPair,
      }));

      setAggregatedAttempts(finalData);
    } catch (error) {
      toast.error("Failed to load test attempts summary.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchAndProcessAllAttempts();
    }
  }, [isOpen, fetchAndProcessAllAttempts]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title='User Test Attempts (Summary)'
      size='7xl'
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
                  <th className='p-4 text-sm font-semibold text-slate-800'>
                    Status & Flags
                  </th>
                </tr>
              </thead>
              <tbody>
                {aggregatedAttempts.map((item) => {
                  const reasonDetails = formatReason(item.submissionReason);
                  return (
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
                      <td className='p-4 text-sm align-top'>
                        <div className='flex flex-col gap-2'>
                          <div
                            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-bold ${reasonDetails.color}`}
                          >
                            {reasonDetails.icon}
                            {reasonDetails.text}
                          </div>
                          {item.reviewFlag === "low_completion_time" && (
                            <div className='inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-bold text-red-700 bg-red-100'>
                              <AlertTriangle className='h-4 w-4' />
                              Suspiciously Fast
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
