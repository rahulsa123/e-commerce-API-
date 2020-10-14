const { required } = require("joi");

const express = require("express");
const { Shop, validateShop } = require("../models/shop");
const auth = require("../middleware/auth");
const validateObjectId = require("../middleware/validateObjectId");

const router = express.Router();

router.get("/", async (req, res) => {
  const shops = await Shop.find().select("-__v");
  return res.send(shops);
});
router.post("/", auth, async (req, res) => {
  const { error } = validateShop(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  let shop = new Shop({
    name: req.body.name,
    description: req.body.description,
  });
  shop.owner = req.user._id;
  shop = await shop.save();
  res.send(shop);
});
router.get("/:id", validateObjectId, async (req, res) => {
  const shop = await Shop.findById(req.params.id).select("-__v");
  if (!shop) return res.status(404).send("Shop not found.");

  return res.send(shop);
});
router.put("/:id", auth, validateObjectId, async (req, res) => {
  // console.log(req.body);
  let shop = await Shop.findById(req.params.id);
  if (!shop) return res.status(404).send("Shop not found.");

  if (shop.owner.toHexString() !== req.user._id)
    return res
      .status(403)
      .send("Forbidden you don't have permission to perform operation.");
  shop = await Shop.findOneAndUpdate(
    { _id: req.params.id },
    {
      name: req.body.name,
      description: req.body.description,
    },
    { new: true }
  );
  // console.log(shop, req.body.name);
  shop = await Shop.findById(req.params.id);
  //console.log(shop);
  return res.send(shop);
});
module.exports = router;
