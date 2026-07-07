/** URL-Slug aus Projektname (deutsch-tauglich). */
export function slugify(text: string): string {
  const base = text
    .toLowerCase()
    .trim()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return base || "projekt";
}

export async function uniqueProjectSlug(
  name: string,
  exists: (slug: string) => Promise<boolean>,
): Promise<string> {
  const base = slugify(name);
  if (!(await exists(base))) return base;

  for (let i = 2; i < 100; i++) {
    const candidate = `${base}-${i}`.slice(0, 48);
    if (!(await exists(candidate))) return candidate;
  }

  return `${base}-${Date.now().toString(36)}`.slice(0, 48);
}
