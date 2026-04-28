const { admin } = require('../config/firebase');
const User = require('../models/User');

/**
 * Send push notification to a user via Firebase Cloud Messaging
 * @param {string} userId - MongoDB user ID
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {Object} data - Additional data payload
 */
const sendPushNotification = async (userId, title, body, data = {}) => {
  try {
    const user = await User.findById(userId).select('fcmToken');
    
    if (!user || !user.fcmToken) {
      return; // User has no FCM token
    }

    const message = {
      notification: {
        title,
        body
      },
      data: {
        ...Object.fromEntries(
          Object.entries(data).map(([k, v]) => [k, String(v)])
        ),
        click_action: 'FLUTTER_NOTIFICATION_CLICK'
      },
      token: user.fcmToken
    };

    await admin.messaging().send(message);
  } catch (error) {
    // Don't throw - notifications are non-critical
    if (error.code === 'messaging/registration-token-not-registered') {
      // Token is invalid, clear it
      await User.findByIdAndUpdate(userId, { fcmToken: '' });
    } else {
      console.error('Push notification error:', error.message);
    }
  }
};

/**
 * Send push notification to multiple users
 */
const sendPushToMultiple = async (userIds, title, body, data = {}) => {
  const promises = userIds.map(id => sendPushNotification(id, title, body, data));
  await Promise.allSettled(promises);
};

module.exports = { sendPushNotification, sendPushToMultiple };
