import Link from "next/link";
import SvgDisplayer from "@/components/ui/SvgDisplayer";

const BlogPostCard = ({ post }) => {
  // FIX: This new logic safely handles the date
  let dateObject = null;
  if (post.createdAt) {
    // Check if it's a Firestore Timestamp with a .toDate() method
    if (typeof post.createdAt.toDate === "function") {
      dateObject = post.createdAt.toDate();
    } else {
      // Otherwise, assume it's a string or number that new Date() can parse
      dateObject = new Date(post.createdAt);
    }
  }

  const formattedDate = dateObject
    ? dateObject.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "No date";

  const excerpt =
    post.content?.substring(0, 150).replace(/<[^>]+>/g, "") + "..." || "";

  return (
    <Link
      href={`/blog/${post.slug}`}
      className='block group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-slate-100 overflow-hidden'
    >
      {post.featuredImageSvgCode && (
        <div className='w-full aspect-video border-b border-slate-200 bg-slate-50 overflow-hidden'>
          <SvgDisplayer
            svgCode={post.featuredImageSvgCode}
            className='w-full h-full'
          />
        </div>
      )}

      <div className='p-6 flex flex-col'>
        <p className='text-sm font-semibold text-indigo-600 tracking-wider uppercase'>
          {formattedDate}
        </p>
        <h2 className='mt-3 text-xl font-bold text-slate-900 group-hover:text-indigo-700 transition-colors duration-300'>
          {post.title}
        </h2>
        <p className='mt-3 text-slate-700 text-base leading-relaxed'>
          {excerpt}
        </p>
        <div className='mt-6 font-semibold text-indigo-600 group-hover:underline flex items-center'>
          Read Article{" "}
          <span className='ml-2 transform group-hover:translate-x-1 transition-transform duration-200'>
            &rarr;
          </span>
        </div>
      </div>
    </Link>
  );
};

export default BlogPostCard;
