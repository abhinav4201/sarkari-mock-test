// src/components/results/ComparativeAnalysis.js

"use client";

import { Award, BarChart3, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

const StatCard = ({ icon, title, value, unit, colorClass }) => (
  <div className={`flex items-center p-4 bg-slate-50 rounded-lg ${colorClass}`}>
    <div className='mr-4'>{icon}</div>
    <div>
      <p className='text-sm text-slate-600'>{title}</p>
      <p className='text-2xl font-bold text-slate-900'>
        {value}
        <span className='text-lg font-medium'>{unit}</span>
      </p>
    </div>
  </div>
);

export default function ComparativeAnalysis({ resultId }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (resultId) {
      fetch(`/api/results/${resultId}/comparative-analysis`)
        .then((res) => res.json())
        .then((data) => {
          setStats(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [resultId]);

  if (loading) {
    return <div className='mt-8 text-center'>Loading analysis...</div>;
  }

  if (!stats) {
    return null;
  }

  return (
    <div className='p-6 bg-slate-50 rounded-lg border shadow-lg'>
      <h3 className='text-xl font-bold text-slate-900 mb-4 text-center '>
        Your Performance Snapshot
      </h3>
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <StatCard
          icon={<TrendingUp className='h-8 w-8 text-blue-500' />}
          title='Percentile'
          value={stats.percentile}
          unit='%'
          colorClass='border-l-4 border-blue-500'
        />
        <StatCard
          icon={<BarChart3 className='h-8 w-8 text-yellow-500' />}
          title='Average Score'
          value={stats.averageScore}
          colorClass='border-l-4 border-yellow-500'
        />
        <StatCard
          icon={<Award className='h-8 w-8 text-green-500' />}
          title="Topper's Score"
          value={stats.topperScore}
          colorClass='border-l-4 border-green-500'
        />
      </div>
    </div>
  );
}
