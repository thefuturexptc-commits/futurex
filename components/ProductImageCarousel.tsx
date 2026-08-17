import React, { useEffect, useMemo, useRef, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Fade from 'embla-carousel-fade';

interface ProductImageCarouselProps {
  images: string[];
  videoUrl?: string;
  alt: string;
  selectedIndex?: number;
  onSelectIndex?: (index: number) => void;
  bannerMode?: boolean;
  videoFit?: 'contain' | 'cover';
}

const getYouTubeEmbedUrl = (url: string): string | null => {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');
    let videoId = '';

    if (host === 'youtu.be') {
      videoId = parsed.pathname.split('/').filter(Boolean)[0] || '';
    } else if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
      if (parsed.pathname.startsWith('/embed/')) {
        videoId = parsed.pathname.split('/').filter(Boolean)[1] || '';
      } else if (parsed.pathname.startsWith('/shorts/')) {
        videoId = parsed.pathname.split('/').filter(Boolean)[1] || '';
      } else {
        videoId = parsed.searchParams.get('v') || '';
      }
    }

    // Use the privacy-enhanced player. It is more reliable in embedded
    // storefront contexts and avoids a blank player before the viewer opts in.
    return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}` : null;
  } catch {
    return null;
  }
};

export const ProductImageCarousel: React.FC<ProductImageCarouselProps> = React.memo(
  ({ images, videoUrl, alt, selectedIndex: externalIndex, onSelectIndex, bannerMode = false, videoFit = 'contain' }) => {
    const fade = useMemo(() => Fade(), []);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [snapPoints, setSnapPoints] = useState<number[]>([]);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [isPreviewZoomed, setIsPreviewZoomed] = useState(false);
    const [zoomScale, setZoomScale] = useState(1.8);
    const [isSideZoomActive, setIsSideZoomActive] = useState(false);
    const [sideZoomPoint, setSideZoomPoint] = useState({ x: 50, y: 50 });
    const sideZoomScale = 2.2;
    const previewImageRef = useRef<HTMLImageElement | null>(null);
    const zoomFrameRef = useRef<number | null>(null);
    const previewPointerMovedRef = useRef(false);
    const mediaItems = useMemo(
      () => [
        ...images.map((image) => ({ type: 'image' as const, src: image })),
        ...(videoUrl ? [{ type: 'video' as const, src: videoUrl }] : []),
      ],
      [images, videoUrl]
    );
    const getVideoEmbedUrl = (src: string) => getYouTubeEmbedUrl(src);

    const [emblaRef, emblaApi] = useEmblaCarousel(
      { loop: mediaItems.length > 1, dragFree: false },
      [fade] // ✅ autoplay removed
    );

    const mediaSignature = useMemo(() => mediaItems.map((item) => `${item.type}:${item.src}`).join('|'), [mediaItems]);

    const updatePreviewZoomPosition = (
      event: React.PointerEvent<HTMLElement> | React.MouseEvent<HTMLElement> | React.WheelEvent<HTMLElement>
    ) => {
      if (!previewImageRef.current) return;

      const rect = event.currentTarget.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;

      if (zoomFrameRef.current) {
        cancelAnimationFrame(zoomFrameRef.current);
      }

      zoomFrameRef.current = requestAnimationFrame(() => {
        if (!previewImageRef.current) return;
        previewImageRef.current.style.transformOrigin = `${Math.max(0, Math.min(100, x))}% ${Math.max(0, Math.min(100, y))}%`;
      });
    };

    const updateSideZoomPosition = (event: React.MouseEvent<HTMLElement>) => {
      const rect = event.currentTarget.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      setSideZoomPoint({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
    };

    const handleSideZoomMouseEnter = (event: React.MouseEvent<HTMLElement>) => {
      setIsSideZoomActive(true);
      updateSideZoomPosition(event);
    };

    const handleSideZoomMouseMove = (event: React.MouseEvent<HTMLElement>) => {
      if (!isSideZoomActive) return;
      updateSideZoomPosition(event);
    };

    const handleSideZoomMouseLeave = () => {
      setIsSideZoomActive(false);
    };

    const openPreview = (index: number) => {
      setSelectedIndex(index);
      onSelectIndex?.(index);
      setIsPreviewZoomed(false);
      setZoomScale(1.8);
      setIsPreviewOpen(true);
    };

    const closePreview = () => {
      setIsPreviewOpen(false);
      setIsPreviewZoomed(false);
      setZoomScale(1.8);
    };

    const updateZoomScaleFromWheel = (deltaY: number) => {
      const direction = deltaY < 0 ? 0.2 : -0.2;
      setZoomScale((current) => Math.max(1.2, Math.min(2.6, Number((current + direction).toFixed(1)))));
    };

    const updateZoomScale = (value: number) => {
      setZoomScale(Math.max(1.2, Math.min(2.6, value)));
    };

    const handlePreviewZoomWheel = (event: React.WheelEvent<HTMLElement>) => {
      event.preventDefault();
      updatePreviewZoomPosition(event);
      setIsPreviewZoomed(true);
      updateZoomScaleFromWheel(event.deltaY);
    };

    useEffect(() => {
      return () => {
        if (zoomFrameRef.current) {
          cancelAnimationFrame(zoomFrameRef.current);
        }
      };
    }, []);

    useEffect(() => {
      if (!emblaApi || mediaItems.length <= 1 || isPreviewOpen) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      const timer = window.setInterval(() => {
        if (document.hidden) return;
        emblaApi.scrollNext();
      }, 40000);

      return () => window.clearInterval(timer);
    }, [emblaApi, mediaItems.length, isPreviewOpen]);

    useEffect(() => {
      if (!isPreviewOpen) return;

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          closePreview();
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

    useEffect(() => {
      if (!emblaApi) return;
      emblaApi.reInit();
      const nextIndex = Math.min(externalIndex ?? 0, Math.max(0, mediaItems.length - 1));
      emblaApi.scrollTo(nextIndex, true);
      setSelectedIndex(nextIndex);
      setIsPreviewZoomed(false);
    }, [emblaApi, externalIndex, mediaItems.length, mediaSignature]);

    // Handle selection
    useEffect(() => {
      if (!emblaApi) return;

      const onSelect = () => {
        const index = emblaApi.selectedScrollSnap();
        setSelectedIndex(index);
        setIsPreviewZoomed(false);
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
      <div className="relative w-full min-w-0 max-w-full">
        <div className="group relative max-w-full overflow-hidden bg-white" ref={emblaRef}>
          <div className="flex min-w-0 touch-pan-y">
            {mediaItems.map((item, idx) => (
              <div
                key={`${item.type}_${item.src}_${idx}`}
                role="button"
                tabIndex={0}
                onClick={() => {
                  openPreview(idx);
                }}
                onKeyDown={(event) => {
                  if (event.key !== 'Enter' && event.key !== ' ') return;
                  event.preventDefault();
                  openPreview(idx);
                }}
                onMouseEnter={item.type === 'image' ? handleSideZoomMouseEnter : undefined}
                onMouseMove={item.type === 'image' ? handleSideZoomMouseMove : undefined}
                onMouseLeave={item.type === 'image' ? handleSideZoomMouseLeave : undefined}
                className={`relative min-w-0 flex-[0_0_100%] cursor-zoom-in overflow-hidden border-0 bg-transparent p-0 ${
                  bannerMode ? 'aspect-[4/3]' : 'aspect-[4/3] sm:aspect-square'
                }`}
                aria-label={`View ${alt} ${item.type} ${idx + 1}`}
              >
                {item.type === 'video' ? (() => {
                  const embedUrl = getVideoEmbedUrl(item.src);
                  return embedUrl ? (
                    <iframe
                      src={`${embedUrl}?rel=0&modestbranding=1&playsinline=1&controls=1&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`}
                      title={`${alt} video`}
                      className="h-full w-full bg-black"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      loading="eager"
                      referrerPolicy="strict-origin-when-cross-origin"
                      onClick={(event) => event.stopPropagation()}
                    />
                  ) : (
                  <video
                    src={item.src}
                      className={`product-gallery-video h-full w-full bg-white object-center ${videoFit === 'cover' ? 'object-cover' : 'object-contain'}`}
                      autoPlay
                      muted
                      loop
                      playsInline
                    preload="metadata"
                    controls
                    />
                  );
                })() : (
                  <img
                    src={item.src}
                    alt={alt}
                    className={`h-full w-full transform-gpu transition-transform duration-75 ease-out will-change-transform group-hover:scale-[1.025] ${
                      bannerMode ? 'object-contain object-center' : 'object-contain'
                    }`}
                    draggable={false}
                    loading={idx === 0 ? 'eager' : 'lazy'}
                    decoding={idx === 0 ? 'sync' : 'async'}
                    fetchPriority={idx === 0 ? 'high' : 'auto'}
                    width={900}
                    height={900}
                  />
                )}
                {item.type === 'image' && (
                  <span className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/65 px-3 py-1 text-xs font-semibold text-white opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100">
                    Tap to open
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {isSideZoomActive && mediaItems[selectedIndex]?.type === 'image' && (
          <div className="absolute right-[-420px] top-0 z-20 hidden h-full w-[420px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_32px_80px_rgba(15,23,42,0.16)] xl:right-[-520px] xl:w-[520px] lg:block">
            <img
              src={mediaItems[selectedIndex].src}
              alt={`${alt} zoom preview`}
              className="h-full w-full object-cover"
              style={{
                transform: `scale(${sideZoomScale})`,
                transformOrigin: `${sideZoomPoint.x}% ${sideZoomPoint.y}%`,
              }}
              draggable={false}
            />
          </div>
        )}

        {snapPoints.length > 1 && (
          <div className="mt-3 flex items-center justify-center gap-2 sm:mt-4">
            {snapPoints.map((_, index) => (
              <button
                key={`dot_${index}`}
                type="button"
                aria-label={`Go to image ${index + 1}`}
                onClick={() => emblaApi?.scrollTo(index)}
                className={`rounded-full transition-all duration-300 ease-out ${
                  selectedIndex === index
                    ? 'h-2 w-6 bg-[#0ea5e9]'
                    : 'h-2 w-2 bg-slate-300 hover:bg-slate-400'
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
            onClick={closePreview}
          >
            <button
              type="button"
              className="absolute right-4 top-4 rounded-lg border border-white/30 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10"
              onClick={closePreview}
            >
              Close
            </button>
            {mediaItems[selectedIndex]?.type === 'video' ? (
              (() => {
                const selectedVideo = mediaItems[selectedIndex];
                const embedUrl = selectedVideo?.type === 'video' ? getVideoEmbedUrl(selectedVideo.src) : null;
                return embedUrl ? (
                  <iframe
                    src={`${embedUrl}?rel=0&modestbranding=1&playsinline=1&autoplay=1`}
                    title={`${alt} video preview`}
                    className="aspect-video w-full max-w-[min(100vw-2rem,1200px)] rounded-2xl bg-black"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    onClick={(event) => event.stopPropagation()}
                  />
                ) : (
                  <video
                    src={selectedVideo?.src}
                    className="h-[86vh] w-full max-w-[min(100vw-2rem,1200px)] rounded-2xl bg-black/80 object-contain"
                    controls
                    autoPlay
                    muted
                    playsInline
                    onClick={(event) => event.stopPropagation()}
                  />
                );
              })()
            ) : (
              <div
                className={`relative flex max-h-[86vh] w-full max-w-[min(100vw-2rem,1200px)] items-center justify-center overflow-hidden rounded-2xl bg-black/80 ${
                  isPreviewZoomed ? 'cursor-zoom-out touch-none' : 'cursor-zoom-in'
                }`}
                onClick={(event) => {
                  event.stopPropagation();
                  if (previewPointerMovedRef.current) {
                    previewPointerMovedRef.current = false;
                    return;
                  }
                  updatePreviewZoomPosition(event);
                  setIsPreviewZoomed((current) => !current);
                }}
                onPointerDown={() => {
                  previewPointerMovedRef.current = false;
                }}
                onPointerMove={(event) => {
                  if (!isPreviewZoomed) return;
                  previewPointerMovedRef.current = true;
                  updatePreviewZoomPosition(event);
                }}
                onWheel={handlePreviewZoomWheel}
              >
                <img
                  ref={previewImageRef}
                  src={mediaItems[selectedIndex]?.src}
                  alt={`${alt} enlarged view`}
                  decoding="async"
                  width={1200}
                  height={1200}
                  draggable={false}
                  className="max-h-[86vh] w-auto max-w-full transform-gpu object-contain p-3 transition-transform duration-75 ease-out will-change-transform"
                  style={isPreviewZoomed ? { transform: `scale(${zoomScale})` } : undefined}
                />
                {!isPreviewZoomed && (
                  <span className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-3 py-1.5 text-xs font-semibold text-white shadow-lg">
                    Tap image to zoom
                  </span>
                )}
                {isPreviewZoomed && (
                  <div
                    className="absolute bottom-5 left-1/2 z-10 w-[min(82%,340px)] -translate-x-1/2 rounded-2xl border border-white/30 bg-black/70 px-4 py-3 shadow-xl backdrop-blur sm:rounded-full"
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={(event) => event.stopPropagation()}
                    onWheel={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      updateZoomScaleFromWheel(event.deltaY);
                    }}
                  >
                    <div className="grid grid-cols-[2.25rem_minmax(0,1fr)_2.25rem] items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateZoomScale(Number((zoomScale - 0.2).toFixed(1)))}
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-white/25 text-lg font-bold leading-none text-white"
                        aria-label="Zoom out"
                      >
                        -
                      </button>
                      <input
                        type="range"
                        min="1.2"
                        max="2.6"
                        step="0.1"
                        value={zoomScale}
                        onChange={(event) => updateZoomScale(Number(event.target.value))}
                        aria-label="Product image zoom"
                        className="h-8 w-full cursor-pointer accent-[#0ea5e9]"
                      />
                      <button
                        type="button"
                        onClick={() => updateZoomScale(Number((zoomScale + 0.2).toFixed(1)))}
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-white/25 text-lg font-bold leading-none text-white"
                        aria-label="Zoom in"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);

ProductImageCarousel.displayName = 'ProductImageCarousel';
