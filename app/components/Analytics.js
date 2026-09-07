'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { track } from '@/lib/analytics';

export default function Analytics() {
  const pathname = usePathname();
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    track('page_view', {
      page_path: pathname,
      page_title: document.title || '',
      page_location: window.location.href
    });
  }, [pathname]);

  useEffect(() => {
    const handleClick = (e) => {
      const link = e.target.closest('a[href]');
      if (!link) return;
      const href = link.href;
      if (!href) return;
      const isExternal = /^(https?:)?\/\//i.test(href) && new URL(href, window.location.origin).hostname !== window.location.hostname;
      const isProtocol = /^(mailto:|tel:)/i.test(href);
      if (isExternal || isProtocol) {
        track('outbound_click', {
          url: href,
          link_text: (link.textContent || '').trim().slice(0, 80)
        });
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return null;
}
