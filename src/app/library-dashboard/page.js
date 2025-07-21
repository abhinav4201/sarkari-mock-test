"use client";

import Achievements from "@/components/dashboard/Achievements";
import DailyChallenges from "@/components/dashboard/DailyChallenges";
import DailyDose from "@/components/dashboard/DailyDose";
import LazyLibraryStats from "@/components/dashboard/LazyLibraryStats";
import LazyProgressChart from "@/components/dashboard/LazyProgressChart";
import LazyTestHistory from "@/components/dashboard/LazyTestHistory";
import PaymentModal from "@/components/dashboard/PaymentModal";
import PlatformTrends from "@/components/dashboard/PlatformTrends";
import ReferralCard from "@/components/dashboard/ReferralCard";
import SubscriptionStatusCard from "@/components/dashboard/SubscriptionStatusCard";
import WelcomeHeader from "@/components/dashboard/WelcomeHeader";
import { db } from "@/lib/firebase";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { ArrowRight, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import TravelingModeCard from "@/components/dashboard/TravelingModeCard";

async function getDailyVocabulary() {
  const q = query(
    collection(db, "dailyVocabulary"),
    orderBy("createdAt", "desc"),
    limit(1)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const data = snapshot.docs[0].data();
  const docDate = data.createdAt.toDate();
  const today = new Date();
  if (docDate.toDateString() === today.toDateString()) {
    return data;
  }
  return null;
}

async function getDailyGk() {
  const q = query(
    collection(db, "dailyGk"),
    orderBy("createdAt", "desc"),
    limit(1)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const data = snapshot.docs[0].data();
  const docDate = data.createdAt.toDate();
  const today = new Date();
  if (docDate.toDateString() === today.toDateString()) {
    return data;
  }
  return null;
}

export default function LibraryDashboardPage() {
  const [vocabulary, setVocabulary] = useState(null);
  const [gk, setGk] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [vocabData, gkData] = await Promise.all([
          getDailyVocabulary(),
          getDailyGk(),
        ]);
        setVocabulary(vocabData);
        setGk(gkData);
      } catch (error) {
        toast.error("Failed to load daily content.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  return (
    <>
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
      />
      <div className='container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12'>
        <WelcomeHeader />

        <div className='mt-8'>
          <SubscriptionStatusCard
            onUpgradeClick={() => setIsPaymentModalOpen(true)}
          />
        </div>
        <TravelingModeCard />
        <div className='mt-8'>
          <LazyLibraryStats />
        </div>

        <div className='mt-8'>
          <DailyChallenges />
        </div>

        <div className='mt-8'>
          <Achievements />
        </div>

        <div className='mt-8'>
          <LazyProgressChart />
        </div>
        <div className='mt-8'>
          <ReferralCard />
        </div>
        <div className='mt-8'>
          <PlatformTrends />
        </div>

        {/* NEW: Link to the dedicated Trending page for library users */}
        <div className='mt-8'>
          <Link
            href='/library-dashboard/trending'
            className='w-full bg-white p-6 rounded-2xl shadow-lg border border-slate-200 hover:border-indigo-400 hover:shadow-xl transition-all flex justify-between items-center group'
          >
            <div>
              <h2 className='text-2xl font-bold text-slate-900 flex items-center gap-3'>
                <TrendingUp className='text-indigo-500' />
                Trending Tests
              </h2>
              <p className='text-slate-600 mt-1'>
                See what tests are popular right now.
              </p>
            </div>
            <ArrowRight className='h-8 w-8 text-slate-400 group-hover:text-indigo-500 transition-transform group-hover:translate-x-1' />
          </Link>
        </div>

        <div className='mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start'>
          <div className='lg:col-span-2'>
            <div className='bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-slate-200'>
              <h2 className='text-2xl font-bold text-slate-900 mb-6'>
                Your Test History
              </h2>
              <div className='lg:col-span-2'>
                <LazyTestHistory />
              </div>
            </div>
          </div>

          <div className='lg:col-span-1'>
            <div className='bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-slate-200'>
              <DailyDose vocabulary={vocabulary} gk={gk} isLoading={loading} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
