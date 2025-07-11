"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, setDoc, increment } from "firebase/firestore";
import Modal from "../ui/Modal";
import toast from "react-hot-toast";
import { Crown, ShieldCheck, ShoppingCart } from "lucide-react";

// This is the content shown when the user can start a free trial.
const FreeTrialContent = ({ onActivate, isLoading }) => (
  <div>
    <h3 className='text-2xl font-bold text-slate-900'>Unlock All Features</h3>
    <p className='mt-2 text-slate-600'>
      Get unlimited access to all our premium mock tests and blog posts.
    </p>
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
      onClick={onActivate}
      disabled={isLoading}
      className='w-full px-8 py-4 bg-green-600 text-white font-bold rounded-lg text-lg hover:bg-green-700 disabled:bg-green-400'
    >
      {isLoading ? "Activating..." : "Start Free Trial"}
    </button>
    <p className='text-xs text-slate-500 mt-4'>
      No payment required. You can cancel anytime.
    </p>
  </div>
);

// This is the content shown when the user has used all their trials and must pay.
const SubscribeContent = () => (
  <div>
    <h3 className='text-2xl font-bold text-slate-900'>
      Your Free Trials Have Ended
    </h3>
    <p className='mt-2 text-slate-600'>
      Please subscribe to continue enjoying premium access.
    </p>
    <div className='my-8 p-6 bg-slate-100 rounded-lg'>
      <p className='text-lg font-semibold text-slate-800'>Monthly Plan</p>
      <p className='text-4xl font-extrabold text-indigo-600'>
        ₹10 <span className='text-lg font-medium text-slate-500'>/ month</span>
      </p>
    </div>
    <button className='w-full px-8 py-4 bg-indigo-600 text-white font-bold rounded-lg text-lg hover:bg-indigo-700'>
      <span className='flex justify-center items-center gap-2'>
        <ShoppingCart size={20} /> Subscribe Now
      </span>
    </button>
    <p className='text-xs text-slate-500 mt-4'>
      Future Home of Your Payment Gateway
    </p>
  </div>
);

// This is the content shown when the user already has an active subscription.
const ActiveSubscriptionContent = () => (
  <div>
    <div className='p-4 bg-green-100 border border-green-200 rounded-lg flex items-center gap-4'>
      <ShieldCheck className='h-10 w-10 text-green-600' />
      <div>
        <h3 className='text-lg font-bold text-green-800'>
          Premium Access Active
        </h3>
        <p className='text-green-700'>
          You have full access to all premium content.
        </p>
      </div>
    </div>
  </div>
);

export default function PaymentModal({ isOpen, onClose }) {
  // --- UPDATED: Get all necessary status flags from the context ---
  const { user, isPremium, freeTrialCount } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // This function now also increments the trial count
  const handleActivateTrial = async () => {
    if (!user) return toast.error("You must be logged in.");
    if (freeTrialCount >= 2)
      return toast.error("You have already used your free trials.");

    setIsLoading(true);
    const loadingToast = toast.loading("Activating your free trial...");

    try {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);
      const userDocRef = doc(db, "users", user.uid);

      // Using setDoc with merge to update both fields at once
      await setDoc(
        userDocRef,
        {
          premiumAccessExpires: expiryDate,
          freeTrialCount: increment(1), // Securely increment the count on the server
        },
        { merge: true }
      );

      toast.success("Free trial activated!", { id: loadingToast });
      onClose();
    } catch (error) {
      toast.error("An error occurred. Please try again.", { id: loadingToast });
      console.error("Trial activation error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- NEW: Conditionally render content based on user status ---
  const renderContent = () => {
    if (isPremium) {
      return <ActiveSubscriptionContent />;
    }
    if (freeTrialCount < 2) {
      return (
        <FreeTrialContent
          onActivate={handleActivateTrial}
          isLoading={isLoading}
        />
      );
    }
    // This is the space for your future payment gateway button
    return <SubscribeContent />;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title='Premium Subscription'>
      <div className='text-center p-6'>
        <div className='flex justify-center mb-6'>
          <div className='p-4 bg-amber-100 rounded-full'>
            <Crown className='h-10 w-10 text-amber-500' />
          </div>
        </div>
        {renderContent()}
      </div>
    </Modal>
  );
}
