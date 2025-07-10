/**
 * Utility functions for generating SEO-friendly URL slugs
 */

/**
 * Generates a URL-friendly slug from a title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    // Replace spaces with hyphens
    .replace(/\s+/g, '-')
    // Remove special characters except hyphens
    .replace(/[^a-z0-9-]/g, '')
    // Remove multiple consecutive hyphens
    .replace(/-+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '')
    // Limit length to 50 characters
    .substring(0, 50)
    // Remove trailing hyphen if truncated
    .replace(/-+$/, '');
}

/**
 * Generates a unique slug by appending a counter if needed
 */
export function generateUniqueSlug(
  title: string, 
  existingSlugs: string[] = []
): string {
  const baseSlug = generateSlug(title);
  
  if (!existingSlugs.includes(baseSlug)) {
    return baseSlug;
  }
  
  let counter = 1;
  let uniqueSlug = `${baseSlug}-${counter}`;
  
  while (existingSlugs.includes(uniqueSlug)) {
    counter++;
    uniqueSlug = `${baseSlug}-${counter}`;
  }
  
  return uniqueSlug;
}

/**
 * Validates if a string is a valid slug format
 */
export function isValidSlug(slug: string): boolean {
  if (!slug || typeof slug !== 'string') return false;
  
  // Must be lowercase, contain only letters, numbers, and hyphens
  // Cannot start or end with hyphen, no consecutive hyphens
  const slugRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  return slugRegex.test(slug) && slug.length <= 50;
}

/**
 * Creates a fallback slug from an ID if title slug generation fails
 */
export function createFallbackSlug(id: string): string {
  // Use the last 8 characters of the ID for a shorter slug
  const shortId = id.slice(-8);
  return `event-${shortId}`;
}