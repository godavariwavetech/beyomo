const express = require("express");
const router = express.Router();
const { submitContact, getContacts, updateContact } = require("../../controllers/v1/contact.controller");
const adminAuthenticate = require("../../../../utils/adminAuthenticate");

router.post("/", submitContact);
router.get("/", adminAuthenticate(), getContacts);
router.patch("/:id", adminAuthenticate(), updateContact);

module.exports = router;
