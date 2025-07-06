export default function StatCard({ title, value, icon, isLoading, onClick }) {
  const cardContent = (
    <>
      {isLoading ? (
        <div className='w-full animate-pulse'>
          <div className='h-5 bg-slate-200 rounded w-3/4 mb-3'></div>
          <div className='h-9 bg-slate-200 rounded w-1/2'></div>
        </div>
      ) : (
        <>
          <div>
            <p className='text-sm font-medium text-slate-700'>{title}</p>
            <p className='text-3xl font-bold text-slate-900'>{value}</p>
          </div>
          <div className='bg-indigo-100 text-indigo-600 p-3 rounded-full'>
            {icon}
          </div>
        </>
      )}
    </>
  );

  const baseClasses =
    "bg-white p-6 rounded-2xl shadow-lg border border-slate-100 flex items-center justify-between";

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={`${baseClasses} text-left w-full transition-all hover:shadow-xl hover:-translate-y-1`}
      >
        {cardContent}
      </button>
    );
  }

  return <div className={baseClasses}>{cardContent}</div>;
}
