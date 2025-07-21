// src/components/dashboard/ReferralCard.js
"use client";

import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { Gift, Copy, Award } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function ReferralCard() {
  const { user, userProfile, isPremium } = useAuth();
  const [referralCode, setReferralCode] = useState(userProfile?.referralCode);

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
    ? "get a FREE 30-day subscription extension"
    : "get 1 FREE premium test credit";

  const referralCount = userProfile?.referralCount || 0;

  // If user is an ambassador, show a special message
  if (userProfile?.isAmbassador) {
    return (
      <div className='mt-8 bg-gradient-to-r from-amber-400 to-yellow-500 p-6 rounded-2xl shadow-lg border border-amber-500 text-white'>
        <div className='flex items-center gap-3'>
          <div className='bg-white/20 p-3 rounded-full'>
            <Award className='h-6 w-6 text-white' />
          </div>
          <h2 className='text-2xl font-bold'>You are a Platform Ambassador!</h2>
        </div>
        <p className='mt-2 opacity-90'>
          Thank you for your incredible contribution to our community. Your
          special status is now visible on the leaderboard!
        </p>
      </div>
    );
  }

  return (
    <div className='mt-8 bg-white p-6 rounded-2xl shadow-lg border border-slate-200'>
      <div className='flex items-center gap-3'>
        <div className='bg-pink-100 p-3 rounded-full'>
          <Gift className='h-6 w-6 text-pink-600' />
        </div>
        <h2 className='text-2xl font-bold text-slate-900'>
          The Ambassador Program
        </h2>
      </div>
      <p className='mt-2 text-slate-600'>
        Refer 10 friends who upgrade to premium to{" "}
        <strong className='font-bold text-pink-600'>{rewardText}</strong> and
        unlock the permanent{" "}
        <strong className='font-bold text-amber-600'>Ambassador</strong> rank!
      </p>

      <div className='mt-4'>
        <div className='flex justify-between items-center mb-1'>
          <span className='text-sm font-medium text-slate-700'>
            Your Progress to Ambassador
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
