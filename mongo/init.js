db = db.getSiblingDB("sensorsdb");

db.createCollection("stations");
db.stations.createIndex({ stationId: 1 }, { unique: true });
db.stations.createIndex({ location: "2dsphere" });