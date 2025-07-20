// src/components/mock-tests/ShareButton.js

"use client";

import { useAuth } from "@/context/AuthContext";
import { Share2, Gift } from "lucide-react";
import toast from "react-hot-toast";
import { usePathname } from "next/navigation";

export default function ShareButton({ testId, title }) {
  const { user, isPremium, userProfile } = useAuth();
  const pathname = usePathname();

  const handleShare = async () => {
    let shareUrl = `${window.location.origin}${pathname}`;
    let shareText = `Check out this mock test on Sarkari Mock Test: "${title}"`;

    if (isPremium && userProfile?.referralCode) {
      shareUrl = `${window.location.origin}${pathname}?ref=${userProfile.referralCode}`;
      shareText = `Join me on Sarkari Mock Test! I'm preparing with this platform and you should too. Use my link to sign up!`;
    }

    const shareData = {
      title: `Sarkari Mock Test: ${title}`,
      text: shareText,
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.error("Error using Web Share API:", error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast.success(
          isPremium && userProfile?.referralCode
            ? "Your referral link has been copied!"
            : "Test link copied to clipboard!"
        );
      } catch (error) {
        toast.error("Could not copy link.");
      }
    }
  };

  const isReferral = isPremium && userProfile?.referralCode;

  return (
    <button
      onClick={handleShare}
      title={isReferral ? "Share your Referral Link" : "Share Test"}
      className={`p-2 rounded-full transition-colors ${
        isReferral
          ? "text-pink-600 hover:bg-pink-100"
          : "text-slate-600 hover:bg-slate-200"
      }`}
    >
      {isReferral ? (
        <Gift className='h-5 w-5' />
      ) : (
        <Share2 className='h-5 w-5' />
      )}
    </button>
  );
}
