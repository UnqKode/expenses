'use client';
import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";

function FormEntry({ stockData }) {
  const [items, setItems] = useState([
    { id: uuidv4(), item: "", quantity: "", unit: "kg", Cprice: "", Sprice: "" },
  ]);
  const [date, setDate] = useState("");
  const [billno, setBillno] = useState("");
  const [buyer, setBuyer] = useState("");
  const [notes, setNotes] = useState("");
  const [paidCash, setPaidCash] = useState(0);
  const [paidOnline, setPaidOnline] = useState(0);

  const addItem = () => {
    setItems([...items, { id: uuidv4(), item: "", quantity: "", unit: "kg", Cprice: "", Sprice: "" }]);
  };

  const removeItem = (id) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const handleItemChange = (id, field, value) => {
    setItems(items.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const setcostPrice = (id, itemName) => {
    const stockItem = stockData.find((stock) => stock.name === itemName.split(':')[0]);
    if (stockItem) {
      const costPrice = parseFloat(stockItem.price.$numberDecimal || stockItem.price);
      setItems((prevItems) =>
        prevItems.map((item) => (item.id === id ? { ...item, Cprice: costPrice } : item))
      );
    } else {
      setItems((prevItems) =>
        prevItems.map((item) => (item.id === id ? { ...item, Cprice: "" } : item))
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = { date, billno, buyer, notes, paidCash, paidOnline, items };
    console.log("Form Data Submitted:", formData);
    
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const result = await res.json();
      console.log("Server Response:", result);
      
      // Reset form
      setDate("");
      setBillno("");
      setBuyer("");
      setNotes("");
      setPaidCash(0);
      setPaidOnline(0);
      setItems([{ id: uuidv4(), item: "", quantity: "", unit: "kg", Cprice: "", Sprice: "" }]);
      const item2 = items;
      try {
        for (const it of item2) {
         const stockD = stockData.find((stock) => stock.name === it.item.split(':')[0]);
          if (stockD) {
            const newQuantity = parseFloat(stockD.quantity.$numberDecimal || stockD.quantity) - parseFloat(it.quantity || 0);
            const updateData = {
              _id: stockD._id,
              name: stockD.name,
              category: stockD.category,
              quantity: newQuantity,
              unit: stockD.unit,
              price: parseFloat(stockD.price.$numberDecimal || stockD.price),
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
        }
      } catch (error) {
        console.error("Error updating stock quantities:", error);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };
  
  // Calculations for Payment Summary
  const totalAmount = items.reduce((sum, item) => sum + (parseFloat(item.Sprice || 0) * parseFloat(item.quantity || 0)), 0);
  const totalPaid = parseFloat(paidCash) + parseFloat(paidOnline);
  const pendingAmount = totalAmount.toFixed(0) - totalPaid;

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
              <input type="date" className="border-2 p-3 rounded-xl w-full" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <label className="block mb-2 font-bold uppercase">Bill No</label>
              <input type="number" className="border-2 p-3 rounded-xl w-full" value={billno} onChange={(e) => setBillno(e.target.value)} />
            </div>
          </div>

          {/* Buyer */}
          <div>
            <label className="block mb-2 font-bold uppercase">Buyer</label>
            <input type="text" className="border-2 p-3 rounded-xl w-full" value={buyer} onChange={(e) => setBuyer(e.target.value)} />
          </div>

          {/* Items */}
          <div className="bg-gray-100 p-4 sm:p-6 rounded-2xl border-2 border-black">
            <div className="flex justify-between items-center mb-4">
              <label className="text-xl font-bold uppercase">Items</label>
              <button type="button" onClick={addItem} className="bg-black text-white px-4 py-2 rounded-xl">+ Add Item</button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {items.map((item, idx) => (
                <div key={item.id} className="border-2 p-4 rounded-xl">
                  <div className="flex justify-between mb-2">
                    <span>Item #{idx + 1}</span>
                    <button disabled={items.length === 1} type="button" onClick={() => removeItem(item.id)} className="text-red-600 disabled:text-gray-400">
                      Remove
                    </button>
                  </div>

                  <label className="block mb-1 font-bold">Item Name</label>
                  <select value={item.item} onChange={(e) => {
                    handleItemChange(item.id, "item", e.target.value);
                    setcostPrice(item.id, e.target.value);
                  }} className="border-2 p-2 w-full rounded-xl">
                    <option value="">Select Item</option>
                    {stockData.map((stockItem, idx) => (
                      <option key={idx} value={stockItem.name}>{`${stockItem.name}: (${stockItem.quantity.$numberDecimal || stockItem.quantity} ${stockItem.unit})`}</option>
                    ))}
                  </select>

                  <label className="block mt-2 mb-1 font-bold">Quantity</label>
                  <div className="flex gap-2">
                    <input type="number" value={item.quantity} onChange={(e) => handleItemChange(item.id, "quantity", e.target.value)} className="border-2 p-2 rounded-xl w-2/3" />
                    <select value={item.unit} onChange={(e) => handleItemChange(item.id, "unit", e.target.value)} className="border-2 p-2 rounded-xl w-1/3">
                      <option value="kg">kg</option>
                      <option value="m2">SqFeet</option>
                    </select>
                  </div>

                  <label className="block mt-2 mb-1 font-bold">Selling Price</label>
                  <input type="number" value={item.Sprice} onChange={(e) => handleItemChange(item.id, "Sprice", e.target.value)} className="border-2 p-2 rounded-xl w-full" />
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
                <input disabled type="number"  className="border-2 border-white bg-white text-black w-full p-3 rounded-xl font-bold text-lg" value={totalAmount.toFixed(0)} />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-bold mb-2 uppercase tracking-wide text-gray-300">
                  Total Paid
                </label>
                <input disabled type="number" className="border-2 border-white bg-white text-black w-full p-3 rounded-xl font-bold text-lg" value={totalPaid.toFixed(0)} />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-bold mb-2 uppercase tracking-wide text-gray-300">
                  Paid Online
                </label>
                <input type="number" className="border-2 border-white bg-white text-black w-full p-3 rounded-xl font-bold text-lg" value={paidOnline.toFixed(0)} onChange={(e) => setPaidOnline(parseFloat(e.target.value))} />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-bold mb-2 uppercase tracking-wide text-gray-300">
                  Paid Cash
                </label>
                <input type="number" className="border-2 border-white bg-white text-black w-full p-3 rounded-xl font-bold text-lg" value={paidCash.toFixed(0)} onChange={(e) => setPaidCash(parseFloat(e.target.value))} />
              </div>
            </div>

            <div className="mt-6 pt-6 border-t-2 border-white">
              <label className="block text-xs sm:text-sm font-bold mb-2 uppercase tracking-wide text-gray-300">
                Pending Amount
              </label>
              <input disabled type="number" className="border-2 border-white bg-white text-black w-full p-4 rounded-xl font-bold text-2xl" value={pendingAmount.toFixed(0)} />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block mb-2 font-bold uppercase">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="border-2 p-3 rounded-xl w-full" rows={4} />
          </div>

          <button type="submit" className="bg-black text-white py-3 px-6 rounded-xl w-full sm:w-auto">Submit Form</button>
        </form>
      </div>
    </div>
  );
}

export default FormEntry;
