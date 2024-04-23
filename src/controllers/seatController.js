const Seat = require("../models/seat");
const Event = require("../models/event");

/**
 * Controller function to get all available seats for a given event.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @return {object} Returns the available seats or error message.
 */
exports.getAvailableSeats = async (req, res) => {
  try {
    // Destructure the eventId from the request parameters.
    const { eventId } = req.params;

    // If the eventId is not provided, return a 400 error.
    if (!eventId) {
      return res.status(400).json({ error: "Event ID is required" });
    }

    // Find the event by its ID.
    const event = await Event.findById(eventId);

    // If the event is not found, return a 404 error.
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Find all available seats for the event.
    const availableSeats = await Seat.findAllAvailableSeats(eventId);

    // Send the available seats in the response.
    res.status(200).json({ availableSeats });
  } catch (err) {
    // If there is an error, log it and send a 500 error response.
    // console.error("Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Controller function to list the seats held by a user for a specific event.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @return {object} Returns the held seats or error message.
 */
exports.listUsersHeldSeatByEvent = async (req, res) => {
  try {
    // Destructure the eventId and userId from the request parameters.
    const { eventId, userId } = req.params;

    // If the eventId or userId is not provided, return a 400 error.
    if (!eventId) {
      return res.status(400).json({ error: "Event ID is required" });
    }
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Instantiate a new Seat class with the provided eventId and userId.
    const SeatClass = new Seat(userId, eventId);

    // Call the listSeatsForThisEventSetToHoldByThisUser method of the Seat class to retrieve the held seats.
    const heldSeats = await SeatClass.listSeatsForThisEventSetToHoldByThisUser(userId, eventId);

    // Send the held seats in the response.
    res.status(200).json({ 
      "message": "Held seats by this user fetched successfully", 
      data: heldSeats 
    });
  } catch (err) {
    // If there is an error, log it and send a 500 error response.
    // console.error("Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Controller function to hold a seat for a specific event.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @return {object} Returns a success message and data with the held seat ID or an error message.
 */
exports.holdSeat = async (req, res) => {
  try {
    // Destructure the userId and eventId from the request body and parameters respectively.
    const { userId } = req.body;
    const { eventId } = req.params;

    // If the userId or eventId is not provided, return a 400 error.
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }
    if (!eventId) {
      return res.status(400).json({ error: "Event ID is required" });
    }

    // Find the event by its ID.
    const event = await Event.findById(eventId);
    // If the event is not found, return a 404 error.
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Instantiate a new Seat class with the provided eventId and userId.
    const seatClass = new Seat({ eventId, userId });
    // Check if the maximum seats are already held by the user for this event.
    if (await seatClass.isMaxSeatsHeld(userId, eventId)) {
      return res.status(400).json({
        error: "Maximum seats already held by the user for this event",
      });
    }

    // Hold the seat for the user and the event.
    const success = await seatClass.hold(userId, eventId);
    // If the seat is successfully held, return a 200 response with the held seat ID.
    if (success) {
      return res
        .status(200)
        .json({ message: "Seat successfully held", data: { seatId: success } });
    }

    // If the seat is not available, return a 400 error.
    return res.status(400).json({ error: "Seat is not available" });
  } catch (err) {
    // If there is an error, log it and send a 500 error response.
    // console.error("Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Controller function to reserve a seat for a specific event.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @return {object} Returns a success message and data with the reserved seat ID or an error message.
 */
exports.reserveSeat = async (req, res) => {
  try {
    // Destructure the userId, eventId, and seatId from the request body.
    const { userId, eventId, seatId } = req.body;

    // If any of the required parameters is missing, return a 400 error.
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    if (!eventId) {
      return res.status(400).json({ error: "Event ID is required" });
    }

    if (!seatId) {
      return res.status(400).json({ error: "Seat ID is required" });
    }

    // Reserve the seat using the Seat model's static method.
    const reservedSeat = await Seat.reserveASeat({ seatId, userId, eventId });

    
    // Return a 200 response with the reserved seat ID.
    return reservedSeat ? res.json({ 
      "message": "Seat reserved successfully", 
      data: { seatId } 
    })
    : res.status(400).json({ error: "Seat is not available" });
  } catch (err) {
    // If there is an error, log it and send a 500 error response.
    // console.error("Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Controller function to list all the reserved seats for a specific user.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @return {object} Returns a success message and data with the list of reserved seats or an error message.
 */
exports.listAllMyReservedSeats = async (req, res) => {
  try {
    // Destructure the userId from the request parameters.
    const { userId } = req.params;

    // If the userId is not provided, return a 400 error.
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Instantiate a new Seat class with the provided userId.
    const SeatClass = new Seat(userId);

    // Use the listAllMyReservedSeats method of the Seat class to retrieve the list of reserved seats.
    const reservedSeats = await SeatClass.listAllMyReservedSeats(userId);

    // Send the list of reserved seats in the response.
    res.status(200).json({
      "message": "Reserved seats fetched successfully",
      data: reservedSeats
    });
  } catch (err) {
    // If there is an error, log it and send a 500 error response.
    // console.error("Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
/**
 * Controller function to refresh the hold of a seat for a specific user and event.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @return {object} Returns a success message or an error message.
 */
exports.refreshHold = async (req, res) => {
  try {
    // Destructure the required parameters from the request body.
    const { seatId, userId, eventId } = req.body;

    // If any of the required parameters is missing, return a 400 error.
    if (!seatId) {
      return res.status(400).json({ error: "Seat ID is required" });
    }

    if(!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    if(!eventId) {
      return res.status(400).json({ error: "Event ID is required" });
    }

    // Instantiate a new Seat class with the provided eventId and userId.
    const SeatClass = new Seat( eventId, userId);

    // Use the refreshHold method of the Seat class to refresh the hold.
    const success = await SeatClass.refreshHold(eventId, userId, seatId);

    // If the hold is successfully refreshed, return a 200 success response.
    // Otherwise, return a 400 error response.
    return success
      ? res.status(200).json({ message: "Hold refreshed successfully" })
      : res.status(400).json({ error: "Hold cannot be refreshed" });
  } catch (err) {
    // If there is an error, log it and send a 500 error response.
    // console.error("Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};


/**
 * Controller function to check the remaining hold time for a specific seat, user, and event.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @return {object} Returns a success message and data with the remaining hold time or an error message.
 */
exports.checkRemainingSeatHoldTime = async (req, res) => {
  try {
    // Destructure the seatId, userId, and eventId from the request body.
    const { seatId, userId, eventId } = req.body;

    // Check if any of the required parameters is missing and return a 400 error.
    if (!seatId) {
      return res.status(400).json({ error: "Seat ID is required" });
    }

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    if (!eventId) {
      return res.status(400).json({ error: "Event ID is required" });
    }

    // Instantiate a new Seat class with the provided eventId and userId.
    const SeatClass = new Seat(eventId, userId);

    // Use the getHoldTimeRemaining method of the Seat class to get the remaining hold time.
    const remainingTime = await SeatClass.getHoldTimeRemaining(eventId, userId, seatId);

    // Return a 200 response with the remaining hold time.
    return res.status(200).json({
      "message": "Remaining time fetched successfully",
      data: remainingTime
    });
  } catch (err) {
    // If there is an error, log it and send a 500 error response.
    // console.error("Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
