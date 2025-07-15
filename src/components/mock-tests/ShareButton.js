// src/components/mock-tests/ShareButton.js

"use client";

import { Share2 } from "lucide-react";
import toast from "react-hot-toast";

export default function ShareButton({ testId, title }) {
  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/mock-tests/${testId}`;
    const shareData = {
      title: `Sarkari Mock Test: ${title}`,
      text: `Check out this mock test: "${title}"`,
      url: shareUrl,
    };

    // Use the native Web Share API if available
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.error("Error using Web Share API:", error);
      }
    } else {
      // Fallback for desktop browsers: copy link to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Test link copied to clipboard!");
      } catch (error) {
        toast.error("Could not copy link.");
      }
    }
  };

  return (
    <button
      onClick={handleShare}
      title='Share Test'
      className='p-2 rounded-full text-slate-600 hover:bg-slate-200 hover:text-indigo-600 transition-colors'
    >
      <Share2 className='h-5 w-5' />
    </button>
  );
}
