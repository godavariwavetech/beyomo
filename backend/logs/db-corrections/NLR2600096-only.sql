-- Correct only booking 227 / NLR2600096. No other booking or field is changed.
-- Run in the existing live database; this is not a full database import.
START TRANSACTION;
UPDATE bookings
SET baseAmount = 999.00, taxAmount = 49.95,
    totalAmount = 1048.95, partnerEarning = 699.30
WHERE id = 227 AND bookingCode = 'NLR2600096'
  AND status = 'cancelled' AND paymentStatus = 'pending'
  AND baseAmount = 1859.00 AND taxAmount = 92.95
  AND totalAmount = 1951.95 AND partnerEarning = 1301.30
  AND couponDiscountAmount = 0
  AND NOT EXISTS (SELECT 1 FROM payments WHERE bookingId = 227)
  AND NOT EXISTS (SELECT 1 FROM partner_ledger_entries WHERE bookingId = 227);
SELECT ROW_COUNT() AS corrected_bookings;
SELECT bookingCode, status, baseAmount, taxAmount, totalAmount, partnerEarning
FROM bookings WHERE id = 227 AND bookingCode = 'NLR2600096';
COMMIT;
