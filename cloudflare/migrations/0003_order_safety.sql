-- Maxora: default delivery settings

INSERT OR IGNORE INTO store_settings (setting_key, value_json, updated_at)
VALUES
  ('delivery_inside_dhaka', '70', CURRENT_TIMESTAMP),
  ('delivery_sub_dhaka', '100', CURRENT_TIMESTAMP),
  ('delivery_outside_dhaka', '130', CURRENT_TIMESTAMP),
  ('free_delivery_enabled', 'false', CURRENT_TIMESTAMP),
  ('free_delivery_threshold', '2500', CURRENT_TIMESTAMP);
