"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import AdminStatsGrid from "./AdminStatsGrid";
import {
  BarChartHorizontalBig,
  ClipboardCheck,
  UserCheck,
  BarChart,
  Lock,
  FileText,
  Users,
  MessageSquare,
} from "lucide-react";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  Timestamp,
  where,
} from "firebase/firestore";

// Helper functions remain the same
const getCollectionCount = (collectionName) =>
  getDocs(collection(db, collectionName)).then((snap) => snap.size);
const getTodaySubmissionsCount = () => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const q = query(
    collection(db, "contacts"),
    where("submittedAt", ">=", Timestamp.fromDate(startOfDay))
  );
  return getDocs(q).then((snap) => snap.size);
};
const getRestrictedTestCount = () => {
  const q = query(
    collection(db, "mockTests"),
    where("isRestricted", "==", true)
  );
  return getDocs(q).then((snap) => snap.size);
};

// --- THIS IS THE CORRECTED CONFIGURATION ---
// Every card now has a defined action.
const STAT_CONFIG = {
  attempts: {
    title: "Total Test Attempts",
    icon: ClipboardCheck,
    fetcher: () => getCollectionCount("mockTestResults"),
    action: { type: "modal", target: "attempts" },
  },
  users: {
    title: "Total Users",
    icon: UserCheck,
    fetcher: () => getCollectionCount("users"),
    action: { type: "modal", target: "users" },
  },
  tests: {
    title: "Total Mock Tests",
    icon: BarChart,
    fetcher: () => getCollectionCount("mockTests"),
    action: { type: "modal", target: "tests" },
  },
  restricted: {
    title: "Restricted Tests",
    icon: Lock,
    fetcher: () => getRestrictedTestCount(),
    action: { type: "modal", target: "restricted" },
  },
  posts: {
    title: "Total Blog Posts",
    icon: FileText,
    fetcher: () => getCollectionCount("posts"),
    action: { type: "navigate", target: "/admin/blog" },
  },
  contacts: {
    title: "Total Contacts",
    icon: Users,
    fetcher: () => getCollectionCount("contacts"),
    action: { type: "navigate", target: "/admin/contacts" },
  },
  submissions: {
    title: "Submissions Today",
    icon: MessageSquare,
    fetcher: () => getTodaySubmissionsCount(),
    action: { type: "navigate", target: "/admin/contacts" },
  },
};

export default function LazyAdminStats({ onCardClick }) {
  const router = useRouter();
  const [showContainer, setShowContainer] = useState(false);
  const [statsCache, setStatsCache] = useState({});
  const [loadingKey, setLoadingKey] = useState(null);
  const [activeKey, setActiveKey] = useState(null);

  const timerRef = useRef(null);
  const wrapperRef = useRef(null);

  const hideAnalytics = () => {
    setShowContainer(false);
    setActiveKey(null);
  };

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(hideAnalytics, 60000);
  }, []);

  useEffect(() => {
    if (showContainer) {
      resetTimer();
      const wrapper = wrapperRef.current;
      wrapper?.addEventListener("mousemove", resetTimer);
      wrapper?.addEventListener("touchstart", resetTimer);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      const wrapper = wrapperRef.current;
      wrapper?.removeEventListener("mousemove", resetTimer);
      wrapper?.removeEventListener("touchstart", resetTimer);
    };
  }, [showContainer, resetTimer]);

  // --- THIS IS THE CORRECTED CLICK HANDLER LOGIC ---
  const handleCardClick = async (key) => {
    resetTimer();

    // If clicking the same card that is already active, perform its action
    if (activeKey === key) {
      const action = STAT_CONFIG[key].action;
      if (action) {
        if (action.type === "modal") {
          onCardClick(action.target); // This calls the function in page.js to open the modal
        } else if (action.type === "navigate") {
          router.push(action.target); // This navigates to the specified page
        }
      }
      return;
    }

    // If clicking a new card, just make it active and fetch its data
    setActiveKey(key);

    if (statsCache[key] === undefined) {
      setLoadingKey(key);
      try {
        const result = await STAT_CONFIG[key].fetcher();
        setStatsCache((prev) => ({ ...prev, [key]: result }));
      } catch (error) {
        console.error(`Failed to fetch stat for ${key}:`, error);
        setStatsCache((prev) => ({ ...prev, [key]: "Error" }));
      } finally {
        setLoadingKey(null);
      }
    }
  };

  if (!showContainer) {
    return (
      <div className='mb-6'>
        <button
          onClick={() => setShowContainer(true)}
          className='w-full bg-white p-6 rounded-2xl shadow-lg border border-slate-200 hover:border-indigo-400 hover:shadow-xl transition-all flex justify-between items-center group'
        >
          <div>
            <h2 className='text-2xl font-bold text-slate-900 flex items-center gap-3'>
              <BarChartHorizontalBig className='text-indigo-500' />
              Show Overall Analytics
            </h2>
            <p className='text-slate-600 mt-1'>
              Click to reveal analytics cards. Data is loaded on demand.
            </p>
          </div>
        </button>
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className='mb-6'>
      <AdminStatsGrid
        statsConfig={STAT_CONFIG}
        statsCache={statsCache}
        loadingKey={loadingKey}
        activeKey={activeKey}
        onCardClick={handleCardClick}
      />
    </div>
  );
}
