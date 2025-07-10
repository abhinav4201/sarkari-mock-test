"use client";

import { useAuth } from "@/context/AuthContext";
import LockedContent from "./LockedContent";
import YouTubeEmbed from "@/components/blog/YouTubeEmbed";
import SvgDisplayer from "@/components/ui/SvgDisplayer";

export default function PostContentGuard({ post }) {
  const { user, isPremium, loading } = useAuth();

  if (loading) {
    return <div className='text-center p-12'>Verifying access...</div>;
  }

  let isLocked = false;
  let lockType = null;

  if (post.isRestricted) {
    if (!user || !post.allowedUserIds?.includes(user.uid)) {
      isLocked = true;
      lockType = "restricted";
    }
  } else if (post.isPremium) {
    if (!isPremium) {
      isLocked = true;
      lockType = "premium";
    }
  }

  // If the post is locked, show the LockedContent component.
  if (isLocked) {
    return <LockedContent lockType={lockType} />;
  }

  // If access is granted, render all the content.
  return (
    <>
      {/* --- NEW: Image and YouTube are now rendered inside the guard --- */}
      {post.featuredImageSvgCode && (
        <div className='mt-12 w-full aspect-video rounded-2xl shadow-xl overflow-hidden'>
          <SvgDisplayer
            svgCode={post.featuredImageSvgCode}
            className='w-full h-full bg-slate-50'
          />
        </div>
      )}

      {post.youtubeUrl && <YouTubeEmbed url={post.youtubeUrl} />}

      <div
        className='text-slate-900 mt-12 prose prose-lg lg:prose-xl max-w-none prose-h2:font-bold prose-h2:text-slate-800 prose-a:text-indigo-600 prose-img:rounded-xl prose-img:shadow-lg'
        dangerouslySetInnerHTML={{ __html: post.content }}
      />
    </>
  );
}
