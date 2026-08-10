import React, { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { getBlogPosts } from '../services/backend';
import { setSeoMetadata } from '../services/seo';
import type { BlogPost } from '../types';

export const BlogPostPage: React.FC = () => {
  const { slug = '' } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null | undefined>(undefined);

  useEffect(() => {
    getBlogPosts()
      .then((posts) => setPost(posts.find((item) => item.slug === slug && item.status === 'published') || null))
      .catch(() => setPost(null));
  }, [slug]);

  useEffect(() => {
    if (post) setSeoMetadata({ title: `${post.title} | TheFutureX Blog`, description: post.excerpt, path: `/blog/${post.slug}` });
  }, [post]);

  if (post === undefined) return <main className="mx-auto max-w-3xl px-4 py-16 text-center">Loading article…</main>;
  if (!post) return <Navigate to="/blog" replace />;
  return <main className="mx-auto max-w-3xl px-4 py-12 text-gray-900"><article><p className="text-sm font-semibold uppercase tracking-wider text-cyan-700">TheFutureX Journal</p><h1 className="mt-3 text-3xl font-bold sm:text-4xl">{post.title}</h1><p className="mt-4 text-lg text-gray-600">{post.excerpt}</p><div className="mt-8 whitespace-pre-wrap leading-8 text-gray-700">{post.content}</div></article></main>;
};
