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

const renderInline = (value: string, key: string) => {
  const parts = value.split(/(\[[^\]]+\]\([^\s)]+\)|\*\*[^*]+\*\*)/g).filter(Boolean);
  return parts.map((part, index) => {
    const link = part.match(/^\[([^\]]+)\]\(([^\s)]+)\)$/);
    if (link) {
      const [, label, href] = link;
      const className = 'font-semibold text-[#8a6d38] underline decoration-[#ad8a4c]/50 underline-offset-4 transition hover:text-[#17130f]';
      return href.startsWith('/') ? <Link key={`${key}-${index}`} to={href} className={className}>{label}</Link> : <a key={`${key}-${index}`} href={href} className={className}>{label}</a>;
    }
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={`${key}-${index}`} className="font-semibold text-[#17130f]">{part.slice(2, -2)}</strong>;
    return part;
  });
};

const renderArticleContent = (content: string) => {
  const lines = content.split('\n');
  const blocks: React.ReactNode[] = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index].trim();
    if (!line) { index += 1; continue; }
    if (line.startsWith('## ')) {
      blocks.push(<h2 key={`heading-${index}`} className="mt-12 font-serif text-3xl font-semibold leading-tight text-[#17130f]">{renderInline(line.slice(3), `heading-${index}`)}</h2>);
      index += 1;
      continue;
    }
    const isOrdered = /^\d+\.\s/.test(line);
    const isUnordered = line.startsWith('- ');
    if (isOrdered || isUnordered) {
      const items: string[] = [];
      const matcher = isOrdered ? /^\d+\.\s/ : /^-\s/;
      while (index < lines.length && matcher.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(matcher, ''));
        index += 1;
      }
      const List = isOrdered ? 'ol' : 'ul';
      blocks.push(<List key={`list-${index}`} className={`${isOrdered ? 'list-decimal' : 'list-disc'} my-6 space-y-3 pl-6 marker:text-[#ad8a4c]`}>{items.map((item, itemIndex) => <li key={itemIndex}>{renderInline(item, `list-${index}-${itemIndex}`)}</li>)}</List>);
      continue;
    }
    blocks.push(<p key={`paragraph-${index}`} className="mt-6">{renderInline(line, `paragraph-${index}`)}</p>);
    index += 1;
  }
  return blocks;
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
    setSeoMetadata({ title: post.metaTitle || `${post.title} | TheFutureX Blog`, description: post.metaDescription || post.excerpt, path, type: 'website' });
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
    <main className="blog-post-page bg-[#fffdf9]">
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
        <div className="text-[17px] leading-[1.9] text-[#2b241c]">
          {renderArticleContent(post.content)}
        </div>

        {post.featuredProduct && (
          <section className="mt-14 overflow-hidden rounded-2xl border border-[#17130f14] bg-[#faf7f1]">
            <div className="grid items-center sm:grid-cols-[180px_1fr]">
              <div className="flex min-h-48 items-center justify-center bg-white p-6">
                <img src={post.featuredProduct.image} alt={post.featuredProduct.name} className="max-h-40 w-full object-contain" />
              </div>
              <div className="p-7 sm:p-8">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#ad8a4c]">Featured product</p>
                <h2 className="mt-2 font-serif text-2xl font-semibold text-[#17130f]">{post.featuredProduct.name}</h2>
                {post.featuredProduct.price && <p className="mt-2 text-lg font-bold text-[#17130f]">{post.featuredProduct.price}</p>}
                <p className="mt-3 text-[15px] leading-7 text-[#4a4238]">{post.featuredProduct.description}</p>
                <Link to={post.featuredProduct.href} className="mt-5 inline-flex rounded-full bg-[#17130f] px-5 py-3 text-xs font-bold uppercase tracking-[0.14em] text-white transition hover:bg-[#8a6d38]">
                  View TFX5 AI Smart Band
                </Link>
              </div>
            </div>
          </section>
        )}

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
