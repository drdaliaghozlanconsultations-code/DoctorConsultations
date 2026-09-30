import dns from "dns";
import { MongoClient, MongoClientOptions } from "mongodb";

// Ensure Node's DNS resolver can query MongoDB Atlas SRV records.
// Serverless runtimes (e.g. Vercel) may use a resolver that fails SRV lookups.
try {
  dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
} catch (_e) {
  // Ignore if not supported in runtime
}

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI;
const options: MongoClientOptions = {
  maxPoolSize: 10,
  minPoolSize: 1,
  // Serverless cold-starts can take 15-20s; 10s was too aggressive.
  serverSelectionTimeoutMS: 30000,
  connectTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  // Faster heartbeat so the driver detects a recovered primary sooner
  heartbeatFrequencyMS: 5000,
  retryWrites: true,
  retryReads: true,
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
