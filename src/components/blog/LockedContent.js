"use client";

import { Lock, Crown } from "lucide-react";
import Link from "next/link";

export default function LockedContent({ lockType }) {
  const isPremiumLock = lockType === "premium";

  return (
    <div className='relative mt-12 text-center p-12 border-2 border-dashed border-slate-300 rounded-2xl'>
      <div className='absolute inset-0 bg-gradient-to-t from-white via-white to-transparent'></div>
      <div className='relative z-10 flex flex-col items-center'>
        <div
          className={`flex items-center justify-center h-16 w-16 rounded-full ${
            isPremiumLock ? "bg-amber-100" : "bg-slate-100"
          }`}
        >
          <Lock
            className={`h-8 w-8 ${
              isPremiumLock ? "text-amber-500" : "text-slate-500"
            }`}
          />
        </div>
        <h3 className='mt-4 text-2xl font-bold text-slate-900'>
          {isPremiumLock ? "This is a Premium Post" : "Access Restricted"}
        </h3>
        <p className='mt-2 max-w-md text-slate-600'>
          {isPremiumLock
            ? "You must have an active subscription to read the full content of this article."
            : "You do not have the necessary permissions to view this post."}
        </p>
        {isPremiumLock && (
          <Link
            href='/dashboard'
            className='mt-6 inline-flex items-center gap-2 px-6 py-3 bg-amber-500 text-white font-bold rounded-lg hover:bg-amber-600 transition-all'
          >
            <Crown size={18} />
            Upgrade to Premium
          </Link>
        )}
      </div>
    </div>
  );
}
