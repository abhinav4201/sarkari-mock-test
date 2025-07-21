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
import {
  ArrowRight,
  TrendingUp,
  Sun,
  Target,
  Users,
  Wrench,
  History,
  BookOpen,
  Atom,
} from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import TravelingModeCard from "@/components/dashboard/TravelingModeCard";
import StudyPlanner from "@/components/dashboard/StudyPlanner";

// Reusable decorative SVG patterns for section backgrounds
const BookPattern = () => <BookOpen className='h-64 w-64' />;
const AtomPattern = () => <Atom className='h-64 w-64' />;

const patterns = {
  book: <BookPattern />,
  atom: <AtomPattern />,
};

// The new, heavily styled DashboardSection component
const DashboardSection = ({ title, icon, children, theme = "purple" }) => {
  const themes = {
    purple: {
      gradient: "from-red-600 to-white",
      iconColor: "text-red-600",
      pattern: patterns.book,
    },
    green: {
      gradient: "from-teal-500 to-green-600",
      iconColor: "text-green-600",
      pattern: patterns.atom,
    },
    amber: {
      gradient: "from-amber-500 to-orange-600",
      iconColor: "text-amber-600",
      pattern: patterns.book,
    },
    sky: {
      gradient: "from-sky-500 to-cyan-600",
      iconColor: "text-sky-600",
      pattern: patterns.atom,
    },
    slate: {
      gradient: "from-slate-700 to-gray-800",
      iconColor: "text-slate-600",
      pattern: patterns.book,
    },
  };

  const currentTheme = themes[theme] || themes.purple;

  return (
    <section
      className={`relative mb-12 p-6 sm:p-8 rounded-3xl shadow-2xl text-white overflow-hidden bg-gradient-to-br ${currentTheme.gradient}`}
    >
      <div className='absolute top-0 right-0 -mr-24 -mt-12 z-0 opacity-10 transform-gpu scale-150 text-white'>
        {currentTheme.pattern}
      </div>

      <div className='relative z-10'>
        <h2 className='text-3xl font-bold mb-6 flex items-center gap-4'>
          <div className={`bg-white p-3 rounded-full shadow-md`}>
            {React.cloneElement(icon, {
              className: `h-7 w-7 ${currentTheme.iconColor}`,
            })}
          </div>
          {title}
        </h2>
        <div className='space-y-8'>{children}</div>
      </div>
    </section>
  );
};

// Helper functions (getDailyVocabulary, getDailyGk) remain the same...
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
  // Only return data if it was created today
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
  // Only return data if it was created today
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
      <div className='bg-slate-50 min-h-screen'>
        <div className='container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12'>
          <WelcomeHeader />
          <div className='mt-8'>
            <DashboardSection
              title='Your Daily Briefing'
              icon={<Sun />}
              colorScheme='amber'
            >
              <LazyLibraryStats />
            </DashboardSection>

            <DashboardSection
              title='Tools & Resources'
              icon={<Wrench />}
              theme='slate'
            >
              <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
                <SubscriptionStatusCard
                  onUpgradeClick={() => setIsPaymentModalOpen(true)}
                />
                <TravelingModeCard />
                <Link
                  href='/library-dashboard/trending'
                  className='w-full bg-white p-6 rounded-2xl shadow-lg border border-slate-200 hover:border-indigo-400 hover:shadow-xl transition-all flex justify-between items-center group'
                >
                  <div>
                    <h2 className='text-2xl font-bold text-slate-900 flex items-center gap-3'>
                      <TrendingUp className='text-indigo-500' />
                      Trending Tests
                    </h2>
                  </div>
                  <ArrowRight className='h-8 w-8 text-slate-400 group-hover:text-indigo-500 transition-transform group-hover:translate-x-1' />
                </Link>
              </div>
            </DashboardSection>

            <DashboardSection
              title='Plan & Progress'
              icon={<Target />}
              theme='green'
            >
              <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
                <DailyChallenges />
                <StudyPlanner />
              </div>
              <LazyProgressChart />
            </DashboardSection>

            <DashboardSection
              title='Community & Growth'
              icon={<Users />}
              theme='sky'
            >
              <Achievements />
              <div className='mt-8 grid grid-cols-1 md:grid-cols-2 gap-8'>
                <ReferralCard />
                <PlatformTrends />
              </div>
            </DashboardSection>

            <DashboardSection
              title='History & Review'
              icon={<History />}
              theme='purple'
            >
              <div className='grid grid-cols-1 lg:grid-cols-3 gap-8 items-start'>
                <div className='lg:col-span-2'>
                  <LazyTestHistory />
                </div>
                <div className='lg:col-span-1'>
                  <DailyDose
                    vocabulary={vocabulary}
                    gk={gk}
                    isLoading={loading}
                  />
                </div>
              </div>
            </DashboardSection>
          </div>
        </div>
      </div>
    </>
  );
}
