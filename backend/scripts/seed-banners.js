const { sequelize } = require('../utils/dbconnect');
const Banner = require('../api/banners/models/banner.model');

const BANNERS = [
  // ── Top banners (rotate through, only 1-2 needed) ──
  {
    type: 'top',
    title: 'MASSAGES',
    subtitle: 'Therapeutic',
    description: 'Relieve tension and restore balance with every touch.',
    image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1200&q=90&fit=crop',
    gradientStart: '#1a5c4a',
    gradientEnd: '#022723',
    buttonText: 'Book Now',
    targetScreen: 'ServiceListing',
    targetParam: 'Massage',
    isActive: true,
    sortOrder: 1,
  },
  {
    type: 'top',
    title: 'FACIALS',
    subtitle: 'Rejuvenating',
    description: 'Glow from within — professional facial treatments at your doorstep.',
    image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=1200&q=90&fit=crop',
    gradientStart: '#6b2d5e',
    gradientEnd: '#2d0a27',
    buttonText: 'Book Now',
    targetScreen: 'ServiceListing',
    targetParam: 'Facial',
    isActive: true,
    sortOrder: 2,
  },

  // ── Promo cards (shown 2 side-by-side at bottom) ──
  {
    type: 'promo',
    title: '50% OFF',
    subtitle: 'NEW USER\nSPECIAL',
    description: 'On Your First Booking',
    image: null,
    gradientStart: '#0E5843',
    gradientEnd: '#022723',
    buttonText: 'BOOK NOW',
    targetScreen: 'ServiceListing',
    targetParam: 'Massage',
    isActive: true,
    sortOrder: 1,
  },
  {
    type: 'promo',
    title: '30% OFF',
    subtitle: 'BRIDAL\nSPECIAL',
    description: 'On All Bridal Packages',
    image: null,
    gradientStart: '#7B3F00',
    gradientEnd: '#3D1F00',
    buttonText: 'EXPLORE',
    targetScreen: 'ServiceListing',
    targetParam: 'Bridal Makeup',
    isActive: true,
    sortOrder: 2,
  },
];

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('DB connected.');

    // Sync only the banners table
    await Banner.sync();

    const existing = await Banner.count();
    if (existing > 0) {
      console.log(`Banners table already has ${existing} rows. Skipping seed.`);
      console.log('To re-seed, delete existing rows first: DELETE FROM banners;');
      process.exit(0);
    }

    for (const b of BANNERS) {
      await Banner.create(b);
      console.log(`  Created [${b.type}] ${b.title}`);
    }

    console.log(`\nDone — ${BANNERS.length} banners seeded.`);
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err.message);
    process.exit(1);
  }
}

seed();
