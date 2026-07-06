-- Beyomo production migration -- 2026-07-05
-- Review each section before running. Safe to run in one transaction; if
-- anything looks wrong, roll back and ask before re-running.
--
-- Prerequisite: copy these files from your local backend/uploads/ folder to
-- the LIVE server's backend/uploads/ folder BEFORE running this script, or
-- the image URLs below will 404 once applied:
--   category-hair-care.png, category-hair-spa.png, category-makeup.png,
--   category-waxing.png, category-pedicure.png, category-haircut.png,
--   category-bridal-makeup.png, category-threading.png, category-massage.png,
--   category-manicure.png, category-skin-care.png, category-nail-art.png,
--   package-facial-combo.png, package-hair-therapy-combo.png,
--   package-full-body-combo.png

START TRANSACTION;

-- ============================================================
-- 1. Real category images (replaces generic stock photos)
-- ============================================================
UPDATE service_categories SET image = 'https://beyomo.in:3090/uploads/category-hair-care.png' WHERE id = 1;
UPDATE service_categories SET image = 'https://beyomo.in:3090/uploads/category-hair-spa.png' WHERE id = 2;
UPDATE service_categories SET image = 'https://beyomo.in:3090/uploads/category-makeup.png' WHERE id = 3;
UPDATE service_categories SET image = 'https://beyomo.in:3090/uploads/category-waxing.png' WHERE id = 4;
UPDATE service_categories SET image = 'https://beyomo.in:3090/uploads/category-pedicure.png' WHERE id = 5;
UPDATE service_categories SET image = 'https://beyomo.in:3090/uploads/category-haircut.png' WHERE id = 6;
UPDATE service_categories SET image = 'https://beyomo.in:3090/uploads/category-bridal-makeup.png' WHERE id = 7;
UPDATE service_categories SET image = 'https://beyomo.in:3090/uploads/category-threading.png' WHERE id = 8;
UPDATE service_categories SET image = 'https://beyomo.in:3090/uploads/category-massage.png' WHERE id = 9;
UPDATE service_categories SET image = 'https://beyomo.in:3090/uploads/category-manicure.png' WHERE id = 10;
UPDATE service_categories SET image = 'https://beyomo.in:3090/uploads/category-skin-care.png' WHERE id = 11;
UPDATE service_categories SET image = 'https://beyomo.in:3090/uploads/category-nail-art.png' WHERE id = 12;

-- ============================================================
-- 2. Remove test/dummy categories (only if they still exist on prod)
-- ============================================================
DELETE FROM service_city_map WHERE serviceId IN (SELECT id FROM services WHERE categoryId IN (
  SELECT id FROM service_categories WHERE name IN ('Test', 'Testingg')
));
DELETE FROM services WHERE categoryId IN (
  SELECT id FROM service_categories WHERE name IN ('Test', 'Testingg')
);
DELETE FROM service_categories WHERE name IN ('Test', 'Testingg');

-- ============================================================
-- 3. New service packages (3 fixed combos + 3 flexible "Any N")
--    Skipped automatically if a package with the same title already exists.
-- ============================================================
INSERT INTO service_packages
  (title, description, image, packageType, price, originalPrice, services, isActive, cityIds, adminPercent, partnerPercent, gstPercent, createdAt, updatedAt)
SELECT * FROM (SELECT
  'Facial Services Combo' AS title,
  'Complete facial treatment package with cleansing, de-tan, and hydrating HydraFacial care.' AS description,
  'https://beyomo.in:3090/uploads/package-facial-combo.png' AS image,
  'fixed' AS packageType,
  2499.00 AS price,
  3297.00 AS originalPrice,
  '[{"serviceId":31,"name":"Basic Skin Cleanup","price":499,"duration":45,"image":"https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&q=80&fit=crop"},{"serviceId":32,"name":"De-Tan Treatment","price":799,"duration":60,"image":"https://images.unsplash.com/photo-1552693673-1bf958298935?w=600&q=80&fit=crop"},{"serviceId":33,"name":"HydraFacial","price":1999,"duration":60,"image":"https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&q=80&fit=crop"}]' AS services,
  1 AS isActive, '[]' AS cityIds, 20.00 AS adminPercent, 80.00 AS partnerPercent, 5.00 AS gstPercent, NOW() AS createdAt, NOW() AS updatedAt
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM service_packages WHERE title = 'Facial Services Combo');

INSERT INTO service_packages
  (title, description, image, packageType, price, originalPrice, services, isActive, cityIds, adminPercent, partnerPercent, gstPercent, createdAt, updatedAt)
SELECT * FROM (SELECT
  'Hair Therapy Combo' AS title,
  'Premium hair spa package with deep conditioning, keratin treatment, and scalp therapy.' AS description,
  'https://beyomo.in:3090/uploads/package-hair-therapy-combo.png' AS image,
  'fixed' AS packageType,
  2199.00 AS price,
  2897.00 AS originalPrice,
  '[{"serviceId":4,"name":"Deep Conditioning Hair Spa","price":599,"duration":60,"image":"https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&q=80&fit=crop"},{"serviceId":5,"name":"Keratin Hair Spa","price":1499,"duration":90,"image":"https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=600&q=80&fit=crop"},{"serviceId":6,"name":"Scalp Treatment","price":799,"duration":45,"image":"https://images.unsplash.com/photo-1583795484071-3c453e3a7c71?w=600&q=80&fit=crop"}]' AS services,
  1 AS isActive, '[]' AS cityIds, 20.00 AS adminPercent, 80.00 AS partnerPercent, 5.00 AS gstPercent, NOW() AS createdAt, NOW() AS updatedAt
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM service_packages WHERE title = 'Hair Therapy Combo');

INSERT INTO service_packages
  (title, description, image, packageType, price, originalPrice, services, isActive, cityIds, adminPercent, partnerPercent, gstPercent, createdAt, updatedAt)
SELECT * FROM (SELECT
  'Full Body Pampering Combo' AS title,
  'Complete relaxation package with a full body massage, full body waxing, and spa pedicure.' AS description,
  'https://beyomo.in:3090/uploads/package-full-body-combo.png' AS image,
  'fixed' AS packageType,
  2999.00 AS price,
  3697.00 AS originalPrice,
  '[{"serviceId":25,"name":"Swedish Relaxation Massage","price":1199,"duration":60,"image":"https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&q=80&fit=crop"},{"serviceId":12,"name":"Full Body Waxing","price":1499,"duration":120,"image":"https://images.unsplash.com/photo-1526413232644-8a40f03cc03b?w=600&q=80&fit=crop"},{"serviceId":14,"name":"Spa Pedicure","price":999,"duration":60,"image":"https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=600&q=80&fit=crop"}]' AS services,
  1 AS isActive, '[]' AS cityIds, 20.00 AS adminPercent, 80.00 AS partnerPercent, 5.00 AS gstPercent, NOW() AS createdAt, NOW() AS updatedAt
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM service_packages WHERE title = 'Full Body Pampering Combo');

INSERT INTO service_packages
  (title, description, packageType, price, originalPrice, serviceCount, services, isActive, cityIds, adminPercent, partnerPercent, gstPercent, createdAt, updatedAt)
SELECT * FROM (SELECT
  'Any 3 @ ₹999' AS title,
  'Choose any 3 services from our premium range' AS description,
  'flexible' AS packageType,
  999.00 AS price,
  1299.00 AS originalPrice,
  3 AS serviceCount,
  '[]' AS services,
  1 AS isActive, '[]' AS cityIds, 20.00 AS adminPercent, 80.00 AS partnerPercent, 5.00 AS gstPercent, NOW() AS createdAt, NOW() AS updatedAt
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM service_packages WHERE title = 'Any 3 @ ₹999');

INSERT INTO service_packages
  (title, description, packageType, price, originalPrice, serviceCount, services, isActive, cityIds, adminPercent, partnerPercent, gstPercent, createdAt, updatedAt)
SELECT * FROM (SELECT
  'Any 5 @ ₹1999' AS title,
  'Choose any 5 services from our premium range' AS description,
  'flexible' AS packageType,
  1999.00 AS price,
  2799.00 AS originalPrice,
  5 AS serviceCount,
  '[]' AS services,
  1 AS isActive, '[]' AS cityIds, 20.00 AS adminPercent, 80.00 AS partnerPercent, 5.00 AS gstPercent, NOW() AS createdAt, NOW() AS updatedAt
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM service_packages WHERE title = 'Any 5 @ ₹1999');

INSERT INTO service_packages
  (title, description, packageType, price, originalPrice, serviceCount, services, isActive, cityIds, adminPercent, partnerPercent, gstPercent, createdAt, updatedAt)
SELECT * FROM (SELECT
  'Any 7 @ ₹2999' AS title,
  'Choose any 7 services from our premium range' AS description,
  'flexible' AS packageType,
  2999.00 AS price,
  4099.00 AS originalPrice,
  7 AS serviceCount,
  '[]' AS services,
  1 AS isActive, '[]' AS cityIds, 20.00 AS adminPercent, 80.00 AS partnerPercent, 5.00 AS gstPercent, NOW() AS createdAt, NOW() AS updatedAt
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM service_packages WHERE title = 'Any 7 @ ₹2999');

COMMIT;

-- Verify afterward with:
-- SELECT id, name, image FROM service_categories ORDER BY id;
-- SELECT id, title, packageType, price, isActive FROM service_packages ORDER BY id;
