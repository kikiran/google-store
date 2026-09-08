-- =====================================================================
-- Nova Store — seed / demo data
-- Run with: npm run db:setup
-- Passwords: admin@nova.dev / NovaAdmin123!, manager@nova.dev /
-- NovaManager123!, customer@nova.dev / Customer123!
-- =====================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- =============================== nova_user =============================
USE `nova_user`;

INSERT INTO `users` (`id`,`email`,`password_hash`,`first_name`,`last_name`,`phone`,`role`,`email_verified_at`,`is_active`,`last_login_at`) VALUES
(1,'admin@nova.dev','$2a$12$aRCDV9eFTBF.HcgRRo8cF.p5A0GKZvrmuo/4f730Fwukn5Y5e2GNm','Admin','Nova','+91-9000000001','ADMIN',NOW(),1,NOW()),
(2,'manager@nova.dev','$2a$12$Y71YGuY6FRmE8GWZy1zzA.V78yHas6iEeBEyxRo5g149WRuE4gV/6','Priya','Manager','+91-9000000002','MANAGER',NOW(),1,NOW()),
(3,'customer@nova.dev','$2a$12$frqAv3NsXPOdVn25fEF0Mu9kLqHppifh2.1baom3PgWUWsdomsNK.','Rahul','Kumar','+91-9000000003','CUSTOMER',NOW(),1,NOW()),
(4,'prerna@example.com','$2a$12$frqAv3NsXPOdVn25fEF0Mu9kLqHppifh2.1baom3PgWUWsdomsNK.','Prerna','Sharma','+91-9000000004','CUSTOMER',NOW(),1,NOW());

INSERT INTO `user_profiles` (`user_id`,`bio`,`newsletter_opt_in`,`preferred_language`,`currency`) VALUES
(1,'Nova Store administrator',1,'en','INR'),
(2,'Catalog manager',1,'en','INR'),
(3,'Happy Nova customer',1,'en','INR'),
(4,'Tech enthusiast',1,'en','INR');

INSERT INTO `user_addresses` (`user_id`,`label`,`full_name`,`phone`,`address_line1`,`city`,`state`,`postal_code`,`country`,`is_default`) VALUES
(3,'Home','Rahul Kumar','+91-9000000003','221B Sankalp Nagar, Indiranagar','Bengaluru','Karnataka','560038','India',1),
(3,'Work','Rahul Kumar','+91-9000000003','Tower C, Manyata Tech Park','Bengaluru','Karnataka','560045','India',0),
(4,'Home','Prerna Sharma','+91-9000000004','12 Rose Apartments, Linking Road','Mumbai','Maharashtra','400054','India',1);

-- ============================== nova_product ============================
USE `nova_product`;

INSERT INTO `categories` (`id`,`slug`,`name`,`description`,`image_url`,`icon`,`sort_order`,`is_active`) VALUES
(1,'phones','Phones','Flagship Nova smartphones powered by the Tensor-first experience.','/images/categories/phones.svg','phone',1,1),
(2,'tablets','Tablets & Laptops','Immersive Nova tablets for work and play.','/images/categories/tablets.svg','tablet',2,1),
(3,'watches','Watches & Trackers','Smartwatches and fitness trackers for a healthier you.','/images/categories/watches.svg','watch',3,1),
(4,'earbuds','Earbuds','Wireless earbuds with immersive sound.','/images/categories/earbuds.svg','earbud',4,1),
(5,'accessories','Accessories','Cases, chargers, stands and everything in between.','/images/categories/accessories.svg','accessory',5,1);

INSERT INTO `products` (`id`,`slug`,`name`,`tagline`,`description`,`brand`,`category_id`,`base_price`,`compare_at_price`,`badge`,`is_featured`,`is_new`,`status`,`feature_rank`) VALUES
(1,'nova-x1-pro','Nova X1 Pro','Ask more of your phone.','Meet the Nova X1 Pro — our most intelligent flagship yet. Built around a blazing-fast custom chip, a class-leading camera system and battery that lasts all day, it is engineered to help you focus on the moment.',
 'Nova',1,79990.00,84990.00,'New',1,1,'active',1),
(2,'nova-x1','Nova X1','Anything but ordinary.','The Nova X1 brings flagship AI features, an incredible camera and a stunning display to more people. Powerful, helpful and beautifully designed.',
 'Nova',1,64990.00,69990.00,NULL,1,0,'active',2),
(3,'nova-x1-pro-fold','Nova X1 Pro Fold','Eye-opening performance.','Unfold a tablet. Fold a phone. The Nova X1 Pro Fold combines a stunning inner display with everything you love about Nova X1 Pro.',
 'Nova',1,149990.00,159990.00,'New',0,1,'active',3),
(4,'nova-x1a','Nova X1a','Your everyday companion.','The Nova X1a delivers the essential Nova experience — great camera, great battery, great price.',
 'Nova',1,27999.00,29999.00,NULL,0,0,'active',4),
(5,'nova-pad','Nova Pad','Your studio, anywhere.','A beautifully thin tablet with a vivid display, powerful speakers and all-day battery. Perfect for movies, artwork and spontaneous ideas.',
 'Nova',2,35999.00,39999.00,NULL,1,0,'active',5),
(6,'nova-watch-5','Nova Watch 5','A smarter way to a healthier you.','Advanced health sensors, a brighter always-on display and up to 2 days of battery — the Nova Watch 5 is the ultimate companion for your wellbeing.',
 'Nova',3,39999.00,41999.00,'New',1,1,'active',6),
(7,'nova-watch-4','Nova Watch 4','Track it all, effortlessly.','The Nova Watch 4 keeps you moving and connected with accurate fitness tracking, comfortable design and superb battery life.',
 'Nova',3,27999.00,29999.00,NULL,0,0,'active',7),
(8,'nova-buds-pro-2','Nova Buds Pro 2','Light ears ahead.','Nova Buds Pro 2 deliver immersive Adaptive Sound, crystal-clear calls and a comfortable, secure fit — all in a case that fits a pocket.',
 'Nova',4,17999.00,19990.00,'New',1,1,'active',8),
(9,'nova-buds-a','Nova Buds A','Big sound, small price.','Tune the world out with the Nova Buds A — great sound, serious battery and a design that feels made for you.',
 'Nova',4,7999.00,8999.00,NULL,0,0,'active',9),
(10,'nova-band-2','Nova Band 2','Move. Sleep. Repeat.','A slim fitness tracker with heart-rate and SpO2 tracking, sleep insights and up to 14 days of battery.',
 'Nova',3,9999.00,10999.00,NULL,0,0,'active',10),
(11,'nova-case-x1-pro','Nova Case for X1 Pro','Protection with personality.','Feels great in hand, protects from drops, and works beautifully with the Nova X1 Pro camera bar.',
 'Nova',5,2499.00,2999.00,NULL,0,0,'active',11),
(12,'nova-charger-30w','Nova 30W USB-C Charger','Power up, fast.','Charge Nova devices at top speed with a compact, travel-friendly 30W USB-C charger.',
 'Nova',5,1999.00,2499.00,NULL,0,0,'active',12),
(13,'nova-buds-case','Nova Buds Charging Case','Keep the beat going.','A spare wireless charging case engineered for Nova Buds, with long battery for on-the-go listening.',
 'Nova',5,2999.00,3499.00,NULL,0,0,'active',13),
(14,'nova-tablet-stand','Nova Tablet Stand','Steady as you go.','An adjustable aluminium stand that keeps your Nova Pad stable, comfortable and in perfect view.',
 'Nova',5,3499.00,3999.00,NULL,0,0,'active',14),
(15,'nova-watch-bands','Nova Watch Band Pack','Switch up your style.','Two interchangeable straps — Active and Woven — that pair with any 41mm Nova Watch.',
 'Nova',5,2999.00,3499.00,NULL,0,0,'active',15);

INSERT INTO `product_variants` (`id`,`product_id`,`sku`,`name`,`color`,`color_swatch`,`storage`,`price`,`compare_at_price`,`is_default`,`is_active`) VALUES
(1,1,'NVX1POBS128','Obsidian 128GB','Obsidian','#1f1f1f','128GB',79990.00,84990.00,1,1),
(2,1,'NVX1POBS256','Obsidian 256GB','Obsidian','#1f1f1f','256GB',84990.00,89990.00,0,1),
(3,1,'NVX1PARC256','Arctic Silver 256GB','Arctic Silver','#e8eaed','256GB',84990.00,89990.00,0,1),
(4,1,'NVX1PSUN512','Sunset Orange 512GB','Sunset Orange','#fb9902','512GB',89990.00,94990.00,0,1),
(5,2,'NVX1OBS256','Obsidian 256GB','Obsidian','#1f1f1f','256GB',64990.00,69990.00,1,1),
(6,2,'NVX1POR256','Porcelain 256GB','Porcelain','#f6f1ee','256GB',64990.00,69990.00,0,1),
(7,3,'NVX1PFOLD POR256','Porcelain 256GB','Porcelain','#f6f1ee','256GB',149990.00,159990.00,1,1),
(8,3,'NVX1PFOLDOBS512','Obsidian 512GB','Obsidian','#1f1f1f','512GB',159990.00,169990.00,0,1),
(9,4,'NVX1AMINT128','Mint 128GB','Mint','#89c2a9','128GB',27999.00,29999.00,1,1),
(10,4,'NVX1AOBS128','Obsidian 128GB','Obsidian','#1f1f1f','128GB',27999.00,29999.00,0,1),
(11,4,'NVX1AROSE128','Rose 128GB','Rose','#f0a5b0','128GB',27999.00,29999.00,0,1),
(12,5,'NVPADPOR128','Porcelain 128GB','Porcelain','#f6f1ee','128GB',35999.00,39999.00,1,1),
(13,5,'NVPADHAZ256','Hazel 256GB','Hazel','#cad4c6','256GB',42999.00,46999.00,0,1),
(14,6,'NVW5HAZ41','Hazel 41mm','Hazel','#cad4c6','41mm',39999.00,41999.00,1,1),
(15,6,'NVW5ARG41','Silver 41mm','Silver','#d9dbe0','41mm',39999.00,41999.00,0,1),
(16,6,'NVW5OBS41','Obsidian 41mm','Obsidian','#1f1f1f','41mm',39999.00,41999.00,0,1),
(17,7,'NVW4OBS41','Obsidian 41mm','Obsidian','#1f1f1f','41mm',27999.00,29999.00,1,1),
(18,7,'NVW4CREAM41','Porcelain 41mm','Porcelain','#f6f1ee','41mm',27999.00,29999.00,0,1),
(19,8,'NVBP2POR','Porcelain','Porcelain','#f6f1ee',NULL,17999.00,19990.00,1,1),
(20,8,'NVBP2CHAR','Charcoal','Charcoal','#3c4043',NULL,17999.00,19990.00,0,1),
(21,8,'NVBP2MINT','Mint','Mint','#89c2a9',NULL,17999.00,19990.00,0,1),
(22,9,'NVBA CHAR','Charcoal','Charcoal','#3c4043',NULL,7999.00,8999.00,1,1),
(23,9,'NVBAPOR','Porcelain','Porcelain','#f6f1ee',NULL,7999.00,8999.00,0,1),
(24,10,'NVBD2CHAR','Charcoal','Charcoal','#3c4043',NULL,9999.00,10999.00,1,1),
(25,10,'NVBD2MINT','Mint','Mint','#89c2a9',NULL,9999.00,10999.00,0,1),
(26,11,'NVCASE OBS','Obsidian Case','Obsidian','#1f1f1f',NULL,2499.00,2999.00,1,1),
(27,11,'NVCASEPOR','Porcelain Case','Porcelain','#f6f1ee',NULL,2499.00,2999.00,0,1),
(28,12,'NVCHG30W WHI','Nova 30W Charger - White','White','#ffffff',NULL,1999.00,2499.00,1,1),
(29,12,'NVCHG30W CHA','Nova 30W Charger - Charcoal','Charcoal','#3c4043',NULL,1999.00,2499.00,0,1),
(30,13,'NVBCCASE','Nova Buds Case','White','#ffffff',NULL,2999.00,3499.00,1,1),
(31,14,'NVSTND ALU','Nova Tablet Stand - Silver','Silver','#d9dbe0',NULL,3499.00,3999.00,1,1),
(32,15,'NVWBANDPK','Nova Watch Band Pack','Active + Woven','#4285f4',NULL,2999.00,3499.00,1,1);

INSERT INTO `product_images` (`product_id`,`variant_id`,`url`,`alt_text`,`sort_order`,`is_primary`) VALUES
(1,NULL,'/images/products/nova-x1-pro.svg','Nova X1 Pro in Obsidian',1,1),
(2,NULL,'/images/products/nova-x1.svg','Nova X1 in Obsidian',1,1),
(3,NULL,'/images/products/nova-x1-pro-fold.svg','Nova X1 Pro Fold unfolded',1,1),
(4,NULL,'/images/products/nova-x1a.svg','Nova X1a in Mint',1,1),
(5,NULL,'/images/products/nova-pad.svg','Nova Pad in Porcelain',1,1),
(6,NULL,'/images/products/nova-watch-5.svg','Nova Watch 5',1,1),
(7,NULL,'/images/products/nova-watch-4.svg','Nova Watch 4',1,1),
(8,NULL,'/images/products/nova-buds-pro-2.svg','Nova Buds Pro 2',1,1),
(9,NULL,'/images/products/nova-buds-a.svg','Nova Buds A',1,1),
(10,NULL,'/images/products/nova-band-2.svg','Nova Band 2',1,1),
(11,NULL,'/images/products/nova-case-x1-pro.svg','Nova Case for X1 Pro',1,1),
(12,NULL,'/images/products/nova-charger-30w.svg','Nova 30W USB-C Charger',1,1),
(13,NULL,'/images/products/nova-buds-case.svg','Nova Buds Charging Case',1,1),
(14,NULL,'/images/products/nova-tablet-stand.svg','Nova Tablet Stand',1,1),
(15,NULL,'/images/products/nova-watch-bands.svg','Nova Watch Band Pack',1,1);

INSERT INTO `product_specifications` (`product_id`,`name`,`value`,`sort_order`) VALUES
(1,'Display','6.7-inch LTPO OLED, 120Hz, up to 3000 nits',1),
(1,'Processor','Nova Tensor X1',2),
(1,'Camera','50MP Octa PD wide, 48MP ultrawide, 48MP tele 5x',3),
(1,'Battery','5000 mAh, up to 24+ hrs',4),
(1,'Charging','45W wired, 23W wireless',5),
(1,'Water resistance','IP68',6),
(1,'Security','Face unlock + in-display fingerprint',7),
(2,'Display','6.2-inch FHD+ OLED, 120Hz',1),
(2,'Processor','Nova Tensor G1',2),
(2,'Camera','50MP Octa PD wide, 13MP ultrawide',3),
(2,'Battery','4800 mAh, up to 24 hrs',4),
(2,'Water resistance','IP67',5),
(3,'Display','7.9-inch inner OLED, 120Hz',1),
(3,'Processor','Nova Tensor X1',2),
(3,'Camera','50MP Octa PD wide, 48MP ultrawide, 10.8MP tele 5x',3),
(3,'Battery','4650 mAh',4),
(3,'Water resistance','IPX8',5),
(4,'Display','6.3-inch FHD+ OLED, 90Hz',1),
(4,'Processor','Nova Tensor G2',2),
(4,'Camera','32MP wide, 13MP ultrawide',3),
(4,'Battery','5100 mAh',4),
(5,'Display','12.4-inch OLED, 144Hz',1),
(5,'Processor','Nova Tensor G2',2),
(5,'Camera','13MP rear, 8MP front',3),
(5,'Battery','10090 mAh',4),
(5,'Audio','Quad speakers, Dolby Atmos',5),
(6,'Display','1.4-inch LTPO OLED, 3000 nits',1),
(6,'Battery','Up to 2 days',2),
(6,'Sensors','Heart rate, ECG (single-lead), SpO2, skin temp',3),
(6,'Water resistance','5ATM',4),
(6,'Compatibility','Android 10+',5),
(7,'Display','1.2-inch AMOLED',1),
(7,'Battery','Up to 34 hrs',2),
(7,'Sensors','Heart rate, SpO2',3),
(7,'Water resistance','5ATM',4),
(8,'Audio','11mm drivers, adaptive noise cancelling',1),
(8,'Battery','Up to 12 hrs (buds), 48 hrs (with case)',2),
(8,'Bluetooth','5.4, multipoint',3),
(8,'Water resistance','IPX5',4),
(9,'Audio','10mm drivers, active noise cancellation',1),
(9,'Battery','Up to 11 hrs (buds), 43 hrs (with case)',2),
(9,'Bluetooth','5.2',3),
(10,'Display','1.26-inch AMOLED',1),
(10,'Battery','Up to 14 days',2),
(10,'Sensors','Heart rate, SpO2, sleep',3),
(10,'Water resistance','5ATM',4),
(11,'Material','Recycled aluminium + soft-touch silicone',1),
(11,'Protection','Drop tested up to 1.8m',2),
(11,'Feature','Wireless charging compatible',3),
(12,'Power','30W USB-C PD 3.0 PPS',1),
(12,'Cable','USB-C to USB-C 1.8m included',2),
(13,'Compatibility','Nova Buds Pro 2 / Buds A',1),
(13,'Battery','Up to 600 mAh, wireless charging',2),
(14,'Material','Anodized aluminium',1),
(14,'Adjustable','4 viewing angles, 0-150 degrees',2),
(14,'Weight','420g',3),
(15,'Includes','Active + Woven 2-pack',1),
(15,'Compatibility','41mm Nova Watch 4 / 5',2);

INSERT INTO `promotions` (`id`,`name`,`slug`,`description`,`discount_type`,`discount_value`,`starts_at`,`ends_at`,`is_active`) VALUES
(1,'Phone Launch Offer','phone-launch','Instant savings on select Nova phones at launch.','percent',5.00,DATE_SUB(NOW(), INTERVAL 7 DAY),DATE_ADD(NOW(), INTERVAL 30 DAY),1),
(2,'Wearables Week','wearables-week','Extra savings on watches and trackers.','percent',8.00,DATE_SUB(NOW(), INTERVAL 3 DAY),DATE_ADD(NOW(), INTERVAL 14 DAY),1),
(3,'Audio Fest','audio-fest','Save on Nova Buds during Audio Fest.','percent',10.00,DATE_SUB(NOW(), INTERVAL 1 DAY),DATE_ADD(NOW(), INTERVAL 21 DAY),1),
(4,'Accessories Bundle','accessories-bundle','Bundle accessories and save.','fixed',500.00,DATE_SUB(NOW(), INTERVAL 5 DAY),DATE_ADD(NOW(), INTERVAL 20 DAY),1);

INSERT INTO `product_promotions` (`product_id`,`promotion_id`) VALUES
(1,1),(2,1),(3,1),(6,2),(7,2),(10,2),(8,3),(9,3),(11,4),(12,4),(14,4);

INSERT INTO `coupons` (`code`,`name`,`discount_type`,`discount_value`,`max_uses`,`used_count`,`min_order_amount`,`expires_at`,`is_active`) VALUES
('WELCOME10','Welcome 10% off','percent',10.00,500,42,5000.00,DATE_ADD(NOW(), INTERVAL 90 DAY),1),
('SAVE1000','Save ₹1000','fixed',1000.00,300,12,30000.00,DATE_ADD(NOW(), INTERVAL 60 DAY),1),
('NOVANEW5','Nova New User 5%','percent',5.00,1000,88,2000.00,DATE_ADD(NOW(), INTERVAL 30 DAY),1);

-- ============================ nova_inventory ===========================
USE `nova_inventory`;

INSERT INTO `inventory` (`variant_id`,`quantity`,`reserved_quantity`,`low_stock_threshold`) VALUES
(1,25,0,5),(2,18,0,5),(3,20,0,5),(4,8,0,5),(5,30,0,5),(6,26,0,5),(7,12,0,5),(8,6,0,5),
(9,40,0,5),(10,35,0,5),(11,22,0,5),(12,24,0,5),(13,14,0,5),(14,16,0,5),(15,18,0,5),(16,11,0,5),
(17,28,0,5),(18,25,0,5),(19,32,0,5),(20,29,0,5),(21,15,0,5),(22,60,0,5),(23,55,0,5),
(24,50,0,5),(25,44,0,5),(26,120,0,5),(27,110,0,5),(28,200,0,5),(29,180,0,5),(30,90,0,5),(31,70,0,5),(32,85,0,5);

INSERT INTO `inventory_movements` (`variant_id`,`change_type`,`quantity_change`,`reference_type`,`note`) VALUES
(1,'adjust',25,NULL,'Initial stock'),(5,'adjust',30,NULL,'Initial stock'),(14,'adjust',16,NULL,'Initial stock'),(19,'adjust',32,NULL,'Initial stock');

-- ============================== nova_cart ==============================
USE `nova_cart`;
-- (no seed data; carts are created at runtime)

-- ============================== nova_order =============================
USE `nova_order`;

INSERT INTO `orders` (`id`,`order_number`,`user_id`,`customer_email`,`customer_name`,`status`,`shipping_method_code`,`shipping_method_name`,`items_subtotal`,`discount_total`,`shipping_total`,`tax_total`,`grand_total`,`currency`,`coupon_code`,`shipping_address`,`billing_address`,`payment_status`,`placed_at`) VALUES
(1,'NV-100182',3,'customer@nova.dev','Rahul Kumar','DELIVERED','standard','Standard (3–7 days)',131989.00,6599.45,0.00,0.00,125389.55,'INR','WELCOME10',JSON_OBJECT('fullName','Rahul Kumar','phone','+91-9000000003','addressLine1','221B Sankalp Nagar, Indiranagar','city','Bengaluru','state','Karnataka','postalCode','560038','country','India'),JSON_OBJECT('fullName','Rahul Kumar','phone','+91-9000000003','addressLine1','221B Sankalp Nagar, Indiranagar','city','Bengaluru','state','Karnataka','postalCode','560038','country','India'),'PAID',DATE_SUB(NOW(), INTERVAL 10 DAY)),
(2,'NV-100183',3,'customer@nova.dev','Rahul Kumar','CANCELLED','standard','Standard (3–7 days)',39999.00,0.00,0.00,0.00,39999.00,'INR',NULL,JSON_OBJECT('fullName','Rahul Kumar','phone','+91-9000000003','addressLine1','221B Sankalp Nagar, Indiranagar','city','Bengaluru','state','Karnataka','postalCode','560038','country','India'),JSON_OBJECT('fullName','Rahul Kumar','phone','+91-9000000003','addressLine1','221B Sankalp Nagar, Indiranagar','city','Bengaluru','state','Karnataka','postalCode','560038','country','India'),'REFUNDED',DATE_SUB(NOW(), INTERVAL 5 DAY));

INSERT INTO `order_items` (`order_id`,`product_id`,`variant_id`,`product_name`,`variant_name`,`product_slug`,`sku`,`image_url`,`unit_price`,`compare_at_price`,`quantity`,`line_total`) VALUES
(1,1,1,'Nova X1 Pro','Obsidian 128GB','nova-x1-pro','NVX1POBS128','/images/products/nova-x1-pro.svg',79990.00,84990.00,1,79990.00),
(1,6,14,'Nova Watch 5','Hazel 41mm','nova-watch-5','NVW5HAZ41','/images/products/nova-watch-5.svg',39999.00,41999.00,1,39999.00),
(1,8,19,'Nova Buds Pro 2','Porcelain','nova-buds-pro-2','NVBP2POR','/images/products/nova-buds-pro-2.svg',12000.00,19990.00,1,12000.00),
(2,6,14,'Nova Watch 5','Hazel 41mm','nova-watch-5','NVW5HAZ41','/images/products/nova-watch-5.svg',39999.00,41999.00,1,39999.00);

INSERT INTO `order_status_events` (`order_id`,`from_status`,`to_status`,`note`,`actor_type`) VALUES
(1,NULL,'CONFIRMED','Order placed and payment confirmed','SYSTEM'),
(1,'CONFIRMED','PROCESSING','Order picked and packed','SYSTEM'),
(1,'PROCESSING','SHIPPED','Handed to Nova Logistics','SYSTEM'),
(1,'SHIPPED','DELIVERED','Delivered at doorstep','SYSTEM'),
(2,NULL,'PENDING','Order placed','SYSTEM'),
(2,'PENDING','CANCELLED','Cancelled by customer before shipment','CUSTOMER');

-- ============================== nova_payment ===========================
USE `nova_payment`;

INSERT INTO `payments` (`payment_id`,`order_id`,`user_id`,`amount`,`currency`,`status`,`method`,`provider`,`provider_reference`,`metadata`,`created_at`) VALUES
('pay_nv_9a1b2c3d',1,3,125389.55,'INR','CONFIRMED','card','mock','mock_ref_182',JSON_OBJECT('last4','4242'),DATE_SUB(NOW(), INTERVAL 10 DAY)),
('pay_nv_5e6f7g8h',2,3,39999.00,'INR','REFUNDED','upi','mock','mock_ref_183',JSON_OBJECT('vpa','rahul@oknova'),DATE_SUB(NOW(), INTERVAL 5 DAY));

INSERT INTO `refunds` (`refund_id`,`payment_id`,`amount`,`reason`,`status`,`created_at`) VALUES
('ref_nv_001',2,39999.00,'Order cancelled by customer','COMPLETED',DATE_SUB(NOW(), INTERVAL 4 DAY));

-- ============================== nova_shipping ==========================
USE `nova_shipping`;

INSERT INTO `delivery_methods` (`code`,`name`,`description`,`fee`,`estimated_days_min`,`estimated_days_max`,`is_active`,`sort_order`) VALUES
('standard','Standard (3–7 days)','Free standard delivery on every order.',0.00,3,7,1,1),
('express','Express (1–3 days)','Faster delivery for when you need it sooner.',499.00,1,3,1,2),
('scheduled','Scheduled delivery','Choose a date and time that suits you.',0.00,4,10,1,3);

INSERT INTO `shipments` (`shipment_number`,`order_id`,`carrier`,`tracking_number`,`method_code`,`recipient_name`,`recipient_phone`,`address`,`status`,`created_at`,`updated_at`) VALUES
('SHIP-NV-182','1','Nova Logistics','NVL2025001121','standard','Rahul Kumar','+91-9000000003',JSON_OBJECT('fullName','Rahul Kumar','phone','+91-9000000003','addressLine1','221B Sankalp Nagar, Indiranagar','city','Bengaluru','state','Karnataka','postalCode','560038','country','India'),'DELIVERED',DATE_SUB(NOW(), INTERVAL 9 DAY),DATE_SUB(NOW(), INTERVAL 4 DAY));

INSERT INTO `shipment_events` (`shipment_id`,`status`,`location`,`note`) VALUES
(1,'PICKED_UP','Nova Logistics, Bengaluru','Parcel picked up'),
(1,'IN_TRANSIT','Bengaluru HUB','Reached sorting hub'),
(1,'OUT_FOR_DELIVERY','Indiranagar, Bengaluru','Out for delivery'),
(1,'DELIVERED','Indiranagar, Bengaluru','Delivered');

-- ============================== nova_review ============================
USE `nova_review`;

INSERT INTO `reviews` (`id`,`product_id`,`user_id`,`order_id`,`rating`,`title`,`body`,`is_verified_purchase`,`status`,`helpful_count`,`created_at`) VALUES
(1,1,3,1,5,'Simply the best camera I have owned','The photos on this phone are unreal — night mode is a revelation and the zoom is crisp. Battery easily lasts a full day and a half for me.',
 1,'APPROVED',24,DATE_SUB(NOW(), INTERVAL 9 DAY)),
(2,1,4,NULL,4,'Flagship that thinks ahead','Incredibly smooth and the display is gorgeous. Wish the charger was in the box, but otherwise a fantastic device.',
 0,'APPROVED',18,DATE_SUB(NOW(), INTERVAL 6 DAY)),
(3,1,2,NULL,5,'Genius AI features','Email summaries, live translate during calls — the AI features are genuinely useful day to day. Fast, fluid, refined.',
 0,'APPROVED',11,DATE_SUB(NOW(), INTERVAL 4 DAY)),
(4,6,4,NULL,4,'Great health companion','Sleep tracking is insightful and the battery really does give two days of use. Straps are easy to swap.',
 0,'APPROVED',9,DATE_SUB(NOW(), INTERVAL 3 DAY)),
(5,8,4,NULL,5,'Best buds for the price','Noise cancellation is great for flights and calls sound clear on both ends. The case is delightfully tiny.',
 0,'APPROVED',14,DATE_SUB(NOW(), INTERVAL 2 DAY)),
(6,8,2,NULL,4,'Excellent sound, comfy fit','Great bass and a snug fit. Multipoint switching between laptop and phone works flawlessly.',
 0,'PENDING',2,DATE_SUB(NOW(), INTERVAL 1 DAY));

-- ========================== nova_notification =========================
USE `nova_notification`;

INSERT INTO `notification_templates` (`type`,`channel`,`subject_template`,`body_template`) VALUES
('order_confirmed','email','Your Nova order {{orderNumber}} is confirmed','Hi {{name}}, your order {{orderNumber}} for {{summary}} has been confirmed. Total paid: {{total}}.'),
('order_shipped','email','Your Nova order {{orderNumber}} has shipped','Hi {{name}}, your order is on the way. Tracking: {{trackingNumber}}.'),
('order_delivered','email','Your Nova order {{orderNumber}} was delivered','Hi {{name}}, your order has been delivered. Enjoy your Nova gear!'),
('payment_confirmed','email','Payment confirmed for order {{orderNumber}}','We received your payment of {{total}} for order {{orderNumber}}.'),
('payment_failed','email','Payment failed for order {{orderNumber}}','We could not process your payment. Please try again.'),
('password_reset','email','Reset your Nova password','Hi {{name}}, use this link to reset your password. It expires in 30 minutes: {{link}}'),
('verify_email','email','Verify your Nova email','Hi {{name}}, verify your email address with this link: {{link}}'),
('guest_checkout','email','Almost done — complete your Nova order','Hi {{name}}, finish checking out with the link below: {{link}}'),
('welcome','email','Welcome to Nova Store','Hi {{name}}, welcome! Start exploring the latest Nova devices.'),
('order_cancelled','email','Your Nova order {{orderNumber}} was cancelled','Hi {{name}}, order {{orderNumber}} has been cancelled. Refund initiated where applicable.');

SET FOREIGN_KEY_CHECKS = 1;