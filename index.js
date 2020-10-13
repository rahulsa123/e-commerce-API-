const config = require("config");
const mongoose = require("mongoose");
const express = require("express");
const userRouter = require("./routes/users");
const app = express();

mongoose
  .connect(config.mongoUri, { useNewUrlParser: true })
  .then(() => console.log("connected to mongodb." + config.mongoUri))
  .catch(() => {
    console.log("Could not connect to MongoDB");
    process.exit(1);
  });
app.use(express.json());
app.use("/api/users", userRouter);

const server = app.listen(config.port, () =>
  console.log(`listening on port ${config.port}`)
);

module.exports = server;
