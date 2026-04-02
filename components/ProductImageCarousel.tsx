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
          className="overflow-hidden rounded-[2rem] border border-white/10 bg-dark-surface shadow-2xl"
          ref={emblaRef}
        >
          <div className="flex touch-pan-y">
            {images.map((image, idx) => (
              <div
                key={`${image}_${idx}`}
                className="relative min-w-0 flex-[0_0_100%] aspect-square"
              >
                <img
                  src={image}
                  alt={alt}
                  className="h-full w-full object-cover transition-all duration-500 ease-out"
                  loading={idx === 0 ? 'eager' : 'lazy'}
                  width={900}
                  height={900}
                />
              </div>
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
      </div>
    );
  }
);

ProductImageCarousel.displayName = 'ProductImageCarousel';