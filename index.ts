import express from "express";
import { json as jsonParser } from "body-parser";
import Twit from "twit";
import cors from "cors";
import { join } from "path";
require("dotenv").config();

const app = express();
app.use(jsonParser());
app.use(cors());
const port = process.env.PORT || 3000;

const twit = new Twit({
  consumer_key: process.env.consumer_key,
  consumer_secret: process.env.consumer_secret,
  access_token: process.env.access_token_key,
  access_token_secret: process.env.access_token_secret,
  timeout_ms: 60 * 1000,
});

app.get("/", (_, res) => res.sendFile(join(__dirname, "index.html")));

app.get("/search", async (req: express.Request, res: express.Response) => {
  const searchedQuery = req.query.term as string;
  const count = Number(req.query.count);
  try {
    const { data: tweets } = await twit.get("search/tweets", {
      q: searchedQuery || "a",
      count: isNaN(count) ? 10 : count,
    });
    res.json(tweets["statuses"]);
  } catch (error) {
    res.status(400).json(error);
  }
});

app.get("/home", async (req, res) => {
  const count = Number(req.query.count);
  try {
    const { data: timeline } = await twit.get(`statuses/home_timeline`, {
      tweet_mode: "extended",
      count: isNaN(count) ? 10 : count,
    });
    res.json(timeline);
  } catch (error) {
    res.status(400).json(error);
  }
});

app.get("/available-trends", async (_, res) => {
  try {
    res.json((await twit.get("trends/available")).data);
  } catch (error) {
    res.status(400).json(error);
  }
});

app.get("/trends", async (req, res) => {
  const id = req.query.id;
  try {
    const { data } = await twit.get("trends/place", {
      id: (id as string) || "1",
    });
    res.json(data);
  } catch (error) {
    res.status(400).json(error);
  }
});

app.listen(port, () => console.log(`listening at http://localhost:${port}`));
