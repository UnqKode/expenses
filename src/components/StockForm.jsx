"use client";
import React, { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";

function StockForm({ update, data }) {
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    quantity: "",
    unit: "",
    price: "",
    supplier: "",
  });

  useEffect(() => {
    if (update && data) {
      console.log("Update Data:", data);
      setFormData({
        name: data.name || "",
        category: data.category || "",
        quantity: data.quantity.$numberDecimal || "",
        unit: data.unit || "",
        price: data.price.$numberDecimal || "",
        supplier: data.supplier || "",
      });
    }
  }, [update, data]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!update) {
      console.log("Stock Added:", formData);
      const id = Date.now();
      const newStock = { id, ...formData };

      try {
        const res = await fetch("/api/addStock", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newStock),
        });

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Server error (${res.status}): ${errorText}`);
        }

        const data = await res.json();
        console.log("Stock added successfully:", data);

        // ✅ Optional: Clear form or show success message
        setFormData({
          name: "",
          category: "",
          quantity: "",
          unit: "",
          price: "",
          supplier: "",
        });
      } catch (error) {
        console.error("Error adding stock:", error);
      }
    } else {
      console.log("Stock Updated:", formData);
      try {
        const res = await fetch("/api/getstock/one", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ _id: data._id, ...formData }),
        });
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Server error (${res.status}): ${errorText}`);
        }
        const data2 = await res.json();
        console.log("Stock updated successfully:", data2);
      } catch (error) {
        console.error("Error updating stock:", error);
      }
      setFormData({
        name: "",
        category: "",
        quantity: "",
        unit: "",
        price: "",
        supplier: "",
      });
    }
  };


  
  return (
    <div className="absolute min-h-screen max-w-7xl z-3 overflow-y-auto w-[95vw] p-2">
      <form
        onSubmit={handleSubmit}
        className="w-full  border-2 border-black rounded-2xl p-6 space-y-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.3)] bg-white"
      >
        <h1 className="text-2xl font-bold text-center text-black">
          Add Stock Item
        </h1>

        {/* Input Fields */}
        {[
          { label: "Item Name", name: "name" },
          { label: "Category", name: "category" },
          { label: "Quantity", name: "quantity", type: "number" },
          { label: "Unit", name: "unit" },
          { label: "Cost Price (₹)", name: "price", type: "number" },
          { label: "Supplier", name: "supplier" },
        ].map((field) => (
          <div key={field.name}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
            </label>
            <input
              type={field.type || "text"}
              name={field.name}
              value={formData[field.name]}
              onChange={handleChange}
              required
              className="w-full border border-black rounded-lg p-2 text-black bg-white focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
        ))}

        {/* Submit */}
        <button
          type="submit"
          className="w-full py-2 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors font-semibold"
        >
          Add Stock
        </button>
      </form>
    </div>
  );
}

export default StockForm;
