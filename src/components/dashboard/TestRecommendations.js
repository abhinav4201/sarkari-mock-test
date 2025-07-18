"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import TestCard from "../mock-tests/TestCard";
import toast from "react-hot-toast";

const RecommendationSection = ({ title, tests, loading }) => (
  <div>
    <h3 className='text-2xl font-bold text-slate-900 mb-4'>{title}</h3>
    {loading ? (
      <p>Finding recommendations...</p>
    ) : tests.length > 0 ? (
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        {tests.map((test) => (
          <TestCard key={test.id} test={test} hasTaken={false} />
        ))}
      </div>
    ) : (
      <p className='text-slate-600 p-4 bg-slate-50 rounded-lg'>
        No new recommendations for you right now. Keep taking tests!
      </p>
    )}
  </div>
);

export default function TestRecommendations() {
  const { user } = useAuth();
  const [performanceRecs, setPerformanceRecs] = useState([]);
  const [popularRecs, setPopularRecs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchRecommendations = async () => {
      try {
        const idToken = await user.getIdToken();
        const headers = { Authorization: `Bearer ${idToken}` };

        // Fetch both sets of recommendations in parallel
        const [perfRes, popRes] = await Promise.all([
          fetch("/api/user/recommendations/performance", { headers }),
          fetch("/api/tests/recommendations/popular", { headers }),
        ]);

        if (!perfRes.ok || !popRes.ok) {
          throw new Error("Failed to fetch recommendations.");
        }

        const perfData = await perfRes.json();
        const popData = await popRes.json();

        setPerformanceRecs(perfData);
        setPopularRecs(popData);
      } catch (error) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [user]);

  // Don't render the component if there's nothing to show
  if (!loading && performanceRecs.length === 0 && popularRecs.length === 0) {
    return null;
  }

  return (
    <div className='space-y-12'>
      {performanceRecs.length > 0 && (
        <RecommendationSection
          title='Improve Your Weak Areas'
          tests={performanceRecs}
          loading={loading}
        />
      )}
      {popularRecs.length > 0 && (
        <RecommendationSection
          title='Trending Tests'
          tests={popularRecs}
          loading={loading}
        />
      )}
    </div>
  );
}
