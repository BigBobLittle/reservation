const { v4: uuidv4 } = require("uuid");
const redisService = require("../services/redisService");


/**
 * Event model represents an event in the system.
 * It consists of an id and the total number of seats for the event.
 */
class Event {
  /**
   * Creates a new Event instance.
   * @param {Object} options - The options for creating an Event.
   * @param {string} options.id - The id of the Event (optional, default: generated UUID).
   * @param {number} options.totalSeats - The total number of seats for the Event.
   */
  constructor({ id = uuidv4(), totalSeats }) {
    this.id = id;
    this.totalSeats = totalSeats;
  }

  /**
   * Creates a new Event and saves it in the Redis database.
   * @param {Object} options - The options for creating an Event.
   * @param {number} options.totalSeats - The total number of seats for the Event.
   * @returns {Promise<Event>} The created Event.
   */
  static async create({ totalSeats }) {
    const event = new Event({ totalSeats });
    await redisService.set(`event:${event.id}`, event);
    return event;
  }

  /**
   * Finds an Event by id in the Redis database.
   * @param {string} id - The id of the Event.
   * @returns {Promise<Event|null>} The found Event or null if not found.
   */
  static async findById(id) {
    const eventData = await redisService.get(`event:${id}`);
    return eventData ? new Event(eventData) : null;
  }
}

module.exports = Event;
