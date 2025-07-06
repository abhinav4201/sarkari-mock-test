import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, limit } from "firebase/firestore";
import YouTubeEmbed from "@/components/blog/YouTubeEmbed";
import SvgDisplayer from "@/components/ui/SvgDisplayer";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return {
      title: "Post Not Found",
      description: "The post you are looking for does not exist.",
    };
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
  return {
    id: postDoc.id,
    ...postDoc.data(),
  };
}

export default async function BlogPost({ params }) {
  const { slug } = params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  let formattedDate = "Date not available";
  if (post.createdAt?.toDate) {
    formattedDate = new Date(post.createdAt.toDate()).toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );
  }

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

          {post.featuredImageSvgCode && (
            <div className='mt-12 w-full aspect-video rounded-2xl shadow-xl overflow-hidden'>
              <SvgDisplayer
                svgCode={post.featuredImageSvgCode}
                className='w-full h-full bg-slate-50'
              />
            </div>
          )}

          {post.youtubeUrl && <YouTubeEmbed url={post.youtubeUrl} />}

          {/* FIX: Using a component to safely render the blog content */}
          <div className='text-slate-900 mt-12 prose prose-lg lg:prose-xl max-w-none prose-h2:font-bold prose-h2:text-slate-800 prose-a:text-indigo-600 prose-img:rounded-xl prose-img:shadow-lg'>
            <div dangerouslySetInnerHTML={{ __html: post.content }} />
          </div>
        </article>
      </div>
    </div>
  );
}
