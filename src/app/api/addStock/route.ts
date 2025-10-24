import { NextRequest, NextResponse } from "next/server";
import dbConnect from "../../../components/dbconnect";
import Stock from "../../../models/stock.model";



export async function POST(request: NextRequest) {
    try {
        const data = await request.json();
        console.log("Incoming data:", data);
        const res = await dbConnect();
        const newStock = new Stock(data);
        await newStock.save();
        console.log("New Stock saved:", newStock);
        return NextResponse.json(
            { message: "Stock added successfully", stock: newStock },
            { status: 201 }
        );
    }
    catch (error) {
        console.error("Error Saving entries:", error);
        return NextResponse.json(
            { message: "Error Saving entries", error: error.message },
            { status: 500 }
        );
    }
}