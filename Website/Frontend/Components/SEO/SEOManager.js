'use client';

import React from 'react';
import Head from 'next/head';

/**
 * Comprehensive SEO Manager Component
 * Handles meta tags, Open Graph, Twitter Cards, structured data, and performance optimizations
 */

const SEOManager = ({
  // Basic SEO
  title = 'Swaggo - Social Media Platform',
  description = 'Connect with friends and share your moments on Swaggo',
  keywords = ['social media', 'social network', 'connect', 'share', 'friends'],
  author = 'Swaggo Team',
  
  // URLs and canonical
  url = '',
  canonicalUrl = '',
  
  // Open Graph
  ogTitle = '',
  ogDescription = '',
  ogImage = '',
  ogImageAlt = '',
  ogType = 'website',
  ogSiteName = 'Swaggo',
  
  // Twitter Cards
  twitterCard = 'summary_large_image',
  twitterSite = '@swaggo',
  twitterCreator = '@swaggo',
  twitterTitle = '',
  twitterDescription = '',
  twitterImage = '',
  
  // Additional meta
  robots = 'index,follow',
  viewport = 'width=device-width, initial-scale=1, maximum-scale=5',
  themeColor = '#ef4444',
  backgroundColor = '#ffffff',
  
  // Structured Data
  structuredData = null,
  breadcrumbs = [],
  organization = null,
  
  // Language and locale
  language = 'en',
  locale = 'en_US',
  alternateLanguages = [],
  
  // Performance and caching
  preconnect = [],
  dnsPrefetch = [],
  preload = [],
  prefetch = [],
  
  // Custom meta tags
  customMeta = [],
  
  // JSON-LD
  jsonLD = [],
  
  // Page-specific options
  noIndex = false,
  noFollow = false,
  noSnippet = false,
  noArchive = false,
  noImageIndex = false,
  
  children
}) => {
  // Generate title with site name
  const fullTitle = title.includes('Swaggo') ? title : `${title} | Swaggo`;
  
  // Use provided values or fallback to defaults
  const finalOgTitle = ogTitle || title;
  const finalOgDescription = ogDescription || description;
  const finalTwitterTitle = twitterTitle || finalOgTitle;
  const finalTwitterDescription = twitterDescription || finalOgDescription;
  const finalCanonicalUrl = canonicalUrl || url;
  
  // Build robots content
  let robotsContent = '';
  if (noIndex) robotsContent += 'noindex,';
  else robotsContent += 'index,';
  
  if (noFollow) robotsContent += 'nofollow,';
  else robotsContent += 'follow,';
  
  if (noSnippet) robotsContent += 'nosnippet,';
  if (noArchive) robotsContent += 'noarchive,';
  if (noImageIndex) robotsContent += 'noimageindex,';
  
  robotsContent = robotsContent.replace(/,$/, ''); // Remove trailing comma
  
  // Default structured data for organization
  const defaultOrganization = organization || {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Swaggo',
    url: 'https://swaggo.com',
    logo: `${url}/logo.png`,
    sameAs: [
      'https://twitter.com/swaggo',
      'https://facebook.com/swaggo',
      'https://instagram.com/swaggo'
    ]
  };
  
  // Generate breadcrumb structured data
  const breadcrumbStructuredData = breadcrumbs.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.url
    }))
  } : null;
  
  // Combine all JSON-LD data
  const allJsonLD = [
    defaultOrganization,
    breadcrumbStructuredData,
    structuredData,
    ...jsonLD
  ].filter(Boolean);

  return (
    <>
      <Head>
        {/* Basic Meta Tags */}
        <title>{fullTitle}</title>
        <meta name="description" content={description} />
        <meta name="keywords" content={Array.isArray(keywords) ? keywords.join(', ') : keywords} />
        <meta name="author" content={author} />
        <meta name="robots" content={robotsContent} />
        <meta name="viewport" content={viewport} />
        
        {/* Language and Locale */}
        <html lang={language} />
        <meta property="og:locale" content={locale} />
        
        {/* Canonical URL */}
        {finalCanonicalUrl && <link rel="canonical" href={finalCanonicalUrl} />}
        
        {/* Theme and Appearance */}
        <meta name="theme-color" content={themeColor} />
        <meta name="msapplication-navbutton-color" content={themeColor} />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        
        {/* Open Graph Tags */}
        <meta property="og:title" content={finalOgTitle} />
        <meta property="og:description" content={finalOgDescription} />
        <meta property="og:type" content={ogType} />
        <meta property="og:site_name" content={ogSiteName} />
        {url && <meta property="og:url" content={url} />}
        {ogImage && (
          <>
            <meta property="og:image" content={ogImage} />
            <meta property="og:image:alt" content={ogImageAlt || finalOgTitle} />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
          </>
        )}
        
        {/* Twitter Card Tags */}
        <meta name="twitter:card" content={twitterCard} />
        <meta name="twitter:site" content={twitterSite} />
        <meta name="twitter:creator" content={twitterCreator} />
        <meta name="twitter:title" content={finalTwitterTitle} />
        <meta name="twitter:description" content={finalTwitterDescription} />
        {twitterImage && <meta name="twitter:image" content={twitterImage} />}
        
        {/* Alternate Languages */}
        {alternateLanguages.map((lang) => (
          <link key={lang.locale} rel="alternate" hrefLang={lang.locale} href={lang.url} />
        ))}
        
        {/* Performance Optimizations */}
        {preconnect.map((url) => (
          <link key={url} rel="preconnect" href={url} />
        ))}
        
        {dnsPrefetch.map((url) => (
          <link key={url} rel="dns-prefetch" href={url} />
        ))}
        
        {preload.map((resource) => (
          <link 
            key={resource.href} 
            rel="preload" 
            href={resource.href} 
            as={resource.as}
            type={resource.type}
            crossOrigin={resource.crossOrigin}
          />
        ))}
        
        {prefetch.map((url) => (
          <link key={url} rel="prefetch" href={url} />
        ))}
        
        {/* Custom Meta Tags */}
        {customMeta.map((meta, index) => (
          <meta key={index} {...meta} />
        ))}
        
        {/* Structured Data */}
        {allJsonLD.map((data, index) => (
          <script
            key={index}
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(data)
            }}
          />
        ))}
      </Head>
      {children}
    </>
  );
};

/**
 * Hook for dynamic SEO management
 */
export const useSEO = () => {
  const [seoData, setSeoData] = React.useState({});
  
  const updateSEO = React.useCallback((newData) => {
    setSeoData(prevData => ({ ...prevData, ...newData }));
  }, []);
  
  const resetSEO = React.useCallback(() => {
    setSeoData({});
  }, []);
  
  return {
    seoData,
    updateSEO,
    resetSEO
  };
};

/**
 * SEO utilities for generating meta data
 */
export const SEOUtils = {
  // Generate page title with proper formatting
  generateTitle: (pageTitle, siteName = 'Swaggo') => {
    if (!pageTitle) return siteName;
    if (pageTitle.includes(siteName)) return pageTitle;
    return `${pageTitle} | ${siteName}`;
  },
  
  // Generate description with proper length
  generateDescription: (description, maxLength = 160) => {
    if (!description) return '';
    if (description.length <= maxLength) return description;
    return description.substring(0, maxLength - 3).trim() + '...';
  },
  
  // Generate keywords from array or string
  generateKeywords: (keywords) => {
    if (Array.isArray(keywords)) {
      return keywords.join(', ');
    }
    return keywords || '';
  },
  
  // Generate Open Graph image URL
  generateOGImage: (imagePath, baseUrl) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    return `${baseUrl}${imagePath}`;
  },
  
  // Generate structured data for articles
  generateArticleStructuredData: (article) => ({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    image: article.image,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    author: {
      '@type': 'Person',
      name: article.author.name,
      url: article.author.url
    },
    publisher: {
      '@type': 'Organization',
      name: 'Swaggo',
      logo: {
        '@type': 'ImageObject',
        url: `${article.baseUrl}/logo.png`
      }
    }
  }),
  
  // Generate breadcrumbs from navigation path
  generateBreadcrumbs: (path, baseUrl) => {
    const segments = path.split('/').filter(Boolean);
    const breadcrumbs = [{ name: 'Home', url: baseUrl }];
    
    let currentPath = baseUrl;
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      breadcrumbs.push({
        name: segment.charAt(0).toUpperCase() + segment.slice(1),
        url: currentPath
      });
    });
    
    return breadcrumbs;
  },
  
  // Generate FAQ structured data
  generateFAQStructuredData: (faqs) => ({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  }),
  
  // Generate local business structured data
  generateLocalBusinessStructuredData: (business) => ({
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: business.name,
    description: business.description,
    url: business.url,
    telephone: business.phone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: business.address.street,
      addressLocality: business.address.city,
      addressRegion: business.address.state,
      postalCode: business.address.zip,
      addressCountry: business.address.country
    },
    geo: business.coordinates && {
      '@type': 'GeoCoordinates',
      latitude: business.coordinates.lat,
      longitude: business.coordinates.lng
    },
    openingHoursSpecification: business.hours?.map(hour => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: hour.day,
      opens: hour.open,
      closes: hour.close
    }))
  })
};

/**
 * SEO-optimized components
 */
export const SEOImage = ({ src, alt, width, height, priority = false, ...props }) => {
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      {...props}
    />
  );
};

export const SEOLink = ({ href, children, external = false, ...props }) => {
  const linkProps = external ? {
    target: '_blank',
    rel: 'noopener noreferrer'
  } : {};
  
  return (
    <a href={href} {...linkProps} {...props}>
      {children}
    </a>
  );
};

/**
 * Component for page-specific SEO
 */
export const PageSEO = ({ 
  pageName,
  pageType = 'website',
  breadcrumbPath = '',
  baseUrl = 'https://swaggo.com',
  ...seoProps 
}) => {
  // Generate breadcrumbs if path is provided
  const breadcrumbs = breadcrumbPath ? 
    SEOUtils.generateBreadcrumbs(breadcrumbPath, baseUrl) : [];
  
  // Generate structured data based on page type
  let structuredData = null;
  if (pageType === 'article' && seoProps.article) {
    structuredData = SEOUtils.generateArticleStructuredData(seoProps.article);
  } else if (pageType === 'faq' && seoProps.faqs) {
    structuredData = SEOUtils.generateFAQStructuredData(seoProps.faqs);
  } else if (pageType === 'business' && seoProps.business) {
    structuredData = SEOUtils.generateLocalBusinessStructuredData(seoProps.business);
  }
  
  return (
    <SEOManager
      {...seoProps}
      title={SEOUtils.generateTitle(seoProps.title, 'Swaggo')}
      description={SEOUtils.generateDescription(seoProps.description)}
      keywords={SEOUtils.generateKeywords(seoProps.keywords)}
      ogImage={SEOUtils.generateOGImage(seoProps.ogImage, baseUrl)}
      url={`${baseUrl}${breadcrumbPath}`}
      breadcrumbs={breadcrumbs}
      structuredData={structuredData}
      ogType={pageType === 'article' ? 'article' : 'website'}
    />
  );
};

export default SEOManager;
