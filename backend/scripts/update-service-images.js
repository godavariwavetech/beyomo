const { connectDB } = require('../utils/dbconnect');

const SERVICE_IMAGES = {
  // Facial
  'Classic Facial':          'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&q=80&fit=crop',
  'Deep Cleansing Facial':   'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=600&q=80&fit=crop',
  'Anti-Aging Facial':       'https://images.unsplash.com/photo-1552693673-1bf958298935?w=600&q=80&fit=crop',

  // Hair Spa
  'Deep Conditioning Hair Spa': 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&q=80&fit=crop',
  'Keratin Hair Spa':        'https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=600&q=80&fit=crop',
  'Scalp Treatment':         'https://images.unsplash.com/photo-1583795484071-3c453e3a7c71?w=600&q=80&fit=crop',

  // Makeup
  'Party Makeup':            'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=600&q=80&fit=crop',
  'Natural Everyday Makeup': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&q=80&fit=crop',
  'HD Airbrush Makeup':      'https://images.unsplash.com/photo-1583195764036-1ce2e97dac2c?w=600&q=80&fit=crop',

  // Waxing
  'Full Legs Waxing':        'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=600&q=80&fit=crop',
  'Underarm Waxing':         'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=600&q=80&fit=crop',
  'Full Body Waxing':        'https://images.unsplash.com/photo-1526413232644-8a40f03cc03b?w=600&q=80&fit=crop',

  // Pedicure
  'Classic Pedicure':        'https://images.unsplash.com/photo-1604902396830-aca29e19b067?w=600&q=80&fit=crop',
  'Spa Pedicure':            'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=600&q=80&fit=crop',
  'Gel Pedicure':            'https://images.unsplash.com/photo-1604902396830-aca29e19b067?w=600&q=80&fit=crop',

  // Haircut
  'Basic Haircut & Trim':    'https://images.unsplash.com/photo-1560869713-7d0a29430803?w=600&q=80&fit=crop',
  'Layer Cut & Style':       'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80&fit=crop',
  'Hair Wash, Cut & Blow Dry': 'https://images.unsplash.com/photo-1522337180988-2df4d5bf9ca6?w=600&q=80&fit=crop',

  // Bridal Makeup
  'Traditional Bridal Makeup': 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=600&q=80&fit=crop',
  'Engagement Makeup':       'https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=600&q=80&fit=crop',
  'Airbrush Bridal Makeup':  'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&q=80&fit=crop',

  // Threading
  'Eyebrow Threading & Shaping': 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600&q=80&fit=crop',
  'Upper Lip Threading':     'https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=600&q=80&fit=crop',
  'Full Face Threading':     'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=600&q=80&fit=crop',

  // Massage
  'Swedish Relaxation Massage': 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&q=80&fit=crop',
  'Deep Tissue Massage':     'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=600&q=80&fit=crop',
  'Aromatherapy Massage':    'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=600&q=80&fit=crop',

  // Manicure
  'Classic Manicure':        'https://images.unsplash.com/photo-1604902396830-aca29e19b067?w=600&q=80&fit=crop',
  'Gel Manicure':            'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80&fit=crop',
  'Acrylic Nail Extension':  'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=600&q=80&fit=crop',

  // Skin Care
  'Basic Skin Cleanup':      'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&q=80&fit=crop',
  'De-Tan Treatment':        'https://images.unsplash.com/photo-1552693673-1bf958298935?w=600&q=80&fit=crop',
  'HydraFacial':             'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&q=80&fit=crop',

  // Nail Art
  'Basic Nail Art':          'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80&fit=crop',
  '3D Nail Art':             'https://images.unsplash.com/photo-1607779097040-26e80aa78e66?w=600&q=80&fit=crop',
  'Ombre Gradient Nail Art': 'https://images.unsplash.com/photo-1604902396830-aca29e19b067?w=600&q=80&fit=crop',
};

async function run() {
  try {
    await connectDB();
    const Service = require('../api/services/models/service.model');

    let updated = 0;
    for (const [name, image] of Object.entries(SERVICE_IMAGES)) {
      const [count] = await Service.update({ image }, { where: { name } });
      if (count > 0) {
        console.log(`  ✓ ${name}`);
        updated += count;
      } else {
        console.log(`  - not found: ${name}`);
      }
    }

    console.log(`\nDone — ${updated} services updated with images.`);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

run();
