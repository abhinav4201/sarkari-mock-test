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
    <div className='bg-gray-50 min-h-screen'>
      <div className='container mx-auto px-4 py-12'>
        <h1 className='text-4xl font-extrabold text-center mb-10 text-gray-900'>
          Our Blog & Updates
        </h1>

        {posts.length > 0 ? (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
            {posts.map((post) => (
              <BlogPostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <p className='text-center text-gray-600'>
            No posts found. Please check back later!
          </p>
        )}

        {/* We will add Pagination and SearchBar here in a later phase */}
      </div>
    </div>
  );
}
