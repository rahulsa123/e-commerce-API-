const express = require("express");
const router = express.Router();
const { User, validateUser } = require("../models/user");
const _ = require("lodash");
const hasToken = require("../middleware/auth");

const validateObjectId = require("../middleware/validateObjectId");
router.get("/", async (req, res) => {
  const users = await User.find().select("_id name email");
  res.send(users);
});

router.post("/", async (req, res) => {
  const { error } = validateUser(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  let user = await User.findOne({ email: req.body.email });
  if (user) return res.status(400).send("User already registered.");
  try {
    user = new User({
      email: req.body.email,
      name: req.body.name,
    });
    await user.setPassword(req.body.password);
    const token = user.genrateAuthToken();
    await user.save();
    res
      .header("x-auth-token", token)
      .header("access-control-expose-headers", "x-auth-token")
      .send(_.pick(user, ["name", "_id", "email"]));
    return;
  } catch (ex) {
    res.status(400).send(ex);
  }
});

router.get("/:id", validateObjectId, async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).send("Not found.");
  res.send(_.pick(user, ["_id", "name", "email"]));
});

router.put("/:id", hasToken, validateObjectId, async (req, res) => {
  if (req.user._id !== req.params.id)
    return res
      .status(403)
      .send("The user does not have access rights to the content");
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { name: req.body.name, seller: req.body.seller || false },
    { new: true }
  );
  if (!user) return res.status(404).send("Not found.");
  //console.log(user);
  res.send(user);
});

module.exports = router;
