import { NextRequest, NextResponse } from "next/server";
import dbConnect from "../../../components/dbconnect";
import Stock from "../../../models/stock.model";



export async function POST(request) {
    try {
        const data = await request.json();
        console.log("Incoming data:", data);
        const res = await dbConnect();
        console.log("Database connection successful:", res);
        const entries = await Stock.findByIdAndDelete(data._id);
        console.log("Deleted entry:", entries);
        return NextResponse.json(entries, { status: 200 });
    }
    catch (error) {
        console.error("Error Deleting entries:", error);
        return NextResponse.json(
            { message: "Error Deleting entries", error: error.message },
            { status: 500 }
        );
    }
}