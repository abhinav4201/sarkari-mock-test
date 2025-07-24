import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, limit } from "firebase/firestore";
import { notFound } from "next/navigation";
import PostContentGuard from "@/components/blog/PostContentGuard";
import { BookOpen, Sun, Leaf, Sprout } from "lucide-react"; // Import icons

// New background component with a knowledge and nature theme
const KnowledgeBackground = () => (
  <div className='absolute inset-0 z-0 overflow-hidden'>
    {/* Large, faint background elements */}
    <Sprout className='absolute -bottom-20 -left-20 h-96 w-96 text-green-500/10 transform rotate-12' />
    <Sun className='absolute -top-24 -right-24 h-96 w-96 text-yellow-500/10 transform -rotate-12' />

    {/* Smaller, more distinct icons */}
    <BookOpen className='absolute top-20 left-1/4 h-20 w-20 text-blue-500/10 transform -rotate-6' />
    <Leaf className='absolute top-1/2 right-1/4 h-16 w-16 text-green-600/10 transform rotate-45' />
    <Leaf className='absolute bottom-1/4 left-10 h-24 w-24 text-green-400/10 transform -rotate-45' />
    <BookOpen className='absolute bottom-16 right-16 h-28 w-28 text-indigo-500/10' />
  </div>
);

export async function generateMetadata({ params }) {
  const { slug } = params;
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
    <div className='relative min-h-screen bg-gradient-to-br from-green-50 via-teal-50 to-sky-100 py-16 md:py-24 overflow-hidden'>
      <KnowledgeBackground />
      <div className='relative z-10 container mx-auto px-4 sm:px-6 lg:px-8'>
        <article className='max-w-4xl mx-auto bg-white/80 backdrop-blur-sm p-8 md:p-12 rounded-2xl shadow-xl border border-slate-200/50'>
          <div className='text-center'>
            <p className='text-base font-semibold text-indigo-600 tracking-wide uppercase'>
              {formattedDate}
            </p>
            <h1 className='mt-2 text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight'>
              {post.title}
            </h1>
          </div>
          <PostContentGuard post={post} />
        </article>
      </div>
    </div>
  );
}
