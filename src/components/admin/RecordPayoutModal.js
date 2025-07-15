// src/components/admin/RecordPayoutModal.js

"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Modal from "../ui/Modal";
import toast from "react-hot-toast";

export default function RecordPayoutModal({
  isOpen,
  onClose,
  creator,
  onSuccess,
}) {
  const { user } = useAuth();
  const [amount, setAmount] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!creator || !amount || Number(amount) <= 0) {
      return toast.error("Please enter a valid amount.");
    }
    setIsLoading(true);

    try {
      const idToken = await user.getIdToken();
      const res = await fetch("/api/admin/record-payout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          targetUserId: creator.id,
          amount: Number(amount),
          transactionId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      toast.success("Payout recorded successfully!");
      onSuccess();
    } catch (error) {
      toast.error(`Failed to record payout: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!creator) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Record Payout for ${creator.name}`}
    >
      <form onSubmit={handleSubmit} className='p-6 space-y-4'>
        <div>
          <label className='block text-sm font-medium text-slate-700'>
            Amount Paid (₹)
          </label>
          <input
            type='number'
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className='mt-1 w-full p-2 border border-slate-300 rounded-md'
            placeholder={`Pending: ₹${creator.pendingAmount.toLocaleString()}`}
            required
            min='1'
          />
        </div>
        <div>
          <label className='block text-sm font-medium text-slate-700'>
            Transaction ID (Optional)
          </label>
          <input
            type='text'
            value={transactionId}
            onChange={(e) => setTransactionId(e.target.value)}
            className='mt-1 w-full p-2 border border-slate-300 rounded-md'
            placeholder='e.g., UTR number'
          />
        </div>
        <div className='flex justify-end gap-4 pt-2'>
          <button
            type='button'
            onClick={onClose}
            disabled={isLoading}
            className='px-4 py-2 bg-slate-100 rounded-lg'
          >
            Cancel
          </button>
          <button
            type='submit'
            disabled={isLoading}
            className='px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700'
          >
            {isLoading ? "Recording..." : "Confirm & Record Payout"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
