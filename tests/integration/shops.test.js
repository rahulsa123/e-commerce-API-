const request = require("supertest");
const { User } = require("../../models/user");
const { Shop } = require("../../models/shop");
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");

const endPoint = "/api/shops";

describe(endPoint, () => {
  let server;
  let users = [
    {
      name: "user1",
      email: "user1@gmail.com",
      password: "user1Pass",
    },
    {
      name: "user2",
      email: "user2@gmail.com",
      password: "user2Pass",
    },
  ];
  let shops = [
    {
      name: "shops1",
      description: "shop1 description",
    },
    {
      name: "shops2",
      description: "shop2 description",
    },
  ];
  beforeEach(() => {
    server = require("../../index");
  });

  afterEach(async () => {
    await server.close();
    await Shop.deleteMany({});
    await User.deleteMany({});
  });
  describe("GET /", () => {
    afterEach(async () => {
      await User.deleteMany({});
      await Shop.deleteMany({});
    });
    it("should return all available shops ", async () => {
      let res = await request(server).get(endPoint);
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(0);
      let shop1 = { ...shops[0] };
      shop1.owner = mongoose.Types.ObjectId();
      await Shop(shop1).save();
      res = await request(server).get(endPoint);

      expect(res.status).toBe(200);
      expect(res.body[0].name).toBe(shop1.name);
      expect(res.body[0].description).toBe(shop1.description);
    });
  });
  describe("POST /", () => {
    let token;
    let user1;
    let shop1;

    const exec = async () => {
      return await request(server)
        .post(endPoint)
        .set("x-auth-token", token)
        .send(shop1);
    };
    beforeEach(() => {
      user1 = { ...users[0] };
      token = User(user1).genrateAuthToken();
      shop1 = { ...shops[0] };
    });
    afterEach(async () => {
      await User.deleteMany({});
      await Shop.deleteMany({});
    });
    it("should return 401 if client is not logged in ", async () => {
      token = "";
      const res = await exec();
      expect(res.status).toBe(401);
    });
    it("should  save the shop's details if it is valid", async () => {
      await exec();
      const shop = await Shop.find({ name: shop1.name });
      expect(shop).not.toBeNull();
    });
    it("should  return the shop if it is valid", async () => {
      const res = await exec();
      expect(res.body).toHaveProperty("_id");
      expect(res.body).toHaveProperty("name", shop1.name);
    });
  });
  describe("GET /:id", () => {
    let id;
    let shop1;
    let user1;
    const exec = async () => {
      return await request(server).get(endPoint + "/" + id);
    };
    beforeEach(async () => {
      user1 = new User({ ...users[0] });
      token = user1.genrateAuthToken();
      shop1 = { ...shops[0] };
      shop1.owner = user1._id;
      shop1 = await Shop(shop1).save();
      id = shop1._id.toHexString();
    });
    afterEach(async () => {
      await User.deleteMany({});
      await Shop.deleteMany({});
    });
    it("should return 404 if ID is invalid", async () => {
      id = 1;
      const res = await exec();
      expect(res.status).toBe(404);
    });

    it("should return 404 if no shop with given ID  was found ", async () => {
      id = mongoose.Types.ObjectId();
      const res = await exec();
      expect(res.status).toBe(404);
    });
    it("should return shop if id is valid ", async () => {
      const res = await exec();
      expect(res.status).toBe(200);
      expect(res.body.name).toBe(shop1.name);

      expect(res.body._id).toBe(id);
    });
  });
  describe("PUT /:id", () => {
    let id;
    let shop1;
    let user1;
    const exec = async () => {
      return await request(server)
        .put(endPoint + "/" + id)
        .set("x-auth-token", token)
        .send(shop1);
    };
    beforeEach(async () => {
      user1 = new User({ ...users[0] });

      token = user1.genrateAuthToken();
      shop1 = { ...shops[0] };
      shop1.owner = user1._id;
      let ref = await Shop(shop1).save();
      id = ref._id.toHexString();
    });
    afterEach(async () => {
      await User.deleteMany({});
      await Shop.deleteMany({});
    });
    it("should return 401 if token is not avaliable", async () => {
      token = "";
      const res = await exec();
      expect(res.status).toBe(401);
    });
    it("should return 403 if owner's token is not provided", async () => {
      token = new User().genrateAuthToken();
      const res = await exec();
      expect(res.status).toBe(403);
    });
    it("should return 404 if shop not found", async () => {
      id = mongoose.Types.ObjectId();
      const res = await exec();
      expect(res.status).toBe(404);
    });
    it("should return 404 if id is not in valid form", async () => {
      id = 25;
      const res = await exec();
      expect(res.status).toBe(404);
    });
    it("should return updated shop ", async () => {
      shop1.name = "new name for shop1";
      shop1.description = "new description for shop1";
      // console.log(shop1);
      const res = await exec();
      expect(res.status).toBe(200);

      expect(res.body.name).toBe("new name for shop1");
      expect(res.body.description).toBe("new description for shop1");
      // in database
      let shop = await Shop.findById(id);
      expect(shop.name).toBe("new name for shop1");
      expect(shop.description).toBe("new description for shop1");
    });
  });

  describe("PUT /:id/image", () => {
    let id;
    let shop1;
    let user1;
    let image;
    const exec = async () => {
      return await request(server)
        .put(endPoint + "/" + id + "/image")
        .set("x-auth-token", token)
        .attach("image", image);
    };
    beforeEach(async () => {
      user1 = new User({ ...users[0] });

      token = user1.genrateAuthToken();
      shop1 = { ...shops[0] };
      shop1.owner = user1._id;
      let ref = await Shop(shop1).save();
      id = ref._id.toHexString();
      image = path.resolve("./static-test/default");
    });
    afterEach(async () => {
      await User.deleteMany({});
      await Shop.deleteMany({});
    });
    it("should return 401 if token is not avaliable", async () => {
      token = "";
      image += ".jpg";
      const res = await exec();
      expect(res.status).toBe(401);
    });
    it("should return 403 if owner's token is not provided", async () => {
      token = new User().genrateAuthToken();
      image += ".jpg";
      const res = await exec();
      expect(res.status).toBe(403);
    });
    it("should return 404 if shop not found", async () => {
      image += ".jpg";
      id = mongoose.Types.ObjectId();
      const res = await exec();
      expect(res.status).toBe(404);
    });
    it("should return 404 if id is not in valid form", async () => {
      id = 25;
      image += ".jpg";
      const res = await exec();
      expect(res.status).toBe(404);
    });

    it("should return 400 if image is not provided", async () => {
      image = "";
      const res = await exec();
      expect(res.status).toBe(400);
    });
    it("should return 415 if media formate not supported", async () => {
      image += ".txt";
      const res = await exec();
      expect(res.status).toBe(415);
    });
    it("should return shop with updated image url", async () => {
      image += ".jpg";
      const res = await exec();
      expect(res.status).toBe(200);
      image =
        path.resolve("./static-test/images") +
        "/" +
        res.body.imageUrl.split("/static/images/")[1];

      fs.unlink(image, (err) => {
        if (err) console.log(err);
      });
    });
  });
});
