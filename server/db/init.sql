CREATE TABLE IF NOT EXISTS products (
  product_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  description TEXT,
  image_url TEXT,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(user_id)
); 

-- 添加 is_read 字段到 notifications 表
ALTER TABLE notifications ADD COLUMN is_read TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否已读'; 