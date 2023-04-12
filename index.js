import { config } from "dotenv";
import express from "express";
import axios from "axios";
import cors from "cors";
import { MongoClient } from "mongodb";

config();
const app = express();

app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
  })
);

app.use(express.json());

let mongoClient = await new MongoClient(process.env.MONGO_URI, {
  useUnifiedTopology: true,
  useNewUrlParser: true
}).connect()

let transactions = mongoClient.db("Waffles").collection("Transactions")

const apiUrl = "https://api.flutterwave.com/v3/transactions";
const apiKey = process.env.FLUTIL_API_KEY;

app.get("/api/transactions", async (req, res) => {
  let pageNumber = 1;
  let total_pages = 0;
  const allTransactions = [];
  while (pageNumber) {
    await fetch(
      `${apiUrl}?from=2023-04-11&status=successful&page=${pageNumber.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      }
    )
      .then((response) => response.json())
      .then(async (data) => {
        let flutterwaveTransactionCount = data.meta.page_info.total
        let cacheIsCurrent = await checkCache(flutterwaveTransactionCount)
        if (cacheIsCurrent) {
          let cachedTransactions = await readTransactions()
          pageNumber = false;
          res.send(cachedTransactions);
        } else {
          total_pages = Math.ceil(data.meta.page_info.total / 100);

          if (data.data.length > 10) {
            console.log(data.data.length);
            allTransactions.push(...data.data);
            if (pageNumber === total_pages) {

              pageNumber = false;
              await insertTransactions(allTransactions);
              return res.send(allTransactions);
            }
            pageNumber++;
          } else if (
            allTransactions.length < data.meta.page_info.total &&
            data.meta.page_info.total_pages == total_pages
          ) {
            console.log(data.data.length);

            allTransactions.push(...data.data);
            pageNumber = false;
            await insertTransactions(allTransactions);
            return res.send(allTransactions);
          }
        }
      })
      .catch(async (error) => {
        console.log(error);
        let cachedTransactions = await readTransactions()
        pageNumber = false;
        return res.send(cachedTransactions)
      });
  }
});

app.listen(4000, () => {
  console.log("server is running");
});


async function insertTransactions(data) {
  for (let transaction of data) {
    // make sure is unique
    await transactions.insertOne({ ...transaction, "_id": transaction.id }, { upsert: true })
  }
}

// need to add date field
async function readTransactions() {
  let cursor = await transactions.find({})
  let allTransactions = await cursor.toArray()
  return allTransactions
}

async function checkCache(count) {
  let cursor = await transactions.find({})
  let cacheCount = await cursor.count()
  if (cacheCount === count) {
    return true
  } else {
    return false
  }
}