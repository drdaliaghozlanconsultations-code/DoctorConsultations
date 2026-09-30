import dns from "dns";
import { MongoClient, MongoClientOptions } from "mongodb";

// Ensure Node's DNS resolver can query MongoDB Atlas SRV records in development if local ISP blocks SRV
if (process.env.NODE_ENV === "development") {
  try {
    dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
  } catch (e) {
    // Ignore if not supported in runtime
  }
}

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI;
const options: MongoClientOptions = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 10000, // Timeout after 10s instead of hanging for 30s
  connectTimeoutMS: 10000,
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

// In serverless environments like Vercel, use a global variable to preserve
// the connection across warm function invocations and prevent connection exhaustion.
let globalWithMongo = global as typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient>;
};

if (!globalWithMongo._mongoClientPromise) {
  client = new MongoClient(uri, options);
  globalWithMongo._mongoClientPromise = client.connect().catch((err) => {
    // If the initial connection fails, clear the cached promise so subsequent
    // requests attempt a fresh connection rather than failing immediately with a cached error.
    globalWithMongo._mongoClientPromise = undefined;
    throw err;
  });
}
clientPromise = globalWithMongo._mongoClientPromise;

// Export a module-scoped MongoClient promise.
export default clientPromise;
