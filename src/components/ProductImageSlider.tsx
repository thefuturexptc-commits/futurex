import React, { useEffect, useState, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

interface Props {
  images: string[];
}

export const ProductImageSlider: React.FC<Props> = ({ images }) => {
  const autoplay = Autoplay({ delay: 4500, stopOnInteraction: false });

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [autoplay]);

  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    onSelect();
  }, [emblaApi, onSelect]);

  return (
    <div className="relative w-full overflow-hidden rounded-xl">
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex">
          {images.map((img, index) => (
            <div key={index} className="flex-[0_0_100%] relative">
              <img
                src={img}
                alt={`Product ${index}`}
                className="w-full h-[500px] object-cover transition-transform duration-700 ease-out"
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
