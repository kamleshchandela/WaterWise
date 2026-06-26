import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

async function checkIndexes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    console.log("Connected DB:", db.databaseName);

    const collections = await db.listCollections().toArray();
    console.log("\nCollections:", collections.map(c => c.name));

    for (const col of collections) {
      const indexes = await db.collection(col.name).indexes();
      console.log(`\n=== ${col.name} indexes ===`);
      indexes.forEach(idx => console.log(JSON.stringify(idx, null, 2)));
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error("Error:", err.message);
  }
}

checkIndexes();
