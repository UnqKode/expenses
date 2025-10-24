import { NextRequest, NextResponse } from "next/server";
import dbConnect from "../../../../components/dbconnect";
import Stock from "../../../../models/stock.model";



export async function POST(request) {
    try {
        const data = await request.json();
        console.log("Incoming data:", data);
        const res = await dbConnect();
        console.log("Database connection successful:", res);
        const entries = await Stock.findByIdAndUpdate(data._id, data, { new: true });
        console.log("Updated entry:", entries);
        return NextResponse.json(entries, { status: 200 });
    }
    catch (error) {
        console.error("Error Updating entries:", error);
        return NextResponse.json(
            { message: "Error Updating entries", error: error.message },
            { status: 500 }
        );
    }
}