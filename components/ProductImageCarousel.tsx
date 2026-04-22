import React, { useEffect, useMemo, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Fade from 'embla-carousel-fade';

interface ProductImageCarouselProps {
  images: string[];
  alt: string;
  selectedIndex?: number;
  onSelectIndex?: (index: number) => void;
}

export const ProductImageCarousel: React.FC<ProductImageCarouselProps> = React.memo(
  ({ images, alt, selectedIndex: externalIndex, onSelectIndex }) => {
    const fade = useMemo(() => Fade(), []);

    const [emblaRef, emblaApi] = useEmblaCarousel(
      { loop: images.length > 1, dragFree: false },
      [fade] // ✅ autoplay removed
    );

    const [selectedIndex, setSelectedIndex] = useState(0);
    const [snapPoints, setSnapPoints] = useState<number[]>([]);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    useEffect(() => {
      if (!emblaApi || images.length <= 1 || isPreviewOpen) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      const timer = window.setInterval(() => {
        emblaApi.scrollNext();
      }, 40000);

      return () => window.clearInterval(timer);
    }, [emblaApi, images.length, isPreviewOpen]);

    useEffect(() => {
      if (!isPreviewOpen) return;

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          setIsPreviewOpen(false);
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isPreviewOpen]);

    // Sync with external index (thumbnail click)
    useEffect(() => {
      if (!emblaApi || externalIndex === undefined) return;
      emblaApi.scrollTo(externalIndex);
    }, [externalIndex, emblaApi]);

    // Handle selection
    useEffect(() => {
      if (!emblaApi) return;

      const onSelect = () => {
        const index = emblaApi.selectedScrollSnap();
        setSelectedIndex(index);
        onSelectIndex?.(index); // notify parent
      };

      setSnapPoints(emblaApi.scrollSnapList());
      onSelect();

      emblaApi.on('select', onSelect);
      emblaApi.on('reInit', onSelect);

      return () => {
        emblaApi.off('select', onSelect);
        emblaApi.off('reInit', onSelect);
      };
    }, [emblaApi, onSelectIndex]);

    return (
      <div className="w-full">
        {/* Carousel */}
        <div
          className="product-card-dark overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),rgba(0,0,0,0.82)_58%,#000_100%)] shadow-2xl"
          ref={emblaRef}
        >
          <div className="flex touch-pan-y">
            {images.map((image, idx) => (
              <button
                key={`${image}_${idx}`}
                type="button"
                onClick={() => setIsPreviewOpen(true)}
                className="relative min-w-0 flex-[0_0_100%] aspect-square cursor-zoom-in overflow-hidden border-0 bg-transparent p-4 sm:p-6"
                aria-label={`View ${alt} image ${idx + 1}`}
              >
                <img
                  src={image}
                  alt={alt}
                  className="h-full w-full object-contain transition-all duration-500 ease-out"
                  loading={idx === 0 ? 'eager' : 'lazy'}
                  decoding={idx === 0 ? 'sync' : 'async'}
                  fetchPriority={idx === 0 ? 'high' : 'auto'}
                  width={900}
                  height={900}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Dots */}
        {snapPoints.length > 1 && (
          <div className="mt-4 flex items-center justify-center gap-2">
            {snapPoints.map((_, index) => (
              <button
                key={`dot_${index}`}
                type="button"
                aria-label={`Go to image ${index + 1}`}
                onClick={() => emblaApi?.scrollTo(index)}
                className={`rounded-full transition-all duration-300 ease-out ${
                  selectedIndex === index
                    ? 'h-2 w-6 bg-white'
                    : 'h-2 w-2 bg-white/30 hover:bg-white/50'
                }`}
              />
            ))}
          </div>
        )}

        {isPreviewOpen && (
          <div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 px-4 py-6"
            role="dialog"
            aria-modal="true"
            aria-label={`${alt} image preview`}
            onClick={() => setIsPreviewOpen(false)}
          >
            <button
              type="button"
              className="absolute right-4 top-4 rounded-lg border border-white/30 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10"
              onClick={() => setIsPreviewOpen(false)}
            >
              Close
            </button>
            <img
              src={images[selectedIndex]}
              alt={`${alt} enlarged view`}
              decoding="async"
              width={1200}
              height={1200}
            className="max-h-[86vh] w-auto max-w-full rounded-2xl bg-black/80 object-contain p-3"
              onClick={(event) => event.stopPropagation()}
            />
          </div>
        )}
      </div>
    );
  }
);

ProductImageCarousel.displayName = 'ProductImageCarousel';
