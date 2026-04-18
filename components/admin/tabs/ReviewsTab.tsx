import React, { useEffect, useMemo, useState } from 'react';
import { Product, ProductPublicReview } from '../../../types';
import { deleteProductReview, getProductReviews, updateProduct } from '../../../services/backend';
import { Button } from '../../ui/Button';
import { SectionHeader } from '../common/SectionHeader';

interface Props {
  products: Product[];
}

interface StoredReview {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
  images?: string[];
}

interface FlatReview {
  id: string;
  stableKey: string;
  productId: string;
  productName: string;
  productCategory: string;
  reviewerName: string;
  rating: number;
  comment: string;
  createdAt: string;
  source: 'product' | 'local';
  productReviewIndex?: number;
  localReviewId?: string;
  reviewDocId?: string;
  images?: string[];
  verifiedBuyer?: boolean;
}

const DELETED_PRODUCT_REVIEWS_KEY = 'admin_deleted_product_reviews_v1';

export const ReviewsTab: React.FC<Props> = ({ products }) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'genuine' | 'normal'>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [hiddenReviewIds, setHiddenReviewIds] = useState<string[]>([]);
  const [publicReviewsByProduct, setPublicReviewsByProduct] = useState<Record<string, ProductPublicReview[]>>({});

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      products.map(async (product) => {
        const reviews = await getProductReviews(product.id);
        return [product.id, reviews] as const;
      })
    )
      .then((entries) => {
        if (!cancelled) setPublicReviewsByProduct(Object.fromEntries(entries));
      })
      .catch(() => {
        if (!cancelled) setPublicReviewsByProduct({});
      });
    return () => {
      cancelled = true;
    };
  }, [products]);

  const allReviews = useMemo<FlatReview[]>(() => {
    const rows: FlatReview[] = [];
    const deletedProductReviewKeys: string[] = (() => {
      try {
        const raw = localStorage.getItem(DELETED_PRODUCT_REVIEWS_KEY);
        return raw ? (JSON.parse(raw) as string[]) : [];
      } catch {
        return [];
      }
    })();

    products.forEach((product) => {
      const productReviews = [
        ...(publicReviewsByProduct[product.id] || []),
        ...(product.reviews || []).filter(
          (embedded) => !(publicReviewsByProduct[product.id] || []).some((review) => review.id && review.id === embedded.id)
        ),
      ];
      productReviews.forEach((review: ProductPublicReview, index) => {
        const stableKey = `${product.id}::${review.id || review.name || ''}::${review.comment || ''}::${review.date || ''}`;
        if (deletedProductReviewKeys.includes(stableKey)) return;
        rows.push({
          id: `${product.id}_product_${index}_${review.name}_${review.date || ''}`,
          stableKey,
          productId: product.id,
          productName: product.name,
          productCategory: product.category,
          reviewerName: review.name || 'Anonymous',
          rating: Number(review.rating || 0),
          comment: review.comment || '',
          createdAt: review.date || '',
          source: 'product',
          productReviewIndex: index,
          reviewDocId: review.id,
          images: review.images || [],
          verifiedBuyer: Boolean(review.verifiedBuyer),
        });
      });

      try {
        const raw = localStorage.getItem(`product_reviews_${product.id}`);
        const parsed = raw ? (JSON.parse(raw) as StoredReview[]) : [];
        parsed.forEach((review) => {
          const stableKey = `${product.id}::${review.id}`;
          rows.push({
            id: `${product.id}_local_${review.id}`,
            stableKey,
            productId: product.id,
            productName: product.name,
            productCategory: product.category,
            reviewerName: review.userName || 'Anonymous',
            rating: Number(review.rating || 0),
            comment: review.comment || '',
            createdAt: review.createdAt || '',
            source: 'local',
            localReviewId: review.id,
            images: review.images || [],
            verifiedBuyer: false,
          });
        });
      } catch {
        void 0;
      }
    });

    return rows
      .filter((review) => !hiddenReviewIds.includes(review.id))
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }, [products, hiddenReviewIds, publicReviewsByProduct]);

  const isGenuineBuyer = (review: FlatReview) =>
    Boolean(review.verifiedBuyer) ||
    /genuine buyer|verified buyer|verified purchase/i.test(review.comment) ||
    /genuine buyer|verified buyer|verified purchase/i.test(review.reviewerName);

  const counts = useMemo(() => {
    const genuine = allReviews.filter(isGenuineBuyer).length;
    const normal = allReviews.length - genuine;
    return {
      all: allReviews.length,
      genuine,
      normal,
    };
  }, [allReviews]);

  const filteredReviews = useMemo(() => {
    if (activeFilter === 'genuine') return allReviews.filter(isGenuineBuyer);
    if (activeFilter === 'normal') return allReviews.filter((review) => !isGenuineBuyer(review));
    return allReviews;
  }, [activeFilter, allReviews]);

  const renderStars = (rating: number) => {
    const safe = Math.max(0, Math.min(5, Math.round(rating || 0)));
    return `${'★'.repeat(safe)}${'☆'.repeat(5 - safe)}`;
  };

  const formatReviewDate = (raw: string) => {
    if (!raw) return 'Date not available';
    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) return parsed.toLocaleString();
    return raw;
  };

  const handleDeleteReview = async (review: FlatReview) => {
    const confirmed = window.confirm('Delete this review?');
    if (!confirmed) return;

    setDeletingId(review.id);
    try {
      if (review.reviewDocId) {
        await deleteProductReview(review.productId, review.reviewDocId);
      } else if (review.source === 'local' && review.localReviewId) {
        const key = `product_reviews_${review.productId}`;
        const raw = localStorage.getItem(key);
        const parsed = raw ? (JSON.parse(raw) as StoredReview[]) : [];
        const next = parsed.filter((item) => item.id !== review.localReviewId);
        localStorage.setItem(key, JSON.stringify(next));
      }

      // Keep a local tombstone so deleted seeded/product reviews stay deleted
      // even if remote sync fails or the page reloads.
      const existingDeleted: string[] = (() => {
        try {
          const raw = localStorage.getItem(DELETED_PRODUCT_REVIEWS_KEY);
          return raw ? (JSON.parse(raw) as string[]) : [];
        } catch {
          return [];
        }
      })();
      if (!existingDeleted.includes(review.stableKey)) {
        localStorage.setItem(
          DELETED_PRODUCT_REVIEWS_KEY,
          JSON.stringify([...existingDeleted, review.stableKey])
        );
      }

      const targetProduct = products.find((p) => p.id === review.productId);
      if (targetProduct) {
        const currentReviews = [...(targetProduct.reviews || [])];
        const matchIndex = currentReviews.findIndex(
          (entry) =>
            (review.reviewDocId && entry.id === review.reviewDocId) ||
            (entry.name === review.reviewerName && entry.comment === review.comment)
        );
        if (matchIndex >= 0) currentReviews.splice(matchIndex, 1);
        const nextReviewCount = currentReviews.length;
        const nextRating = nextReviewCount
          ? Number(
              (
                currentReviews.reduce((sum, entry) => sum + Number(entry.rating || 0), 0) /
                nextReviewCount
              ).toFixed(1)
            )
          : 0;

        await updateProduct({
          ...targetProduct,
          reviews: currentReviews,
          reviewCount: nextReviewCount,
          rating: nextRating,
        });
      }

      setHiddenReviewIds((prev) => [...prev, review.id]);
    } catch {
      alert('Failed to delete review. Please retry.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <SectionHeader
        title="Customer Reviews"
        subtitle="Manage customer feedback across all products"
      />

      <div className="rounded-xl border border-rose-200/70 dark:border-white/10 bg-gradient-to-r from-rose-50 via-amber-50 to-sky-50 dark:from-white/5 dark:via-white/10 dark:to-white/5 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-rose-700 dark:text-rose-300">
          Holi Launch Theme
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition ${
              activeFilter === 'all'
                ? 'bg-primary-600 text-white border-primary-500'
                : 'bg-white/80 dark:bg-white/5 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-white/10'
            }`}
          >
            All ({counts.all})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('genuine')}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition ${
              activeFilter === 'genuine'
                ? 'bg-primary-600 text-white border-primary-500'
                : 'bg-white/80 dark:bg-white/5 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-white/10'
            }`}
          >
            Genuine Buyer ({counts.genuine})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('normal')}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition ${
              activeFilter === 'normal'
                ? 'bg-primary-600 text-white border-primary-500'
                : 'bg-white/80 dark:bg-white/5 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-white/10'
            }`}
          >
            Normal User ({counts.normal})
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {filteredReviews.map((review) => {
          const genuine = isGenuineBuyer(review);
          const typeLabel = genuine ? 'Genuine Buyer Review' : 'Normal User Review';
          return (
            <div key={review.id} className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-dark-surface p-4">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {review.productName} ({review.productCategory})
              </p>
              <p className="mt-2 text-sm font-medium text-gray-800 dark:text-gray-200">{review.reviewerName}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{formatReviewDate(review.createdAt)}</p>
              <p className="mt-2 text-amber-500 text-sm">{renderStars(review.rating)}</p>
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 break-words [overflow-wrap:anywhere]">{review.comment || 'No comment'}</p>
              {review.images && review.images.length > 0 && (
                <div className="mt-3 flex gap-2">
                  {review.images.slice(0, 2).map((image) => (
                    <img
                      key={image}
                      src={image}
                      alt={`${review.reviewerName} review`}
                      loading="lazy"
                      className="h-16 w-16 rounded-lg border border-gray-200 object-cover dark:border-white/10"
                    />
                  ))}
                </div>
              )}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-300">
                  {typeLabel}
                </span>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => handleDeleteReview(review)}
                  isLoading={deletingId === review.id}
                >
                  Delete Review
                </Button>
              </div>
            </div>
          );
        })}

        {filteredReviews.length === 0 && (
          <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-dark-surface p-6 text-center text-sm text-gray-500 dark:text-gray-400">
            No reviews found for this filter.
          </div>
        )}
      </div>
    </div>
  );
};
