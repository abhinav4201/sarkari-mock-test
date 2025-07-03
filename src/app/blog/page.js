import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import BlogPostCard from "@/components/blog/BlogPostCard";

// This is a Server Component, so we can fetch data directly.
async function getPosts() {
  const postsCollection = collection(db, "posts");
  const q = query(postsCollection, orderBy("createdAt", "desc"));
  const postsSnapshot = await getDocs(q);

  const posts = postsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  return posts;
}

export default async function BlogPage() {
  const posts = await getPosts();

  return (
    <div className='bg-white min-h-screen'>
      <div className='bg-gradient-to-b from-purple-50 via-white to-white'>
        <div className='container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24'>
          <div className='text-center max-w-3xl mx-auto'>
            <h1 className='text-4xl md:text-5xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600'>
              Insights & Updates
            </h1>
            <p className='mt-4 text-lg text-slate-800'>
              Stay ahead with our latest articles, notes, and exam strategies
              curated by experts.
            </p>
          </div>
        </div>
      </div>
      <div className='container mx-auto px-4 sm:px-6 lg:px-8 pb-16 md:pb-24'>
        <div className='-mt-16'>
          {posts.length > 0 ? (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
              {posts.map((post) => (
                <BlogPostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className='text-center py-16 px-6 bg-white rounded-2xl shadow-xl border border-slate-100'>
              <h3 className='text-2xl font-bold text-slate-900'>
                Our Library is Growing!
              </h3>
              <p className='mt-2 text-slate-700'>
                New articles are being written. Please check back soon for
                valuable insights.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

}
