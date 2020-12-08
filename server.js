"use strict";

const express = require("express");

// Constants
const PORT = 9000;

// App
const app = express();
app.get("/", async (req, res) => {
  const { PlaywrightTask } = require("./playwright");
  const task = new PlaywrightTask(req);
  const results = await task.startTask();
  res.send("Done!");
});

app.listen(PORT);
console.log(`Running on Port: ${PORT}`);
