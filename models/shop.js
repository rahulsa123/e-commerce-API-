const Joi = require("joi");

const mongoose = require("mongoose");

const shopSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
  },
  imageUrl: {
    type: String,
    default: "/static/images/default.jpg",
  },
  description: {
    type: String,
    trim: true,
  },
  updated: Date,
  created: {
    type: Date,
    default: Date.now,
  },
  owner: {
    type: mongoose.Types.ObjectId,
    ref: "User",
  },
});
const Shop = mongoose.model("Shop", shopSchema);

function validateShop(shop) {
  const schema = Joi.object({
    name: Joi.string().min(5).max(50).required(),
    description: Joi.string().min(5).required(),
  });
  return schema.validate(shop);
}
exports.Shop = Shop;
exports.validateShop = validateShop;
