-- Maxora: prevent negative product stock

CREATE TRIGGER IF NOT EXISTS prevent_negative_product_stock
BEFORE UPDATE OF stock ON products
WHEN NEW.stock < 0
BEGIN
  SELECT RAISE(ABORT, 'INSUFFICIENT_STOCK');
END;
