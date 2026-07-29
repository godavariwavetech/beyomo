-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: 127.0.0.1    Database: beyomo
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
INSERT INTO `admin_users` VALUES (1,'Super Admin','admin@beyomo.com','$2a$12$TxYP5bAmWN94uaqZc8EFzuFB3N5vtN8jX6uJKCL2/VRVF5doBudCW','super_admin','[]','active','2026-07-24 06:40:00',NULL,'2026-05-24 18:41:13','2026-07-25 03:34:12',NULL,'fUJIt0MvR6Gsx7dp_8ZxL1:APA91bFo5rSLwu7BwuGHLlg8qENQmkZEMJqiA4KIdb_e04h0nm22I7OZSKSQNM0_CWdXbXgcYhEkrKOMfdltFaYZV9L8PjyzueLUEu3v9YqiZ2EJmJthadY',NULL);
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
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bookings`
--

LOCK TABLES `bookings` WRITE;
/*!40000 ALTER TABLE `bookings` DISABLE KEYS */;
INSERT INTO `bookings` VALUES (1,'BYM-202607-127242',1,NULL,176,'Home','123 Real Test Street','Dhanlakshmi Puram','Nellore','Andhra Pradesh','524001',14.4426,79.9865,'2026-07-20 09:30:00','pending',2499.00,0.00,0.00,124.95,2623.95,1999.20,NULL,NULL,'pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-07-05 03:01:28','2026-07-05 03:01:28',NULL,'[{\"serviceId\":176,\"name\":\"Organic Clean-Up - Dry Skin\",\"price\":799,\"qty\":1,\"duration\":45,\"image\":\"https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&q=80&fit=crop\",\"serviceStatus\":\"unassigned\",\"assignedPartnerId\":null,\"assignedPartnerName\":null,\"addedByPackage\":true},{\"serviceId\":169,\"name\":\"Full Legs De-Tan (Fruit)\",\"price\":800,\"qty\":1,\"duration\":60,\"image\":\"https://images.unsplash.com/photo-1552693673-1bf958298935?w=600&q=80&fit=crop\",\"serviceStatus\":\"unassigned\",\"assignedPartnerId\":null,\"assignedPartnerName\":null,\"addedByPackage\":true},{\"serviceId\":194,\"name\":\"Insta Glow Facial\",\"price\":2000,\"qty\":1,\"duration\":60,\"image\":\"https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&q=80&fit=crop\",\"serviceStatus\":\"unassigned\",\"assignedPartnerId\":null,\"assignedPartnerName\":null,\"addedByPackage\":true}]',NULL,0,NULL,6,NULL,0,NULL,NULL,'cod',NULL,NULL),(2,'BYM-202607-158442',3,NULL,176,'Home','123 Dup Test Street','Dhanlakshmi Puram','Nellore','Andhra Pradesh','524001',14.4426,79.9865,'2026-07-21 05:30:00','pending',3796.00,0.00,0.00,189.80,3985.80,3036.80,NULL,NULL,'pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-07-05 03:33:59','2026-07-05 03:33:59',NULL,'[{\"serviceId\":176,\"name\":\"Organic Clean-Up - Dry Skin\",\"price\":799,\"qty\":1,\"duration\":45,\"image\":\"https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&q=80&fit=crop\",\"serviceStatus\":\"unassigned\",\"assignedPartnerId\":null,\"assignedPartnerName\":null},{\"serviceId\":169,\"name\":\"Full Legs De-Tan (Fruit)\",\"price\":800,\"qty\":1,\"duration\":60,\"image\":\"https://images.unsplash.com/photo-1552693673-1bf958298935?w=600&q=80&fit=crop\",\"serviceStatus\":\"unassigned\",\"assignedPartnerId\":null,\"assignedPartnerName\":null},{\"serviceId\":194,\"name\":\"Insta Glow Facial\",\"price\":2000,\"qty\":1,\"duration\":60,\"image\":\"https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&q=80&fit=crop\",\"serviceStatus\":\"unassigned\",\"assignedPartnerId\":null,\"assignedPartnerName\":null},{\"serviceId\":176,\"name\":\"Organic Clean-Up - Dry Skin\",\"price\":799,\"qty\":1,\"duration\":45,\"image\":\"https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&q=80&fit=crop\",\"serviceStatus\":\"unassigned\",\"assignedPartnerId\":null,\"assignedPartnerName\":null}]',NULL,0,NULL,NULL,NULL,0,NULL,NULL,'cod',NULL,NULL),(3,'BYM-202607-886244',2,NULL,49,'Home','VRC Road','Dhanlakshmi Puram','Vaddipalem','Andhra Pradesh','524003',14.4426,79.9865,'2026-07-05 07:47:00','pending',4693.00,0.00,0.00,234.65,4927.65,3754.40,NULL,NULL,'pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-07-05 03:47:51','2026-07-05 03:47:51',NULL,'[{\"serviceId\":49,\"name\":\"Classic Cut\",\"price\":399,\"qty\":1,\"duration\":30,\"image\":\"https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&q=80&fit=crop\",\"serviceStatus\":\"unassigned\",\"assignedPartnerId\":null,\"assignedPartnerName\":null},{\"serviceId\":176,\"name\":\"Organic Clean-Up - Dry Skin\",\"price\":799,\"qty\":1,\"duration\":75,\"image\":\"https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=600&q=80&fit=crop\",\"serviceStatus\":\"unassigned\",\"assignedPartnerId\":null,\"assignedPartnerName\":null},{\"serviceId\":250,\"name\":\"French Nail Tip (Per Hand)\",\"price\":1500,\"qty\":1,\"duration\":60,\"image\":\"https://images.unsplash.com/photo-1607779097040-26e80aa78e66?w=600&q=80&fit=crop\",\"serviceStatus\":\"unassigned\",\"assignedPartnerId\":null,\"assignedPartnerName\":null},{\"serviceId\":251,\"name\":\"Acrylic Nail Extension (Per Hand)\",\"price\":3000,\"qty\":1,\"duration\":90,\"image\":\"https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=600&q=80&fit=crop\",\"serviceStatus\":\"unassigned\",\"assignedPartnerId\":null,\"assignedPartnerName\":null},{\"serviceId\":49,\"name\":\"Classic Cut\",\"price\":399,\"qty\":1,\"duration\":30,\"image\":\"https://images.unsplash.com/photo-1560869713-7d0a29430803?w=600&q=80&fit=crop\",\"serviceStatus\":\"unassigned\",\"assignedPartnerId\":null,\"assignedPartnerName\":null},{\"serviceId\":244,\"name\":\"Nail Art (One Finger)\",\"price\":99,\"qty\":1,\"duration\":30,\"image\":\"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80&fit=crop\",\"serviceStatus\":\"unassigned\",\"assignedPartnerId\":null,\"assignedPartnerName\":null},{\"serviceId\":176,\"name\":\"Organic Clean-Up - Dry Skin\",\"price\":799,\"qty\":1,\"duration\":45,\"image\":\"https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&q=80&fit=crop\",\"serviceStatus\":\"unassigned\",\"assignedPartnerId\":null,\"assignedPartnerName\":null}]',NULL,0,NULL,NULL,NULL,0,NULL,NULL,'cod',NULL,NULL),(4,'BYM-202607-669684',2,NULL,176,'Home','VRC Road','Dhanlakshmi Puram','Vaddipalem','Andhra Pradesh','524003',14.4426,79.9865,'2026-07-05 06:48:00','pending',2499.00,0.00,0.00,124.95,2623.95,1999.20,NULL,NULL,'pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-07-05 03:48:59','2026-07-05 03:48:59',NULL,'[{\"serviceId\":176,\"name\":\"Organic Clean-Up - Dry Skin\",\"price\":799,\"qty\":1,\"duration\":45,\"image\":\"https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&q=80&fit=crop\",\"serviceStatus\":\"unassigned\",\"assignedPartnerId\":null,\"assignedPartnerName\":null,\"addedByPackage\":true},{\"serviceId\":169,\"name\":\"Full Legs De-Tan (Fruit)\",\"price\":800,\"qty\":1,\"duration\":60,\"image\":\"https://images.unsplash.com/photo-1552693673-1bf958298935?w=600&q=80&fit=crop\",\"serviceStatus\":\"unassigned\",\"assignedPartnerId\":null,\"assignedPartnerName\":null,\"addedByPackage\":true},{\"serviceId\":194,\"name\":\"Insta Glow Facial\",\"price\":2000,\"qty\":1,\"duration\":60,\"image\":\"https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&q=80&fit=crop\",\"serviceStatus\":\"unassigned\",\"assignedPartnerId\":null,\"assignedPartnerName\":null,\"addedByPackage\":true}]',NULL,0,NULL,6,NULL,0,NULL,NULL,'cod',NULL,NULL),(5,'BYM-202607-955746',1,NULL,41,'Home','Railway Gate Lane','ఖైరతాబాద్','Hyderabad','Telangana','500004',17.4107,78.4614,'2026-07-22 05:51:00','pending',300.00,0.00,0.00,15.00,315.00,240.00,NULL,NULL,'pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-07-22 03:52:26','2026-07-22 03:52:26',3,'[{\"serviceId\":41,\"name\":\"Beard Color\",\"price\":300,\"qty\":1,\"duration\":20,\"image\":null,\"serviceStatus\":\"unassigned\",\"assignedPartnerId\":null,\"assignedPartnerName\":null}]',NULL,0,NULL,NULL,NULL,0,NULL,NULL,'online',NULL,NULL),(6,'BYM-202607-110837',1,NULL,38,'Home','Railway Gate Lane','ఖైరతాబాద్','Hyderabad','Telangana','500004',17.4107,78.4614,'2026-07-22 05:52:00','pending',897.00,0.00,0.00,44.85,941.85,717.60,NULL,NULL,'pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-07-22 03:52:44','2026-07-22 03:52:44',3,'[{\"serviceId\":38,\"name\":\"Haircut\",\"price\":299,\"qty\":3,\"duration\":30,\"image\":null,\"serviceStatus\":\"unassigned\",\"assignedPartnerId\":null,\"assignedPartnerName\":null}]',NULL,0,NULL,NULL,NULL,0,NULL,NULL,'online',NULL,NULL),(7,'BYM-202607-566703',1,NULL,41,'Home','Railway Gate Lane','ఖైరతాబాద్','Hyderabad','Telangana','500004',17.4107,78.4614,'2026-07-22 05:58:00','pending',499.00,0.00,0.00,24.95,523.95,399.20,NULL,NULL,'pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-07-22 03:58:31','2026-07-22 03:58:31',3,'[{\"serviceId\":41,\"name\":\"Beard Color\",\"price\":300,\"qty\":1,\"duration\":20,\"image\":null,\"serviceStatus\":\"unassigned\",\"assignedPartnerId\":null,\"assignedPartnerName\":null},{\"serviceId\":40,\"name\":\"Beard Trim\",\"price\":199,\"qty\":1,\"duration\":15,\"image\":null,\"serviceStatus\":\"unassigned\",\"assignedPartnerId\":null,\"assignedPartnerName\":null}]',NULL,0,NULL,NULL,NULL,0,NULL,NULL,'online',NULL,NULL),(8,'BYM-202607-117496',1,NULL,41,'Home','Railway Gate Lane','ఖైరతాబాద్','Hyderabad','Telangana','500004',17.4107,78.4614,'2026-07-22 05:58:00','pending',300.00,0.00,0.00,15.00,315.00,240.00,NULL,NULL,'pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-07-22 03:58:44','2026-07-22 03:58:44',3,'[{\"serviceId\":41,\"name\":\"Beard Color\",\"price\":300,\"qty\":1,\"duration\":20,\"image\":null,\"serviceStatus\":\"unassigned\",\"assignedPartnerId\":null,\"assignedPartnerName\":null}]',NULL,0,NULL,NULL,NULL,0,NULL,NULL,'online',NULL,NULL),(9,'BYM-202607-805608',1,NULL,251,'Home','Test St',NULL,'Nellore','AP','524001',14.44,79.98,'2026-07-23 10:00:00','pending',3000.00,0.00,0.00,150.00,3150.00,2400.00,NULL,NULL,'pending',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'2026-07-22 05:39:18','2026-07-22 05:39:18',NULL,'[{\"serviceId\":251,\"name\":\"Acrylic Nail Extension (Per Hand)\",\"price\":3000,\"qty\":1,\"duration\":90,\"image\":null,\"serviceStatus\":\"unassigned\",\"assignedPartnerId\":null,\"assignedPartnerName\":null}]',NULL,0,NULL,NULL,NULL,0,NULL,NULL,'online',NULL,NULL);
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
) ENGINE=InnoDB AUTO_INCREMENT=2250 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
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
) ENGINE=InnoDB AUTO_INCREMENT=166 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (1,NULL,NULL,'Direct test','Test body','{}','promo',0,'2026-05-25 06:53:31','2026-05-25 06:53:31','2026-05-25 06:53:31'),(2,NULL,NULL,'Weekend Special Offer! 🎉','Get {{discount}}% off on all beauty services this weekend. Book now!','{}','promo',0,'2026-05-25 07:50:38','2026-05-25 07:50:38','2026-05-25 07:50:38'),(8,NULL,NULL,'New Job Requests Available','There are new job requests near you. Go online to accept!','{}','promo',0,'2026-05-25 12:06:23','2026-05-25 12:06:23','2026-05-25 12:06:23'),(63,NULL,NULL,'Weekend Special Offer! 🎉','Get {{discount}}% off on all beauty services this weekend. Book now!','{}','promo',0,'2026-06-01 06:06:45','2026-06-01 06:06:45','2026-06-01 06:06:45'),(64,NULL,NULL,'Weekend Special Offer! 🎉','Get {{discount}}% off on all beauty services this weekend. Book now!','{}','promo',0,'2026-06-01 06:06:53','2026-06-01 06:06:53','2026-06-01 06:06:53'),(66,NULL,NULL,'Weekend Special Offer! 🎉','Get {{discount}}% off on all beauty services this weekend. Book now!','{}','promo',0,'2026-06-01 17:36:45','2026-06-01 17:36:45','2026-06-01 17:36:45'),(77,NULL,NULL,'Weekend Special Offer! 🎉','Get {{discount}}% off on all beauty services this weekend. Book now!','{}','promo',0,'2026-06-04 06:00:30','2026-06-04 06:00:30','2026-06-04 06:00:30'),(155,NULL,NULL,'Booking Placed','Your booking for Classic Haircut (BYM-202606-869708) has been placed.','{\"bookingId\":\"79\"}','booking',0,'2026-06-19 17:56:18','2026-06-19 17:56:18','2026-06-19 17:56:18'),(156,NULL,NULL,'Booking Placed','Your booking for Classic Haircut (BYM-202606-705180) has been placed.','{\"bookingId\":\"80\"}','booking',0,'2026-06-19 17:57:55','2026-06-19 17:57:55','2026-06-19 17:57:55'),(157,1,NULL,'Booking Placed','Your booking for 3 services (BYM-202607-127242) has been placed.','{\"bookingId\":\"1\"}','booking',0,'2026-07-05 03:01:28','2026-07-05 03:01:28','2026-07-05 03:01:28'),(158,3,NULL,'Booking Placed','Your booking for 4 services (BYM-202607-158442) has been placed.','{\"bookingId\":\"2\"}','booking',0,'2026-07-05 03:33:59','2026-07-05 03:33:59','2026-07-05 03:33:59'),(159,2,NULL,'Booking Placed','Your booking for 7 services (BYM-202607-886244) has been placed.','{\"bookingId\":\"3\"}','booking',0,'2026-07-05 03:47:51','2026-07-05 03:47:51','2026-07-05 03:47:51'),(160,2,NULL,'Booking Placed','Your booking for 3 services (BYM-202607-669684) has been placed.','{\"bookingId\":\"4\"}','booking',0,'2026-07-05 03:48:59','2026-07-05 03:48:59','2026-07-05 03:48:59'),(161,1,NULL,'Booking Placed','Your booking for Beard Color (BYM-202607-955746) has been placed.','{\"bookingId\":\"5\"}','booking',0,'2026-07-22 03:52:26','2026-07-22 03:52:26','2026-07-22 03:52:26'),(162,1,NULL,'Booking Placed','Your booking for Haircut (BYM-202607-110837) has been placed.','{\"bookingId\":\"6\"}','booking',0,'2026-07-22 03:52:44','2026-07-22 03:52:44','2026-07-22 03:52:44'),(163,1,NULL,'Booking Placed','Your booking for 2 services (BYM-202607-566703) has been placed.','{\"bookingId\":\"7\"}','booking',0,'2026-07-22 03:58:31','2026-07-22 03:58:31','2026-07-22 03:58:31'),(164,1,NULL,'Booking Placed','Your booking for Beard Color (BYM-202607-117496) has been placed.','{\"bookingId\":\"8\"}','booking',0,'2026-07-22 03:58:44','2026-07-22 03:58:44','2026-07-22 03:58:44'),(165,1,NULL,'Booking Placed','Your booking for Acrylic Nail Extension (Per Hand) (BYM-202607-805608) has been placed.','{\"bookingId\":\"9\"}','booking',0,'2026-07-22 05:39:18','2026-07-22 05:39:18','2026-07-22 05:39:18');
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
INSERT INTO `offers` VALUES (3,'Spend ₹999, Get Underarm Waxing Free','Spend ₹999 or more on a single booking and get a free Underarm Waxing service.','min_spend','{\"amount\":999}',113,'2026-06-16 00:00:00','2026-08-01 00:00:00',1,NULL,300,2,NULL,'2026-06-17 10:00:45','2026-06-17 14:48:23','http://localhost:3000/uploads/1781707702524-68288955.png',20.00,80.00,5.00),(4,'Book a Facial + Haircut, Get Threading Free','Add both Deep Cleansing Facial and Classic Haircut to your booking to get Eyebrow Threading free.','specific_services','{\"serviceIds\":[1,2]}',113,'2026-06-16 00:00:00','2026-08-01 00:00:00',1,NULL,200,1,NULL,'2026-06-17 10:00:45','2026-06-17 14:49:27','http://localhost:3000/uploads/1781707765934-913621709.png',20.00,80.00,5.00),(5,'Book 3 Services, Get 1 Free','Add any 3 services to your booking and get a 4th service free.','min_count','{\"count\":3}',113,'2026-06-16 00:00:00','2026-08-01 00:00:00',1,NULL,150,0,NULL,'2026-06-17 10:00:45','2026-06-17 14:49:08','http://localhost:3000/uploads/1781707746328-601288431.png',20.00,80.00,5.00);
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
) ENGINE=InnoDB AUTO_INCREMENT=61 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `otps`
--

LOCK TABLES `otps` WRITE;
/*!40000 ALTER TABLE `otps` DISABLE KEYS */;
INSERT INTO `otps` VALUES (1,'7997753587','331162','partner','2026-05-25 07:20:54',0,1,'2026-05-25 07:15:54','2026-05-25 07:19:50'),(2,'7997753587','493154','partner','2026-05-25 07:24:50',1,1,'2026-05-25 07:19:50','2026-05-25 07:24:32'),(3,'7997753587','496439','partner','2026-05-25 07:29:32',0,1,'2026-05-25 07:24:32','2026-05-25 07:30:29'),(4,'7997753587','633436','partner','2026-05-25 07:35:29',0,1,'2026-05-25 07:30:29','2026-06-04 09:38:58'),(5,'9865321452','785686','partner','2026-05-25 07:36:01',0,0,'2026-05-25 07:31:01','2026-05-25 07:31:01'),(6,'9999999999','1234','partner','2026-05-25 07:52:30',1,1,'2026-05-25 07:47:30','2026-05-25 07:47:37'),(7,'7997753587','1234','user','2026-05-25 10:13:18',0,1,'2026-05-25 10:08:18','2026-05-25 10:08:24'),(8,'7997753587','1234','user','2026-05-25 10:57:11',0,1,'2026-05-25 10:52:11','2026-05-25 10:52:14'),(9,'7997753587','1234','user','2026-05-25 17:44:01',0,1,'2026-05-25 17:39:01','2026-05-25 17:39:01'),(11,'7997753587','1234','user','2026-05-25 17:48:44',0,1,'2026-05-25 17:43:44','2026-05-25 17:43:45'),(13,'7997753587','1234','user','2026-05-25 17:49:08',0,1,'2026-05-25 17:44:08','2026-05-25 17:44:08'),(15,'7997753587','1234','user','2026-05-25 17:49:31',0,1,'2026-05-25 17:44:31','2026-05-25 17:44:31'),(18,'7997753587','1234','user','2026-05-25 17:50:56',0,1,'2026-05-25 17:45:57','2026-05-25 17:45:57'),(21,'7997753587','1234','user','2026-05-25 17:52:10',0,1,'2026-05-25 17:47:10','2026-05-25 17:47:10'),(23,'7997753587','1234','user','2026-05-25 17:52:10',0,1,'2026-05-25 17:47:10','2026-05-25 17:47:10'),(25,'7997753587','1234','user','2026-05-26 12:12:54',0,1,'2026-05-26 12:07:54','2026-05-26 12:07:58'),(26,'7997753587','1234','user','2026-05-26 13:19:28',0,1,'2026-05-26 13:14:28','2026-05-26 13:14:31'),(27,'7997753587','1234','user','2026-05-26 14:10:38',0,1,'2026-05-26 14:05:38','2026-05-26 14:05:47'),(28,'7997753587','1234','user','2026-06-01 04:36:30',0,1,'2026-06-01 04:31:30','2026-06-01 04:31:34'),(29,'9494979494','1234','partner','2026-06-01 17:09:20',0,1,'2026-06-01 17:04:20','2026-06-01 17:04:24'),(30,'9876543210','1234','partner','2026-06-01 17:18:53',1,1,'2026-06-01 17:13:53','2026-06-01 17:14:10'),(31,'9876543210','1234','partner','2026-06-01 17:19:10',0,1,'2026-06-01 17:14:10','2026-06-01 17:14:11'),(33,'7997753587','1234','user','2026-06-01 17:42:30',0,1,'2026-06-01 17:37:30','2026-06-01 17:37:38'),(36,'7997753587','1234','user','2026-06-04 05:56:07',0,1,'2026-06-04 05:51:07','2026-06-04 05:51:10'),(37,'7997753587','1234','partner','2026-06-04 09:43:58',0,1,'2026-06-04 09:38:58','2026-06-04 09:39:02'),(38,'9999999999','1234','partner','2026-06-04 09:44:32',0,1,'2026-06-04 09:39:32','2026-06-04 09:39:37'),(39,'7997753587','1234','partner','2026-06-04 09:45:11',1,1,'2026-06-04 09:40:11','2026-06-04 09:40:17'),(41,'7997753587','1234','partner','2026-06-04 12:44:05',0,1,'2026-06-04 12:39:05','2026-06-04 12:39:08'),(42,'7997753587','1234','user','2026-06-08 11:15:24',0,1,'2026-06-08 11:10:24','2026-06-08 11:10:27'),(43,'7997753587','1234','partner','2026-06-17 03:47:41',0,1,'2026-06-17 03:42:41','2026-06-17 03:42:47'),(44,'7997753587','1234','user','2026-06-17 03:59:22',0,1,'2026-06-17 03:54:22','2026-06-17 03:54:48'),(45,'7997753587','1234','user','2026-06-17 05:57:11',0,1,'2026-06-17 05:52:11','2026-06-17 05:52:17'),(47,'7997753587','1234','user','2026-06-17 07:14:08',0,1,'2026-06-17 07:09:08','2026-06-17 07:09:12'),(48,'7997753587','1234','user','2026-06-17 07:22:16',0,1,'2026-06-17 07:17:16','2026-06-17 07:17:21'),(50,'7997753587','1234','user','2026-06-17 11:16:02',0,1,'2026-06-17 11:11:02','2026-06-17 11:11:07'),(51,'7997753587','1234','user','2026-06-17 11:18:07',0,1,'2026-06-17 11:13:07','2026-06-17 11:13:15'),(52,'7997753587','1234','user','2026-06-17 11:33:23',0,1,'2026-06-17 11:28:23','2026-06-17 11:28:26'),(53,'7997753587','1234','user','2026-06-17 11:47:21',0,1,'2026-06-17 11:42:21','2026-06-17 11:42:25'),(54,'9876543210','1234','user','2026-06-19 18:01:12',0,1,'2026-06-19 17:56:12','2026-06-19 17:56:13'),(55,'9876543210','1234','user','2026-06-19 18:02:48',0,1,'2026-06-19 17:57:48','2026-06-19 17:57:49'),(56,'7997753587','1234','user','2026-06-22 17:41:21',0,1,'2026-06-22 17:36:21','2026-06-22 17:36:26'),(57,'9990001111','1234','user','2026-07-05 03:05:24',0,1,'2026-07-05 03:00:24','2026-07-05 03:00:26'),(58,'9990001111','1234','user','2026-07-05 03:06:16',0,1,'2026-07-05 03:01:16','2026-07-05 03:01:18'),(59,'7997753587','1234','user','2026-07-05 03:28:42',0,1,'2026-07-05 03:23:42','2026-07-05 03:23:43'),(60,'9990002222','1234','user','2026-07-05 03:38:45',0,1,'2026-07-05 03:33:45','2026-07-05 03:33:47');
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `partner_ledger_entries`
--

LOCK TABLES `partner_ledger_entries` WRITE;
/*!40000 ALTER TABLE `partner_ledger_entries` DISABLE KEYS */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `partner_services`
--

LOCK TABLES `partner_services` WRITE;
/*!40000 ALTER TABLE `partner_services` DISABLE KEYS */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
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
  `source` enum('app','website') NOT NULL DEFAULT 'app',
  `professions` text DEFAULT NULL,
  `gender` enum('female','male') DEFAULT NULL,
  `homeServicesConsent` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `phone` (`phone`),
  UNIQUE KEY `phone_2` (`phone`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `email_2` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `partners`
--

LOCK TABLES `partners` WRITE;
/*!40000 ALTER TABLE `partners` DISABLE KEYS */;
INSERT INTO `partners` VALUES (2,'sdfsdf','9898989889','lsd@gmail.com',NULL,NULL,4,NULL,NULL,NULL,'Mumbai',NULL,NULL,NULL,NULL,'[5]',NULL,NULL,NULL,NULL,NULL,0,0,0.00,0.00,'pending','[]',NULL,'2026-07-08 09:39:15','2026-07-08 09:39:15',NULL,0.00,'app','[\"Mehendi\",\"Spa Therapist\"]','male',0);
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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
INSERT INTO `payments` VALUES (1,9,1,'order_TGR5qUCKx1EAUB',NULL,NULL,3150.00,'INR','created',NULL,NULL,NULL,'2026-07-22 05:39:27','2026-07-22 05:39:27');
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reviews`
--

LOCK TABLES `reviews` WRITE;
/*!40000 ALTER TABLE `reviews` DISABLE KEYS */;
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
  `showOnHome` tinyint(1) NOT NULL DEFAULT 0,
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
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `service_categories`
--

LOCK TABLES `service_categories` WRITE;
/*!40000 ALTER TABLE `service_categories` DISABLE KEYS */;
INSERT INTO `service_categories` VALUES (2,'Hair Spa','Nourishing hair spa treatments for strong, shiny, and healthy hair',NULL,'http://localhost:3000/uploads/category-hair-spa.png',1,3,'2026-05-25 06:59:38','2026-07-22 06:54:16',NULL,20.00,80.00,5.00,1),(4,'Waxing','Smooth and hair-free skin with professional waxing services',NULL,'http://localhost:3000/uploads/category-waxing.png',1,8,'2026-05-25 06:59:38','2026-07-22 06:54:16',NULL,20.00,80.00,5.00,1),(5,'Pedicure','Relaxing pedicure treatments for beautiful, well-groomed feet',NULL,'http://localhost:3000/uploads/category-pedicure.png',1,12,'2026-05-25 06:59:38','2026-07-22 06:54:16',NULL,20.00,80.00,5.00,1),(6,'Haircut','Expert haircuts and styling by professional hair stylists',NULL,'http://localhost:3000/uploads/category-haircut.png',1,2,'2026-05-25 06:59:38','2026-07-22 06:54:16',NULL,20.00,80.00,5.00,1),(7,'Bridal Services','Stunning bridal makeup packages for your most special day',NULL,'http://localhost:3000/uploads/category-bridal-makeup.png',1,16,'2026-05-25 06:59:38','2026-07-14 04:23:30',NULL,20.00,80.00,5.00,0),(8,'Threading','Precise eyebrow and facial hair threading for defined features',NULL,'http://localhost:3000/uploads/category-threading.png',1,7,'2026-05-25 06:59:38','2026-07-22 06:54:16',NULL,20.00,80.00,5.00,1),(9,'Massage','Therapeutic massage services for relaxation and wellness',NULL,'http://localhost:3000/uploads/category-massage.png',1,8,'2026-05-25 06:59:38','2026-07-22 06:54:16',NULL,20.00,80.00,5.00,1),(10,'Manicure','Beautiful and well-groomed nails with expert manicure services',NULL,'http://localhost:3000/uploads/category-manicure.png',1,13,'2026-05-25 06:59:38','2026-07-22 06:54:16',NULL,20.00,80.00,5.00,1),(12,'Nail Art','Creative and trendy nail art designs by expert nail technicians',NULL,'http://localhost:3000/uploads/category-nail-art.png',1,15,'2026-05-25 06:59:38','2026-07-22 06:54:16','[]',20.00,80.00,5.00,1),(18,'Men Grooming',NULL,NULL,'http://localhost:3000/uploads/category-men-grooming.png',1,1,'2026-07-14 04:23:30','2026-07-14 04:23:30','[]',20.00,80.00,5.00,0),(19,'Hair Colour',NULL,NULL,'http://localhost:3000/uploads/category-hair-colour.png',1,4,'2026-07-14 04:23:30','2026-07-14 04:23:30','[]',20.00,80.00,5.00,0),(20,'Head Massage',NULL,NULL,'http://localhost:3000/uploads/category-head-massage.png',1,5,'2026-07-14 04:23:30','2026-07-14 04:23:30','[]',20.00,80.00,5.00,0),(21,'Hair Treatments',NULL,NULL,'http://localhost:3000/uploads/category-hair-treatments.png',1,6,'2026-07-14 04:23:30','2026-07-22 06:54:16','[]',20.00,80.00,5.00,1),(22,'De-Tan',NULL,NULL,'http://localhost:3000/uploads/category-de-tan.png',1,9,'2026-07-14 04:23:30','2026-07-14 04:23:30','[]',20.00,80.00,5.00,0),(23,'Facials',NULL,NULL,'http://localhost:3000/uploads/category-facials.png',1,10,'2026-07-14 04:23:30','2026-07-14 04:23:30','[]',20.00,80.00,5.00,0),(24,'Peeloff Mask',NULL,NULL,'http://localhost:3000/uploads/category-peeloff-mask.png',1,11,'2026-07-14 04:23:30','2026-07-14 04:23:30','[]',20.00,80.00,5.00,0),(25,'Mehndi',NULL,NULL,'http://localhost:3000/uploads/category-mehndi.png',1,14,'2026-07-14 04:23:30','2026-07-14 04:23:30','[]',20.00,80.00,5.00,0);
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
  `showOnHome` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=46 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `service_packages`
--

LOCK TABLES `service_packages` WRITE;
/*!40000 ALTER TABLE `service_packages` DISABLE KEYS */;
INSERT INTO `service_packages` VALUES (6,'Facial Services Combo','Complete facial treatment package with cleansing, de-tan, and hydrating HydraFacial care.','http://localhost:3000/uploads/package-facial-combo.png','fixed',2499.00,3297.00,NULL,NULL,'[{\"serviceId\":176,\"name\":\"Organic Clean-Up - Dry Skin\",\"price\":799,\"duration\":45,\"image\":\"https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&q=80&fit=crop\"},{\"serviceId\":169,\"name\":\"Full Legs De-Tan (Fruit)\",\"price\":800,\"duration\":60,\"image\":\"https://images.unsplash.com/photo-1552693673-1bf958298935?w=600&q=80&fit=crop\"},{\"serviceId\":194,\"name\":\"Insta Glow Facial\",\"price\":2000,\"duration\":60,\"image\":\"https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&q=80&fit=crop\"}]',1,NULL,NULL,'2026-07-05 02:23:14','2026-07-05 02:23:14','[]',20.00,80.00,5.00,1),(7,'Hair Therapy Combo','Premium hair spa package with deep conditioning, keratin treatment, and scalp therapy.','http://localhost:3000/uploads/package-hair-therapy-combo.png','fixed',2199.00,2897.00,NULL,NULL,'[{\"serviceId\":53,\"name\":\"Hair Spa - Men (Matrix)\",\"price\":600,\"duration\":60,\"image\":\"https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&q=80&fit=crop\"},{\"serviceId\":87,\"name\":\"Keratin (Men)\",\"price\":5999,\"duration\":90,\"image\":\"https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=600&q=80&fit=crop\"},{\"serviceId\":81,\"name\":\"HairFall Therapy\",\"price\":1999,\"duration\":45,\"image\":\"https://images.unsplash.com/photo-1583795484071-3c453e3a7c71?w=600&q=80&fit=crop\"}]',1,NULL,NULL,'2026-07-05 02:23:14','2026-07-05 02:23:14','[]',20.00,80.00,5.00,1),(8,'Full Body Pampering Combo','Complete relaxation package with a full body massage, full body waxing, and spa pedicure.','http://localhost:3000/uploads/package-full-body-combo.png','fixed',2999.00,3697.00,NULL,NULL,'[{\"serviceId\":269,\"name\":\"Aroma Relaxing Therapy\",\"price\":1999,\"duration\":60,\"image\":\"https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&q=80&fit=crop\"},{\"serviceId\":149,\"name\":\"Full Body Wax (Honey)\",\"price\":2200,\"duration\":120,\"image\":\"https://images.unsplash.com/photo-1526413232644-8a40f03cc03b?w=600&q=80&fit=crop\"},{\"serviceId\":211,\"name\":\"Glow Boosting Pedicure\",\"price\":1099,\"duration\":60,\"image\":\"https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=600&q=80&fit=crop\"}]',1,NULL,NULL,'2026-07-05 02:23:14','2026-07-05 02:23:14','[]',20.00,80.00,5.00,1),(9,'Any 3 @ ₹999','Choose any 3 services from our premium range',NULL,'flexible',999.00,1299.00,3,NULL,'[]',0,NULL,NULL,'2026-07-05 02:43:24','2026-07-24 06:37:47','[]',20.00,80.00,5.00,0),(10,'Any 5 @ ₹1999','Choose any 5 services from our premium range',NULL,'flexible',1999.00,2799.00,5,NULL,'[]',0,NULL,NULL,'2026-07-05 02:43:24','2026-07-24 06:37:47','[]',20.00,80.00,5.00,0),(11,'Any 7 @ ₹2999','Choose any 7 services from our premium range',NULL,'flexible',2999.00,4099.00,7,NULL,'[]',0,NULL,NULL,'2026-07-05 02:43:24','2026-07-24 06:37:47','[]',20.00,80.00,5.00,0),(13,'Waxing & Threading Combo','Smooth legs, underarms and clean brows in one go.','https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=600&q=80&fit=crop','fixed',749.00,926.00,NULL,NULL,'[{\"serviceId\":135,\"name\":\"Full Legs Wax (Roll-on)\",\"price\":700,\"duration\":45,\"image\":\"https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=600&q=80&fit=crop\",\"qty\":1},{\"serviceId\":113,\"name\":\"Under Arms Wax (Honey)\",\"price\":200,\"duration\":15,\"image\":\"https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=600&q=80&fit=crop\",\"qty\":1},{\"serviceId\":96,\"name\":\"Eyebrows Threading\",\"price\":50,\"duration\":15,\"image\":\"https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600&q=80&fit=crop\",\"qty\":1},{\"serviceId\":97,\"name\":\"Upper Lip Threading\",\"price\":50,\"duration\":10,\"image\":\"https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=600&q=80&fit=crop\",\"qty\":1}]',1,NULL,NULL,'2026-07-10 01:27:33','2026-07-10 03:32:31','[]',20.00,80.00,5.00,1),(14,'Full Body Wax Package','Complete full body waxing with brow and lip threading.','https://images.unsplash.com/photo-1526413232644-8a40f03cc03b?w=600&q=80&fit=crop','fixed',1349.00,1627.00,NULL,NULL,'[{\"serviceId\":149,\"name\":\"Full Body Wax (Honey)\",\"price\":2200,\"duration\":120,\"image\":\"https://images.unsplash.com/photo-1526413232644-8a40f03cc03b?w=600&q=80&fit=crop\",\"qty\":1},{\"serviceId\":96,\"name\":\"Eyebrows Threading\",\"price\":50,\"duration\":15,\"image\":\"https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600&q=80&fit=crop\",\"qty\":1},{\"serviceId\":97,\"name\":\"Upper Lip Threading\",\"price\":50,\"duration\":10,\"image\":\"https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=600&q=80&fit=crop\",\"qty\":1}]',1,NULL,NULL,'2026-07-10 01:27:34','2026-07-10 01:27:34','[]',20.00,80.00,5.00,0),(15,'Cleanup & Glow Combo','Skin cleanup, de-tan and waxing for an instant glow.','https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&q=80&fit=crop','fixed',1699.00,2224.00,NULL,NULL,'[{\"serviceId\":176,\"name\":\"Organic Clean-Up - Dry Skin\",\"price\":799,\"duration\":45,\"image\":\"https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&q=80&fit=crop\",\"qty\":1},{\"serviceId\":169,\"name\":\"Full Legs De-Tan (Fruit)\",\"price\":800,\"duration\":60,\"image\":\"https://images.unsplash.com/photo-1552693673-1bf958298935?w=600&q=80&fit=crop\",\"qty\":1},{\"serviceId\":135,\"name\":\"Full Legs Wax (Roll-on)\",\"price\":700,\"duration\":45,\"image\":\"https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=600&q=80&fit=crop\",\"qty\":1},{\"serviceId\":113,\"name\":\"Under Arms Wax (Honey)\",\"price\":200,\"duration\":15,\"image\":\"https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=600&q=80&fit=crop\",\"qty\":1},{\"serviceId\":96,\"name\":\"Eyebrows Threading\",\"price\":50,\"duration\":15,\"image\":\"https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600&q=80&fit=crop\",\"qty\":1},{\"serviceId\":97,\"name\":\"Upper Lip Threading\",\"price\":50,\"duration\":10,\"image\":\"https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=600&q=80&fit=crop\",\"qty\":1}]',1,NULL,NULL,'2026-07-10 01:27:34','2026-07-10 01:27:34','[]',20.00,80.00,5.00,0),(16,'Hair Spa & Wax Combo','Nourishing hair spa paired with de-tan and waxing.','https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&q=80&fit=crop','fixed',1799.00,2324.00,NULL,NULL,'[{\"serviceId\":53,\"name\":\"Hair Spa - Men (Matrix)\",\"price\":600,\"duration\":60,\"image\":\"https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&q=80&fit=crop\",\"qty\":1},{\"serviceId\":169,\"name\":\"Full Legs De-Tan (Fruit)\",\"price\":800,\"duration\":60,\"image\":\"https://images.unsplash.com/photo-1552693673-1bf958298935?w=600&q=80&fit=crop\",\"qty\":1},{\"serviceId\":135,\"name\":\"Full Legs Wax (Roll-on)\",\"price\":700,\"duration\":45,\"image\":\"https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=600&q=80&fit=crop\",\"qty\":1},{\"serviceId\":113,\"name\":\"Under Arms Wax (Honey)\",\"price\":200,\"duration\":15,\"image\":\"https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=600&q=80&fit=crop\",\"qty\":1},{\"serviceId\":96,\"name\":\"Eyebrows Threading\",\"price\":50,\"duration\":15,\"image\":\"https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600&q=80&fit=crop\",\"qty\":1},{\"serviceId\":97,\"name\":\"Upper Lip Threading\",\"price\":50,\"duration\":10,\"image\":\"https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=600&q=80&fit=crop\",\"qty\":1}]',1,NULL,NULL,'2026-07-10 01:27:34','2026-07-10 01:27:34','[]',20.00,80.00,5.00,0),(17,'Facial Glow Combo','Deep cleansing facial, de-tan and waxing bundle.','https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=600&q=80&fit=crop','fixed',1999.00,2724.00,NULL,NULL,'[{\"serviceId\":176,\"name\":\"Organic Clean-Up - Dry Skin\",\"price\":799,\"duration\":75,\"image\":\"https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=600&q=80&fit=crop\",\"qty\":1},{\"serviceId\":169,\"name\":\"Full Legs De-Tan (Fruit)\",\"price\":800,\"duration\":60,\"image\":\"https://images.unsplash.com/photo-1552693673-1bf958298935?w=600&q=80&fit=crop\",\"qty\":1},{\"serviceId\":135,\"name\":\"Full Legs Wax (Roll-on)\",\"price\":700,\"duration\":45,\"image\":\"https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=600&q=80&fit=crop\",\"qty\":1},{\"serviceId\":113,\"name\":\"Under Arms Wax (Honey)\",\"price\":200,\"duration\":15,\"image\":\"https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=600&q=80&fit=crop\",\"qty\":1},{\"serviceId\":96,\"name\":\"Eyebrows Threading\",\"price\":50,\"duration\":15,\"image\":\"https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600&q=80&fit=crop\",\"qty\":1},{\"serviceId\":97,\"name\":\"Upper Lip Threading\",\"price\":50,\"duration\":10,\"image\":\"https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=600&q=80&fit=crop\",\"qty\":1}]',1,NULL,NULL,'2026-07-10 01:27:34','2026-07-10 01:27:34','[]',20.00,80.00,5.00,0),(18,'Wax & Mani-Pedi Combo','Waxing, threading, gel pedicure and manicure combo.','https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=600&q=80&fit=crop','fixed',1599.00,2124.00,NULL,NULL,'[{\"serviceId\":135,\"name\":\"Full Legs Wax (Roll-on)\",\"price\":700,\"duration\":45,\"image\":\"https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=600&q=80&fit=crop\",\"qty\":1},{\"serviceId\":113,\"name\":\"Under Arms Wax (Honey)\",\"price\":200,\"duration\":15,\"image\":\"https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=600&q=80&fit=crop\",\"qty\":1},{\"serviceId\":208,\"name\":\"Aroma Pedicure\",\"price\":899,\"duration\":60,\"image\":\"https://images.unsplash.com/photo-1604902396830-aca29e19b067?w=600&q=80&fit=crop\",\"qty\":1},{\"serviceId\":220,\"name\":\"Lavendor Manicure\",\"price\":649,\"duration\":45,\"image\":\"https://images.unsplash.com/photo-1604902396830-aca29e19b067?w=600&q=80&fit=crop\",\"qty\":1},{\"serviceId\":96,\"name\":\"Eyebrows Threading\",\"price\":50,\"duration\":15,\"image\":\"https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600&q=80&fit=crop\",\"qty\":1},{\"serviceId\":97,\"name\":\"Upper Lip Threading\",\"price\":50,\"duration\":10,\"image\":\"https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=600&q=80&fit=crop\",\"qty\":1}]',1,NULL,NULL,'2026-07-10 01:27:34','2026-07-10 01:27:34','[]',20.00,80.00,5.00,0),(19,'Pedi Spa Combo','Spa pedicure, hair spa and waxing for total pampering.','https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=600&q=80&fit=crop','fixed',1899.00,2475.00,NULL,NULL,'[{\"serviceId\":211,\"name\":\"Glow Boosting Pedicure\",\"price\":1099,\"duration\":60,\"image\":\"https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=600&q=80&fit=crop\",\"qty\":1},{\"serviceId\":53,\"name\":\"Hair Spa - Men (Matrix)\",\"price\":600,\"duration\":60,\"image\":\"https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&q=80&fit=crop\",\"qty\":1},{\"serviceId\":135,\"name\":\"Full Legs Wax (Roll-on)\",\"price\":700,\"duration\":45,\"image\":\"https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=600&q=80&fit=crop\",\"qty\":1},{\"serviceId\":113,\"name\":\"Under Arms Wax (Honey)\",\"price\":200,\"duration\":15,\"image\":\"https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=600&q=80&fit=crop\",\"qty\":1},{\"serviceId\":96,\"name\":\"Eyebrows Threading\",\"price\":50,\"duration\":15,\"image\":\"https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600&q=80&fit=crop\",\"qty\":1}]',1,NULL,NULL,'2026-07-10 01:27:34','2026-07-10 01:27:34','[]',20.00,80.00,5.00,0),(20,'Hairstyle & Pedi Combo','Fresh haircut and blow dry with a relaxing spa pedicure and manicure.','https://images.unsplash.com/photo-1522337180988-2df4d5bf9ca6?w=600&q=80&fit=crop','fixed',1699.00,2097.00,NULL,NULL,'[{\"serviceId\":51,\"name\":\"Blow Dry Setting\",\"price\":999,\"duration\":60,\"image\":\"https://images.unsplash.com/photo-1522337180988-2df4d5bf9ca6?w=600&q=80&fit=crop\",\"qty\":1},{\"serviceId\":211,\"name\":\"Glow Boosting Pedicure\",\"price\":1099,\"duration\":60,\"image\":\"https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=600&q=80&fit=crop\",\"qty\":1},{\"serviceId\":220,\"name\":\"Lavendor Manicure\",\"price\":649,\"duration\":45,\"image\":\"https://images.unsplash.com/photo-1604902396830-aca29e19b067?w=600&q=80&fit=crop\",\"qty\":1}]',1,NULL,NULL,'2026-07-10 01:27:34','2026-07-10 01:27:34','[]',20.00,80.00,5.00,0),(21,'Waxing Offer',NULL,'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=600&q=80&fit=crop','fixed',1199.00,1300.00,NULL,NULL,'[{\"serviceId\":126,\"name\":\"Full Arms Wax (RICA)\",\"price\":450,\"duration\":30,\"image\":null},{\"serviceId\":134,\"name\":\"Full Legs Wax (RICA)\",\"price\":600,\"duration\":45,\"image\":null},{\"serviceId\":114,\"name\":\"Under Arms Wax (RICA)\",\"price\":250,\"duration\":15,\"image\":null}]',1,NULL,NULL,'2026-07-16 10:07:08','2026-07-16 10:07:08','[]',20.00,80.00,5.00,0),(22,'Glow & Smooth',NULL,'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&q=80&fit=crop','fixed',1999.00,3199.00,NULL,NULL,'[{\"serviceId\":190,\"name\":\"Dry Fruit Facial\",\"price\":1200,\"duration\":60,\"image\":null},{\"serviceId\":209,\"name\":\"Lavendor Pedicure\",\"price\":699,\"duration\":45,\"image\":null},{\"serviceId\":126,\"name\":\"Full Arms Wax (RICA)\",\"price\":450,\"duration\":30,\"image\":null},{\"serviceId\":134,\"name\":\"Full Legs Wax (RICA)\",\"price\":600,\"duration\":45,\"image\":null},{\"serviceId\":114,\"name\":\"Under Arms Wax (RICA)\",\"price\":250,\"duration\":15,\"image\":null}]',1,NULL,NULL,'2026-07-16 10:07:08','2026-07-16 10:07:08','[]',20.00,80.00,5.00,0),(23,'Fresh Look',NULL,'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80&fit=crop','fixed',2499.00,5398.00,NULL,NULL,'[{\"serviceId\":189,\"name\":\"O3+ Cleanup\",\"price\":1200,\"duration\":45,\"image\":null},{\"serviceId\":204,\"name\":\"Bubblegum Pedicure\",\"price\":1499,\"duration\":60,\"image\":null},{\"serviceId\":215,\"name\":\"Bubblegum Manicure\",\"price\":1399,\"duration\":45,\"image\":null},{\"serviceId\":126,\"name\":\"Full Arms Wax (RICA)\",\"price\":450,\"duration\":30,\"image\":null},{\"serviceId\":134,\"name\":\"Full Legs Wax (RICA)\",\"price\":600,\"duration\":45,\"image\":null},{\"serviceId\":114,\"name\":\"Under Arms Wax (RICA)\",\"price\":250,\"duration\":15,\"image\":null}]',1,NULL,NULL,'2026-07-16 10:07:08','2026-07-16 10:07:08','[]',20.00,80.00,5.00,0),(24,'Fresh Look Deluxe',NULL,'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=600&q=80&fit=crop','fixed',2699.00,4948.00,NULL,NULL,'[{\"serviceId\":193,\"name\":\"Party Glow Facial\",\"price\":1800,\"duration\":60,\"image\":null},{\"serviceId\":208,\"name\":\"Aroma Pedicure\",\"price\":899,\"duration\":45,\"image\":null},{\"serviceId\":219,\"name\":\"Aroma Manicure\",\"price\":749,\"duration\":40,\"image\":null},{\"serviceId\":127,\"name\":\"Full Arms Wax (Roll-on)\",\"price\":600,\"duration\":30,\"image\":null},{\"serviceId\":131,\"name\":\"Half Legs Wax (Roll-on)\",\"price\":600,\"duration\":30,\"image\":null},{\"serviceId\":115,\"name\":\"Under Arms Wax (Roll-on)\",\"price\":300,\"duration\":15,\"image\":null}]',1,NULL,NULL,'2026-07-16 10:07:08','2026-07-16 10:07:08','[]',20.00,80.00,5.00,0),(25,'O3 Bright Package',NULL,'https://images.unsplash.com/photo-1552693673-1bf958298935?w=600&q=80&fit=crop','fixed',1999.00,3200.00,NULL,NULL,'[{\"serviceId\":189,\"name\":\"O3+ Cleanup\",\"price\":1200,\"duration\":45,\"image\":null},{\"serviceId\":160,\"name\":\"Face De-Tan (O3+)\",\"price\":600,\"duration\":20,\"image\":null},{\"serviceId\":154,\"name\":\"Neck De-Tan (O3+)\",\"price\":400,\"duration\":15,\"image\":null},{\"serviceId\":166,\"name\":\"Full Hands De-Tan (O3+)\",\"price\":1000,\"duration\":30,\"image\":null}]',1,NULL,NULL,'2026-07-16 10:07:08','2026-07-16 10:07:08','[]',20.00,80.00,5.00,0),(26,'Honey Wax Package',NULL,'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=600&q=80&fit=crop','fixed',499.00,1080.00,NULL,NULL,'[{\"serviceId\":125,\"name\":\"Full Arms Wax (Honey)\",\"price\":380,\"duration\":30,\"image\":null},{\"serviceId\":133,\"name\":\"Full Legs Wax (Honey)\",\"price\":500,\"duration\":45,\"image\":null},{\"serviceId\":113,\"name\":\"Under Arms Wax (Honey)\",\"price\":200,\"duration\":15,\"image\":null}]',1,NULL,NULL,'2026-07-16 10:07:08','2026-07-16 10:07:08','[]',20.00,80.00,5.00,0),(27,'Rica Wax Package',NULL,'https://images.unsplash.com/photo-1526413232644-8a40f03cc03b?w=600&q=80&fit=crop','fixed',999.00,1300.00,NULL,NULL,'[{\"serviceId\":126,\"name\":\"Full Arms Wax (RICA)\",\"price\":450,\"duration\":30,\"image\":null},{\"serviceId\":134,\"name\":\"Full Legs Wax (RICA)\",\"price\":600,\"duration\":45,\"image\":null},{\"serviceId\":114,\"name\":\"Under Arms Wax (RICA)\",\"price\":250,\"duration\":15,\"image\":null}]',1,NULL,NULL,'2026-07-16 10:07:08','2026-07-16 10:07:08','[]',20.00,80.00,5.00,0),(28,'Cleanup & Wax Package',NULL,'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&q=80&fit=crop','fixed',1199.00,2029.00,NULL,NULL,'[{\"serviceId\":176,\"name\":\"Organic Clean-Up - Dry Skin\",\"price\":799,\"duration\":45,\"image\":null},{\"serviceId\":159,\"name\":\"Face De-Tan (Fruit)\",\"price\":360,\"duration\":20,\"image\":null},{\"serviceId\":117,\"name\":\"Half Arms Wax (Honey)\",\"price\":250,\"duration\":20,\"image\":null},{\"serviceId\":129,\"name\":\"Half Legs Wax (Honey)\",\"price\":420,\"duration\":30,\"image\":null},{\"serviceId\":113,\"name\":\"Under Arms Wax (Honey)\",\"price\":200,\"duration\":15,\"image\":null}]',1,NULL,NULL,'2026-07-16 10:07:08','2026-07-16 10:07:08','[]',20.00,80.00,5.00,0),(29,'Facial & Wax Package',NULL,'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=600&q=80&fit=crop','fixed',1799.00,2259.00,NULL,NULL,'[{\"serviceId\":178,\"name\":\"Fruit Facial\",\"price\":899,\"duration\":45,\"image\":null},{\"serviceId\":159,\"name\":\"Face De-Tan (Fruit)\",\"price\":360,\"duration\":20,\"image\":null},{\"serviceId\":125,\"name\":\"Full Arms Wax (Honey)\",\"price\":380,\"duration\":30,\"image\":null},{\"serviceId\":113,\"name\":\"Under Arms Wax (Honey)\",\"price\":200,\"duration\":15,\"image\":null},{\"serviceId\":129,\"name\":\"Half Legs Wax (Honey)\",\"price\":420,\"duration\":30,\"image\":null}]',1,NULL,NULL,'2026-07-16 10:07:08','2026-07-16 10:07:08','[]',20.00,80.00,5.00,0),(30,'Colour & Facial Package',NULL,'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&q=80&fit=crop','fixed',2499.00,3258.00,NULL,NULL,'[{\"serviceId\":74,\"name\":\"Root Touchup (Women)\",\"price\":1349,\"duration\":60,\"image\":null},{\"serviceId\":178,\"name\":\"Fruit Facial\",\"price\":899,\"duration\":45,\"image\":null},{\"serviceId\":159,\"name\":\"Face De-Tan (Fruit)\",\"price\":360,\"duration\":20,\"image\":null},{\"serviceId\":153,\"name\":\"Neck De-Tan (Fruit)\",\"price\":250,\"duration\":15,\"image\":null},{\"serviceId\":161,\"name\":\"Half Hands De-Tan (Fruit)\",\"price\":400,\"duration\":20,\"image\":null}]',1,NULL,NULL,'2026-07-16 10:07:08','2026-07-16 10:07:08','[]',20.00,80.00,5.00,0),(31,'Wax, Pedi & Facial Package',NULL,'https://images.unsplash.com/photo-1604902396830-aca29e19b067?w=600&q=80&fit=crop','fixed',1999.00,2678.00,NULL,NULL,'[{\"serviceId\":125,\"name\":\"Full Arms Wax (Honey)\",\"price\":380,\"duration\":30,\"image\":null},{\"serviceId\":113,\"name\":\"Under Arms Wax (Honey)\",\"price\":200,\"duration\":15,\"image\":null},{\"serviceId\":133,\"name\":\"Full Legs Wax (Honey)\",\"price\":500,\"duration\":45,\"image\":null},{\"serviceId\":209,\"name\":\"Lavendor Pedicure\",\"price\":699,\"duration\":45,\"image\":null},{\"serviceId\":178,\"name\":\"Fruit Facial\",\"price\":899,\"duration\":45,\"image\":null}]',1,NULL,NULL,'2026-07-16 10:07:08','2026-07-16 10:07:08','[]',20.00,80.00,5.00,0),(32,'Men Package 1',NULL,'https://images.unsplash.com/photo-1560869713-7d0a29430803?w=600&q=80&fit=crop','fixed',899.00,1358.00,NULL,NULL,'[{\"serviceId\":38,\"name\":\"Haircut\",\"price\":299,\"duration\":30,\"image\":null},{\"serviceId\":40,\"name\":\"Beard Trim\",\"price\":199,\"duration\":15,\"image\":null},{\"serviceId\":159,\"name\":\"Face De-Tan (Fruit)\",\"price\":360,\"duration\":20,\"image\":null},{\"serviceId\":165,\"name\":\"Full Hands De-Tan (Fruit)\",\"price\":500,\"duration\":30,\"image\":null}]',1,NULL,NULL,'2026-07-16 10:07:08','2026-07-16 10:07:08','[]',20.00,80.00,5.00,0),(33,'Men Package 2',NULL,'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80&fit=crop','fixed',1499.00,2007.00,NULL,NULL,'[{\"serviceId\":38,\"name\":\"Haircut\",\"price\":299,\"duration\":30,\"image\":null},{\"serviceId\":40,\"name\":\"Beard Trim\",\"price\":199,\"duration\":15,\"image\":null},{\"serviceId\":178,\"name\":\"Fruit Facial\",\"price\":899,\"duration\":45,\"image\":null},{\"serviceId\":159,\"name\":\"Face De-Tan (Fruit)\",\"price\":360,\"duration\":20,\"image\":null},{\"serviceId\":153,\"name\":\"Neck De-Tan (Fruit)\",\"price\":250,\"duration\":15,\"image\":null}]',1,NULL,NULL,'2026-07-16 10:07:08','2026-07-16 10:07:08','[]',20.00,80.00,5.00,0),(34,'Men Package 3',NULL,'https://images.unsplash.com/photo-1522337180988-2df4d5bf9ca6?w=600&q=80&fit=crop','fixed',1799.00,2297.00,NULL,NULL,'[{\"serviceId\":38,\"name\":\"Haircut\",\"price\":299,\"duration\":30,\"image\":null},{\"serviceId\":40,\"name\":\"Beard Trim\",\"price\":199,\"duration\":15,\"image\":null},{\"serviceId\":43,\"name\":\"Hair Colour (Loreal, Schwarzkopf)\",\"price\":1199,\"duration\":60,\"image\":null},{\"serviceId\":53,\"name\":\"Hair Spa - Men (Matrix)\",\"price\":600,\"duration\":30,\"image\":null}]',1,NULL,NULL,'2026-07-16 10:07:08','2026-07-16 10:07:08','[]',20.00,80.00,5.00,0),(35,'Wine Glow Package',NULL,'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80&fit=crop','fixed',1999.00,2748.00,NULL,NULL,'[{\"serviceId\":191,\"name\":\"Wine Facial\",\"price\":1200,\"duration\":60,\"image\":null},{\"serviceId\":205,\"name\":\"Wine Pedicure\",\"price\":799,\"duration\":45,\"image\":null},{\"serviceId\":216,\"name\":\"Wine Manicure\",\"price\":749,\"duration\":40,\"image\":null}]',1,NULL,NULL,'2026-07-16 10:07:08','2026-07-16 10:07:08','[]',20.00,80.00,5.00,0),(36,'Massage Combo',NULL,'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&q=80&fit=crop','fixed',1499.00,1697.00,NULL,NULL,'[{\"serviceId\":77,\"name\":\"Regular Oil Head Massage\",\"price\":499,\"duration\":30,\"image\":null},{\"serviceId\":262,\"name\":\"Foot Massage\",\"price\":499,\"duration\":30,\"image\":null},{\"serviceId\":263,\"name\":\"Back Massage\",\"price\":699,\"duration\":30,\"image\":null}]',1,NULL,NULL,'2026-07-16 10:07:08','2026-07-16 10:07:08','[]',20.00,80.00,5.00,0),(37,'DeTan Combo - Fruit',NULL,'https://images.unsplash.com/photo-1552693673-1bf958298935?w=600&q=80&fit=crop','fixed',799.00,1610.00,NULL,NULL,'[{\"serviceId\":159,\"name\":\"Face De-Tan (Fruit)\",\"price\":360,\"duration\":20,\"image\":null},{\"serviceId\":153,\"name\":\"Neck De-Tan (Fruit)\",\"price\":250,\"duration\":15,\"image\":null},{\"serviceId\":165,\"name\":\"Full Hands De-Tan (Fruit)\",\"price\":500,\"duration\":30,\"image\":null},{\"serviceId\":167,\"name\":\"Half Legs De-Tan (Fruit)\",\"price\":500,\"duration\":30,\"image\":null}]',1,NULL,NULL,'2026-07-16 10:07:08','2026-07-16 10:07:08','[]',20.00,80.00,5.00,0),(38,'DeTan Premium Combo',NULL,'https://images.unsplash.com/photo-1552693673-1bf958298935?w=600&q=80&fit=crop','fixed',1499.00,3000.00,NULL,NULL,'[{\"serviceId\":160,\"name\":\"Face De-Tan (O3+)\",\"price\":600,\"duration\":20,\"image\":null},{\"serviceId\":154,\"name\":\"Neck De-Tan (O3+)\",\"price\":400,\"duration\":15,\"image\":null},{\"serviceId\":166,\"name\":\"Full Hands De-Tan (O3+)\",\"price\":1000,\"duration\":30,\"image\":null},{\"serviceId\":168,\"name\":\"Half Legs De-Tan (O3+)\",\"price\":1000,\"duration\":30,\"image\":null}]',1,NULL,NULL,'2026-07-16 10:07:08','2026-07-16 10:07:08','[]',20.00,80.00,5.00,0),(39,'Any 4 @ ₹999','Choose any 4 services from our curated range',NULL,'flexible',999.00,1699.00,4,NULL,'[{\"serviceId\":49,\"name\":\"Classic Cut\",\"price\":399,\"duration\":30,\"image\":null},{\"serviceId\":77,\"name\":\"Regular Oil Head Massage\",\"price\":499,\"duration\":30,\"image\":null},{\"serviceId\":159,\"name\":\"Face De-Tan (Fruit)\",\"price\":360,\"duration\":20,\"image\":null},{\"serviceId\":189,\"name\":\"O3+ Cleanup\",\"price\":1200,\"duration\":45,\"image\":null},{\"serviceId\":264,\"name\":\"Face Massage\",\"price\":410,\"duration\":60,\"image\":null},{\"serviceId\":126,\"name\":\"Full Arms Wax (RICA)\",\"price\":450,\"duration\":30,\"image\":null},{\"serviceId\":130,\"name\":\"Half Legs Wax (RICA)\",\"price\":500,\"duration\":30,\"image\":null},{\"serviceId\":114,\"name\":\"Under Arms Wax (RICA)\",\"price\":250,\"duration\":15,\"image\":null},{\"serviceId\":153,\"name\":\"Neck De-Tan (Fruit)\",\"price\":250,\"duration\":15,\"image\":null},{\"serviceId\":266,\"name\":\"Neck Polish\",\"price\":499,\"duration\":60,\"image\":null},{\"serviceId\":157,\"name\":\"Blouse Line De-Tan (Fruit)\",\"price\":300,\"duration\":15,\"image\":null},{\"serviceId\":165,\"name\":\"Full Hands De-Tan (Fruit)\",\"price\":500,\"duration\":30,\"image\":null},{\"serviceId\":220,\"name\":\"Lavendor Manicure\",\"price\":649,\"duration\":40,\"image\":null},{\"serviceId\":262,\"name\":\"Foot Massage\",\"price\":499,\"duration\":30,\"image\":null},{\"serviceId\":263,\"name\":\"Back Massage\",\"price\":699,\"duration\":30,\"image\":null}]',1,NULL,NULL,'2026-07-24 06:37:47','2026-07-24 06:37:47','[]',20.00,80.00,5.00,0),(40,'Any 4 @ ₹999 (Men)','Choose any 4 services from our curated range',NULL,'flexible',999.00,1699.00,4,NULL,'[{\"serviceId\":38,\"name\":\"Haircut\",\"price\":299,\"duration\":30,\"image\":null},{\"serviceId\":40,\"name\":\"Beard Trim\",\"price\":199,\"duration\":15,\"image\":null},{\"serviceId\":41,\"name\":\"Beard Color\",\"price\":300,\"duration\":20,\"image\":null},{\"serviceId\":45,\"name\":\"Mustache Colour\",\"price\":200,\"duration\":15,\"image\":null},{\"serviceId\":43,\"name\":\"Hair Colour (Loreal, Schwarzkopf)\",\"price\":1199,\"duration\":60,\"image\":null},{\"serviceId\":77,\"name\":\"Regular Oil Head Massage\",\"price\":499,\"duration\":30,\"image\":null},{\"serviceId\":54,\"name\":\"Hair Spa - Men (Loreal)\",\"price\":800,\"duration\":30,\"image\":null},{\"serviceId\":159,\"name\":\"Face De-Tan (Fruit)\",\"price\":360,\"duration\":20,\"image\":null},{\"serviceId\":189,\"name\":\"O3+ Cleanup\",\"price\":1200,\"duration\":45,\"image\":null},{\"serviceId\":264,\"name\":\"Face Massage\",\"price\":410,\"duration\":60,\"image\":null},{\"serviceId\":153,\"name\":\"Neck De-Tan (Fruit)\",\"price\":250,\"duration\":15,\"image\":null},{\"serviceId\":266,\"name\":\"Neck Polish\",\"price\":499,\"duration\":60,\"image\":null},{\"serviceId\":165,\"name\":\"Full Hands De-Tan (Fruit)\",\"price\":500,\"duration\":30,\"image\":null},{\"serviceId\":262,\"name\":\"Foot Massage\",\"price\":499,\"duration\":30,\"image\":null},{\"serviceId\":263,\"name\":\"Back Massage\",\"price\":699,\"duration\":30,\"image\":null}]',1,NULL,NULL,'2026-07-24 06:37:47','2026-07-24 06:37:47','[]',20.00,80.00,5.00,0),(41,'Any 4 @ ₹1999','Choose any 4 services from our curated range',NULL,'flexible',1999.00,3199.00,4,NULL,'[{\"serviceId\":49,\"name\":\"Classic Cut\",\"price\":399,\"duration\":30,\"image\":null},{\"serviceId\":270,\"name\":\"Deep Moisture Massage\",\"price\":2499,\"duration\":60,\"image\":null},{\"serviceId\":163,\"name\":\"Face & Neck De-Tan (Fruit)\",\"price\":500,\"duration\":25,\"image\":null},{\"serviceId\":178,\"name\":\"Fruit Facial\",\"price\":899,\"duration\":45,\"image\":null},{\"serviceId\":175,\"name\":\"AntiAgeing Facial\",\"price\":1499,\"duration\":75,\"image\":null},{\"serviceId\":174,\"name\":\"Chocolate Mint Facial\",\"price\":999,\"duration\":60,\"image\":null},{\"serviceId\":182,\"name\":\"Gold Facial\",\"price\":2000,\"duration\":60,\"image\":null},{\"serviceId\":196,\"name\":\"Gold Peeloff\",\"price\":1299,\"duration\":30,\"image\":null},{\"serviceId\":126,\"name\":\"Full Arms Wax (RICA)\",\"price\":450,\"duration\":30,\"image\":null},{\"serviceId\":134,\"name\":\"Full Legs Wax (RICA)\",\"price\":600,\"duration\":45,\"image\":null},{\"serviceId\":114,\"name\":\"Under Arms Wax (RICA)\",\"price\":250,\"duration\":15,\"image\":null},{\"serviceId\":165,\"name\":\"Full Hands De-Tan (Fruit)\",\"price\":500,\"duration\":30,\"image\":null},{\"serviceId\":220,\"name\":\"Lavendor Manicure\",\"price\":649,\"duration\":40,\"image\":null},{\"serviceId\":209,\"name\":\"Lavendor Pedicure\",\"price\":699,\"duration\":45,\"image\":null},{\"serviceId\":262,\"name\":\"Foot Massage\",\"price\":499,\"duration\":30,\"image\":null}]',1,NULL,NULL,'2026-07-24 06:37:47','2026-07-24 06:37:47','[]',20.00,80.00,5.00,0),(42,'Any 5 @ ₹2999','Choose any 5 services from our curated range',NULL,'flexible',2999.00,4499.00,5,NULL,'[{\"serviceId\":50,\"name\":\"Creative Cut\",\"price\":1100,\"duration\":60,\"image\":null},{\"serviceId\":43,\"name\":\"Hair Colour (Loreal, Schwarzkopf)\",\"price\":1199,\"duration\":60,\"image\":null},{\"serviceId\":270,\"name\":\"Deep Moisture Massage\",\"price\":2499,\"duration\":60,\"image\":null},{\"serviceId\":164,\"name\":\"Face & Neck De-Tan (O3+)\",\"price\":800,\"duration\":25,\"image\":null},{\"serviceId\":182,\"name\":\"Gold Facial\",\"price\":2000,\"duration\":60,\"image\":null},{\"serviceId\":193,\"name\":\"Party Glow Facial\",\"price\":1800,\"duration\":60,\"image\":null},{\"serviceId\":175,\"name\":\"AntiAgeing Facial\",\"price\":1499,\"duration\":75,\"image\":null},{\"serviceId\":196,\"name\":\"Gold Peeloff\",\"price\":1299,\"duration\":30,\"image\":null},{\"serviceId\":195,\"name\":\"Vitamin-C Peeloff\",\"price\":999,\"duration\":30,\"image\":null},{\"serviceId\":126,\"name\":\"Full Arms Wax (RICA)\",\"price\":450,\"duration\":30,\"image\":null},{\"serviceId\":130,\"name\":\"Half Legs Wax (RICA)\",\"price\":500,\"duration\":30,\"image\":null},{\"serviceId\":114,\"name\":\"Under Arms Wax (RICA)\",\"price\":250,\"duration\":15,\"image\":null},{\"serviceId\":216,\"name\":\"Wine Manicure\",\"price\":749,\"duration\":40,\"image\":null},{\"serviceId\":205,\"name\":\"Wine Pedicure\",\"price\":799,\"duration\":45,\"image\":null},{\"serviceId\":262,\"name\":\"Foot Massage\",\"price\":499,\"duration\":30,\"image\":null},{\"serviceId\":263,\"name\":\"Back Massage\",\"price\":699,\"duration\":30,\"image\":null}]',1,NULL,NULL,'2026-07-24 06:37:47','2026-07-24 06:37:47','[]',20.00,80.00,5.00,0),(43,'Any 5 @ ₹3499','Choose any 5 services from our curated range',NULL,'flexible',3499.00,5199.00,5,NULL,'[{\"serviceId\":50,\"name\":\"Creative Cut\",\"price\":1100,\"duration\":60,\"image\":null},{\"serviceId\":53,\"name\":\"Hair Spa - Men (Matrix)\",\"price\":600,\"duration\":30,\"image\":null},{\"serviceId\":163,\"name\":\"Face & Neck De-Tan (Fruit)\",\"price\":500,\"duration\":25,\"image\":null},{\"serviceId\":175,\"name\":\"AntiAgeing Facial\",\"price\":1499,\"duration\":75,\"image\":null},{\"serviceId\":181,\"name\":\"Pearl Facial\",\"price\":1800,\"duration\":60,\"image\":null},{\"serviceId\":191,\"name\":\"Wine Facial\",\"price\":1200,\"duration\":60,\"image\":null},{\"serviceId\":194,\"name\":\"Insta Glow Facial\",\"price\":2000,\"duration\":60,\"image\":null},{\"serviceId\":196,\"name\":\"Gold Peeloff\",\"price\":1299,\"duration\":30,\"image\":null},{\"serviceId\":126,\"name\":\"Full Arms Wax (RICA)\",\"price\":450,\"duration\":30,\"image\":null},{\"serviceId\":130,\"name\":\"Half Legs Wax (RICA)\",\"price\":500,\"duration\":30,\"image\":null},{\"serviceId\":114,\"name\":\"Under Arms Wax (RICA)\",\"price\":250,\"duration\":15,\"image\":null},{\"serviceId\":161,\"name\":\"Half Hands De-Tan (Fruit)\",\"price\":400,\"duration\":20,\"image\":null},{\"serviceId\":167,\"name\":\"Half Legs De-Tan (Fruit)\",\"price\":500,\"duration\":30,\"image\":null},{\"serviceId\":212,\"name\":\"Chocolate Manicure\",\"price\":1099,\"duration\":45,\"image\":null},{\"serviceId\":201,\"name\":\"Chocolate Pedicure\",\"price\":1199,\"duration\":60,\"image\":null},{\"serviceId\":205,\"name\":\"Wine Pedicure\",\"price\":799,\"duration\":45,\"image\":null},{\"serviceId\":269,\"name\":\"Aroma Relaxing Therapy\",\"price\":1999,\"duration\":60,\"image\":null}]',1,NULL,NULL,'2026-07-24 06:37:47','2026-07-24 06:37:47','[]',20.00,80.00,5.00,0),(44,'Any 7 @ ₹4999','Choose any 7 services from our curated range',NULL,'flexible',4999.00,7499.00,7,NULL,'[{\"serviceId\":50,\"name\":\"Creative Cut\",\"price\":1100,\"duration\":60,\"image\":null},{\"serviceId\":74,\"name\":\"Root Touchup (Women)\",\"price\":1349,\"duration\":60,\"image\":null},{\"serviceId\":54,\"name\":\"Hair Spa - Men (Loreal)\",\"price\":800,\"duration\":30,\"image\":null},{\"serviceId\":164,\"name\":\"Face & Neck De-Tan (O3+)\",\"price\":800,\"duration\":25,\"image\":null},{\"serviceId\":183,\"name\":\"Skin Lightening Facial\",\"price\":2800,\"duration\":75,\"image\":null},{\"serviceId\":181,\"name\":\"Pearl Facial\",\"price\":1800,\"duration\":60,\"image\":null},{\"serviceId\":187,\"name\":\"Skin Whitening Facial\",\"price\":2200,\"duration\":75,\"image\":null},{\"serviceId\":188,\"name\":\"Strawberry Facial\",\"price\":2200,\"duration\":75,\"image\":null},{\"serviceId\":200,\"name\":\"O3+ Radiant Peeloff\",\"price\":1499,\"duration\":35,\"image\":null},{\"serviceId\":126,\"name\":\"Full Arms Wax (RICA)\",\"price\":450,\"duration\":30,\"image\":null},{\"serviceId\":130,\"name\":\"Half Legs Wax (RICA)\",\"price\":500,\"duration\":30,\"image\":null},{\"serviceId\":114,\"name\":\"Under Arms Wax (RICA)\",\"price\":250,\"duration\":15,\"image\":null},{\"serviceId\":268,\"name\":\"Back Polish\",\"price\":599,\"duration\":60,\"image\":null},{\"serviceId\":266,\"name\":\"Neck Polish\",\"price\":499,\"duration\":60,\"image\":null},{\"serviceId\":214,\"name\":\"Rose Manicure\",\"price\":1099,\"duration\":45,\"image\":null},{\"serviceId\":203,\"name\":\"Rose Pedicure\",\"price\":1199,\"duration\":60,\"image\":null},{\"serviceId\":269,\"name\":\"Aroma Relaxing Therapy\",\"price\":1999,\"duration\":60,\"image\":null},{\"serviceId\":270,\"name\":\"Deep Moisture Massage\",\"price\":2499,\"duration\":60,\"image\":null}]',1,NULL,NULL,'2026-07-24 06:37:47','2026-07-24 06:37:47','[]',20.00,80.00,5.00,0),(45,'Any 5 @ ₹9999','Choose any 5 services from our curated range',NULL,'flexible',9999.00,14999.00,5,NULL,'[{\"serviceId\":50,\"name\":\"Creative Cut\",\"price\":1100,\"duration\":60,\"image\":null},{\"serviceId\":43,\"name\":\"Hair Colour (Loreal, Schwarzkopf)\",\"price\":1199,\"duration\":60,\"image\":null},{\"serviceId\":56,\"name\":\"Hair Spa - Men (Wella)\",\"price\":1200,\"duration\":30,\"image\":null},{\"serviceId\":183,\"name\":\"Skin Lightening Facial\",\"price\":2800,\"duration\":75,\"image\":null},{\"serviceId\":180,\"name\":\"Korean Glass Facial\",\"price\":3200,\"duration\":90,\"image\":null},{\"serviceId\":192,\"name\":\"O3+ Bridal Facial\",\"price\":4500,\"duration\":90,\"image\":null},{\"serviceId\":207,\"name\":\"Ice Cream Pedicure\",\"price\":2499,\"duration\":75,\"image\":null},{\"serviceId\":218,\"name\":\"Ice Cream Manicure\",\"price\":2399,\"duration\":60,\"image\":null},{\"serviceId\":204,\"name\":\"Bubblegum Pedicure\",\"price\":1499,\"duration\":60,\"image\":null},{\"serviceId\":215,\"name\":\"Bubblegum Manicure\",\"price\":1399,\"duration\":45,\"image\":null},{\"serviceId\":150,\"name\":\"Full Body Wax (RICA)\",\"price\":2800,\"duration\":90,\"image\":null},{\"serviceId\":160,\"name\":\"Face De-Tan (O3+)\",\"price\":600,\"duration\":20,\"image\":null},{\"serviceId\":166,\"name\":\"Full Hands De-Tan (O3+)\",\"price\":1000,\"duration\":30,\"image\":null},{\"serviceId\":168,\"name\":\"Half Legs De-Tan (O3+)\",\"price\":1000,\"duration\":30,\"image\":null},{\"serviceId\":171,\"name\":\"Full Body De-Tan (Fruit)\",\"price\":2800,\"duration\":90,\"image\":null},{\"serviceId\":272,\"name\":\"Body Polish\",\"price\":2499,\"duration\":60,\"image\":null},{\"serviceId\":271,\"name\":\"Deep Tissue\",\"price\":2499,\"duration\":60,\"image\":null},{\"serviceId\":146,\"name\":\"Bikini Wax (RICA)\",\"price\":2500,\"duration\":30,\"image\":null},{\"serviceId\":200,\"name\":\"O3+ Radiant Peeloff\",\"price\":1499,\"duration\":35,\"image\":null}]',1,NULL,NULL,'2026-07-24 06:37:47','2026-07-24 06:37:47','[]',20.00,80.00,5.00,0);
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
) ENGINE=InnoDB AUTO_INCREMENT=277 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `services`
--

LOCK TABLES `services` WRITE;
/*!40000 ALTER TABLE `services` DISABLE KEYS */;
INSERT INTO `services` VALUES (38,18,'Haircut',NULL,299.00,30,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(39,18,'Shaving',NULL,199.00,15,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(40,18,'Beard Trim',NULL,199.00,15,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(41,18,'Beard Color',NULL,300.00,20,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(42,18,'Head Shave',NULL,399.00,20,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(43,18,'Hair Colour (Loreal, Schwarzkopf)',NULL,1199.00,60,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(44,18,'Head Massage',NULL,399.00,30,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(45,18,'Mustache Colour',NULL,200.00,15,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(46,18,'Highlights per Streak',NULL,250.00,30,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(47,6,'Bangs Cut','Haircuts - Females',200.00,15,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(48,6,'Baby Haircut','Haircuts - Females',300.00,30,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(49,6,'Classic Cut','Haircuts - Females',399.00,30,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(50,6,'Creative Cut','Haircuts - Females',1100.00,60,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(51,6,'Blow Dry Setting','Hair Styling - Females',999.00,45,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(52,6,'Ironing','Hair Styling - Females',999.00,45,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(53,2,'Hair Spa - Men (Matrix)',NULL,600.00,30,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(54,2,'Hair Spa - Men (Loreal)',NULL,800.00,30,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(55,2,'Hair Spa - Men (Schwarzkopf)',NULL,900.00,30,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(56,2,'Hair Spa - Men (Wella)',NULL,1200.00,30,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(57,2,'Hair Spa - Short Hair (Matrix)',NULL,900.00,45,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(58,2,'Hair Spa - Short Hair (Loreal)',NULL,1200.00,45,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(59,2,'Hair Spa - Short Hair (Schwarzkopf)',NULL,1300.00,45,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(60,2,'Hair Spa - Short Hair (Wella)',NULL,1500.00,45,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(61,2,'Hair Spa - Medium Hair (Matrix)',NULL,1200.00,60,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(62,2,'Hair Spa - Medium Hair (Loreal)',NULL,1700.00,60,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(63,2,'Hair Spa - Medium Hair (Schwarzkopf)',NULL,1900.00,60,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(64,2,'Hair Spa - Medium Hair (Wella)',NULL,2200.00,60,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(65,2,'Hair Spa - Long Hair (Matrix)',NULL,1800.00,75,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(66,2,'Hair Spa - Long Hair (Loreal)',NULL,2200.00,75,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(67,2,'Hair Spa - Long Hair (Schwarzkopf)',NULL,2500.00,75,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(68,2,'Hair Spa - Long Hair (Wella)',NULL,3000.00,75,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(69,2,'Hair Spa - Extra Long Hair (Matrix)',NULL,2000.00,90,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(70,2,'Hair Spa - Extra Long Hair (Loreal)',NULL,2500.00,90,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(71,2,'Hair Spa - Extra Long Hair (Schwarzkopf)',NULL,2800.00,90,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(72,2,'Hair Spa - Extra Long Hair (Wella)',NULL,3300.00,90,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(73,19,'Highlights per Streak (Women)','Starts From',449.00,30,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(74,19,'Root Touchup (Women)',NULL,1349.00,60,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(75,19,'Global Colour (Women)','Starts From',2849.00,120,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(76,19,'Highlights Global (Women)','Starts From',3499.00,150,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(77,20,'Regular Oil Head Massage','Women, Starts From',499.00,30,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(78,20,'Cooling Mint Oil Head Massage','Women, Starts From',599.00,30,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(79,20,'Almond Oil Head Massage','Women, Starts From',599.00,30,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(80,20,'Olive Oil Head Massage','Women, Starts From',599.00,30,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(81,21,'HairFall Therapy',NULL,1999.00,60,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(82,21,'Dandruff Control Therapy',NULL,1999.00,60,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(83,21,'Fiber Strength Therapy',NULL,1999.00,60,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(84,21,'Lice Treatment','Starts From',2499.00,60,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(85,21,'Smoothening (Men)',NULL,2999.00,150,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(86,21,'Nano Plastia (Men)',NULL,4499.00,180,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(87,21,'Keratin (Men)',NULL,5999.00,180,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(88,21,'Botox (Men)',NULL,6999.00,180,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(89,21,'Kerasmooth (Men)',NULL,7999.00,210,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(90,21,'Smoothening (Women)','Starts From',4999.00,180,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(91,21,'Keratin (Women)','Starts From',5999.00,180,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(92,21,'Nano Plastia (Women)','Starts From',6500.00,180,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(93,21,'Botox (Women)','Starts From',6999.00,180,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(94,21,'Kerasmooth (Women)','Starts From',7999.00,210,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(95,8,'Forehead Threading',NULL,50.00,10,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(96,8,'Eyebrows Threading',NULL,50.00,10,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(97,8,'Upper Lip Threading',NULL,50.00,10,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(98,8,'Chin Threading',NULL,50.00,10,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(99,8,'Sidelocks Threading',NULL,60.00,10,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(100,8,'Full Face Threading',NULL,250.00,20,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(101,4,'Upper Lip Wax (Honey)',NULL,60.00,10,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(102,4,'Upper Lip Wax (RICA)',NULL,80.00,10,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(103,4,'Upper Lip Wax (Roll-on)',NULL,100.00,10,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(104,4,'Upper Lip Wax (Brazilian)',NULL,120.00,10,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(105,4,'Chin Wax (Honey)',NULL,60.00,10,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(106,4,'Chin Wax (RICA)',NULL,80.00,10,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(107,4,'Chin Wax (Roll-on)',NULL,100.00,10,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(108,4,'Chin Wax (Brazilian)',NULL,120.00,10,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(109,4,'Sidelocks Wax (Honey)',NULL,150.00,15,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(110,4,'Sidelocks Wax (RICA)',NULL,200.00,15,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(111,4,'Sidelocks Wax (Roll-on)',NULL,220.00,15,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(112,4,'Sidelocks Wax (Brazilian)',NULL,250.00,15,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(113,4,'Under Arms Wax (Honey)',NULL,200.00,15,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(114,4,'Under Arms Wax (RICA)',NULL,250.00,15,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(115,4,'Under Arms Wax (Roll-on)',NULL,300.00,15,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(116,4,'Under Arms Wax (Brazilian)',NULL,350.00,15,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(117,4,'Half Arms Wax (Honey)',NULL,250.00,20,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(118,4,'Half Arms Wax (RICA)',NULL,300.00,20,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(119,4,'Half Arms Wax (Roll-on)',NULL,400.00,20,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(120,4,'Half Arms Wax (Brazilian)',NULL,500.00,20,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(121,4,'Full Face Wax (Honey)',NULL,320.00,25,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(122,4,'Full Face Wax (RICA)',NULL,400.00,25,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(123,4,'Full Face Wax (Roll-on)',NULL,500.00,25,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(124,4,'Full Face Wax (Brazilian)',NULL,550.00,25,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(125,4,'Full Arms Wax (Honey)',NULL,380.00,30,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(126,4,'Full Arms Wax (RICA)',NULL,450.00,30,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(127,4,'Full Arms Wax (Roll-on)',NULL,600.00,30,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(128,4,'Full Arms Wax (Brazilian)',NULL,700.00,30,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(129,4,'Half Legs Wax (Honey)',NULL,420.00,30,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(130,4,'Half Legs Wax (RICA)',NULL,500.00,30,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(131,4,'Half Legs Wax (Roll-on)',NULL,600.00,30,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(132,4,'Half Legs Wax (Brazilian)',NULL,750.00,30,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(133,4,'Full Legs Wax (Honey)',NULL,500.00,45,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(134,4,'Full Legs Wax (RICA)',NULL,600.00,45,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(135,4,'Full Legs Wax (Roll-on)',NULL,700.00,45,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(136,4,'Full Legs Wax (Brazilian)',NULL,900.00,45,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(137,4,'Midriff Wax (Honey)',NULL,450.00,20,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(138,4,'Midriff Wax (RICA)',NULL,550.00,20,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(139,4,'Midriff Wax (Roll-on)',NULL,650.00,20,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(140,4,'Midriff Wax (Brazilian)',NULL,800.00,20,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(141,4,'Back Wax (Honey)',NULL,650.00,30,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(142,4,'Back Wax (RICA)',NULL,800.00,30,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(143,4,'Back Wax (Roll-on)',NULL,900.00,30,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(144,4,'Back Wax (Brazilian)',NULL,1100.00,30,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(145,4,'Bikini Wax (Honey)',NULL,1800.00,30,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(146,4,'Bikini Wax (RICA)',NULL,2500.00,30,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(147,4,'Bikini Wax (Roll-on)',NULL,2800.00,30,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(148,4,'Bikini Wax (Brazilian)',NULL,3200.00,30,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(149,4,'Full Body Wax (Honey)',NULL,2200.00,90,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(150,4,'Full Body Wax (RICA)',NULL,2800.00,90,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(151,4,'Full Body Wax (Roll-on)',NULL,3200.00,90,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(152,4,'Full Body Wax (Brazilian)',NULL,3800.00,90,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(153,22,'Neck De-Tan (Fruit)',NULL,250.00,15,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(154,22,'Neck De-Tan (O3+)',NULL,400.00,15,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(155,22,'Under Arms De-Tan (Fruit)',NULL,300.00,15,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(156,22,'Under Arms De-Tan (O3+)',NULL,450.00,15,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(157,22,'Blouse Line De-Tan (Fruit)',NULL,300.00,15,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(158,22,'Blouse Line De-Tan (O3+)',NULL,550.00,15,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(159,22,'Face De-Tan (Fruit)',NULL,360.00,20,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(160,22,'Face De-Tan (O3+)',NULL,600.00,20,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(161,22,'Half Hands De-Tan (Fruit)',NULL,400.00,20,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(162,22,'Half Hands De-Tan (O3+)',NULL,700.00,20,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(163,22,'Face & Neck De-Tan (Fruit)',NULL,500.00,25,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(164,22,'Face & Neck De-Tan (O3+)',NULL,800.00,25,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(165,22,'Full Hands De-Tan (Fruit)',NULL,500.00,30,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(166,22,'Full Hands De-Tan (O3+)',NULL,1000.00,30,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(167,22,'Half Legs De-Tan (Fruit)',NULL,500.00,30,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(168,22,'Half Legs De-Tan (O3+)',NULL,1000.00,30,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(169,22,'Full Legs De-Tan (Fruit)',NULL,800.00,45,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(170,22,'Full Legs De-Tan (O3+)',NULL,1500.00,45,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(171,22,'Full Body De-Tan (Fruit)',NULL,2800.00,90,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(172,22,'Full Body De-Tan (O3+)',NULL,4000.00,90,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(173,23,'Charcoal Facial',NULL,1100.00,60,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(174,23,'Chocolate Mint Facial','Seasoul Chocolate Mint',999.00,60,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(175,23,'AntiAgeing Facial','Seasoul Anti Ageing',1499.00,75,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(176,23,'Organic Clean-Up - Dry Skin','Seasoul Organic Cleanup',799.00,45,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(177,23,'Organic Clean-Up - Oily Skin','Seasoul Organic Cleanup',849.00,45,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(178,23,'Fruit Facial','VLCC Fruit Facial Kit',899.00,45,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(179,23,'Britening Facial','O3+',4500.00,90,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(180,23,'Korean Glass Facial','Sara Beauty',3200.00,90,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(181,23,'Pearl Facial','Aroma Magic',1800.00,60,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(182,23,'Gold Facial','Aroma Magic',2000.00,60,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(183,23,'Skin Lightening Facial','Laa Mariene',2800.00,75,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(184,23,'Chocolate Facial','Aroma Treasures',1800.00,60,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(185,23,'Watermelon Facial','Aroma Treasures',1500.00,60,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(186,23,'Bluecurrent Facial','Aroma Treasures',1500.00,60,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(187,23,'Skin Whitening Facial','Aroma Treasures',2200.00,75,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(188,23,'Strawberry Facial','Aroma Treasures',2200.00,75,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(189,23,'O3+ Cleanup','O3+',1200.00,45,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(190,23,'Dry Fruit Facial','Aroma Treasures',1200.00,60,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(191,23,'Wine Facial','Astaberry',1200.00,60,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(192,23,'O3+ Bridal Facial','O3+',4500.00,90,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(193,23,'Party Glow Facial','Aroma Treasures',1800.00,60,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(194,23,'Insta Glow Facial','Aroma Treasures',2000.00,60,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(195,24,'Vitamin-C Peeloff','Sara',999.00,30,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(196,24,'Gold Peeloff','Laa Marinene',1299.00,30,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(197,24,'Pearl Peeloff','Laa Marinene',1199.00,30,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(198,24,'Charcoal Peeloff','Laa Marinene',999.00,30,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(199,24,'O3+ Whitening Peeloff','O3+ Professional',1499.00,35,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(200,24,'O3+ Radiant Peeloff','O3+ Professional',1499.00,35,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(201,5,'Chocolate Pedicure','Raaga',1199.00,60,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(202,5,'Strawberry Pedicure','Raaga',1199.00,60,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(203,5,'Rose Pedicure','Raaga',1199.00,60,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(204,5,'Bubblegum Pedicure','O3+',1499.00,60,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(205,5,'Wine Pedicure','AstaBerry',799.00,45,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(206,5,'Cup Cake Pedicure','Seasoul',1599.00,75,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(207,5,'Ice Cream Pedicure','Bombini',2499.00,75,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(208,5,'Aroma Pedicure','Aroma Magic',899.00,45,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(209,5,'Lavendor Pedicure','Vedic Valley',699.00,45,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(210,5,'De-tan Pedicure','Vedic Valley',999.00,45,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(211,5,'Glow Boosting Pedicure','Vedic Valley',1099.00,60,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(212,10,'Chocolate Manicure','Raaga',1099.00,45,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(213,10,'Strawberry Manicure','Raaga',1099.00,45,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(214,10,'Rose Manicure','Raaga',1099.00,45,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(215,10,'Bubblegum Manicure','O3+',1399.00,45,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(216,10,'Wine Manicure','AstaBerry',749.00,40,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(217,10,'Cup Cake Manicure','Seasoul',1499.00,60,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(218,10,'Ice Cream Manicure','Bombini',2399.00,60,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(219,10,'Aroma Manicure','Aroma Magic',749.00,40,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(220,10,'Lavendor Manicure','Vedic Valley',649.00,40,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(221,10,'De-tan Manicure','Vedic Valley',949.00,40,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(222,10,'Glow Boosting Manicure','Vedic Valley',1049.00,45,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(223,25,'Palm Length - Both Hands, One Side',NULL,500.00,20,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(224,25,'Palm Length - Both Hands, Two Sides',NULL,1000.00,35,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(225,25,'Palm Length (One Hand) - One Side',NULL,600.00,20,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(226,25,'Palm Length (One Hand) - Both Sides',NULL,1200.00,35,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(227,25,'Palm Length (Two Hands, Detailed) - Two Sides',NULL,2000.00,45,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(228,25,'Arabic Mehndi - One Hand, One Side',NULL,600.00,25,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(229,25,'Arabic Mehndi - Two Hands, Two Sides',NULL,1000.00,40,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(230,25,'Bangle Length - Both Hands, One Side',NULL,800.00,35,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(231,25,'Bangle Length - Both Hands, Two Sides',NULL,1600.00,60,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(232,25,'Mid Length - One Hand, One Side',NULL,1000.00,45,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(233,25,'Mid Length - One Hand, Two Sides',NULL,2000.00,75,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(234,25,'Mid Length - Two Hands, One Side',NULL,900.00,45,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(235,25,'Mid Length - Two Hands, Two Sides',NULL,1800.00,75,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(236,25,'Bridal Elbow Length (Design 1) - One Hand, One Side',NULL,1600.00,90,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(237,25,'Bridal Elbow Length (Design 1) - Two Hands, Two Sides',NULL,3200.00,150,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(238,25,'Bridal Elbow Length (Design 2) - Two Hands, One Side',NULL,3000.00,120,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(239,25,'Bridal Elbow Length (Design 2) - Two Hands, Two Sides',NULL,6000.00,180,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(240,25,'Bridal Above Elbow (Design 1) - One Hand, One Side',NULL,3500.00,120,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(241,25,'Bridal Above Elbow (Design 1) - Two Hands, Two Sides',NULL,7000.00,180,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(242,25,'Bridal Above Elbow (Design 2) - Two Hands, One Side',NULL,7000.00,180,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(243,25,'Bridal Above Elbow (Design 2) - Two Hands, Two Sides',NULL,14000.00,240,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(244,12,'Nail Art (One Finger)',NULL,99.00,10,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(245,12,'Gel Nail Polish (Per Hand)',NULL,499.00,45,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(246,12,'Acrylic Nail Extension Repair (Per Tip)',NULL,499.00,20,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(247,12,'Gel Nail Extension Repair (Per Tip)',NULL,599.00,20,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(248,12,'Gel Nail Extension Removal (Per Hand)',NULL,899.00,30,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(249,12,'Acrylic Nail Extension Removal (Per Hand)',NULL,1199.00,30,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(250,12,'French Nail Tip (Per Hand)',NULL,1500.00,45,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(251,12,'Acrylic Nail Extension (Per Hand)',NULL,3000.00,90,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(252,12,'Gel Nail Extension (Per Hand)',NULL,3500.00,90,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(253,7,'HD Bridal Makeup','Starts From',13000.00,240,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(254,7,'Bridal Makeup','Starts From',10000.00,180,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(255,7,'Party Makeup','Starts From',6000.00,90,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(256,7,'Groom Makeup','Starts From',5000.00,90,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(257,7,'Trial Makeup','Starts From',1500.00,45,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(258,7,'Hair Do','Starts From',1000.00,45,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(259,7,'Saree Draping','Starts From',1000.00,30,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(260,7,'Pre-Plaiting (Hair)',NULL,800.00,30,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(261,7,'Men\'s Hair Setting',NULL,500.00,20,'[]',NULL,1,'2026-07-14 04:24:15','2026-07-14 04:24:15'),(262,9,'Foot Massage',NULL,499.00,30,'[]',NULL,1,'2026-07-16 10:07:08','2026-07-16 10:07:08'),(263,9,'Back Massage',NULL,699.00,30,'[]',NULL,1,'2026-07-16 10:07:08','2026-07-16 10:07:08'),(264,9,'Face Massage',NULL,410.00,60,NULL,NULL,1,'2026-07-17 06:59:34','2026-07-17 06:59:34'),(265,9,'Hand Massage',NULL,499.00,60,NULL,NULL,1,'2026-07-17 06:59:34','2026-07-17 06:59:34'),(266,9,'Neck Polish',NULL,499.00,60,NULL,NULL,1,'2026-07-17 06:59:34','2026-07-17 06:59:34'),(267,9,'Hand Polish',NULL,499.00,60,NULL,NULL,1,'2026-07-17 06:59:34','2026-07-17 06:59:34'),(268,9,'Back Polish',NULL,599.00,60,NULL,NULL,1,'2026-07-17 06:59:34','2026-07-17 06:59:34'),(269,9,'Aroma Relaxing Therapy',NULL,1999.00,60,NULL,NULL,1,'2026-07-17 06:59:34','2026-07-17 06:59:34'),(270,9,'Deep Moisture Massage',NULL,2499.00,60,NULL,NULL,1,'2026-07-17 06:59:34','2026-07-17 06:59:34'),(271,9,'Deep Tissue',NULL,2499.00,60,NULL,NULL,1,'2026-07-17 06:59:34','2026-07-17 06:59:34'),(272,9,'Body Polish',NULL,2499.00,60,NULL,NULL,1,'2026-07-17 06:59:34','2026-07-17 06:59:34'),(273,9,'Body Polish with Massage',NULL,2999.00,60,NULL,NULL,1,'2026-07-17 06:59:34','2026-07-17 06:59:34'),(274,9,'Body Polish with Pack',NULL,2999.00,60,NULL,NULL,1,'2026-07-17 06:59:34','2026-07-17 06:59:34'),(275,9,'Nirvana Massage',NULL,3999.00,60,NULL,NULL,1,'2026-07-17 06:59:34','2026-07-17 06:59:34'),(276,9,'Bridal Body Polish',NULL,4999.00,60,NULL,NULL,1,'2026-07-17 06:59:34','2026-07-17 06:59:34');
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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_addresses`
--

LOCK TABLES `user_addresses` WRITE;
/*!40000 ALTER TABLE `user_addresses` DISABLE KEYS */;
INSERT INTO `user_addresses` VALUES (1,1,'Home','Railway Gate Lane','ఖైరతాబాద్','Hyderabad','Telangana','500004',17.4107,78.4614,1,'2026-07-22 03:52:23','2026-07-22 03:52:23');
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
INSERT INTO `users` VALUES (1,'Real Test User','9990001111',NULL,NULL,'[]',NULL,'BYM46644FA0',NULL,0.00,'active','2026-07-05 03:00:26','2026-07-05 03:00:28',NULL),(2,'Alex','7997753587',NULL,NULL,'[]',NULL,'BYM88CF0BBE',NULL,0.00,'active','2026-07-05 03:23:43','2026-07-05 03:23:47',NULL),(3,'Duplicate ID Test','9990002222',NULL,NULL,'[]',NULL,'BYM1D4FFD44',NULL,0.00,'blocked','2026-07-05 03:33:47','2026-07-08 09:42:19',NULL);
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

-- Dump completed on 2026-07-25 11:02:19
