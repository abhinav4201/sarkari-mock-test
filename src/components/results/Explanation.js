import { Lightbulb } from "lucide-react";

export default function Explanation({ text }) {
  // If no explanation text is provided, the component renders nothing.
  if (!text) {
    return null;
  }

  return (
    <div className='mt-4 p-4 border-l-4 border-amber-400 bg-amber-50 rounded-r-lg'>
      <div className='flex items-start gap-3'>
        <div className='flex-shrink-0'>
          <Lightbulb className='h-5 w-5 text-amber-500 mt-0.5' />
        </div>
        <div>
          <h4 className='font-bold text-amber-900'>Explanation</h4>
          <p className='mt-1 text-sm text-slate-700 leading-relaxed'>{text}</p>
        </div>
      </div>
    </div>
  );
}
