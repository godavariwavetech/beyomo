const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");
const logger = require("./logger");
const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = require("../config");

let firebaseInitialized = false;

// Second, simpler way to supply credentials: drop the service-account JSON that the
// Firebase console hands you straight into the backend folder. Nothing has to be pasted
// into .env and the key never has to be reflowed onto one line, which is where the
// "\n" escaping usually goes wrong. The env vars still take precedence, so any existing
// deployment configured that way is unaffected.
//
// The filename is git-ignored - this file must never be committed.
const SERVICE_ACCOUNT_FILE = path.join(__dirname, "..", "firebase-service-account.json");

const credentialsFromFile = () => {
  try {
    if (!fs.existsSync(SERVICE_ACCOUNT_FILE)) return null;
    const parsed = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_FILE, "utf8"));
    if (!parsed.project_id || !parsed.client_email || !parsed.private_key) {
      logger.warn("firebase-service-account.json is missing project_id/client_email/private_key.");
      return null;
    }
    return {
      projectId: parsed.project_id,
      clientEmail: parsed.client_email,
      privateKey: parsed.private_key,
    };
  } catch (error) {
    logger.error(`Could not read firebase-service-account.json: ${error.message}`);
    return null;
  }
};

const initializeFirebase = () => {
  if (firebaseInitialized) return;

  try {
    const fromEnv = FIREBASE_PROJECT_ID && FIREBASE_CLIENT_EMAIL && FIREBASE_PRIVATE_KEY
      ? { projectId: FIREBASE_PROJECT_ID, clientEmail: FIREBASE_CLIENT_EMAIL, privateKey: FIREBASE_PRIVATE_KEY }
      : null;
    const credentials = fromEnv || credentialsFromFile();

    if (!credentials) {
      logger.warn(
        "Firebase credentials not configured. Push notifications will be disabled. " +
        "Set FIREBASE_PROJECT_ID/FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY, or place the " +
        "service-account JSON at backend/firebase-service-account.json."
      );
      return;
    }

    logger.info(`Firebase credentials loaded from ${fromEnv ? ".env" : "firebase-service-account.json"} (project ${credentials.projectId})`);

    admin.initializeApp({
      credential: admin.credential.cert(credentials),
    });

    firebaseInitialized = true;
    logger.info("Firebase Admin SDK initialized successfully");
  } catch (error) {
    logger.error(`Firebase initialization error: ${error.message}`);
  }
};

// Initialize on module load
initializeFirebase();

/**
 * Send push notification to multiple device tokens
 * @param {Array<String>} tokens - FCM device tokens
 * @param {String} title - notification title
 * @param {String} body - notification body
 * @param {Object} data - additional data payload
 * @param {String|null} channelId - Android notification channel id created client-side
 *   (e.g. via notifee). On Android 8+, the channel's own sound/vibration/lights always
 *   take precedence over anything set here, so this is what actually makes a custom
 *   sound play — omitting it (the previous behavior everywhere) falls back to Android's
 *   auto-created default channel with the system default sound.
 * @returns {Promise<Object>} FCM response
 */
const sendPushNotification = async (tokens, title, body, data = {}, channelId = null) => {
  if (!firebaseInitialized) {
    logger.warn("Firebase not initialized. Skipping push notification.");
    return { success: false, reason: "Firebase not initialized" };
  }

  if (!tokens || tokens.length === 0) {
    logger.warn("No device tokens provided for push notification");
    return { success: false, reason: "No tokens provided" };
  }

  // Filter out empty/invalid tokens
  const validTokens = tokens.filter((t) => t && typeof t === "string" && t.trim().length > 0);
  if (validTokens.length === 0) {
    return { success: false, reason: "No valid tokens" };
  }

  try {
    // Convert all data values to strings (FCM requirement)
    const stringData = {};
    Object.keys(data).forEach((key) => {
      stringData[key] = String(data[key]);
    });

    const message = {
      notification: { title, body },
      data: stringData,
      tokens: validTokens,
      android: {
        notification: {
          clickAction: "FLUTTER_NOTIFICATION_CLICK",
          ...(channelId ? { channelId } : { sound: "default" }),
        },
        priority: "high",
      },
      apns: {
        payload: {
          aps: {
            sound: "default",
            badge: 1,
          },
        },
      },
    };

    const response = await admin.messaging().sendEachForMulticast(message);

    logger.info(
      `Push notification sent. Success: ${response.successCount}, Failure: ${response.failureCount}`
    );

    if (response.failureCount > 0) {
      const failedTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push({ token: validTokens[idx], error: resp.error?.message });
        }
      });
      logger.warn(`Failed tokens: ${JSON.stringify(failedTokens)}`);
    }

    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
    };
  } catch (error) {
    logger.error(`Push notification error: ${error.message}`);
    return { success: false, error: error.message };
  }
};

/**
 * Send push notification to a single token
 * @param {String} token - FCM device token
 * @param {String} title
 * @param {String} body
 * @param {Object} data
 */
const sendSinglePushNotification = async (token, title, body, data = {}, channelId = null) => {
  return sendPushNotification([token], title, body, data, channelId);
};

// The partner app's one custom-sound channel (see its NotificationsService.js). Pass it
// as channelId ONLY for a new job offered to or assigned to a partner — the app's manifest
// falls everything else back to the plain default channel, which is what keeps the custom
// alert sound exclusive to orders. Anything sent without a channelId rings the default.
const PARTNER_NEW_BOOKING_CHANNEL = "beyomo_partner_new_booking";

module.exports = {
  sendPushNotification,
  sendSinglePushNotification,
  PARTNER_NEW_BOOKING_CHANNEL,
};
