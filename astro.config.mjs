import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  // Absolute site URL — drives canonical/hreflang/OG URLs and the sitemap.
  // Hard-coded rather than read from Astro.url.origin, which on Cloudflare
  // reflects the *.pages.dev preview host in non-production builds.
  site: 'https://hazara.co.il',
  output: 'hybrid',
  // Links across the site are written without a trailing slash (/library,
  // /map/...); pin the behavior so /en/library and friends don't slash-redirect.
  trailingSlash: 'never',
  // Emit prerendered pages as `name.html` (not `name/index.html`) so Cloudflare
  // Pages serves them at the no-slash URL directly — otherwise CF 308-redirects
  // /en/library → /en/library/, which contradicts our no-slash canonicals. With
  // 'file', static pages match the SSR routes and the canonical/hreflang URLs.
  build: { format: 'file' },
  adapter: cloudflare({
    platformProxy: { enabled: true },
  }),
  // Hebrew is the default locale and lives at the root (/, /library, /map/...);
  // English is a real, separately-indexable locale under /en (/en, /en/library,
  // …). NOTE: this config gives locale detection + helpers only — it does NOT
  // duplicate pages, so the /en routes are physical files (src/pages/en/**) that
  // render English server-side. No `fallback` on purpose: a fallback would serve
  // the Hebrew HTML at /en, defeating English indexing.
  i18n: {
    defaultLocale: 'he',
    locales: ['he', 'en'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
});
