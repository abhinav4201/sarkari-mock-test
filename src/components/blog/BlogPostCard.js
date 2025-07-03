import Link from "next/link";

const BlogPostCard = ({ post }) => {
  // Format the date nicely
  const formattedDate = new Date(post.createdAt?.toDate()).toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );

  // Create a short excerpt from the content
  const excerpt =
    post.content.substring(0, 150).replace(/<[^>]+>/g, "") + "...";

    return (
      <Link
        href={`/blog/${post.slug}`}
        className='block group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-slate-100 overflow-hidden'
      >
        <div className='p-6 flex flex-col h-full'>
          <p className='text-sm font-semibold text-indigo-600 tracking-wider uppercase'>
            {formattedDate}
          </p>
          <h2 className='mt-3 text-xl font-bold text-slate-900 group-hover:text-indigo-700 transition-colors duration-300'>
            {post.title}
          </h2>
          <p className='mt-3 text-slate-700 text-base leading-relaxed flex-grow'>
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
