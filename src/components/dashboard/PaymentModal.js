"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import Modal from "../ui/Modal";
import toast from "react-hot-toast";
import { Crown } from "lucide-react";

export default function PaymentModal({ isOpen, onClose }) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // This function remains the same. It simulates a "purchase"
  // by giving the user 30 days of premium access.
  const handlePurchase = async () => {
    if (!user) {
      toast.error("You must be logged in to make a purchase.");
      return;
    }
    setIsLoading(true);
    const loadingToast = toast.loading("Activating your free trial...");

    try {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);

      const userDocRef = doc(db, "users", user.uid);

      await setDoc(
        userDocRef,
        {
          premiumAccessExpires: expiryDate,
        },
        { merge: true }
      );

      toast.success("Free trial activated! You now have premium access.", {
        id: loadingToast,
      });
      onClose();
    } catch (error) {
      toast.error("An error occurred. Please try again.", { id: loadingToast });
      console.error("Payment error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title='Start Your Free Premium Trial'
    >
      <div className='text-center p-6'>
        <div className='flex justify-center mb-4'>
          <div className='p-4 bg-amber-100 rounded-full'>
            <Crown className='h-10 w-10 text-amber-500' />
          </div>
        </div>
        <h3 className='text-2xl font-bold text-slate-900'>
          Unlock All Features
        </h3>
        <p className='mt-2 text-slate-600'>
          Get unlimited access to all our premium mock tests and blog posts.
        </p>

        {/* --- THIS IS THE UPDATED UI --- */}
        <div className='my-8 p-6 bg-slate-100 rounded-lg'>
          <p className='text-lg font-semibold text-slate-800'>Monthly Plan</p>
          <div className='flex justify-center items-baseline gap-3'>
            <p className='text-2xl font-bold text-slate-400 line-through'>
              ₹10/Month
            </p>
            <p className='text-4xl font-extrabold text-indigo-600'>Free</p>
          </div>
          <p className='text-md font-medium text-slate-500 mt-1'>
            for the first 30 days
          </p>
        </div>

        <button
          onClick={handlePurchase}
          disabled={isLoading}
          className='w-full px-8 py-4 bg-green-600 text-white font-bold rounded-lg text-lg hover:bg-green-700 disabled:bg-green-400'
        >
          {isLoading ? "Activating..." : "Start Free Trial"}
        </button>
        <p className='text-xs text-slate-500 mt-4'>
          No payment required. You can cancel anytime.
        </p>
      </div>
    </Modal>
  );
}
