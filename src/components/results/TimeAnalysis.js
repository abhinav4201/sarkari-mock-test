const formatTime = (seconds) => {
  // If seconds is not a valid number (null, undefined, etc.), return '0s'.
  if (typeof seconds !== "number" || isNaN(seconds)) {
    return "0s";
  }
  if (seconds === 0) return "0s";
  return `${seconds.toFixed(1)}s`;
};

export default function TimeAnalysis({ data }) {
  // Defensive check: If data itself is not available, don't render.
  if (!data) {
    return null;
  }

  return (
    <div className='p-6 bg-slate-50 rounded-lg border shadow-lg'>
      <h3 className='text-xl font-bold text-slate-800 mb-4'>Time Analysis</h3>
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <div className='p-4 bg-white rounded-lg shadow-sm text-center'>
          <p className='text-sm text-slate-500'>Avg. Time (Correct)</p>
          <p className='text-2xl font-bold text-green-600'>
            {/* The component will now safely handle cases where these values are 0 or null */}
            {formatTime(data.avgTimeCorrect)}
          </p>
        </div>
        <div className='p-4 bg-white rounded-lg shadow-sm text-center'>
          <p className='text-sm text-slate-500'>Avg. Time (Incorrect)</p>
          <p className='text-2xl font-bold text-red-600'>
            {formatTime(data.avgTimeIncorrect)}
          </p>
        </div>
        <div className='p-4 bg-white rounded-lg shadow-sm text-center'>
          <p className='text-sm text-slate-500'>Total Time</p>
          <p className='text-2xl font-bold text-indigo-600'>
            {formatTime(data.totalTime)}
          </p>
        </div>
      </div>
    </div>
  );
}
