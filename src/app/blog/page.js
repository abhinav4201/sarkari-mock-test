import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import BlogList from "@/components/blog/BlogList";

// This function now only fetches the FIRST page of posts on the server
async function getInitialPosts() {
  const postsCollection = collection(db, "posts");
  const q = query(postsCollection, orderBy("createdAt", "desc"), limit(6));
  const postsSnapshot = await getDocs(q);

  const posts = postsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    // Convert timestamp to a serializable format for the client component
    createdAt: doc.data().createdAt.toMillis(),
  }));
  return posts;
}

export default async function BlogPage() {
  const initialPosts = await getInitialPosts();

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
          {initialPosts.length > 0 ? (
            <BlogList initialPosts={initialPosts} />
          ) : (
            <div className='text-center py-16 px-6 bg-white rounded-2xl shadow-xl border border-slate-100'>
              <h3 className='text-2xl font-bold text-slate-900'>
                Our Library is Growing!
              </h3>
              <p className='mt-2 text-slate-700'>
                New articles are being written. Please check back soon.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
