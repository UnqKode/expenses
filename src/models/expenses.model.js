import mongoose, { Schema, model, models } from "mongoose";

const expenseSchema = new Schema(
    {
        date: {
            type: Date,
            required: true,
        },
        billno:{
            type: String,
            required: true,
            trim: true,
        },
        item: {
            type: String,
            required: true,
            trim: true, 
        },
        quantity: {
            type: mongoose.Schema.Types.Decimal128,
            required: true,
            min: 1,
        },
        unit:{
            type: String,
            required: true,
            trim: true,
        },
        costPrice: {
            type: mongoose.Schema.Types.Decimal128,
            required: true,
            min: 0,
        },
        sellingPrice: {
            type: mongoose.Schema.Types.Decimal128,
            required: true,
            min: 0,
        },
        paidCash: {
            type: mongoose.Schema.Types.Decimal128,
            default: 0,
            min: 0,
        },
        paidOnline: {
            type: mongoose.Schema.Types.Decimal128,
            default: 0,
            min: 0,
        },
        notes: {
            type: String,
            default: "",
            trim: true,
        },
        buyer: {
            type: String,
            default: "Self",
            trim: true,
            required: true,
        },
    },
    { timestamps: true }
);

const AllTransaction = mongoose.models.AllTransaction || model("AllTransaction", expenseSchema);


export default AllTransaction;
