// One-time bulk rebuild of the services catalog from "Rate Card - BEYOMO - 13072026.xlsx".
// Replaces all previous placeholder services with the real price list, organized into
// the 16 categories (in order) supplied by the business.
const { connectDB } = require('../utils/dbconnect');
const { Op } = require('sequelize');

// Target categories in display order. `legacyNames` lets us reuse an existing category
// row (and its id) instead of creating a duplicate.
const CATEGORIES = [
  { name: 'Men Grooming',    sortOrder: 1 },
  { name: 'Haircut',         sortOrder: 2,  legacyNames: ['Haircut'] },
  { name: 'Hair Spa',        sortOrder: 3,  legacyNames: ['Hair Spa'] },
  { name: 'Hair Colour',     sortOrder: 4 },
  { name: 'Head Massage',    sortOrder: 5 },
  { name: 'Hair Treatments', sortOrder: 6 },
  { name: 'Threading',       sortOrder: 7,  legacyNames: ['Threading'] },
  { name: 'Waxing',          sortOrder: 8,  legacyNames: ['Waxing'] },
  { name: 'De-Tan',          sortOrder: 9 },
  { name: 'Facials',         sortOrder: 10 },
  { name: 'Peeloff Mask',    sortOrder: 11 },
  { name: 'Pedicure',        sortOrder: 12, legacyNames: ['Pedicure'] },
  { name: 'Manicure',        sortOrder: 13, legacyNames: ['Manicure'] },
  { name: 'Mehndi',          sortOrder: 14 },
  { name: 'Nail Art',        sortOrder: 15, legacyNames: ['Nail Art'] },
  { name: 'Bridal Services', sortOrder: 16, legacyNames: ['Bridal Makeup'] },
];

// { category, name, basePrice, duration (mins), description? }
const SERVICES = [
  // ---- Men Grooming ----
  { category: 'Men Grooming', name: 'Haircut', basePrice: 299, duration: 30 },
  { category: 'Men Grooming', name: 'Shaving', basePrice: 199, duration: 15 },
  { category: 'Men Grooming', name: 'Beard Trim', basePrice: 199, duration: 15 },
  { category: 'Men Grooming', name: 'Beard Color', basePrice: 300, duration: 20 },
  { category: 'Men Grooming', name: 'Head Shave', basePrice: 399, duration: 20 },
  { category: 'Men Grooming', name: 'Hair Colour (Loreal, Schwarzkopf)', basePrice: 1199, duration: 60 },
  { category: 'Men Grooming', name: 'Head Massage', basePrice: 399, duration: 30 },
  { category: 'Men Grooming', name: 'Mustache Colour', basePrice: 200, duration: 15 },
  { category: 'Men Grooming', name: 'Highlights per Streak', basePrice: 250, duration: 30 },

  // ---- Haircut (women) ----
  { category: 'Haircut', name: 'Bangs Cut', basePrice: 200, duration: 15, description: 'Haircuts - Females' },
  { category: 'Haircut', name: 'Baby Haircut', basePrice: 300, duration: 30, description: 'Haircuts - Females' },
  { category: 'Haircut', name: 'Classic Cut', basePrice: 399, duration: 30, description: 'Haircuts - Females' },
  { category: 'Haircut', name: 'Creative Cut', basePrice: 1100, duration: 60, description: 'Haircuts - Females' },
  { category: 'Haircut', name: 'Blow Dry Setting', basePrice: 999, duration: 45, description: 'Hair Styling - Females' },
  { category: 'Haircut', name: 'Ironing', basePrice: 999, duration: 45, description: 'Hair Styling - Females' },

  // ---- Hair Spa (length x brand grid) ----
  { category: 'Hair Spa', name: 'Hair Spa - Men (Matrix)', basePrice: 600, duration: 30 },
  { category: 'Hair Spa', name: 'Hair Spa - Men (Loreal)', basePrice: 800, duration: 30 },
  { category: 'Hair Spa', name: 'Hair Spa - Men (Schwarzkopf)', basePrice: 900, duration: 30 },
  { category: 'Hair Spa', name: 'Hair Spa - Men (Wella)', basePrice: 1200, duration: 30 },
  { category: 'Hair Spa', name: 'Hair Spa - Short Hair (Matrix)', basePrice: 900, duration: 45 },
  { category: 'Hair Spa', name: 'Hair Spa - Short Hair (Loreal)', basePrice: 1200, duration: 45 },
  { category: 'Hair Spa', name: 'Hair Spa - Short Hair (Schwarzkopf)', basePrice: 1300, duration: 45 },
  { category: 'Hair Spa', name: 'Hair Spa - Short Hair (Wella)', basePrice: 1500, duration: 45 },
  { category: 'Hair Spa', name: 'Hair Spa - Medium Hair (Matrix)', basePrice: 1200, duration: 60 },
  { category: 'Hair Spa', name: 'Hair Spa - Medium Hair (Loreal)', basePrice: 1700, duration: 60 },
  { category: 'Hair Spa', name: 'Hair Spa - Medium Hair (Schwarzkopf)', basePrice: 1900, duration: 60 },
  { category: 'Hair Spa', name: 'Hair Spa - Medium Hair (Wella)', basePrice: 2200, duration: 60 },
  { category: 'Hair Spa', name: 'Hair Spa - Long Hair (Matrix)', basePrice: 1800, duration: 75 },
  { category: 'Hair Spa', name: 'Hair Spa - Long Hair (Loreal)', basePrice: 2200, duration: 75 },
  { category: 'Hair Spa', name: 'Hair Spa - Long Hair (Schwarzkopf)', basePrice: 2500, duration: 75 },
  { category: 'Hair Spa', name: 'Hair Spa - Long Hair (Wella)', basePrice: 3000, duration: 75 },
  { category: 'Hair Spa', name: 'Hair Spa - Extra Long Hair (Matrix)', basePrice: 2000, duration: 90 },
  { category: 'Hair Spa', name: 'Hair Spa - Extra Long Hair (Loreal)', basePrice: 2500, duration: 90 },
  { category: 'Hair Spa', name: 'Hair Spa - Extra Long Hair (Schwarzkopf)', basePrice: 2800, duration: 90 },
  { category: 'Hair Spa', name: 'Hair Spa - Extra Long Hair (Wella)', basePrice: 3300, duration: 90 },

  // ---- Hair Colour (women) ----
  { category: 'Hair Colour', name: 'Highlights per Streak (Women)', basePrice: 449, duration: 30, description: 'Starts From' },
  { category: 'Hair Colour', name: 'Root Touchup (Women)', basePrice: 1349, duration: 60 },
  { category: 'Hair Colour', name: 'Global Colour (Women)', basePrice: 2849, duration: 120, description: 'Starts From' },
  { category: 'Hair Colour', name: 'Highlights Global (Women)', basePrice: 3499, duration: 150, description: 'Starts From' },

  // ---- Head Massage (women) ----
  { category: 'Head Massage', name: 'Regular Oil Head Massage', basePrice: 499, duration: 30, description: 'Women, Starts From' },
  { category: 'Head Massage', name: 'Cooling Mint Oil Head Massage', basePrice: 599, duration: 30, description: 'Women, Starts From' },
  { category: 'Head Massage', name: 'Almond Oil Head Massage', basePrice: 599, duration: 30, description: 'Women, Starts From' },
  { category: 'Head Massage', name: 'Olive Oil Head Massage', basePrice: 599, duration: 30, description: 'Women, Starts From' },

  // ---- Hair Treatments ----
  { category: 'Hair Treatments', name: 'HairFall Therapy', basePrice: 1999, duration: 60 },
  { category: 'Hair Treatments', name: 'Dandruff Control Therapy', basePrice: 1999, duration: 60 },
  { category: 'Hair Treatments', name: 'Fiber Strength Therapy', basePrice: 1999, duration: 60 },
  { category: 'Hair Treatments', name: 'Lice Treatment', basePrice: 2499, duration: 60, description: 'Starts From' },
  { category: 'Hair Treatments', name: 'Smoothening (Men)', basePrice: 2999, duration: 150 },
  { category: 'Hair Treatments', name: 'Nano Plastia (Men)', basePrice: 4499, duration: 180 },
  { category: 'Hair Treatments', name: 'Keratin (Men)', basePrice: 5999, duration: 180 },
  { category: 'Hair Treatments', name: 'Botox (Men)', basePrice: 6999, duration: 180 },
  { category: 'Hair Treatments', name: 'Kerasmooth (Men)', basePrice: 7999, duration: 210 },
  { category: 'Hair Treatments', name: 'Smoothening (Women)', basePrice: 4999, duration: 180, description: 'Starts From' },
  { category: 'Hair Treatments', name: 'Keratin (Women)', basePrice: 5999, duration: 180, description: 'Starts From' },
  { category: 'Hair Treatments', name: 'Nano Plastia (Women)', basePrice: 6500, duration: 180, description: 'Starts From' },
  { category: 'Hair Treatments', name: 'Botox (Women)', basePrice: 6999, duration: 180, description: 'Starts From' },
  { category: 'Hair Treatments', name: 'Kerasmooth (Women)', basePrice: 7999, duration: 210, description: 'Starts From' },

  // ---- Threading ----
  { category: 'Threading', name: 'Forehead Threading', basePrice: 50, duration: 10 },
  { category: 'Threading', name: 'Eyebrows Threading', basePrice: 50, duration: 10 },
  { category: 'Threading', name: 'Upper Lip Threading', basePrice: 50, duration: 10 },
  { category: 'Threading', name: 'Chin Threading', basePrice: 50, duration: 10 },
  { category: 'Threading', name: 'Sidelocks Threading', basePrice: 60, duration: 10 },
  { category: 'Threading', name: 'Full Face Threading', basePrice: 250, duration: 20 },

  // ---- Waxing (body part x wax type grid) ----
  { category: 'Waxing', name: 'Upper Lip Wax (Honey)', basePrice: 60, duration: 10 },
  { category: 'Waxing', name: 'Upper Lip Wax (RICA)', basePrice: 80, duration: 10 },
  { category: 'Waxing', name: 'Upper Lip Wax (Roll-on)', basePrice: 100, duration: 10 },
  { category: 'Waxing', name: 'Upper Lip Wax (Brazilian)', basePrice: 120, duration: 10 },
  { category: 'Waxing', name: 'Chin Wax (Honey)', basePrice: 60, duration: 10 },
  { category: 'Waxing', name: 'Chin Wax (RICA)', basePrice: 80, duration: 10 },
  { category: 'Waxing', name: 'Chin Wax (Roll-on)', basePrice: 100, duration: 10 },
  { category: 'Waxing', name: 'Chin Wax (Brazilian)', basePrice: 120, duration: 10 },
  { category: 'Waxing', name: 'Sidelocks Wax (Honey)', basePrice: 150, duration: 15 },
  { category: 'Waxing', name: 'Sidelocks Wax (RICA)', basePrice: 200, duration: 15 },
  { category: 'Waxing', name: 'Sidelocks Wax (Roll-on)', basePrice: 220, duration: 15 },
  { category: 'Waxing', name: 'Sidelocks Wax (Brazilian)', basePrice: 250, duration: 15 },
  { category: 'Waxing', name: 'Under Arms Wax (Honey)', basePrice: 200, duration: 15 },
  { category: 'Waxing', name: 'Under Arms Wax (RICA)', basePrice: 250, duration: 15 },
  { category: 'Waxing', name: 'Under Arms Wax (Roll-on)', basePrice: 300, duration: 15 },
  { category: 'Waxing', name: 'Under Arms Wax (Brazilian)', basePrice: 350, duration: 15 },
  { category: 'Waxing', name: 'Half Arms Wax (Honey)', basePrice: 250, duration: 20 },
  { category: 'Waxing', name: 'Half Arms Wax (RICA)', basePrice: 300, duration: 20 },
  { category: 'Waxing', name: 'Half Arms Wax (Roll-on)', basePrice: 400, duration: 20 },
  { category: 'Waxing', name: 'Half Arms Wax (Brazilian)', basePrice: 500, duration: 20 },
  { category: 'Waxing', name: 'Full Face Wax (Honey)', basePrice: 320, duration: 25 },
  { category: 'Waxing', name: 'Full Face Wax (RICA)', basePrice: 400, duration: 25 },
  { category: 'Waxing', name: 'Full Face Wax (Roll-on)', basePrice: 500, duration: 25 },
  { category: 'Waxing', name: 'Full Face Wax (Brazilian)', basePrice: 550, duration: 25 },
  { category: 'Waxing', name: 'Full Arms Wax (Honey)', basePrice: 380, duration: 30 },
  { category: 'Waxing', name: 'Full Arms Wax (RICA)', basePrice: 450, duration: 30 },
  { category: 'Waxing', name: 'Full Arms Wax (Roll-on)', basePrice: 600, duration: 30 },
  { category: 'Waxing', name: 'Full Arms Wax (Brazilian)', basePrice: 700, duration: 30 },
  { category: 'Waxing', name: 'Half Legs Wax (Honey)', basePrice: 420, duration: 30 },
  { category: 'Waxing', name: 'Half Legs Wax (RICA)', basePrice: 500, duration: 30 },
  { category: 'Waxing', name: 'Half Legs Wax (Roll-on)', basePrice: 600, duration: 30 },
  { category: 'Waxing', name: 'Half Legs Wax (Brazilian)', basePrice: 750, duration: 30 },
  { category: 'Waxing', name: 'Full Legs Wax (Honey)', basePrice: 500, duration: 45 },
  { category: 'Waxing', name: 'Full Legs Wax (RICA)', basePrice: 600, duration: 45 },
  { category: 'Waxing', name: 'Full Legs Wax (Roll-on)', basePrice: 700, duration: 45 },
  { category: 'Waxing', name: 'Full Legs Wax (Brazilian)', basePrice: 900, duration: 45 },
  { category: 'Waxing', name: 'Midriff Wax (Honey)', basePrice: 450, duration: 20 },
  { category: 'Waxing', name: 'Midriff Wax (RICA)', basePrice: 550, duration: 20 },
  { category: 'Waxing', name: 'Midriff Wax (Roll-on)', basePrice: 650, duration: 20 },
  { category: 'Waxing', name: 'Midriff Wax (Brazilian)', basePrice: 800, duration: 20 },
  { category: 'Waxing', name: 'Back Wax (Honey)', basePrice: 650, duration: 30 },
  { category: 'Waxing', name: 'Back Wax (RICA)', basePrice: 800, duration: 30 },
  { category: 'Waxing', name: 'Back Wax (Roll-on)', basePrice: 900, duration: 30 },
  { category: 'Waxing', name: 'Back Wax (Brazilian)', basePrice: 1100, duration: 30 },
  { category: 'Waxing', name: 'Bikini Wax (Honey)', basePrice: 1800, duration: 30 },
  { category: 'Waxing', name: 'Bikini Wax (RICA)', basePrice: 2500, duration: 30 },
  { category: 'Waxing', name: 'Bikini Wax (Roll-on)', basePrice: 2800, duration: 30 },
  { category: 'Waxing', name: 'Bikini Wax (Brazilian)', basePrice: 3200, duration: 30 },
  { category: 'Waxing', name: 'Full Body Wax (Honey)', basePrice: 2200, duration: 90 },
  { category: 'Waxing', name: 'Full Body Wax (RICA)', basePrice: 2800, duration: 90 },
  { category: 'Waxing', name: 'Full Body Wax (Roll-on)', basePrice: 3200, duration: 90 },
  { category: 'Waxing', name: 'Full Body Wax (Brazilian)', basePrice: 3800, duration: 90 },

  // ---- De-Tan (body part x product grid) ----
  { category: 'De-Tan', name: 'Neck De-Tan (Fruit)', basePrice: 250, duration: 15 },
  { category: 'De-Tan', name: 'Neck De-Tan (O3+)', basePrice: 400, duration: 15 },
  { category: 'De-Tan', name: 'Under Arms De-Tan (Fruit)', basePrice: 300, duration: 15 },
  { category: 'De-Tan', name: 'Under Arms De-Tan (O3+)', basePrice: 450, duration: 15 },
  { category: 'De-Tan', name: 'Blouse Line De-Tan (Fruit)', basePrice: 300, duration: 15 },
  { category: 'De-Tan', name: 'Blouse Line De-Tan (O3+)', basePrice: 550, duration: 15 },
  { category: 'De-Tan', name: 'Face De-Tan (Fruit)', basePrice: 360, duration: 20 },
  { category: 'De-Tan', name: 'Face De-Tan (O3+)', basePrice: 600, duration: 20 },
  { category: 'De-Tan', name: 'Half Hands De-Tan (Fruit)', basePrice: 400, duration: 20 },
  { category: 'De-Tan', name: 'Half Hands De-Tan (O3+)', basePrice: 700, duration: 20 },
  { category: 'De-Tan', name: 'Face & Neck De-Tan (Fruit)', basePrice: 500, duration: 25 },
  { category: 'De-Tan', name: 'Face & Neck De-Tan (O3+)', basePrice: 800, duration: 25 },
  { category: 'De-Tan', name: 'Full Hands De-Tan (Fruit)', basePrice: 500, duration: 30 },
  { category: 'De-Tan', name: 'Full Hands De-Tan (O3+)', basePrice: 1000, duration: 30 },
  { category: 'De-Tan', name: 'Half Legs De-Tan (Fruit)', basePrice: 500, duration: 30 },
  { category: 'De-Tan', name: 'Half Legs De-Tan (O3+)', basePrice: 1000, duration: 30 },
  { category: 'De-Tan', name: 'Full Legs De-Tan (Fruit)', basePrice: 800, duration: 45 },
  { category: 'De-Tan', name: 'Full Legs De-Tan (O3+)', basePrice: 1500, duration: 45 },
  { category: 'De-Tan', name: 'Full Body De-Tan (Fruit)', basePrice: 2800, duration: 90 },
  { category: 'De-Tan', name: 'Full Body De-Tan (O3+)', basePrice: 4000, duration: 90 },

  // ---- Facials ----
  { category: 'Facials', name: 'Charcoal Facial', basePrice: 1100, duration: 60 },
  { category: 'Facials', name: 'Chocolate Mint Facial', basePrice: 999, duration: 60, description: 'Seasoul Chocolate Mint' },
  { category: 'Facials', name: 'AntiAgeing Facial', basePrice: 1499, duration: 75, description: 'Seasoul Anti Ageing' },
  { category: 'Facials', name: 'Organic Clean-Up - Dry Skin', basePrice: 799, duration: 45, description: 'Seasoul Organic Cleanup' },
  { category: 'Facials', name: 'Organic Clean-Up - Oily Skin', basePrice: 849, duration: 45, description: 'Seasoul Organic Cleanup' },
  { category: 'Facials', name: 'Fruit Facial', basePrice: 899, duration: 45, description: 'VLCC Fruit Facial Kit' },
  { category: 'Facials', name: 'Britening Facial', basePrice: 4500, duration: 90, description: 'O3+' },
  { category: 'Facials', name: 'Korean Glass Facial', basePrice: 3200, duration: 90, description: 'Sara Beauty' },
  { category: 'Facials', name: 'Pearl Facial', basePrice: 1800, duration: 60, description: 'Aroma Magic' },
  { category: 'Facials', name: 'Gold Facial', basePrice: 2000, duration: 60, description: 'Aroma Magic' },
  { category: 'Facials', name: 'Skin Lightening Facial', basePrice: 2800, duration: 75, description: 'Laa Mariene' },
  { category: 'Facials', name: 'Chocolate Facial', basePrice: 1800, duration: 60, description: 'Aroma Treasures' },
  { category: 'Facials', name: 'Watermelon Facial', basePrice: 1500, duration: 60, description: 'Aroma Treasures' },
  { category: 'Facials', name: 'Bluecurrent Facial', basePrice: 1500, duration: 60, description: 'Aroma Treasures' },
  { category: 'Facials', name: 'Skin Whitening Facial', basePrice: 2200, duration: 75, description: 'Aroma Treasures' },
  { category: 'Facials', name: 'Strawberry Facial', basePrice: 2200, duration: 75, description: 'Aroma Treasures' },
  { category: 'Facials', name: 'O3+ Cleanup', basePrice: 1200, duration: 45, description: 'O3+' },
  { category: 'Facials', name: 'Dry Fruit Facial', basePrice: 1200, duration: 60, description: 'Aroma Treasures' },
  { category: 'Facials', name: 'Wine Facial', basePrice: 1200, duration: 60, description: 'Astaberry' },
  { category: 'Facials', name: 'O3+ Bridal Facial', basePrice: 4500, duration: 90, description: 'O3+' },
  { category: 'Facials', name: 'Party Glow Facial', basePrice: 1800, duration: 60, description: 'Aroma Treasures' },
  { category: 'Facials', name: 'Insta Glow Facial', basePrice: 2000, duration: 60, description: 'Aroma Treasures' },

  // ---- Peeloff Mask ----
  { category: 'Peeloff Mask', name: 'Vitamin-C Peeloff', basePrice: 999, duration: 30, description: 'Sara' },
  { category: 'Peeloff Mask', name: 'Gold Peeloff', basePrice: 1299, duration: 30, description: 'Laa Marinene' },
  { category: 'Peeloff Mask', name: 'Pearl Peeloff', basePrice: 1199, duration: 30, description: 'Laa Marinene' },
  { category: 'Peeloff Mask', name: 'Charcoal Peeloff', basePrice: 999, duration: 30, description: 'Laa Marinene' },
  { category: 'Peeloff Mask', name: 'O3+ Whitening Peeloff', basePrice: 1499, duration: 35, description: 'O3+ Professional' },
  { category: 'Peeloff Mask', name: 'O3+ Radiant Peeloff', basePrice: 1499, duration: 35, description: 'O3+ Professional' },

  // ---- Pedicure ----
  { category: 'Pedicure', name: 'Chocolate Pedicure', basePrice: 1199, duration: 60, description: 'Raaga' },
  { category: 'Pedicure', name: 'Strawberry Pedicure', basePrice: 1199, duration: 60, description: 'Raaga' },
  { category: 'Pedicure', name: 'Rose Pedicure', basePrice: 1199, duration: 60, description: 'Raaga' },
  { category: 'Pedicure', name: 'Bubblegum Pedicure', basePrice: 1499, duration: 60, description: 'O3+' },
  { category: 'Pedicure', name: 'Wine Pedicure', basePrice: 799, duration: 45, description: 'AstaBerry' },
  { category: 'Pedicure', name: 'Cup Cake Pedicure', basePrice: 1599, duration: 75, description: 'Seasoul' },
  { category: 'Pedicure', name: 'Ice Cream Pedicure', basePrice: 2499, duration: 75, description: 'Bombini' },
  { category: 'Pedicure', name: 'Aroma Pedicure', basePrice: 899, duration: 45, description: 'Aroma Magic' },
  { category: 'Pedicure', name: 'Lavendor Pedicure', basePrice: 699, duration: 45, description: 'Vedic Valley' },
  { category: 'Pedicure', name: 'De-tan Pedicure', basePrice: 999, duration: 45, description: 'Vedic Valley' },
  { category: 'Pedicure', name: 'Glow Boosting Pedicure', basePrice: 1099, duration: 60, description: 'Vedic Valley' },

  // ---- Manicure ----
  { category: 'Manicure', name: 'Chocolate Manicure', basePrice: 1099, duration: 45, description: 'Raaga' },
  { category: 'Manicure', name: 'Strawberry Manicure', basePrice: 1099, duration: 45, description: 'Raaga' },
  { category: 'Manicure', name: 'Rose Manicure', basePrice: 1099, duration: 45, description: 'Raaga' },
  { category: 'Manicure', name: 'Bubblegum Manicure', basePrice: 1399, duration: 45, description: 'O3+' },
  { category: 'Manicure', name: 'Wine Manicure', basePrice: 749, duration: 40, description: 'AstaBerry' },
  { category: 'Manicure', name: 'Cup Cake Manicure', basePrice: 1499, duration: 60, description: 'Seasoul' },
  { category: 'Manicure', name: 'Ice Cream Manicure', basePrice: 2399, duration: 60, description: 'Bombini' },
  { category: 'Manicure', name: 'Aroma Manicure', basePrice: 749, duration: 40, description: 'Aroma Magic' },
  { category: 'Manicure', name: 'Lavendor Manicure', basePrice: 649, duration: 40, description: 'Vedic Valley' },
  { category: 'Manicure', name: 'De-tan Manicure', basePrice: 949, duration: 40, description: 'Vedic Valley' },
  { category: 'Manicure', name: 'Glow Boosting Manicure', basePrice: 1049, duration: 45, description: 'Vedic Valley' },

  // ---- Mehndi ----
  { category: 'Mehndi', name: 'Palm Length - Both Hands, One Side', basePrice: 500, duration: 20 },
  { category: 'Mehndi', name: 'Palm Length - Both Hands, Two Sides', basePrice: 1000, duration: 35 },
  { category: 'Mehndi', name: 'Palm Length (One Hand) - One Side', basePrice: 600, duration: 20 },
  { category: 'Mehndi', name: 'Palm Length (One Hand) - Both Sides', basePrice: 1200, duration: 35 },
  { category: 'Mehndi', name: 'Palm Length (Two Hands, Detailed) - Two Sides', basePrice: 2000, duration: 45 },
  { category: 'Mehndi', name: 'Arabic Mehndi - One Hand, One Side', basePrice: 600, duration: 25 },
  { category: 'Mehndi', name: 'Arabic Mehndi - Two Hands, Two Sides', basePrice: 1000, duration: 40 },
  { category: 'Mehndi', name: 'Bangle Length - Both Hands, One Side', basePrice: 800, duration: 35 },
  { category: 'Mehndi', name: 'Bangle Length - Both Hands, Two Sides', basePrice: 1600, duration: 60 },
  { category: 'Mehndi', name: 'Mid Length - One Hand, One Side', basePrice: 1000, duration: 45 },
  { category: 'Mehndi', name: 'Mid Length - One Hand, Two Sides', basePrice: 2000, duration: 75 },
  { category: 'Mehndi', name: 'Mid Length - Two Hands, One Side', basePrice: 900, duration: 45 },
  { category: 'Mehndi', name: 'Mid Length - Two Hands, Two Sides', basePrice: 1800, duration: 75 },
  { category: 'Mehndi', name: 'Bridal Elbow Length (Design 1) - One Hand, One Side', basePrice: 1600, duration: 90 },
  { category: 'Mehndi', name: 'Bridal Elbow Length (Design 1) - Two Hands, Two Sides', basePrice: 3200, duration: 150 },
  { category: 'Mehndi', name: 'Bridal Elbow Length (Design 2) - Two Hands, One Side', basePrice: 3000, duration: 120 },
  { category: 'Mehndi', name: 'Bridal Elbow Length (Design 2) - Two Hands, Two Sides', basePrice: 6000, duration: 180 },
  { category: 'Mehndi', name: 'Bridal Above Elbow (Design 1) - One Hand, One Side', basePrice: 3500, duration: 120 },
  { category: 'Mehndi', name: 'Bridal Above Elbow (Design 1) - Two Hands, Two Sides', basePrice: 7000, duration: 180 },
  { category: 'Mehndi', name: 'Bridal Above Elbow (Design 2) - Two Hands, One Side', basePrice: 7000, duration: 180 },
  { category: 'Mehndi', name: 'Bridal Above Elbow (Design 2) - Two Hands, Two Sides', basePrice: 14000, duration: 240 },

  // ---- Nail Art ----
  { category: 'Nail Art', name: 'Nail Art (One Finger)', basePrice: 99, duration: 10 },
  { category: 'Nail Art', name: 'Gel Nail Polish (Per Hand)', basePrice: 499, duration: 45 },
  { category: 'Nail Art', name: 'Acrylic Nail Extension Repair (Per Tip)', basePrice: 499, duration: 20 },
  { category: 'Nail Art', name: 'Gel Nail Extension Repair (Per Tip)', basePrice: 599, duration: 20 },
  { category: 'Nail Art', name: 'Gel Nail Extension Removal (Per Hand)', basePrice: 899, duration: 30 },
  { category: 'Nail Art', name: 'Acrylic Nail Extension Removal (Per Hand)', basePrice: 1199, duration: 30 },
  { category: 'Nail Art', name: 'French Nail Tip (Per Hand)', basePrice: 1500, duration: 45 },
  { category: 'Nail Art', name: 'Acrylic Nail Extension (Per Hand)', basePrice: 3000, duration: 90 },
  { category: 'Nail Art', name: 'Gel Nail Extension (Per Hand)', basePrice: 3500, duration: 90 },

  // ---- Bridal Services ----
  { category: 'Bridal Services', name: 'HD Bridal Makeup', basePrice: 13000, duration: 240, description: 'Starts From' },
  { category: 'Bridal Services', name: 'Bridal Makeup', basePrice: 10000, duration: 180, description: 'Starts From' },
  { category: 'Bridal Services', name: 'Party Makeup', basePrice: 6000, duration: 90, description: 'Starts From' },
  { category: 'Bridal Services', name: 'Groom Makeup', basePrice: 5000, duration: 90, description: 'Starts From' },
  { category: 'Bridal Services', name: 'Trial Makeup', basePrice: 1500, duration: 45, description: 'Starts From' },
  { category: 'Bridal Services', name: 'Hair Do', basePrice: 1000, duration: 45, description: 'Starts From' },
  { category: 'Bridal Services', name: 'Saree Draping', basePrice: 1000, duration: 30, description: 'Starts From' },
  { category: 'Bridal Services', name: 'Pre-Plaiting (Hair)', basePrice: 800, duration: 30 },
  { category: "Bridal Services", name: "Men's Hair Setting", basePrice: 500, duration: 20 },
];

async function run() {
  try {
    await connectDB();
    const ServiceCategory = require('../api/services/models/serviceCategory.model');
    const Service = require('../api/services/models/service.model');

    console.log(`Rebuilding catalog: ${CATEGORIES.length} categories, ${SERVICES.length} services...\n`);

    // 1. Upsert the 16 target categories, reusing existing rows (by current or legacy name)
    //    so their id (and any FK references) survive.
    const categoryIdByName = {};
    for (const cat of CATEGORIES) {
      const namesToTry = [cat.name, ...(cat.legacyNames || [])];
      let row = null;
      for (const n of namesToTry) {
        row = await ServiceCategory.findOne({ where: { name: n } });
        if (row) break;
      }
      if (row) {
        await row.update({ name: cat.name, sortOrder: cat.sortOrder, isActive: true });
        console.log(`  ~ category "${cat.name}" (id ${row.id}) reused`);
      } else {
        row = await ServiceCategory.create({ name: cat.name, sortOrder: cat.sortOrder, isActive: true });
        console.log(`  + category "${cat.name}" (id ${row.id}) created`);
      }
      categoryIdByName[cat.name] = row.id;
    }

    // 2. Deactivate any category not in the target list (old placeholder/demo categories).
    const targetIds = Object.values(categoryIdByName);
    const [deactivatedCount] = await ServiceCategory.update(
      { isActive: false },
      { where: { id: { [Op.notIn]: targetIds } } }
    );
    console.log(`\n  ${deactivatedCount} leftover categor${deactivatedCount === 1 ? 'y' : 'ies'} deactivated`);

    // 3. Replace the catalog with the rate-card services. Old placeholder services are
    //    deactivated (not deleted) — bookings/offers/service_city_map hold real FK
    //    references to some of them, so a hard delete would violate those constraints.
    const [deactivatedServiceCount] = await Service.update({ isActive: false }, { where: {} });
    console.log(`  ${deactivatedServiceCount} old services deactivated`);

    const toInsert = SERVICES.map((s) => ({
      categoryId: categoryIdByName[s.category],
      name: s.name,
      description: s.description || null,
      basePrice: s.basePrice,
      duration: s.duration,
      isActive: true,
    }));
    await Service.bulkCreate(toInsert);
    console.log(`  ${toInsert.length} new services inserted`);

    console.log('\nDone.');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message, err.stack);
    process.exit(1);
  }
}

run();
