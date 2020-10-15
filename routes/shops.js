const formidable = require("formidable");
const express = require("express");
const fs = require("fs");
const path = require("path");
const config = require("config");
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

  shop = await Shop.findById(req.params.id);

  return res.send(shop);
});
router.put("/:id/image", auth, validateObjectId, async (req, res) => {
  let shop = await Shop.findById(req.params.id);
  if (!shop) return res.status(404).send("Shop not found.");

  if (shop.owner.toHexString() !== req.user._id)
    return res
      .status(403)
      .send("Forbidden you don't have permission to perform operation.");

  const form = formidable({ multiples: true });

  // get image name
  let imageName = shop.imageUrl.split("/static/images/")[1];

  form.parse(req, (err, fields, files) => {
    if (err) {
      return res.status(415).send("Invalid Media Type.");
    }
    if (!files.image) return res.status(400).send("Image was not provided.");
    if (!files.image.type.startsWith("image/"))
      return res.status(415).send("Invalid Media Type.");

    const tem_path = files.image.path;
    // check  image is default, then genrate new name

    if (imageName.endsWith("default.jpg")) {
      imageName = Date.now() + files.image.name;
    }
    const image =
      path.resolve(`./static-${config.mode}/images/`) + "/" + imageName;
    const raw_date = fs.readFileSync(tem_path);
    fs.writeFile(image, raw_date, async function (err) {
      if (err) return res.status(500).send("unable to save file in server");
      if (!shop.imageUrl.endsWith(imageName)) {
        // update database
        shop = await Shop.findOneAndUpdate(
          {
            _id: shop._id,
          },
          {
            imageUrl: "/static/images/" + imageName,
          },
          { new: true }
        );
      }
      return res.send(shop);
    });
  });
});

module.exports = router;
