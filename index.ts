import * as express from "express";
import { json as jsonParser } from "body-parser";
import * as Twit from "twit";
import * as cors from "cors";
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

app.get("/", (_, res) => res.send("app is working fine..."));

app.get("/search", async (req: express.Request, res: express.Response) => {
  const searchedQuery = req.query.term as string;
  const count = Number(req.query.count);
  const { data: tweets } = await twit.get("search/tweets", {
    q: searchedQuery || "a",
    count: isNaN(count) ? 10 : count,
  });
  res.json(tweets["statuses"]);
});

app.get("/home", async (req, res) => {
  const count = Number(req.query.count);
  const { data: timeline } = await twit.get(`statuses/home_timeline`, {
    tweet_mode: "extended",
    count: isNaN(count) ? 10 : count,
  });
  res.json(timeline);
});

app.listen(port, () => console.log(`listening at http://localhost:${port}`));
