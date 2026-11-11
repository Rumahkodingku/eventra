INSERT INTO app_meta (meta_key, meta_value)
VALUES ('schema', 'eventra')
ON DUPLICATE KEY UPDATE meta_value = VALUES(meta_value);
