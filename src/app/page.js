import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import BlogPostCard from "@/components/blog/BlogPostCard"; // Re-using this component
import { BookOpen, Target, Zap } from "lucide-react"; // For icons. Install with: npm install lucide-react
import SignUpButton from "@/components/home/SignUpButton";

// Helper function to fetch the latest 3 posts
async function getRecentPosts() {
  const postsCollection = collection(db, "posts");
  const q = query(postsCollection, orderBy("createdAt", "desc"), limit(3));
  const postsSnapshot = await getDocs(q);
  const posts = postsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
  return posts;
}

export default async function HomePage() {
  const recentPosts = await getRecentPosts();

  return (
    <div className='bg-white'>
      {/* 1. Hero Section */}
      <section className='bg-gray-900 text-white'>
        <div className='container mx-auto px-6 py-24 text-center'>
          <h1 className='text-4xl md:text-6xl font-extrabold leading-tight'>
            Crack Your Competitive Exams
          </h1>
          <p className='mt-4 text-lg md:text-xl text-gray-300 max-w-2xl mx-auto'>
            Your ultimate destination for high-quality mock tests, daily GK
            updates, and expert-written blog posts.
          </p>
          <div className='mt-8'>
            <Link
              href='/mock-tests' // This page will be created in the next phase
              className='px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-lg font-semibold transition-transform transform hover:scale-105'
            >
              Explore Mock Tests
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Features Section */}
      <section className='py-16'>
        <div className='container mx-auto px-6 text-center'>
          <h2 className='text-3xl font-bold mb-2'>Why Choose Us?</h2>
          <p className='text-gray-600 mb-12'>
            We provide the tools you need to succeed.
          </p>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
            {/* Feature 1 */}
            <div className='bg-gray-50 p-8 rounded-lg shadow-md'>
              <Zap className='h-12 w-12 text-blue-500 mx-auto mb-4' />
              <h3 className='text-xl font-semibold mb-2'>
                Timer-Based Mock Tests
              </h3>
              <p className='text-gray-600'>
                Simulate real exam conditions with our timed tests and get
                detailed performance analysis.
              </p>
            </div>
            {/* Feature 2 */}
            <div className='bg-gray-50 p-8 rounded-lg shadow-md'>
              <Target className='h-12 w-12 text-blue-500 mx-auto mb-4' />
              <h3 className='text-xl font-semibold mb-2'>
                Daily GK & Vocabulary
              </h3>
              <p className='text-gray-600'>
                Stay ahead of the curve with daily updates on general knowledge
                and essential vocabulary.
              </p>
            </div>
            {/* Feature 3 */}
            <div className='bg-gray-50 p-8 rounded-lg shadow-md'>
              <BookOpen className='h-12 w-12 text-blue-500 mx-auto mb-4' />
              <h3 className='text-xl font-semibold mb-2'>
                Expert Blog & Notes
              </h3>
              <p className='text-gray-600'>
                Learn from detailed notes and strategy guides written by
                experienced educators.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Latest Posts Section */}
      {recentPosts.length > 0 && (
        <section className='bg-blue-50 py-16'>
          <div className='container mx-auto px-6'>
            <h2 className='text-3xl font-bold text-center mb-12'>
              Latest From Our Blog
            </h2>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
              {recentPosts.map((post) => (
                <BlogPostCard key={post.id} post={post} />
              ))}
            </div>
            <div className='text-center mt-12'>
              <Link
                href='/blog'
                className='font-semibold text-blue-600 hover:underline'
              >
                View All Posts →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* 4. Final Call to Action (CTA) Section */}
      <section className='py-20'>
        <div className='container mx-auto px-6 text-center'>
          <h2 className='text-3xl font-bold'>
            Ready to Start Your Preparation?
          </h2>
          <p className='text-gray-600 mt-2 mb-6 max-w-xl mx-auto'>
            Sign up today to access daily content, track your progress, and take
            your first step towards success.
          </p>
          <SignUpButton />{" "}
          {/* <-- Replace the old button with this component */}
        </div>
      </section>
    </div>
  );
}
