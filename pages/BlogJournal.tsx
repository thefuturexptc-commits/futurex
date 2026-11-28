import { useState } from 'react';
import { Link } from 'react-router-dom';
import { fanGuideRoutes } from '../utils/fanGuideRoutes.js';
import { normalizeSeoKeywords } from '../utils/seoKeywords.js';
import './BlogJournal.css';

export type JournalArticle = {
  href: string;
  title: string;
  category: string;
  description: string;
  keywords?: string[];
  standalone?: boolean;
};

type BlogJournalProps = {
  articles: JournalArticle[];
  featuredImage: string;
  topics: { label: string; href: string }[];
};

const pageSize = 9;
const [fanGuide] = fanGuideRoutes;
const fanArticles = fanGuideRoutes.filter(({ listedInJournal }) => listedInJournal).map(({ path, label, description }) => ({
  href: path,
  title: label,
  description,
  category: 'Bladeless Fans',
  standalone: true,
}));

export function BlogJournal({ articles, featuredImage, topics }: BlogJournalProps) {
  const [topic, setTopic] = useState('All topics');
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(pageSize);
  const topicLabels = topics.map(({ label }) => label);
  const filters = ['All topics', ...topicLabels, 'More guides'];
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const library: JournalArticle[] = topic === 'Bladeless Fans' ? [...fanArticles, ...articles] : [...articles, ...fanArticles];
  const matchingArticles = library.filter((article) => {
    const articleTopic = topicLabels.includes(article.category) ? article.category : 'More guides';
    const searchable = [article.title, article.description, article.category, ...normalizeSeoKeywords(article.keywords)]
      .join(' ').toLowerCase();
    return (topic === 'All topics' || articleTopic === topic) && terms.every((term) => searchable.includes(term));
  });

  return (
    <main className="blog-journal">
      <div className="blog-journal__wrap">
        <header className="blog-journal__intro">
          <h1>TheFutureX Journal</h1>
          <p>Buying guides, comparisons, and everyday tips for your home and wearables.</p>
        </header>

        <section className="blog-journal__feature" aria-labelledby="fan-guide-heading">
          <img src={featuredImage} alt="" fetchPriority="high" width="3750" height="1875" />
          <div className="blog-journal__feature-copy">
            <p className="blog-journal__topic">Featured guide</p>
            <h2 id="fan-guide-heading">Find the right bladeless tower fan</h2>
            <p>Compare airflow, air care, and heating features for your home.</p>
            <a className="blog-journal__feature-link" href={fanGuide.path}>Read the fan guide</a>
          </div>
        </section>

        <section className="blog-journal__library" aria-labelledby="article-library-heading">
          <div className="blog-journal__library-heading">
            <h2 id="article-library-heading">Browse articles</h2>
            <label className="blog-journal__search">
              <span>Search articles</span>
              <input
                type="search"
                placeholder="Try battery life or sleep tracking"
                value={query}
                onChange={(event) => { setQuery(event.target.value); setLimit(pageSize); }}
              />
            </label>
          </div>

          <div className="blog-journal__filters" role="group" aria-label="Filter articles by topic">
            {filters.map((filter) => (
              <button
                key={filter}
                type="button"
                aria-pressed={topic === filter}
                onClick={() => { setTopic(filter); setLimit(pageSize); }}
              >
                {filter}
              </button>
            ))}
          </div>

          <p className="blog-journal__results" role="status">
            {matchingArticles.length} {matchingArticles.length === 1 ? 'article' : 'articles'}
          </p>

          {matchingArticles.length > 0 ? (
            <div className="blog-journal__grid">
              {matchingArticles.slice(0, limit).map((article) => (
                <Link key={article.href} to={article.href} reloadDocument={article.standalone} className="blog-journal__card">
                  <div className="blog-journal__card-copy">
                    <p className="blog-journal__topic">{article.category}</p>
                    <h3>{article.title}</h3>
                    <p className="blog-journal__summary">{article.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="blog-journal__empty">
              <h3>No articles found</h3>
              <p>Try another search or choose a different topic.</p>
              <button type="button" onClick={() => { setQuery(''); setTopic('All topics'); setLimit(pageSize); }}>
                Clear filters
              </button>
            </div>
          )}

          {matchingArticles.length > limit && (
            <div className="blog-journal__more">
              <button type="button" onClick={() => setLimit((current) => current + pageSize)}>Show more articles</button>
            </div>
          )}
        </section>

        <nav className="blog-journal__shop" aria-label="Product categories">
          <h2>Explore products</h2>
          <ul>
            {topics.map(({ label, href }) => <li key={href}><Link to={href}>{label}</Link></li>)}
          </ul>
        </nav>
      </div>
    </main>
  );
}
