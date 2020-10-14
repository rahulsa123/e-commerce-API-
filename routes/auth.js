const mongoose = require("mongoose");
const express = require("express");
const Joi = require("joi");
const router = express.Router();
const { User } = require("../models/user");
const bcrypt = require("bcrypt");
function validateLogin(user) {
  const schema = Joi.object({
    name: Joi.string(),
    email: Joi.string().email().max(255).min(5).required(),
    password: Joi.string().required().max(255).min(5),
  });
  return schema.validate(user);
}

router.post("/", async (req, res) => {
  //console.log(req.body);
  const { error } = validateLogin(req.body);

  if (error) return res.status(400).send(error.details[0].message);
  let user = await User.findOne({ email: req.body.email });

  if (!user) return res.status(400).send("Invalid email or password.");
  const validPassword = bcrypt.compare(req.body.password, user.hashed_password);
  if (!validPassword) return res.status(400).send("Invalid email or password.");
  const token = user.genrateAuthToken();

  res.send({ key: token });
});

module.exports = router;
