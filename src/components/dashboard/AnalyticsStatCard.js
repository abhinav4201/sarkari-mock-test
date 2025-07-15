// src/components/dashboard/AnalyticsStatCard.js

"use client";

export default function AnalyticsStatCard({ title, value, icon }) {
  return (
    <div className='bg-white p-6 rounded-2xl shadow-lg border border-slate-100 flex items-center justify-between'>
      <div>
        <p className='text-sm font-medium text-slate-700'>{title}</p>
        <p className='text-3xl font-bold text-slate-900'>{value}</p>
      </div>
      <div className='bg-indigo-100 text-indigo-600 p-3 rounded-full'>
        {icon}
      </div>
    </div>
  );
}
