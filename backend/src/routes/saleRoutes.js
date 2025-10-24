const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/saleController");
const { requireAuth } = require("../middleware/auth");

router.get("/", ctrl.listSales);
router.get("/:id", ctrl.getSale);
router.post("/", ctrl.createSale);
router.patch("/:id", ctrl.updateSale);
router.delete("/:id", ctrl.deleteSale);

module.exports = router;
