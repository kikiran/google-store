import { useEffect } from 'react';

interface PageMeta {
  title: string;
  description?: string;
  canonical?: string;
  image?: string;
  type?: string;
}

export function usePageMeta({ title, description, canonical, image, type = 'website' }: PageMeta) {
  useEffect(() => {
    const fullTitle = title ? `${title} — Nova Store` : 'Nova Store — Devices & Accessories';
    document.title = fullTitle;

    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[property="${name}"],meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        if (name.startsWith('og:')) el.setAttribute('property', name);
        else el.setAttribute('name', name);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    if (description) setMeta('description', description);
    setMeta('og:title', fullTitle);
    if (description) setMeta('og:description', description);
    setMeta('og:type', type);
    if (image) setMeta('og:image', image);
    if (canonical) {
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'canonical';
        document.head.appendChild(link);
      }
      link.href = canonical;
    }
  }, [title, description, canonical, image, type]);
}
