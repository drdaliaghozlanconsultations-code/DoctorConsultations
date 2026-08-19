import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    
    // Ping the database to check if the connection is alive
    await db.command({ ping: 1 });
    
    // List databases to demonstrate a successful query
    const adminDb = client.db().admin();
    const dbsList = await adminDb.listDatabases();
    
    return NextResponse.json({
      status: "success",
      message: "Successfully connected to MongoDB!",
      databases: dbsList.databases.map((d: any) => d.name),
    });
  } catch (error: any) {
    console.error("Database connection error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to connect to MongoDB",
        error: error.message || error,
      },
      { status: 500 }
    );
  }
}
