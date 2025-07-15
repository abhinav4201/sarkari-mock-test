// src/components/admin/UserAnalyticsCard.js

"use client";

import { Users, Eye, BarChart2 } from "lucide-react";

export default function UserAnalyticsCard({ userStats, onCardClick }) {
  return (
    <button
      onClick={() => onCardClick(userStats)}
      className='w-full text-left p-4 border rounded-lg bg-white hover:bg-slate-50 hover:shadow-md transition-all'
    >
      <h3 className='font-bold text-lg text-indigo-600'>
        {userStats.userName}
      </h3>
      <p className='text-xs text-slate-500 truncate mb-3'>
        {userStats.userEmail}
      </p>
      <div className='space-y-2 text-sm'>
        <div className='flex justify-between items-center'>
          <span className='font-medium text-slate-700'>Tests Created:</span>
          <span className='font-bold text-slate-900'>
            {userStats.testsCreated}
          </span>
        </div>
        <div className='flex justify-between items-center'>
          <span className='font-medium text-slate-700'>Total Impressions:</span>
          <span className='font-bold text-slate-900'>
            {userStats.totalImpressions.toLocaleString()}
          </span>
        </div>
        <div className='flex justify-between items-center'>
          <span className='font-medium text-slate-700'>
            Total Unique Takers:
          </span>
          <span className='font-bold text-slate-900'>
            {userStats.totalUniqueTakers.toLocaleString()}
          </span>
        </div>
      </div>
    </button>
  );
}
