require("dotenv").config();
const { connectDB } = require("../utils/dbconnect");

const SEED = [
  {
    name: "Facial",
    description: "Professional facial treatments for glowing, healthy skin",
    image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&q=80&fit=crop",
    services: [
      { name: "Classic Facial", description: "A relaxing deep-cleanse facial with steam, extractions, and moisturiser to refresh and brighten your skin.", basePrice: 799, maxPrice: 1199, duration: 60 },
      { name: "Deep Cleansing Facial", description: "Thorough pore-cleansing treatment using medicated products to remove impurities and reduce blackheads.", basePrice: 999, maxPrice: 1499, duration: 75 },
      { name: "Anti-Aging Facial", description: "Targets fine lines and wrinkles with collagen-boosting serums and lifting massage techniques.", basePrice: 1499, maxPrice: 2499, duration: 90 },
    ],
  },
  {
    name: "Hair Spa",
    description: "Nourishing hair spa treatments for strong, shiny, and healthy hair",
    image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&q=80&fit=crop",
    services: [
      { name: "Deep Conditioning Hair Spa", description: "Intensive moisture treatment that repairs damage, reduces frizz, and adds brilliant shine.", basePrice: 599, maxPrice: 999, duration: 60 },
      { name: "Keratin Hair Spa", description: "Protein-rich keratin treatment to strengthen hair shafts, control frizz, and improve manageability.", basePrice: 1499, maxPrice: 2499, duration: 90 },
      { name: "Scalp Treatment", description: "Targeted scalp massage with nourishing oils to stimulate hair growth and treat dandruff.", basePrice: 799, maxPrice: 1299, duration: 45 },
    ],
  },
  {
    name: "Makeup",
    description: "Professional makeup services for every occasion",
    image: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=600&q=80&fit=crop",
    services: [
      { name: "Party Makeup", description: "Glamorous makeup look perfect for parties, functions, and special events using premium brands.", basePrice: 1499, maxPrice: 2499, duration: 60 },
      { name: "Natural Everyday Makeup", description: "Light, flawless makeup for a polished natural look suitable for office, college, or casual outings.", basePrice: 999, maxPrice: 1799, duration: 45 },
      { name: "HD Airbrush Makeup", description: "High-definition airbrush technique for a flawless, long-lasting look that photographs beautifully.", basePrice: 2499, maxPrice: 3999, duration: 75 },
    ],
  },
  {
    name: "Waxing",
    description: "Smooth and hair-free skin with professional waxing services",
    image: "https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=600&q=80&fit=crop",
    services: [
      { name: "Full Legs Waxing", description: "Complete leg waxing using soft or hard wax for silky smooth legs that stay hair-free longer.", basePrice: 599, maxPrice: 999, duration: 45 },
      { name: "Underarm Waxing", description: "Quick and effective underarm waxing for clean, smooth underarms with minimal discomfort.", basePrice: 199, maxPrice: 399, duration: 15 },
      { name: "Full Body Waxing", description: "Comprehensive full-body waxing service covering arms, legs, underarms, and back for complete smoothness.", basePrice: 1499, maxPrice: 2499, duration: 120 },
    ],
  },
  {
    name: "Pedicure",
    description: "Relaxing pedicure treatments for beautiful, well-groomed feet",
    image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&q=80&fit=crop",
    services: [
      { name: "Classic Pedicure", description: "Soak, scrub, nail trim, cuticle care, and polish for refreshed and neat feet.", basePrice: 499, maxPrice: 799, duration: 45 },
      { name: "Spa Pedicure", description: "Luxurious pedicure with exfoliating scrub, paraffin wax treatment, and relaxing foot massage.", basePrice: 999, maxPrice: 1499, duration: 60 },
      { name: "Gel Pedicure", description: "Long-lasting gel polish pedicure that stays chip-free for up to 3 weeks with glossy finish.", basePrice: 799, maxPrice: 1199, duration: 60 },
    ],
  },
  {
    name: "Haircut",
    description: "Expert haircuts and styling by professional hair stylists",
    image: "https://images.unsplash.com/photo-1560869713-7d0a29430803?w=600&q=80&fit=crop",
    services: [
      { name: "Basic Haircut & Trim", description: "Precise haircut with blow-dry to suit your face shape and personal style.", basePrice: 299, maxPrice: 599, duration: 30 },
      { name: "Layer Cut & Style", description: "Trendy layered haircut with styling to add volume, movement, and dimension.", basePrice: 499, maxPrice: 899, duration: 45 },
      { name: "Hair Wash, Cut & Blow Dry", description: "Complete hair service: shampooing, conditioning, cut, and professional blow-dry finish.", basePrice: 699, maxPrice: 1199, duration: 60 },
    ],
  },
  {
    name: "Bridal Makeup",
    description: "Stunning bridal makeup packages for your most special day",
    image: "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=600&q=80&fit=crop",
    services: [
      { name: "Traditional Bridal Makeup", description: "Classic Indian bridal look with heavy base, dramatic eye makeup, and traditional accessories styling.", basePrice: 7999, maxPrice: 14999, duration: 180 },
      { name: "Engagement Makeup", description: "Elegant and sophisticated makeup for engagement ceremonies with a soft glam finish.", basePrice: 2999, maxPrice: 5999, duration: 90 },
      { name: "Airbrush Bridal Makeup", description: "Premium airbrush technique for a flawless, sweat-proof bridal look that lasts through the entire celebration.", basePrice: 9999, maxPrice: 19999, duration: 210 },
    ],
  },
  {
    name: "Threading",
    description: "Precise eyebrow and facial hair threading for defined features",
    image: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600&q=80&fit=crop",
    services: [
      { name: "Eyebrow Threading & Shaping", description: "Expert eyebrow shaping using threading technique for perfectly arched, defined brows.", basePrice: 79, maxPrice: 149, duration: 15 },
      { name: "Upper Lip Threading", description: "Quick and precise upper lip hair removal by threading for smooth, clean results.", basePrice: 49, maxPrice: 99, duration: 10 },
      { name: "Full Face Threading", description: "Complete facial hair removal including eyebrows, upper lip, chin, forehead, and side face.", basePrice: 199, maxPrice: 349, duration: 30 },
    ],
  },
  {
    name: "Massage",
    description: "Therapeutic massage services for relaxation and wellness",
    image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&q=80&fit=crop",
    services: [
      { name: "Swedish Relaxation Massage", description: "Classic full-body Swedish massage using long strokes and kneading to ease tension and promote relaxation.", basePrice: 1199, maxPrice: 1999, duration: 60 },
      { name: "Deep Tissue Massage", description: "Firm-pressure massage targeting deep muscle layers to relieve chronic pain and stiffness.", basePrice: 1499, maxPrice: 2499, duration: 60 },
      { name: "Aromatherapy Massage", description: "Soothing full-body massage with essential oils to calm the mind, reduce stress, and nourish the skin.", basePrice: 1499, maxPrice: 2499, duration: 75 },
    ],
  },
  {
    name: "Manicure",
    description: "Beautiful and well-groomed nails with expert manicure services",
    image: "https://images.unsplash.com/photo-1604902396830-aca29e19b067?w=600&q=80&fit=crop",
    services: [
      { name: "Classic Manicure", description: "Nail soak, filing, cuticle care, hand massage, and polish for neat, beautiful nails.", basePrice: 399, maxPrice: 699, duration: 45 },
      { name: "Gel Manicure", description: "Long-lasting gel polish application that stays shiny and chip-free for up to 3 weeks.", basePrice: 699, maxPrice: 1199, duration: 60 },
      { name: "Acrylic Nail Extension", description: "Acrylic nail extensions for length and strength with your choice of shape, length, and finish.", basePrice: 1499, maxPrice: 2999, duration: 90 },
    ],
  },
  {
    name: "Skin Care",
    description: "Advanced skin care treatments for radiant and healthy skin",
    image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&q=80&fit=crop",
    services: [
      { name: "Basic Skin Cleanup", description: "Gentle cleansing, scrubbing, and moisturising treatment to remove tan and refresh dull skin.", basePrice: 499, maxPrice: 799, duration: 45 },
      { name: "De-Tan Treatment", description: "Targeted de-tanning treatment using fruit acids and lightening agents to even skin tone and remove sun tan.", basePrice: 799, maxPrice: 1499, duration: 60 },
      { name: "HydraFacial", description: "Multi-step medical-grade HydraFacial that cleanses, extracts, and hydrates for instantly radiant results.", basePrice: 1999, maxPrice: 3999, duration: 60 },
    ],
  },
  {
    name: "Nail Art",
    description: "Creative and trendy nail art designs by expert nail technicians",
    image: "https://images.unsplash.com/photo-1607779097040-26e80aa78e66?w=600&q=80&fit=crop",
    services: [
      { name: "Basic Nail Art", description: "Simple yet stylish nail art designs including florals, French tips, and geometric patterns.", basePrice: 299, maxPrice: 599, duration: 30 },
      { name: "3D Nail Art", description: "Intricate 3D nail art with embellishments, gems, and sculpted designs for a statement look.", basePrice: 799, maxPrice: 1499, duration: 60 },
      { name: "Ombre Gradient Nail Art", description: "Trendy ombre colour blend nail art with custom colour combinations for a chic, modern look.", basePrice: 599, maxPrice: 1199, duration: 45 },
    ],
  },
];

connectDB()
  .then(async () => {
    const ServiceCategory = require("../api/services/models/serviceCategory.model");
    const Service = require("../api/services/models/service.model");

    let catCreated = 0, catUpdated = 0, svcCreated = 0;

    for (let i = 0; i < SEED.length; i++) {
      const cat = SEED[i];
      let category = await ServiceCategory.findOne({ where: { name: cat.name } });
      if (!category) {
        category = await ServiceCategory.create({
          name: cat.name,
          description: cat.description,
          image: cat.image,
          isActive: true,
          sortOrder: i,
        });
        catCreated++;
        console.log(`[+] Category: ${cat.name}`);
      } else {
        await category.update({ image: cat.image, description: cat.description, sortOrder: i });
        catUpdated++;
        console.log(`[~] Updated:  ${cat.name}`);
      }

      for (const svc of cat.services) {
        const existing = await Service.findOne({ where: { name: svc.name, categoryId: category.id } });
        if (!existing) {
          await Service.create({
            name: svc.name,
            description: svc.description,
            basePrice: svc.basePrice,
            maxPrice: svc.maxPrice,
            duration: svc.duration,
            categoryId: category.id,
            isActive: true,
            tags: [],
          });
          svcCreated++;
          console.log(`    + ${svc.name} (₹${svc.basePrice}–₹${svc.maxPrice})`);
        }
      }
    }

    console.log(`\nDone! ${catCreated} categories created, ${catUpdated} updated, ${svcCreated} services created.`);
    process.exit(0);
  })
  .catch((e) => {
    console.error("Error:", e.message);
    process.exit(1);
  });
