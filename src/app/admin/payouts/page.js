// src/app/admin/payouts/page.js

"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import toast from "react-hot-toast";
import { Banknote, IndianRupee } from "lucide-react";
import RecordPayoutModal from "@/components/admin/RecordPayoutModal"; // We will create this next

export default function PayoutsPage() {
  const { user } = useAuth();
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);

  // State for the payout modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState(null);

  const fetchPayouts = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "earnings"),
        where("pendingAmount", ">", 0)
      );
      const earningsSnapshot = await getDocs(q);
      const earningsData = earningsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      if (earningsData.length === 0) {
        setCreators([]);
        setLoading(false);
        return;
      }

      const userIds = earningsData.map((e) => e.id);
      const usersQuery = query(
        collection(db, "users"),
        where("uid", "in", userIds)
      );
      const usersSnapshot = await getDocs(usersQuery);
      const usersMap = new Map(
        usersSnapshot.docs.map((doc) => [doc.id, doc.data()])
      );

      const combinedData = earningsData.map((earning) => ({
        ...earning,
        name: usersMap.get(earning.id)?.name || "Unknown User",
        email: usersMap.get(earning.id)?.email,
        bankDetails: usersMap.get(earning.id)?.bankDetails,
      }));

      setCreators(combinedData);
    } catch (error) {
      toast.error("Failed to load payout data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayouts();
  }, [fetchPayouts]);

  const handleOpenModal = (creator) => {
    setSelectedCreator(creator);
    setIsModalOpen(true);
  };

  const handlePayoutRecorded = () => {
    setIsModalOpen(false);
    setSelectedCreator(null);
    fetchPayouts(); // Refresh the list after recording a payout
  };

  if (loading)
    return <div className='text-center p-12'>Loading Pending Payouts...</div>;

  return (
    <>
      <RecordPayoutModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        creator={selectedCreator}
        onSuccess={handlePayoutRecorded}
      />
      <div>
        <h1 className='text-3xl font-bold text-slate-900 mb-6'>
          Manage Payouts
        </h1>
        <div className='bg-white p-6 rounded-2xl shadow-lg border'>
          <h2 className='text-xl font-bold text-slate-800 mb-4'>
            Creators with Pending Payments
          </h2>
          {creators.length > 0 ? (
            <div className='space-y-4'>
              {creators.map((creator) => (
                <div key={creator.id} className='p-4 border rounded-lg'>
                  <div className='flex flex-col sm:flex-row justify-between sm:items-center gap-4'>
                    <div>
                      <p className='font-bold text-lg text-slate-800'>
                        {creator.name}
                      </p>
                      <p className='text-sm text-indigo-600'>{creator.email}</p>
                    </div>
                    <div className='text-center'>
                      <p className='text-sm text-slate-500'>Pending Amount</p>
                      <p className='font-bold text-2xl text-green-600'>
                        ₹{creator.pendingAmount.toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleOpenModal(creator)}
                      className='w-full sm:w-auto px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 flex items-center justify-center gap-2'
                    >
                      <Banknote size={16} /> Record Payout
                    </button>
                  </div>
                  {creator.bankDetails && (
                    <div className='mt-4 pt-3 border-t text-sm text-slate-600 bg-slate-50 p-3 rounded-md'>
                      <p>
                        <strong>Account Name:</strong>{" "}
                        {creator.bankDetails.accountHolderName}
                      </p>
                      <p>
                        <strong>Account Number:</strong>{" "}
                        {creator.bankDetails.accountNumber}
                      </p>
                      <p>
                        <strong>IFSC Code:</strong>{" "}
                        {creator.bankDetails.ifscCode}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className='text-center py-12'>
              <IndianRupee className='mx-auto h-12 w-12 text-slate-400' />
              <h3 className='mt-2 text-lg font-semibold text-slate-900'>
                No Pending Payouts
              </h3>
              <p className='mt-1 text-sm text-slate-500'>
                All creator payments are up to date.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
