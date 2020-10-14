const { User } = require("../../models/user");
const request = require("supertest");
const jwt = require("jsonwebtoken");
const config = require("config");
const endpoint = "/api/login";
describe(`POST ${endpoint}`, () => {
  let server;
  let user;
  beforeEach(async () => {
    server = require("../../index");
    user = {
      name: "user1",
      email: "user1@gmail.com",
      password: "123456789",
    };
    const res = await request(server).post("/api/users").send(user);
    expect(res.status).toBe(200);
  });
  afterEach(async () => {
    await server.close();
    await User.deleteMany({});
  });
  const exec = async () => {
    return await request(server).post(endpoint).send(user);
  };
  // return 400 if email or password not provided
  it("should return 400 if email or password not provided", async () => {
    user = {};
    const res = await exec();
    expect(res.status).toBe(400);
  });
  // return 400 if invalid  email  formate
  it("should return 400 if email is in invalid form", async () => {
    user.email = "user1.gmail.com";
    const res = await exec();
    expect(res.status).toBe(400);
  });
  // return 400 if password is wrong
  // return jwt token if valid email and password provided
  it("should return jwt token for valid user", async () => {
    const res = await exec();
    expect(res.status).toBe(200);
    const decode = jwt.verify(res.body.key, config.jwtKey);
    expect(decode.name).toBe(user.name);
    expect(decode.email).toBe(user.email);
  });
});
