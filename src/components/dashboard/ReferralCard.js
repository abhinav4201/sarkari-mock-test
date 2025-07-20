// src/components/dashboard/ReferralCard.js
"use client";

import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { Gift, Copy, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function ReferralCard() {
  const { user, userProfile, isLibraryUser, isPremium } = useAuth();
  const [referralCode, setReferralCode] = useState(userProfile?.referralCode);

//   if (isLibraryUser) {
//     return null;
//   }

  useEffect(() => {
    if (user && !referralCode) {
      const generateReferralCode = async () => {
        const newCode = `REF-${user.uid.substring(0, 6).toUpperCase()}`;
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, { referralCode: newCode });
        setReferralCode(newCode);
      };
      generateReferralCode();
    }
  }, [user, referralCode]);

  if (!user || !referralCode) {
    return null;
  }

  const referralLink = `${window.location.origin}/join?ref=${referralCode}`;
  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success("Referral link copied!");
  };

  const rewardText = isPremium
    ? "get a FREE 30-day extension on your subscription!"
    : "get 1 FREE premium test credit!";

  const referralCount = userProfile?.referralCount || 0;

  return (
    <div className='mt-8 bg-white p-6 rounded-2xl shadow-lg border border-slate-200'>
      <div className='flex items-center gap-3'>
        <div className='bg-pink-100 p-3 rounded-full'>
          <Gift className='h-6 w-6 text-pink-600' />
        </div>
        <h2 className='text-2xl font-bold text-slate-900'>Share & Earn</h2>
      </div>
      <p className='mt-2 text-slate-600'>
        Refer 10 friends who upgrade to premium and you'll{" "}
        <strong className='font-bold text-pink-600'>{rewardText}</strong>
      </p>

      {/* --- NEW: Progress Tracker --- */}
      <div className='mt-4'>
        <div className='flex justify-between items-center mb-1'>
          <span className='text-sm font-medium text-slate-700'>
            Your Progress
          </span>
          <span className='text-sm font-bold text-slate-900'>
            {referralCount} / 10 Referrals
          </span>
        </div>
        <div className='w-full bg-slate-200 rounded-full h-2.5'>
          <div
            className='bg-pink-500 h-2.5 rounded-full'
            style={{ width: `${referralCount * 10}%` }}
          ></div>
        </div>
      </div>
      {/* --- END OF NEW SECTION --- */}

      <div className='mt-4 flex items-center gap-2'>
        <input
          type='text'
          readOnly
          value={referralLink}
          className='w-full bg-slate-100 p-2 border border-slate-300 rounded-md text-sm text-slate-700'
        />
        <button
          onClick={copyToClipboard}
          className='p-3 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300'
        >
          <Copy size={16} />
        </button>
      </div>
    </div>
  );
}
