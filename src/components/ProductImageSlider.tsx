import React, { useEffect, useState, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";

interface Props {
  images: string[];
  activeKey?: string;
}

export const ProductImageSlider: React.FC<Props> = ({ images, activeKey }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: images.length > 1 });

  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    onSelect();
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.reInit({ loop: images.length > 1 });
    emblaApi.scrollTo(0, true);
    setSelectedIndex(0);
  }, [emblaApi, images, activeKey]);

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/30">
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex">
          {images.map((img, index) => (
            <div key={`${img}_${index}`} className="flex-[0_0_100%] relative aspect-square sm:aspect-[4/5]">
              <img
                src={img}
                alt={`Product ${index}`}
                className="w-full h-full object-contain transition-transform duration-500 ease-out"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {images.map((_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => emblaApi?.scrollTo(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              selectedIndex === index ? "bg-white" : "bg-white/40"
            }`}
          />
        ))}
      </div>
    </div>
  );
};
