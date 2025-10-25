import { NextResponse } from "next/server";
import dbConnect from "../../../components/dbconnect";
import Expense from "../../../models/expenses.model";



export async function POST(request) {
    try {
        const data = await request.json();
        console.log("Incoming data:", data);
        const res = await dbConnect();

        for (let index = 0; index < data.length; index++) {
            const entries = await Expense.findByIdAndUpdate(data[index]._id , data[index])
            console.log("Updates Entries",entries)
        }
        return NextResponse.json(data,{status:200})
    } catch (error) {
        console.error("Error Updating entries:", error);
        return NextResponse.json(
            { message: "Error Updating entries", error: error.message },
            { status: 500 }
        );
    }
}