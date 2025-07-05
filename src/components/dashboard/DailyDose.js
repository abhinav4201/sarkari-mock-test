"use client";

import { Book, Globe } from "lucide-react";

export default function DailyDose({ vocabulary, gk, isLoading }) {
  if (isLoading) {
    // Updated skeleton to match the new design
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
        <div className='flex items-center mb-4'>
          <div className='flex items-center justify-center h-10 w-10 rounded-full bg-indigo-100 mr-3'>
            <Book className='h-5 w-5 text-indigo-600' />
          </div>
          <h3 className='text-2xl font-bold text-slate-900'>
            Today's Vocabulary
          </h3>
        </div>
        {vocabulary ? (
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='p-4 rounded-xl bg-white border border-slate-200 shadow-sm'>
              <h4 className='font-semibold text-slate-600 text-sm mb-2'>
                Word
              </h4>
              <div
                className='h-24 p-2 bg-slate-50 rounded-lg [&>svg]:w-full [&>svg]:h-full [&>svg]:object-contain'
                dangerouslySetInnerHTML={{ __html: vocabulary.wordSvgCode }}
              />
            </div>
            <div className='p-4 rounded-xl bg-white border border-slate-200 shadow-sm'>
              <h4 className='font-semibold text-slate-600 text-sm mb-2'>
                Meaning
              </h4>
              <div
                className='h-24 p-2 bg-slate-50 rounded-lg [&>svg]:w-full [&>svg]:h-full [&>svg]:object-contain'
                dangerouslySetInnerHTML={{ __html: vocabulary.meaningSvgCode }}
              />
            </div>
          </div>
        ) : (
          <div className='text-center text-slate-600 text-sm p-6 border-2 border-dashed rounded-xl bg-slate-50'>
            No vocabulary has been updated for today.
          </div>
        )}
      </div>

      {/* General Knowledge Section */}
      <div>
        <div className='flex items-center mb-4'>
          <div className='flex items-center justify-center h-10 w-10 rounded-full bg-green-100 mr-3'>
            <Globe className='h-5 w-5 text-green-600' />
          </div>
          <h3 className='text-2xl font-bold text-slate-900'>
            Today's General Knowledge
          </h3>
        </div>
        {gk ? (
          <div className='p-4 rounded-xl bg-white border border-slate-200 shadow-sm'>
            <h4 className='font-semibold text-slate-600 text-sm mb-2'>
              Topic:{" "}
              <span className='font-bold text-slate-800'>{gk.category}</span>
            </h4>
            <div
              className='h-32 mt-2 p-2 bg-slate-50 rounded-lg [&>svg]:w-full [&>svg]:h-full [&>svg]:object-contain'
              dangerouslySetInnerHTML={{ __html: gk.contentSvgCode }}
            />
          </div>
        ) : (
          <div className='text-center text-slate-600 text-sm p-6 border-2 border-dashed rounded-xl bg-slate-50'>
            No General Knowledge has been updated for today.
          </div>
        )}
      </div>
    </div>
  );
}
