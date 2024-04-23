const Seat = require("../models/seat");
const Event = require("../models/event");
const redisService = require("../services/redisService");

// Mock the Redis service
jest.mock("../services/redisService");

describe("Seat Model", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("findAllAvailableSeats", () => {
    it("should return an array of available seats for a specific event", async () => {
      const eventId = "event1";
      const seatsData = [
        { id: "seat1", eventId: "event1", status: "available", userId: null },
        { id: "seat2", eventId: "event1", status: "hold", userId: "user1" },
        { id: "seat3", eventId: "event1", status: "reserved", userId: "user2" },
      ];
      const getMock = jest
        .spyOn(redisService, "get")
        .mockResolvedValue(JSON.stringify(seatsData));

      const result = await Seat.findAllAvailableSeats(eventId);

      expect(getMock).toHaveBeenCalledWith(`event:${eventId}:seats`);
      expect(result).toEqual([
        { id: "seat1", eventId: "event1", status: "available", userId: null },
      ]);
    });

    it("should return an empty array if no available seats found for the event", async () => {
      const eventId = "event1";
      const getMock = jest.spyOn(redisService, "get").mockResolvedValue(null);

      const result = await Seat.findAllAvailableSeats(eventId);

      expect(getMock).toHaveBeenCalledWith(`event:${eventId}:seats`);
      expect(result).toEqual([]);
    });
  });

  describe("listSeatsForThisEventSetToHoldByThisUser", () => {
    it('should return an array of seats set to "hold" for a specific user and event', async () => {
      // Mock data
      const userId = "user1";
      const eventId = "event1";
      const userSeatsData = [
        { id: "seat1", eventId: "event1", status: "hold", userId: "user1" },
        { id: "seat2", eventId: "event1", status: "hold", userId: "user1" },
        { id: "seat3", eventId: "event1", status: "reserved", userId: "user1" },
        { id: "seat4", eventId: "event1", status: "hold", userId: "user2" },
      ];
      const getAllSeatsByUserMock = jest
        .spyOn(Seat.prototype, "getAllSeatsByUser")
        .mockResolvedValue(userSeatsData);

      // Call the method
      const result =
        await Seat.prototype.listSeatsForThisEventSetToHoldByThisUser(
          userId,
          eventId
        );

      // Check the result
      expect(getAllSeatsByUserMock).toHaveBeenCalledWith(userId);
      expect(result).toEqual([
        { id: "seat1", eventId: "event1", status: "hold", userId: "user1" },
        { id: "seat2", eventId: "event1", status: "hold", userId: "user1" },
      ]);
    });

    it('should return an empty array if no seats set to "hold" for the user and event', async () => {
      // Mock data
      const userId = "user1";
      const eventId = "event1";
      const userSeatsData = [
        { id: "seat1", eventId: "event1", status: "available", userId: null },
        { id: "seat2", eventId: "event1", status: "reserved", userId: "user1" },
      ];
      const getAllSeatsByUserMock = jest
        .spyOn(Seat.prototype, "getAllSeatsByUser")
        .mockResolvedValue(userSeatsData);

      // Call the method
      const result =
        await Seat.prototype.listSeatsForThisEventSetToHoldByThisUser(
          userId,
          eventId
        );

      // Check the result
      expect(getAllSeatsByUserMock).toHaveBeenCalledWith(userId);
      expect(result).toEqual([]);
    });
  });

  describe("listAllMyReservedSeats", () => {
    it("should return an array of reserved seats for a specific user", async () => {
      // Mock data
      const userId = "user1";
      const userSeatsData = [
        { id: "seat1", eventId: "event1", status: "reserved", userId: "user1" },
        { id: "seat2", eventId: "event2", status: "reserved", userId: "user1" },
        { id: "seat3", eventId: "event1", status: "hold", userId: "user1" },
        { id: "seat4", eventId: "event1", status: "reserved", userId: "user2" },
      ];
      const getAllSeatsByUserMock = jest
        .spyOn(Seat.prototype, "getAllSeatsByUser")
        .mockResolvedValue(userSeatsData);

      // Call the method
      const result = await Seat.prototype.listAllMyReservedSeats(userId);

      // Check the result
      expect(getAllSeatsByUserMock).toHaveBeenCalledWith(userId);
      expect(result).toEqual([
        { id: "seat1", eventId: "event1", status: "reserved", userId: "user1" },
        { id: "seat2", eventId: "event2", status: "reserved", userId: "user1" },
      ]);
    });

    it("should return an empty array if no reserved seats for the user", async () => {
      // Mock data
      const userId = "user1";
      const userSeatsData = [
        { id: "seat1", eventId: "event1", status: "hold", userId: "user2" },
        { id: "seat2", eventId: "event2", status: "available", userId: null },
      ];
      const getAllSeatsByUserMock = jest
        .spyOn(Seat.prototype, "getAllSeatsByUser")
        .mockResolvedValue(userSeatsData);

      // Call the method
      const result = await Seat.prototype.listAllMyReservedSeats(userId);

      // Check the result
      expect(getAllSeatsByUserMock).toHaveBeenCalledWith(userId);
      expect(result).toEqual([]);
    });
  });

  describe("hold", () => {
    afterEach(() => {
      jest.restoreAllMocks(); // Restore mocked functions after each test
    });

    it("should hold a seat for a specific user and event with default hold duration", async () => {
      // Mock data
      const userId = "user1";
      const eventId = "event1";
      const seatId = "seat1";
      const holdDuration = 60;
      const seat = new Seat({
        id: seatId,
        eventId,
        status: "available",
        userId: null,
      });
      const getAllSeatsByUserMock = jest
        .spyOn(Seat.prototype, "getAllSeatsByUser")
        .mockResolvedValue([]);

      // Mock the setex function from redisService
      const setexMock = jest
        .spyOn(redisService, "setex")
        .mockResolvedValue(true);

      // Call the method
      const result = await seat.hold(userId, eventId);

      // Check the result
      expect(getAllSeatsByUserMock).toHaveBeenCalledWith(userId);
      expect(setexMock).toHaveBeenCalledWith(
        `event:${eventId}:seat:${seatId}:user:${userId}`,
        holdDuration,
        JSON.stringify({ id: seatId, eventId, status: "hold", userId })
      );
      expect(result).toEqual(seatId);
    });

    it("should not hold a seat if user has exceeded maximum number of held seats", async () => {
      // Mock data
      const userId = "user1";
      const eventId = "event1";
      const seatId = "seat7";
      const seat = new Seat({
        id: seatId,
        eventId,
        status: "available",
        userId,
      });

      const userSeatsData = [
        { id: "seat1", eventId: "event1", status: "hold", userId: "user1" },
        { id: "seat2", eventId: "event1", status: "hold", userId: "user1" },
        { id: "seat3", eventId: "event1", status: "hold", userId: "user1" },
        { id: "seat4", eventId: "event1", status: "hold", userId: "user1" },
        { id: "seat5", eventId: "event1", status: "hold", userId: "user1" },
      ];

      const getAllSeatsByUserMock = jest
        .spyOn(Seat.prototype, "getAllSeatsByUser")
        .mockResolvedValue(userSeatsData);

      // Call the method
      const result = await seat.hold(userId, eventId);

      // Check the result
      expect(getAllSeatsByUserMock).toHaveBeenCalledWith(userId);
      expect(result).toBeNull();
    });

    it("should not hold a seat if it is not available", async () => {
      // Mock data
      const userId = "user1";
      const eventId = "event1";
      const seatId = "seat1";
      const seat = new Seat({ id: seatId, eventId, status: "hold", userId });
      const getAllSeatsByUserMock = jest
        .spyOn(Seat.prototype, "getAllSeatsByUser")
        .mockResolvedValue([]);

      // Call the method
      const result = await seat.hold(userId, eventId);

      // Check the result
      expect(getAllSeatsByUserMock).toHaveBeenCalledWith(userId);
      expect(result).toBeNull();
    });
  });

  describe("isMaxSeatsHeld", () => {
    afterEach(() => {
      jest.restoreAllMocks(); // Restore mocked functions after each test
    });

    const MAX_SEATS_PER_USER = 5;
    it("should return true if user has exceeded maximum number of held seats for the event", async () => {
      // Mock data
      const userId = "user1";
      const eventId = "event1";
      const maxSeats = MAX_SEATS_PER_USER;
      const heldSeats = Array.from({ length: maxSeats }, (_, index) => ({
        id: `seat${index}`,
        eventId,
        status: "hold",
        userId,
      }));

      // Mock the getAllSeatsByUser method
      const getAllSeatsByUserMock = jest
        .spyOn(Seat.prototype, "getAllSeatsByUser")
        .mockResolvedValue(heldSeats);

      // Call the method
      const result = await Seat.prototype.isMaxSeatsHeld(userId, eventId);

      // Check the result
      expect(getAllSeatsByUserMock).toHaveBeenCalledWith(userId);
      expect(result).toBeTruthy();
    });

    it("should return false if user has not exceeded maximum number of held seats for the event", async () => {
      // Mock data
      const userId = "user1";
      const eventId = "event1";
      const maxSeats = MAX_SEATS_PER_USER - 1;
      const heldSeats = Array.from({ length: maxSeats }, (_, index) => ({
        id: `seat${index}`,
        eventId,
        status: "hold",
        userId,
      }));

      // Mock the getAllSeatsByUser method
      const getAllSeatsByUserMock = jest
        .spyOn(Seat.prototype, "getAllSeatsByUser")
        .mockResolvedValue(heldSeats);

      // Call the method
      const result = await Seat.prototype.isMaxSeatsHeld(userId, eventId);

      // Check the result
      expect(getAllSeatsByUserMock).toHaveBeenCalledWith(userId);
      expect(result).toBeFalsy();
    });
  });

  describe("getAllSeatsByUser", () => {
    afterEach(() => {
      jest.restoreAllMocks(); // Restore mocked functions after each test
    });

    it("should return an array of seat objects belonging to the user", async () => {
      // Mock data
      const userId = "user1";
      const keys = [
        "event:event1:seat:seat1:user:user1",
        "event:event2:seat:seat2:user:user1",
      ];
      const seatData = [
        { id: "seat1", eventId: "event1", status: "available", userId },
        { id: "seat2", eventId: "event2", status: "reserved", userId },
      ];

      // Mock the redisService.scan and redisService.get methods
      const scanMock = jest
        .spyOn(redisService, "scan")
        .mockResolvedValue(["0", keys]);
      const getMock = jest
        .spyOn(redisService, "get")
        .mockResolvedValueOnce(JSON.stringify(seatData[0]))
        .mockResolvedValueOnce(JSON.stringify(seatData[1]));

      // Call the method
      const result = await Seat.prototype.getAllSeatsByUser(userId);

      // Check the result
      expect(scanMock).toHaveBeenCalledWith("0", "MATCH", `*:user:${userId}`);
      expect(getMock).toHaveBeenCalledTimes(2);
      expect(getMock).toHaveBeenCalledWith(keys[0]);
      expect(getMock).toHaveBeenCalledWith(keys[1]);
      expect(result).toEqual(seatData);
    });

    it("should return an empty array if no seats are found for the user", async () => {
      // Mock data
      const userId = "user1";

      // Mock the redisService.scan method to return no keys
      const scanMock = jest
        .spyOn(redisService, "scan")
        .mockResolvedValue(["0", []]);

      // Call the method
      const result = await Seat.prototype.getAllSeatsByUser(userId);

      // Check the result
      expect(scanMock).toHaveBeenCalledWith("0", "MATCH", `*:user:${userId}`);
      expect(result).toEqual([]);
    });
  });

  describe("reserveASeat", () => {
    afterEach(() => {
      jest.restoreAllMocks(); // Restore mocked functions after each test
    });

    it("should successfully reserve a seat for the user", async () => {
      // Mock data
      const eventId = "event1";
      const seatId = "seat1";
      const userId = "user1";
      const key = `event:${eventId}:seat:${seatId}:user:${userId}`;
      const seatData = { id: seatId, eventId, status: "hold", userId };

      // Mock the redisService.get and redisService.set methods
      const getMock = jest
        .spyOn(redisService, "get")
        .mockResolvedValueOnce(JSON.stringify(seatData));
      const setMock = jest
        .spyOn(redisService, "set")
        .mockResolvedValueOnce("OK");

      // Call the method
      const result = await Seat.reserveASeat({ eventId, seatId, userId });

      // Check the result
      expect(getMock).toHaveBeenCalledWith(key);
      expect(setMock).toHaveBeenCalledWith(
        key,
        JSON.stringify({ ...seatData, status: "reserved" })
      );
      expect(result).toBe(true);
    });

    it("should return false if the seat is not available or the user is not the owner", async () => {
      // Mock data
      const eventId = "event1";
      const seatId = "seat1";
      const userId = "user1";
      const key = `event:${eventId}:seat:${seatId}:user:${userId}`;

      // Mock the redisService.get method to return null
      const getMock = jest
        .spyOn(redisService, "get")
        .mockResolvedValueOnce(null);

      // Call the method
      const result = await Seat.reserveASeat({ eventId, seatId, userId });

      // Check the result
      expect(getMock).toHaveBeenCalledWith(key);
      expect(result).toBe(false);
    });
  });

  describe("refreshHold", () => {
    afterEach(() => {
      jest.restoreAllMocks(); // Restore mocked functions after each test
    });

    it("should successfully refresh the hold of a seat", async () => {
      // Mock data
      const eventId = "event1";
      const seatId = "seat1";
      const userId = "user1";
      const key = `event:${eventId}:seat:${seatId}:user:${userId}`;
      const seatData = { id: seatId, eventId, status: "hold", userId };

      // Mock the redisService.get and redisService.setex methods
      const getMock = jest
        .spyOn(redisService, "get")
        .mockResolvedValueOnce(JSON.stringify(seatData));
      const setexMock = jest
        .spyOn(redisService, "setex")
        .mockResolvedValueOnce("OK");

      // Call the method

      const result = await Seat.prototype.refreshHold(eventId, userId, seatId);

      // Check the result
      expect(getMock).toHaveBeenCalledWith(key);
      expect(setexMock).toHaveBeenCalledWith(key, 60, JSON.stringify(seatData));
      expect(result).toBe("OK");
    });

    it("should return false if the seat data does not exist", async () => {
      // Mock data
      const eventId = "event1";
      const seatId = "seat1";
      const userId = "user1";
      const key = `event:${eventId}:seat:${seatId}:user:${userId}`;

      // Mock the redisService.get method to return null
      const getMock = jest
        .spyOn(redisService, "get")
        .mockResolvedValueOnce(null);

      // Call the method
      const result = await Seat.prototype.refreshHold(eventId, userId, seatId);

      // Check the result
      expect(getMock).toHaveBeenCalledWith(key);
      expect(result).toBe(false);
    });

    it("should return false if an error occurs during refreshing hold", async () => {
      // Mock data
      const eventId = "event1";
      const seatId = "seat1";
      const userId = "user1";
      const key = `event:${eventId}:seat:${seatId}:user:${userId}`;
      const seatData = { id: seatId, eventId, status: "hold", userId };

      // Mock the redisService.get method to return seat data
      const getMock = jest
        .spyOn(redisService, "get")
        .mockResolvedValueOnce(JSON.stringify(seatData));

      // Mock the redisService.setex method to throw an error
      const error = new Error("Test error");
      const setexMock = jest
        .spyOn(redisService, "setex")
        .mockRejectedValueOnce(error);

      // Call the method
      const result = await Seat.prototype.refreshHold(eventId, userId, seatId);

      // Check the result
      expect(getMock).toHaveBeenCalledWith(key);
      expect(setexMock).toHaveBeenCalledWith(key, 60, JSON.stringify(seatData));
      expect(result).toBe(false);
    });
  });

  describe("getHoldTimeRemaining", () => {
    afterEach(() => {
      jest.restoreAllMocks(); // Restore mocked functions after each test
    });

    it("should return remaining time to live in seconds", async () => {
      // Mock data
      const eventId = "event1";
      const seatId = "seat1";
      const userId = "user1";
      const key = `event:${eventId}:seat:${seatId}:user:${userId}`;
      const ttl = 30; // Mocked time to live

      // Mock the redisService.ttl method
      const ttlMock = jest
        .spyOn(redisService, "ttl")
        .mockResolvedValueOnce(ttl);

      // Call the method
      const result = await Seat.prototype.getHoldTimeRemaining(
        eventId,
        userId,
        seatId
      );

      // Check the result
      expect(ttlMock).toHaveBeenCalledWith(key);
      expect(result).toBe(ttl);
    });

    it('should return "PERSISTED" if the key exists but has no expiration set', async () => {
      // Mock data
      const eventId = "event1";
      const seatId = "seat1";
      const userId = "user1";
      const key = `event:${eventId}:seat:${seatId}:user:${userId}`;
      const ttl = -1; // Mocked time to live indicating persistence

      // Mock the redisService.ttl method
      const ttlMock = jest
        .spyOn(redisService, "ttl")
        .mockResolvedValueOnce(ttl);

      // Call the method
      const result = await Seat.prototype.getHoldTimeRemaining(
        eventId,
        userId,
        seatId
      );

      // Check the result
      expect(ttlMock).toHaveBeenCalledWith(key);
      expect(result).toBe("PERSISTED");
    });

    it("should return null if the key does not exist", async () => {
      // Mock data
      const eventId = "event1";
      const seatId = "seat1";
      const userId = "user1";
      const key = `event:${eventId}:seat:${seatId}:user:${userId}`;
      const ttl = -2; // Mocked time to live indicating key does not exist

      // Mock the redisService.ttl method
      const ttlMock = jest
        .spyOn(redisService, "ttl")
        .mockResolvedValueOnce(ttl);

      // Call the method
      const result = await Seat.prototype.getHoldTimeRemaining(
        eventId,
        userId,
        seatId
      );

      // Check the result
      expect(ttlMock).toHaveBeenCalledWith(key);
      expect(result).toBe(null);
    });

    it("should return null if an error occurs during getting hold time remaining", async () => {
      // Mock data
      const eventId = "event1";
      const seatId = "seat1";
      const userId = "user1";
      const key = `event:${eventId}:seat:${seatId}:user:${userId}`;
      const error = new Error("Test error");

      // Mock the redisService.ttl method to throw an error
      const ttlMock = jest
        .spyOn(redisService, "ttl")
        .mockRejectedValueOnce(error);

      // Call the method
      const result = await Seat.prototype.getHoldTimeRemaining(
        eventId,
        userId,
        seatId
      );

      // Check the result
      expect(ttlMock).toHaveBeenCalledWith(key);
      expect(result).toBe(null);
    });
  });
});
