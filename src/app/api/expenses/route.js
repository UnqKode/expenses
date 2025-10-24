import { NextRequest, NextResponse } from "next/server";
import dbConnect from "../../../components/dbconnect";
import Expense from "../../../models/expenses.model";
import mongoose from "mongoose";

const toDecimal = (value) =>
  mongoose.Types.Decimal128.fromString((value || 0).toString());

export async function POST(request) {
  try {
    await dbConnect();

    const data = await request.json();
    console.log("Incoming data:", data);

    // Validate input
    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      return NextResponse.json(
        { message: "No items provided" },
        { status: 400 }
      );
    }

    const savedEntries = [];

    for (const item of data.items) {
      const newEntry = new Expense({
        date: data.date || new Date(),
        billno: data.billno || "",
        item: item.item || "",
        quantity: toDecimal(item.quantity),
        unit: item.unit || "",
        costPrice: toDecimal(item.Cprice),
        sellingPrice: toDecimal(item.Sprice),
        buyer: data.buyer || "",
        notes: data.notes || "",
        paidCash: toDecimal(data.paidCash),
        paidOnline: toDecimal(data.paidOnline),
      });

      await newEntry.save();
      savedEntries.push(newEntry);
    }

    return NextResponse.json(
      { message: "Entries saved successfully", entries: savedEntries },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error saving entries:", error);
    return NextResponse.json(
      { message: "Error saving entries", error: error.errors || error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await dbConnect();
    const entries = await Expense.find().sort({ createdAt: -1 });
    return NextResponse.json(entries, { status: 200 });
  } catch (error) {
    console.error("Error fetching entries:", error);
    return NextResponse.json(
      { message: "Error fetching entries", error: error.message },
      { status: 500 }
    );
  }
}
