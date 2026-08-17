import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getBlogPosts } from '../services/backend';
import { removeJsonLd, setJsonLd, setSeoMetadata } from '../services/seo';
import type { BlogPost } from '../types';
import { publishedBlogPosts } from '../utils/publishedBlogPosts';
import { InfoPage } from './InfoPage';

const formatDate = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
};

const estimateReadingTime = (content?: string) => {
  if (!content) return 1;
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
};

export const BlogPostPage: React.FC = () => {
  const { slug = '' } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null | undefined>(undefined);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    getBlogPosts()
      .then((posts) =>
        setPost(
          posts.find((item) => item.slug === slug && item.status === 'published') ||
            publishedBlogPosts.find((item) => item.slug === slug) ||
            null
        )
      )
      .catch(() => setPost(publishedBlogPosts.find((item) => item.slug === slug) || null));
  }, [slug]);

  useEffect(() => {
    if (!post) return;
    const path = `/blog/${post.slug}`;
    const url = `https://thefuturex.in${path}`;
    setSeoMetadata({ title: `${post.title} | TheFutureX Blog`, description: post.excerpt, path, type: 'website' });
    setJsonLd('blog-article-json-ld', {
      '@context': 'https://schema.org', '@type': 'Article', headline: post.title,
      description: post.excerpt, mainEntityOfPage: { '@type': 'WebPage', '@id': url },
      url, datePublished: post.updatedAt, dateModified: post.updatedAt,
      ...(post.image ? { image: `https://thefuturex.in${post.image}` } : {}),
      author: { '@type': 'Organization', name: 'TheFutureX' },
      publisher: { '@type': 'Organization', name: 'TheFutureX', logo: { '@type': 'ImageObject', url: 'https://thefuturex.in/images/tfx-google-logo.webp' } },
    });
    if (post.faqs?.length) {
      setJsonLd('blog-faq-json-ld', { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: post.faqs.map((faq) => ({ '@type': 'Question', name: faq.question, acceptedAnswer: { '@type': 'Answer', text: faq.answer } })) });
    }
    return () => { removeJsonLd('blog-article-json-ld'); removeJsonLd('blog-faq-json-ld'); };
  }, [post]);

  if (post === undefined) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-[#fffdf9] px-4">
        <div className="flex flex-col items-center gap-4">
          <span
            className="h-9 w-9 animate-spin rounded-full border-2"
            style={{ borderColor: 'rgba(23,19,15,0.12)', borderTopColor: '#ad8a4c' }}
          />
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#766a5a]">Loading article…</p>
        </div>
      </main>
    );
  }

  // The sitemap also includes long-form articles maintained in InfoPage.
  // Render them at their indexed /blog URL rather than redirecting visitors
  // (and Google) to the journal landing page.
  if (!post) return <InfoPage />;

  const publishedLabel = formatDate(post.updatedAt);
  const readingTime = estimateReadingTime(post.content);

  return (
    <main className="bg-[#fffdf9]">
      {/* ─── Hero ─────────────────────────────────────────────── */}
      <section className="border-b border-[#17130f0f] bg-[#faf7f1]">
        <div className="mx-auto max-w-3xl px-5 pb-10 pt-28 sm:pt-32">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#8a6d38] transition hover:text-[#17130f]"
          >
            <span aria-hidden="true">←</span> The Journal
          </Link>

          <p className="mt-6 text-xs font-bold uppercase tracking-[0.28em] text-[#ad8a4c]">
            TheFutureX Journal
          </p>

          <h1 className="mt-4 font-serif text-4xl font-semibold leading-[1.1] tracking-tight text-[#17130f] sm:text-5xl">
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="mt-6 italic text-lg leading-8 text-[#4a4238]">
              {post.excerpt}
            </p>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#766a5a]">
            {publishedLabel && <span>{publishedLabel}</span>}
            {publishedLabel && <span className="text-[#ad8a4c]">·</span>}
            <span>{readingTime} min read</span>
          </div>
        </div>
      </section>

      {post.image && (
        <div className="mx-auto -mt-1 max-w-5xl px-5">
          <div className="overflow-hidden rounded-2xl border border-[#17130f0f] shadow-[0_30px_60px_rgba(23,19,15,0.12)]">
            <img
              src={post.image}
              alt={post.title}
              loading="eager"
              decoding="async"
              className="h-auto w-full object-cover"
            />
          </div>
        </div>
      )}

      {/* ─── Article body ─────────────────────────────────────── */}
      <article className="mx-auto max-w-3xl px-5 py-14 sm:py-16">
        <div className="whitespace-pre-wrap text-[17px] leading-[1.9] text-[#2b241c]">
          {post.content}
        </div>

        {/* ─── FAQs ────────────────────────────────────────────── */}
        {post.faqs && post.faqs.length > 0 && (
          <section className="mt-16 border-t border-[#17130f0f] pt-10">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#ad8a4c]">
              Good to know
            </p>
            <h2 className="mt-3 font-serif text-2xl font-semibold text-[#17130f]">
              Frequently asked questions
            </h2>

            <div className="mt-8 divide-y divide-[#17130f0f] rounded-2xl border border-[#17130f0f] bg-white">
              {post.faqs.map((faq, index) => {
                const isOpen = openFaq === index;
                return (
                  <div key={`${faq.question}-${index}`}>
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                      aria-expanded={isOpen}
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                    >
                      <span className="text-[15px] font-semibold text-[#17130f]">{faq.question}</span>
                      <span
                        className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-[#ad8a4c] text-[#ad8a4c] transition-transform duration-200"
                        style={{ transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)' }}
                        aria-hidden="true"
                      >
                        +
                      </span>
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 text-[15px] leading-7 text-[#4a4238]">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ─── Back to journal ───────────────────────────────────── */}
        <div className="mt-16 flex justify-center border-t border-[#17130f0f] pt-10">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 rounded-full border border-[#17130f] px-6 py-3 text-xs font-bold uppercase tracking-[0.16em] text-[#17130f] transition hover:bg-[#17130f] hover:text-[#faf7f1]"
          >
            Back to the Journal
          </Link>
        </div>
      </article>
    </main>
  );
};
