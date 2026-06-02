const express = require("express");
const router = express.Router();
const upload = require("../Middleware/upload");
const {
  createContact,
  getAllContacts,
  deleteContact,
} = require("../Controllers/contactController");

router.post("/", upload.single("file"), createContact);

router.get("/", getAllContacts);
router.delete("/:id", deleteContact);

module.exports = router;
