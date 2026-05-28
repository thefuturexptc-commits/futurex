import React, { useEffect, useState } from 'react';

type ContactKey = 'inquiry' | 'email' | 'phone' | 'whatsapp';

const SUPPORT_EMAIL = 'thefuturex.ptc@gmail.com';
const SUPPORT_PHONE = '8530340676';
const WHATSAPP_URL = `https://wa.me/91${SUPPORT_PHONE}?text=${encodeURIComponent('Hi TheFutureX, I want to know more about your products.')}`;

const contactItems: Array<{
  key: ContactKey;
  label: string;
  value: string;
  href: string;
  icon: React.ReactNode;
}> = [
  {
    key: 'inquiry',
    label: 'Inquiry',
    value: 'Tell us what you want to build or buy.',
    href: '/info/contact',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M21 3 10.6 13.4" />
        <path d="m21 3-6.5 18-3.9-7.6L3 9.5 21 3Z" />
      </svg>
    ),
  },
  {
    key: 'email',
    label: 'Email',
    value: SUPPORT_EMAIL,
    href: `mailto:${SUPPORT_EMAIL}`,
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m4 7 8 6 8-6" />
      </svg>
    ),
  },
  {
    key: 'phone',
    label: 'Call',
    value: `+91 ${SUPPORT_PHONE}`,
    href: `tel:+91${SUPPORT_PHONE}`,
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="8" y="3" width="8" height="18" rx="2" />
        <path d="M11.5 17.5h1" />
      </svg>
    ),
  },
  {
    key: 'whatsapp',
    label: 'WhatsApp',
    value: `+91 ${SUPPORT_PHONE}`,
    href: WHATSAPP_URL,
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5.5 18.5 4 22l3.8-1.3A9 9 0 1 0 3 12a8.9 8.9 0 0 0 2.5 6.5Z" />
        <path d="M9 8.8c.2-.4.4-.5.7-.5h.6c.2 0 .4.1.5.4l.7 1.6c.1.3 0 .5-.2.7l-.4.4c.7 1.3 1.7 2.2 3 2.9l.5-.5c.2-.2.5-.3.8-.1l1.5.7c.3.1.4.3.4.6v.6c0 .3-.2.6-.5.7-.6.2-1.3.3-2 .1-2.8-.6-5.2-3-5.8-5.8-.2-.7-.1-1.4.2-2Z" />
      </svg>
    ),
  },
];

export const FloatingContactRail: React.FC = () => {
  const [activeKey, setActiveKey] = useState<ContactKey | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const activeItem = contactItems.find((item) => item.key === activeKey);

  useEffect(() => {
    let showTimer: number | undefined;
    let hideTimer: number | undefined;

    const scheduleShow = () => {
      showTimer = window.setTimeout(() => {
        setIsVisible(true);
        hideTimer = window.setTimeout(() => {
          setActiveKey(null);
          setIsVisible(false);
          scheduleShow();
        }, 5500);
      }, 2500);
    };

    scheduleShow();

    return () => {
      if (showTimer) window.clearTimeout(showTimer);
      if (hideTimer) window.clearTimeout(hideTimer);
    };
  }, []);

  useEffect(() => {
    if (!isVisible) {
      setActiveKey(null);
    }
  }, [isVisible]);

  return (
    <aside className={`floating-contact-rail ${isVisible ? 'is-visible' : 'is-hidden'}`} aria-label="Quick contact shortcuts">
      {activeItem && (
        <div className="floating-contact-card">
          <p className="floating-contact-card-label">{activeItem.label}</p>
          <p className="floating-contact-card-value">{activeItem.value}</p>
          <a href={activeItem.href} className="floating-contact-card-action" target={activeItem.key === 'whatsapp' ? '_blank' : undefined} rel={activeItem.key === 'whatsapp' ? 'noreferrer' : undefined}>
            Open
          </a>
        </div>
      )}

      <div className="floating-contact-stack">
        {contactItems.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`floating-contact-button ${activeKey === item.key ? 'is-active' : ''}`}
            aria-label={item.label}
            onClick={() => setActiveKey((current) => (current === item.key ? null : item.key))}
          >
            {item.icon}
          </button>
        ))}
        <button
          type="button"
          className="floating-contact-button floating-contact-up"
          aria-label="Scroll to top"
          onClick={() => {
            setActiveKey(null);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m6 14 6-6 6 6" />
            <path d="M12 8v12" />
          </svg>
        </button>
      </div>
    </aside>
  );
};
