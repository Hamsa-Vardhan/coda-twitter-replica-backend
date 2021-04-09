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
    res.status(404).json(error);
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
    res.status(404).json(error);
  }
});

app.get("/available-trends", async (_, res) => {
  try {
    res.json((await twit.get("trends/available")).data);
  } catch (error) {
    res.status(404).json(error);
  }
});

app.get("/available-countries", async (_, res) => {
  try {
    res.json([
      ...new Set(
        ((await twit.get("trends/available")).data as Object[]).map(
          (el) => el["country"]
        )
      ),
    ]);
  } catch (error) {
    res.status(404).json(error);
  }
});

app.get("/trends", async (req, res) => {
  const id = req.query.id as string;
  const country = req.query.country as string;
  try {
    if (id) {
      const { data } = await twit.get("trends/place", {
        id: id,
      });
      res.json(data);
    } else {
      const ids = ((await twit.get("trends/available")).data as Object[])
        .filter((el) =>
          (el["country"] as string).toLowerCase() === country
            ? country.toLowerCase()
            : "india"
        )
        .map((el) => el["woeid"]);
      res.json(
        await Promise.all(
          ids.map(async (id) => (await twit.get("trends/place", { id })).data)
        )
      );
    }
  } catch (error) {
    res.status(404).json(error);
  }
});

app.get("/randIds", async (req, res) => {
  const count = Number(req.query.count);
  try {
    res.json(
      ((await twit.get("trends/available")).data as object[])
        .sort(() => 0.5 - Math.random())
        .slice(0, !isNaN(count) ? count : 10)
        .map((el) => el["woeid"])
    );
  } catch (error) {
    res.status(404).json(error);
  }
});

app.get("/moreTrends", async (req, res) => {
  const count = Number(req.query.count);
  try {
    const ids = ((await twit.get("trends/available")).data as object[])
      .sort(() => 0.5 - Math.random())
      .slice(0, !isNaN(count) ? count : 10)
      .map((el) => el["woeid"]);
    res.json(
      await Promise.all(
        ids.map(async (id) => (await twit.get("trends/place", { id })).data)
      )
    );
  } catch (error) {
    res.status(404).json(error);
  }
});

app.listen(port, () => console.log(`listening at http://localhost:${port}`));
