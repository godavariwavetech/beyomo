-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: beyomo
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `admin_users`
--

DROP TABLE IF EXISTS `admin_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `admin_users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('super_admin','admin','manager','analyst','support') DEFAULT 'support',
  `customPermissions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`customPermissions`)),
  `status` enum('active','inactive') DEFAULT 'active',
  `lastLogin` datetime DEFAULT NULL,
  `createdBy` int(11) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `allowedCities` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`allowedCities`)),
  `fcmToken` text DEFAULT NULL,
  `allowedZones` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`allowedZones`)),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `email_2` (`email`),
  UNIQUE KEY `email_3` (`email`),
  UNIQUE KEY `email_4` (`email`),
  UNIQUE KEY `email_5` (`email`),
  UNIQUE KEY `email_6` (`email`),
  UNIQUE KEY `email_7` (`email`),
  UNIQUE KEY `email_8` (`email`),
  UNIQUE KEY `email_9` (`email`),
  UNIQUE KEY `email_10` (`email`),
  UNIQUE KEY `email_11` (`email`),
  UNIQUE KEY `email_12` (`email`),
  UNIQUE KEY `email_13` (`email`),
  UNIQUE KEY `email_14` (`email`),
  UNIQUE KEY `email_15` (`email`),
  UNIQUE KEY `email_16` (`email`),
  UNIQUE KEY `email_17` (`email`),
  UNIQUE KEY `email_18` (`email`),
  KEY `createdBy` (`createdBy`),
  CONSTRAINT `admin_users_ibfk_1` FOREIGN KEY (`createdBy`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_users`
--

LOCK TABLES `admin_users` WRITE;
/*!40000 ALTER TABLE `admin_users` DISABLE KEYS */;
INSERT INTO `admin_users` VALUES (1,'Super Admin','admin@beyomo.com','$2a$12$TxYP5bAmWN94uaqZc8EFzuFB3N5vtN8jX6uJKCL2/VRVF5doBudCW','super_admin','[]','active','2026-06-17 00:40:59',NULL,'2026-05-24 18:41:13','2026-06-17 12:11:53',NULL,'cx3AdnDz_gYJIj2-ARcPI7:APA91bGTjpDwEqpDdAAhrooc4_Bd3uF1qPZK4jWQf9yef1WNiwkKmFSGc8O32iek8zg40gQNi-hVeFxwNWCe5QKRF3CcHFi8_NCtAL3R_x2e3Q_ubOKDdDs',NULL);
/*!40000 ALTER TABLE `admin_users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `app_feedback`
--

DROP TABLE IF EXISTS `app_feedback`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `app_feedback` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) DEFAULT NULL,
  `userName` varchar(100) DEFAULT NULL,
  `type` enum('service','app','suggestion','bug') NOT NULL,
  `message` text NOT NULL,
  `rating` int(11) DEFAULT NULL,
  `serviceBooked` varchar(150) DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `version` varchar(20) DEFAULT NULL,
  `status` enum('new','reviewed','resolved') DEFAULT 'new',
  `submittedAt` datetime DEFAULT NULL,
  `adminNotes` text DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  CONSTRAINT `app_feedback_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `app_feedback`
--

LOCK TABLES `app_feedback` WRITE;
/*!40000 ALTER TABLE `app_feedback` DISABLE KEYS */;
/*!40000 ALTER TABLE `app_feedback` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `banners`
--

DROP TABLE IF EXISTS `banners`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `banners` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` enum('top','promo') NOT NULL DEFAULT 'top',
  `title` varchar(120) NOT NULL,
  `subtitle` varchar(120) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `image` text DEFAULT NULL,
  `gradientStart` varchar(30) DEFAULT '#1a5c4a',
  `gradientEnd` varchar(30) DEFAULT '#022723',
  `buttonText` varchar(40) DEFAULT 'Book Now',
  `targetScreen` varchar(60) DEFAULT NULL,
  `targetParam` varchar(120) DEFAULT NULL,
  `isActive` tinyint(1) DEFAULT 1,
  `sortOrder` int(11) DEFAULT 0,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `banners`
--

LOCK TABLES `banners` WRITE;
/*!40000 ALTER TABLE `banners` DISABLE KEYS */;
INSERT INTO `banners` VALUES (1,'top','MASSAGES','Therapeutic','Relieve tension and restore balance with every touch.','https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&q=80&fit=crop','#1a5c4a','#022723','Book Now','ServiceListing','Massage',1,1,'2026-05-25 09:37:11','2026-05-25 09:37:11'),(2,'top','FACIALS','Rejuvenating','Glow from within — professional facial treatments at your doorstep.','https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&q=80&fit=crop','#6b2d5e','#2d0a27','Book Now','ServiceListing','Facial',1,2,'2026-05-25 09:37:11','2026-05-25 09:37:11'),(3,'promo','50% OFF','NEW USER\nSPECIAL','On Your First Booking',NULL,'#0E5843','#022723','BOOK NOW','ServiceListing','Massage',1,1,'2026-05-25 09:37:11','2026-05-25 09:37:11'),(4,'promo','30% OFF','BRIDAL\nSPECIAL','On All Bridal Packages',NULL,'#7B3F00','#3D1F00','EXPLORE','ServiceListing','Bridal Makeup',1,2,'2026-05-25 09:37:11','2026-05-25 09:37:11');
/*!40000 ALTER TABLE `banners` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bookings`
--

DROP TABLE IF EXISTS `bookings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `bookings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `bookingCode` varchar(30) DEFAULT NULL,
  `userId` int(11) NOT NULL,
  `partnerId` int(11) DEFAULT NULL,
  `serviceId` int(11) NOT NULL,
  `addressLabel` varchar(50) DEFAULT NULL,
  `addressLine1` varchar(255) NOT NULL,
  `addressLine2` varchar(255) DEFAULT NULL,
  `addressCity` varchar(100) NOT NULL,
  `addressState` varchar(100) NOT NULL,
  `addressPincode` varchar(10) NOT NULL,
  `addressLat` float DEFAULT NULL,
  `addressLng` float DEFAULT NULL,
  `scheduledAt` datetime NOT NULL,
  `status` enum('pending','confirmed','in_progress','completed','cancelled') DEFAULT 'pending',
  `baseAmount` decimal(10,2) NOT NULL,
  `discountAmount` decimal(10,2) DEFAULT 0.00,
  `couponDiscountAmount` decimal(10,2) DEFAULT 0.00,
  `taxAmount` decimal(10,2) DEFAULT 0.00,
  `totalAmount` decimal(10,2) NOT NULL,
  `partnerEarning` decimal(10,2) DEFAULT NULL,
  `couponCode` varchar(50) DEFAULT NULL,
  `couponId` int(11) DEFAULT NULL,
  `paymentStatus` enum('pending','paid','refunded') DEFAULT 'pending',
  `paymentId` int(11) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `cancelledBy` enum('user','partner','admin') DEFAULT NULL,
  `cancellationReason` text DEFAULT NULL,
  `completedAt` datetime DEFAULT NULL,
  `ratingUser` int(11) DEFAULT NULL,
  `ratingPartner` int(11) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `cityId` int(11) DEFAULT NULL,
  `services` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`services`)),
  `offerId` int(11) DEFAULT NULL,
  `serviceUpdatePending` tinyint(1) DEFAULT 0,
  `pendingServicesUpdate` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`pendingServicesUpdate`)),
  `packageId` int(11) DEFAULT NULL,
  `previousScheduledAt` datetime DEFAULT NULL,
  `rescheduledCount` int(11) NOT NULL DEFAULT 0,
  `rescheduledBy` enum('user','partner','admin') DEFAULT NULL,
  `rescheduleReason` text DEFAULT NULL,
  `paymentMode` enum('online','cod') NOT NULL DEFAULT 'online',
  `lastServiceUpdateDecision` enum('approved','rejected') DEFAULT NULL,
  `arrivedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `bookingCode` (`bookingCode`),
  UNIQUE KEY `bookingCode_2` (`bookingCode`),
  KEY `userId` (`userId`),
  KEY `partnerId` (`partnerId`),
  KEY `serviceId` (`serviceId`),
  KEY `couponId` (`couponId`),
  CONSTRAINT `bookings_ibfk_69` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT `bookings_ibfk_70` FOREIGN KEY (`partnerId`) REFERENCES `partners` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `bookings_ibfk_71` FOREIGN KEY (`serviceId`) REFERENCES `services` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT `bookings_ibfk_72` FOREIGN KEY (`couponId`) REFERENCES `coupons` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=79 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bookings`
--

LOCK TABLES `bookings` WRITE;
/*!40000 ALTER TABLE `bookings` DISABLE KEYS */;
INSERT INTO `bookings` VALUES (54,'BYM-202605-223068',1,7,1,'Home','123, Palm Residency, Madhapur Main Road',NULL,'Hyderabad','Telangana','500081',NULL,NULL,'2026-05-26 15:17:00','in_progress',7193.00,0.00,0.00,1294.74,8487.74,8487.74,NULL,NULL,'pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-05-26 13:17:27','2026-06-04 12:50:35',NULL,'[{\"serviceId\":1,\"name\":\"Classic Haircut\",\"price\":299,\"qty\":1,\"duration\":30,\"image\":\"https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&q=80&fit=crop\"},{\"serviceId\":2,\"name\":\"Deep Cleansing Facial\",\"price\":999,\"qty\":1,\"duration\":75,\"image\":\"https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=600&q=80&fit=crop\"},{\"serviceId\":4,\"name\":\"Deep Conditioning Hair Spa\",\"price\":599,\"qty\":1,\"duration\":60,\"image\":\"https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&q=80&fit=crop\"},{\"serviceId\":5,\"name\":\"Keratin Hair Spa\",\"price\":1499,\"qty\":1,\"duration\":90,\"image\":\"https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=600&q=80&fit=crop\"},{\"serviceId\":6,\"name\":\"Scalp Treatment\",\"price\":799,\"qty\":1,\"duration\":45,\"image\":\"https://images.unsplash.com/photo-1583795484071-3c453e3a7c71?w=600&q=80&fit=crop\"},{\"serviceId\":27,\"name\":\"Aromatherapy Massage\",\"price\":1499,\"qty\":2,\"duration\":75,\"image\":\"https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=600&q=80&fit=crop\",\"addedByPartner\":true,\"serviceStatus\":\"claimed\"}]',NULL,0,NULL,NULL,NULL,0,NULL,NULL,'online',NULL,NULL),(55,'BYM-202605-193042',1,7,4,'Home','Koti Women\'s College Road, Ward 78 Gunfoundry, Sultan Bazar','Greater Hyderabad Municipal Corporation Central Zone','Hyderabad','Telangana','500095',17.385,78.4867,'2026-05-26 16:35:00','completed',4497.00,0.00,0.00,809.46,5306.46,5306.46,NULL,NULL,'pending',NULL,NULL,NULL,NULL,'2026-06-04 11:13:32',NULL,NULL,'2026-05-26 14:35:57','2026-06-04 11:13:32',3,'[{\"serviceId\":27,\"name\":\"Aromatherapy Massage\",\"price\":1499,\"qty\":3,\"duration\":75,\"image\":\"https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=600&q=80&fit=crop\",\"addedByPartner\":true,\"serviceStatus\":\"completed\",\"assignedPartnerId\":7,\"assignedPartnerName\":\"Alex\"}]',NULL,1,'{\"services\":[{\"serviceId\":27,\"name\":\"Aromatherapy Massage\",\"price\":1499,\"qty\":3,\"duration\":75,\"image\":\"https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=600&q=80&fit=crop\",\"addedByPartner\":true,\"serviceStatus\":\"claimed\",\"assignedPartnerId\":7,\"assignedPartnerName\":\"Alex\"},{\"serviceId\":27,\"name\":\"Aromatherapy Massage\",\"price\":1499,\"qty\":1,\"duration\":75,\"image\":\"https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=600&q=80&fit=crop\",\"addedByPartner\":true,\"serviceStatus\":\"claimed\"},{\"serviceId\":16,\"name\":\"Basic Haircut & Trim\",\"price\":299,\"qty\":1,\"duration\":30,\"image\":\"https://images.unsplash.com/photo-1560869713-7d0a29430803?w=600&q=80&fit=crop\",\"addedByPartner\":true,\"serviceStatus\":\"claimed\"}],\"totalAmount\":7428.1,\"requestedAt\":\"2026-06-04T11:01:17.025Z\"}',NULL,NULL,0,NULL,NULL,'online',NULL,NULL),(56,'BYM-202605-501585',1,4,4,'Home','Koti Women\'s College Road, Ward 78 Gunfoundry, Sultan Bazar','Greater Hyderabad Municipal Corporation Central Zone','Hyderabad','Telangana','',17.385,78.4867,'2026-05-26 16:41:00','confirmed',2098.00,0.00,0.00,377.64,2475.64,2475.64,NULL,NULL,'pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-05-26 14:42:05','2026-06-01 18:03:39',3,'[{\"serviceId\":4,\"name\":\"Deep Conditioning Hair Spa\",\"price\":599,\"qty\":1,\"duration\":60,\"image\":\"https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&q=80&fit=crop\"},{\"serviceId\":5,\"name\":\"Keratin Hair Spa\",\"price\":1499,\"qty\":1,\"duration\":90,\"image\":\"https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=600&q=80&fit=crop\"}]',NULL,0,NULL,NULL,NULL,0,NULL,NULL,'online',NULL,NULL),(58,'BYM-202606-113513',1,NULL,1,'Home','Koti Women\'s College Road, Ward 78 Gunfoundry, Sultan Bazar','Greater Hyderabad Municipal Corporation Central Zone','Hyderabad','Telangana','',17.385,78.4867,'2026-06-01 19:37:00','cancelled',1298.00,0.00,0.00,233.64,1531.64,1531.64,NULL,NULL,'pending',NULL,NULL,'user','Cancelled by user',NULL,NULL,NULL,'2026-06-01 17:37:50','2026-06-01 17:46:37',3,'[{\"serviceId\":1,\"name\":\"Classic Haircut\",\"price\":299,\"qty\":1,\"duration\":30,\"image\":\"https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&q=80&fit=crop\"},{\"serviceId\":2,\"name\":\"Deep Cleansing Facial\",\"price\":999,\"qty\":1,\"duration\":75,\"image\":\"https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=600&q=80&fit=crop\"}]',NULL,0,NULL,NULL,NULL,0,NULL,NULL,'online',NULL,NULL),(60,'BYM-202606-220789',1,4,20,'Home','Koti Women\'s College Road, Ward 78 Gunfoundry, Sultan Bazar','Greater Hyderabad Municipal Corporation Central Zone','Hyderabad','Telangana','',17.385,78.4867,'2026-06-01 19:53:00','confirmed',12998.00,0.00,0.00,2339.64,15337.64,15337.64,NULL,NULL,'pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-06-01 17:53:30','2026-06-01 18:01:18',3,'[{\"serviceId\":20,\"name\":\"Engagement Makeup\",\"price\":2999,\"qty\":1,\"duration\":90,\"image\":\"https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=600&q=80&fit=crop\"},{\"serviceId\":21,\"name\":\"Airbrush Bridal Makeup\",\"price\":9999,\"qty\":1,\"duration\":210,\"image\":\"https://images.unsplash.com/photo-1519741497674-611481863552?w=600&q=80&fit=crop\"}]',NULL,0,NULL,NULL,NULL,0,NULL,NULL,'online',NULL,NULL),(62,'BYM-202606-838011',1,7,1,'Home','Koti Women\'s College Road, Ward 78 Gunfoundry, Sultan Bazar','Greater Hyderabad Municipal Corporation Central Zone','Hyderabad','Telangana','',17.385,78.4867,'2026-06-04 14:41:00','completed',6593.00,0.00,0.00,1186.74,7779.74,7779.74,NULL,NULL,'paid',NULL,NULL,NULL,NULL,'2026-06-17 09:58:22',NULL,NULL,'2026-06-04 12:41:44','2026-06-17 09:58:22',3,'[{\"serviceId\":1,\"name\":\"Classic Haircut\",\"price\":299,\"qty\":2,\"duration\":30,\"image\":\"https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&q=80&fit=crop\",\"serviceStatus\":\"completed\",\"assignedPartnerId\":7,\"assignedPartnerName\":\"Alex\"},{\"serviceId\":2,\"name\":\"Deep Cleansing Facial\",\"price\":999,\"qty\":2,\"duration\":75,\"image\":\"https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=600&q=80&fit=crop\",\"serviceStatus\":\"completed\",\"assignedPartnerId\":7,\"assignedPartnerName\":\"Alex\"},{\"serviceId\":7,\"name\":\"Party Makeup\",\"price\":1499,\"qty\":2,\"duration\":60,\"image\":\"https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=600&q=80&fit=crop\",\"serviceStatus\":\"completed\",\"assignedPartnerId\":7,\"assignedPartnerName\":\"Alex\"},{\"serviceId\":8,\"name\":\"Natural Everyday Makeup\",\"price\":999,\"qty\":1,\"duration\":45,\"image\":\"https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&q=80&fit=crop\",\"serviceStatus\":\"completed\",\"assignedPartnerId\":7,\"assignedPartnerName\":\"Alex\"}]',NULL,1,'{\"services\":[{\"serviceId\":1,\"name\":\"Classic Haircut\",\"price\":299,\"qty\":2,\"duration\":30,\"image\":\"https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&q=80&fit=crop\",\"serviceStatus\":\"claimed\",\"assignedPartnerId\":7,\"assignedPartnerName\":\"Alex\"},{\"serviceId\":2,\"name\":\"Deep Cleansing Facial\",\"price\":999,\"qty\":2,\"duration\":75,\"image\":\"https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=600&q=80&fit=crop\",\"serviceStatus\":\"claimed\",\"assignedPartnerId\":7,\"assignedPartnerName\":\"Alex\"},{\"serviceId\":7,\"name\":\"Party Makeup\",\"price\":1499,\"qty\":2,\"duration\":60,\"image\":\"https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=600&q=80&fit=crop\",\"serviceStatus\":\"claimed\",\"assignedPartnerId\":7,\"assignedPartnerName\":\"Alex\"},{\"serviceId\":8,\"name\":\"Natural Everyday Makeup\",\"price\":999,\"qty\":1,\"duration\":45,\"image\":\"https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&q=80&fit=crop\",\"serviceStatus\":\"claimed\",\"assignedPartnerId\":7,\"assignedPartnerName\":\"Alex\"},{\"serviceId\":16,\"name\":\"Basic Haircut & Trim\",\"price\":299,\"qty\":2,\"duration\":30,\"image\":\"https://images.unsplash.com/photo-1560869713-7d0a29430803?w=600&q=80&fit=crop\",\"addedByPartner\":true,\"serviceStatus\":\"claimed\"}],\"totalAmount\":8485.38,\"requestedAt\":\"2026-06-04T12:49:33.408Z\"}',NULL,NULL,0,NULL,NULL,'online',NULL,NULL),(64,'BYM-202606-202033',1,7,19,'Home','Koti Women\'s College Road, Ward 78 Gunfoundry, Sultan Bazar','Greater Hyderabad Municipal Corporation Central Zone','Hyderabad','Telangana','',17.385,78.4867,'2026-06-17 03:46:00','completed',69071.00,0.00,190.00,12398.58,81279.58,81279.58,'TESTT',4,'paid',NULL,NULL,NULL,NULL,'2026-06-17 09:28:40',NULL,NULL,'2026-06-08 11:32:48','2026-06-17 09:28:41',3,'[{\"serviceId\":19,\"name\":\"Traditional Bridal Makeup\",\"price\":7999,\"qty\":4,\"duration\":180,\"image\":\"https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=600&q=80&fit=crop\",\"serviceStatus\":\"unassigned\",\"assignedPartnerId\":null,\"assignedPartnerName\":null,\"removed\":true},{\"serviceId\":20,\"name\":\"Engagement Makeup\",\"price\":2999,\"qty\":4,\"duration\":90,\"image\":\"https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=600&q=80&fit=crop\",\"serviceStatus\":\"unassigned\",\"assignedPartnerId\":null,\"assignedPartnerName\":null,\"removed\":true},{\"serviceId\":35,\"name\":\"3D Nail Art\",\"price\":799,\"qty\":1,\"duration\":60,\"image\":\"https://images.unsplash.com/photo-1607779097040-26e80aa78e66?w=600&q=80&fit=crop\",\"addedByUser\":true,\"removed\":true},{\"serviceId\":30,\"name\":\"Acrylic Nail Extension\",\"price\":1499,\"qty\":3,\"duration\":90,\"image\":\"https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=600&q=80&fit=crop\",\"addedByUser\":true,\"serviceStatus\":\"completed\",\"assignedPartnerId\":7},{\"serviceId\":16,\"name\":\"Basic Haircut & Trim\",\"price\":299,\"qty\":3,\"duration\":30,\"image\":\"https://images.unsplash.com/photo-1560869713-7d0a29430803?w=600&q=80&fit=crop\",\"addedByUser\":true,\"serviceStatus\":\"completed\",\"assignedPartnerId\":7},{\"serviceId\":4,\"name\":\"Deep Conditioning Hair Spa\",\"price\":599,\"qty\":1,\"duration\":60,\"image\":\"https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&q=80&fit=crop\",\"addedByAdmin\":true,\"serviceStatus\":\"completed\",\"assignedPartnerId\":7},{\"serviceId\":20,\"name\":\"Engagement Makeup\",\"price\":2999,\"qty\":2,\"duration\":90,\"image\":\"https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=600&q=80&fit=crop\",\"addedByAdmin\":true,\"serviceStatus\":\"completed\",\"assignedPartnerId\":7},{\"serviceId\":12,\"name\":\"Full Body Waxing\",\"price\":1499,\"qty\":1,\"duration\":120,\"image\":\"https://images.unsplash.com/photo-1526413232644-8a40f03cc03b?w=600&q=80&fit=crop\",\"addedByAdmin\":true,\"serviceStatus\":\"completed\",\"assignedPartnerId\":7},{\"serviceId\":35,\"name\":\"3D Nail Art\",\"price\":799,\"qty\":1,\"duration\":60,\"image\":\"https://images.unsplash.com/photo-1607779097040-26e80aa78e66?w=600&q=80&fit=crop\",\"addedByAdmin\":true,\"removed\":true},{\"serviceId\":30,\"name\":\"Acrylic Nail Extension\",\"price\":1499,\"qty\":4,\"duration\":90,\"image\":\"https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=600&q=80&fit=crop\",\"addedByAdmin\":true,\"serviceStatus\":\"completed\",\"assignedPartnerId\":7},{\"serviceId\":35,\"name\":\"3D Nail Art\",\"price\":799,\"qty\":5,\"duration\":60,\"image\":\"https://images.unsplash.com/photo-1607779097040-26e80aa78e66?w=600&q=80&fit=crop\",\"addedByAdmin\":true,\"removed\":true}]',NULL,0,NULL,NULL,'2026-06-08 13:27:00',1,'admin','Rescheduled by admin','online','approved',NULL),(65,'BYM-202606-171394',1,7,1,'Home','Koti Women\'s College Road, Ward 78 Gunfoundry, Sultan Bazar','Greater Hyderabad Municipal Corporation Central Zone','Hyderabad','Telangana','',17.385,78.4867,'2026-06-18 07:52:00','completed',2895.00,0.00,0.00,521.10,3416.10,3416.10,NULL,NULL,'paid',NULL,NULL,NULL,NULL,'2026-06-17 06:28:08',NULL,NULL,'2026-06-17 05:52:44','2026-06-17 06:28:08',3,'[{\"serviceId\":1,\"name\":\"Classic Haircut\",\"price\":299,\"qty\":3,\"duration\":30,\"image\":\"https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&q=80&fit=crop\",\"serviceStatus\":\"completed\",\"assignedPartnerId\":7,\"assignedPartnerName\":null},{\"serviceId\":2,\"name\":\"Deep Cleansing Facial\",\"price\":999,\"qty\":2,\"duration\":75,\"image\":\"https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=600&q=80&fit=crop\",\"serviceStatus\":\"completed\",\"assignedPartnerId\":7,\"assignedPartnerName\":null}]',NULL,0,NULL,NULL,'2026-06-17 07:52:00',1,'user',NULL,'cod',NULL,NULL),(66,'BYM-202606-489791',1,7,8,'Home','Koti Women\'s College Road, Ward 78 Gunfoundry, Sultan Bazar','Greater Hyderabad Municipal Corporation Central Zone','Hyderabad','Telangana','',17.385,78.4867,'2026-06-17 07:55:00','completed',3498.00,0.00,0.00,629.64,4127.64,4127.64,NULL,NULL,'paid',NULL,NULL,NULL,NULL,'2026-06-17 06:28:33',NULL,NULL,'2026-06-17 05:55:20','2026-06-17 06:28:33',3,'[{\"serviceId\":8,\"name\":\"Natural Everyday Makeup\",\"price\":999,\"qty\":1,\"duration\":45,\"image\":\"https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&q=80&fit=crop\",\"serviceStatus\":\"completed\",\"assignedPartnerId\":7,\"assignedPartnerName\":null},{\"serviceId\":9,\"name\":\"HD Airbrush Makeup\",\"price\":2499,\"qty\":1,\"duration\":75,\"image\":\"https://images.unsplash.com/photo-1583195764036-1ce2e97dac2c?w=600&q=80&fit=crop\",\"serviceStatus\":\"completed\",\"assignedPartnerId\":7,\"assignedPartnerName\":null}]',NULL,0,NULL,NULL,NULL,0,NULL,NULL,'cod',NULL,NULL),(67,'BYM-202606-777338',1,7,1,'Home','Koti Women\'s College Road, Ward 78 Gunfoundry, Sultan Bazar','Greater Hyderabad Municipal Corporation Central Zone','Hyderabad','Telangana','',17.385,78.4867,'2026-06-17 08:29:00','completed',1298.00,0.00,0.00,233.64,1531.64,1531.64,NULL,NULL,'paid',NULL,NULL,NULL,NULL,'2026-06-17 06:31:24',NULL,NULL,'2026-06-17 06:29:07','2026-06-17 06:31:24',3,'[{\"serviceId\":1,\"name\":\"Classic Haircut\",\"price\":299,\"qty\":1,\"duration\":30,\"image\":\"https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&q=80&fit=crop\",\"serviceStatus\":\"completed\",\"assignedPartnerId\":7,\"assignedPartnerName\":null},{\"serviceId\":2,\"name\":\"Deep Cleansing Facial\",\"price\":999,\"qty\":1,\"duration\":75,\"image\":\"https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=600&q=80&fit=crop\",\"serviceStatus\":\"completed\",\"assignedPartnerId\":7,\"assignedPartnerName\":null}]',NULL,0,NULL,NULL,NULL,0,NULL,NULL,'cod',NULL,NULL),(68,'BYM-202606-253933',1,7,9,'Home','Koti Women\'s College Road, Ward 78 Gunfoundry, Sultan Bazar','Greater Hyderabad Municipal Corporation Central Zone','Hyderabad','Telangana','',17.385,78.4867,'2026-06-17 08:33:00','completed',2499.00,0.00,0.00,449.82,2948.82,2948.82,NULL,NULL,'paid',NULL,NULL,NULL,NULL,'2026-06-17 06:34:20',NULL,NULL,'2026-06-17 06:33:40','2026-06-17 06:34:20',3,'[{\"serviceId\":9,\"name\":\"HD Airbrush Makeup\",\"price\":2499,\"qty\":1,\"duration\":75,\"image\":\"https://images.unsplash.com/photo-1583195764036-1ce2e97dac2c?w=600&q=80&fit=crop\",\"serviceStatus\":\"completed\",\"assignedPartnerId\":7,\"assignedPartnerName\":null}]',NULL,0,NULL,NULL,NULL,0,NULL,NULL,'online',NULL,NULL),(69,'BYM-202606-560625',1,7,1,'Home','Koti Women\'s College Road, Ward 78 Gunfoundry, Sultan Bazar','Greater Hyderabad Municipal Corporation Central Zone','Hyderabad','Telangana','',17.385,78.4867,'2026-06-17 09:09:00','completed',7294.00,0.00,0.00,1312.92,8606.92,8606.92,NULL,NULL,'paid',NULL,NULL,NULL,NULL,'2026-06-17 07:19:15',NULL,NULL,'2026-06-17 07:09:43','2026-06-17 07:19:15',3,'[{\"serviceId\":1,\"name\":\"Classic Haircut\",\"price\":299,\"qty\":1,\"duration\":30,\"image\":\"https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&q=80&fit=crop\",\"serviceStatus\":\"completed\",\"assignedPartnerId\":7,\"assignedPartnerName\":null},{\"serviceId\":2,\"name\":\"Deep Cleansing Facial\",\"price\":999,\"qty\":1,\"duration\":75,\"image\":\"https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=600&q=80&fit=crop\",\"serviceStatus\":\"completed\",\"assignedPartnerId\":7,\"assignedPartnerName\":null},{\"serviceId\":30,\"name\":\"Acrylic Nail Extension\",\"price\":1499,\"qty\":2,\"duration\":90,\"image\":\"https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=600&q=80&fit=crop\",\"addedByPartner\":true,\"serviceStatus\":\"completed\",\"assignedPartnerId\":7},{\"serviceId\":30,\"name\":\"Acrylic Nail Extension\",\"price\":1499,\"qty\":2,\"duration\":90,\"image\":\"https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=600&q=80&fit=crop\",\"addedByPartner\":true,\"serviceStatus\":\"completed\",\"assignedPartnerId\":7}]',NULL,0,NULL,NULL,NULL,0,NULL,NULL,'online','approved',NULL),(70,'BYM-202606-811455',1,7,5,'Home','Koti Women\'s College Road, Ward 78 Gunfoundry, Sultan Bazar','Greater Hyderabad Municipal Corporation Central Zone','Hyderabad','Telangana','',17.385,78.4867,'2026-06-19 13:27:00','completed',10191.00,0.00,0.00,1834.38,12025.38,9431.74,NULL,NULL,'paid',NULL,NULL,NULL,NULL,'2026-06-17 07:42:52',NULL,NULL,'2026-06-17 07:20:34','2026-06-17 07:42:52',3,'[{\"serviceId\":5,\"name\":\"Keratin Hair Spa\",\"price\":1499,\"qty\":1,\"duration\":90,\"image\":\"https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=600&q=80&fit=crop\",\"serviceStatus\":\"completed\",\"assignedPartnerId\":7,\"assignedPartnerName\":\"Alex\"},{\"serviceId\":8,\"name\":\"Natural Everyday Makeup\",\"price\":999,\"qty\":1,\"duration\":45,\"image\":\"https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&q=80&fit=crop\",\"serviceStatus\":\"completed\",\"assignedPartnerId\":7,\"assignedPartnerName\":\"Alex\"},{\"serviceId\":16,\"name\":\"Basic Haircut & Trim\",\"price\":299,\"qty\":1,\"duration\":30,\"image\":\"https://images.unsplash.com/photo-1560869713-7d0a29430803?w=600&q=80&fit=crop\",\"serviceStatus\":\"completed\",\"assignedPartnerId\":7,\"assignedPartnerName\":\"Alex\"},{\"serviceId\":18,\"name\":\"Hair Wash, Cut & Blow Dry\",\"price\":699,\"qty\":1,\"duration\":60,\"image\":\"https://images.unsplash.com/photo-1522337180988-2df4d5bf9ca6?w=600&q=80&fit=crop\",\"serviceStatus\":\"completed\",\"assignedPartnerId\":7,\"assignedPartnerName\":\"Alex\"},{\"serviceId\":30,\"name\":\"Acrylic Nail Extension\",\"price\":1499,\"qty\":3,\"duration\":90,\"image\":\"https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=600&q=80&fit=crop\",\"addedByPartner\":true,\"serviceStatus\":\"completed\",\"assignedPartnerId\":7},{\"serviceId\":14,\"name\":\"Spa Pedicure\",\"price\":999,\"qty\":1,\"duration\":60,\"image\":\"https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=600&q=80&fit=crop\",\"addedByAdmin\":true,\"serviceStatus\":\"completed\",\"assignedPartnerId\":7},{\"serviceId\":25,\"name\":\"Swedish Relaxation Massage\",\"price\":1199,\"qty\":1,\"duration\":60,\"image\":\"https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&q=80&fit=crop\",\"addedByAdmin\":true,\"serviceStatus\":\"completed\",\"assignedPartnerId\":7}]',NULL,0,NULL,NULL,'2026-06-17 13:27:05',4,'user',NULL,'cod','approved','2026-06-17 07:21:37'),(71,'BYM-202606-559331',1,7,1,'Home','Test St',NULL,'Hyderabad','Telangana','',17.385,78.4867,'2026-06-17 15:38:06','completed',1298.00,0.00,0.00,233.64,1531.64,1531.64,NULL,NULL,'paid',NULL,NULL,NULL,NULL,'2026-06-17 07:55:20',NULL,NULL,'2026-06-17 07:37:34','2026-06-17 07:55:20',3,'[{\"serviceId\":1,\"name\":\"Classic Haircut\",\"price\":299,\"qty\":1,\"duration\":30,\"image\":\"https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&q=80&fit=crop\",\"serviceStatus\":\"completed\",\"assignedPartnerId\":7,\"assignedPartnerName\":\"Alex\"},{\"serviceId\":2,\"name\":\"Deep Cleansing Facial\",\"price\":999,\"qty\":1,\"duration\":75,\"image\":\"https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=600&q=80&fit=crop\",\"serviceStatus\":\"completed\",\"assignedPartnerId\":7,\"assignedPartnerName\":\"Alex\"}]',NULL,0,NULL,NULL,'2026-06-18 10:00:00',1,'user',NULL,'cod',NULL,NULL),(72,'BYM-202606-396498',1,NULL,1,'Home','Test St',NULL,'Hyderabad','Telangana','',17.385,78.4867,'2026-06-19 11:00:00','pending',1298.00,0.00,0.00,233.64,1531.64,1531.64,NULL,NULL,'pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-06-17 11:04:12','2026-06-17 11:04:12',3,'[{\"serviceId\":1,\"name\":\"Classic Haircut\",\"price\":299,\"qty\":1,\"duration\":30,\"image\":\"https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&q=80&fit=crop\",\"serviceStatus\":\"unassigned\",\"assignedPartnerId\":null,\"assignedPartnerName\":null},{\"serviceId\":2,\"name\":\"Deep Cleansing Facial\",\"price\":999,\"qty\":1,\"duration\":75,\"image\":\"https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=600&q=80&fit=crop\",\"serviceStatus\":\"unassigned\",\"assignedPartnerId\":null,\"assignedPartnerName\":null},{\"serviceId\":11,\"name\":\"Underarm Waxing\",\"price\":0,\"qty\":1,\"duration\":15,\"image\":\"https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=600&q=80&fit=crop\",\"serviceStatus\":\"unassigned\",\"assignedPartnerId\":null,\"assignedPartnerName\":null,\"addedByOffer\":true}]',4,0,NULL,NULL,NULL,0,NULL,NULL,'cod',NULL,NULL),(73,'BYM-202606-146949',1,NULL,1,'Home','Koti Women\'s College Road, Ward 78 Gunfoundry, Sultan Bazar','Greater Hyderabad Municipal Corporation Central Zone','Hyderabad','Telangana','',17.385,78.4867,'2026-06-17 13:10:00','pending',299.00,0.00,0.00,53.82,352.82,352.82,NULL,NULL,'pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-06-17 11:10:41','2026-06-17 11:10:41',3,'[{\"serviceId\":1,\"name\":\"Classic Haircut\",\"price\":299,\"qty\":1,\"duration\":30,\"image\":\"https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&q=80&fit=crop\",\"serviceStatus\":\"unassigned\",\"assignedPartnerId\":null,\"assignedPartnerName\":null}]',NULL,0,NULL,NULL,NULL,0,NULL,NULL,'online',NULL,NULL),(74,'BYM-202606-803855',1,NULL,1,'Home','Koti Women\'s College Road, Ward 78 Gunfoundry, Sultan Bazar','Greater Hyderabad Municipal Corporation Central Zone','Hyderabad','Telangana','',17.385,78.4867,'2026-06-17 13:12:00','pending',1298.00,0.00,0.00,233.64,1531.64,1531.64,NULL,NULL,'pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-06-17 11:12:30','2026-06-17 11:12:30',3,'[{\"serviceId\":1,\"name\":\"Classic Haircut\",\"price\":299,\"qty\":1,\"duration\":30,\"image\":\"https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&q=80&fit=crop\",\"serviceStatus\":\"unassigned\",\"assignedPartnerId\":null,\"assignedPartnerName\":null},{\"serviceId\":2,\"name\":\"Deep Cleansing Facial\",\"price\":999,\"qty\":1,\"duration\":75,\"image\":\"https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=600&q=80&fit=crop\",\"serviceStatus\":\"unassigned\",\"assignedPartnerId\":null,\"assignedPartnerName\":null}]',NULL,0,NULL,NULL,NULL,0,NULL,NULL,'online',NULL,NULL),(75,'BYM-202606-986014',1,7,4,'Home','Koti Women\'s College Road, Ward 78 Gunfoundry, Sultan Bazar','Greater Hyderabad Municipal Corporation Central Zone','Hyderabad','Telangana','',17.385,78.4867,'2026-06-17 13:13:00','completed',2098.00,0.00,0.00,377.64,2475.64,2475.64,NULL,NULL,'paid',NULL,NULL,NULL,NULL,'2026-06-17 13:31:06',NULL,NULL,'2026-06-17 11:13:22','2026-06-17 13:31:06',3,'[{\"serviceId\":4,\"name\":\"Deep Conditioning Hair Spa\",\"price\":599,\"qty\":1,\"duration\":60,\"image\":\"https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&q=80&fit=crop\",\"serviceStatus\":\"completed\",\"assignedPartnerId\":7,\"assignedPartnerName\":\"Alex\"},{\"serviceId\":5,\"name\":\"Keratin Hair Spa\",\"price\":1499,\"qty\":1,\"duration\":90,\"image\":\"https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=600&q=80&fit=crop\",\"serviceStatus\":\"completed\",\"assignedPartnerId\":7,\"assignedPartnerName\":\"Alex\"}]',NULL,0,NULL,NULL,NULL,0,NULL,NULL,'online',NULL,'2026-06-17 13:30:59'),(76,'BYM-202606-139299',1,7,12,'Home','Koti Women\'s College Road, Ward 78 Gunfoundry, Sultan Bazar','Greater Hyderabad Municipal Corporation Central Zone','Hyderabad','Telangana','',17.385,78.4867,'2026-06-17 13:28:00','completed',10493.00,0.00,0.00,1888.74,12381.74,8844.10,NULL,NULL,'paid',NULL,NULL,NULL,NULL,'2026-06-17 12:13:24',NULL,NULL,'2026-06-17 11:28:48','2026-06-17 12:13:24',3,'[{\"serviceId\":12,\"name\":\"Full Body Waxing\",\"price\":1499,\"qty\":1,\"duration\":120,\"image\":\"https://images.unsplash.com/photo-1526413232644-8a40f03cc03b?w=600&q=80&fit=crop\",\"serviceStatus\":\"completed\",\"assignedPartnerId\":7,\"assignedPartnerName\":\"Alex\"},{\"serviceId\":11,\"name\":\"Underarm Waxing\",\"price\":0,\"qty\":1,\"duration\":15,\"image\":\"https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=600&q=80&fit=crop\",\"serviceStatus\":\"completed\",\"assignedPartnerId\":7,\"assignedPartnerName\":\"Alex\",\"addedByOffer\":true},{\"serviceId\":30,\"name\":\"Acrylic Nail Extension\",\"price\":1499,\"qty\":6,\"duration\":90,\"image\":\"https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=600&q=80&fit=crop\",\"addedByPartner\":true,\"serviceStatus\":\"completed\",\"assignedPartnerId\":7}]',3,0,NULL,NULL,NULL,0,NULL,NULL,'online','approved','2026-06-17 12:02:50'),(77,'BYM-202606-661655',1,7,1,'Home','Koti Women\'s College Road, Ward 78 Gunfoundry, Sultan Bazar','Greater Hyderabad Municipal Corporation Central Zone','Hyderabad','Telangana','',17.385,78.4867,'2026-06-17 13:42:00','confirmed',1298.00,0.00,259.60,186.91,1225.31,1225.31,'SAVE20',6,'pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-06-17 11:43:05','2026-06-17 12:00:07',3,'[{\"serviceId\":1,\"name\":\"Classic Haircut\",\"price\":299,\"qty\":1,\"duration\":30,\"image\":\"https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&q=80&fit=crop\",\"serviceStatus\":\"claimed\",\"assignedPartnerId\":7,\"assignedPartnerName\":\"Alex\"},{\"serviceId\":2,\"name\":\"Deep Cleansing Facial\",\"price\":999,\"qty\":1,\"duration\":75,\"image\":\"https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=600&q=80&fit=crop\",\"serviceStatus\":\"claimed\",\"assignedPartnerId\":7,\"assignedPartnerName\":\"Alex\"},{\"serviceId\":11,\"name\":\"Underarm Waxing\",\"price\":0,\"qty\":1,\"duration\":15,\"image\":\"https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=600&q=80&fit=crop\",\"serviceStatus\":\"claimed\",\"assignedPartnerId\":7,\"assignedPartnerName\":\"Alex\",\"addedByOffer\":true}]',3,1,'{\"services\":[{\"serviceId\":1,\"name\":\"Classic Haircut\",\"price\":299,\"qty\":1,\"duration\":30,\"serviceStatus\":\"claimed\",\"assignedPartnerId\":7,\"assignedPartnerName\":\"Alex\"},{\"serviceId\":2,\"name\":\"Deep Cleansing Facial\",\"price\":999,\"qty\":1,\"duration\":75,\"serviceStatus\":\"claimed\",\"assignedPartnerId\":7,\"assignedPartnerName\":\"Alex\"},{\"serviceId\":11,\"name\":\"Underarm Waxing\",\"price\":0,\"qty\":1,\"duration\":15,\"serviceStatus\":\"claimed\",\"assignedPartnerId\":7,\"assignedPartnerName\":\"Alex\",\"addedByOffer\":true},{\"serviceId\":4,\"name\":\"Deep Conditioning Hair Spa\",\"price\":599,\"qty\":1,\"duration\":60,\"serviceStatus\":\"claimed\",\"assignedPartnerId\":7,\"assignedPartnerName\":\"Alex\",\"addedByPartner\":true}],\"totalAmount\":1932.13,\"requestedAt\":\"2026-06-17T12:00:07.954Z\"}',NULL,NULL,0,NULL,NULL,'cod',NULL,'2026-06-17 11:48:39'),(78,'BYM-202606-745702',1,NULL,1,'Home','Test St',NULL,'Hyderabad','Telangana','',17.385,78.4867,'2026-06-19 15:00:00','pending',299.00,0.00,0.00,14.95,313.95,239.20,NULL,NULL,'pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-06-17 13:26:05','2026-06-17 13:26:05',3,'[{\"serviceId\":1,\"name\":\"Classic Haircut\",\"price\":299,\"qty\":1,\"duration\":30,\"image\":\"https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&q=80&fit=crop\",\"serviceStatus\":\"unassigned\",\"assignedPartnerId\":null,\"assignedPartnerName\":null}]',NULL,0,NULL,NULL,NULL,0,NULL,NULL,'cod',NULL,NULL);
/*!40000 ALTER TABLE `bookings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cities`
--

DROP TABLE IF EXISTS `cities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cities` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `state` varchar(100) DEFAULT NULL,
  `isActive` tinyint(1) DEFAULT 1,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `lat` float DEFAULT NULL,
  `lng` float DEFAULT NULL,
  `radius` float DEFAULT 30,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `name_2` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=1925 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cities`
--

LOCK TABLES `cities` WRITE;
/*!40000 ALTER TABLE `cities` DISABLE KEYS */;
INSERT INTO `cities` VALUES (3,'Hyderabad','Telangana',1,'2026-05-26 13:52:30','2026-05-26 13:52:30',17.385,78.4867,30),(4,'Bangalore','Karnataka',1,'2026-05-26 13:52:30','2026-05-26 13:52:30',12.9716,77.5946,30),(5,'Chennai','Tamil Nadu',1,'2026-05-26 13:52:30','2026-06-04 12:21:54',13.0827,80.2707,30),(6,'Mumbai','Maharashtra',1,'2026-05-26 13:52:30','2026-05-26 13:52:30',19.076,72.8777,40),(7,'Pune','Maharashtra',1,'2026-05-26 13:52:30','2026-05-26 13:52:30',18.5204,73.8567,25),(8,'Delhi','Delhi',1,'2026-05-26 13:52:30','2026-05-26 13:52:30',28.6139,77.209,40),(10,'Ahmedabad','Gujarat',1,'2026-05-26 13:52:30','2026-06-04 12:21:55',23.0225,72.5714,30),(11,'Jaipur','Rajasthan',1,'2026-05-26 13:52:30','2026-05-26 13:52:30',26.9124,75.7873,25),(12,'Visakhapatnam','Andhra Pradesh',1,'2026-05-26 13:52:30','2026-05-26 13:52:30',17.6868,83.2185,25),(596,'Rajahmundry','Andhra Pradesh',1,'2026-06-04 12:22:48','2026-06-04 12:23:06',17.38,78.89,30),(948,'Vijayawada','Andhra Pradesh',1,'2026-06-08 07:07:29','2026-06-08 07:07:29',16.5115,80.6161,30),(949,'Kolkata','West Bengal',1,'2026-06-08 07:29:54','2026-06-08 07:29:54',22.5726,88.3639,35);
/*!40000 ALTER TABLE `cities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contact_inquiries`
--

DROP TABLE IF EXISTS `contact_inquiries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `contact_inquiries` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `email` varchar(200) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `subject` varchar(200) NOT NULL,
  `message` text NOT NULL,
  `status` enum('new','in_progress','resolved') DEFAULT 'new',
  `adminNotes` text DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contact_inquiries`
--

LOCK TABLES `contact_inquiries` WRITE;
/*!40000 ALTER TABLE `contact_inquiries` DISABLE KEYS */;
INSERT INTO `contact_inquiries` VALUES (1,'sfd','asdf@gmail.com','9898989898','Booking Support','sddfsadfsd','in_progress','','2026-06-14 12:24:24','2026-06-14 12:27:44');
/*!40000 ALTER TABLE `contact_inquiries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `coupons`
--

DROP TABLE IF EXISTS `coupons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `coupons` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `code` varchar(50) NOT NULL,
  `type` enum('flat','percent') NOT NULL,
  `discount` decimal(10,2) NOT NULL,
  `maxDiscount` decimal(10,2) DEFAULT NULL,
  `minOrderAmount` decimal(10,2) DEFAULT 0.00,
  `maxUses` int(11) DEFAULT NULL,
  `usedCount` int(11) DEFAULT 0,
  `validFrom` datetime NOT NULL,
  `validTill` datetime NOT NULL,
  `isActive` tinyint(1) DEFAULT 1,
  `description` text DEFAULT NULL,
  `createdBy` int(11) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `cityIds` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`cityIds`)),
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  UNIQUE KEY `code_2` (`code`),
  UNIQUE KEY `code_3` (`code`),
  UNIQUE KEY `code_4` (`code`),
  UNIQUE KEY `code_5` (`code`),
  UNIQUE KEY `code_6` (`code`),
  UNIQUE KEY `code_7` (`code`),
  UNIQUE KEY `code_8` (`code`),
  UNIQUE KEY `code_9` (`code`),
  UNIQUE KEY `code_10` (`code`),
  UNIQUE KEY `code_11` (`code`),
  UNIQUE KEY `code_12` (`code`),
  UNIQUE KEY `code_13` (`code`),
  UNIQUE KEY `code_14` (`code`),
  UNIQUE KEY `code_15` (`code`),
  UNIQUE KEY `code_16` (`code`),
  UNIQUE KEY `code_17` (`code`),
  UNIQUE KEY `code_18` (`code`),
  KEY `createdBy` (`createdBy`),
  CONSTRAINT `coupons_ibfk_1` FOREIGN KEY (`createdBy`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `coupons`
--

LOCK TABLES `coupons` WRITE;
/*!40000 ALTER TABLE `coupons` DISABLE KEYS */;
INSERT INTO `coupons` VALUES (4,'TESTT','percent',20.00,190.00,2000.00,10,5,'2026-06-08 00:00:00','2026-06-12 00:00:00',1,'Testesst',1,'2026-06-08 11:29:18','2026-06-08 11:32:48','[10,3,12,596]'),(5,'WELCOME100','flat',100.00,NULL,499.00,500,0,'2026-06-16 10:00:45','2026-08-16 10:00:45',1,'Flat ₹100 off on your first booking above ₹499',NULL,'2026-06-17 10:00:45','2026-06-17 10:00:45','[]'),(6,'SAVE20','percent',20.00,300.00,999.00,1000,1,'2026-06-16 10:00:45','2026-07-17 10:00:45',1,'20% off on orders above ₹999, up to ₹300',NULL,'2026-06-17 10:00:45','2026-06-17 11:43:05','[]'),(7,'SPA50','percent',50.00,1000.00,1500.00,200,0,'2026-06-16 10:00:45','2026-07-02 10:00:45',1,'50% off on spa & wellness bookings above ₹1500',NULL,'2026-06-17 10:00:45','2026-06-17 10:00:45','[]');
/*!40000 ALTER TABLE `coupons` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) DEFAULT NULL,
  `partnerId` int(11) DEFAULT NULL,
  `title` varchar(200) NOT NULL,
  `body` text NOT NULL,
  `data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`data`)),
  `type` enum('booking','payment','promo','system') DEFAULT 'system',
  `isRead` tinyint(1) DEFAULT 0,
  `sentAt` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `partnerId` (`partnerId`),
  CONSTRAINT `notifications_ibfk_31` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `notifications_ibfk_32` FOREIGN KEY (`partnerId`) REFERENCES `partners` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=155 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (1,NULL,NULL,'Direct test','Test body','{}','promo',0,'2026-05-25 06:53:31','2026-05-25 06:53:31','2026-05-25 06:53:31'),(2,NULL,NULL,'Weekend Special Offer! 🎉','Get {{discount}}% off on all beauty services this weekend. Book now!','{}','promo',0,'2026-05-25 07:50:38','2026-05-25 07:50:38','2026-05-25 07:50:38'),(3,1,NULL,'Booking Placed','Your booking for Anti-Aging Facial (BYM-202605-481597) has been placed.','{\"bookingId\":\"1\"}','booking',0,'2026-05-25 10:24:33','2026-05-25 10:24:33','2026-05-25 10:24:33'),(4,1,NULL,'Booking Placed','Your booking for Classic Facial (BYM-202605-444780) has been placed.','{\"bookingId\":\"2\"}','booking',0,'2026-05-25 10:53:21','2026-05-25 10:53:21','2026-05-25 10:53:21'),(5,1,NULL,'Booking Placed','Your booking for Anti-Aging Facial (BYM-202605-741876) has been placed.','{\"bookingId\":\"3\"}','booking',0,'2026-05-25 10:53:21','2026-05-25 10:53:21','2026-05-25 10:53:21'),(6,1,NULL,'Booking Placed','Your booking for Deep Conditioning Hair Spa (BYM-202605-977822) has been placed.','{\"bookingId\":\"4\"}','booking',0,'2026-05-25 10:56:20','2026-05-25 10:56:20','2026-05-25 10:56:20'),(7,1,NULL,'Booking Placed','Your booking for Keratin Hair Spa (BYM-202605-407195) has been placed.','{\"bookingId\":\"5\"}','booking',0,'2026-05-25 10:56:20','2026-05-25 10:56:20','2026-05-25 10:56:20'),(8,NULL,NULL,'New Job Requests Available','There are new job requests near you. Go online to accept!','{}','promo',0,'2026-05-25 12:06:23','2026-05-25 12:06:23','2026-05-25 12:06:23'),(9,1,NULL,'Booking Placed','Your booking for Keratin Hair Spa (BYM-202605-630143) has been placed.','{\"bookingId\":\"6\"}','booking',0,'2026-05-25 12:19:25','2026-05-25 12:19:25','2026-05-25 12:19:25'),(10,1,NULL,'Booking Placed','Your booking for Deep Conditioning Hair Spa (BYM-202605-975587) has been placed.','{\"bookingId\":\"7\"}','booking',0,'2026-05-25 12:19:25','2026-05-25 12:19:25','2026-05-25 12:19:25'),(11,1,NULL,'Booking Placed','Your booking for Classic Facial (BYM-202605-133562) has been placed.','{\"bookingId\":\"8\"}','booking',0,'2026-05-25 12:20:33','2026-05-25 12:20:33','2026-05-25 12:20:33'),(12,1,NULL,'Booking Placed','Your booking for Classic Facial (BYM-202605-772409) has been placed.','{\"bookingId\":\"9\"}','booking',0,'2026-05-25 17:44:09','2026-05-25 17:44:09','2026-05-25 17:44:09'),(13,1,NULL,'Booking Placed','Your booking for Classic Facial (BYM-202605-506129) has been placed.','{\"bookingId\":\"10\"}','booking',0,'2026-05-25 17:44:32','2026-05-25 17:44:32','2026-05-25 17:44:32'),(14,1,NULL,'Partner Assigned','Your booking BYM-202605-506129 has been accepted by a partner.','{\"bookingId\":\"10\"}','booking',0,'2026-05-25 17:44:32','2026-05-25 17:44:32','2026-05-25 17:44:32'),(15,1,NULL,'Booking Placed','Your booking for Classic Haircut (BYM-202605-725274) has been placed.','{\"bookingId\":\"11\"}','booking',0,'2026-05-25 17:47:11','2026-05-25 17:47:11','2026-05-25 17:47:11'),(16,1,NULL,'Booking Cancelled','Your booking BYM-202605-725274 has been cancelled.','{\"bookingId\":\"11\"}','booking',0,'2026-05-25 17:47:11','2026-05-25 17:47:11','2026-05-25 17:47:11'),(17,1,NULL,'Booking Placed','Your booking for Deep Conditioning Hair Spa (BYM-202605-993237) has been placed.','{\"bookingId\":\"14\"}','booking',0,'2026-05-26 12:11:16','2026-05-26 12:11:16','2026-05-26 12:11:16'),(18,1,NULL,'Booking Placed','Your booking for Keratin Hair Spa (BYM-202605-229921) has been placed.','{\"bookingId\":\"12\"}','booking',0,'2026-05-26 12:11:16','2026-05-26 12:11:16','2026-05-26 12:11:16'),(19,1,NULL,'Booking Placed','Your booking for Scalp Treatment (BYM-202605-380806) has been placed.','{\"bookingId\":\"13\"}','booking',0,'2026-05-26 12:11:16','2026-05-26 12:11:16','2026-05-26 12:11:16'),(20,1,NULL,'Booking Placed','Your booking for Deep Conditioning Hair Spa (BYM-202605-957384) has been placed.','{\"bookingId\":\"15\"}','booking',0,'2026-05-26 12:52:29','2026-05-26 12:52:29','2026-05-26 12:52:29'),(21,1,NULL,'Booking Placed','Your booking for Deep Conditioning Hair Spa (BYM-202605-449710) has been placed.','{\"bookingId\":\"16\"}','booking',0,'2026-05-26 12:52:29','2026-05-26 12:52:29','2026-05-26 12:52:29'),(22,1,NULL,'Booking Placed','Your booking for Deep Conditioning Hair Spa (BYM-202605-654922) has been placed.','{\"bookingId\":\"17\"}','booking',0,'2026-05-26 12:52:29','2026-05-26 12:52:29','2026-05-26 12:52:29'),(23,1,NULL,'Booking Placed','Your booking for Deep Conditioning Hair Spa (BYM-202605-850658) has been placed.','{\"bookingId\":\"19\"}','booking',0,'2026-05-26 12:52:29','2026-05-26 12:52:29','2026-05-26 12:52:29'),(24,1,NULL,'Booking Placed','Your booking for Deep Conditioning Hair Spa (BYM-202605-566848) has been placed.','{\"bookingId\":\"18\"}','booking',0,'2026-05-26 12:52:29','2026-05-26 12:52:29','2026-05-26 12:52:29'),(25,1,NULL,'Booking Placed','Your booking for Deep Conditioning Hair Spa (BYM-202605-806946) has been placed.','{\"bookingId\":\"20\"}','booking',0,'2026-05-26 12:52:29','2026-05-26 12:52:29','2026-05-26 12:52:29'),(26,1,NULL,'Booking Placed','Your booking for Deep Conditioning Hair Spa (BYM-202605-116616) has been placed.','{\"bookingId\":\"21\"}','booking',0,'2026-05-26 12:52:29','2026-05-26 12:52:29','2026-05-26 12:52:29'),(27,1,NULL,'Booking Placed','Your booking for Deep Conditioning Hair Spa (BYM-202605-294548) has been placed.','{\"bookingId\":\"22\"}','booking',0,'2026-05-26 12:52:29','2026-05-26 12:52:29','2026-05-26 12:52:29'),(28,1,NULL,'Booking Placed','Your booking for Deep Conditioning Hair Spa (BYM-202605-361079) has been placed.','{\"bookingId\":\"23\"}','booking',0,'2026-05-26 12:52:29','2026-05-26 12:52:29','2026-05-26 12:52:29'),(29,1,NULL,'Booking Placed','Your booking for Deep Conditioning Hair Spa (BYM-202605-169338) has been placed.','{\"bookingId\":\"24\"}','booking',0,'2026-05-26 12:52:29','2026-05-26 12:52:29','2026-05-26 12:52:29'),(30,1,NULL,'Booking Placed','Your booking for Deep Conditioning Hair Spa (BYM-202605-672416) has been placed.','{\"bookingId\":\"25\"}','booking',0,'2026-05-26 12:52:29','2026-05-26 12:52:29','2026-05-26 12:52:29'),(31,1,NULL,'Booking Placed','Your booking for Deep Conditioning Hair Spa (BYM-202605-569372) has been placed.','{\"bookingId\":\"26\"}','booking',0,'2026-05-26 12:52:29','2026-05-26 12:52:29','2026-05-26 12:52:29'),(32,1,NULL,'Booking Placed','Your booking for Deep Conditioning Hair Spa (BYM-202605-889317) has been placed.','{\"bookingId\":\"27\"}','booking',0,'2026-05-26 12:52:29','2026-05-26 12:52:29','2026-05-26 12:52:29'),(33,1,NULL,'Booking Placed','Your booking for Deep Conditioning Hair Spa (BYM-202605-294569) has been placed.','{\"bookingId\":\"28\"}','booking',0,'2026-05-26 12:52:29','2026-05-26 12:52:29','2026-05-26 12:52:29'),(34,1,NULL,'Booking Placed','Your booking for Deep Conditioning Hair Spa (BYM-202605-169296) has been placed.','{\"bookingId\":\"29\"}','booking',0,'2026-05-26 12:52:29','2026-05-26 12:52:29','2026-05-26 12:52:29'),(35,1,NULL,'Booking Placed','Your booking for Deep Conditioning Hair Spa (BYM-202605-998573) has been placed.','{\"bookingId\":\"30\"}','booking',0,'2026-05-26 12:52:29','2026-05-26 12:52:29','2026-05-26 12:52:29'),(36,1,NULL,'Booking Placed','Your booking for Deep Conditioning Hair Spa (BYM-202605-855163) has been placed.','{\"bookingId\":\"31\"}','booking',0,'2026-05-26 12:52:29','2026-05-26 12:52:29','2026-05-26 12:52:29'),(37,1,NULL,'Booking Placed','Your booking for Deep Conditioning Hair Spa (BYM-202605-100548) has been placed.','{\"bookingId\":\"32\"}','booking',0,'2026-05-26 12:52:29','2026-05-26 12:52:29','2026-05-26 12:52:29'),(38,1,NULL,'Booking Placed','Your booking for Deep Conditioning Hair Spa (BYM-202605-907985) has been placed.','{\"bookingId\":\"33\"}','booking',0,'2026-05-26 12:52:29','2026-05-26 12:52:29','2026-05-26 12:52:29'),(39,1,NULL,'Booking Placed','Your booking for Deep Conditioning Hair Spa (BYM-202605-868583) has been placed.','{\"bookingId\":\"34\"}','booking',0,'2026-05-26 12:52:29','2026-05-26 12:52:29','2026-05-26 12:52:29'),(40,1,NULL,'Booking Placed','Your booking for Deep Conditioning Hair Spa (BYM-202605-160158) has been placed.','{\"bookingId\":\"35\"}','booking',0,'2026-05-26 12:52:29','2026-05-26 12:52:29','2026-05-26 12:52:29'),(41,1,NULL,'Booking Placed','Your booking for Deep Conditioning Hair Spa (BYM-202605-956405) has been placed.','{\"bookingId\":\"36\"}','booking',0,'2026-05-26 12:52:29','2026-05-26 12:52:29','2026-05-26 12:52:29'),(42,1,NULL,'Booking Placed','Your booking for Deep Conditioning Hair Spa (BYM-202605-401585) has been placed.','{\"bookingId\":\"37\"}','booking',0,'2026-05-26 12:52:29','2026-05-26 12:52:29','2026-05-26 12:52:29'),(43,1,NULL,'Booking Placed','Your booking for Deep Conditioning Hair Spa (BYM-202605-883775) has been placed.','{\"bookingId\":\"38\"}','booking',0,'2026-05-26 12:52:29','2026-05-26 12:52:29','2026-05-26 12:52:29'),(44,1,NULL,'Booking Placed','Your booking for Deep Conditioning Hair Spa (BYM-202605-328740) has been placed.','{\"bookingId\":\"39\"}','booking',0,'2026-05-26 12:52:29','2026-05-26 12:52:29','2026-05-26 12:52:29'),(45,1,NULL,'Booking Placed','Your booking for Deep Conditioning Hair Spa (BYM-202605-751742) has been placed.','{\"bookingId\":\"40\"}','booking',0,'2026-05-26 12:52:29','2026-05-26 12:52:29','2026-05-26 12:52:29'),(46,1,NULL,'Booking Placed','Your booking for Deep Conditioning Hair Spa (BYM-202605-467927) has been placed.','{\"bookingId\":\"41\"}','booking',0,'2026-05-26 13:09:51','2026-05-26 13:09:51','2026-05-26 13:09:51'),(47,1,NULL,'Booking Placed','Your booking for Deep Cleansing Facial (BYM-202605-610984) has been placed.','{\"bookingId\":\"42\"}','booking',0,'2026-05-26 13:09:51','2026-05-26 13:09:51','2026-05-26 13:09:51'),(48,1,NULL,'Booking Placed','Your booking for Deep Conditioning Hair Spa (BYM-202605-350123) has been placed.','{\"bookingId\":\"43\"}','booking',0,'2026-05-26 13:09:51','2026-05-26 13:09:51','2026-05-26 13:09:51'),(49,1,NULL,'Booking Placed','Your booking for Classic Haircut (BYM-202605-435960) has been placed.','{\"bookingId\":\"44\"}','booking',0,'2026-05-26 13:09:51','2026-05-26 13:09:51','2026-05-26 13:09:51'),(50,1,NULL,'Booking Placed','Your booking for Party Makeup (BYM-202605-209509) has been placed.','{\"bookingId\":\"45\"}','booking',0,'2026-05-26 13:09:51','2026-05-26 13:09:51','2026-05-26 13:09:51'),(51,1,NULL,'Booking Placed','Your booking for HD Airbrush Makeup (BYM-202605-998342) has been placed.','{\"bookingId\":\"46\"}','booking',0,'2026-05-26 13:09:51','2026-05-26 13:09:51','2026-05-26 13:09:51'),(52,1,NULL,'Booking Placed','Your booking for Natural Everyday Makeup (BYM-202605-931574) has been placed.','{\"bookingId\":\"47\"}','booking',0,'2026-05-26 13:09:51','2026-05-26 13:09:51','2026-05-26 13:09:51'),(53,1,NULL,'Booking Placed','Your booking for Keratin Hair Spa (BYM-202605-529784) has been placed.','{\"bookingId\":\"48\"}','booking',0,'2026-05-26 13:11:46','2026-05-26 13:11:46','2026-05-26 13:11:46'),(54,1,NULL,'Booking Placed','Your booking for Deep Conditioning Hair Spa (BYM-202605-892004) has been placed.','{\"bookingId\":\"49\"}','booking',0,'2026-05-26 13:11:46','2026-05-26 13:11:46','2026-05-26 13:11:46'),(55,1,NULL,'Booking Placed','Your booking for Natural Everyday Makeup (BYM-202605-701182) has been placed.','{\"bookingId\":\"51\"}','booking',0,'2026-05-26 13:12:07','2026-05-26 13:12:07','2026-05-26 13:12:07'),(56,1,NULL,'Booking Placed','Your booking for Party Makeup (BYM-202605-421607) has been placed.','{\"bookingId\":\"50\"}','booking',0,'2026-05-26 13:12:07','2026-05-26 13:12:07','2026-05-26 13:12:07'),(57,1,NULL,'Booking Placed','Your booking for HD Airbrush Makeup (BYM-202605-668354) has been placed.','{\"bookingId\":\"52\"}','booking',0,'2026-05-26 13:12:07','2026-05-26 13:12:07','2026-05-26 13:12:07'),(58,1,NULL,'Booking Placed','Your booking for 3 services (BYM-202605-818585) has been placed.','{\"bookingId\":\"53\"}','booking',0,'2026-05-26 13:16:44','2026-05-26 13:16:44','2026-05-26 13:16:44'),(59,1,NULL,'Booking Placed','Your booking for 5 services (BYM-202605-223068) has been placed.','{\"bookingId\":\"54\"}','booking',0,'2026-05-26 13:17:27','2026-05-26 13:17:27','2026-05-26 13:17:27'),(60,1,NULL,'Booking Placed','Your booking for 2 services (BYM-202605-193042) has been placed.','{\"bookingId\":\"55\"}','booking',0,'2026-05-26 14:35:57','2026-05-26 14:35:57','2026-05-26 14:35:57'),(61,1,NULL,'Booking Placed','Your booking for 2 services (BYM-202605-501585) has been placed.','{\"bookingId\":\"56\"}','booking',0,'2026-05-26 14:42:05','2026-05-26 14:42:05','2026-05-26 14:42:05'),(62,1,NULL,'Booking Placed','Your booking for 2 services (BYM-202606-519633) has been placed.','{\"bookingId\":\"57\"}','booking',0,'2026-06-01 04:32:05','2026-06-01 04:32:05','2026-06-01 04:32:05'),(63,NULL,NULL,'Weekend Special Offer! 🎉','Get {{discount}}% off on all beauty services this weekend. Book now!','{}','promo',0,'2026-06-01 06:06:45','2026-06-01 06:06:45','2026-06-01 06:06:45'),(64,NULL,NULL,'Weekend Special Offer! 🎉','Get {{discount}}% off on all beauty services this weekend. Book now!','{}','promo',0,'2026-06-01 06:06:53','2026-06-01 06:06:53','2026-06-01 06:06:53'),(65,NULL,4,'Weekend Special Offer! 🎉','Get {{discount}}% off on all beauty services this weekend. Book now!','{}','promo',0,'2026-06-01 17:36:44','2026-06-01 17:36:44','2026-06-01 17:36:44'),(66,NULL,NULL,'Weekend Special Offer! 🎉','Get {{discount}}% off on all beauty services this weekend. Book now!','{}','promo',0,'2026-06-01 17:36:45','2026-06-01 17:36:45','2026-06-01 17:36:45'),(67,1,NULL,'Booking Placed','Your booking for 2 services (BYM-202606-113513) has been placed.','{\"bookingId\":\"58\"}','booking',0,'2026-06-01 17:37:50','2026-06-01 17:37:50','2026-06-01 17:37:50'),(70,1,NULL,'Booking Cancelled','Your booking BYM-202606-113513 has been cancelled.','{\"bookingId\":\"58\"}','booking',0,'2026-06-01 17:46:37','2026-06-01 17:46:37','2026-06-01 17:46:37'),(71,1,NULL,'Booking Placed','Your booking for 2 services (BYM-202606-220789) has been placed.','{\"bookingId\":\"60\"}','booking',0,'2026-06-01 17:53:30','2026-06-01 17:53:30','2026-06-01 17:53:30'),(72,1,NULL,'Partner Assigned','Your booking BYM-202606-220789 has been accepted by a partner.','{\"bookingId\":\"60\"}','booking',0,'2026-06-01 18:01:18','2026-06-01 18:01:18','2026-06-01 18:01:18'),(73,1,NULL,'Partner Assigned','Your booking BYM-202605-501585 has been accepted by a partner.','{\"bookingId\":\"56\"}','booking',0,'2026-06-01 18:03:40','2026-06-01 18:03:40','2026-06-01 18:03:40'),(74,1,NULL,'Booking Placed','Your booking for 2 services (BYM-202606-610523) has been placed.','{\"bookingId\":\"61\"}','booking',0,'2026-06-04 05:53:36','2026-06-04 05:53:36','2026-06-04 05:53:36'),(75,1,NULL,'Weekend Special Offer! 🎉','Get {{discount}}% off on all beauty services this weekend. Book now!','{}','promo',0,'2026-06-04 06:00:30','2026-06-04 06:00:30','2026-06-04 06:00:30'),(76,NULL,4,'Weekend Special Offer! 🎉','Get {{discount}}% off on all beauty services this weekend. Book now!','{}','promo',0,'2026-06-04 06:00:30','2026-06-04 06:00:30','2026-06-04 06:00:30'),(77,NULL,NULL,'Weekend Special Offer! 🎉','Get {{discount}}% off on all beauty services this weekend. Book now!','{}','promo',0,'2026-06-04 06:00:30','2026-06-04 06:00:30','2026-06-04 06:00:30'),(78,1,NULL,'Partner Assigned','Your booking BYM-202605-193042 has been accepted by a partner.','{\"bookingId\":\"55\"}','booking',0,'2026-06-04 09:59:00','2026-06-04 09:59:00','2026-06-04 09:59:00'),(79,1,NULL,'Services Added','Your partner added extra services to booking BYM-202605-193042. New total: ₹352.82','{\"bookingId\":\"55\"}','booking',0,'2026-06-04 10:39:40','2026-06-04 10:39:40','2026-06-04 10:39:40'),(80,1,NULL,'Services Added','Your partner added extra services to booking BYM-202605-193042. New total: ₹352.82','{\"bookingId\":\"55\"}','booking',0,'2026-06-04 10:39:52','2026-06-04 10:39:52','2026-06-04 10:39:52'),(81,1,NULL,'Services Added','Your partner added extra services to booking BYM-202605-193042. New total: ₹5306.46','{\"bookingId\":\"55\"}','booking',0,'2026-06-04 10:43:40','2026-06-04 10:43:40','2026-06-04 10:43:40'),(82,1,NULL,'Service Update Request','Your partner has updated services for booking BYM-202605-193042. New total: ₹7,428.1. Please approve or reject the changes.','{\"bookingId\":\"55\",\"type\":\"service_update\"}','booking',0,'2026-06-04 11:01:17','2026-06-04 11:01:17','2026-06-04 11:01:17'),(83,1,NULL,'Partner Assigned','Alex has accepted services from your booking BYM-202606-610523.','{\"bookingId\":\"61\"}','booking',0,'2026-06-04 11:40:16','2026-06-04 11:40:16','2026-06-04 11:40:16'),(84,1,NULL,'Partner Assigned','Your booking BYM-202605-223068 has been accepted by a partner.','{\"bookingId\":\"54\"}','booking',0,'2026-06-04 11:56:43','2026-06-04 11:56:43','2026-06-04 11:56:43'),(85,1,NULL,'Service Update Request','Your partner has updated services for booking BYM-202605-223068. New total: ₹8,487.74. Please approve or reject the changes.','{\"bookingId\":\"54\",\"type\":\"service_update\"}','booking',0,'2026-06-04 11:56:59','2026-06-04 11:56:59','2026-06-04 11:56:59'),(86,1,NULL,'Service Update Request','Your partner has updated services for booking BYM-202605-223068. New total: ₹8,487.74. Please approve or reject the changes.','{\"bookingId\":\"54\",\"type\":\"service_update\"}','booking',0,'2026-06-04 11:57:27','2026-06-04 11:57:27','2026-06-04 11:57:27'),(87,1,NULL,'Booking Placed','Your booking for 4 services (BYM-202606-838011) has been placed.','{\"bookingId\":\"62\"}','booking',0,'2026-06-04 12:41:44','2026-06-04 12:41:44','2026-06-04 12:41:44'),(88,1,NULL,'Partner Assigned','Alex has accepted services from your booking BYM-202606-838011.','{\"bookingId\":\"62\"}','booking',0,'2026-06-04 12:43:49','2026-06-04 12:43:49','2026-06-04 12:43:49'),(89,1,NULL,'Service Update Request','Your partner has updated services for booking BYM-202606-838011. New total: ₹8,485.38. Please approve or reject the changes.','{\"bookingId\":\"62\",\"type\":\"service_update\"}','booking',0,'2026-06-04 12:49:33','2026-06-04 12:49:33','2026-06-04 12:49:33'),(90,1,NULL,'Booking Placed','Your booking for 2 services (BYM-202606-202033) has been placed.','{\"bookingId\":\"64\"}','booking',0,'2026-06-08 11:32:48','2026-06-08 11:32:48','2026-06-08 11:32:48'),(91,1,NULL,'Booking Updated','The services on your booking BYM-202606-202033 have been updated by support. New total: ₹21832.36.','{\"bookingId\":\"64\"}','booking',0,'2026-06-08 11:36:37','2026-06-08 11:36:37','2026-06-08 11:36:37'),(92,1,NULL,'Booking Updated','The services on your booking BYM-202606-202033 have been updated by support. New total: ₹12393.54.','{\"bookingId\":\"64\"}','booking',0,'2026-06-08 11:37:16','2026-06-08 11:37:16','2026-06-08 11:37:16'),(93,1,NULL,'Booking Updated','The services on your booking BYM-202606-202033 have been updated by support. New total: ₹8854.72.','{\"bookingId\":\"64\"}','booking',0,'2026-06-08 11:37:17','2026-06-08 11:37:17','2026-06-08 11:37:17'),(94,1,NULL,'Booking Updated','The services on your booking BYM-202606-202033 have been updated by support. New total: ₹11566.36.','{\"bookingId\":\"64\"}','booking',0,'2026-06-14 14:34:20','2026-06-14 14:34:20','2026-06-14 14:34:20'),(95,1,NULL,'Booking Updated','The services on your booking BYM-202606-202033 have been updated by support. New total: ₹16280.46.','{\"bookingId\":\"64\"}','booking',0,'2026-06-14 14:40:35','2026-06-14 14:40:35','2026-06-14 14:40:35'),(96,1,NULL,'Booking Updated','The services on your booking BYM-202606-202033 have been updated by support. New total: ₹11566.36.','{\"bookingId\":\"64\"}','booking',0,'2026-06-17 00:43:53','2026-06-17 00:43:53','2026-06-17 00:43:53'),(97,1,NULL,'Booking Updated','The services on your booking BYM-202606-202033 have been updated by support. New total: ₹11566.36.','{\"bookingId\":\"64\"}','booking',0,'2026-06-17 00:43:54','2026-06-17 00:43:54','2026-06-17 00:43:54'),(98,1,NULL,'Booking Updated','The services on your booking BYM-202606-202033 have been updated by support. New total: ₹10623.54.','{\"bookingId\":\"64\"}','booking',0,'2026-06-17 00:43:56','2026-06-17 00:43:56','2026-06-17 00:43:56'),(99,1,NULL,'Booking Rescheduled','Your booking BYM-202606-202033 has been rescheduled to 17/6/2026, 9:16:00 am by support.','{\"bookingId\":\"64\"}','booking',0,'2026-06-17 00:47:13','2026-06-17 00:47:13','2026-06-17 00:47:13'),(100,1,NULL,'Booking Updated','The services on your booking BYM-202606-202033 have been updated by support. New total: ₹9680.72.','{\"bookingId\":\"64\"}','booking',0,'2026-06-17 00:48:03','2026-06-17 00:48:03','2026-06-17 00:48:03'),(101,1,NULL,'Booking Updated','The services on your booking BYM-202606-202033 have been updated by support. New total: ₹11449.54.','{\"bookingId\":\"64\"}','booking',0,'2026-06-17 00:52:53','2026-06-17 00:52:53','2026-06-17 00:52:53'),(102,1,NULL,'Booking Updated','The services on your booking BYM-202606-202033 have been updated by support. New total: ₹13218.36.','{\"bookingId\":\"64\"}','booking',0,'2026-06-17 00:52:55','2026-06-17 00:52:55','2026-06-17 00:52:55'),(103,1,NULL,'Booking Updated','The services on your booking BYM-202606-202033 have been updated by support. New total: ₹14987.18.','{\"bookingId\":\"64\"}','booking',0,'2026-06-17 00:59:05','2026-06-17 00:59:05','2026-06-17 00:59:05'),(104,1,NULL,'Booking Updated','The services on your booking BYM-202606-202033 have been updated by support. New total: ₹16756.','{\"bookingId\":\"64\"}','booking',0,'2026-06-17 00:59:07','2026-06-17 00:59:07','2026-06-17 00:59:07'),(105,1,NULL,'Booking Updated','The services on your booking BYM-202606-202033 have been updated by support. New total: ₹18524.82.','{\"bookingId\":\"64\"}','booking',0,'2026-06-17 01:01:59','2026-06-17 01:01:59','2026-06-17 01:01:59'),(106,1,NULL,'Booking Updated','The services on your booking BYM-202606-202033 have been updated by support. New total: ₹18877.64.','{\"bookingId\":\"64\"}','booking',0,'2026-06-17 01:02:34','2026-06-17 01:02:34','2026-06-17 01:02:34'),(107,1,NULL,'Booking Updated','The services on your booking BYM-202606-202033 have been updated by support. New total: ₹19230.46.','{\"bookingId\":\"64\"}','booking',0,'2026-06-17 01:02:39','2026-06-17 01:02:39','2026-06-17 01:02:39'),(108,1,NULL,'Booking Updated','The services on your booking BYM-202606-202033 have been updated by support. New total: ₹22769.28.','{\"bookingId\":\"64\"}','booking',0,'2026-06-17 01:02:45','2026-06-17 01:02:45','2026-06-17 01:02:45'),(109,1,NULL,'Partner Assigned','Your booking BYM-202606-202033 has been accepted by a partner.','{\"bookingId\":\"64\"}','booking',0,'2026-06-17 03:52:47','2026-06-17 03:52:47','2026-06-17 03:52:47'),(110,1,NULL,'Service Update Request','Your partner has updated services for booking BYM-202606-202033. New total: ₹55,324.3. Please approve or reject the changes.','{\"bookingId\":\"64\",\"type\":\"service_update\"}','booking',0,'2026-06-17 04:01:44','2026-06-17 04:01:44','2026-06-17 04:01:44'),(111,1,NULL,'Service Update Request','Your partner has updated services for booking BYM-202606-202033. New total: ₹81,279.58. Please approve or reject the changes.','{\"bookingId\":\"64\",\"type\":\"service_update\"}','booking',0,'2026-06-17 04:02:25','2026-06-17 04:02:25','2026-06-17 04:02:25'),(112,1,NULL,'Booking Placed','Your booking for 2 services (BYM-202606-171394) has been placed.','{\"bookingId\":\"65\"}','booking',0,'2026-06-17 05:52:44','2026-06-17 05:52:44','2026-06-17 05:52:44'),(113,1,NULL,'Partner Assigned','Your booking BYM-202606-171394 has been accepted by a partner.','{\"bookingId\":\"65\"}','booking',0,'2026-06-17 05:54:04','2026-06-17 05:54:04','2026-06-17 05:54:04'),(114,1,NULL,'Booking Rescheduled','Your booking BYM-202606-171394 has been rescheduled to 18/6/2026, 1:22:00 pm.','{\"bookingId\":\"65\"}','booking',0,'2026-06-17 05:54:20','2026-06-17 05:54:20','2026-06-17 05:54:20'),(115,1,NULL,'Booking Placed','Your booking for 2 services (BYM-202606-489791) has been placed.','{\"bookingId\":\"66\"}','booking',0,'2026-06-17 05:55:21','2026-06-17 05:55:21','2026-06-17 05:55:21'),(116,1,NULL,'Partner Assigned','Your booking BYM-202606-489791 has been accepted by a partner.','{\"bookingId\":\"66\"}','booking',0,'2026-06-17 05:55:37','2026-06-17 05:55:37','2026-06-17 05:55:37'),(117,1,NULL,'Booking Placed','Your booking for 2 services (BYM-202606-777338) has been placed.','{\"bookingId\":\"67\"}','booking',0,'2026-06-17 06:29:08','2026-06-17 06:29:08','2026-06-17 06:29:08'),(118,1,NULL,'Partner Assigned','Your booking BYM-202606-777338 has been accepted by a partner.','{\"bookingId\":\"67\"}','booking',0,'2026-06-17 06:30:37','2026-06-17 06:30:37','2026-06-17 06:30:37'),(119,1,NULL,'Booking Placed','Your booking for HD Airbrush Makeup (BYM-202606-253933) has been placed.','{\"bookingId\":\"68\"}','booking',0,'2026-06-17 06:33:40','2026-06-17 06:33:40','2026-06-17 06:33:40'),(120,1,NULL,'Partner Assigned','Your booking BYM-202606-253933 has been accepted by a partner.','{\"bookingId\":\"68\"}','booking',0,'2026-06-17 06:34:02','2026-06-17 06:34:02','2026-06-17 06:34:02'),(121,1,NULL,'Booking Placed','Your booking for 2 services (BYM-202606-560625) has been placed.','{\"bookingId\":\"69\"}','booking',0,'2026-06-17 07:09:44','2026-06-17 07:09:44','2026-06-17 07:09:44'),(122,1,NULL,'Partner Assigned','Your booking BYM-202606-560625 has been accepted by a partner.','{\"bookingId\":\"69\"}','booking',0,'2026-06-17 07:17:45','2026-06-17 07:17:45','2026-06-17 07:17:45'),(123,1,NULL,'Service Update Request','Your partner has updated services for booking BYM-202606-560625. New total: ₹8,606.92. Please approve or reject the changes.','{\"bookingId\":\"69\",\"type\":\"service_update\"}','booking',0,'2026-06-17 07:18:22','2026-06-17 07:18:22','2026-06-17 07:18:22'),(124,1,NULL,'Booking Placed','Your booking for 4 services (BYM-202606-811455) has been placed.','{\"bookingId\":\"70\"}','booking',0,'2026-06-17 07:20:34','2026-06-17 07:20:34','2026-06-17 07:20:34'),(125,1,NULL,'Booking Rescheduled','Your booking BYM-202606-811455 has been rescheduled to 18/6/2026, 2:50:00 pm.','{\"bookingId\":\"70\"}','booking',0,'2026-06-17 07:20:54','2026-06-17 07:20:54','2026-06-17 07:20:54'),(126,1,NULL,'Partner Assigned','Your booking BYM-202606-811455 has been accepted by a partner.','{\"bookingId\":\"70\"}','booking',0,'2026-06-17 07:21:10','2026-06-17 07:21:10','2026-06-17 07:21:10'),(127,1,NULL,'Partner Arrived','Your service partner has arrived at your location for booking BYM-202606-811455.','{\"bookingId\":\"70\"}','booking',0,'2026-06-17 07:21:38','2026-06-17 07:21:38','2026-06-17 07:21:38'),(128,1,NULL,'Booking Rescheduled','Your booking BYM-202606-811455 has been rescheduled to 17/6/2026, 5:53:53 pm.','{\"bookingId\":\"70\"}','booking',0,'2026-06-17 07:23:54','2026-06-17 07:23:54','2026-06-17 07:23:54'),(129,1,NULL,'Booking Rescheduled','Your booking BYM-202606-811455 has been rescheduled to 17/6/2026, 6:57:05 pm.','{\"bookingId\":\"70\"}','booking',0,'2026-06-17 07:27:06','2026-06-17 07:27:06','2026-06-17 07:27:06'),(130,1,NULL,'Booking Cancelled','Your booking BYM-202606-519633 has been cancelled.','{\"bookingId\":\"57\"}','booking',0,'2026-06-17 07:27:17','2026-06-17 07:27:17','2026-06-17 07:27:17'),(131,1,NULL,'Booking Placed','Your booking for 2 services (BYM-202606-559331) has been placed.','{\"bookingId\":\"71\"}','booking',0,'2026-06-17 07:37:34','2026-06-17 07:37:34','2026-06-17 07:37:34'),(132,1,NULL,'Partner Assigned','Alex has accepted services from your booking BYM-202606-559331.','{\"bookingId\":\"71\"}','booking',0,'2026-06-17 07:37:47','2026-06-17 07:37:47','2026-06-17 07:37:47'),(133,1,NULL,'Booking Rescheduled','Your booking BYM-202606-559331 has been rescheduled to 17/6/2026, 9:08:06 pm.','{\"bookingId\":\"71\"}','booking',0,'2026-06-17 07:38:07','2026-06-17 07:38:07','2026-06-17 07:38:07'),(134,1,NULL,'Partner Assigned','Alex has accepted services from your booking BYM-202606-811455.','{\"bookingId\":\"70\"}','booking',0,'2026-06-17 07:39:48','2026-06-17 07:39:48','2026-06-17 07:39:48'),(135,1,NULL,'Booking Rescheduled','Your booking BYM-202606-811455 has been rescheduled to 19/6/2026, 6:57:00 pm.','{\"bookingId\":\"70\"}','booking',0,'2026-06-17 07:40:39','2026-06-17 07:40:39','2026-06-17 07:40:39'),(136,1,NULL,'Service Update Request','Your partner has updated services for booking BYM-202606-811455. New total: ₹9,431.74. Please approve or reject the changes.','{\"bookingId\":\"70\",\"type\":\"service_update\"}','booking',0,'2026-06-17 07:41:15','2026-06-17 07:41:15','2026-06-17 07:41:15'),(137,1,NULL,'Booking Updated','The services on your booking BYM-202606-811455 have been updated by support. New total: ₹12025.38.','{\"bookingId\":\"70\"}','booking',0,'2026-06-17 07:42:36','2026-06-17 07:42:36','2026-06-17 07:42:36'),(138,1,NULL,'Booking Placed','Your booking for 3 services (BYM-202606-396498) has been placed.','{\"bookingId\":\"72\"}','booking',0,'2026-06-17 11:04:12','2026-06-17 11:04:12','2026-06-17 11:04:12'),(139,1,NULL,'Booking Placed','Your booking for Classic Haircut (BYM-202606-146949) has been placed.','{\"bookingId\":\"73\"}','booking',0,'2026-06-17 11:10:42','2026-06-17 11:10:42','2026-06-17 11:10:42'),(140,1,NULL,'Booking Placed','Your booking for 2 services (BYM-202606-803855) has been placed.','{\"bookingId\":\"74\"}','booking',0,'2026-06-17 11:12:30','2026-06-17 11:12:30','2026-06-17 11:12:30'),(141,1,NULL,'Booking Placed','Your booking for 2 services (BYM-202606-986014) has been placed.','{\"bookingId\":\"75\"}','booking',0,'2026-06-17 11:13:22','2026-06-17 11:13:22','2026-06-17 11:13:22'),(142,1,NULL,'Booking Placed','Your booking for 2 services (BYM-202606-139299) has been placed.','{\"bookingId\":\"76\"}','booking',0,'2026-06-17 11:28:49','2026-06-17 11:28:49','2026-06-17 11:28:49'),(143,1,NULL,'Booking Placed','Your booking for 3 services (BYM-202606-661655) has been placed.','{\"bookingId\":\"77\"}','booking',0,'2026-06-17 11:43:05','2026-06-17 11:43:05','2026-06-17 11:43:05'),(144,1,NULL,'Partner Assigned','Alex has accepted services from your booking BYM-202606-661655.','{\"bookingId\":\"77\"}','booking',0,'2026-06-17 11:48:28','2026-06-17 11:48:28','2026-06-17 11:48:28'),(145,1,NULL,'Partner Arrived','Your service partner has arrived at your location for booking BYM-202606-661655.','{\"bookingId\":\"77\"}','booking',0,'2026-06-17 11:48:39','2026-06-17 11:48:39','2026-06-17 11:48:39'),(146,1,NULL,'Service Update Request','Your partner has updated services for booking BYM-202606-661655. New total: ₹3,699.77. Please approve or reject the changes.','{\"bookingId\":\"77\",\"type\":\"service_update\"}','booking',0,'2026-06-17 11:48:59','2026-06-17 11:48:59','2026-06-17 11:48:59'),(147,1,NULL,'Service Update Request','Your partner has updated services for booking BYM-202606-661655. New total: ₹1,932.13. Please approve or reject the changes.','{\"bookingId\":\"77\",\"type\":\"service_update\"}','booking',0,'2026-06-17 12:00:08','2026-06-17 12:00:08','2026-06-17 12:00:08'),(148,1,NULL,'Partner Assigned','Alex has accepted services from your booking BYM-202606-139299.','{\"bookingId\":\"76\"}','booking',0,'2026-06-17 12:02:44','2026-06-17 12:02:44','2026-06-17 12:02:44'),(149,1,NULL,'Partner Arrived','Your service partner has arrived at your location for booking BYM-202606-139299.','{\"bookingId\":\"76\"}','booking',0,'2026-06-17 12:02:51','2026-06-17 12:02:51','2026-06-17 12:02:51'),(150,1,NULL,'Service Update Request','Your partner has updated services for booking BYM-202606-139299. New total: ₹8,844.1. Please approve or reject the changes.','{\"bookingId\":\"76\",\"type\":\"service_update\"}','booking',0,'2026-06-17 12:03:01','2026-06-17 12:03:01','2026-06-17 12:03:01'),(151,1,NULL,'Booking Updated','The services on your booking BYM-202606-139299 have been updated by support. New total: ₹12381.74.','{\"bookingId\":\"76\"}','booking',0,'2026-06-17 12:12:33','2026-06-17 12:12:33','2026-06-17 12:12:33'),(152,1,NULL,'Booking Placed','Your booking for Classic Haircut (BYM-202606-745702) has been placed.','{\"bookingId\":\"78\"}','booking',0,'2026-06-17 13:26:05','2026-06-17 13:26:05','2026-06-17 13:26:05'),(153,1,NULL,'Partner Assigned','Alex has accepted services from your booking BYM-202606-986014.','{\"bookingId\":\"75\"}','booking',0,'2026-06-17 13:30:43','2026-06-17 13:30:43','2026-06-17 13:30:43'),(154,1,NULL,'Partner Arrived','Your service partner has arrived at your location for booking BYM-202606-986014.','{\"bookingId\":\"75\"}','booking',0,'2026-06-17 13:31:00','2026-06-17 13:31:00','2026-06-17 13:31:00');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `offers`
--

DROP TABLE IF EXISTS `offers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `offers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `triggerType` enum('min_spend','specific_services','min_count','category') NOT NULL,
  `triggerValue` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`triggerValue`)),
  `freeServiceId` int(11) NOT NULL,
  `validFrom` datetime NOT NULL,
  `validTill` datetime NOT NULL,
  `isActive` tinyint(1) DEFAULT 1,
  `cityId` int(11) DEFAULT NULL,
  `maxUses` int(11) DEFAULT NULL,
  `usedCount` int(11) DEFAULT 0,
  `createdBy` int(11) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `image` text DEFAULT NULL,
  `adminPercent` decimal(5,2) NOT NULL DEFAULT 20.00,
  `partnerPercent` decimal(5,2) NOT NULL DEFAULT 80.00,
  `gstPercent` decimal(5,2) NOT NULL DEFAULT 5.00,
  PRIMARY KEY (`id`),
  KEY `freeServiceId` (`freeServiceId`),
  CONSTRAINT `offers_ibfk_1` FOREIGN KEY (`freeServiceId`) REFERENCES `services` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `offers`
--

LOCK TABLES `offers` WRITE;
/*!40000 ALTER TABLE `offers` DISABLE KEYS */;
INSERT INTO `offers` VALUES (2,'Test','Test','specific_services','{\"serviceIds\":[27,21]}',26,'2026-06-04 00:00:00','2026-06-04 00:00:00',1,3,NULL,0,NULL,'2026-06-04 06:41:12','2026-06-04 11:34:38',NULL,20.00,80.00,5.00),(3,'Spend ₹999, Get Underarm Waxing Free','Spend ₹999 or more on a single booking and get a free Underarm Waxing service.','min_spend','{\"amount\":999}',11,'2026-06-16 10:00:45','2026-08-01 10:00:45',1,NULL,300,2,NULL,'2026-06-17 10:00:45','2026-06-17 11:43:05','https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=800&h=420&q=90&fit=crop',20.00,80.00,5.00),(4,'Book a Facial + Haircut, Get Threading Free','Add both Deep Cleansing Facial and Classic Haircut to your booking to get Eyebrow Threading free.','specific_services','{\"serviceIds\":[1,2]}',11,'2026-06-16 10:00:45','2026-08-01 10:00:45',1,NULL,200,1,NULL,'2026-06-17 10:00:45','2026-06-17 11:04:12','https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&h=420&q=90&fit=crop',20.00,80.00,5.00),(5,'Book 3 Services, Get 1 Free','Add any 3 services to your booking and get a 4th service free.','min_count','{\"count\":3}',11,'2026-06-16 10:00:45','2026-08-01 10:00:45',1,NULL,150,0,NULL,'2026-06-17 10:00:45','2026-06-17 10:41:38','https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800&h=420&q=90&fit=crop',20.00,80.00,5.00);
/*!40000 ALTER TABLE `offers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `otps`
--

DROP TABLE IF EXISTS `otps`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `otps` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `phone` varchar(20) NOT NULL,
  `otp` varchar(6) NOT NULL,
  `userType` enum('user','partner') DEFAULT 'user',
  `expiresAt` datetime NOT NULL,
  `attempts` int(11) DEFAULT 0,
  `isUsed` tinyint(1) DEFAULT 0,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=54 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `otps`
--

LOCK TABLES `otps` WRITE;
/*!40000 ALTER TABLE `otps` DISABLE KEYS */;
INSERT INTO `otps` VALUES (1,'7997753587','331162','partner','2026-05-25 07:20:54',0,1,'2026-05-25 07:15:54','2026-05-25 07:19:50'),(2,'7997753587','493154','partner','2026-05-25 07:24:50',1,1,'2026-05-25 07:19:50','2026-05-25 07:24:32'),(3,'7997753587','496439','partner','2026-05-25 07:29:32',0,1,'2026-05-25 07:24:32','2026-05-25 07:30:29'),(4,'7997753587','633436','partner','2026-05-25 07:35:29',0,1,'2026-05-25 07:30:29','2026-06-04 09:38:58'),(5,'9865321452','785686','partner','2026-05-25 07:36:01',0,0,'2026-05-25 07:31:01','2026-05-25 07:31:01'),(6,'9999999999','1234','partner','2026-05-25 07:52:30',1,1,'2026-05-25 07:47:30','2026-05-25 07:47:37'),(7,'7997753587','1234','user','2026-05-25 10:13:18',0,1,'2026-05-25 10:08:18','2026-05-25 10:08:24'),(8,'7997753587','1234','user','2026-05-25 10:57:11',0,1,'2026-05-25 10:52:11','2026-05-25 10:52:14'),(9,'7997753587','1234','user','2026-05-25 17:44:01',0,1,'2026-05-25 17:39:01','2026-05-25 17:39:01'),(11,'7997753587','1234','user','2026-05-25 17:48:44',0,1,'2026-05-25 17:43:44','2026-05-25 17:43:45'),(13,'7997753587','1234','user','2026-05-25 17:49:08',0,1,'2026-05-25 17:44:08','2026-05-25 17:44:08'),(15,'7997753587','1234','user','2026-05-25 17:49:31',0,1,'2026-05-25 17:44:31','2026-05-25 17:44:31'),(18,'7997753587','1234','user','2026-05-25 17:50:56',0,1,'2026-05-25 17:45:57','2026-05-25 17:45:57'),(21,'7997753587','1234','user','2026-05-25 17:52:10',0,1,'2026-05-25 17:47:10','2026-05-25 17:47:10'),(23,'7997753587','1234','user','2026-05-25 17:52:10',0,1,'2026-05-25 17:47:10','2026-05-25 17:47:10'),(25,'7997753587','1234','user','2026-05-26 12:12:54',0,1,'2026-05-26 12:07:54','2026-05-26 12:07:58'),(26,'7997753587','1234','user','2026-05-26 13:19:28',0,1,'2026-05-26 13:14:28','2026-05-26 13:14:31'),(27,'7997753587','1234','user','2026-05-26 14:10:38',0,1,'2026-05-26 14:05:38','2026-05-26 14:05:47'),(28,'7997753587','1234','user','2026-06-01 04:36:30',0,1,'2026-06-01 04:31:30','2026-06-01 04:31:34'),(29,'9494979494','1234','partner','2026-06-01 17:09:20',0,1,'2026-06-01 17:04:20','2026-06-01 17:04:24'),(30,'9876543210','1234','partner','2026-06-01 17:18:53',1,1,'2026-06-01 17:13:53','2026-06-01 17:14:10'),(31,'9876543210','1234','partner','2026-06-01 17:19:10',0,1,'2026-06-01 17:14:10','2026-06-01 17:14:11'),(33,'7997753587','1234','user','2026-06-01 17:42:30',0,1,'2026-06-01 17:37:30','2026-06-01 17:37:38'),(36,'7997753587','1234','user','2026-06-04 05:56:07',0,1,'2026-06-04 05:51:07','2026-06-04 05:51:10'),(37,'7997753587','1234','partner','2026-06-04 09:43:58',0,1,'2026-06-04 09:38:58','2026-06-04 09:39:02'),(38,'9999999999','1234','partner','2026-06-04 09:44:32',0,1,'2026-06-04 09:39:32','2026-06-04 09:39:37'),(39,'7997753587','1234','partner','2026-06-04 09:45:11',1,1,'2026-06-04 09:40:11','2026-06-04 09:40:17'),(41,'7997753587','1234','partner','2026-06-04 12:44:05',0,1,'2026-06-04 12:39:05','2026-06-04 12:39:08'),(42,'7997753587','1234','user','2026-06-08 11:15:24',0,1,'2026-06-08 11:10:24','2026-06-08 11:10:27'),(43,'7997753587','1234','partner','2026-06-17 03:47:41',0,1,'2026-06-17 03:42:41','2026-06-17 03:42:47'),(44,'7997753587','1234','user','2026-06-17 03:59:22',0,1,'2026-06-17 03:54:22','2026-06-17 03:54:48'),(45,'7997753587','1234','user','2026-06-17 05:57:11',0,1,'2026-06-17 05:52:11','2026-06-17 05:52:17'),(47,'7997753587','1234','user','2026-06-17 07:14:08',0,1,'2026-06-17 07:09:08','2026-06-17 07:09:12'),(48,'7997753587','1234','user','2026-06-17 07:22:16',0,1,'2026-06-17 07:17:16','2026-06-17 07:17:21'),(50,'7997753587','1234','user','2026-06-17 11:16:02',0,1,'2026-06-17 11:11:02','2026-06-17 11:11:07'),(51,'7997753587','1234','user','2026-06-17 11:18:07',0,1,'2026-06-17 11:13:07','2026-06-17 11:13:15'),(52,'7997753587','1234','user','2026-06-17 11:33:23',0,1,'2026-06-17 11:28:23','2026-06-17 11:28:26'),(53,'7997753587','1234','user','2026-06-17 11:47:21',0,1,'2026-06-17 11:42:21','2026-06-17 11:42:25');
/*!40000 ALTER TABLE `otps` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `partner_ledger_entries`
--

DROP TABLE IF EXISTS `partner_ledger_entries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `partner_ledger_entries` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `partnerId` int(11) NOT NULL,
  `bookingId` int(11) NOT NULL,
  `bookingCode` varchar(30) DEFAULT NULL,
  `paymentMode` enum('online','cod') NOT NULL,
  `grossShare` decimal(10,2) NOT NULL,
  `commissionPercent` decimal(5,2) NOT NULL,
  `adminCommissionAmount` decimal(10,2) NOT NULL,
  `partnerNetAmount` decimal(10,2) NOT NULL,
  `direction` enum('credit','debit') NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `status` enum('unsettled','settled','voided') DEFAULT 'unsettled',
  `settlementId` int(11) DEFAULT NULL,
  `reversesEntryId` int(11) DEFAULT NULL,
  `voidReason` text DEFAULT NULL,
  `voidedAt` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `partnerId` (`partnerId`),
  KEY `bookingId` (`bookingId`),
  KEY `settlementId` (`settlementId`),
  CONSTRAINT `partner_ledger_entries_ibfk_1` FOREIGN KEY (`partnerId`) REFERENCES `partners` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT `partner_ledger_entries_ibfk_2` FOREIGN KEY (`bookingId`) REFERENCES `bookings` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT `partner_ledger_entries_ibfk_3` FOREIGN KEY (`settlementId`) REFERENCES `partner_settlements` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `partner_ledger_entries`
--

LOCK TABLES `partner_ledger_entries` WRITE;
/*!40000 ALTER TABLE `partner_ledger_entries` DISABLE KEYS */;
INSERT INTO `partner_ledger_entries` VALUES (1,7,65,'BYM-202606-171394','cod',2895.00,20.00,579.00,2316.00,'debit',579.00,'unsettled',NULL,NULL,NULL,NULL,'2026-06-17 06:28:08','2026-06-17 06:28:08'),(2,7,66,'BYM-202606-489791','cod',3498.00,20.00,699.60,2798.40,'debit',699.60,'unsettled',NULL,NULL,NULL,NULL,'2026-06-17 06:28:33','2026-06-17 06:28:33'),(3,7,67,'BYM-202606-777338','cod',1298.00,20.00,259.60,1038.40,'debit',259.60,'unsettled',NULL,NULL,NULL,NULL,'2026-06-17 06:31:24','2026-06-17 06:31:24'),(4,7,68,'BYM-202606-253933','cod',2499.00,20.00,499.80,1999.20,'debit',499.80,'unsettled',NULL,NULL,NULL,NULL,'2026-06-17 06:34:20','2026-06-17 06:34:20'),(5,7,69,'BYM-202606-560625','cod',7294.00,20.00,1458.80,5835.20,'debit',1458.80,'unsettled',NULL,NULL,NULL,NULL,'2026-06-17 07:19:15','2026-06-17 07:19:15'),(6,7,70,'BYM-202606-811455','cod',10191.00,20.00,2038.20,8152.80,'debit',2038.20,'unsettled',NULL,NULL,NULL,NULL,'2026-06-17 07:42:52','2026-06-17 07:42:52'),(7,7,71,'BYM-202606-559331','cod',1298.00,20.00,259.60,1038.40,'debit',259.60,'unsettled',NULL,NULL,NULL,NULL,'2026-06-17 07:55:20','2026-06-17 07:55:20'),(8,7,64,'BYM-202606-202033','cod',68881.00,20.00,13776.20,55104.80,'debit',13776.20,'unsettled',NULL,NULL,NULL,NULL,'2026-06-17 09:28:41','2026-06-17 09:28:41'),(9,7,62,'BYM-202606-838011','cod',6593.00,20.00,1318.60,5274.40,'debit',1318.60,'unsettled',NULL,NULL,NULL,NULL,'2026-06-17 09:58:22','2026-06-17 09:58:22'),(10,7,76,'BYM-202606-139299','cod',10493.00,20.00,2098.60,8394.40,'debit',2098.60,'unsettled',NULL,NULL,NULL,NULL,'2026-06-17 12:13:24','2026-06-17 12:13:24'),(11,7,75,'BYM-202606-986014','cod',2098.00,20.00,419.60,1678.40,'debit',419.60,'unsettled',NULL,NULL,NULL,NULL,'2026-06-17 13:31:06','2026-06-17 13:31:06');
/*!40000 ALTER TABLE `partner_ledger_entries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `partner_services`
--

DROP TABLE IF EXISTS `partner_services`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `partner_services` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `partnerId` int(11) NOT NULL,
  `categoryId` int(11) DEFAULT NULL,
  `serviceId` int(11) NOT NULL,
  `price` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `partnerId` (`partnerId`),
  KEY `categoryId` (`categoryId`),
  KEY `serviceId` (`serviceId`),
  CONSTRAINT `partner_services_ibfk_40` FOREIGN KEY (`partnerId`) REFERENCES `partners` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `partner_services_ibfk_41` FOREIGN KEY (`categoryId`) REFERENCES `service_categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `partner_services_ibfk_42` FOREIGN KEY (`serviceId`) REFERENCES `services` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=42 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `partner_services`
--

LOCK TABLES `partner_services` WRITE;
/*!40000 ALTER TABLE `partner_services` DISABLE KEYS */;
INSERT INTO `partner_services` VALUES (1,5,NULL,1,NULL),(2,5,NULL,2,NULL),(3,5,NULL,4,NULL),(4,5,NULL,10,NULL),(5,5,NULL,16,NULL),(6,5,NULL,20,NULL),(7,4,NULL,21,NULL),(8,4,NULL,20,NULL),(9,4,NULL,26,NULL),(10,4,NULL,16,NULL),(11,4,NULL,32,NULL),(12,4,NULL,31,NULL),(13,4,NULL,34,NULL),(14,4,NULL,29,NULL),(15,4,NULL,28,NULL),(16,4,NULL,1,NULL),(17,4,NULL,15,NULL),(18,4,NULL,4,NULL),(19,4,NULL,24,NULL),(20,4,NULL,12,NULL),(22,7,NULL,21,NULL),(23,7,NULL,20,NULL),(24,7,NULL,27,NULL),(25,7,NULL,26,NULL),(26,7,NULL,16,NULL),(27,7,NULL,18,NULL),(28,7,NULL,34,NULL),(29,7,NULL,31,NULL),(30,7,NULL,32,NULL),(31,7,NULL,2,NULL),(32,7,NULL,28,NULL),(33,7,NULL,29,NULL),(34,7,NULL,1,NULL),(35,7,NULL,15,NULL),(36,7,NULL,4,NULL),(37,7,NULL,24,NULL),(38,7,NULL,22,NULL),(39,7,NULL,13,NULL),(40,7,NULL,12,NULL),(41,7,NULL,10,NULL);
/*!40000 ALTER TABLE `partner_services` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `partner_settlements`
--

DROP TABLE IF EXISTS `partner_settlements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `partner_settlements` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `partnerId` int(11) NOT NULL,
  `type` enum('payout','collection') NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `method` varchar(30) DEFAULT NULL,
  `note` text DEFAULT NULL,
  `balanceBefore` decimal(12,2) NOT NULL,
  `balanceAfter` decimal(12,2) NOT NULL,
  `settledByAdminId` int(11) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `partnerId` (`partnerId`),
  KEY `settledByAdminId` (`settledByAdminId`),
  CONSTRAINT `partner_settlements_ibfk_1` FOREIGN KEY (`partnerId`) REFERENCES `partners` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT `partner_settlements_ibfk_2` FOREIGN KEY (`settledByAdminId`) REFERENCES `admin_users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `partner_settlements`
--

LOCK TABLES `partner_settlements` WRITE;
/*!40000 ALTER TABLE `partner_settlements` DISABLE KEYS */;
/*!40000 ALTER TABLE `partner_settlements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `partner_skill_categories`
--

DROP TABLE IF EXISTS `partner_skill_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `partner_skill_categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `partnerId` int(11) NOT NULL,
  `skillCategoryId` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `partner_skill_categories_partner_id_skill_category_id` (`partnerId`,`skillCategoryId`),
  KEY `skillCategoryId` (`skillCategoryId`),
  CONSTRAINT `partner_skill_categories_ibfk_3` FOREIGN KEY (`partnerId`) REFERENCES `partners` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `partner_skill_categories_ibfk_4` FOREIGN KEY (`skillCategoryId`) REFERENCES `skill_categories` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `partner_skill_categories`
--

LOCK TABLES `partner_skill_categories` WRITE;
/*!40000 ALTER TABLE `partner_skill_categories` DISABLE KEYS */;
/*!40000 ALTER TABLE `partner_skill_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `partners`
--

DROP TABLE IF EXISTS `partners`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `partners` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) DEFAULT NULL,
  `phone` varchar(20) NOT NULL,
  `email` varchar(150) DEFAULT NULL,
  `profilePicture` text DEFAULT NULL,
  `bio` varchar(500) DEFAULT NULL,
  `experience` int(11) DEFAULT 0,
  `locationLat` float DEFAULT NULL,
  `locationLng` float DEFAULT NULL,
  `locationAddress` text DEFAULT NULL,
  `locationCity` varchar(100) DEFAULT NULL,
  `locationState` varchar(100) DEFAULT NULL,
  `locationPincode` varchar(10) DEFAULT NULL,
  `aadharUrl` text DEFAULT NULL,
  `agreementUrl` text DEFAULT NULL,
  `serviceCategoryIds` text DEFAULT NULL,
  `panUrl` text DEFAULT NULL,
  `bankAccountNo` varchar(30) DEFAULT NULL,
  `bankIfsc` varchar(20) DEFAULT NULL,
  `bankName` varchar(100) DEFAULT NULL,
  `bankHolderName` varchar(100) DEFAULT NULL,
  `ratingsAverage` float DEFAULT 0,
  `ratingsCount` int(11) DEFAULT 0,
  `totalEarnings` decimal(12,2) DEFAULT 0.00,
  `pendingEarnings` decimal(12,2) DEFAULT 0.00,
  `status` enum('pending','approved','suspended','rejected') DEFAULT 'pending',
  `deviceTokens` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`deviceTokens`)),
  `fcmToken` text DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `cityId` int(11) DEFAULT NULL,
  `walletBalance` decimal(12,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (`id`),
  UNIQUE KEY `phone` (`phone`),
  UNIQUE KEY `phone_2` (`phone`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `email_2` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `partners`
--

LOCK TABLES `partners` WRITE;
/*!40000 ALTER TABLE `partners` DISABLE KEYS */;
INSERT INTO `partners` VALUES (2,'Alex','9999999999','alex@gmail.com',NULL,NULL,5,NULL,NULL,NULL,'RJY',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0.00,0.00,'approved','[\"[\",\"]\",\"cvGnARK8R0CK1Xa8EPQYrx:APA91bF85gb034vWJ38UldAzgSYJ2FF3tAuG-RF2Svd4tke8-9HPg3WcLG0jdhmMyk1--Fzuy5ip8xjOyFHpkzeAvk_2uZga8-wHl_rvPj_cNDWAR-mrlqA\"]','cvGnARK8R0CK1Xa8EPQYrx:APA91bF85gb034vWJ38UldAzgSYJ2FF3tAuG-RF2Svd4tke8-9HPg3WcLG0jdhmMyk1--Fzuy5ip8xjOyFHpkzeAvk_2uZga8-wHl_rvPj_cNDWAR-mrlqA','2026-05-25 07:35:09','2026-06-04 09:39:37',NULL,0.00),(4,'Rajesh','9494979494','rajwsh@gmail.com',NULL,'test',5,NULL,NULL,'Madhapur','Hyderabad','Telangana',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0.00,0.00,'approved','[\"[\",\"\\\"\",\",\",\"\\\\\",\"]\",\"f\",\"3\",\"Z\",\"l\",\"K\",\"n\",\"j\",\"p\",\"T\",\"7\",\"i\",\"C\",\"t\",\"c\",\"q\",\"M\",\"E\",\"I\",\"2\",\"x\",\":\",\"A\",\"P\",\"9\",\"1\",\"b\",\"H\",\"-\",\"X\",\"S\",\"J\",\"F\",\"U\",\"k\",\"0\",\"e\",\"G\",\"N\",\"8\",\"m\",\"s\",\"O\",\"o\",\"4\",\"y\",\"w\",\"d\",\"Q\",\"V\",\"R\",\"6\",\"g\",\"W\",\"h\",\"v\",\"B\",\"Y\",\"f3ZlKnjpT7iCtcqMEI2jxp:APA91bH-tXSJn1pAXFUZMpk0MeGcZSN8kmZCsXOPtUo24jGywXnksdonQAdjOKVcepSURkme-286g7g4KKWP6CNTyxHAOAth40bNZkN77fH2xvpyBY3YspE\"]','f3ZlKnjpT7iCtcqMEI2jxp:APA91bH-tXSJn1pAXFUZMpk0MeGcZSN8kmZCsXOPtUo24jGywXnksdonQAdjOKVcepSURkme-286g7g4KKWP6CNTyxHAOAth40bNZkN77fH2xvpyBY3YspE','2026-06-01 17:04:24','2026-06-01 18:02:12',3,0.00),(5,'Priya Sharma','9876543210','priya@example.com',NULL,'Expert stylist with 5 years of experience in hair and makeup',5,NULL,NULL,'Andheri West','Mumbai','Maharashtra',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0.00,0.00,'pending','[]',NULL,'2026-06-01 17:14:11','2026-06-01 17:14:12',6,0.00),(7,'Alex','7997753587','alexbenz3381@gmail.com','/uploads/partner-7-1780566457583.jpg','fccvh',5,NULL,NULL,'madhsvc','Hyderabad','Telangana',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,4,4,93630.40,0.00,'approved','[\"[\",\"\\\"\",\",\",\"\\\\\",\"]\",\"c\",\"v\",\"G\",\"n\",\"A\",\"R\",\"K\",\"8\",\"0\",\"C\",\"1\",\"X\",\"a\",\"E\",\"P\",\"Q\",\"Y\",\"r\",\"x\",\":\",\"9\",\"b\",\"F\",\"5\",\"g\",\"3\",\"4\",\"W\",\"J\",\"U\",\"l\",\"d\",\"z\",\"S\",\"2\",\"t\",\"u\",\"-\",\"k\",\"e\",\"H\",\"L\",\"j\",\"h\",\"m\",\"M\",\"y\",\"i\",\"p\",\"O\",\"_\",\"Z\",\"w\",\"N\",\"D\",\"q\",\"s\",\"T\",\"6\",\"B\",\"7\",\"o\",\"f\",\"I\",\"V\",\"dJSeTcCiTN2Uu1cNmmLxvd:APA91bGE3VWvPVckiztHwu8gfsA-DPJAQaUgSfLBA-v-Ygrci3iTc969laNAMoFc-Yx8bWQgUjQiCWQtmgqJN8rzw6pxBg9_5aBn8GUnurXyLdsgph_GgRU\"]','dJSeTcCiTN2Uu1cNmmLxvd:APA91bGE3VWvPVckiztHwu8gfsA-DPJAQaUgSfLBA-v-Ygrci3iTc969laNAMoFc-Yx8bWQgUjQiCWQtmgqJN8rzw6pxBg9_5aBn8GUnurXyLdsgph_GgRU','2026-06-04 09:39:02','2026-06-17 13:31:06',3,-23407.60);
/*!40000 ALTER TABLE `partners` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `payments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `bookingId` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `razorpayOrderId` varchar(100) NOT NULL,
  `razorpayPaymentId` varchar(100) DEFAULT NULL,
  `razorpaySignature` text DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `currency` varchar(5) DEFAULT 'INR',
  `status` enum('created','captured','failed','refunded') DEFAULT 'created',
  `method` varchar(30) DEFAULT NULL,
  `refundId` varchar(100) DEFAULT NULL,
  `refundedAt` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `bookingId` (`bookingId`),
  KEY `userId` (`userId`),
  CONSTRAINT `payments_ibfk_29` FOREIGN KEY (`bookingId`) REFERENCES `bookings` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT `payments_ibfk_30` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `referral_programs`
--

DROP TABLE IF EXISTS `referral_programs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `referral_programs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `rewardAmount` decimal(10,2) NOT NULL DEFAULT 50.00,
  `referrerReward` decimal(10,2) NOT NULL DEFAULT 100.00,
  `minOrderAmount` decimal(10,2) DEFAULT 0.00,
  `isActive` tinyint(1) DEFAULT 1,
  `description` text DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `referral_programs`
--

LOCK TABLES `referral_programs` WRITE;
/*!40000 ALTER TABLE `referral_programs` DISABLE KEYS */;
INSERT INTO `referral_programs` VALUES (1,50.00,100.00,0.00,1,NULL,'2026-05-25 04:17:04','2026-05-25 04:17:04');
/*!40000 ALTER TABLE `referral_programs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reviews`
--

DROP TABLE IF EXISTS `reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `reviews` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `bookingId` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `partnerId` int(11) NOT NULL,
  `serviceId` int(11) NOT NULL,
  `rating` int(11) NOT NULL,
  `comment` text DEFAULT NULL,
  `images` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`images`)),
  `status` enum('visible','hidden') DEFAULT 'visible',
  `helpfulCount` int(11) DEFAULT 0,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `bookingId` (`bookingId`),
  KEY `userId` (`userId`),
  KEY `partnerId` (`partnerId`),
  KEY `serviceId` (`serviceId`),
  CONSTRAINT `reviews_ibfk_67` FOREIGN KEY (`bookingId`) REFERENCES `bookings` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT `reviews_ibfk_68` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT `reviews_ibfk_69` FOREIGN KEY (`partnerId`) REFERENCES `partners` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT `reviews_ibfk_70` FOREIGN KEY (`serviceId`) REFERENCES `services` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reviews`
--

LOCK TABLES `reviews` WRITE;
/*!40000 ALTER TABLE `reviews` DISABLE KEYS */;
INSERT INTO `reviews` VALUES (1,76,1,7,12,5,'Good','[]','visible',0,'2026-06-17 12:14:10','2026-06-17 12:14:10'),(2,71,1,7,1,5,'','[]','visible',0,'2026-06-17 12:18:42','2026-06-17 12:18:42'),(3,70,1,7,5,5,'Good','[]','visible',0,'2026-06-17 12:37:15','2026-06-17 12:37:15'),(4,69,1,7,1,1,'Not good','[]','visible',0,'2026-06-17 12:56:12','2026-06-17 12:56:12');
/*!40000 ALTER TABLE `reviews` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `service_categories`
--

DROP TABLE IF EXISTS `service_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `service_categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `icon` text DEFAULT NULL,
  `image` text DEFAULT NULL,
  `isActive` tinyint(1) DEFAULT 1,
  `sortOrder` int(11) DEFAULT 0,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `cityIds` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`cityIds`)),
  `adminPercent` decimal(5,2) NOT NULL DEFAULT 20.00,
  `partnerPercent` decimal(5,2) NOT NULL DEFAULT 80.00,
  `gstPercent` decimal(5,2) NOT NULL DEFAULT 18.00,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `name_2` (`name`),
  UNIQUE KEY `name_3` (`name`),
  UNIQUE KEY `name_4` (`name`),
  UNIQUE KEY `name_5` (`name`),
  UNIQUE KEY `name_6` (`name`),
  UNIQUE KEY `name_7` (`name`),
  UNIQUE KEY `name_8` (`name`),
  UNIQUE KEY `name_9` (`name`),
  UNIQUE KEY `name_10` (`name`),
  UNIQUE KEY `name_11` (`name`),
  UNIQUE KEY `name_12` (`name`),
  UNIQUE KEY `name_13` (`name`),
  UNIQUE KEY `name_14` (`name`),
  UNIQUE KEY `name_15` (`name`),
  UNIQUE KEY `name_16` (`name`),
  UNIQUE KEY `name_17` (`name`),
  UNIQUE KEY `name_18` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `service_categories`
--

LOCK TABLES `service_categories` WRITE;
/*!40000 ALTER TABLE `service_categories` DISABLE KEYS */;
INSERT INTO `service_categories` VALUES (1,'Hair Care','Professional facial treatments for glowing, healthy skin',NULL,'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&q=80&fit=crop',1,0,'2026-05-25 06:59:38','2026-06-04 12:28:32',NULL,20.00,80.00,5.00),(2,'Hair Spa','Nourishing hair spa treatments for strong, shiny, and healthy hair',NULL,'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&q=80&fit=crop',1,0,'2026-05-25 06:59:38','2026-06-04 12:06:31',NULL,20.00,80.00,5.00),(3,'Makeup','Professional makeup services for every occasion',NULL,'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=600&q=80&fit=crop',1,0,'2026-05-25 06:59:38','2026-06-04 12:06:30',NULL,20.00,80.00,5.00),(4,'Waxing','Smooth and hair-free skin with professional waxing services',NULL,'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=600&q=80&fit=crop',1,0,'2026-05-25 06:59:38','2026-06-04 12:06:29',NULL,20.00,80.00,5.00),(5,'Pedicure','Relaxing pedicure treatments for beautiful, well-groomed feet',NULL,'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&q=80&fit=crop',1,4,'2026-05-25 06:59:38','2026-05-25 06:59:38',NULL,20.00,80.00,5.00),(6,'Haircut','Expert haircuts and styling by professional hair stylists',NULL,'https://images.unsplash.com/photo-1560869713-7d0a29430803?w=600&q=80&fit=crop',1,5,'2026-05-25 06:59:38','2026-05-25 06:59:38',NULL,20.00,80.00,5.00),(7,'Bridal Makeup','Stunning bridal makeup packages for your most special day',NULL,'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=600&q=80&fit=crop',1,6,'2026-05-25 06:59:38','2026-05-25 06:59:38',NULL,20.00,80.00,5.00),(8,'Threading','Precise eyebrow and facial hair threading for defined features',NULL,'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600&q=80&fit=crop',1,7,'2026-05-25 06:59:38','2026-05-25 06:59:38',NULL,20.00,80.00,5.00),(9,'Massage','Therapeutic massage services for relaxation and wellness',NULL,'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&q=80&fit=crop',1,8,'2026-05-25 06:59:38','2026-05-25 06:59:38',NULL,20.00,80.00,5.00),(10,'Manicure','Beautiful and well-groomed nails with expert manicure services',NULL,'https://images.unsplash.com/photo-1604902396830-aca29e19b067?w=600&q=80&fit=crop',1,9,'2026-05-25 06:59:38','2026-05-25 10:53:34',NULL,20.00,80.00,5.00),(11,'Skin Care','Advanced skin care treatments for radiant and healthy skin',NULL,'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&q=80&fit=crop',1,10,'2026-05-25 06:59:38','2026-05-25 06:59:38',NULL,20.00,80.00,5.00),(12,'Nail Art','Creative and trendy nail art designs by expert nail technicians',NULL,'https://images.unsplash.com/photo-1607779097040-26e80aa78e66?w=600&q=80&fit=crop',1,0,'2026-05-25 06:59:38','2026-06-08 04:23:51','[]',20.00,80.00,5.00),(13,'Test',NULL,NULL,'http://localhost:3000/uploads/1780891730501-278496406.png',1,0,'2026-06-08 04:08:51','2026-06-08 04:08:51','[9]',20.00,80.00,5.00),(17,'Testingg','',NULL,'http://localhost:3000/uploads/1780892258265-800714011.jpg',1,0,'2026-06-08 04:17:51','2026-06-08 04:21:34','[10,4,5,3]',20.00,80.00,5.00);
/*!40000 ALTER TABLE `service_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `service_city_map`
--

DROP TABLE IF EXISTS `service_city_map`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `service_city_map` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `serviceId` int(11) NOT NULL,
  `cityId` int(11) NOT NULL,
  `isActive` tinyint(1) DEFAULT 1,
  `customPrice` decimal(10,2) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `service_city_map_service_id_city_id` (`serviceId`,`cityId`),
  CONSTRAINT `service_city_map_ibfk_1` FOREIGN KEY (`serviceId`) REFERENCES `services` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `service_city_map`
--

LOCK TABLES `service_city_map` WRITE;
/*!40000 ALTER TABLE `service_city_map` DISABLE KEYS */;
INSERT INTO `service_city_map` VALUES (5,10,4,1,NULL,'2026-06-08 05:03:06','2026-06-08 05:03:06'),(6,10,8,1,NULL,'2026-06-08 05:03:06','2026-06-08 05:03:06'),(7,10,11,1,NULL,'2026-06-08 05:03:06','2026-06-08 05:03:06'),(8,10,6,1,NULL,'2026-06-08 05:03:06','2026-06-08 05:03:06'),(25,30,6,0,NULL,'2026-06-08 05:06:15','2026-06-08 05:06:15');
/*!40000 ALTER TABLE `service_city_map` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `service_packages`
--

DROP TABLE IF EXISTS `service_packages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `service_packages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `image` text DEFAULT NULL,
  `packageType` enum('fixed','flexible') NOT NULL DEFAULT 'fixed',
  `price` decimal(10,2) NOT NULL,
  `originalPrice` decimal(10,2) DEFAULT NULL,
  `serviceCount` int(11) DEFAULT NULL,
  `categoryId` int(11) DEFAULT NULL,
  `services` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`services`)),
  `isActive` tinyint(1) DEFAULT 1,
  `validFrom` datetime DEFAULT NULL,
  `validTill` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `cityIds` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`cityIds`)),
  `adminPercent` decimal(5,2) NOT NULL DEFAULT 20.00,
  `partnerPercent` decimal(5,2) NOT NULL DEFAULT 80.00,
  `gstPercent` decimal(5,2) NOT NULL DEFAULT 5.00,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `service_packages`
--

LOCK TABLES `service_packages` WRITE;
/*!40000 ALTER TABLE `service_packages` DISABLE KEYS */;
INSERT INTO `service_packages` VALUES (2,'Test','TTTT',NULL,'fixed',999.00,1500.00,NULL,NULL,'[{\"serviceId\":1,\"name\":\"Classic Haircut\",\"price\":299,\"duration\":30,\"image\":\"https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&q=80&fit=crop\"},{\"serviceId\":4,\"name\":\"Deep Conditioning Hair Spa\",\"price\":599,\"duration\":60,\"image\":\"https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&q=80&fit=crop\"},{\"serviceId\":9,\"name\":\"HD Airbrush Makeup\",\"price\":2499,\"duration\":75,\"image\":\"https://images.unsplash.com/photo-1583195764036-1ce2e97dac2c?w=600&q=80&fit=crop\"}]',1,'2026-06-08 00:00:00','2026-07-04 00:00:00','2026-06-08 11:57:15','2026-06-08 11:58:08','[10,7,3]',20.00,80.00,5.00),(3,'Bridal Glow Package','Facial, hair spa & makeup combo for that complete pre-wedding glow.','https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=1200&q=90&fit=crop','fixed',2999.00,3997.00,NULL,NULL,'[{\"serviceId\":2,\"name\":\"Deep Cleansing Facial\",\"price\":999,\"duration\":75,\"image\":null},{\"serviceId\":5,\"name\":\"Keratin Hair Spa\",\"price\":1499,\"duration\":90,\"image\":null},{\"serviceId\":8,\"name\":\"Natural Everyday Makeup\",\"price\":999,\"duration\":45,\"image\":null}]',1,'2026-06-16 10:00:45','2026-08-16 10:00:45','2026-06-17 10:00:45','2026-06-17 10:00:45','[]',20.00,80.00,5.00),(4,'Quick Refresh Combo','Haircut + classic pedicure for a fast midweek refresh.','https://images.unsplash.com/photo-1560869713-7d0a29430803?w=1200&q=90&fit=crop','fixed',999.00,1298.00,NULL,NULL,'[{\"serviceId\":1,\"name\":\"Classic Haircut\",\"price\":299,\"duration\":30,\"image\":null},{\"serviceId\":14,\"name\":\"Spa Pedicure\",\"price\":999,\"duration\":60,\"image\":null}]',1,'2026-06-16 10:00:45','2026-08-16 10:00:45','2026-06-17 10:00:45','2026-06-17 10:00:45','[]',20.00,80.00,5.00),(5,'Pick Any 3 — Waxing Category','Choose any 3 waxing services at a flat discounted price.','https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=1200&q=90&fit=crop','flexible',1499.00,NULL,3,4,'[]',1,'2026-06-16 10:00:45','2026-08-16 10:00:45','2026-06-17 10:00:45','2026-06-17 10:00:45','[]',20.00,80.00,5.00);
/*!40000 ALTER TABLE `service_packages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `service_zones`
--

DROP TABLE IF EXISTS `service_zones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `service_zones` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `cities` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`cities`)),
  `pincodes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`pincodes`)),
  `isActive` tinyint(1) DEFAULT 1,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `cityIds` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT json_array() CHECK (json_valid(`cityIds`)),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `service_zones`
--

LOCK TABLES `service_zones` WRITE;
/*!40000 ALTER TABLE `service_zones` DISABLE KEYS */;
INSERT INTO `service_zones` VALUES (1,'Test','','[]','[]',1,'2026-06-14 13:01:17','2026-06-14 13:01:17','[10,4,3]');
/*!40000 ALTER TABLE `service_zones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `services`
--

DROP TABLE IF EXISTS `services`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `services` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `categoryId` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `description` text DEFAULT NULL,
  `basePrice` decimal(10,2) NOT NULL,
  `duration` int(11) DEFAULT 60,
  `tags` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`tags`)),
  `image` text DEFAULT NULL,
  `isActive` tinyint(1) DEFAULT 1,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `categoryId` (`categoryId`),
  CONSTRAINT `services_ibfk_1` FOREIGN KEY (`categoryId`) REFERENCES `service_categories` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `services`
--

LOCK TABLES `services` WRITE;
/*!40000 ALTER TABLE `services` DISABLE KEYS */;
INSERT INTO `services` VALUES (1,1,'Classic Haircut','A relaxing deep-cleanse facial with steam, extractions, and moisturiser to refresh and brighten your skin.',299.00,30,'[]','https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&q=80&fit=crop',1,'2026-05-25 06:59:38','2026-05-25 17:47:12'),(2,1,'Deep Cleansing Facial','Thorough pore-cleansing treatment using medicated products to remove impurities and reduce blackheads.',999.00,75,'[]','https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=600&q=80&fit=crop',1,'2026-05-25 06:59:38','2026-05-25 10:50:27'),(3,1,'Anti-Aging Facial','Targets fine lines and wrinkles with collagen-boosting serums and lifting massage techniques.',1499.00,90,'[]','https://images.unsplash.com/photo-1552693673-1bf958298935?w=600&q=80&fit=crop',0,'2026-05-25 06:59:38','2026-05-25 11:59:29'),(4,2,'Deep Conditioning Hair Spa','Intensive moisture treatment that repairs damage, reduces frizz, and adds brilliant shine.',599.00,60,'[]','https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&q=80&fit=crop',1,'2026-05-25 06:59:38','2026-05-25 10:50:27'),(5,2,'Keratin Hair Spa','Protein-rich keratin treatment to strengthen hair shafts, control frizz, and improve manageability.',1499.00,90,'[]','https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=600&q=80&fit=crop',1,'2026-05-25 06:59:38','2026-05-25 10:50:27'),(6,2,'Scalp Treatment','Targeted scalp massage with nourishing oils to stimulate hair growth and treat dandruff.',799.00,45,'[]','https://images.unsplash.com/photo-1583795484071-3c453e3a7c71?w=600&q=80&fit=crop',1,'2026-05-25 06:59:38','2026-05-25 10:50:27'),(7,3,'Party Makeup','Glamorous makeup look perfect for parties, functions, and special events using premium brands.',1499.00,60,'[]','https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=600&q=80&fit=crop',1,'2026-05-25 06:59:38','2026-05-25 10:50:27'),(8,3,'Natural Everyday Makeup','Light, flawless makeup for a polished natural look suitable for office, college, or casual outings.',999.00,45,'[]','https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&q=80&fit=crop',1,'2026-05-25 06:59:38','2026-05-25 10:50:27'),(9,3,'HD Airbrush Makeup','High-definition airbrush technique for a flawless, long-lasting look that photographs beautifully.',2499.00,75,'[]','https://images.unsplash.com/photo-1583195764036-1ce2e97dac2c?w=600&q=80&fit=crop',1,'2026-05-25 06:59:38','2026-05-25 10:50:27'),(10,4,'Full Legs Waxing','Complete leg waxing using soft or hard wax for silky smooth legs that stay hair-free longer.',599.00,45,'[]','https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=600&q=80&fit=crop',1,'2026-05-25 06:59:38','2026-06-08 05:03:06'),(11,4,'Underarm Waxing','Quick and effective underarm waxing for clean, smooth underarms with minimal discomfort.',199.00,15,'[]','https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=600&q=80&fit=crop',1,'2026-05-25 06:59:38','2026-05-25 10:50:27'),(12,4,'Full Body Waxing','Comprehensive full-body waxing service covering arms, legs, underarms, and back for complete smoothness.',1499.00,120,'[]','https://images.unsplash.com/photo-1526413232644-8a40f03cc03b?w=600&q=80&fit=crop',1,'2026-05-25 06:59:38','2026-05-25 10:50:27'),(13,5,'Classic Pedicure','Soak, scrub, nail trim, cuticle care, and polish for refreshed and neat feet.',499.00,45,'[]','https://images.unsplash.com/photo-1604902396830-aca29e19b067?w=600&q=80&fit=crop',0,'2026-05-25 06:59:38','2026-06-08 04:53:52'),(14,5,'Spa Pedicure','Luxurious pedicure with exfoliating scrub, paraffin wax treatment, and relaxing foot massage.',999.00,60,'[]','https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=600&q=80&fit=crop',1,'2026-05-25 06:59:38','2026-05-25 10:50:27'),(15,5,'Gel Pedicure','Long-lasting gel polish pedicure that stays chip-free for up to 3 weeks with glossy finish.',799.00,60,'[]','https://images.unsplash.com/photo-1604902396830-aca29e19b067?w=600&q=80&fit=crop',1,'2026-05-25 06:59:38','2026-05-25 10:50:27'),(16,6,'Basic Haircut & Trim','Precise haircut with blow-dry to suit your face shape and personal style.',299.00,30,'[]','https://images.unsplash.com/photo-1560869713-7d0a29430803?w=600&q=80&fit=crop',1,'2026-05-25 06:59:38','2026-05-25 10:50:27'),(17,6,'Layer Cut & Style','Trendy layered haircut with styling to add volume, movement, and dimension.',499.00,45,'[]','https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80&fit=crop',1,'2026-05-25 06:59:38','2026-05-25 10:50:27'),(18,6,'Hair Wash, Cut & Blow Dry','Complete hair service: shampooing, conditioning, cut, and professional blow-dry finish.',699.00,60,'[]','https://images.unsplash.com/photo-1522337180988-2df4d5bf9ca6?w=600&q=80&fit=crop',1,'2026-05-25 06:59:38','2026-05-25 10:50:27'),(19,7,'Traditional Bridal Makeup','Classic Indian bridal look with heavy base, dramatic eye makeup, and traditional accessories styling.',7999.00,180,'[]','https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=600&q=80&fit=crop',1,'2026-05-25 06:59:38','2026-05-25 10:50:27'),(20,7,'Engagement Makeup','Elegant and sophisticated makeup for engagement ceremonies with a soft glam finish.',2999.00,90,'[]','https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=600&q=80&fit=crop',1,'2026-05-25 06:59:38','2026-05-25 10:50:27'),(21,7,'Airbrush Bridal Makeup','Premium airbrush technique for a flawless, sweat-proof bridal look that lasts through the entire celebration.',9999.00,210,'[]','https://images.unsplash.com/photo-1519741497674-611481863552?w=600&q=80&fit=crop',0,'2026-05-25 06:59:38','2026-06-04 12:28:51'),(22,8,'Eyebrow Threading & Shaping','Expert eyebrow shaping using threading technique for perfectly arched, defined brows.',79.00,15,'[]','https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600&q=80&fit=crop',1,'2026-05-25 06:59:38','2026-05-25 10:50:27'),(23,8,'Upper Lip Threading','Quick and precise upper lip hair removal by threading for smooth, clean results.',49.00,10,'[]','https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=600&q=80&fit=crop',1,'2026-05-25 06:59:38','2026-05-25 10:50:27'),(24,8,'Full Face Threading','Complete facial hair removal including eyebrows, upper lip, chin, forehead, and side face.',199.00,30,'[]','https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=600&q=80&fit=crop',1,'2026-05-25 06:59:38','2026-05-25 10:50:27'),(25,9,'Swedish Relaxation Massage','Classic full-body Swedish massage using long strokes and kneading to ease tension and promote relaxation.',1199.00,60,'[]','https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&q=80&fit=crop',1,'2026-05-25 06:59:38','2026-05-25 10:50:27'),(26,9,'Deep Tissue Massage','Firm-pressure massage targeting deep muscle layers to relieve chronic pain and stiffness.',1499.00,60,'[]','https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=600&q=80&fit=crop',1,'2026-05-25 06:59:38','2026-05-25 10:50:27'),(27,9,'Aromatherapy Massage','Soothing full-body massage with essential oils to calm the mind, reduce stress, and nourish the skin.',1499.00,75,'[]','https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=600&q=80&fit=crop',0,'2026-05-25 06:59:38','2026-06-08 04:27:01'),(28,10,'Classic Manicure','Nail soak, filing, cuticle care, hand massage, and polish for neat, beautiful nails.',399.00,45,'[]','https://images.unsplash.com/photo-1604902396830-aca29e19b067?w=600&q=80&fit=crop',1,'2026-05-25 06:59:38','2026-05-25 10:50:27'),(29,10,'Gel Manicure','Long-lasting gel polish application that stays shiny and chip-free for up to 3 weeks.',699.00,60,'[]','https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80&fit=crop',1,'2026-05-25 06:59:38','2026-05-25 10:50:27'),(30,10,'Acrylic Nail Extension','Acrylic nail extensions for length and strength with your choice of shape, length, and finish.',1499.00,90,'[]','https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=600&q=80&fit=crop',1,'2026-05-25 06:59:38','2026-06-08 05:05:13'),(31,11,'Basic Skin Cleanup','Gentle cleansing, scrubbing, and moisturising treatment to remove tan and refresh dull skin.',499.00,45,'[]','https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&q=80&fit=crop',1,'2026-05-25 06:59:38','2026-05-25 10:50:27'),(32,11,'De-Tan Treatment','Targeted de-tanning treatment using fruit acids and lightening agents to even skin tone and remove sun tan.',799.00,60,'[]','https://images.unsplash.com/photo-1552693673-1bf958298935?w=600&q=80&fit=crop',1,'2026-05-25 06:59:38','2026-05-25 10:50:27'),(33,11,'HydraFacial','Multi-step medical-grade HydraFacial that cleanses, extracts, and hydrates for instantly radiant results.',1999.00,60,'[]','https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&q=80&fit=crop',1,'2026-05-25 06:59:38','2026-05-25 10:50:27'),(34,12,'Basic Nail Art','Simple yet stylish nail art designs including florals, French tips, and geometric patterns.',299.00,30,'[]','https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80&fit=crop',1,'2026-05-25 06:59:38','2026-05-25 10:50:27'),(35,12,'3D Nail Art','Intricate 3D nail art with embellishments, gems, and sculpted designs for a statement look.',799.00,60,'[]','https://images.unsplash.com/photo-1607779097040-26e80aa78e66?w=600&q=80&fit=crop',1,'2026-05-25 06:59:38','2026-06-08 05:03:11'),(36,12,'Ombre Gradient Nail Art','Trendy ombre colour blend nail art with custom colour combinations for a chic, modern look.',599.00,45,'[]','https://images.unsplash.com/photo-1604902396830-aca29e19b067?w=600&q=80&fit=crop',1,'2026-05-25 06:59:38','2026-05-25 10:50:27'),(37,13,'TETETETE SERVICE','Test',5490.00,60,'[]',NULL,1,'2026-06-08 04:54:22','2026-06-08 04:55:13');
/*!40000 ALTER TABLE `services` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `skill_categories`
--

DROP TABLE IF EXISTS `skill_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `skill_categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `sortOrder` int(11) DEFAULT 0,
  `isActive` tinyint(1) DEFAULT 1,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `name_2` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `skill_categories`
--

LOCK TABLES `skill_categories` WRITE;
/*!40000 ALTER TABLE `skill_categories` DISABLE KEYS */;
INSERT INTO `skill_categories` VALUES (1,'Hair Basic',1,1,'2026-06-13 05:58:07','2026-06-13 05:58:07'),(2,'Skin Basic',2,1,'2026-06-13 05:58:07','2026-06-13 05:58:07'),(3,'Hair Advanced',3,1,'2026-06-13 05:58:07','2026-06-13 05:58:07'),(4,'Waxing',4,1,'2026-06-13 05:58:07','2026-06-13 05:58:07'),(5,'Skin Treatment',5,1,'2026-06-13 05:58:07','2026-06-13 05:58:07'),(6,'Makeup',6,1,'2026-06-13 05:58:07','2026-06-13 05:58:07'),(7,'Mehendi',7,1,'2026-06-13 05:58:07','2026-06-13 05:58:07'),(8,'Nails',8,1,'2026-06-13 05:58:07','2026-06-13 05:58:07'),(9,'Hair Treatments',9,1,'2026-06-13 05:58:07','2026-06-13 05:58:07'),(10,'Massage',10,1,'2026-06-13 05:58:07','2026-06-13 05:58:07'),(11,'Aesthetics',11,1,'2026-06-13 05:58:07','2026-06-13 05:58:07'),(12,'Laser',12,1,'2026-06-13 05:58:07','2026-06-13 05:58:07'),(13,'Men',13,1,'2026-06-13 05:58:07','2026-06-13 05:58:07');
/*!40000 ALTER TABLE `skill_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `skills`
--

DROP TABLE IF EXISTS `skills`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `skills` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `skillCategoryId` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `isActive` tinyint(1) DEFAULT 1,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `skillCategoryId` (`skillCategoryId`),
  CONSTRAINT `skills_ibfk_1` FOREIGN KEY (`skillCategoryId`) REFERENCES `skill_categories` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=53 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `skills`
--

LOCK TABLES `skills` WRITE;
/*!40000 ALTER TABLE `skills` DISABLE KEYS */;
INSERT INTO `skills` VALUES (1,1,'Basic HairCut',1,'2026-06-13 05:58:07','2026-06-13 05:58:07'),(2,1,'Henna',1,'2026-06-13 05:58:07','2026-06-13 05:58:07'),(3,1,'Hair Spa',1,'2026-06-13 05:58:07','2026-06-13 05:58:07'),(4,1,'Head Massage',1,'2026-06-13 05:58:07','2026-06-13 05:58:07'),(5,1,'Hair Color',1,'2026-06-13 05:58:07','2026-06-13 05:58:07'),(6,1,'Lice Treatment',1,'2026-06-13 05:58:07','2026-06-13 05:58:07'),(7,2,'DeTan',1,'2026-06-13 05:58:07','2026-06-13 05:58:07'),(8,2,'PeelOff',1,'2026-06-13 05:58:07','2026-06-13 05:58:07'),(9,2,'Facial',1,'2026-06-13 05:58:07','2026-06-13 05:58:07'),(10,2,'Waxing',1,'2026-06-13 05:58:07','2026-06-13 05:58:07'),(11,2,'Pedicure',1,'2026-06-13 05:58:07','2026-06-13 05:58:07'),(12,2,'Manicure',1,'2026-06-13 05:58:07','2026-06-13 05:58:07'),(13,2,'Face Massage',1,'2026-06-13 05:58:07','2026-06-13 05:58:07'),(14,3,'Creative HairCut',1,'2026-06-13 05:58:07','2026-06-13 05:58:07'),(15,3,'Hair Setting',1,'2026-06-13 05:58:07','2026-06-13 05:58:07'),(16,3,'Ironing',1,'2026-06-13 05:58:07','2026-06-13 05:58:07'),(17,3,'Fashion Color',1,'2026-06-13 05:58:07','2026-06-13 05:58:07'),(18,4,'Honey Waxing',1,'2026-06-13 05:58:07','2026-06-13 05:58:07'),(19,4,'Rica Waxing',1,'2026-06-13 05:58:07','2026-06-13 05:58:07'),(20,4,'Brazillian',1,'2026-06-13 05:58:07','2026-06-13 05:58:07'),(21,4,'B Waxing',1,'2026-06-13 05:58:07','2026-06-13 05:58:07'),(22,5,'Wart Removal',1,'2026-06-13 05:58:07','2026-06-13 05:58:07'),(23,5,'Skin Tightening',1,'2026-06-13 05:58:07','2026-06-13 05:58:07'),(24,6,'HairDo',1,'2026-06-13 05:58:07','2026-06-13 05:58:07'),(25,6,'Saree Draping',1,'2026-06-13 05:58:07','2026-06-13 05:58:07'),(26,6,'Bride Makeup',1,'2026-06-13 05:58:07','2026-06-13 05:58:07'),(27,6,'Groom Makeup',1,'2026-06-13 05:58:07','2026-06-13 05:58:07'),(28,6,'Pre-plating',1,'2026-06-13 05:58:07','2026-06-13 05:58:07'),(29,9,'Botox',1,'2026-06-13 05:58:07','2026-06-13 05:58:07'),(30,9,'Keratin',1,'2026-06-13 05:58:07','2026-06-13 05:58:07'),(31,9,'Straightening',1,'2026-06-13 05:58:07','2026-06-13 05:58:07'),(32,9,'NanoPlastia',1,'2026-06-13 05:58:07','2026-06-13 05:58:07'),(33,9,'Hairfall Treatment',1,'2026-06-13 05:58:07','2026-06-13 05:58:07'),(34,9,'Dandruff Treatment',1,'2026-06-13 05:58:07','2026-06-13 05:58:07'),(35,10,'Foot Massage',1,'2026-06-13 05:58:07','2026-06-13 05:58:07'),(36,10,'Back Massage',1,'2026-06-13 05:58:07','2026-06-13 05:58:07'),(37,10,'Body Massage',1,'2026-06-13 05:58:07','2026-06-13 05:58:07'),(38,10,'Body Polish',1,'2026-06-13 05:58:07','2026-06-13 05:58:07'),(39,11,'Hydra Facial',1,'2026-06-13 05:58:07','2026-06-13 05:58:07'),(40,11,'Medi Facials',1,'2026-06-13 05:58:07','2026-06-13 05:58:07'),(41,11,'Micro Blading',1,'2026-06-13 05:58:07','2026-06-13 05:58:07'),(42,11,'Eyelash',1,'2026-06-13 05:58:07','2026-06-13 05:58:07'),(43,11,'BB Glow',1,'2026-06-13 05:58:07','2026-06-13 05:58:07'),(44,11,'Lip Coloring',1,'2026-06-13 05:58:07','2026-06-13 05:58:07'),(45,11,'Chemical Peels',1,'2026-06-13 05:58:07','2026-06-13 05:58:07'),(46,11,'PRP / GFC',1,'2026-06-13 05:58:07','2026-06-13 05:58:07'),(47,11,'Glutathione',1,'2026-06-13 05:58:07','2026-06-13 05:58:07'),(48,11,'Derma Planing',1,'2026-06-13 05:58:07','2026-06-13 05:58:07'),(49,13,'Hair',1,'2026-06-13 05:58:07','2026-06-13 05:58:07'),(50,13,'Skin',1,'2026-06-13 05:58:07','2026-06-13 05:58:07'),(51,13,'Makeup',1,'2026-06-13 05:58:07','2026-06-13 05:58:07'),(52,13,'Massage',1,'2026-06-13 05:58:07','2026-06-13 05:58:07');
/*!40000 ALTER TABLE `skills` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_addresses`
--

DROP TABLE IF EXISTS `user_addresses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_addresses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL,
  `label` varchar(50) DEFAULT 'Home',
  `line1` varchar(255) NOT NULL,
  `line2` varchar(255) DEFAULT NULL,
  `city` varchar(100) NOT NULL,
  `state` varchar(100) NOT NULL,
  `pincode` varchar(10) NOT NULL,
  `lat` float DEFAULT NULL,
  `lng` float DEFAULT NULL,
  `isDefault` tinyint(1) DEFAULT 0,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  CONSTRAINT `user_addresses_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_addresses`
--

LOCK TABLES `user_addresses` WRITE;
/*!40000 ALTER TABLE `user_addresses` DISABLE KEYS */;
INSERT INTO `user_addresses` VALUES (6,1,'Home','Rajahmundry - Punyakshetram - Kesavaram Road','Rajahmundry Urban','Rajamahendravaram','Andhra Pradesh','',16.998,81.7979,0,'2026-05-26 14:39:54','2026-05-26 14:40:00'),(7,1,'Home','Koti Women\'s College Road, Ward 78 Gunfoundry, Sultan Bazar','Greater Hyderabad Municipal Corporation Central Zone','Hyderabad','Telangana','',17.385,78.4867,1,'2026-05-26 14:40:00','2026-05-26 14:40:00');
/*!40000 ALTER TABLE `user_addresses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) DEFAULT NULL,
  `phone` varchar(20) NOT NULL,
  `email` varchar(150) DEFAULT NULL,
  `profilePicture` text DEFAULT NULL,
  `deviceTokens` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`deviceTokens`)),
  `fcmToken` text DEFAULT NULL,
  `referralCode` varchar(20) DEFAULT NULL,
  `referredById` int(11) DEFAULT NULL,
  `walletBalance` decimal(10,2) NOT NULL DEFAULT 0.00,
  `status` enum('active','blocked','deleted') NOT NULL DEFAULT 'active',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `cityId` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `phone` (`phone`),
  UNIQUE KEY `phone_2` (`phone`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `referralCode` (`referralCode`),
  UNIQUE KEY `email_2` (`email`),
  UNIQUE KEY `referralCode_2` (`referralCode`),
  KEY `referredById` (`referredById`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`referredById`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Alex','7997753587','test@example.com',NULL,'[\"[\",\"\\\"\",\",\",\"\\\\\",\"]\",\"c\",\"o\",\"2\",\"T\",\"x\",\"O\",\"D\",\"Y\",\"Q\",\"X\",\"6\",\"d\",\"3\",\"L\",\"J\",\"r\",\"k\",\"9\",\"E\",\"V\",\"P\",\":\",\"A\",\"1\",\"b\",\"G\",\"_\",\"B\",\"l\",\"u\",\"I\",\"w\",\"F\",\"f\",\"-\",\"K\",\"a\",\"N\",\"U\",\"M\",\"q\",\"S\",\"8\",\"4\",\"z\",\"e\",\"j\",\"h\",\"5\",\"v\",\"R\",\"y\",\"C\",\"g\",\"i\",\"7\",\"n\",\"p\",\"t\",\"H\",\"s\",\"W\",\"m\",\"Z\",\"0\",\"d5dP5H16Qx-HorAVvFYMVJ:APA91bEI5tDF7xb_L6gJPPuNLBhAnQ1mFiA9aoGCO7sR6YLSFzSsIxc21FnAlge4dBrV59G8rH6Le073JiAQMuV7Ks-ovID_ZFdW8ikqz_y4n0JeNIHDbWM\"]','d5dP5H16Qx-HorAVvFYMVJ:APA91bEI5tDF7xb_L6gJPPuNLBhAnQ1mFiA9aoGCO7sR6YLSFzSsIxc21FnAlge4dBrV59G8rH6Le073JiAQMuV7Ks-ovID_ZFdW8ikqz_y4n0JeNIHDbWM','BYM62319838',NULL,0.00,'active','2026-05-25 10:08:24','2026-06-17 12:55:43',NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'beyomo'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-17 19:25:50
