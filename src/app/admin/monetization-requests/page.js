// src/app/admin/monetization-requests/page.js

"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import toast from "react-hot-toast";
import { CheckCircle, XCircle, Mail } from "lucide-react";

export default function MonetizationRequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "users"),
        where("monetizationStatus", "==", "requested")
      );
      const snapshot = await getDocs(q);
      setRequests(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      toast.error("Failed to load monetization requests.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleDecision = async (targetUserId, decision) => {
    try {
      const idToken = await user.getIdToken();
      const res = await fetch("/api/admin/handle-monetization-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ targetUserId, decision }),
      });
      if (!res.ok) throw new Error("Server responded with an error.");
      toast.success(`User has been ${decision}.`);
      setRequests((prev) => prev.filter((req) => req.id !== targetUserId));
    } catch (error) {
      toast.error("Failed to process the request.");
    }
  };

  if (loading)
    return <div className='text-center p-12'>Loading Requests...</div>;

  return (
    <div>
      <h1 className='text-3xl font-bold text-slate-900 mb-6'>
        Monetization Requests
      </h1>
      <div className='bg-white p-6 rounded-2xl shadow-lg border'>
        {requests.length > 0 ? (
          <div className='space-y-4'>
            {requests.map((req) => (
              <div
                key={req.id}
                className='p-4 border rounded-lg flex justify-between items-center'
              >
                <div>
                  <p className='font-bold text-lg text-slate-800'>{req.name}</p>
                  <p className='text-sm text-indigo-600'>{req.email}</p>
                </div>
                <div className='flex gap-2'>
                  <button
                    onClick={() => handleDecision(req.id, "approved")}
                    className='px-3 py-2 text-sm font-semibold bg-green-100 text-green-700 rounded-lg hover:bg-green-200 flex items-center gap-1.5'
                  >
                    <CheckCircle size={16} /> Approve
                  </button>
                  <button
                    onClick={() => handleDecision(req.id, "rejected")}
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
            <Mail className='mx-auto h-12 w-12 text-slate-400' />
            <h3 className='mt-2 text-lg font-semibold text-slate-900'>
              No Pending Requests
            </h3>
            <p className='mt-1 text-sm text-slate-500'>
              New monetization applications will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
