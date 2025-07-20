// src/app/library-dashboard/trending/page.js

"use client";

import TestRecommendations from "@/components/dashboard/TestRecommendations";
import { TrendingUp } from "lucide-react";

export default function LibraryTrendingTestsPage() {
  return (
    <div className='bg-slate-100 min-h-screen'>
      <div className='container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12'>

        <div className='text-center mb-10'>
          <h1 className='text-4xl font-extrabold text-slate-900 flex items-center justify-center gap-4'>
            <TrendingUp className='text-indigo-600 h-10 w-10' />
            Trending Tests
          </h1>
          <p className='mt-2 text-lg text-slate-600'>
            Discover the most popular tests to enhance your preparation.
          </p>
        </div>

        <div className='max-w-5xl mx-auto'>
          {/* TestRecommendations component will fetch and display the data for the current user */}
          <TestRecommendations />
        </div>
      </div>
    </div>
  );
}
