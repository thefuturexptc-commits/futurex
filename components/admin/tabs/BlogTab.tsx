import React, { useEffect, useState } from 'react';
import { BlogPost } from '../../../types';
import { deleteBlogPost, getBlogPosts, saveBlogPost, toProductSlug } from '../../../services/backend';
import { Button } from '../../ui/Button';

const blankPost = (): BlogPost => ({
  id: `blog_${Date.now()}`,
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  status: 'draft',
  updatedAt: '',
});

export const BlogTab: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [draft, setDraft] = useState<BlogPost>(blankPost);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const refresh = async () => {
    setLoading(true);
    try {
      setPosts(await getBlogPosts());
    } catch {
      setMessage('Could not load posts. Check Firebase rules and your admin session.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void refresh(); }, []);

  const save = async () => {
    if (!draft.title.trim() || !draft.excerpt.trim() || !draft.content.trim()) {
      setMessage('Add a title, excerpt, and full article content before saving.');
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      await saveBlogPost({ ...draft, slug: toProductSlug(draft.slug || draft.title) });
      setMessage(draft.status === 'published' ? 'Post published. Add its URL to the sitemap only after deployment renders it.' : 'Draft saved.');
      setDraft(blankPost());
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save post.');
    } finally {
      setSaving(false);
    }
  };

  return <section className="space-y-5">
    <div>
      <h2 className="text-xl font-bold text-gray-900">Blog manager</h2>
      <p className="mt-1 text-sm text-gray-600">Create substantial posts as drafts, then publish only finished pages. Drafts are never included in the XML sitemap.</p>
    </div>
    {message && <p className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-800">{message}</p>}
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-3">
      <div className="grid gap-3 md:grid-cols-2">
        <input className="rounded-lg border border-gray-300 px-3 py-2" placeholder="Post title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value, slug: draft.slug || toProductSlug(e.target.value) })} />
        <input className="rounded-lg border border-gray-300 px-3 py-2" placeholder="URL slug" value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: toProductSlug(e.target.value) })} />
      </div>
      <textarea className="min-h-20 w-full rounded-lg border border-gray-300 px-3 py-2" placeholder="Short excerpt for search and the blog listing" value={draft.excerpt} onChange={(e) => setDraft({ ...draft, excerpt: e.target.value })} />
      <textarea className="min-h-56 w-full rounded-lg border border-gray-300 px-3 py-2" placeholder="Write the full, original article here" value={draft.content} onChange={(e) => setDraft({ ...draft, content: e.target.value })} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <select className="rounded-lg border border-gray-300 px-3 py-2" value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as BlogPost['status'] })}><option value="draft">Draft</option><option value="published">Published</option></select>
        <div className="flex gap-2"><Button variant="outline" onClick={() => setDraft(blankPost())}>New post</Button><Button onClick={save} isLoading={saving}>Save post</Button></div>
      </div>
    </div>
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <h3 className="font-bold text-gray-900">Saved posts</h3>
      {loading ? <p className="mt-3 text-sm text-gray-500">Loading posts…</p> : posts.length === 0 ? <p className="mt-3 text-sm text-gray-500">No posts yet.</p> : <div className="mt-3 space-y-2">{posts.map((post) => <div key={post.id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 p-3"><div><p className="font-semibold text-gray-900">{post.title}</p><p className="text-xs text-gray-500">/blog/{post.slug} · {post.status}</p></div><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => setDraft(post)}>Edit</Button><Button size="sm" variant="danger" onClick={async () => { if (window.confirm(`Delete “${post.title}”?`)) { await deleteBlogPost(post.id); await refresh(); } }}>Delete</Button></div></div>)}</div>}
    </div>
  </section>;
};
