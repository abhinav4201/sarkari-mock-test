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
    <Link href={`/blog/${post.slug}`} className='block group'>
      <div className='p-6 border rounded-lg shadow-sm hover:shadow-xl transition-shadow duration-300 bg-white'>
        <p className='text-sm text-gray-500 mb-2'>{formattedDate}</p>
        <h2 className='text-2xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors duration-300'>
          {post.title}
        </h2>
        <p className='text-gray-600 mt-3'>{excerpt}</p>
        <div className='mt-4 font-semibold text-blue-500 group-hover:underline'>
          Read More →
        </div>
      </div>
    </Link>
  );
};

export default BlogPostCard;
