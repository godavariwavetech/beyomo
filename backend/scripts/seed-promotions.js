require("dotenv").config();
const { connectDB } = require("../utils/dbconnect");

const NOW = Date.now();
const DAY = 24 * 60 * 60 * 1000;

const COUPONS = [
  {
    code: "WELCOME100",
    type: "flat",
    discount: 100,
    maxDiscount: null,
    minOrderAmount: 499,
    maxUses: 500,
    validFrom: new Date(NOW - DAY),
    validTill: new Date(NOW + 60 * DAY),
    description: "Flat ₹100 off on your first booking above ₹499",
  },
  {
    code: "SAVE20",
    type: "percent",
    discount: 20,
    maxDiscount: 300,
    minOrderAmount: 999,
    maxUses: 1000,
    validFrom: new Date(NOW - DAY),
    validTill: new Date(NOW + 30 * DAY),
    description: "20% off on orders above ₹999, up to ₹300",
  },
  {
    code: "SPA50",
    type: "percent",
    discount: 50,
    maxDiscount: 1000,
    minOrderAmount: 1500,
    maxUses: 200,
    validFrom: new Date(NOW - DAY),
    validTill: new Date(NOW + 15 * DAY),
    description: "50% off on spa & wellness bookings above ₹1500",
  },
];

// Same width/height (and fit=crop) on every offer/package image so the carousel cards line up
// cleanly — matches the ~1.9:1 aspect ratio of the package image box in HomeScreen.tsx.
const PROMO_IMG = (path) => `https://images.unsplash.com/${path}?w=800&h=420&q=90&fit=crop`;
const OFFER_IMG = PROMO_IMG;

// freeServiceId: 11 = Underarm Waxing (₹199) — cheap, safe default "free" add-on
const OFFERS = [
  {
    title: "Spend ₹999, Get Underarm Waxing Free",
    description: "Spend ₹999 or more on a single booking and get a free Underarm Waxing service.",
    image: OFFER_IMG("photo-1560750588-73207b1ef5b8"),
    triggerType: "min_spend",
    triggerValue: { amount: 999 },
    freeServiceId: 11,
    validFrom: new Date(NOW - DAY),
    validTill: new Date(NOW + 45 * DAY),
    maxUses: 300,
  },
  {
    title: "Book a Facial + Haircut, Get Threading Free",
    description: "Add both Deep Cleansing Facial and Classic Haircut to your booking to get Eyebrow Threading free.",
    image: OFFER_IMG("photo-1570172619644-dfd03ed5d881"),
    triggerType: "specific_services",
    triggerValue: { serviceIds: [1, 2] },
    freeServiceId: 11,
    validFrom: new Date(NOW - DAY),
    validTill: new Date(NOW + 45 * DAY),
    maxUses: 200,
  },
  {
    title: "Book 3 Services, Get 1 Free",
    description: "Add any 3 services to your booking and get a 4th service free.",
    image: OFFER_IMG("photo-1487412947147-5cebf100ffc2"),
    triggerType: "min_count",
    triggerValue: { count: 3 },
    freeServiceId: 11,
    validFrom: new Date(NOW - DAY),
    validTill: new Date(NOW + 45 * DAY),
    maxUses: 150,
  },
];

const PACKAGES = [
  {
    title: "Bridal Glow Package",
    description: "Facial, hair spa & makeup combo for that complete pre-wedding glow.",
    image: PROMO_IMG("photo-1595476108010-b4d1f102b1b1"),
    packageType: "fixed",
    price: 2999,
    originalPrice: 3997,
    services: [
      { serviceId: 2, name: "Deep Cleansing Facial", price: 999, duration: 75, image: null },
      { serviceId: 5, name: "Keratin Hair Spa", price: 1499, duration: 90, image: null },
      { serviceId: 8, name: "Natural Everyday Makeup", price: 999, duration: 45, image: null },
    ],
    validFrom: new Date(NOW - DAY),
    validTill: new Date(NOW + 60 * DAY),
  },
  {
    title: "Quick Refresh Combo",
    description: "Haircut + classic pedicure for a fast midweek refresh.",
    image: PROMO_IMG("photo-1560869713-7d0a29430803"),
    packageType: "fixed",
    price: 999,
    originalPrice: 1298,
    services: [
      { serviceId: 1, name: "Classic Haircut", price: 299, duration: 30, image: null },
      { serviceId: 14, name: "Spa Pedicure", price: 999, duration: 60, image: null },
    ],
    validFrom: new Date(NOW - DAY),
    validTill: new Date(NOW + 60 * DAY),
  },
  {
    title: "Pick Any 3 — Waxing Category",
    description: "Choose any 3 waxing services at a flat discounted price.",
    image: PROMO_IMG("photo-1598440947619-2c35fc9aa908"),
    packageType: "flexible",
    price: 1499,
    originalPrice: null,
    serviceCount: 3,
    categoryId: 4,
    validFrom: new Date(NOW - DAY),
    validTill: new Date(NOW + 60 * DAY),
  },
];

connectDB()
  .then(async () => {
    const Coupon = require("../api/coupons/models/coupon.model");
    const Offer = require("../api/offers/models/offer.model");
    const ServicePackage = require("../api/packages/models/package.model");

    let couponsCreated = 0, offersCreated = 0, offersUpdated = 0, packagesCreated = 0, packagesUpdated = 0;

    for (const c of COUPONS) {
      const existing = await Coupon.findOne({ where: { code: c.code } });
      if (existing) { console.log(`[~] Coupon already exists: ${c.code}`); continue; }
      await Coupon.create(c);
      couponsCreated++;
      console.log(`[+] Coupon: ${c.code}`);
    }

    for (const o of OFFERS) {
      const existing = await Offer.findOne({ where: { title: o.title } });
      if (existing) {
        if (!existing.image && o.image) {
          await existing.update({ image: o.image });
          offersUpdated++;
          console.log(`[~] Offer image backfilled: ${o.title}`);
        } else {
          console.log(`[~] Offer already exists: ${o.title}`);
        }
        continue;
      }
      await Offer.create(o);
      offersCreated++;
      console.log(`[+] Offer: ${o.title}`);
    }

    for (const p of PACKAGES) {
      const existing = await ServicePackage.findOne({ where: { title: p.title } });
      if (existing) {
        if (!existing.image && p.image) {
          await existing.update({ image: p.image });
          packagesUpdated++;
          console.log(`[~] Package image backfilled: ${p.title}`);
        } else {
          console.log(`[~] Package already exists: ${p.title}`);
        }
        continue;
      }
      await ServicePackage.create(p);
      packagesCreated++;
      console.log(`[+] Package: ${p.title}`);
    }

    console.log(`\nDone! ${couponsCreated} coupons, ${offersCreated} offers created (${offersUpdated} backfilled), ${packagesCreated} packages created (${packagesUpdated} backfilled).`);
    process.exit(0);
  })
  .catch((e) => {
    console.error("Error:", e.message);
    process.exit(1);
  });
