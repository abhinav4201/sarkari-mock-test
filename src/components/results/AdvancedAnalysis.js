// components/results/AdvancedAnalysis.js
"use client";

import { useState, useEffect } from "react";
import TimeAnalysis from "./TimeAnalysis";
import TopicPerformance from "./TopicPerformance";

export default function AdvancedAnalysis({ resultId }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const res = await fetch(`/api/results/${resultId}/analysis`);
        if (!res.ok) {
          throw new Error("Failed to fetch analysis data");
        }
        const data = await res.json();
        setAnalysis(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalysis();
  }, [resultId]);

  if (loading) {
    return <div className='text-center p-8'>Loading advanced analysis...</div>;
  }

  if (error) {
    return <div className='text-center p-8 text-red-600'>Error: {error}</div>;
  }

  if (!analysis) {
    return null;
  }

  return (
    <div className='mt-12'>
      <h2 className='text-2xl font-bold mb-6 text-slate-900'>
        Advanced Analysis
      </h2>
      <div className='space-y-10'>
        <TimeAnalysis data={analysis.timeAnalysis} />
        <TopicPerformance data={analysis.topicPerformance} />
      </div>
    </div>
  );
}
