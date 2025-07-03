// This is a Server Component, it just displays data given to it.
import { Book, Globe } from "lucide-react";

export default function DailyDose({ vocabulary, gk }) {
  return (
    <div className='bg-white p-6 rounded-lg shadow-md'>
      <h2 className='text-2xl font-bold mb-4'>Your Daily Dose</h2>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
        {/* Vocabulary Section */}
        <div>
          <div className='flex items-center mb-3'>
            <Book className='h-6 w-6 text-blue-500 mr-2' />
            <h3 className='text-xl font-semibold'>Today's Vocabulary</h3>
          </div>
          {vocabulary ? (
            <div className='space-y-4 p-4 border rounded-lg'>
              <div>
                <h4 className='font-semibold text-gray-500'>Word:</h4>
                <img
                  src={vocabulary.wordSvgUrl}
                  alt='Vocabulary Word'
                  className='w-full h-auto border my-2 bg-gray-50 p-2 rounded'
                />
              </div>
              <div>
                <h4 className='font-semibold text-gray-500'>Meaning:</h4>
                <img
                  src={vocabulary.meaningSvgUrl}
                  alt='Vocabulary Meaning'
                  className='w-full h-auto border my-2 bg-gray-50 p-2 rounded'
                />
              </div>
            </div>
          ) : (
            <p className='text-gray-500'>No vocabulary updated for today.</p>
          )}
        </div>

        {/* General Knowledge Section */}
        <div>
          <div className='flex items-center mb-3'>
            <Globe className='h-6 w-6 text-green-500 mr-2' />
            <h3 className='text-xl font-semibold'>Today's General Knowledge</h3>
          </div>
          {gk ? (
            <div className='p-4 border rounded-lg'>
              <h4 className='font-semibold text-gray-500'>
                Topic: <span className='font-normal'>{gk.category}</span>
              </h4>
              <img
                src={gk.contentSvgUrl}
                alt={gk.category}
                className='w-full h-auto border my-2 bg-gray-50 p-2 rounded'
              />
            </div>
          ) : (
            <p className='text-gray-500'>No GK updated for today.</p>
          )}
        </div>
      </div>
    </div>
  );
}
