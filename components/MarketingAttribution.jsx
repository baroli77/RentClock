'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function MarketingAttribution() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const key = 'rentclock-attribution-visit-sent';
    if (sessionStorage.getItem(key)) return;

    const source = searchParams.get('utm_source') || (document.referrer ? 'referral' : 'direct');
    let referrerHost = '';
    try { referrerHost = document.referrer ? new URL(document.referrer).hostname : ''; } catch {}

    void fetch('/api/attribution/visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source,
        medium: searchParams.get('utm_medium') || undefined,
        campaign: searchParams.get('utm_campaign') || undefined,
        content: searchParams.get('utm_content') || undefined,
        term: searchParams.get('utm_term') || undefined,
        landingPath: `${pathname}${window.location.search}`,
        referrerHost,
      }),
      keepalive: true,
    }).then(response => {
      if (response.ok) sessionStorage.setItem(key, '1');
    }).catch(() => {});
  }, [pathname, searchParams]);

  return null;
}
