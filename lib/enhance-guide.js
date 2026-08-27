import { GUIDE_ENHANCEMENTS } from "./guide-enhancements";

export function enhanceGuide(guide) {
  if (!guide?.slug) return guide;
  return { ...guide, ...(GUIDE_ENHANCEMENTS[guide.slug] || {}) };
}
