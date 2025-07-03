import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import BlogPostCard from "@/components/blog/BlogPostCard";
import SignUpButton from "@/components/home/SignUpButton";
import { PenSquare, Target, Timer, ArrowRight } from "lucide-react";

// This data fetching function remains the same
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
    <div className='bg-slate-50 text-slate-800'>
      {/* ===================================
          1. Hero Section
      =================================== */}
      <section className='relative pt-24 pb-28 md:pt-32 md:pb-36'>
        <div className='absolute inset-0 bottom-1/2 bg-white'></div>
        <div className='relative container mx-auto px-6 text-center'>
          <h1 className='text-4xl md:text-6xl font-extrabold tracking-tighter text-slate-900'>
            Master Your Competitive Exams
          </h1>
          <p className='mt-6 max-w-2xl mx-auto text-lg text-slate-600'>
            The ultimate platform with high-quality mock tests, daily current
            affairs, and expert analysis to help you achieve your goals.
          </p>
          <div className='mt-10 flex justify-center gap-4'>
            <Link
              href='/mock-tests'
              className='inline-flex items-center justify-center px-6 py-3 font-semibold bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition-all duration-200'
            >
              Browse Tests
            </Link>
            <SignUpButton />
          </div>
        </div>
      </section>

      {/* ===================================
          2. Trust & Features Section
      =================================== */}
      <section className='py-20 bg-white'>
        <div className='container mx-auto px-6'>
          <div className='text-center'>
            <h2 className='text-3xl font-bold'>
              Your Path to Success Starts Here
            </h2>
            <p className='mt-2 text-lg text-slate-600'>
              Everything you need, all in one place.
            </p>
          </div>
          <div className='mt-16 grid grid-cols-1 md:grid-cols-3 gap-8'>
            <div className='p-8 bg-slate-50 rounded-xl shadow-sm'>
              <Timer className='h-10 w-10 text-indigo-600' />
              <h3 className='mt-4 text-xl font-bold'>Realistic Timed Tests</h3>
              <p className='mt-2 text-slate-600'>
                Experience real exam conditions with our timed mock tests to
                improve your speed and accuracy.
              </p>
            </div>
            <div className='p-8 bg-slate-50 rounded-xl shadow-sm'>
              <Target className='h-10 w-10 text-indigo-600' />
              <h3 className='mt-4 text-xl font-bold'>Daily GK & Vocabulary</h3>
              <p className='mt-2 text-slate-600'>
                Stay updated with curated daily general knowledge and essential
                vocabulary to ace your exams.
              </p>
            </div>
            <div className='p-8 bg-slate-50 rounded-xl shadow-sm'>
              <PenSquare className='h-10 w-10 text-indigo-600' />
              <h3 className='mt-4 text-xl font-bold'>
                Expert Analysis & Notes
              </h3>
              <p className='mt-2 text-slate-600'>
                Get detailed performance analysis after every test and access
                our library of expert-written notes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================
          3. "How It Works" Section
      =================================== */}
      <section className='py-20'>
        <div className='container mx-auto px-6'>
          <div className='text-center'>
            <h2 className='text-3xl font-bold'>
              Get Started in 3 Simple Steps
            </h2>
          </div>
          <div className='mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center'>
            <div className='p-4'>
              <div className='mx-auto h-16 w-16 flex items-center justify-center bg-indigo-100 text-indigo-600 rounded-full text-2xl font-bold'>
                1
              </div>
              <h3 className='mt-6 text-xl font-bold'>Create an Account</h3>
              <p className='mt-2 text-slate-600'>
                Sign up for free to get access to daily content and track your
                progress.
              </p>
            </div>
            <div className='p-4'>
              <div className='mx-auto h-16 w-16 flex items-center justify-center bg-indigo-100 text-indigo-600 rounded-full text-2xl font-bold'>
                2
              </div>
              <h3 className='mt-6 text-xl font-bold'>Choose a Test</h3>
              <p className='mt-2 text-slate-600'>
                Browse our extensive library of mock tests for various
                competitive exams.
              </p>
            </div>
            <div className='p-4'>
              <div className='mx-auto h-16 w-16 flex items-center justify-center bg-indigo-100 text-indigo-600 rounded-full text-2xl font-bold'>
                3
              </div>
              <h3 className='mt-6 text-xl font-bold'>Analyze & Improve</h3>
              <p className='mt-2 text-slate-600'>
                Take tests and get detailed performance reports to identify your
                strengths and weaknesses.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===================================
          4. Latest Blog Posts Section
      =================================== */}
      {recentPosts.length > 0 && (
        <section className='py-20 bg-white'>
          <div className='container mx-auto px-6'>
            <h2 className='text-3xl font-bold text-center'>
              Insights & Strategies
            </h2>
            <div className='mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
              {recentPosts.map((post) => (
                <BlogPostCard key={post.id} post={post} />
              ))}
            </div>
            <div className='text-center mt-16'>
              <Link
                href='/blog'
                className='font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center'
              >
                View All Articles <ArrowRight className='ml-2 h-4 w-4' />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ===================================
          5. Final Call to Action
      =================================== */}
      <section className='py-20'>
        <div className='container mx-auto px-6'>
          <div className='bg-indigo-700 text-white rounded-2xl shadow-xl p-10 md:p-16 text-center'>
            <h2 className='text-3xl font-bold'>Ready to Achieve Your Goals?</h2>
            <p className='mt-4 max-w-xl mx-auto'>
              Join thousands of successful students. Your journey to a
              government job starts today.
            </p>
            <div className='mt-8'>
              <SignUpButton />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
