const Event = require("../models/event");


/**
 * Creates a new event.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Object} The response object with the created event's details.
 */
exports.createEvent = async (req, res) => {
  try {
    // Extract the total seats from the request body
    const { totalSeats } = req.body;

    // If total seats is missing, return a 400 error
    if (!totalSeats) {
      return res.status(400).json({ error: "Total seats is required" });
    }

    // If total seats is not between 10 and 1000, return a 400 error
    if (totalSeats < 10 || totalSeats > 1000) {
      return res
        .status(400)
        .json({ error: "Total seats must be between 10 and 1000" });
    }

    // Create a new event with the provided total seats
    const event = await Event.create({ totalSeats });

    // Return the created event's details in the response
    return res.status(201).json({ eventId: event.id, totalSeats });
  } catch (err) {
    // Log the error and return a 500 error
    // console.error("Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

