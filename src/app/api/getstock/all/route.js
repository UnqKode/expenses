import { NextRequest, NextResponse } from "next/server";
import dbConnect from "../../../../components/dbconnect";
import Stock from "../../../../models/stock.model";



export async function GET() {
  try {
    const res = await dbConnect();
    console.log("Database connection successful:", res);
    const entries = await Stock.find().sort({ createdAt: -1 });
    return NextResponse.json(entries, { status: 200 });
  } catch (error) {
    console.error("Error fetching entries:", error);
    return NextResponse.json(
      { message: "Error fetching entries", error: error.message },
      { status: 500 }
    );
  }
}