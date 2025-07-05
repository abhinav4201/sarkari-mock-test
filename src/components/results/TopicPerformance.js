// components/results/TopicPerformance.js

export default function TopicPerformance({ data }) {
  return (
    <div className='p-6 bg-white rounded-2xl shadow-lg border border-slate-200'>
      <h3 className='text-xl font-bold text-slate-900 mb-6'>
        Topic Performance
      </h3>
      <div className='space-y-5'>
        {Object.entries(data).map(([topic, stats]) => {
          const accuracy =
            stats.total > 0
              ? Math.round((stats.correct / stats.total) * 100)
              : 0;
          const isStrong = accuracy >= 75;
          const isWeak = accuracy < 50;

          const barColor = isStrong
            ? "bg-green-500"
            : isWeak
            ? "bg-red-500"
            : "bg-yellow-500";

          return (
            <div key={topic}>
              <div className='flex items-center justify-between mb-2'>
                <p className='font-semibold text-slate-800'>{topic}</p>
                <div className='flex items-center space-x-3'>
                  <p className='text-sm font-medium text-slate-600'>
                    {stats.correct} / {stats.total}
                  </p>
                  <div
                    className={`text-sm font-bold px-2.5 py-0.5 rounded-full text-white ${barColor}`}
                  >
                    {accuracy}%
                  </div>
                </div>
              </div>
              <div className='w-full bg-slate-200 rounded-full h-2.5'>
                <div
                  className={`h-2.5 rounded-full ${barColor}`}
                  style={{ width: `${accuracy}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
