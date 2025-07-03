import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, limit } from "firebase/firestore";
import YouTubeEmbed from "@/components/blog/YouTubeEmbed";
import { notFound } from "next/navigation";


// ADD THIS FUNCTION
export async function generateMetadata({ params }) {
  const { slug } = params;
  const post = await getPostBySlug(slug); // We'll reuse your existing function

  if (!post) {
    return {
      title: 'Post Not Found',
      description: 'The post you are looking for does not exist.',
    };
  }

  // Create a plain text excerpt for the description
  const excerpt = post.content.substring(0, 150).replace(/<[^>]+>/g, '');

  return {
    title: `${post.title} | Sarkari Mock Test`,
    description: excerpt,
  };
}

// This function fetches a single post by its slug
async function getPostBySlug(slug) {
  const postsCollection = collection(db, "posts");
  const q = query(postsCollection, where("slug", "==", slug), limit(1));
  const postSnapshot = await getDocs(q);

  if (postSnapshot.empty) {
    return null;
  }

  const post = postSnapshot.docs[0].data();
  return post;
}

export default async function BlogPost({ params }) {
  const { slug } = params;
  const post = await getPostBySlug(slug);

  // If no post is found, show the 404 page
  if (!post) {
    notFound();
  }

  const formattedDate = new Date(post.createdAt?.toDate()).toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );

  return (
    <div className='bg-white py-16 md:py-24'>
      <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
        <article className='max-w-4xl mx-auto'>
          <div className='text-center'>
            <p className='text-base font-semibold text-indigo-600 tracking-wide uppercase'>
              {formattedDate}
            </p>
            <h1 className='mt-2 text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight'>
              {post.title}
            </h1>
          </div>

          {post.youtubeUrl && <YouTubeEmbed url={post.youtubeUrl} />}

          <div className='mt-12 prose prose-lg lg:prose-xl max-w-none prose-h2:font-bold prose-h2:text-slate-800 prose-a:text-indigo-600 prose-img:rounded-xl prose-img:shadow-lg'>
            <div dangerouslySetInnerHTML={{ __html: post.content }} />
          </div>
        </article>
      </div>
    </div>
  );

}
