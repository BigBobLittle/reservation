const { v4: uuidv4 } = require("uuid");
const redisService = require("../services/redisService");
const MAX_SEATS_PER_USER = 5;

class Seat {
  constructor({
    id = uuidv4(),
    eventId = null,
    status = "available",
    userId = null,
  }) {
    this.id = id;
    this.eventId = eventId;
    this.status = status;
    this.userId = userId;
  }

  /**
   * Finds all available seats for a specific event.
   *
   * @param {string} eventId - The ID of the event.
   * @return {Promise<Array>} An array of seat objects, each with an ID, event ID, status, and user ID.
   */
  static async findAllAvailableSeats(eventId) {
    // Fetch all seat data for the event from Redis
    const seatsData = await redisService.get(`event:${eventId}:seats`);

    // If no data is found, return an empty array
    if (!seatsData) {
      return [];
    }

    // Convert the seat data from JSON to JavaScript object
    const seatsToJson = JSON.parse(seatsData);
    // Filter the seats for the specific event
    // Only include seats with a status of "available" or "reserved"

    return seatsToJson.filter(
      (seat) => seat.status !== "hold" && seat.status !== "reserved"
    );
  }

  /**
   * Retrieves a list of seats that are set to "hold" status for a specific event,
   * belonging to a specific user.
   *
   * @param {string} userId - The ID of the user.
   * @param {string} eventId - The ID of the event.
   * @return {Promise<Array>} An array of seat objects, each with an ID, event ID, status, and user ID.
   */
  async listSeatsForThisEventSetToHoldByThisUser(userId, eventId) {
    // Fetch all held seats data for the user
    const heldSeats = await this.getAllSeatsByUser(userId);

    // Filter the held seats for the specific event
    const heldSeatsForEvent = heldSeats.filter(
      (seatData) =>
        seatData.eventId === eventId &&
        seatData.status === "hold" &&
        seatData.userId === userId
    );

    // Return the filtered list of seats
    return heldSeatsForEvent;
  }

  /**
   * Retrieves a list of all reserved seats belonging to a specific user.
   *
   * @param {string} userId - The ID of the user.
   * @return {Promise<Array>} An array of seat objects, each with an ID, event ID, status, and user ID.
   */
  async listAllMyReservedSeats(userId) {
    // Fetch all seats held by the user
    const reservedSeats = await this.getAllSeatsByUser(userId);

    // Filter the reserved seats for the specific user
    const reservedSeatsForUser = reservedSeats.filter(
      (seatData) => seatData.userId === userId && seatData.status === "reserved"
    );

    // Return the filtered list of reserved seats
    return reservedSeatsForUser;
  }

  /**
   * Holds a seat for a specific user and event. The hold duration is specified in seconds.
   *
   * @param {string} userId - The ID of the user.
   * @param {string} eventId - The ID of the event.
   * @param {number} holdDuration - The duration of the hold in seconds. Default is 60 seconds.
   * @return {Promise<string|null>} The ID of the held seat, or null if hold is not possible.
   */
  async hold(userId, eventId, holdDuration = 60) {
    // Check if the user has exceeded the maximum number of seats held
    if (await this.isMaxSeatsHeld(userId, eventId)) {
      // Return null if hold is not possible
      return null;
    }

    // Check if the seat is available
    if (this.status === "available") {
      // Set the status to hold and set the user ID
      this.status = "hold";
      this.userId = userId;

      // Create a seat data object
      const seatData = { id: this.id, eventId, status: "hold", userId };

      // Create a Redis key for the seat data
      const seatKey = `event:${seatData.eventId}:seat:${seatData.id}:user:${seatData.userId}`;

      // Convert the seat data object to JSON string
      const jsonData = JSON.stringify(seatData);

      // Set the Redis key with the seat data, with expiration set to the hold duration
      await redisService.setex(seatKey, holdDuration, jsonData);

      // Return the ID of the held seat
      return this.id;
    }

    // Return null if hold is not possible
    return null;
  }

  /**
   * Checks if the user has exceeded the maximum number of seats held for a specific event.
   *
   * @param {string} userId - The ID of the user.
   * @param {string} eventId - The ID of the event.
   * @return {Promise<boolean>} True if the user has exceeded the maximum number of seats, false otherwise.
   */
  async isMaxSeatsHeld(userId, eventId) {
    // Fetch all seats held by the user
    const heldSeats = await this.getAllSeatsByUser(userId);

    // Filter the held seats for the specific event
    const heldSeatsForEvent = heldSeats.filter(
      (seatData) => seatData.eventId === eventId
    );

    // Check if the number of held seats for the event exceeds the maximum allowed seats per user
    const hasExceededMaxSeats = heldSeatsForEvent.length >= MAX_SEATS_PER_USER;

    // Return true if the user has exceeded the maximum number of seats, false otherwise
    return hasExceededMaxSeats;
  }

  /**
   * Get all seats belonging to a specific user.
   *
   * @param {string} userId - The ID of the user.
   * @return {Promise<Array>} An array of seat objects, each with an ID, event ID, status, and user ID.
   */
  async getAllSeatsByUser(userId) {
    // Define the pattern to search for keys associated with the user
    const pattern = `*:user:${userId}`;

    // Initialize an empty array to store the seat data
    let seats = [];

    // Use Redis SCAN command to search for keys matching the pattern
    let cursor = "0"; // Start the cursor at 0
    do {
      // Scan for keys matching the pattern
      const [nextCursor, keys] = await redisService.scan(
        cursor,
        "MATCH",
        pattern
      );

      // Iterate through the keys and fetch the corresponding seat data
      for (const key of keys) {
        const seatData = await redisService.get(key);
        seats.push(JSON.parse(seatData));
      }

      // Update the cursor for the next iteration
      cursor = nextCursor;
    } while (cursor !== "0"); // Continue scanning until the cursor is 0 (indicating the end)

    return seats;
  }

  /**
   * Reserve a seat for a specific user.
   *
   * @param {Object} params - The parameters for reserving a seat.
   * @param {string} params.eventId - The ID of the event.
   * @param {string} params.seatId - The ID of the seat.
   * @param {string} params.userId - The ID of the user.
   * @return {Promise<boolean>} True if the seat is successfully reserved, false otherwise.
   */
  static async reserveASeat({ eventId, seatId, userId }) {
    // Prepare the Redis key for the seat data
    const key = `event:${eventId}:seat:${seatId}:user:${userId}`;

    // Retrieve the seat data associated with the event and seat ID
    const seatData = await redisService.get(key);

    // If seat data doesn't exist or is expired, return false
    if (!seatData) {
      return false;
    }

    // Parse the seat data as json
    const seat = JSON.parse(seatData);

    // Check if the seat belongs to the specified user and is not expired
    if (seat.userId === userId && seat.status === "hold") {
      // Update the status to "reserved"
      seat.status = "reserved";

      // Set the updated seat data back to Redis
      await redisService.set(key, JSON.stringify(seat));

      // Persist the seat data in Redis
      await redisService.persist(key);

      // Return true if the seat is successfully reserved
      return true;
    }

    // Return false if the seat is not available or the user is not the owner
    return false;
  }

  /**
   * Refresh the hold of a seat for a specific user.
   *
   * @param {string} eventId - The ID of the event.
   * @param {string} userId - The ID of the user.
   * @param {string} seatId - The ID of the seat.
   * @return {Promise<boolean>} True if the hold is successfully refreshed, false otherwise.
   */
  async refreshHold(eventId, userId, seatId) {
    try {
      // Retrieve seat data associated with the seat ID
      const seatData = await redisService.get(
        `event:${eventId}:seat:${seatId}:user:${userId}`
      );

      // If seat data doesn't exist, return false
      if (!seatData) {
        return false;
      }

      // Parse seat data as json and create a new Seat object
      const seat = new Seat(JSON.parse(seatData));

      // Refresh the hold by setting the seat data back to Redis with a new expiration time
      const success = await redisService.setex(
        `event:${eventId}:seat:${seatId}:user:${userId}`,
        60, // New expiration time
        JSON.stringify(seat)
      );

      return success;
    } catch (error) {
      // Log and return an error message
      // console.error("Error refreshing hold:", error);
      return false;
    }
  }

  /**
   * Get the remaining time to live of a hold on a seat for a specific user.
   *
   * @param {string} eventId - The ID of the event.
   * @param {string} userId - The ID of the user.
   * @param {string} seatId - The ID of the seat.
   * @return {Promise<?number|string>} The remaining time to live in seconds,
   *                                  or "PERSISTED" if the key exists but has no expiration set,
   *                                  or null if the key does not exist.
   */
  async getHoldTimeRemaining(eventId, userId, seatId) {
    try {
      // Use the TTL command to get the remaining time to live of the key
      const ttl = await redisService.ttl(
        `event:${eventId}:seat:${seatId}:user:${userId}`
      );

      // If the TTL is -1, it means the key exists but has no associated expire set, aka persisted
      if (ttl === -1) {
        // The key exists but has no associated expire set, aka persisted
        // This means the hold is indefinitely persisted
        return "PERSISTED";
      } else if (ttl === -2) {
        // The key does not exist, so there is no hold on this seat
        return null;
      }

      // Return the remaining time to live in seconds
      return ttl;
    } catch (error) {
      // Log and return an error message
      // console.error("Error getting hold time remaining:", error);
      return null;
    }
  }
}

module.exports = Seat;
