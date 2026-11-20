-- Reject checkout stock movements unless the active product has enough stock.
-- This guard runs inside the same atomic D1 batch as the order write.
CREATE TRIGGER IF NOT EXISTS validate_checkout_stock_movement
BEFORE INSERT ON stock_movements
WHEN NEW.movement_type = 'order'
 AND NOT EXISTS (
   SELECT 1 FROM products
   WHERE id = NEW.product_id
     AND active = 1
     AND stock >= NEW.quantity
 )
BEGIN
  SELECT RAISE(ABORT, 'INSUFFICIENT_STOCK');
END;
