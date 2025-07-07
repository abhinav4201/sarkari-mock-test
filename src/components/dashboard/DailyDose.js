"use client";

import SvgDisplayer from "@/components/ui/SvgDisplayer"; // Import the smart displayer
import { Book, ChevronsRight, Globe } from "lucide-react";
import Link from "next/link";

export default function DailyDose({ vocabulary, gk, isLoading }) {
  if (isLoading) {
    // Skeleton loader remains the same and is a good representation
    return (
      <div className='space-y-8 animate-pulse'>
        {/* Vocabulary Skeleton */}
        <div>
          <div className='h-7 w-2/5 bg-slate-200 rounded-md mb-4'></div>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='p-4 border rounded-xl bg-slate-100 space-y-2'>
              <div className='h-4 w-1/4 bg-slate-200 rounded-md'></div>
              <div className='h-20 bg-slate-200 rounded-md'></div>
            </div>
            <div className='p-4 border rounded-xl bg-slate-100 space-y-2'>
              <div className='h-4 w-1/4 bg-slate-200 rounded-md'></div>
              <div className='h-20 bg-slate-200 rounded-md'></div>
            </div>
          </div>
        </div>
        {/* GK Skeleton */}
        <div>
          <div className='h-7 w-2/5 bg-slate-200 rounded-md mb-4'></div>
          <div className='p-4 border rounded-xl bg-slate-100 space-y-2'>
            <div className='h-4 w-1/3 bg-slate-200 rounded-md'></div>
            <div className='h-24 bg-slate-200 rounded-md'></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-8'>
      {/* Vocabulary Section */}
      <div>
        {/* FIX: The entire header is now a clickable link */}
        <Link
          href='/dashboard/daily-content?type=vocabulary'
          className='group block mb-4'
        >
          <div className='flex items-center justify-between'>
            <div className='flex items-center'>
              <div className='flex items-center justify-center h-10 w-10 rounded-full bg-indigo-100 mr-3'>
                <Book className='h-5 w-5 text-indigo-600' />
              </div>
              <h3 className='text-2xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors'>
                Today's Vocabulary
              </h3>
            </div>
            <ChevronsRight className='h-6 w-6 text-slate-400 group-hover:text-indigo-600 transition-all group-hover:translate-x-1' />
          </div>
        </Link>
        {vocabulary ? (
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='p-4 rounded-xl bg-white border border-slate-200 shadow-sm'>
              <h4 className='font-semibold text-slate-600 text-sm mb-2'>
                Word
              </h4>
              <SvgDisplayer
                svgCode={vocabulary.wordSvgCode}
                className='h-auto min-h-[6rem] p-2 bg-slate-50 rounded-lg flex items-center'
              />
            </div>
            <div className='p-4 rounded-xl bg-white border border-slate-200 shadow-sm'>
              <h4 className='font-semibold text-slate-600 text-sm mb-2'>
                Meaning
              </h4>
              <SvgDisplayer
                svgCode={vocabulary.meaningSvgCode}
                className='h-auto min-h-[6rem] p-2 bg-slate-50 rounded-lg flex items-center'
              />
            </div>
          </div>
        ) : (
          // FIX: Updated fallback message
          <div className='text-center text-slate-600 text-sm p-6 border-2 border-dashed rounded-xl bg-slate-50'>
            <p className='font-semibold mb-1'>No vocabulary for today.</p>
            <Link
              href='/dashboard/daily-content?type=vocabulary'
              className='font-medium text-indigo-600 hover:underline'
            >
              Explore previous entries
            </Link>
          </div>
        )}
      </div>

      {/* General Knowledge Section */}
      <div>
        {/* FIX: The entire header is now a clickable link */}
        <Link
          href='/dashboard/daily-content?type=gk'
          className='group block mb-4'
        >
          <div className='flex items-center justify-between'>
            <div className='flex items-center'>
              <div className='flex items-center justify-center h-10 w-10 rounded-full bg-green-100 mr-3'>
                <Globe className='h-5 w-5 text-green-600' />
              </div>
              <h3 className='text-2xl font-bold text-slate-900 group-hover:text-green-600 transition-colors'>
                Today's General Knowledge
              </h3>
            </div>
            <ChevronsRight className='h-6 w-6 text-slate-400 group-hover:text-green-600 transition-all group-hover:translate-x-1' />
          </div>
        </Link>
        {gk ? (
          <div className='p-4 rounded-xl bg-white border border-slate-200 shadow-sm'>
            <h4 className='font-semibold text-slate-600 text-sm mb-2'>
              Topic:{" "}
              <span className='font-bold text-slate-800'>{gk.category}</span>
            </h4>
            <SvgDisplayer
              svgCode={gk.contentSvgCode}
              className='mt-2 h-auto min-h-[8rem] p-2 bg-slate-50 rounded-lg flex items-center'
            />
          </div>
        ) : (
          // FIX: Updated fallback message
          <div className='text-center text-slate-600 text-sm p-6 border-2 border-dashed rounded-xl bg-slate-50'>
            <p className='font-semibold mb-1'>No GK content for today.</p>
            <Link
              href='/dashboard/daily-content?type=gk'
              className='font-medium text-indigo-600 hover:underline'
            >
              Explore previous entries
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
