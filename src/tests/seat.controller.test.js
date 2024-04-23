const Event = require("../models/event");
const Seat = require("../models/seat");
const {
  getAvailableSeats,
  listUsersHeldSeatByEvent,
  holdSeat,
  reserveSeat,
  listAllMyReservedSeats,
  refreshHold,
  checkRemainingSeatHoldTime
} = require("../controllers/seatController");
const {} = require("../controllers/seatController");

describe("getAvailableSeats", () => {
  let req, res;

  beforeEach(() => {
    req = { params: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return available seats for a valid eventId", async () => {
    // Mock request params
    req.params.eventId = "event1";

    // Mock Event.findById method
    const event = { id: "event1" };
    jest.spyOn(Event, "findById").mockResolvedValueOnce(event);

    // Mock Seat.findAllAvailableSeats method
    const availableSeats = [
      { id: "seat1", eventId: "event1", status: "available" },
    ];
    jest
      .spyOn(Seat, "findAllAvailableSeats")
      .mockResolvedValueOnce(availableSeats);

    // Call the controller function
    await getAvailableSeats(req, res);

    // Check if Event.findById is called with the correct parameter
    expect(Event.findById).toHaveBeenCalledWith("event1");

    // Check if Seat.findAllAvailableSeats is called with the correct parameter
    expect(Seat.findAllAvailableSeats).toHaveBeenCalledWith("event1");

    // Check if the response status is 200 and includes the available seats
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ availableSeats });
  });

  it("should return a 400 error if eventId is missing", async () => {
    // Call the controller function without eventId in the request params
    await getAvailableSeats(req, res);

    // Check if the response status is 400 and includes the error message
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Event ID is required" });
  });

  it("should return a 404 error if event is not found", async () => {
    // Mock request params with non-existent eventId
    req.params.eventId = "nonexistent";

    // Mock Event.findById to return null
    jest.spyOn(Event, "findById").mockResolvedValueOnce(null);

    // Call the controller function with non-existent eventId
    await getAvailableSeats(req, res);

    // Check if the response status is 404 and includes the error message
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Event not found" });
  });

  it("should return a 500 error if an error occurs", async () => {
    // Mock request params
    req.params.eventId = "event1";

    // Mock Event.findById method to throw an error
    const error = new Error("Test error");
    jest.spyOn(Event, "findById").mockRejectedValueOnce(error);

    // Call the controller function
    await getAvailableSeats(req, res);

    // Check if the response status is 500 and includes the error message
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });
});

describe("listUsersHeldSeatByEvent", () => {
  let req, res;

  beforeEach(() => {
    req = { params: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return held seats for a valid eventId and userId", async () => {
    // Mock request params
    req.params.eventId = "event1";
    req.params.userId = "user1";

    // Mock Seat class instance and its method
    const heldSeats = [
      { id: "seat1", eventId: "event1", status: "hold", userId: "user1" },
    ];

    Seat.prototype.listSeatsForThisEventSetToHoldByThisUser = jest
      .fn()
      .mockResolvedValue(heldSeats);

    // Call the controller function
    await listUsersHeldSeatByEvent(req, res);

    // Check if listSeatsForThisEventSetToHoldByThisUser is called with the correct parameters
    expect(
      Seat.prototype.listSeatsForThisEventSetToHoldByThisUser
    ).toHaveBeenCalledWith("user1", "event1");

    // Check if the response status is 200 and includes the held seats
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Held seats by this user fetched successfully",
      data: heldSeats,
    });
  });

  it("should return a 500 error if an error occurs", async () => {
    // Mock request params
    req.params.eventId = "event1";
    req.params.userId = "user1";

    // Mock Seat class instance and its method to throw an error
    const error = new Error("Test error");
    Seat.prototype.listSeatsForThisEventSetToHoldByThisUser = jest
      .fn()
      .mockRejectedValueOnce(error);

    // Call the controller function
    await listUsersHeldSeatByEvent(req, res);

    // Check if the response status is 500 and includes the error message
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });

  it("should return a 400 error if eventId or userId is missing", async () => {
    // Call the controller function without eventId and userId in the request params
    await listUsersHeldSeatByEvent(req, res);

    // Check if the response status is 400 and includes the error message
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Event ID is required" });

    // Reset res object
    res.status.mockClear();

    // Add eventId but not userId in the request params
    req.params.eventId = "event1";

    // Call the controller function without userId in the request params
    await listUsersHeldSeatByEvent(req, res);

    // Check if the response status is 400 and includes the error message
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "User ID is required" });
  });
});

describe("holdSeat", () => {
  let req, res;

  beforeEach(() => {
    req = { body: {}, params: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should hold a seat successfully", async () => {
    // Mock request body and params
    req.body.userId = "user123";
    req.params.eventId = "event456";

    // Mock Event.findById to return a valid event
    const mockEvent = { id: "event456" };

    Event.findById = jest.fn().mockResolvedValue(mockEvent);

    // Mock Seat constructor and hold method

    const mockSeatInstance = { hold: jest.fn().mockResolvedValue("seat789") };
    jest
      .spyOn(Seat.prototype, "hold")
      .mockImplementationOnce(mockSeatInstance.hold);

    // Call the holdSeat function
    await holdSeat(req, res);

    // Check if the response status is 200 and includes the held seat ID
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Seat successfully held",
      data: { seatId: "seat789" },
    });
  });

  it("should return a 400 error if user ID is missing", async () => {
    // Mock request params without user ID
    req.params.eventId = "event456";

    // Call the holdSeat function
    await holdSeat(req, res);

    // Check if the response status is 400 and includes the error message
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "User ID is required" });
  });

  it("should return a 400 error if event ID is missing", async () => {
    // Mock request body without event ID
    req.body.userId = "user123";

    // Call the holdSeat function
    await holdSeat(req, res);

    // Check if the response status is 400 and includes the error message
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Event ID is required" });
  });

  it("should return a 404 error if the event is not found", async () => {
    // Mock request body and params
    req.body.userId = "user123";
    req.params.eventId = "invalidEventId";

    // Mock Event.findById to return null (event not found)

    Event.findById = jest.fn().mockResolvedValue(null);

    // Call the holdSeat function
    await holdSeat(req, res);

    // Check if the response status is 404 and includes the error message
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Event not found" });
  });

  it("should return a 500 error if an error occurs", async () => {
    // Mock request body and params
    req.body.userId = "user123";
    req.params.eventId = "event456";

    // Mock Event.findById to throw an error

    Event.findById = jest.fn().mockRejectedValue(new Error("Test error"));

    // Call the holdSeat function
    await holdSeat(req, res);

    // Check if the response status is 500 and includes the error message
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });
});

describe("reserveSeat", () => {
  let req, res;

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
  it("should reserve a seat successfully", async () => {
    // Mock request body
    req.body.eventId = "event1";
    req.body.seatId = "seat1";
    req.body.userId = "user1";

    // Mock Seat.reserveASeat to return true
    Seat.reserveASeat = jest.fn().mockResolvedValue(true);

    // Call the controller function
    await reserveSeat(req, res);

    // Check if Seat.reserveASeat is called with the correct parameters
    expect(Seat.reserveASeat).toHaveBeenCalledWith({
      eventId: "event1",
      seatId: "seat1",
      userId: "user1",
    });

  

    // Check if the response includes the correct message and data
    expect(res.json).toHaveBeenCalledWith({
      message: "Seat reserved successfully",
      data: { seatId: "seat1" },
    });
  });

  it("should return a 400 error if any required parameter is missing", async () => {
    // Call the controller function without userId in the request body
    await reserveSeat(req, res);

    // Check if the response status is 400 and includes the error message
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "User ID is required" });

    // Reset res object
    res.status.mockClear();

    // Add userId but not eventId in the request body
    req.body.userId = "user1";

    // Call the controller function without eventId in the request body
    await reserveSeat(req, res);

    // Check if the response status is 400 and includes the error message
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Event ID is required" });

    // Reset res object
    res.status.mockClear();

    // Add eventId but not seatId in the request body
    req.body.eventId = "event1";

    // Call the controller function without seatId in the request body
    await reserveSeat(req, res);

    // Check if the response status is 400 and includes the error message
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Seat ID is required" });
  });

  it("should return a 500 error if an error occurs", async () => {
    // Mock request body
    req.body.eventId = "event1";
    req.body.seatId = "seat1";
    req.body.userId = "user1";

    // Mock Seat.reserveASeat to throw an error
    const error = new Error("Test error");
    Seat.reserveASeat = jest.fn().mockRejectedValueOnce(error);

    // Call the controller function
    await reserveSeat(req, res);

    // Check if the response status is 500 and includes the error message
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });
});

describe("listAllMyReservedSeats", () => {
  let req, res;

  beforeEach(() => {
    req = { params: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch reserved seats for a valid userId", async () => {
    // Mock request params
    req.params.userId = "user1";

    // Mock Seat class instance and its method
    const reservedSeats = [
      { id: "seat1", eventId: "event1", status: "reserved", userId: "user1" },
      { id: "seat2", eventId: "event2", status: "reserved", userId: "user1" },
    ];

    Seat.prototype.listAllMyReservedSeats = jest
      .fn()
      .mockResolvedValue(reservedSeats);

    // Call the controller function
    await listAllMyReservedSeats(req, res);

    // Check if listAllMyReservedSeats is called with the correct parameter
    expect(Seat.prototype.listAllMyReservedSeats).toHaveBeenCalledWith("user1");

    // Check if the response status is 200 and includes the reserved seats
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Reserved seats fetched successfully",
      data: reservedSeats,
    });
  });

  it("should return a 400 error if userId is missing", async () => {
    // Call the controller function without userId in the request params
    await listAllMyReservedSeats(req, res);

    // Check if the response status is 400 and includes the error message
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "User ID is required" });
  });

  it("should return a 500 error if an error occurs", async () => {
    // Mock request params
    req.params.userId = "user1";

    // Mock Seat class instance and its method to throw an error
    const error = new Error("Test error");
    Seat.prototype.listAllMyReservedSeats = jest
      .fn()
      .mockRejectedValueOnce(error);

    // Call the controller function
    await listAllMyReservedSeats(req, res);

    // Check if the response status is 500 and includes the error message
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });
});

describe("refreshHold", () => {
  let req, res;

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should refresh hold successfully", async () => {
    // Mock request body
    req.body.seatId = "seat1";
    req.body.userId = "user1";
    req.body.eventId = "event1";

    // Mock Seat class instance and its method
    const success = true;

    Seat.prototype.refreshHold = jest.fn().mockResolvedValue(success);

    // Call the controller function
    await refreshHold(req, res);

    // Check if refreshHold is called with the correct parameters
    expect(Seat.prototype.refreshHold).toHaveBeenCalledWith(
      "event1",
      "user1",
      "seat1"
    );

    // Check if the response status is 200 and includes the success message
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Hold refreshed successfully",
    });
  });

  it("should return a 400 error if any required parameter is missing", async () => {
    // Call the controller function without required parameters in the request body
    await refreshHold(req, res);

    // Check if the response status is 400 and includes the error message for missing seatId
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Seat ID is required" });

    // Reset res object
    res.status.mockClear();

    // Add seatId but not userId in the request body
    req.body.seatId = "seat1";

    // Call the controller function without userId in the request body
    await refreshHold(req, res);

    // Check if the response status is 400 and includes the error message for missing userId
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "User ID is required" });

    // Reset res object
    res.status.mockClear();

    // Add userId but not eventId in the request body
    req.body.userId = "user1";

    // Call the controller function without eventId in the request body
    await refreshHold(req, res);

    // Check if the response status is 400 and includes the error message for missing eventId
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Event ID is required" });
  });

  it("should return a 500 error if an error occurs", async () => {
    // Mock request body
    req.body.seatId = "seat1";
    req.body.userId = "user1";
    req.body.eventId = "event1";

    // Mock Seat class instance and its method to throw an error
    const error = new Error("Test error");
    Seat.prototype.refreshHold = jest.fn().mockRejectedValueOnce(error);

    // Call the controller function
    await refreshHold(req, res);

    // Check if the response status is 500 and includes the error message
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });
});


describe("checkRemainingSeatHoldTime", () => {
  let req, res;

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return remaining hold time successfully", async () => {
    // Mock request body
    req.body.seatId = "seat1";
    req.body.userId = "user1";
    req.body.eventId = "event1";

    // Mock Seat class instance and its method
    const remainingTime = 600;

    Seat.prototype.getHoldTimeRemaining = jest
      .fn()
      .mockResolvedValue(remainingTime);

    // Call the controller function
    await checkRemainingSeatHoldTime(req, res);

    // Check if getHoldTimeRemaining is called with the correct parameters
    expect(Seat.prototype.getHoldTimeRemaining).toHaveBeenCalledWith(
      "event1",
      "user1",
      "seat1"
    );

    // Check if the response status is 200 and includes the remaining hold time
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Remaining time fetched successfully",
      data: remainingTime,
    });
  });

  it("should return a 400 error if any required parameter is missing", async () => {
    // Call the controller function without required parameters in the request body
    await checkRemainingSeatHoldTime(req, res);

    // Check if the response status is 400 and includes the error message for missing seatId
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Seat ID is required" });

    // Reset res object
    res.status.mockClear();

    // Add seatId but not userId in the request body
    req.body.seatId = "seat1";

    // Call the controller function without userId in the request body
    await checkRemainingSeatHoldTime(req, res);

    // Check if the response status is 400 and includes the error message for missing userId
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "User ID is required" });

    // Reset res object
    res.status.mockClear();

    // Add userId but not eventId in the request body
    req.body.userId = "user1";

    // Call the controller function without eventId in the request body
    await checkRemainingSeatHoldTime(req, res);

    // Check if the response status is 400 and includes the error message for missing eventId
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Event ID is required" });
  });

  it("should return a 500 error if an error occurs", async () => {
    // Mock request body
    req.body.seatId = "seat1";
    req.body.userId = "user1";
    req.body.eventId = "event1";

    // Mock Seat class instance and its method to throw an error
    const error = new Error("Test error");
    Seat.prototype.getHoldTimeRemaining = jest
      .fn()
      .mockRejectedValueOnce(error);

    // Call the controller function
    await checkRemainingSeatHoldTime(req, res);

    // Check if the response status is 500 and includes the error message
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });
});

