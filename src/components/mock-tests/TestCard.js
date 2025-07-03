import Link from "next/link";
import { FileText, Clock, Tag } from "lucide-react";

export default function TestCard({ test }) {
    return (
      <div className='bg-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-slate-100 flex flex-col relative'>
        {test.isPremium && (
          <div className='absolute top-0 right-0 -mt-3 -mr-3 flex items-center justify-center h-10 w-10 bg-amber-400 text-white rounded-full shadow-lg'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              viewBox='0 0 20 20'
              fill='currentColor'
              className='w-5 h-5'
            >
              <path
                fillRule='evenodd'
                d='M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.1.4-.27.615-.454L16 14.8V7a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2v1H4a2 2 0 00-2 2v7.8l5.076 3.454c.215.184.43.354.615.454.094.05.183.097.28.14l.018.008.006.003zM10 16.5a1 1 0 01-1-1v-1a1 1 0 112 0v1a1 1 0 01-1 1z'
                clipRule='evenodd'
              />
            </svg>
          </div>
        )}
        <h2 className='text-xl font-bold text-gray-900 pr-8'>{test.title}</h2>
        <p className='text-sm text-gray-600 mt-1'>{test.examName}</p>

        <div className='my-6 space-y-3 text-gray-700 border-t border-b border-slate-100 py-4'>
          <div className='flex items-center'>
            <FileText className='h-5 w-5 mr-3 text-indigo-500' />{" "}
            {test.questionCount || 0} Questions
          </div>
          <div className='flex items-center'>
            <Clock className='h-5 w-5 mr-3 text-indigo-500' />{" "}
            {test.estimatedTime} Minutes
          </div>
          <div className='flex items-center'>
            <Tag className='h-5 w-5 mr-3 text-indigo-500' /> {test.topic}
          </div>
        </div>

        <div className='mt-auto'>
          <Link
            href={`/mock-tests/${test.id}`}
            className='block w-full text-center px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold transition-all duration-200 shadow-md hover:shadow-lg'
          >
            View Details & Start
          </Link>
        </div>
      </div>
    );

}
