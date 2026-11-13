import React, { useEffect, useId, useRef, useState } from 'react';
import './ReviewPhotos.css';

export function ReviewPhotos({ images, reviewer }: { images: string[]; reviewer: string }) {
  const photos = images.slice(0, 2);
  const [active, setActive] = useState<number | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const isOpen = active !== null;

  useEffect(() => {
    if (isOpen && !dialog.current?.open) dialog.current?.showModal();
    if (!isOpen && dialog.current?.open) dialog.current.close();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [isOpen]);

  return <>
    <div className="review-photo-thumbnails">
      {photos.map((photo, index) => <button key={`${photo}-${index}`} type="button" className="review-photo-thumbnail" aria-label={`Enlarge ${reviewer}'s review photo ${index + 1}`} onClick={() => setActive(index)}>
        <img src={photo} alt={`${reviewer}'s product photo ${index + 1}`} width={80} height={80} loading="lazy" decoding="async" />
      </button>)}
    </div>
    <dialog ref={dialog} className="review-photo-dialog" aria-labelledby={titleId} onClose={() => setActive(null)} onCancel={() => setActive(null)} onClick={event => { if (event.target === event.currentTarget) setActive(null); }} onKeyDown={event => {
      if (active === null) return;
      if (event.key === 'ArrowRight') { event.preventDefault(); setActive((active + 1) % photos.length); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); setActive((active + photos.length - 1) % photos.length); }
    }}>
      <div className="review-photo-preview">
        <div className="review-photo-toolbar">
          <h3 id={titleId}>{reviewer}'s review photo</h3>
          <button type="button" autoFocus className="review-photo-close" aria-label="Close review photo" onClick={() => setActive(null)}>Close ×</button>
        </div>
        {active !== null && <img className="review-photo-full" src={photos[active]} alt={`${reviewer}'s product photo ${active + 1}`} />}
        {photos.length > 1 && <div className="review-photo-navigation">
          <button type="button" onClick={() => setActive(index => ((index ?? 0) + photos.length - 1) % photos.length)}>Previous</button>
          <span aria-live="polite">{(active ?? 0) + 1} / {photos.length}</span>
          <button type="button" onClick={() => setActive(index => ((index ?? 0) + 1) % photos.length)}>Next</button>
        </div>}
      </div>
    </dialog>
  </>;
}
