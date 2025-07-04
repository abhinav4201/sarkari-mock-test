// components/results/TopicPerformance.js

export default function TopicPerformance({ data }) {
  return (
    <div className='p-6 bg-slate-50 rounded-lg border'>
      <h3 className='text-xl font-bold text-slate-800 mb-4'>
        Topic Performance
      </h3>
      <div className='space-y-4'>
        {Object.entries(data).map(([topic, stats]) => {
          const accuracy =
            stats.total > 0
              ? Math.round((stats.correct / stats.total) * 100)
              : 0;
          const isStrong = accuracy >= 75;
          const isWeak = accuracy < 50;
          return (
            <div
              key={topic}
              className='flex items-center justify-between p-4 bg-white rounded-lg shadow-sm'
            >
              <p className='font-semibold text-slate-700'>{topic}</p>
              <div className='flex items-center space-x-4'>
                <p className='text-sm text-slate-500'>
                  {stats.correct} / {stats.total} correct
                </p>
                <div
                  className={`text-lg font-bold px-3 py-1 rounded-full text-white ${
                    isStrong
                      ? "bg-green-500"
                      : isWeak
                      ? "bg-red-500"
                      : "bg-yellow-500"
                  }`}
                >
                  {accuracy}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
