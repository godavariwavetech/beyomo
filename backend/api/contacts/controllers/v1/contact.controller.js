const catchAsync = require("../../../../utils/errorHandlers/catchAsync");
const AppError = require("../../../../utils/errorHandlers/appError");
const ContactInquiry = require("../../models/contact.model");
const Joi = require("joi");

const contactSchema = Joi.object({
  name: Joi.string().trim().min(2).max(150).required(),
  email: Joi.string().trim().email().required(),
  phone: Joi.string().trim().max(20).allow("", null),
  subject: Joi.string().trim().max(200).required(),
  message: Joi.string().trim().min(10).max(5000).required(),
});

const submitContact = catchAsync(async (req, res, next) => {
  const { error, value } = contactSchema.validate(req.body);
  if (error) return next(new AppError(error.details[0].message, 400));

  const inquiry = await ContactInquiry.create(value);
  res.status(201).json({ status: true, message: "Your message has been received. We'll get back to you within 4 hours.", data: { id: inquiry.id } });
});

const getContacts = catchAsync(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const where = status ? { status } : {};
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const { count, rows } = await ContactInquiry.findAndCountAll({
    where,
    order: [["createdAt", "DESC"]],
    limit: parseInt(limit),
    offset,
  });

  res.json({ status: true, data: rows, total: count, page: parseInt(page), pages: Math.ceil(count / parseInt(limit)) });
});

const updateContact = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { status, adminNotes } = req.body;
  const inquiry = await ContactInquiry.findByPk(id);
  if (!inquiry) return next(new AppError("Contact inquiry not found", 404));
  await inquiry.update({ status, adminNotes });
  res.json({ status: true, message: "Updated successfully", data: inquiry });
});

module.exports = { submitContact, getContacts, updateContact };
