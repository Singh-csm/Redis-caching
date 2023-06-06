import express from "express";
import redis from "redis";
import fetch from "node-fetch"

const PORT = 5000;
const REDIS_PORT = 6379;

//const client = redis.createClient(REDIS_PORT);

const app = express();


import { createClient } from 'redis';

const client = createClient({
  password: 'TQEczrbJWuzX3inf50JPiezOzXlrIsX9',
  socket: {
    host: 'redis-16953.c212.ap-south-1-1.ec2.cloud.redislabs.com',
    port: 16953
  }
});



client.on("connect", async function () {
  console.log("Connected to Redis..");
});


// Set response
function setResponse(username, repos) {
  return `<h2>${username} has ${repos} Github repos</h2>`;
}

// Make request to Github for data
async function getRepos(req, res, next) {
  try {
    console.log('Fetching Data...');

    const { username } = req.params;

    const response = await fetch(`https://api.github.com/users/${username}`);

    const data = await response.json();

    const repos = data.public_repos;

    // Set data to Redis
    client.SETEX(username, 3600, repos);

    res.send(setResponse(username, repos));
  } catch (err) {
    console.error(err);
    res.status(500).send();
  }
}

// Cache middleware
function cache(req, res, next) {
  const { username } = req.params;

  client.get(username, (err, data) => {
    if (err) throw err;

    if (data !== null) {
      res.send(setResponse(username, data));
    } else {
      next();
    }
  });
}

app.get('/repos/:username', cache, getRepos);

app.listen(5000, () => {
  console.log(`App listening on port ${PORT}`);
});