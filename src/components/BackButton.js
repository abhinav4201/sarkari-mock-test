"use client";

import { useRouter } from "next/navigation";

export default function BackButton() {
  const router = useRouter();

  const goToDashboard = () => {
    // This will always navigate to the dashboard page
    router.push("/dashboard");
  };

  return (
    <button
      onClick={goToDashboard}
      className='px-6 py-2 bg-slate-600 text-white font-semibold rounded-lg hover:bg-slate-700 transition-all shadow-md hover:shadow-lg'
    >
      Back to Dashboard
    </button>
  );
}
