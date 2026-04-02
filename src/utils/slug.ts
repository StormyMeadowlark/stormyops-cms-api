// src/utils/slug.ts

export function normalizeSlug(input: string) {
  return input
    .trim()
    .toLowerCase()
    // replace spaces/underscores with hyphens
    .replace(/[\s_]+/g, "-")
    // remove anything that isn't alphanumeric or hyphen
    .replace(/[^a-z0-9-]/g, "")
    // collapse multiple hyphens
    .replace(/-+/g, "-")
    // trim hyphens
    .replace(/^-+|-+$/g, "")
}

export function isValidSlug(slug: string) {
  // requires at least 3 chars, starts with letter/number, only letters/numbers/hyphens
  return /^[a-z0-9][a-z0-9-]{1,98}[a-z0-9]$/.test(slug) || /^[a-z0-9]{3,100}$/.test(slug)
}