"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { BarChart, FileText, MessageSquare, Users } from "lucide-react";

// --- HELPER FUNCTIONS MOVED BACK HERE FOR CLARITY ---
// Helper function to get counts
const getCollectionCount = (collectionName) => {
  return getDocs(collection(db, collectionName)).then((snap) => snap.size);
};

// Helper function to get submissions from today
const getTodaySubmissionsCount = () => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const startOfDayTimestamp = Timestamp.fromDate(startOfDay);
  const q = query(
    collection(db, "contacts"),
    where("submittedAt", ">=", startOfDayTimestamp)
  );
  return getDocs(q).then((snap) => snap.size);
};

// The StatCard component
const StatCard = ({ title, value, icon, isLoading }) => (
  <div className='bg-white p-6 rounded-2xl shadow-lg border border-slate-100 flex items-center justify-between'>
    {isLoading ? (
      <div className='w-full animate-pulse'>
        <div className='h-5 bg-slate-200 rounded w-3/4 mb-3'></div>
        <div className='h-9 bg-slate-200 rounded w-1/2'></div>
      </div>
    ) : (
      <>
        <div>
          <p className='text-sm font-medium text-slate-700'>{title}</p>
          <p className='text-3xl font-bold text-slate-900'>{value}</p>
        </div>
        <div className='bg-indigo-100 text-indigo-600 p-3 rounded-full'>
          {icon}
        </div>
      </>
    )}
  </div>
);

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    postCount: 0,
    testCount: 0,
    contactCount: 0,
    todaySubmissions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch all stats in parallel using the helper functions
        const [postCount, testCount, contactCount, todaySubmissions] =
          await Promise.all([
            getCollectionCount("posts"),
            getCollectionCount("mockTests"),
            getCollectionCount("contacts"),
            getTodaySubmissionsCount(),
          ]);

        setStats({ postCount, testCount, contactCount, todaySubmissions });
      } catch (error) {
        console.error("Failed to fetch admin stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div>
      <h1 className='text-3xl font-bold text-slate-900 mb-6'>
        Admin Dashboard
      </h1>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <StatCard
          title='Total Mock Tests'
          value={stats.testCount}
          icon={<BarChart />}
          isLoading={loading}
        />
        <StatCard
          title='Total Blog Posts'
          value={stats.postCount}
          icon={<FileText />}
          isLoading={loading}
        />
        <StatCard
          title='Total Contacts'
          value={stats.contactCount}
          icon={<Users />}
          isLoading={loading}
        />
        <StatCard
          title='Submissions Today'
          value={stats.todaySubmissions}
          icon={<MessageSquare />}
          isLoading={loading}
        />
      </div>
      <div className='mt-8 bg-white p-6 rounded-2xl shadow-lg'>
        <h2 className='text-xl font-semibold text-slate-900'>
          Welcome, Admin!
        </h2>
        <p className='mt-2 text-slate-700'>
          Use the sidebar navigation on the left to manage all website content.
        </p>
      </div>
    </div>
  );
}
