// src/app/dashboard/monetization/payouts/page.js

"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import toast from "react-hot-toast";
import UserEligibilityCard from "@/components/dashboard/UserEligibilityCard";
import CreatorPayouts from "@/components/dashboard/CreatorPayouts";
import CreatorEarnings from "@/components/dashboard/CreatorEarnings"; 

export default function PayoutsPage() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [earnings, setEarnings] = useState({});
  const [userStats, setUserStats] = useState({
    testsCreated: 0,
    totalUniqueTakers: 0,
    monetizationStatus: "none",
  });

  const fetchData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);

    try {
      // 1. Fetch user profile
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      const profileData = userSnap.exists() ? userSnap.data() : null;
      setUserProfile(profileData);

      // 2. Fetch user's aggregated test analytics for eligibility check
      const analyticsQuery = query(
        collection(db, "testAnalytics"),
        where("createdBy", "==", user.uid)
      );
      const analyticsSnapshot = await getDocs(analyticsQuery);
      const allAnalytics = analyticsSnapshot.docs.map((doc) => doc.data());

      const stats = {
        testsCreated: allAnalytics.length,
        totalUniqueTakers: allAnalytics.reduce(
          (acc, analytic) => acc + (analytic.uniqueTakers?.length || 0),
          0
        ),
        monetizationStatus: profileData?.monetizationStatus || "none",
      };
      setUserStats(stats);

      // 3. Fetch earnings data if the user is approved
      if (profileData?.monetizationStatus === "approved") {
        const earningsRef = doc(db, "earnings", user.uid);
        const earningsSnap = await getDoc(earningsRef);
        if (earningsSnap.exists()) {
          setEarnings(earningsSnap.data());
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load your data.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      fetchData();
    }
  }, [authLoading, fetchData]);

  if (loading || authLoading) {
    return <div className='text-center p-12'>Loading...</div>;
  }

  return (
    <div className='max-w-4xl mx-auto'>
      <div className='text-center mb-10'>
        <h1 className='text-4xl font-extrabold text-slate-900'>
          Payouts & Earnings
        </h1>
        <p className='mt-2 text-lg text-slate-600'>
          Manage your monetization status and payment details.
        </p>
      </div>

      {/* The main content area */}
      {userProfile?.monetizationStatus === "approved" ? (
        <div>
          <CreatorPayouts
            userProfile={userProfile}
            earnings={earnings}
            onUpdate={fetchData}
          />
          <CreatorEarnings />
        </div>
      ) : (
        <UserEligibilityCard userStats={userStats} onApply={fetchData} />
      )}
    </div>
  );
}
