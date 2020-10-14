const request = require("supertest");
const { User } = require("../../models/user");
const jwt = require("jsonwebtoken");
const config = require("config");
const mongoose = require("mongoose");

describe("/api/users", () => {
  let server;
  beforeEach(() => {
    server = require("../../index");
  });
  afterEach(async () => {
    await server.close();
    await User.deleteMany({});
  });

  describe("GET /", () => {
    it("should return all users with only name email and id property", async () => {
      const users = [
        { name: "user1", email: "user1@gmail.com", password: "user1Pass" },
        { name: "user2", email: "user2@gmail.com", password: "user2Pass" },
      ];

      await User.collection.insertMany(users);
      const res = await request(server).get("/api/users");
      expect(res.status).toBe(200);
      expect(res.body.some((u) => u.email === "user1@gmail.com")).toBeTruthy();
      expect(res.body.some((u) => u.email === "user2@gmail.com")).toBeTruthy();
      expect(res.body.some((u) => u.hashed_password !== null)).toBeTruthy();
    });
  });

  describe("POST /", () => {
    let user = {
      name: "user1",
      email: "user1@gmail.com",
      password: "user1Pass",
    };
    it("should return saved user with id property", async () => {
      const res = await request(server).post("/api/users").send(user);

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("user1");
      expect(res.body.email).toBe("user1@gmail.com");
      expect(res.body._id).toBeTruthy();
      expect(res.body.hashed_password).toBeFalsy();
    });

    // return 400  for already registered email id
    it("should return 400  for already registered email id", async () => {
      // first send post request
      await request(server).post("/api/users").send(user);
      // againg send post request with same data
      let res = await request(server).post("/api/users").send(user);
      expect(res.status).toBe(400);
    });

    // return 400 if password is less than 5 character
    it("should return 400 if The password does not meet the password policy requirements.", async () => {
      user.password = "124";
      let res = await request(server).post("/api/users").send(user);
      expect(res.status).toBe(400);
    });

    // checking valid jsonwebtoken in header
    it("should return valid json token in header", async () => {
      user.password = "user1Pass";
      let res = await request(server).post("/api/users").send(user);
      const token = res.header["x-auth-token"];
      expect(res.status).toBe(200);
      expect(token).not.toBeNull();
      const userFromToken = jwt.verify(token, config.jwtKey);

      expect(userFromToken.name).toBe(user.name);
      expect(userFromToken.email).toBe(user.email);
    });
  });

  describe("GET /:id", () => {
    let user = {
      name: "user1",
      email: "user1@gmail.com",
      password: "user1Pass",
    };
    // invalid formate of id
    it("should return 404 if the id is invalid formate", async () => {
      const res = await request(server).get("/api/users/" + 25);
      expect(res.status).toBe(404);
    });

    // valid id formate but user is not found.
    it("should return 404 if the user not found", async () => {
      let id = mongoose.Types.ObjectId();
      let res = await request(server).get("/api/users/" + id);
      expect(res.status).toBe(404);
    });

    // valid id
    it("should return a user with a specfic id ", async () => {
      let res = await request(server).post("/api/users").send(user);
      user = res.body;
      res = await request(server).get("/api/users/" + user._id);
      expect(res.body.name).toBe(user.name);
      expect(res.body.email).toBe(user.email);
    });
  });

  describe("PUT /:id", () => {
    let user1 = {
      name: "user1",
      email: "user1@gmail.com",
      password: "user1Pass",
    };
    let user2 = {
      name: "user2",
      email: "user2@gmail.com",
      password: "user2Pass",
    };
    // get 401 if request send with no token
    it("should return 401 if token is not in req header", async () => {
      let res = await request(server).post("/api/users").send(user1);
      res = await request(server).post("/api/users").send(user2);
      let id = res.body._id;
      res = await request(server)
        .put("/api/users/" + id)
        .send(user1);
      expect(res.status).toBe(401);
    });

    // send request with unauthorized token
    it("should return 401 if token is not in req header", async () => {
      let res = await request(server).post("/api/users").send(user1);
      let user1_token = res.header["x-auth-token"];
      res = await request(server).post("/api/users").send(user2);
      let id = res.body._id;
      res = await request(server)
        .put("/api/users/" + id)
        .set("x-auth-token", user1_token)
        .send(user2);
      expect(res.status).toBe(403);
    });

    // send request with valid token and updation
    it("should return updated user", async () => {
      let res = await request(server).post("/api/users").send(user1);
      let user1_token = res.header["x-auth-token"];
      user1.name = "user3";

      let id = res.body._id;
      res = await request(server)
        .put("/api/users/" + id)
        .set("x-auth-token", user1_token)
        .send(user1);
      expect(res.status).toBe(200);
      expect(res.body.name).toBe("user3");
    });
  });
});
