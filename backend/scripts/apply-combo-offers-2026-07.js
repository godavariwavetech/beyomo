// One-time bulk add of fixed combo packages from "Combo Offers.xlsx".
// Adds 18 new `service_packages` rows built from the current rate-card catalog
// (see apply-ratecard-2026-07.js). Two of those combos needed services that don't
// exist yet — Foot Massage and Back Massage — so this script also creates those
// two services under the existing "Head Massage" category before wiring up the
// "Massage Combo" package that needs them.
const { connectDB } = require('../utils/dbconnect');

// { name, category, basePrice, duration } — new services required by the combos
// below but missing from the rate-card catalog.
const NEW_SERVICES = [
  { category: 'Head Massage', name: 'Foot Massage', basePrice: 499, duration: 30 },
  { category: 'Head Massage', name: 'Back Massage', basePrice: 699, duration: 30 },
];

// Each combo's `items` list names services that must already exist (by exact name,
// post NEW_SERVICES insertion) in the live catalog. `price` is the discounted combo
// price from the spreadsheet; `originalPrice` is the sum of the individual service
// prices, computed at run time from the resolved catalog rows.
const COMBOS = [
  {
    title: 'Waxing Offer', price: 1199, image: 'waxing',
    items: ['Full Arms Wax (RICA)', 'Full Legs Wax (RICA)', 'Under Arms Wax (RICA)'],
  },
  {
    title: 'Glow & Smooth', price: 1999, image: 'pedicure',
    items: ['Dry Fruit Facial', 'Lavendor Pedicure', 'Full Arms Wax (RICA)', 'Full Legs Wax (RICA)', 'Under Arms Wax (RICA)'],
  },
  {
    title: 'Fresh Look', price: 2499, image: 'manicure',
    items: ['O3+ Cleanup', 'Bubblegum Pedicure', 'Bubblegum Manicure', 'Full Arms Wax (RICA)', 'Full Legs Wax (RICA)', 'Under Arms Wax (RICA)'],
  },
  {
    // Spreadsheet reuses the "Fresh Look" name for a second, pricier combo — kept
    // distinct here ("Fresh Look Deluxe") so two identically-titled cards don't show
    // up in the admin/app; rename back if the business wants them to match exactly.
    title: 'Fresh Look Deluxe', price: 2699, image: 'threading',
    items: ['Party Glow Facial', 'Aroma Pedicure', 'Aroma Manicure', 'Full Arms Wax (Roll-on)', 'Half Legs Wax (Roll-on)', 'Under Arms Wax (Roll-on)'],
  },
  {
    title: 'O3 Bright Package', price: 1999, image: 'detan',
    items: ['O3+ Cleanup', 'Face De-Tan (O3+)', 'Neck De-Tan (O3+)', 'Full Hands De-Tan (O3+)'],
  },
  {
    title: 'Honey Wax Package', price: 499, image: 'waxing',
    items: ['Full Arms Wax (Honey)', 'Full Legs Wax (Honey)', 'Under Arms Wax (Honey)'],
  },
  {
    title: 'Rica Wax Package', price: 999, image: 'waxing-body',
    items: ['Full Arms Wax (RICA)', 'Full Legs Wax (RICA)', 'Under Arms Wax (RICA)'],
  },
  {
    // "Fruit Cleanup" in the sheet has no exact catalog match — mapped to the closest
    // fruit/organic cleanup service.
    title: 'Cleanup & Wax Package', price: 1199, image: 'cleanup',
    items: ['Organic Clean-Up - Dry Skin', 'Face De-Tan (Fruit)', 'Half Arms Wax (Honey)', 'Half Legs Wax (Honey)', 'Under Arms Wax (Honey)'],
  },
  {
    title: 'Facial & Wax Package', price: 1799, image: 'facial',
    items: ['Fruit Facial', 'Face De-Tan (Fruit)', 'Full Arms Wax (Honey)', 'Under Arms Wax (Honey)', 'Half Legs Wax (Honey)'],
  },
  {
    // "Root Touchup / Men Hair Colour" was a single either/or slot — resolved to the
    // women's Root Touchup service; "De-tan HA" resolved to Half Hands De-Tan.
    title: 'Colour & Facial Package', price: 2499, image: 'makeup',
    items: ['Root Touchup (Women)', 'Fruit Facial', 'Face De-Tan (Fruit)', 'Neck De-Tan (Fruit)', 'Half Hands De-Tan (Fruit)'],
  },
  {
    // "Pedicure" had no product line specified — resolved to the cheapest pedicure.
    title: 'Wax, Pedi & Facial Package', price: 1999, image: 'pedicure-hands',
    items: ['Full Arms Wax (Honey)', 'Under Arms Wax (Honey)', 'Full Legs Wax (Honey)', 'Lavendor Pedicure', 'Fruit Facial'],
  },
  {
    // "Beard Trim / Shave" was a single either/or slot — resolved to Beard Trim.
    title: 'Men Package 1', price: 899, image: 'haircut',
    items: ['Haircut', 'Beard Trim', 'Face De-Tan (Fruit)', 'Full Hands De-Tan (Fruit)'],
  },
  {
    title: 'Men Package 2', price: 1499, image: 'haircut-style',
    items: ['Haircut', 'Beard Trim', 'Fruit Facial', 'Face De-Tan (Fruit)', 'Neck De-Tan (Fruit)'],
  },
  {
    // "Hair Spa" had no length/brand specified — resolved to the men's base tier
    // (Matrix), matching the combo's men's-grooming theme.
    title: 'Men Package 3', price: 1799, image: 'hairwash',
    items: ['Haircut', 'Beard Trim', 'Hair Colour (Loreal, Schwarzkopf)', 'Hair Spa - Men (Matrix)'],
  },
  {
    title: 'Wine Glow Package', price: 1999, image: 'gel-manicure',
    items: ['Wine Facial', 'Wine Pedicure', 'Wine Manicure'],
  },
  {
    // Needs the two services created by NEW_SERVICES above. "Head Massage" resolved
    // to the Head Massage category's Regular Oil variant (not the Men Grooming one),
    // matching the combo's general/unisex framing.
    title: 'Massage Combo', price: 1499, image: 'massage',
    items: ['Regular Oil Head Massage', 'Foot Massage', 'Back Massage'],
  },
  {
    // "Full Arms DeTan" isn't a real De-Tan body part in the catalog (only Half/Full
    // Hands exist) — resolved to Full Hands De-Tan.
    title: 'DeTan Combo - Fruit', price: 799, image: 'detan',
    items: ['Face De-Tan (Fruit)', 'Neck De-Tan (Fruit)', 'Full Hands De-Tan (Fruit)', 'Half Legs De-Tan (Fruit)'],
  },
  {
    title: 'DeTan Premium Combo', price: 1499, image: 'detan',
    items: ['Face De-Tan (O3+)', 'Neck De-Tan (O3+)', 'Full Hands De-Tan (O3+)', 'Half Legs De-Tan (O3+)'],
  },
];

// Reused, already-verified-working images (also used elsewhere in this codebase) —
// keyed by the `image` tag above so combos sharing a theme share a photo.
const IMAGES = {
  waxing:          'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=600&q=80&fit=crop',
  'waxing-body':   'https://images.unsplash.com/photo-1526413232644-8a40f03cc03b?w=600&q=80&fit=crop',
  threading:       'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=600&q=80&fit=crop',
  detan:           'https://images.unsplash.com/photo-1552693673-1bf958298935?w=600&q=80&fit=crop',
  cleanup:         'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&q=80&fit=crop',
  facial:          'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=600&q=80&fit=crop',
  makeup:          'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&q=80&fit=crop',
  pedicure:        'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&q=80&fit=crop',
  'pedicure-hands': 'https://images.unsplash.com/photo-1604902396830-aca29e19b067?w=600&q=80&fit=crop',
  manicure:        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80&fit=crop',
  'gel-manicure':  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80&fit=crop',
  haircut:         'https://images.unsplash.com/photo-1560869713-7d0a29430803?w=600&q=80&fit=crop',
  'haircut-style': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80&fit=crop',
  hairwash:        'https://images.unsplash.com/photo-1522337180988-2df4d5bf9ca6?w=600&q=80&fit=crop',
  massage:         'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&q=80&fit=crop',
};

async function run() {
  try {
    await connectDB();
    const ServiceCategory = require('../api/services/models/serviceCategory.model');
    const Service = require('../api/services/models/service.model');
    const ServicePackage = require('../api/packages/models/package.model');

    // 1. Create the two missing massage services under "Head Massage", if not already present.
    const headMassageCat = await ServiceCategory.findOne({ where: { name: 'Head Massage' } });
    if (!headMassageCat) throw new Error('"Head Massage" category not found — run apply-ratecard-2026-07.js first.');

    for (const s of NEW_SERVICES) {
      const existing = await Service.findOne({ where: { name: s.name, categoryId: headMassageCat.id } });
      if (existing) {
        if (!existing.isActive) await existing.update({ isActive: true });
        console.log(`  ~ service "${s.name}" already exists (id ${existing.id})`);
        continue;
      }
      const created = await Service.create({
        categoryId: headMassageCat.id,
        name: s.name,
        basePrice: s.basePrice,
        duration: s.duration,
        isActive: true,
      });
      console.log(`  + service "${s.name}" created (id ${created.id})`);
    }

    // 2. Build each combo's service line items by looking up current catalog rows.
    const allServices = await Service.findAll({ where: { isActive: true } });
    const byName = new Map(allServices.map((s) => [s.name, s]));

    console.log(`\nBuilding ${COMBOS.length} combo packages...\n`);
    let created = 0, skipped = 0;
    for (const combo of COMBOS) {
      const existing = await ServicePackage.findOne({ where: { title: combo.title } });
      if (existing) {
        console.log(`  ~ package "${combo.title}" already exists (id ${existing.id}) — skipped`);
        skipped++;
        continue;
      }

      const lineItems = combo.items.map((name) => {
        const svc = byName.get(name);
        if (!svc) throw new Error(`Combo "${combo.title}": service "${name}" not found in active catalog`);
        return {
          serviceId: svc.id,
          name: svc.name,
          price: parseFloat(svc.basePrice),
          duration: svc.duration,
          image: svc.image || null,
        };
      });
      const originalPrice = lineItems.reduce((sum, i) => sum + i.price, 0);

      const row = await ServicePackage.create({
        title: combo.title,
        description: null,
        image: IMAGES[combo.image] || null,
        packageType: 'fixed',
        price: combo.price,
        originalPrice,
        services: lineItems,
        isActive: true,
        showOnHome: false,
        cityIds: [],
      });
      console.log(`  + package "${combo.title}" created (id ${row.id}) — ₹${combo.price} (was ₹${originalPrice})`);
      created++;
    }

    console.log(`\nDone. ${created} packages created, ${skipped} already existed.`);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message, err.stack);
    process.exit(1);
  }
}

run();
