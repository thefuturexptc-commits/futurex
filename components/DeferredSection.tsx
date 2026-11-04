import React, { useEffect, useRef, useState } from 'react';

export const DeferredSection: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const container = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!container.current || !('IntersectionObserver' in window)) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    }, { rootMargin: '300px' });
    observer.observe(container.current);
    return () => observer.disconnect();
  }, []);
  return <div ref={container} className="min-h-[200px]">{visible ? children : null}</div>;
};
