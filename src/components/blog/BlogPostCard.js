"use client";

import Link from "next/link";
import SvgDisplayer from "@/components/ui/SvgDisplayer";
import { Star, Lock, UserCheck } from "lucide-react"; // UserCheck icon is for restricted posts
import { useAuth } from "@/context/AuthContext";

const BlogPostCard = ({ post }) => {
  const { user, isPremium } = useAuth();

  let dateObject = null;
  if (post.createdAt?.toDate) {
    dateObject = post.createdAt.toDate();
  } else if (post.createdAt) {
    dateObject = new Date(post.createdAt);
  }

  const formattedDate = dateObject
    ? dateObject.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "No date";

    const textContent = post.content?.replace(/<[^>]+>/g, "") || "";
    const excerpt =
      textContent.length > 120
        ? textContent.substring(0, 120) + "..."
        : textContent;

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

  const LockedOverlay = () => (
    <div className='absolute inset-0 bg-white/70 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-4'>
      <Lock className='h-10 w-10 text-slate-500 mb-2' />
      <p className='text-slate-700 font-bold text-center'>
        {lockType === "premium"
          ? "This is a premium post."
          : "This post is restricted."}
      </p>
      {lockType === "premium" && (
        <Link
          href='/dashboard'
          className='mt-4 px-5 py-2 bg-amber-500 text-white text-sm font-semibold rounded-lg hover:bg-amber-600'
        >
          Upgrade to Read
        </Link>
      )}
    </div>
  );

  return (
    <div
      className={`relative group bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden flex flex-col ${
        isLocked
          ? "cursor-not-allowed"
          : "hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
      }`}
    >
      {isLocked && <LockedOverlay />}

      {post.featuredImageSvgCode && (
        <div className='w-full aspect-video border-b border-slate-200 bg-slate-50 overflow-hidden'>
          <SvgDisplayer
            svgCode={post.featuredImageSvgCode}
            className='w-full h-full'
          />
        </div>
      )}

      <div className='p-6 flex flex-col flex-grow'>
        <div className='flex items-center justify-between mb-2'>
          <p className='text-sm font-semibold text-indigo-600 tracking-wider uppercase'>
            {formattedDate}
          </p>
          <div className='flex items-center gap-2'>
            {post.isPremium && (
              <div
                className='flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded-full'
                title='Premium Post'
              >
                <Star className='h-3.5 w-3.5' />
                Premium
              </div>
            )}
            {/* --- THIS IS THE ICON FOR RESTRICTED POSTS --- */}
            {post.isRestricted && (
              <div
                className='flex items-center gap-1.5 text-xs font-bold text-cyan-700 bg-cyan-100 px-2 py-1 rounded-full'
                title='Restricted Access'
              >
                <UserCheck className='h-3.5 w-3.5' />
                Restricted
              </div>
            )}
          </div>
        </div>

        <h2 className='mt-1 text-xl font-bold text-slate-900 group-hover:text-indigo-700 transition-colors duration-300'>
          {post.title}
        </h2>
        <p className='mt-3 text-slate-700 text-base leading-relaxed flex-grow line-clamp-3'>
          {excerpt}
        </p>

        <div className='mt-6 font-semibold text-indigo-600 group-hover:underline flex items-center'>
          {isLocked ? (
            <span>Access Restricted</span>
          ) : (
            <Link href={`/blog/${post.slug}`} className='focus:outline-none'>
              <span className='absolute inset-0' aria-hidden='true'></span>
              Read Article{" "}
              <span className='ml-2 transform group-hover:translate-x-1 transition-transform duration-200'>
                &rarr;
              </span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default BlogPostCard;
