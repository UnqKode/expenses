"use client";
import React, { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";

function FormEntry({ stockData, ExpenseData }) {
  const [items, setItems] = useState([]);
  const [orignalData, setOriginalData] = useState([]);
  const [date, setDate] = useState(ExpenseData[0]?.date?.slice(0, 10) || "");
  const [billno, setBillno] = useState(ExpenseData[0]?.billno || "");
  const [buyer, setBuyer] = useState(ExpenseData[0]?.buyer || "");
  const [notes, setNotes] = useState(ExpenseData[0]?.notes || "");
  const [paidCash, setPaidCash] = useState(
    ExpenseData[0]?.paidCash?.$numberDecimal || 0
  );
  const [paidOnline, setPaidOnline] = useState(
    ExpenseData[0]?.paidOnline?.$numberDecimal || 0
  );
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Store both original and current data
    const normalizedData = ExpenseData.map((item) => ({
      ...item,
      quantity: parseFloat(item.quantity?.$numberDecimal ?? item.quantity ?? 0),
      sellingPrice: parseFloat(
        item.sellingPrice?.$numberDecimal ?? item.sellingPrice ?? 0
      ),
    }));

    setOriginalData(normalizedData);
    setItems(ExpenseData);
  }, [ExpenseData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const formData = items;
    console.log("Form Data Submitted:", formData);

    try {
      const res = await fetch("/api/updateExpenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const result = await res.json();
      console.log("Server Response:", result);

      // Update stock quantities
      const item2 = items;
      let i = 0; // Move counter outside the loop
      try {
        for (const it of item2) {
          const stockD = stockData.find(
            (stock) => stock.name === it.item.split(":")[0]
          );
          if (stockD && ExpenseData[i]) {
            console.log(orignalData);
            const currentQuantity = parseFloat(
              it.quantity?.$numberDecimal ?? it.quantity ?? 0
            );
            const oldQuantity = parseFloat(
              orignalData[i].quantity?.$numberDecimal ?? orignalData[i].quantity ?? 0
            );
            const stockQuantity = parseFloat(
              stockD.quantity?.$numberDecimal ?? stockD.quantity ?? 0
            );
            console.log(currentQuantity, oldQuantity, stockQuantity);
            const newQuantity = stockQuantity - (currentQuantity - oldQuantity);
            console.log(newQuantity);
            const updateData = {
              _id: stockD._id,
              name: stockD.name,
              category: stockD.category,
              quantity: newQuantity,
              unit: stockD.unit,
              price: parseFloat(
                stockD.price?.$numberDecimal ?? stockD.price ?? 0
              ),
              supplier: stockD.supplier,
            };

            const res2 = await fetch("/api/getstock/one", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(updateData),
            });

            if (!res2.ok) {
              const errorText = await res2.text();
              throw new Error(`Server error (${res2.status}): ${errorText}`);
            }

            const data2 = await res2.json();
            console.log("Stock updated successfully:", data2);
          } else {
            console.warn(`Stock item not found for: ${it.item}`);
          }
          i++; // Increment counter
        }
      } catch (error) {
        console.error("Error updating stock quantities:", error);
      }

      // Reset form
      setDate("");
      setBillno("");
      setBuyer("");
      setNotes("");
      setPaidCash(0);
      setPaidOnline(0);
      setItems([
        {
          id: uuidv4(),
          item: "",
          quantity: "",
          unit: "kg",
          Cprice: "",
          Sprice: "",
        },
      ]);
    } catch (error) {
      console.error("Error submitting form:", error);
    }
    setSubmitting(false);
  };

  const handleItemChange = (id, field, value) => {
    setItems((prevItems) =>
      prevItems.map((item) =>
        item._id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const handlePriceChange = (field, value) => {
    setItems((prevItems) =>
      prevItems.map((item) => {
        const newItem = { ...item };

        if (newItem[field]?.$numberDecimal !== undefined) {
          newItem[field].$numberDecimal = value;
        } else {
          newItem[field] = value;
        }

        return newItem;
      })
    );
  };

  const handleQuantityChange = (id, value) => {
    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item._id === id) {
          const newItem = { ...item };
          if (newItem.quantity?.$numberDecimal !== undefined) {
            newItem.quantity.$numberDecimal = value;
          } else {
            newItem.quantity = value;
          }
          return newItem;
        }
        return item;
      })
    );
  };

  // Calculations for Payment Summary
  const totalAmount = items.reduce(
    (sum, item) =>
      sum +
      parseFloat(
        (item.sellingPrice?.$numberDecimal ?? item.sellingPrice) || 0
      ) *
        parseFloat((item.quantity?.$numberDecimal ?? item.quantity) || 0),
    0
  );

  const totalPaid = parseFloat(paidCash) + parseFloat(paidOnline);
  const pendingAmount = totalAmount - totalPaid;

  return (
    <div className="absolute min-h-screen max-w-7xl p-4 sm:p-6 lg:p-10 overflow-y-auto">
      <div className="mx-auto bg-white border-2 border-black rounded-3xl p-4 sm:p-6 md:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-8 border-b-4 border-black pb-4 text-center md:text-left">
          Form Entry
        </h1>

        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
          {/* Date & Bill */}
          <div className="bg-gray-100 p-4 sm:p-6 rounded-2xl border-2 border-black grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 font-bold uppercase">Date</label>
              <input
                type="date"
                className="border-2 p-3 rounded-xl w-full"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block mb-2 font-bold uppercase">Bill No</label>
              <input
                disabled
                type="number"
                className="border-2 p-3 rounded-xl w-full"
                value={billno}
                onChange={(e) => setBillno(e.target.value)}
              />
            </div>
          </div>

          {/* Buyer */}
          <div>
            <label className="block mb-2 font-bold uppercase">Buyer</label>
            <input
              type="text"
              className="border-2 p-3 rounded-xl w-full"
              value={buyer}
              onChange={(e) => setBuyer(e.target.value)}
            />
          </div>

          {/* Items */}
          <div className="bg-gray-100 p-4 sm:p-6 rounded-2xl border-2 border-black">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {items.map((item, idx) => (
                <div
                  key={item.id || item._id}
                  className="border-2 p-4 rounded-xl bg-white"
                >
                  <div className="flex justify-between mb-2">
                    <span className="font-bold">Item #{idx + 1}</span>
                  </div>

                  <label className="block mb-1 font-bold">Item Name</label>
                  <select
                    value={item.item}
                    className="border-2 p-2 w-full rounded-xl"
                    onChange={(e) =>
                      handleItemChange(item._id, "item", e.target.value)
                    }
                  >
                    <option value="">Select Item</option>
                    {stockData.map((stockItem, idx) => (
                      <option key={idx} value={stockItem.name}>
                        {`${stockItem.name}: (${Number(
                          stockItem.quantity?.$numberDecimal ??
                            stockItem.quantity
                        ).toFixed(0)} ${stockItem.unit})`}
                      </option>
                    ))}
                  </select>

                  <label className="block mt-2 mb-1 font-bold">Quantity</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={
                        item.quantity?.$numberDecimal ?? item.quantity ?? ""
                      }
                      className="border-2 p-2 rounded-xl w-2/3"
                      onChange={(e) =>
                        handleQuantityChange(item._id, e.target.value)
                      }
                    />
                    <select
                      value={item.unit}
                      className="border-2 p-2 rounded-xl w-1/3"
                      onChange={(e) =>
                        handleItemChange(item._id, "unit", e.target.value)
                      }
                    >
                      <option value="kg">kg</option>
                      <option value="m2">SqFeet</option>
                    </select>
                  </div>

                  <label className="block mt-2 mb-1 font-bold">
                    Selling Price
                  </label>
                  <input
                    type="number"
                    value={
                      item.sellingPrice?.$numberDecimal ??
                      item.sellingPrice ??
                      ""
                    }
                    className="border-2 p-2 rounded-xl w-full"
                    onChange={(e) =>
                      handleItemChange(item._id, "sellingPrice", e.target.value)
                    }
                  />
                  <label className="block mt-2 mb-1 font-bold">
                    Item Total
                  </label>
                  <input
                    disabled
                    type="number"
                    value={(
                      (parseFloat(
                        item.sellingPrice?.$numberDecimal ?? item.sellingPrice
                      ) || 0) *
                      (parseFloat(
                        item.quantity?.$numberDecimal ?? item.quantity
                      ) || 0)
                    ).toFixed(0)}
                    className="bg-black text-white font-bold border-2 p-2 rounded-xl w-full"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Payment Summary */}
          <div className="bg-black/80 text-white p-4 sm:p-6 md:p-8 rounded-2xl border-2 border-black transition-all">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-6 uppercase tracking-wide pb-3 border-b-2 border-white text-center md:text-left">
              Payment Summary
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs sm:text-sm font-bold mb-2 uppercase tracking-wide text-gray-300">
                  Total Amount
                </label>
                <input
                  disabled
                  type="number"
                  className="border-2 border-white bg-white text-black w-full p-3 rounded-xl font-bold text-lg"
                  value={totalAmount.toFixed(0)}
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-bold mb-2 uppercase tracking-wide text-gray-300">
                  Total Paid
                </label>
                <input
                  disabled
                  type="number"
                  className="border-2 border-white bg-white text-black w-full p-3 rounded-xl font-bold text-lg"
                  value={totalPaid.toFixed(0)}
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-bold mb-2 uppercase tracking-wide text-gray-300">
                  Paid Online
                </label>
                <input
                  type="number"
                  className="border-2 border-white bg-white text-black w-full p-3 rounded-xl font-bold text-lg"
                  value={Number(
                    paidOnline?.$numberDecimal ?? paidOnline
                  ).toFixed(0)}
                  onChange={(e) => {
                    setPaidOnline(parseFloat(e.target.value) || 0);
                    handlePriceChange("paidOnline", e.target.value);
                  }}
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-bold mb-2 uppercase tracking-wide text-gray-300">
                  Paid Cash
                </label>
                <input
                  type="number"
                  className="border-2 border-white bg-white text-black w-full p-3 rounded-xl font-bold text-lg"
                  value={Number(paidCash?.$numberDecimal ?? paidCash).toFixed(
                    0
                  )}
                  onChange={(e) => {
                    setPaidCash(parseFloat(e.target.value) || 0);
                    handlePriceChange("paidCash", e.target.value);
                  }}
                />
              </div>
            </div>

            <div className="mt-6 pt-6 border-t-2 border-white">
              <label className="block text-xs sm:text-sm font-bold mb-2 uppercase tracking-wide text-gray-300">
                Pending Amount
              </label>
              <input
                disabled
                type="number"
                className="border-2 border-white bg-white text-black w-full p-4 rounded-xl font-bold text-2xl"
                value={pendingAmount.toFixed(0)}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block mb-2 font-bold uppercase">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="border-2 p-3 rounded-xl w-full"
              rows={4}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className={`bg-black text-white py-3 px-6 rounded-xl w-full sm:w-auto font-bold uppercase tracking-wide hover:bg-gray-800 transition-colors ${
              submitting ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {submitting ? "Submitting..." : "Submit Form"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default FormEntry;
