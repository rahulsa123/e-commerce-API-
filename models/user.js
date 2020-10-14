const Joi = require("joi");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const config = require("config");
const { boolean } = require("joi");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 50,
    trim: true,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  hashed_password: {
    type: String,
    required: true,
    maxlength: 1000,
  },
  email: {
    type: String,
    required: true,
    maxlength: 50,
    trim: true,
    unique: true,
  },
  seller: {
    type: Boolean,
    default: false,
  },
});
userSchema.methods.setPassword = async function (password) {
  const salt = await bcrypt.genSalt(10);

  this.hashed_password = await bcrypt.hash(password, salt);
  return this.hashed_password;
};
userSchema.methods.genrateAuthToken = function () {
  const token = jwt.sign(
    {
      _id: this._id,
      name: this.name,
      email: this.email,
      isAdmin: this.isAdmin,
      seller: this.seller,
    },
    config.jwtKey
  );
  return token;
};
const User = mongoose.model("User", userSchema);

function validateUser(user) {
  const schema = Joi.object({
    name: Joi.string().min(5).max(50).required(),
    email: Joi.string().min(5).max(75).email().required(),
    password: Joi.string().min(5).max(255).required(),
    seller: Joi.boolean(),
  });
  return schema.validate(user);
}

exports.User = User;
exports.validateUser = validateUser;
