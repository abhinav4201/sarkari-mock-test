import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, limit } from "firebase/firestore";
import YouTubeEmbed from "@/components/blog/YouTubeEmbed";
import { notFound } from "next/navigation";

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
    <div className='bg-white'>
      <div className='container mx-auto px-4 py-16'>
        <article className='max-w-3xl mx-auto'>
          <p className='text-gray-500 mb-2'>{formattedDate}</p>
          <h1 className='text-4xl md:text-5xl font-extrabold text-gray-900 mb-4'>
            {post.title}
          </h1>

          <YouTubeEmbed url={post.youtubeUrl} />

          {/* Render the post content from your Rich Text Editor */}
          <div
            className='prose lg:prose-xl max-w-none'
            dangerouslySetInnerHTML={{ __html: post.content }}
          ></div>
        </article>
      </div>
    </div>
  );
}
