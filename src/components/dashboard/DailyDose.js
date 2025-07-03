// This is a Server Component, it just displays data given to it.
import { Book, Globe } from "lucide-react";

export default function DailyDose({ vocabulary, gk }) {
  return (
    <div className='bg-white p-6 sm:p-8 rounded-2xl shadow-md border border-slate-200 space-y-8'>
      {/* Vocabulary Section */}
      <div>
        <div className='flex items-center mb-4'>
          <Book className='h-6 w-6 text-indigo-500 mr-3' />
          <h3 className='text-xl font-bold text-slate-800'>
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
          <div className='p-4 border rounded-xl bg-slate-50 animate-pulse'>
            <div className='h-6 w-2/5 bg-slate-200 rounded-md mb-4'></div>
            <div className='h-24 bg-slate-200 rounded-md'></div>
          </div>
        )}
      </div>

      {/* General Knowledge Section */}
      <div>
        <div className='flex items-center mb-4'>
          <Globe className='h-6 w-6 text-green-500 mr-3' />
          <h3 className='text-xl font-bold text-slate-800'>
            Today's General Knowledge
          </h3>
        </div>
        {gk ? (
          <div className='p-4 border rounded-xl bg-slate-50'>
            <h4 className='font-semibold text-slate-500 text-sm'>
              Topic:{" "}
              <span className='font-medium text-slate-800'>{gk.category}</span>
            </h4>
            <div
              className='mt-2 p-2 bg-white rounded-md border'
              dangerouslySetInnerHTML={{ __html: gk.contentSvgCode }}
            />
          </div>
        ) : (
          <div className='p-4 border rounded-xl bg-slate-50 animate-pulse'>
            <div className='h-6 w-3/5 bg-slate-200 rounded-md mb-4'></div>
            <div className='h-24 bg-slate-200 rounded-md'></div>
          </div>
        )}
      </div>
    </div>
  );

}
