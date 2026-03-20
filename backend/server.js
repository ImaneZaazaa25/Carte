import express from "express";
import cors from "cors";
import fs from "fs";
import csv from "csv-parser";
import { MongoClient } from "mongodb";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://mongocart:27017";
const DB_NAME = "sensorsdb";
const CSV_PATH = "./data/PeMSD7_M_Station_Info.csv";

let db;

function distance(a, b) {
  const dx = a.longitude - b.longitude;
  const dy = a.latitude - b.latitude;
  return Math.sqrt(dx * dx + dy * dy);
}

async function loadCsvAndInsert() {
  const stations = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(CSV_PATH)
      .pipe(csv())
      .on("data", (row) => {
        if (row.Latitude && row.Longitude) {
          stations.push({
            stationId: Number(row.ID),
            fwy: row.Fwy ? Number(row.Fwy) : null,
            dir: row.Dir || null,
            district: row.District ? Number(row.District) : null,
            latitude: Number(row.Latitude),
            longitude: Number(row.Longitude),
            location: {
              type: "Point",
              coordinates: [Number(row.Longitude), Number(row.Latitude)]
            }
          });
        }
      })
      .on("end", async () => {
        try {
          const collection = db.collection("stations");

          await collection.deleteMany({});
          if (stations.length > 0) {
            await collection.insertMany(stations, { ordered: false }).catch(() => {});
          }

          resolve(stations);
        } catch (err) {
          reject(err);
        }
      })
      .on("error", reject);
  });
}

function buildLinks(stations, neighbors = 2) {
  const links = [];

  for (const s of stations) {
    const nearest = stations
      .filter((x) => x.stationId !== s.stationId)
      .map((x) => ({
        from: s.stationId,
        to: x.stationId,
        fromCoords: [s.latitude, s.longitude],
        toCoords: [x.latitude, x.longitude],
        dist: distance(s, x)
      }))
      .sort((a, b) => a.dist - b.dist)
      .slice(0, neighbors);

    for (const n of nearest) {
      const keyA = `${n.from}-${n.to}`;
      const keyB = `${n.to}-${n.from}`;
      const exists = links.some(
        (l) => `${l.from}-${l.to}` === keyA || `${l.from}-${l.to}` === keyB
      );

      if (!exists) {
        links.push({
          from: n.from,
          to: n.to,
          coordinates: [n.fromCoords, n.toCoords]
        });
      }
    }
  }

  return links;
}

app.get("/api/stations", async (req, res) => {
  try {
    const stations = await db.collection("stations").find({}).toArray();
    res.json(stations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/links", async (req, res) => {
  try {
    const stations = await db.collection("stations").find({}).toArray();
    const links = buildLinks(stations, 2);
    res.json(links);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

async function start() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  db = client.db(DB_NAME);

  await loadCsvAndInsert();

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Backend running on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error("Startup error:", err);
  process.exit(1);
});