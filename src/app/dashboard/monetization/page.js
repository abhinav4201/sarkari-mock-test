// src/app/dashboard/monetization/page.js

"use client";

import UserTestCreator from "@/components/dashboard/UserTestCreator";
import BackButton from "@/components/BackButton";
import Link from "next/link";
import { BarChartHorizontalBig } from "lucide-react";

export default function MonetizationPage() {
  const handleTestCreated = () => {
    // This function is called after a user creates a test.
    // The UserTestCreator component now handles the redirect.
  };

  return (
    <div className='bg-slate-100 min-h-screen'>
      <div className='container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12'>
        {/* <div className='mb-8'>
          <BackButton />
        </div> */}

        <div className='max-w-4xl mx-auto'>
          <div className='text-center mb-10'>
            <h1 className='text-4xl font-extrabold text-slate-900'>
              Content & Monetization
            </h1>
            <p className='mt-2 text-lg text-slate-600'>
              Contribute to the community and earn rewards. Start by creating a
              high-quality mock test.
            </p>
          </div>

          {/* Link to Analytics Page */}
          <div className='mb-8'>
            <Link
              href='/dashboard/monetization/analytics'
              className='block group'
            >
              <div className='bg-indigo-50 p-6 rounded-2xl border-2 border-dashed border-indigo-200 hover:border-indigo-400 transition-all flex justify-between items-center'>
                <div>
                  <h3 className='text-xl font-bold text-indigo-800 flex items-center gap-3'>
                    <BarChartHorizontalBig />
                    View My Content Analytics
                  </h3>
                  <p className='text-indigo-700 mt-1'>
                    Track views and completions for the tests you've created.
                  </p>
                </div>
                <span className='text-lg font-bold text-indigo-600 group-hover:translate-x-1 transition-transform'>
                  &rarr;
                </span>
              </div>
            </Link>
          </div>

          <div className='bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-slate-200'>
            <h2 className='text-2xl font-bold text-slate-900 mb-6'>
              Create a New Mock Test
            </h2>
            <UserTestCreator onTestCreated={handleTestCreated} />
          </div>
        </div>
      </div>
    </div>
  );
}
