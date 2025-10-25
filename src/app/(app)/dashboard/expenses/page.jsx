"use client";

import React, { use, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Form from "../../../../components/Form";
import { set } from "mongoose";
import ExpenseEditForm from "../../../../components/ExpenseEditForm";

function Page() {
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [stockData, setStockData] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [groupedTransactions, setGroupedTransactions] = useState({});
  const [expandedBills, setExpandedBills] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState(false);
  const [editData, setEditData] = useState([]);

  const toggleForm = () => {
    if (!edit) {
      setShowAddEntry((prev) => !prev);
    }
    setEdit(false);
  };
  const toggleBill = (billno) => {
    setExpandedBills((prev) => ({
      ...prev,
      [billno]: !prev[billno],
    }));
  };

  useEffect(() => {
    const fetchStockData = async () => {
      try {
        const response = await fetch("/api/getstock/all");
        const data = await response.json();
        setStockData(data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    const fetchData = async () => {
      try {
        const response = await fetch("/api/expenses");
        const data = await response.json();
        setTransactions(data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
    fetchStockData();
  }, []);

  useEffect(() => {
    if (!transactions || transactions.length === 0) return;

    const grouped = transactions.reduce((acc, tx) => {
      if (!acc[tx.billno]) acc[tx.billno] = [];
      acc[tx.billno].push(tx);
      return acc;
    }, {});

    setGroupedTransactions(grouped);
    console.log("Grouped Transactions by Bill No:", grouped);
  }, [transactions]);

  // Filtered transactions based on search
  const filteredGrouped = Object.entries(groupedTransactions).reduce(
    (acc, [billno, items]) => {
      const matches = items.filter(
        (item) =>
          item.item.toLowerCase().includes(searchQuery.toLowerCase()) ||
          billno.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (matches.length > 0) acc[billno] = items;
      return acc;
    },
    {}
  );

  // Helper to parse Decimal128
  const toNumber = (decimal) => parseFloat(decimal?.$numberDecimal || 0);

  const handledeleteExpense = async (billno) => {
    setLoading(true);
    try {
      // Find all transactions for this bill
      const billItems = transactions.filter((tx) => tx.billno === billno);

      // Delete the expense from backend
      const res = await fetch("/api/deleteExpense", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billno }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Server error (${res.status}): ${errorText}`);
      }

      const deletedData = await res.json();
      console.log("Expense deleted successfully:", deletedData);

      // Update stock quantities: revert stock by adding back sold quantities
      console.log(billItems);
      for (const item of billItems) {
        const stockItem = stockData.find(
          (stock) => stock.name === item.item.split(":")[0]
        );
        console.log(stockItem);
        if (stockItem) {
          const currentQuantity =
            parseFloat(
              stockItem.quantity?.$numberDecimal ?? stockItem.quantity ?? 0
            ) + parseFloat(item.quantity?.$numberDecimal ?? item.quantity ?? 0);

          const updateData = {
            _id: stockItem._id,
            name: stockItem.name,
            category: stockItem.category,
            quantity: currentQuantity,
            unit: stockItem.unit,
            price: parseFloat(
              stockItem.price?.$numberDecimal ?? stockItem.price ?? 0
            ),
            supplier: stockItem.supplier,
          };

          console.log(updateData);

          try {
            const res2 = await fetch("/api/getstock/one", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(updateData),
            });

            if (!res2.ok) {
              const errorText = await res2.text();
              throw new Error(`Server error (${res2.status}): ${errorText}`);
            }

            const updatedStock = await res2.json();
            console.log("Stock updated successfully:", updatedStock);
          } catch (err) {
            console.error("Error updating stock:", err);
          }
        }
      }

      // Refresh transactions in state
      setTransactions((prev) => prev.filter((tx) => tx.billno !== billno));
    } catch (error) {
      console.error("Error deleting expense:", error);
    }
    setLoading(false);
  };

  const handleExpenseEdit = (billno) => {
    const editData2 = transactions.filter((tx) => tx.billno === billno);
    setEditData(editData2);
    setEdit(true);
    console.log("Expense Edit:", billno);
    const itemsToEdit = transactions.filter((item) => item.billno === billno);
    console.log("Form Data for Edit:", { items: itemsToEdit });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-100 z-50">
        <div className="text-xl font-bold text-gray-700 animate-pulse">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-6 px-4 sm:px-6 lg:px-8 flex flex-col">
      <div className="max-w-7xl mx-auto w-full flex-1">
        {/* ---------- HEADER SECTION ---------- */}
        <motion.div
          className="flex flex-col items-center gap-6 sm:gap-8 mb-10 sm:mb-16"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Title */}
          <div className="relative text-center">
            <motion.h1
              className="text-3xl sm:text-5xl lg:text-6xl text-black font-extrabold uppercase tracking-tight"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              All Transactions
            </motion.h1>
            <div className="absolute -bottom-2 sm:-bottom-3 left-0 right-0 h-0.5 sm:h-1 bg-black"></div>
          </div>

          {/* Add Entry Button */}
          <motion.button
            onClick={toggleForm}
            className="bg-black text-white px-6 sm:px-10 py-3 sm:py-4 text-base sm:text-lg font-bold uppercase rounded-2xl border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,0.4)] hover:bg-gray-800 active:translate-x-0.5 active:translate-y-0.5 transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            {!edit ? (showAddEntry ? "✕ Close Form" : "+ Add Entry") : ""}
            {edit ? "✕ Close Form" : ""}
          </motion.button>
        </motion.div>

        {/* ---------- FORM SECTION ---------- */}
        <AnimatePresence mode="wait">
          {showAddEntry && (
            <motion.div
              key="form"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto", marginBottom: 48 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="flex justify-center overflow-hidden"
            >
              <Form stockData={stockData} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ---------- EDIT FORM SECTION ---------- */}
        <AnimatePresence mode="wait">
          {edit && (
            <motion.div
              key="form"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto", marginBottom: 48 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="flex justify-center overflow-hidden"
            >
              <ExpenseEditForm stockData={stockData} ExpenseData={editData} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ---------- TRANSACTIONS SECTION ---------- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="bg-white border-2 border-black rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
            <div className="bg-black text-white px-6 sm:px-10 py-4 sm:py-6 border-b-2 border-black flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-lg sm:text-2xl font-bold uppercase tracking-wide">
                Recent Transactions
              </h2>
              <div className="mb-6">
                <input
                  type="text"
                  placeholder="Search by item or bill no..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full  px-4 py-2 border-2 border-black bg-white text-black rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-6  overflow-y-auto h-screen">
              {loading && (
                <div className="flex justify-center items-center py-8 space-x-2 flex-col">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <div
                      className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"
                      style={{ animationDelay: "0.4s" }}
                    ></div>
                  </div>
                  <span className="text-gray-500 text-2xl">Loading...</span>
                </div>
              )}
              {Object.entries(filteredGrouped).map(([billno, items], index) => (
                <motion.div
                  key={billno}
                  className="border-2 border-black rounded-2xl bg-linear-to-br from-gray-50 to-gray-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.3)] transition-all overflow-hidden"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {/* Bill Header */}
                  <button
                    onClick={() => toggleBill(billno)}
                    className={`w-full text-white px-4 sm:px-6 py-3 sm:py-4 flex flex-wrap items-center justify-between gap-2 transition-colors`}
                    style={{
                      background: `linear-gradient(to right, black,black, ${
                        items
                          .reduce(
                            (acc, item) =>
                              acc +
                              Number(item.sellingPrice.$numberDecimal) *
                                Number(item.quantity.$numberDecimal),
                            0
                          )
                          .toFixed(2) -
                          (Number(items[0].paidCash.$numberDecimal || 0) +
                            Number(items[0].paidOnline.$numberDecimal || 0)) <
                        1
                          ? "green"
                          : "red"
                      })`,
                    }}
                  >
                    {/* Button content here */}

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <div className="flex gap-3 justify-center items-center">
                        <div className="bg-white text-black w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center font-bold text-sm sm:text-base">
                          #{index + 1}
                        </div>
                        <h3 className="text-base sm:text-lg font-bold">
                          Bill No: {billno}
                        </h3>
                      </div>
                      <div className="text-left">
                        <p className="text-sm text-gray-300">
                          {items[0].date.split("T")[0]}
                        </p>
                        {/* Show item preview when collapsed */}
                        {!expandedBills[billno] && (
                          <p className="text-sm  mt-1 max-w-[30vw] text-blue-400">
                            {items.map((i) => i.item.split(":")[0]).join(", ")}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right text-amber-400">
                        <div className="text-xl sm:text-2xl font-bold">
                          ₹
                          {items
                            .reduce(
                              (acc, item) =>
                                acc +
                                toNumber(item.sellingPrice) *
                                  toNumber(item.quantity),
                              0
                            )
                            .toFixed(0)
                            .toLocaleString()}
                        </div>

                        <div className="text-xs text-gray-300">
                          {items.length} items
                        </div>
                      </div>
                      <motion.div
                        animate={{ rotate: expandedBills[billno] ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                        className="text-2xl"
                      >
                        ▼
                      </motion.div>
                    </div>
                  </button>
                  <div>
                    {items[0].notes && (
                      <div className="p-4 sm:p-6 border-b-2 border-black flex flex-wrap gap-4 justify-center sm:justify-start text-red-600 font-bold bg-black">
                        {items[0].notes}
                      </div>
                    )}
                  </div>

                  {/* Collapsible Items Grid */}
                  <AnimatePresence>
                    {expandedBills[billno] && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {items.map((item, idx) => (
                            <div
                              key={idx}
                              className="bg-white border-2 border-black rounded-xl p-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] transition-all group"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <h4 className="font-bold text-base sm:text-lg text-black group-hover:underline">
                                  {item.item.split(":")[0]}
                                </h4>
                                {item.new && (
                                  <span className="bg-black text-white px-2 py-1 rounded text-xs font-bold">
                                    NEW
                                  </span>
                                )}
                              </div>

                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between border-b border-gray-200 pb-2">
                                  <span className="text-gray-600 font-medium">
                                    Quantity:
                                  </span>
                                  <span className="font-bold">
                                    {toNumber(item.quantity)} {item.unit}
                                  </span>
                                </div>
                                <div className="flex justify-between border-b border-gray-200 pb-2">
                                  <span className="text-gray-600 font-medium">
                                    Cost Price:
                                  </span>
                                  <span className="font-bold text-red-600">
                                    ₹{toNumber(item.costPrice)}
                                  </span>
                                </div>
                                <div className="flex justify-between border-b border-gray-200 pb-2">
                                  <span className="text-gray-600 font-medium">
                                    Selling Price:
                                  </span>
                                  <span className="font-bold text-green-600">
                                    ₹{toNumber(item.sellingPrice)}
                                  </span>
                                </div>
                                <div className="flex justify-between border-b border-gray-200 pb-2">
                                  <span className="text-gray-600 font-medium">
                                    Profit:
                                  </span>
                                  <span className="font-bold text-blue-600">
                                    ₹
                                    {(
                                      (toNumber(item.sellingPrice) -
                                        toNumber(item.costPrice)) *
                                      toNumber(item.quantity)
                                    ).toFixed(2)}
                                  </span>
                                </div>
                                <div className="flex justify-between border-b border-gray-200 pb-2">
                                  <span className="text-gray-600 font-medium">
                                    Total:
                                  </span>
                                  <span className="font-bold text-amber-600">
                                    ₹
                                    {(
                                      toNumber(item.sellingPrice) *
                                      toNumber(item.quantity)
                                    ).toFixed(2)}
                                  </span>
                                </div>
                                <div className="pt-2">
                                  <span className="text-gray-600 font-medium block mb-1">
                                    Buyer:
                                  </span>
                                  <span className="font-bold text-black">
                                    {item.buyer}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-600 font-medium block mb-1">
                                    Notes:
                                  </span>
                                  <span className="text-gray-700 text-xs italic">
                                    {item.notes}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="text-sm sm:text-base font-medium text-gray-600 flex justify-between px-4 sm:px-6 py-3 sm:py-4  ">
                          <button
                            className="text-xl text-blue-500"
                            onClick={() => handleExpenseEdit(items[0].billno)}
                          >
                            Edit
                          </button>
                          <button
                            className="text-xl text-red-500"
                            onClick={() => handledeleteExpense(items[0].billno)}
                          >
                            Delete
                          </button>
                        </div>
                        <div className="flex gap-1 mt-1 text-xs sm:text-sm text-white flex-col sm:flex-row sm:items-center justify-center sm:justify-end bg-linear-to-br from-black via-black to-blue-500 px-4 py-3 border-t-2 border-black">
                          {/* PAID */}
                          <span className="font-bold text-lg sm:text-xl flex justify-between items-center w-full sm:w-auto">
                            <div>Paid:</div>
                            <div className="text-green-500">
                              ₹
                              {items.length > 0
                                ? Number(
                                    items[0].paidCash.$numberDecimal || 0
                                  ) +
                                  Number(
                                    items[0].paidOnline.$numberDecimal || 0
                                  )
                                : 0}
                            </div>
                          </span>

                          {/* PENDING */}
                          <span className="font-bold text-lg sm:text-xl text-white flex justify-between items-center w-full sm:w-auto">
                            <div>Pending:</div>
                            <div className="text-red-500">
                              ₹
                              {items.length > 0
                                ? items
                                    .reduce(
                                      (acc, item) =>
                                        acc +
                                        Number(
                                          item.sellingPrice.$numberDecimal
                                        ) *
                                          Number(item.quantity.$numberDecimal),
                                      0
                                    )
                                    .toFixed(0) -
                                  (
                                    Number(
                                      items[0].paidCash.$numberDecimal || 0
                                    ) +
                                    Number(
                                      items[0].paidOnline.$numberDecimal || 0
                                    )
                                  ).toFixed(0)
                                : 0}
                            </div>
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default Page;
