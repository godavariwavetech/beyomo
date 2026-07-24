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
  PRIMARY KEY (`id`),
  UNIQUE KEY `phone` (`phone`),
  UNIQUE KEY `phone_2` (`phone`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `email_2` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `partners`
--

LOCK TABLES `partners` WRITE;
/*!40000 ALTER TABLE `partners` DISABLE KEYS */;
/*!40000 ALTER TABLE `partners` ENABLE KEYS */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bookings`
--

LOCK TABLES `bookings` WRITE;
/*!40000 ALTER TABLE `bookings` DISABLE KEYS */;
/*!40000 ALTER TABLE `bookings` ENABLE KEYS */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_addresses`
--

LOCK TABLES `user_addresses` WRITE;
/*!40000 ALTER TABLE `user_addresses` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_addresses` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=157 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (1,NULL,NULL,'Direct test','Test body','{}','promo',0,'2026-05-25 06:53:31','2026-05-25 06:53:31','2026-05-25 06:53:31'),(2,NULL,NULL,'Weekend Special Offer! 🎉','Get {{discount}}% off on all beauty services this weekend. Book now!','{}','promo',0,'2026-05-25 07:50:38','2026-05-25 07:50:38','2026-05-25 07:50:38'),(8,NULL,NULL,'New Job Requests Available','There are new job requests near you. Go online to accept!','{}','promo',0,'2026-05-25 12:06:23','2026-05-25 12:06:23','2026-05-25 12:06:23'),(63,NULL,NULL,'Weekend Special Offer! 🎉','Get {{discount}}% off on all beauty services this weekend. Book now!','{}','promo',0,'2026-06-01 06:06:45','2026-06-01 06:06:45','2026-06-01 06:06:45'),(64,NULL,NULL,'Weekend Special Offer! 🎉','Get {{discount}}% off on all beauty services this weekend. Book now!','{}','promo',0,'2026-06-01 06:06:53','2026-06-01 06:06:53','2026-06-01 06:06:53'),(66,NULL,NULL,'Weekend Special Offer! 🎉','Get {{discount}}% off on all beauty services this weekend. Book now!','{}','promo',0,'2026-06-01 17:36:45','2026-06-01 17:36:45','2026-06-01 17:36:45'),(77,NULL,NULL,'Weekend Special Offer! 🎉','Get {{discount}}% off on all beauty services this weekend. Book now!','{}','promo',0,'2026-06-04 06:00:30','2026-06-04 06:00:30','2026-06-04 06:00:30'),(155,NULL,NULL,'Booking Placed','Your booking for Classic Haircut (BYM-202606-869708) has been placed.','{\"bookingId\":\"79\"}','booking',0,'2026-06-19 17:56:18','2026-06-19 17:56:18','2026-06-19 17:56:18'),(156,NULL,NULL,'Booking Placed','Your booking for Classic Haircut (BYM-202606-705180) has been placed.','{\"bookingId\":\"80\"}','booking',0,'2026-06-19 17:57:55','2026-06-19 17:57:55','2026-06-19 17:57:55');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-07-01 15:59:31
