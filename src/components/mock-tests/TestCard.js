import Link from "next/link";
import { FileText, Clock, Tag } from "lucide-react";

export default function TestCard({ test }) {
  return (
    <div className='bg-white p-6 border rounded-lg shadow-sm hover:shadow-xl transition-shadow duration-300 flex flex-col'>
      {test.isPremium && (
        <span className='absolute top-0 right-0 mt-2 mr-2 bg-yellow-400 text-yellow-800 text-xs font-bold px-2 py-1 rounded-full'>
          PREMIUM
        </span>
      )}
      <h2 className='text-xl font-bold text-gray-800'>{test.title}</h2>
      <p className='text-sm text-gray-500 mt-1'>{test.examName}</p>

      <div className='my-4 space-y-2 text-gray-600'>
        <div className='flex items-center'>
          <FileText className='h-4 w-4 mr-2' /> {test.questionCount || 0}{" "}
          Questions
        </div>
        <div className='flex items-center'>
          <Clock className='h-4 w-4 mr-2' /> {test.estimatedTime} Minutes
        </div>
        <div className='flex items-center'>
          <Tag className='h-4 w-4 mr-2' /> {test.topic}
        </div>
      </div>

      <div className='mt-auto'>
        <Link
          href={`/mock-tests/${test.id}`}
          className='block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold'
        >
          View Details
        </Link>
      </div>
    </div>
  );
}
