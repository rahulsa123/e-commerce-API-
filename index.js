const config = require("config");
const mongoose = require("mongoose");
const express = require("express");
const path = require("path");
const userRouter = require("./routes/users");
const shopRouter = require("./routes/shops");
const authRouter = require("./routes/auth");
const app = express();

mongoose
  .connect(config.mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("connected to mongodb." + config.mongoUri))
  .catch(() => {
    console.log("Could not connect to MongoDB");
    process.exit(1);
  });
app.use(express.json());
app.use("/api/users", userRouter);
app.use("/api/shops", shopRouter);
app.use("/api/login", authRouter);
app.use("/static", express.static(path.join(__dirname, config.staticDir)));

const server = app.listen(config.port, () =>
  console.log(`listening on port ${config.port}`)
);

module.exports = server;
