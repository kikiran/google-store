-- =====================================================================
-- Nova Store — MySQL schema
-- One MySQL server, one logical schema per service. Each schema can be
-- migrated to a dedicated server later without application change.
-- =====================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE DATABASE `nova_user` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE `nova_product` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE `nova_inventory` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE `nova_cart` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE `nova_order` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE `nova_payment` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE `nova_shipping` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE `nova_review` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE `nova_notification` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- =====================================================================
-- nova_user — owned by the User Service (auth credentials live here too)
-- =====================================================================
CREATE DATABASE `nova_user`;
USE `nova_user`;

CREATE TABLE `users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(255) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `first_name` VARCHAR(100) NOT NULL DEFAULT '',
  `last_name` VARCHAR(100) NOT NULL DEFAULT '',
  `phone` VARCHAR(30) DEFAULT NULL,
  `role` ENUM('CUSTOMER','MANAGER','ADMIN') NOT NULL DEFAULT 'CUSTOMER',
  `avatar_url` VARCHAR(500) DEFAULT NULL,
  `email_verified_at` DATETIME DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `last_login_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_email` (`email`),
  KEY `idx_users_role` (`role`),
  KEY `idx_users_deleted` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_profiles` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `bio` VARCHAR(500) DEFAULT NULL,
  `newsletter_opt_in` TINYINT(1) NOT NULL DEFAULT 0,
  `preferred_language` VARCHAR(10) NOT NULL DEFAULT 'en',
  `currency` CHAR(3) NOT NULL DEFAULT 'INR',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_profiles_user` (`user_id`),
  CONSTRAINT `fk_user_profiles_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_addresses` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `label` VARCHAR(50) NOT NULL DEFAULT 'Home',
  `full_name` VARCHAR(150) NOT NULL,
  `phone` VARCHAR(30) NOT NULL,
  `address_line1` VARCHAR(255) NOT NULL,
  `address_line2` VARCHAR(255) DEFAULT NULL,
  `city` VARCHAR(100) NOT NULL,
  `state` VARCHAR(100) NOT NULL,
  `postal_code` VARCHAR(20) NOT NULL,
  `country` VARCHAR(100) NOT NULL DEFAULT 'India',
  `is_default` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user_addresses_user` (`user_id`),
  CONSTRAINT `fk_user_addresses_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `refresh_tokens` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `token_hash` CHAR(64) NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `revoked_at` DATETIME DEFAULT NULL,
  `replaced_by` CHAR(64) DEFAULT NULL,
  `ip_address` VARCHAR(45) DEFAULT NULL,
  `user_agent` VARCHAR(300) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_refresh_tokens_hash` (`token_hash`),
  KEY `idx_refresh_tokens_user` (`user_id`),
  CONSTRAINT `fk_refresh_tokens_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `password_reset_tokens` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `token_hash` CHAR(64) NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `used_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_prt_hash` (`token_hash`),
  KEY `idx_prt_user` (`user_id`),
  CONSTRAINT `fk_prt_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `email_verification_tokens` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `token_hash` CHAR(64) NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `used_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_evt_hash` (`token_hash`),
  KEY `idx_evt_user` (`user_id`),
  CONSTRAINT `fk_evt_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- nova_product — owned by the Product Service
-- =====================================================================
USE `nova_product`;

CREATE TABLE `categories` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `slug` VARCHAR(100) NOT NULL,
  `name` VARCHAR(120) NOT NULL,
  `description` VARCHAR(500) DEFAULT NULL,
  `parent_id` BIGINT UNSIGNED DEFAULT NULL,
  `image_url` VARCHAR(500) DEFAULT NULL,
  `icon` VARCHAR(50) DEFAULT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_categories_slug` (`slug`),
  KEY `idx_categories_parent` (`parent_id`),
  CONSTRAINT `fk_categories_parent` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `products` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `slug` VARCHAR(150) NOT NULL,
  `name` VARCHAR(200) NOT NULL,
  `tagline` VARCHAR(300) DEFAULT NULL,
  `description` TEXT,
  `brand` VARCHAR(100) NOT NULL DEFAULT 'Nova',
  `category_id` BIGINT UNSIGNED NOT NULL,
  `base_price` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `compare_at_price` DECIMAL(10,2) DEFAULT NULL,
  `badge` VARCHAR(50) DEFAULT NULL,
  `is_featured` TINYINT(1) NOT NULL DEFAULT 0,
  `is_new` TINYINT(1) NOT NULL DEFAULT 0,
  `status` ENUM('draft','active','archived') NOT NULL DEFAULT 'draft',
  `meta_title` VARCHAR(200) DEFAULT NULL,
  `meta_description` VARCHAR(400) DEFAULT NULL,
  `feature_rank` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_products_slug` (`slug`),
  KEY `idx_products_category` (`category_id`),
  KEY `idx_products_status` (`status`),
  KEY `idx_products_featured` (`is_featured`,`feature_rank`),
  FULLTEXT KEY `ft_products_search` (`name`,`tagline`,`description`,`brand`),
  CONSTRAINT `fk_products_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `product_variants` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id` BIGINT UNSIGNED NOT NULL,
  `sku` VARCHAR(80) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `color` VARCHAR(60) DEFAULT NULL,
  `color_swatch` CHAR(7) DEFAULT NULL,
  `storage` VARCHAR(30) DEFAULT NULL,
  `price` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `compare_at_price` DECIMAL(10,2) DEFAULT NULL,
  `is_default` TINYINT(1) NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_variants_sku` (`sku`),
  KEY `idx_variants_product` (`product_id`),
  FULLTEXT KEY `ft_variants_name` (`name`),
  CONSTRAINT `fk_variants_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `product_images` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id` BIGINT UNSIGNED NOT NULL,
  `variant_id` BIGINT UNSIGNED DEFAULT NULL,
  `url` VARCHAR(500) NOT NULL,
  `alt_text` VARCHAR(300) DEFAULT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `is_primary` TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_product_images_product` (`product_id`),
  KEY `idx_product_images_variant` (`variant_id`),
  CONSTRAINT `fk_product_images_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_product_images_variant` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `product_specifications` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id` BIGINT UNSIGNED NOT NULL,
  `name` VARCHAR(120) NOT NULL,
  `value` VARCHAR(500) NOT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_specs_product` (`product_id`),
  CONSTRAINT `fk_specs_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `promotions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(150) NOT NULL,
  `slug` VARCHAR(120) NOT NULL,
  `description` VARCHAR(500) DEFAULT NULL,
  `discount_type` ENUM('percent','fixed') NOT NULL DEFAULT 'percent',
  `discount_value` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `starts_at` DATETIME NOT NULL,
  `ends_at` DATETIME DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_promotions_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `product_promotions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id` BIGINT UNSIGNED NOT NULL,
  `promotion_id` BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_product_promotion` (`product_id`,`promotion_id`),
  KEY `idx_pp_promotion` (`promotion_id`),
  CONSTRAINT `fk_pp_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pp_promotion` FOREIGN KEY (`promotion_id`) REFERENCES `promotions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `coupons` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(50) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `discount_type` ENUM('percent','fixed') NOT NULL DEFAULT 'percent',
  `discount_value` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `max_uses` INT DEFAULT NULL,
  `used_count` INT NOT NULL DEFAULT 0,
  `min_order_amount` DECIMAL(10,2) DEFAULT NULL,
  `expires_at` DATETIME DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_coupons_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- nova_inventory — owned by the Inventory Service
-- variant_id references product_variants in nova_product (no cross-schema FK)
-- =====================================================================
USE `nova_inventory`;

CREATE TABLE `inventory` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `variant_id` BIGINT UNSIGNED NOT NULL,
  `quantity` INT NOT NULL DEFAULT 0,
  `reserved_quantity` INT NOT NULL DEFAULT 0,
  `low_stock_threshold` INT NOT NULL DEFAULT 5,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_inventory_variant` (`variant_id`),
  KEY `idx_inventory_low_stock` (`quantity`) 
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `inventory_movements` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `variant_id` BIGINT UNSIGNED NOT NULL,
  `change_type` ENUM('adjust','restock','reserve','release','deduct') NOT NULL,
  `quantity_change` INT NOT NULL,
  `reference_type` VARCHAR(50) DEFAULT NULL,
  `reference_id` VARCHAR(100) DEFAULT NULL,
  `note` VARCHAR(300) DEFAULT NULL,
  `created_by` BIGINT UNSIGNED DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_im_variant` (`variant_id`),
  KEY `idx_im_reference` (`reference_type`,`reference_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `stock_reservations` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `reservation_token` CHAR(64) NOT NULL,
  `order_id` BIGINT UNSIGNED NOT NULL,
  `variant_id` BIGINT UNSIGNED NOT NULL,
  `quantity` INT NOT NULL,
  `status` ENUM('ACTIVE','RELEASED','CONFIRMED','EXPIRED') NOT NULL DEFAULT 'ACTIVE',
  `expires_at` DATETIME NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `released_at` DATETIME DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_reservation_token` (`reservation_token`),
  KEY `idx_reservations_order` (`order_id`),
  KEY `idx_reservations_variant_status` (`variant_id`,`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- nova_cart — owned by the Cart Service
-- =====================================================================
USE `nova_cart`;

CREATE TABLE `carts` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED DEFAULT NULL,
  `session_key` VARCHAR(64) DEFAULT NULL,
  `status` ENUM('active','converted','abandoned') NOT NULL DEFAULT 'active',
  `expires_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_carts_session` (`session_key`),
  KEY `idx_carts_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `cart_items` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `cart_id` BIGINT UNSIGNED NOT NULL,
  `variant_id` BIGINT UNSIGNED NOT NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `unit_price` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `compare_at_price` DECIMAL(10,2) DEFAULT NULL,
  `added_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_cart_items_variant` (`cart_id`,`variant_id`),
  KEY `idx_ci_variant` (`variant_id`),
  CONSTRAINT `fk_ci_cart` FOREIGN KEY (`cart_id`) REFERENCES `carts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- nova_order — owned by the Order Service
-- JSON columns for address snapshots (order immutability)
-- =====================================================================
USE `nova_order`;

CREATE TABLE `orders` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_number` VARCHAR(24) NOT NULL,
  `user_id` BIGINT UNSIGNED DEFAULT NULL,
  `customer_email` VARCHAR(255) NOT NULL,
  `customer_name` VARCHAR(150) DEFAULT NULL,
  `status` ENUM('PENDING','CONFIRMED','PROCESSING','SHIPPED','DELIVERED','CANCELLED','REFUNDED') NOT NULL DEFAULT 'PENDING',
  `shipping_method_code` VARCHAR(40) DEFAULT NULL,
  `shipping_method_name` VARCHAR(120) DEFAULT NULL,
  `items_subtotal` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `discount_total` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `shipping_total` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `tax_total` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `grand_total` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `currency` CHAR(3) NOT NULL DEFAULT 'INR',
  `coupon_code` VARCHAR(50) DEFAULT NULL,
  `shipping_address` JSON DEFAULT NULL,
  `billing_address` JSON DEFAULT NULL,
  `notes` VARCHAR(500) DEFAULT NULL,
  `payment_status` ENUM('UNPAID','PAID','REFUNDED','PARTIALLY_REFUNDED') NOT NULL DEFAULT 'UNPAID',
  `placed_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_orders_number` (`order_number`),
  KEY `idx_orders_user` (`user_id`),
  KEY `idx_orders_status` (`status`),
  KEY `idx_orders_email` (`customer_email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `order_items` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` BIGINT UNSIGNED NOT NULL,
  `product_id` BIGINT UNSIGNED DEFAULT NULL,
  `variant_id` BIGINT UNSIGNED NOT NULL,
  `product_name` VARCHAR(200) NOT NULL,
  `variant_name` VARCHAR(150) NOT NULL,
  `product_slug` VARCHAR(150) DEFAULT NULL,
  `sku` VARCHAR(80) DEFAULT NULL,
  `image_url` VARCHAR(500) DEFAULT NULL,
  `unit_price` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `compare_at_price` DECIMAL(10,2) DEFAULT NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `line_total` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_oi_order` (`order_id`),
  KEY `idx_oi_variant` (`variant_id`),
  CONSTRAINT `fk_oi_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `order_status_events` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` BIGINT UNSIGNED NOT NULL,
  `from_status` VARCHAR(30) DEFAULT NULL,
  `to_status` VARCHAR(30) NOT NULL,
  `note` VARCHAR(300) DEFAULT NULL,
  `actor_type` ENUM('SYSTEM','CUSTOMER','STAFF') NOT NULL DEFAULT 'SYSTEM',
  `actor_id` VARCHAR(60) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ose_order` (`order_id`),
  CONSTRAINT `fk_ose_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- nova_payment — owned by the Payment Service (mock provider abstraction)
-- =====================================================================
USE `nova_payment`;

CREATE TABLE `payments` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `payment_id` VARCHAR(64) NOT NULL,
  `order_id` BIGINT UNSIGNED NOT NULL,
  `user_id` BIGINT UNSIGNED DEFAULT NULL,
  `amount` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `currency` CHAR(3) NOT NULL DEFAULT 'INR',
  `status` ENUM('PENDING','AUTHORIZED','CONFIRMED','FAILED','CANCELLED','REFUNDED') NOT NULL DEFAULT 'PENDING',
  `method` ENUM('card','upi','netbanking','wallet','mock') NOT NULL DEFAULT 'mock',
  `provider` VARCHAR(64) NOT NULL DEFAULT 'mock',
  `provider_reference` VARCHAR(128) DEFAULT NULL,
  `metadata` JSON DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_payments_id` (`payment_id`),
  KEY `idx_payments_order` (`order_id`),
  KEY `idx_payments_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `refunds` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `refund_id` VARCHAR(64) NOT NULL,
  `payment_id` BIGINT UNSIGNED NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `reason` VARCHAR(300) DEFAULT NULL,
  `status` ENUM('PENDING','COMPLETED','FAILED') NOT NULL DEFAULT 'PENDING',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_refunds_id` (`refund_id`),
  KEY `idx_refunds_payment` (`payment_id`),
  CONSTRAINT `fk_refunds_payment` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- nova_shipping — owned by the Shipping Service
-- =====================================================================
USE `nova_shipping`;

CREATE TABLE `delivery_methods` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(40) NOT NULL,
  `name` VARCHAR(120) NOT NULL,
  `description` VARCHAR(300) DEFAULT NULL,
  `fee` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `estimated_days_min` INT NOT NULL DEFAULT 3,
  `estimated_days_max` INT NOT NULL DEFAULT 7,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `sort_order` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_dm_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `shipments` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `shipment_number` VARCHAR(32) NOT NULL,
  `order_id` BIGINT UNSIGNED NOT NULL,
  `carrier` VARCHAR(80) NOT NULL DEFAULT 'Nova Logistics',
  `tracking_number` VARCHAR(64) DEFAULT NULL,
  `method_code` VARCHAR(40) DEFAULT NULL,
  `recipient_name` VARCHAR(150) NOT NULL,
  `recipient_phone` VARCHAR(30) NOT NULL,
  `address` JSON NOT NULL,
  `status` ENUM('PENDING','PICKED_UP','IN_TRANSIT','OUT_FOR_DELIVERY','DELIVERED','EXCEPTION') NOT NULL DEFAULT 'PENDING',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_shipments_number` (`shipment_number`),
  KEY `idx_shipments_order` (`order_id`),
  KEY `idx_shipments_tracking` (`tracking_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `shipment_events` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `shipment_id` BIGINT UNSIGNED NOT NULL,
  `status` VARCHAR(40) NOT NULL,
  `location` VARCHAR(150) DEFAULT NULL,
  `note` VARCHAR(300) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_shipment_events` (`shipment_id`),
  CONSTRAINT `fk_shipment_events` FOREIGN KEY (`shipment_id`) REFERENCES `shipments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- nova_review — owned by the Review Service
-- =====================================================================
USE `nova_review`;

CREATE TABLE `reviews` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id` BIGINT UNSIGNED NOT NULL,
  `variant_id` BIGINT UNSIGNED DEFAULT NULL,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `order_id` BIGINT UNSIGNED DEFAULT NULL,
  `rating` TINYINT UNSIGNED NOT NULL,
  `title` VARCHAR(200) DEFAULT NULL,
  `body` TEXT NOT NULL,
  `is_verified_purchase` TINYINT(1) NOT NULL DEFAULT 0,
  `status` ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
  `helpful_count` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_reviews_product_status` (`product_id`,`status`),
  KEY `idx_reviews_user` (`user_id`),
  KEY `idx_reviews_rating` (`rating`),
  CONSTRAINT `chk_reviews_rating` CHECK (`rating` BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `review_helpful` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `review_id` BIGINT UNSIGNED NOT NULL,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_review_helpful` (`review_id`,`user_id`),
  CONSTRAINT `fk_rh_review` FOREIGN KEY (`review_id`) REFERENCES `reviews` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- nova_notification — owned by the Notification Service
-- =====================================================================
USE `nova_notification`;

CREATE TABLE `notification_templates` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `type` VARCHAR(64) NOT NULL,
  `channel` ENUM('email','in_app','sms') NOT NULL DEFAULT 'email',
  `subject_template` VARCHAR(300) NOT NULL,
  `body_template` TEXT NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_nt_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `notifications` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED DEFAULT NULL,
  `email` VARCHAR(255) DEFAULT NULL,
  `channel` ENUM('email','in_app','sms') NOT NULL DEFAULT 'email',
  `type` VARCHAR(64) NOT NULL,
  `subject` VARCHAR(300) NOT NULL,
  `body` TEXT NOT NULL,
  `payload` JSON DEFAULT NULL,
  `external_ref` VARCHAR(200) DEFAULT NULL,
  `read_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_notifications_user` (`user_id`),
  KEY `idx_notifications_email` (`email`),
  KEY `idx_notifications_unread` (`read_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `email_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `to_email` VARCHAR(255) NOT NULL,
  `from_email` VARCHAR(255) NOT NULL DEFAULT 'no-reply@nova.dev',
  `subject` VARCHAR(300) NOT NULL,
  `html_body` MEDIUMTEXT,
  `provider` VARCHAR(60) NOT NULL DEFAULT 'log',
  `status` ENUM('QUEUED','SENT','FAILED') NOT NULL DEFAULT 'QUEUED',
  `error` VARCHAR(500) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_email_logs_to` (`to_email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;