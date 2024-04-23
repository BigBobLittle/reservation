const { createEvent } = require("../controllers/eventController");
const Event = require("../models/event");

describe("createEvent", () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should create a new event with valid totalSeats", async () => {
    // Mock request body
    req.body.totalSeats = 50;

    // Mock Event.create method
    const event = { id: "event1", totalSeats: 50 };
    jest.spyOn(Event, "create").mockResolvedValueOnce(event);

    // Call the controller function
    await createEvent(req, res);

    // Check if Event.create method is called with the correct parameter
    expect(Event.create).toHaveBeenCalledWith({ totalSeats: 50 });

    // Check if the response status is 201 and includes the event details
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      eventId: event.id,
      totalSeats: 50,
    });
  });

  it("should return a 400 error if totalSeats is missing", async () => {
    // Call the controller function without totalSeats in the request body
    await createEvent(req, res);

    // Check if the response status is 400 and includes the error message
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Total seats is required" });
  });

  it("should return a 400 error if totalSeats is not between 10 and 1000", async () => {
    // Mock request body with invalid totalSeats
    req.body.totalSeats = 5;

    // Call the controller function with invalid totalSeats
    await createEvent(req, res);

    // Check if the response status is 400 and includes the error message
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Total seats must be between 10 and 1000",
    });
  });

  it("should return a 500 error if an error occurs during event creation", async () => {
    // Mock request body
    req.body.totalSeats = 100;

    // Mock Event.create method to throw an error
    const error = new Error("Test error");
    jest.spyOn(Event, "create").mockRejectedValueOnce(error);

    // Call the controller function
    await createEvent(req, res);

    // Check if the response status is 500 and includes the error message
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });
});
