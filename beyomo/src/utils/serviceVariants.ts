/**
 * Subcategory chips derived from the service catalogue itself.
 *
 * A category can carry real subcategory rows (service_subcategories), and where it does
 * those win — nothing here runs. Where it doesn't, the only subcategory information the
 * API carries is the variant baked into each service's own name, as a trailing
 * parenthetical: "Back Wax (Honey)", "Face De-Tan (O3+)", "Botox (Men)". Reading that
 * back turns a flat 47-item Waxing list into the same Honey / Rica / Brazilian / Roll-on
 * chips a subcategory row would have given, without inventing any name — every label
 * here is a substring of a service name the API returned.
 */

export type DerivedVariant = { key: string; name: string };

// Trailing "(...)" only. A parenthetical mid-name is part of the service's description
// ("Hair Colour (Loreal, Schwarzkopf)" is one service, not a variant axis).
const TRAILING_PAREN = /\s*\(([^()]+)\)\s*$/;

/** The variant a service name ends with, or null when it has none. */
export const variantOf = (name: unknown): string | null => {
  const match = TRAILING_PAREN.exec(String(name ?? ''));
  const inner = match?.[1]?.trim();
  return inner ? inner : null;
};

/** Case-insensitive so "(RICA)" and "(Rica)" don't split into two chips. */
export const variantKeyOf = (name: unknown): string | null =>
  variantOf(name)?.toLowerCase() ?? null;

// A parenthetical only one service uses is a description of that service, not an axis
// the catalogue is organised along — "Rica Waxing (FA + HL + UA)" is one bundle, and a
// chip leading to a list of one is noise. Two is the smallest group worth filtering to.
const MIN_SERVICES_PER_VARIANT = 2;

// One surviving variant is not a choice: the row would offer "All" and a single chip
// covering part of the same list. Keep the row hidden, exactly as before.
const MIN_VARIANTS_FOR_A_ROW = 2;

/**
 * Groups a category's services by their trailing variant. Returns [] when the names
 * carry no usable split, which renders no chip row — the pre-existing behaviour for
 * every category that has neither subcategory rows nor variant-suffixed names.
 */
export const deriveVariants = (services: ReadonlyArray<{ name?: unknown }>): DerivedVariant[] => {
  const groups = new Map<string, { name: string; count: number }>();

  for (const service of services ?? []) {
    const name = variantOf(service?.name);
    if (!name) continue;
    const key = name.toLowerCase();
    const seen = groups.get(key);
    // First spelling wins the label, so the chip reads the way the catalogue does.
    if (seen) seen.count += 1;
    else groups.set(key, { name, count: 1 });
  }

  const kept = [...groups.entries()]
    .filter(([, group]) => group.count >= MIN_SERVICES_PER_VARIANT)
    .map(([key, group]) => ({ key, name: group.name }))
    // Mirrors the real subcategory endpoint, which orders by name once sortOrder ties.
    .sort((a, b) => a.name.localeCompare(b.name));

  return kept.length >= MIN_VARIANTS_FOR_A_ROW ? kept : [];
};
