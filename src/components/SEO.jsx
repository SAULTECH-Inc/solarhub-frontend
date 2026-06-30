import { Helmet } from 'react-helmet-async';

export const SITE_URL  = 'https://solarmaket.ng'; // update when domain is confirmed
export const SITE_NAME = 'Solar Maket Nigeria';
const DEFAULT_DESC     = "Nigeria's premier solar marketplace. Buy solar panels, batteries, inverters from verified sellers. Hire certified solar engineers nationwide.";
const DEFAULT_IMAGE    = `${SITE_URL}/og-image.png`;

/**
 * SEO — drop-in head manager for every page.
 *
 * Props:
 *   title       string  page-specific title (appended with " | Solar Maket Nigeria")
 *   description string  155-char page description
 *   canonical   string  path (e.g. "/marketplace") — auto-prefixed with SITE_URL
 *   ogImage     string  absolute URL to 1200×630 image
 *   ogType      string  "website" | "product" | "profile" (default: "website")
 *   noindex     bool    block crawlers (private pages)
 *   jsonLd      object  primary JSON-LD object (or array of objects)
 *   breadcrumbs array   [{ name, url }] — generates BreadcrumbList JSON-LD
 */
export default function SEO({
  title, description, canonical, ogImage,
  ogType = 'website', noindex = false,
  jsonLd, breadcrumbs,
}) {
  const fullTitle  = title
    ? `${title} | ${SITE_NAME}`
    : `${SITE_NAME} | Buy & Sell Solar Products in Nigeria`;
  const desc    = description || DEFAULT_DESC;
  const url     = canonical ? `${SITE_URL}${canonical}` : SITE_URL;
  const image   = ogImage || DEFAULT_IMAGE;

  // Flatten multiple JSON-LD objects into a single @graph for efficiency
  const schemas = [
    ...(Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : []),
    ...(breadcrumbs?.length ? [{
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((c, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: c.name,
        ...(c.url ? { item: `${SITE_URL}${c.url}` } : {}),
      })),
    }] : []),
  ];

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex,nofollow" />}

      {/* Open Graph */}
      <meta property="og:title"       content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:type"        content={ogType} />
      <meta property="og:image"       content={image} />
      <meta property="og:image:width"  content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:url"         content={url} />
      <meta property="og:site_name"   content={SITE_NAME} />
      <meta property="og:locale"      content="en_NG" />

      {/* Twitter Card */}
      <meta name="twitter:card"        content="summary_large_image" />
      <meta name="twitter:title"       content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image"       content={image} />

      {/* Structured Data */}
      {schemas.length > 0 && (
        <script type="application/ld+json">
          {JSON.stringify(schemas.length === 1 ? schemas[0] : { '@context': 'https://schema.org', '@graph': schemas })}
        </script>
      )}
    </Helmet>
  );
}

// ── Shared schema builders ─────────────────────────────────────────────────

export const orgSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/pwa-512x512.png`,
  description: DEFAULT_DESC,
  address: { '@type': 'PostalAddress', addressCountry: 'NG' },
  contactPoint: { '@type': 'ContactPoint', contactType: 'customer service', availableLanguage: 'English' },
  sameAs: [],
});

export const websiteSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  url: SITE_URL,
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/marketplace?q={search_term_string}` },
    'query-input': 'required name=search_term_string',
  },
});

export const productSchema = (p) => ({
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: p.name,
  description: p.description,
  url: `${SITE_URL}/product/${p.id}`,
  image: p.images?.[0] || `${SITE_URL}/pwa-512x512.png`,
  sku: p.id,
  ...(p.brand ? { brand: { '@type': 'Brand', name: p.brand } } : {}),
  offers: {
    '@type': 'Offer',
    price: String(p.price),
    priceCurrency: 'NGN',
    availability: p.stock > 0
      ? 'https://schema.org/InStock'
      : 'https://schema.org/OutOfStock',
    seller: {
      '@type': 'Organization',
      name: p.seller?.storeName || p.seller?.firstName || 'Solar Maket Seller',
    },
    shippingDetails: {
      '@type': 'OfferShippingDetails',
      shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'NG' },
      deliveryTime: {
        '@type': 'ShippingDeliveryTime',
        businessDays: { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday','Tuesday','Wednesday','Thursday','Friday'] },
        handlingTime: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 2, unitCode: 'DAY' },
        transitTime:  { '@type': 'QuantitativeValue', minValue: 1, maxValue: p.deliveryDays || 5, unitCode: 'DAY' },
      },
    },
  },
  ...(p.averageRating > 0 ? {
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: p.averageRating,
      reviewCount: Math.max(p.reviewCount || 1, 1),
      bestRating: 5,
      worstRating: 1,
    },
  } : {}),
});

export const personSchema = (eng) => ({
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: eng.fullName || `${eng.user?.firstName || ''} ${eng.user?.lastName || ''}`.trim(),
  url: `${SITE_URL}/engineers/${eng.id}`,
  jobTitle: 'Solar Installation Engineer',
  image: eng.profilePhoto || undefined,
  address: { '@type': 'PostalAddress', addressLocality: eng.city, addressRegion: eng.state, addressCountry: 'NG' },
  ...(eng.bio ? { description: eng.bio } : {}),
  ...(eng.averageRating > 0 ? {
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: eng.averageRating,
      reviewCount: Math.max(eng.reviewCount || 1, 1),
    },
  } : {}),
});

export const itemListSchema = (items, name) => ({
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name,
  numberOfItems: items.length,
  itemListElement: items.map((item, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    url: `${SITE_URL}/product/${item.id}`,
    name: item.name,
  })),
});
