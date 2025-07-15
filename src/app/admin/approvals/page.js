// src/app/admin/approvals/page.js

"use client";

import { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  writeBatch,
} from "firebase/firestore";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { CheckCircle, XCircle, Clock } from "lucide-react";

export default function ApprovalsPage() {
  const [pendingTests, setPendingTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchPendingTests = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "mockTests"),
        where("status", "==", "pending_approval"),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);
      const tests = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setPendingTests(tests);
    } catch (error) {
      console.error("Error fetching pending tests:", error);
      toast.error("Failed to load tests for approval.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingTests();
  }, [fetchPendingTests]);

  const handleDecision = async (testId, decision) => {
    try {
      const idToken = await user.getIdToken();
      const res = await fetch("/api/admin/handle-test-approval", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ testId, decision }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      toast.success(`Test has been ${decision}.`);
      setPendingTests((prev) => prev.filter((t) => t.id !== testId));
    } catch (error) {
      toast.error(`Error: ${error.message}`);
    }
  };

  if (loading) {
    return <div className='text-center p-12'>Loading pending tests...</div>;
  }

  return (
    <div>
      <h1 className='text-3xl font-bold text-slate-900 mb-6'>
        Test Approval Queue
      </h1>
      <div className='bg-white p-6 rounded-2xl shadow-lg border'>
        {pendingTests.length > 0 ? (
          <div className='space-y-4'>
            {pendingTests.map((test) => (
              <div
                key={test.id}
                className='p-4 border rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-slate-50'
              >
                <div>
                  <h3 className='font-bold text-lg text-slate-900'>
                    {test.title}
                  </h3>
                  <p className='text-sm text-slate-600'>
                    Topic: {test.topic} | Subject: {test.subject}
                  </p>
                  <p className='text-xs text-slate-500 mt-1'>
                    Submitted on:{" "}
                    {new Date(
                      test.createdAt.seconds * 1000
                    ).toLocaleDateString()}
                  </p>
                </div>
                <div className='flex gap-2 flex-shrink-0'>
                  <button
                    onClick={() => handleDecision(test.id, "approved")}
                    className='px-3 py-2 text-sm font-semibold bg-green-100 text-green-700 rounded-lg hover:bg-green-200 flex items-center gap-1.5'
                  >
                    <CheckCircle size={16} /> Approve
                  </button>
                  <button
                    onClick={() => handleDecision(test.id, "rejected")}
                    className='px-3 py-2 text-sm font-semibold bg-red-100 text-red-700 rounded-lg hover:bg-red-200 flex items-center gap-1.5'
                  >
                    <XCircle size={16} /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className='text-center py-12'>
            <Clock className='mx-auto h-12 w-12 text-slate-400' />
            <h3 className='mt-2 text-lg font-semibold text-slate-900'>
              All Caught Up!
            </h3>
            <p className='mt-1 text-sm text-slate-500'>
              There are no pending tests to review.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
