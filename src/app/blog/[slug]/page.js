import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, limit } from "firebase/firestore";
import { notFound } from "next/navigation";
import PostContentGuard from "@/components/blog/PostContentGuard"; // We will update this next

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) {
    return { title: "Post Not Found" };
  }
  const excerpt = post.content.substring(0, 150).replace(/<[^>]+>/g, "");
  return {
    title: `${post.title} | Sarkari Mock Test`,
    description: excerpt,
  };
}

async function getPostBySlug(slug) {
  const postsCollection = collection(db, "posts");
  const q = query(postsCollection, where("slug", "==", slug), limit(1));
  const postSnapshot = await getDocs(q);

  if (postSnapshot.empty) {
    return null;
  }

  const postDoc = postSnapshot.docs[0];
  const data = postDoc.data();
  return {
    id: postDoc.id,
    ...data,
    createdAt: data.createdAt.toMillis(),
  };
}

export default async function BlogPost({ params }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const formattedDate = new Date(post.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

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

          {/* --- UPDATED --- */}
          {/* All content, including the image and video, is now handled by the Guard component */}
          <PostContentGuard post={post} />
        </article>
      </div>
    </div>
  );
}
