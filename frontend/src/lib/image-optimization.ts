/**
 * Image Optimization Utilities
 * 
 * T080 - Guidelines and utilities for using Next.js Image optimization
 * 
 * Benefits of next/image:
 * - Automatic image optimization
 * - Lazy loading by default
 * - Responsive images with srcset
 * - WebP/AVIF format conversion
 * - Prevents Cumulative Layout Shift (CLS)
 */

/**
 * Usage Example:
 * 
 * ```tsx
 * import Image from 'next/image';
 * 
 * // Local images (imported)
 * import logoImg from '@/public/logo.png';
 * 
 * function Logo() {
 *   return (
 *     <Image
 *       src={logoImg}
 *       alt="Company Logo"
 *       width={200}
 *       height={50}
 *       priority // Load immediately (above the fold)
 *     />
 *   );
 * }
 * 
 * // Remote images
 * function Avatar({ url }: { url: string }) {
 *   return (
 *     <Image
 *       src={url}
 *       alt="User avatar"
 *       width={40}
 *       height={40}
 *       className="rounded-full"
 *       loading="lazy" // Default behavior
 *     />
 *   );
 * }
 * 
 * // Responsive images
 * function HeroImage() {
 *   return (
 *     <Image
 *       src="/hero.jpg"
 *       alt="Hero image"
 *       fill // Fill parent container
 *       style={{ objectFit: 'cover' }}
 *       sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
 *     />
 *   );
 * }
 * ```
 */

/**
 * Configuration for remote images
 * 
 * Add to next.config.ts:
 * 
 * ```typescript
 * const nextConfig = {
 *   images: {
 *     remotePatterns: [
 *       {
 *         protocol: 'https',
 *         hostname: 'example.com',
 *         pathname: '/images/**',
 *       },
 *     ],
 *     formats: ['image/avif', 'image/webp'],
 *     deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
 *     imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
 *   },
 * };
 * ```
 */

/**
 * Image dimensions helper
 * Calculates aspect ratio and provides common sizes
 */
export const ImageSizes = {
  AVATAR_SM: { width: 32, height: 32 },
  AVATAR_MD: { width: 40, height: 40 },
  AVATAR_LG: { width: 64, height: 64 },
  LOGO_SM: { width: 120, height: 30 },
  LOGO_MD: { width: 200, height: 50 },
  LOGO_LG: { width: 300, height: 75 },
  THUMBNAIL: { width: 150, height: 150 },
  CARD_IMAGE: { width: 400, height: 300 },
  HERO: { width: 1920, height: 1080 },
};

/**
 * Generate srcset sizes string for responsive images
 */
export function generateSizes(config: {
  mobile?: string;
  tablet?: string;
  desktop?: string;
}): string {
  const sizes: string[] = [];
  
  if (config.mobile) {
    sizes.push(`(max-width: 640px) ${config.mobile}`);
  }
  if (config.tablet) {
    sizes.push(`(max-width: 1024px) ${config.tablet}`);
  }
  if (config.desktop) {
    sizes.push(config.desktop);
  }
  
  return sizes.join(', ');
}

/**
 * Image loading priorities
 * 
 * Use priority={true} for:
 * - Above-the-fold images
 * - Logo in header
 * - Hero images
 * - Largest Contentful Paint (LCP) candidates
 * 
 * Use loading="lazy" (default) for:
 * - Below-the-fold images
 * - Images in lists/grids
 * - Background images
 */

/**
 * Placeholder options:
 * 
 * 1. blur - Shows blurred version while loading (requires blurDataURL)
 * 2. empty - Shows empty space while loading
 * 
 * Generate blur placeholder:
 * ```bash
 * npx @plaiceholder/cli ./public/image.jpg
 * ```
 */

/**
 * Best Practices:
 * 
 * 1. Always specify width and height (prevents CLS)
 * 2. Use descriptive alt text for accessibility
 * 3. Use priority for above-the-fold images
 * 4. Use fill for responsive containers
 * 5. Optimize source images before upload
 * 6. Use WebP/AVIF formats when possible
 * 7. Consider lazy loading for images below the fold
 * 8. Use appropriate sizes prop for responsive images
 */

/**
 * Performance Tips:
 * 
 * - Keep images under 1MB
 * - Use appropriate dimensions (don't serve 4K images for thumbnails)
 * - Enable Image Optimization CDN in production
 * - Monitor Core Web Vitals (LCP, CLS)
 * - Use blur placeholders for better perceived performance
 */
