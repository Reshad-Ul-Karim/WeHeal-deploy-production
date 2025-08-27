import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const connectDB = async () => {
  const primaryUri = process.env.MONGO_URI;
  const localUri = "mongodb://127.0.0.1:27017/weheal"; // 127.0.0.1 avoids IPv6/socket issues

  const tryConnect = async (uriLabel, uri, attempts = 3, delayMs = 2000) => {
    let lastError = null;
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      console.log(`Attempt ${attempt}/${attempts} connecting to ${uriLabel}: ${uri}`);
      try {
        const conn = await mongoose.connect(uri);
        console.log(`MongoDB Connected (${uriLabel}): ${conn.connection.host}`);
        console.log(`Database name: ${conn.connection.name}`);
        console.log(`Database ready state: ${conn.connection.readyState}`);
        console.log(
          `Database collections: ${Object.keys(conn.connection.collections)}`
        );
        return conn;
      } catch (error) {
        lastError = error;
        console.log(`Connection failed (${uriLabel}) [${attempt}/${attempts}]:`, error.message);
        // If SRV DNS failure on Atlas, break early to try local
        if (error?.message?.includes("querySrv") || error?.code === "ENOTFOUND") {
          console.log("Detected DNS/SRV issue. Will try local MongoDB next if available.");
          break;
        }
        if (attempt < attempts) {
          await sleep(delayMs);
        }
      }
    }
    if (lastError) throw lastError;
    return null;
  };

  console.log("=== Database Connection Debug ===");
  console.log("mongo_uri:", primaryUri || localUri);
  console.log("Environment:", process.env.NODE_ENV || "development");
  console.log("Current working directory:", process.cwd());

  try {
    // Try primary first if provided, otherwise local
    if (primaryUri) {
      try {
        const conn = await tryConnect("primary", primaryUri);
        console.log("=== End Database Connection Debug ===");
        return conn;
      } catch (primaryError) {
        console.log("Primary connection failed. Falling back to local MongoDB...");
        try {
          const conn = await tryConnect("local", localUri);
          console.log("=== End Database Connection Debug ===");
          return conn;
        } catch (localError) {
          console.log("Local fallback connection also failed.");
          throw localError;
        }
      }
    } else {
      const conn = await tryConnect("local", localUri);
      console.log("=== End Database Connection Debug ===");
      return conn;
    }
  } catch (error) {
    console.log("=== Database Connection Error ===");
    console.log("Error connection to MongoDB:", error.message);
    console.log("Error stack:", error.stack);
    console.log(
      "If using local MongoDB, please ensure it is running on localhost:27017"
    );
    console.log("=== End Database Connection Error ===");
    // Re-throw to let the caller decide whether to exit or continue
    throw error;
  }
};
