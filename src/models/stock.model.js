import mongoose from "mongoose";

const stockSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    quantity: { type: mongoose.Schema.Types.Decimal128, required: true },
    price: { type: mongoose.Schema.Types.Decimal128, required: true },
    supplier: { type: String, required: true },
    unit:{ type: String, required: true}
  },
  { timestamps: true }
);

const Stock = mongoose.models.Stock || mongoose.model("Stock", stockSchema);

export default Stock;
