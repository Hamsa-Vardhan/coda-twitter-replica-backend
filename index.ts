import express from "express";
import { json as jsonParser } from "body-parser";
import Twit from "twit";
import cors from "cors";
import { join } from "path";
import { count } from "node:console";
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

const cache = {
  search: {
    count: 10,
    searchedQuery: "a",
    data: [],
  },
  home: {
    count: 10,
    data: [],
  },
  availableTrends: {
    data: [],
  },
  availableCountries: {
    data: [],
  },
  trends: {
    id: NaN,
    country: "india",
    data: [],
  },
  randIds: {
    count: 10,
    data: [],
  },
  moreTrends: {
    count: 10,
    data: [],
  },
};

app.get("/", (_, res) => res.sendFile(join(__dirname, "index.html")));

app.get("/search", async (req: express.Request, res: express.Response) => {
  const searchedQuery = req.query.term as string;
  const count = Number(req.query.count);
  if (
    (cache.search.searchedQuery === searchedQuery ||
      cache.search.count === count) &&
    cache.search.data.length > 0
  ) {
    res.json(cache.search.data);
    return;
  }
  try {
    const { data: tweets } = await twit.get("search/tweets", {
      q: searchedQuery || "a",
      count: isNaN(count) ? 10 : count,
    });
    if (searchedQuery) cache.search.searchedQuery = searchedQuery;
    if (count) cache.search.count = count;
    cache.search.data = tweets["statuses"];
    res.json(tweets["statuses"]);
  } catch (error) {
    res.status(404).json(error);
  }
});

app.get("/home", async (req, res) => {
  const count = Number(req.query.count);
  if (cache.home.count === count && cache.home.data.length > 0) {
    res.json(cache.home.data);
    return;
  }
  try {
    const { data: timeline } = await twit.get(`statuses/home_timeline`, {
      tweet_mode: "extended",
      count: isNaN(count) ? 10 : count,
    });
    if (count) cache.home.count = count;
    cache.home.data = timeline as Object[];
    res.json(timeline);
  } catch (error) {
    res.status(404).json(error);
  }
});

app.get("/available-trends", async (_, res) => {
  if (cache.availableTrends.data.length > 0) {
    res.json(cache.availableTrends.data);
    return;
  }
  try {
    const { data } = await twit.get("trends/available");
    cache.availableTrends.data = data as Object[];
    res.json(data);
  } catch (error) {
    res.status(404).json(error);
  }
});

app.get("/available-countries", async (_, res) => {
  if (cache.availableCountries.data.length > 0) {
    res.json(cache.availableCountries.data);
    return;
  }
  try {
    const data = [
      ...new Set(
        ((await twit.get("trends/available")).data as Object[]).map(
          (el) => el["country"]
        )
      ),
    ];
    cache.availableCountries.data = data;
    res.json(data);
  } catch (error) {
    res.status(404).json(error);
  }
});

app.get("/trends", async (req, res) => {
  const id = req.query.id as string;
  const country = req.query.country as string;
  if (
    cache.trends.id === Number(id) &&
    cache.trends.country.toLowerCase() === country.toLowerCase() &&
    cache.trends.data.length > 0
  )
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
        const data = await Promise.all(
          ids.map(async (id) => (await twit.get("trends/place", { id })).data)
        );
        if (country) cache.trends.country = country;
        cache.trends.data = data;
        res.json(data);
      }
    } catch (error) {
      res.status(404).json(error);
    }
});

app.get("/randIds", async (req, res) => {
  const count = !isNaN(Number(req.query.count)) ? Number(req.query.count) : 10;
  if (cache.randIds.count === count && cache.randIds.data.length > 0) {
    res.json(cache.randIds.data);
  }
  try {
    res.json(
      ((await twit.get("trends/available")).data as object[])
        .sort(() => 0.5 - Math.random())
        .slice(0, count)
        .map((el) => el["woeid"])
    );
  } catch (error) {
    res.status(404).json(error);
  }
});

app.get("/moreTrends", async (req, res) => {
  const count = !isNaN(Number(req.query.count)) ? Number(req.query.count) : 10;
  if (cache.randIds.count === count && cache.randIds.data.length > 0) {
    res.json(cache.randIds.data);
  }
  try {
    const ids = ((await twit.get("trends/available")).data as object[])
      .sort(() => 0.5 - Math.random())
      .slice(0, count)
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
