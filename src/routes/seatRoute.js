const express = require("express");
const router = express.Router();
const seatController = require("../controllers/seatController");

router.get("/:eventId/availableSeats", seatController.getAvailableSeats);
router.get(
  "/:eventId/:userId/heldSeats",
  seatController.listUsersHeldSeatByEvent
);
router.post("/:eventId/hold", seatController.holdSeat);
router.post("/reserve", seatController.reserveSeat);

router.get(
  "/:userId/listMyReservedSeats",
  seatController.listAllMyReservedSeats
);
router.post("/refresh", seatController.refreshHold);
router.post(
  "/checkRemainSeatHoldTime",
  seatController.checkRemainingSeatHoldTime
);

module.exports = router;
