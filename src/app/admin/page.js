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
import {
  BarChart,
  FileText,
  MessageSquare,
  Users,
  UserCheck,
} from "lucide-react";
import StatCard from "@/components/admin/StatCard"; // Import new StatCard
import UserListModal from "@/components/admin/UserListModal"; // Import new Modal

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

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    postCount: 0,
    testCount: 0,
    contactCount: 0,
    todaySubmissions: 0,
    userCount: 0, // New stat
  });
  const [loading, setLoading] = useState(true);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false); // State for the modal

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [
          postCount,
          testCount,
          contactCount,
          todaySubmissions,
          userCount,
        ] = await Promise.all([
          getCollectionCount("posts"),
          getCollectionCount("mockTests"),
          getCollectionCount("contacts"),
          getTodaySubmissionsCount(),
          getCollectionCount("users"), // Fetch user count
        ]);

        setStats({
          postCount,
          testCount,
          contactCount,
          todaySubmissions,
          userCount,
        });
      } catch (error) {
        console.error("Failed to fetch admin stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <>
      {/* Add the modal to the page, controlled by state */}
      <UserListModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
      />

      <div>
        <h1 className='text-3xl font-bold text-slate-900 mb-6'>
          Admin Dashboard
        </h1>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6'>
          {/* New "Total Users" StatCard */}
          <StatCard
            title='Total Users'
            value={stats.userCount}
            icon={<UserCheck />}
            isLoading={loading}
            onClick={() => setIsUserModalOpen(true)} // Make it clickable
          />
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
            Use the sidebar navigation on the left to manage all website
            content.
          </p>
        </div>
      </div>
    </>
  );
}
