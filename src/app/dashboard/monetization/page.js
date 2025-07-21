// src/app/dashboard/monetization/page.js

"use client";

import UserTestCreator from "@/components/dashboard/UserTestCreator";
import Link from "next/link";
import { BarChartHorizontalBig, Map } from "lucide-react"; // Import Map icon
import { useAuth } from "@/context/AuthContext"; // Import useAuth

export default function MonetizationPage() {
  const { userProfile } = useAuth(); // Get user profile to check monetization status

  return (
    <div className='bg-slate-100 min-h-screen'>
      <div className='container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12'>
        <div className='max-w-4xl mx-auto'>
          <div className='text-center mb-10'>
            <h1 className='text-4xl font-extrabold text-slate-900'>
              Content & Monetization
            </h1>
            <p className='mt-2 text-lg text-slate-600'>
              Contribute to the community and earn rewards.
            </p>
          </div>

          <div className='space-y-8'>
            {/* Link to Analytics Page */}
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
                    Track views and completions for the content you've created.
                  </p>
                </div>
                <span className='text-lg font-bold text-indigo-600 group-hover:translate-x-1 transition-transform'>
                  &rarr;
                </span>
              </div>
            </Link>

            {/* Conditionally render Adventure Creator for approved users */}
            {userProfile?.monetizationStatus === "approved" && (
              <div className='bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-slate-200'>
                <h2 className='text-2xl font-bold text-slate-900 mb-2 flex items-center gap-3'>
                  <Map className='text-purple-500' /> Create an Exam Adventure
                </h2>
                <p className='text-slate-600 mb-6'>
                  Build a guided learning path with multiple stages to help
                  students master a subject from start to finish.
                </p>
                <Link
                  href='/dashboard/monetization/adventures/create'
                  className='inline-block px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-all shadow-md'
                >
                  Start Building Adventure
                </Link>
              </div>
            )}

            {/* Existing Test Creator */}
            <div className='bg-white p-6 sm:p-8 rounded-2xl shadow-lg border border-slate-200'>
              <h2 className='text-2xl font-bold text-slate-900 mb-6'>
                Create a New Mock Test
              </h2>
              <UserTestCreator />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
