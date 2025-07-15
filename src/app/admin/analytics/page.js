// src/app/admin/analytics/page.js

"use client";

import { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import toast from "react-hot-toast";
import UserAnalyticsCard from "@/components/admin/UserAnalyticsCard";
import UserTestsDetailModal from "@/components/admin/UserTestsDetailModal";

export default function AdminAnalyticsPage() {
  const [userStats, setUserStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch all documents from the lean 'testAnalytics' collection
      const analyticsSnapshot = await getDocs(collection(db, "testAnalytics"));
      const allAnalytics = analyticsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      if (allAnalytics.length === 0) {
        setUserStats([]);
        setLoading(false);
        return;
      }

      // 2. Get all unique user IDs from the analytics data
      const userIds = [
        ...new Set(allAnalytics.map((analytic) => analytic.createdBy)),
      ];
      if (userIds.length === 0) {
        setUserStats([]);
        setLoading(false);
        return;
      }

      // 3. Fetch all corresponding user and test documents
      const usersQuery = query(
        collection(db, "users"),
        where("uid", "in", userIds)
      );
      const testsQuery = query(
        collection(db, "mockTests"),
        where(
          "__name__",
          "in",
          allAnalytics.map((a) => a.testId)
        )
      );

      const [usersSnapshot, testsSnapshot] = await Promise.all([
        getDocs(usersQuery),
        getDocs(testsQuery),
      ]);

      const usersMap = new Map(
        usersSnapshot.docs.map((doc) => [doc.data().uid, doc.data()])
      );
      const testsMap = new Map(
        testsSnapshot.docs.map((doc) => [doc.id, doc.data()])
      );

      // 4. Aggregate stats for each user
      const stats = userIds
        .map((uid) => {
          const user = usersMap.get(uid);
          if (!user) return null;

          const userAnalytics = allAnalytics.filter(
            (analytic) => analytic.createdBy === uid
          );
          const totalImpressions = userAnalytics.reduce(
            (acc, analytic) => acc + (analytic.impressionCount || 0),
            0
          );
          const totalUniqueTakers = userAnalytics.reduce(
            (acc, analytic) => acc + (analytic.uniqueTakers?.length || 0),
            0
          );

          const userTestsWithTitles = userAnalytics.map((analytic) => ({
            ...analytic,
            title: testsMap.get(analytic.testId)?.title || "Unknown Test",
          }));

          return {
            userId: uid,
            userName: user.name,
            userEmail: user.email,
            testsCreated: userAnalytics.length,
            totalImpressions,
            totalUniqueTakers,
            tests: userTestsWithTitles,
          };
        })
        .filter(Boolean);

      setUserStats(
        stats.sort((a, b) => b.totalUniqueTakers - a.totalUniqueTakers)
      );
    } catch (error) {
      console.error("Error fetching analytics data:", error);
      toast.error("Failed to load analytics data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return <div className='text-center p-12'>Loading Creator Analytics...</div>;
  }

  return (
    <>
      <UserTestsDetailModal
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        userStats={selectedUser}
      />
      <div>
        <h1 className='text-3xl font-bold text-slate-900 mb-6'>
          Creator Analytics
        </h1>
        {userStats.length > 0 ? (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {userStats.map((stats) => (
              <UserAnalyticsCard
                key={stats.userId}
                userStats={stats}
                onCardClick={setSelectedUser}
              />
            ))}
          </div>
        ) : (
          <div className='text-center py-12 bg-white rounded-xl shadow border'>
            <h3 className='text-lg font-semibold text-slate-900'>
              No User-Created Tests Found
            </h3>
            <p className='mt-1 text-sm text-slate-500'>
              Analytics will appear here once users start creating tests.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
