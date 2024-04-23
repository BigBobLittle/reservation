const redis = require("redis");
const { promisify } = require("util");

const client = redis.createClient({
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT || 6379,
});

client.on("error", (err) => {
  console.error("Redis error:", err);
});

const getAsync = promisify(client.get).bind(client);
const setexAsync = promisify(client.setex).bind(client);
const set = promisify(client.set).bind(client);
const persist = promisify(client.persist).bind(client);
const hget = promisify(client.hget).bind(client);
const hmset = promisify(client.hmset).bind(client);
const scan = promisify(client.scan).bind(client);
const ttl = promisify(client.ttl).bind(client);

module.exports = {
  /**
   * Retrieve the value associated with the given key from Redis.
   *
   * @param {string} key - The key to retrieve the value for.
   * @return {Promise<?Object>} The parsed JSON value associated with the key,
   *                            or null if the key does not exist.
   */
  async get(key) {
    try {
      // Retrieve the value associated with the key from Redis
      const data = await getAsync(key);

      // Parse the JSON value and return it
      return JSON.parse(data);
    } catch (err) {
      // Log and return an error message if there was an error retrieving the value
      console.error("Redis get error:", err);
      return null;
    }
  },

  /**
   * Sets the value of a key in Redis with the specified expiration in seconds.
   *
   * @param {string} key - The key to set.
   * @param {number} seconds - The expiration time in seconds.
   * @param {Object} value - The value to set.
   * @return {Promise<string>} A promise that resolves to the result of the Redis SETEX command.
   * @throws {Error} If there was an error executing the Redis command.
   */
  async setex(key, seconds, value) {
    try {
      // Call the Redis SETEX command to set a key with the specified expiration
      const setExpiration = await setexAsync(
        key, 
        seconds, 
        JSON.stringify(value) 
      );

      // Return the result of the Redis SETEX command
      return setExpiration;
    } catch (err) {
      // Log and return an error message if there was an error executing the Redis command
      console.error("Redis setex error:", err);
    }
  },

  /**
   * Sets the value of a key in Redis.
   *
   * @param {string} key - The key to set.
   * @param {Object} value - The value to set.
   * @return {Promise<void>} A promise that resolves when the Redis SET command is executed.
   * @throws {Error} If there was an error executing the Redis command.
   */
  async set(key, value) {
    try {
      // Call the Redis SET command to set a key
      await set(key, JSON.stringify(value));
    } catch (err) {
      // Log and return an error message if there was an error executing the Redis command
      console.error("Redis set error:", err);
    }
  },

  /**
   * Retrieve the value of a hash field from Redis.
   *
   * @param {string} key - The key of the hash.
   * @param {string} field - The field to retrieve.
   * @return {Promise<?Object>} The parsed JSON value of the hash field,
   *                             or null if the field does not exist.
   * @throws {Error} If there was an error executing the Redis command.
   */
  async hget(key, field) {
    try {
      // Retrieve the value of a hash field from Redis
      const data = await hget(key, field);

      // Parse the JSON value and return it
      return JSON.parse(data);
    } catch (err) {
      // Log and return an error message if there was an error executing the Redis command
      console.error("Redis hget error:", err);
      return null;
    }
  },


  /**
   * Persist a Redis key indefinitely.
   *
   * @param {string} key - The key to persist.
   * @return {Promise<void>} A promise that resolves when the Redis PERSIST command is executed.
   * @throws {Error} If there was an error executing the Redis command.
   */
  async persist(key) {
    // Call the Redis PERSIST command to persist a key indefinitely
    try {
      await persist(key);
    } catch (err) {
      // Log and return an error message if there was an error executing the Redis command
      console.error("Redis persist error:", err);
    }
  },

  /**
   * Set multiple hash fields in Redis.
   *
   * @param {string} key - The key of the hash.
   * @param {Object} value - The key-value pairs to set in the hash.
   * @return {Promise<void>} A promise that resolves when the Redis HMSET command is executed.
   * @throws {Error} If there was an error executing the Redis command.
   */
  async hmset(key, value) {
    try {
      // Call the Redis HMSET command to set multiple hash fields
      await hmset(key, JSON.stringify(value));
    } catch (err) {
      // Log and return an error message if there was an error executing the Redis command
      console.error("Redis hmset error:", err);
    }
  },

  /**
   * Executes a Redis SCAN command with the given cursor and optional arguments.
   *
   * @param {string} cursor - The cursor for the Redis scan command.
   * @param {...string} args - Additional arguments for the Redis scan command.
   * @return {Promise<Array>} A promise that resolves to an array containing the next
   * cursor and an array of keys found by the scan command.
   * @throws {Error} If there was an error executing the Redis command.
   */
  async scan(cursor, ...args) {
    try {
      // Call the Redis SCAN command with the given cursor and optional arguments
      const [nextCursor, keys] = await scan(cursor, ...args);

      // Return the next cursor and an array of keys found by the scan command
      return [nextCursor, keys];
    } catch (err) {
      // Log and return an error message if there was an error executing the Redis command
      console.error("Redis scan error:", err);

      // Return a default value indicating that no keys were found
      return ["0", []];
    }
  },

  /**
   * Retrieves the time to live (TTL) of a Redis key.
   *
   * @param {string} key - The Redis key.
   * @return {Promise<?number>} The TTL in seconds, or null if the key does not exist or an error occurred.
   */
  async ttl(key) {
    try {
      // Call the Redis TTL command to retrieve the time to live of the given key
      const redisTtl = await ttl(key);

      // Return the TTL in seconds, or null if the key does not exist
      return redisTtl;
    } catch (err) {
      // Log and return an error message if there was an error executing the Redis command
      console.error("Redis ttl error:", err);

      // Return null to indicate that an error occurred
      return null;
    }
  },



};
