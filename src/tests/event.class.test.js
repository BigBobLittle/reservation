const Event = require("../models/event");
const redisService = require("../services/redisService");

// Mock the Redis service
jest.mock("../services/redisService");

describe("Event Model", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("should create a new event and save it in Redis", async () => {
      // Mock data
      const totalSeats = 100;
      const eventId = "test_event_id";

      // Mock the Redis set method
      redisService.set.mockResolvedValueOnce(true);

      // Call the create method
      const event = await Event.create({ totalSeats });

      // Check if the Redis set method was called with the correct parameters
      expect(redisService.set).toHaveBeenCalledWith(`event:${event.id}`, event);

      // Check if the created event has the correct properties
      expect(event).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          totalSeats: totalSeats,
        })
      );
    });
  });

  describe("findById", () => {
    it("should find an event by id from Redis", async () => {
      // Mock data
      const eventId = "test_event_id";
      const eventData = {
        id: eventId,
        totalSeats: 100,
      };

      // Mock the Redis get method
      redisService.get.mockResolvedValueOnce(eventData);

      // Call the findById method
      const event = await Event.findById(eventId);

      // Check if the Redis get method was called with the correct parameter
      expect(redisService.get).toHaveBeenCalledWith(`event:${eventId}`);

      // Check if the found event has the correct properties
      expect(event).toEqual(
        expect.objectContaining({
          id: eventData.id,
          totalSeats: eventData.totalSeats,
        })
      );
    });

    it("should return null if event is not found", async () => {
      // Mock data
      const eventId = "non_existent_event_id";

      // Mock the Redis get method to return null
      redisService.get.mockResolvedValueOnce(null);

      // Call the findById method
      const event = await Event.findById(eventId);

      // Check if null is returned
      expect(event).toBeNull();
    });
  });
});
