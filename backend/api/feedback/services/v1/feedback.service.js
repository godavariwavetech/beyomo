const AppFeedback = require("../../models/feedback.model");

const submitFeedback = async (userId, userName, feedbackData) => {
  return AppFeedback.create({
    userId: userId || null,
    userName: userName || feedbackData.userName,
    type: feedbackData.type,
    message: feedbackData.message,
    rating: feedbackData.rating || null,
    serviceBooked: feedbackData.serviceBooked || null,
    category: feedbackData.category || null,
    version: feedbackData.version || null,
    status: "new",
    submittedAt: new Date(),
  });
};

module.exports = { submitFeedback };
