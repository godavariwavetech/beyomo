// Package IDs identify catalog offers; selection IDs identify individual cart entries.
// Older bookings saved each selection contiguously, in package-summary order.
export function groupBookingPackages(packages = [], services = []) {
  const groups = [];
  const handled = new Set();
  for (const pkg of packages) {
    const id = Number(pkg.packageId);
    if (handled.has(id)) continue;
    handled.add(id);
    const entries = packages.map((p, i) => ({pkg: p, index: i}))
      .filter(entry => Number(entry.pkg.packageId) === id);
    const items = services.filter(s => s.addedByPackage && Number(s.packageId) === id);
    const tagged = entries.every(entry => entry.pkg.packageSelectionId != null)
      && items.every(item => item.packageSelectionId != null);
    const counts = entries.map(entry => Number(entry.pkg.serviceCount) || items.length / entries.length);
    const canSplitLegacy = !items.some(item => item.removed || item.addedByAdmin || item.addedByPartner || item.addedByUser)
      && counts.every(count => Number.isInteger(count) && count > 0)
      && counts.reduce((sum, count) => sum + count, 0) === items.length;
    if (!tagged && entries.length > 1 && !canSplitLegacy) {
      // Edited legacy records have no reliable boundaries. Show one combined card
      // instead of guessing which selection owns a service or repeating services.
      const qty = entries.reduce((sum, entry) => sum + (Number(entry.pkg.qty) || 1), 0);
      const price = entries.reduce((sum, entry) => sum + (Number(entry.pkg.price) || 0) * (Number(entry.pkg.qty) || 1), 0);
      groups.push({key: `combined-${id}`, packageId: pkg.packageId, title: pkg.title,
        qty, unitPrice: price / qty, price, items, combined: true});
      continue;
    }
    let offset = 0;
    for (const [position, entry] of entries.entries()) {
      const current = entry.pkg;
      const qty = Number(current.qty) || 1;
      const selected = tagged
        ? items.filter(item => item.packageSelectionId === current.packageSelectionId)
        : entries.length === 1 ? items : items.slice(offset, offset + counts[position]);
      offset += counts[position];
      groups.push({key: current.packageSelectionId ?? `selection-${entry.index}`,
        packageId: current.packageId, title: current.title, qty,
        unitPrice: Number(current.price) || 0, price: (Number(current.price) || 0) * qty,
        items: selected});
    }
  }
  return groups;
}
