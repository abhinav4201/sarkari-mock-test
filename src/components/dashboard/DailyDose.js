"use client";

import { Book, Globe } from "lucide-react";

// The component now accepts an 'isLoading' prop
export default function DailyDose({ vocabulary, gk, isLoading }) {
  if (isLoading) {
    return (
      <div className='space-y-8 animate-pulse'>
        {/* Vocabulary Skeleton */}
        <div>
          <div className='h-7 w-3/5 bg-slate-200 rounded-md'></div>
          <div className='mt-4 p-4 border rounded-xl bg-slate-100'>
            <div className='h-5 w-1/4 bg-slate-200 rounded-md mb-2'></div>
            <div className='h-24 bg-slate-200 rounded-md'></div>
          </div>
        </div>
        {/* GK Skeleton */}
        <div>
          <div className='h-7 w-3/5 bg-slate-200 rounded-md'></div>
          <div className='mt-4 p-4 border rounded-xl bg-slate-100'>
            <div className='h-5 w-1/4 bg-slate-200 rounded-md mb-2'></div>
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
        <div className='flex items-center mb-4'>
          <Book className='h-6 w-6 text-indigo-500 mr-3' />
          <h3 className='text-xl font-bold text-slate-900'>
            Today's Vocabulary
          </h3>
        </div>
        {vocabulary ? (
          <div className='space-y-4 p-4 border rounded-xl bg-slate-50'>
            <div>
              <h4 className='font-semibold text-slate-500 text-sm'>Word:</h4>
              <div
                className='mt-1 p-2 bg-white rounded-md border'
                dangerouslySetInnerHTML={{ __html: vocabulary.wordSvgCode }}
              />
            </div>
            <div>
              <h4 className='font-semibold text-slate-500 text-sm'>Meaning:</h4>
              <div
                className='mt-1 p-2 bg-white rounded-md border'
                dangerouslySetInnerHTML={{ __html: vocabulary.meaningSvgCode }}
              />
            </div>
          </div>
        ) : (
          <p className='text-slate-700 text-sm p-4 border rounded-xl bg-slate-50'>
            No vocabulary updated for today.
          </p>
        )}
      </div>

      {/* General Knowledge Section */}
      <div>
        <div className='flex items-center mb-4'>
          <Globe className='h-6 w-6 text-green-500 mr-3' />
          <h3 className='text-xl font-bold text-slate-900'>
            Today's General Knowledge
          </h3>
        </div>
        {gk ? (
          <div className='p-4 border rounded-xl bg-slate-50'>
            <h4 className='font-semibold text-slate-500 text-sm'>
              Topic:{" "}
              <span className='font-medium text-slate-900'>{gk.category}</span>
            </h4>
            <div
              className='mt-2 p-2 bg-white rounded-md border'
              dangerouslySetInnerHTML={{ __html: gk.contentSvgCode }}
            />
          </div>
        ) : (
          <p className='text-slate-700 text-sm p-4 border rounded-xl bg-slate-50'>
            No GK updated for today.
          </p>
        )}
      </div>
    </div>
  );
}
