"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import StockForm from "../../../../components/StockForm.jsx";
import { set } from "mongoose";

function StockPage() {
  const [stockData, setStockData] = useState([]);
  const [expandedItems, setExpandedItems] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [stockEditFormData, setStockEditFormData] = useState({});
  const [stockForm, setStockForm] = useState(false);
  const [updateFlag, setUpdateFlag] = useState(false);

  const toggleItem = (id) => {
    setExpandedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  useEffect(() => {
    const fetchStock = async () => {
      try {
        const res = await fetch("/api/getstock/all");
        const data = await res.json();
        setStockData(data);
      } catch (error) {
        console.error("Error fetching stock:", error);
      }
    };
    fetchStock();
  }, []);

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const toNumber = (decimal) => parseFloat(decimal?.$numberDecimal || 0);

  // Filter and sort
  const filteredStock = stockData
    .filter(
      (item) =>
        item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (!sortConfig.key) return 0;
      const aValue =
        sortConfig.key === "value"
          ? toNumber(a.quantity) * toNumber(a.price)
          : a[sortConfig.key];
      const bValue =
        sortConfig.key === "value"
          ? toNumber(b.quantity) * toNumber(b.price)
          : b[sortConfig.key];
      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

  const SortIcon = ({ columnKey }) => (
    <motion.span
      className="ml-1 inline-block"
      initial={{ opacity: 0 }}
      animate={{
        opacity: sortConfig.key === columnKey ? 1 : 0.3,
        rotate:
          sortConfig.key === columnKey && sortConfig.direction === "desc"
            ? 180
            : 0,
      }}
      transition={{ duration: 0.2 }}
    >
      ▲
    </motion.span>
  );

  const handleStockEdit = (itemid) => {
    console.log("Edit stock item with ID:", itemid);
    const stock = stockData.find((item) => item.id === itemid);
    if (stock) {
      console.log("Stock details:", stock);
      setUpdateFlag(true);
      setStockForm(true);
      setStockEditFormData(stock);
    } else {
      console.error("Stock item not found for ID:", itemid);
    }
  };

  const handledelete = async (id) => {
    console.log("Stock Deleted:", id);
    try {
      const res = await fetch("/api/deleteStock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _id: id}),
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Server error (${res.status}): ${errorText}`);
      }
    } catch (error) {
      console.error("Error deleting stock:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        {/* Header */}
        <motion.div
          className="text-center space-y-4 sm:space-y-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-black">
            Stock Inventory
          </h1>
          <div className="w-16 sm:w-24 h-1 bg-black mx-auto"></div>

          {/* Search */}
          <div className="relative max-w-md mx-auto w-full">
            <input
              type="text"
              placeholder="Search items or categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 sm:px-6 py-3 sm:py-4 border-2 border-black rounded-2xl text-sm sm:text-base font-medium bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-black focus:ring-opacity-20"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xl sm:text-2xl">
              🔍
            </div>
          </div>

          {/* Stats */}

          <button
            className="w-full bg-white border-2 border-black p-4 sm:p-6 rounded-xl text-center hover:bg-black hover:text-white transition-colors"
            onClick={() => setStockForm(!stockForm)}
          >
            <div className="text-xl sm:text-2xl font-bold">
              {stockForm ? "Close Form" : "Add New Stock"}
            </div>
            <div className="text-sm sm:text-base opacity-80">
              {stockForm ? "Click to close item" : "Click to open form"}
            </div>
          </button>
          {stockForm && (
            <StockForm update={updateFlag} data={stockEditFormData} />
          )}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {!stockForm && (
              <>
                <div className="bg-black text-white p-4 sm:p-6 rounded-xl text-center">
                  <div className="text-xl sm:text-2xl font-bold">
                    {filteredStock.length}
                  </div>
                  <div className="text-sm sm:text-base opacity-80">
                    Total Items
                  </div>
                </div>
                <div className="bg-white border-2 border-black p-4 sm:p-6 rounded-xl text-center">
                  <div className="text-xl sm:text-2xl font-bold">
                    {new Set(filteredStock.map((item) => item.category)).size}
                  </div>
                  <div className="text-sm sm:text-base opacity-80">
                    Categories
                  </div>
                </div>
                <div className="bg-black text-white p-4 sm:p-6 rounded-xl text-center">
                  <div className="text-xl sm:text-2xl font-bold">
                    ₹
                    {filteredStock
                      .reduce(
                        (sum, item) =>
                          sum + toNumber(item.quantity) * toNumber(item.price),
                        0
                      )
                      .toLocaleString()}
                  </div>
                  <div className="text-sm sm:text-base opacity-80">
                    Total Value
                  </div>
                  z
                </div>
              </>
            )}
          </div>
        </motion.div>
        {!stockForm && (
          <>
            {/* Sort Controls */}
            <motion.div
              className="flex flex-wrap gap-2 sm:gap-4 justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <span className="font-semibold text-black text-sm sm:text-base">
                Sort by:
              </span>
              {[
                { key: "name", label: "Name" },
                { key: "category", label: "Category" },
                { key: "quantity", label: "Quantity" },
                { key: "value", label: "Total Value" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => handleSort(key)}
                  className={`px-3 sm:px-4 py-1 sm:py-2 rounded-lg border-2 font-medium text-sm sm:text-base transition-all ${
                    sortConfig.key === key
                      ? "bg-black text-white border-black"
                      : "bg-white text-black border-black hover:bg-gray-50"
                  }`}
                >
                  {label} <SortIcon columnKey={key} />
                </button>
              ))}
            </motion.div>

            {/* Stock Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              <AnimatePresence>
                {filteredStock.map((item, idx) => (
                  <motion.div
                    key={item.id || idx}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className="border-2 border-black rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.3)] bg-white overflow-hidden"
                  >
                    {/* Card Header */}
                    <button
                      onClick={() => toggleItem(item.id || idx)}
                      className="w-full px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between bg-black text-white transition-all hover:bg-gray-900"
                    >
                      <div className="text-left">
                        <h3 className="font-bold text-base sm:text-lg mb-1">
                          {item.name || item.item}
                        </h3>
                        <div className="flex flex-wrap gap-2 text-xs sm:text-sm">
                          <span className="bg-white text-black px-2 py-1 rounded-full font-medium">
                            {item.category}
                          </span>
                          <span className="bg-gray-800 text-white px-2 py-1 rounded-full">
                            {toNumber(item.quantity)} {item.unit}
                          </span>
                        </div>
                      </div>
                      <motion.div
                        animate={{
                          rotate: expandedItems[item.id || idx] ? 180 : 0,
                        }}
                        transition={{ duration: 0.3 }}
                        className="text-xl sm:text-2xl"
                      >
                        ▼
                      </motion.div>
                    </button>

                    {/* Collapsible Content */}
                    <AnimatePresence>
                      {expandedItems[item.id || idx] && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="p-4 sm:p-6 bg-white border-t-2 border-black space-y-4">
                            {/* Selling Price */}
                            <div className="text-center p-2 sm:p-3 border-2 border-black rounded-lg">
                              <div className="text-sm sm:text-base font-medium text-gray-600">
                                Cost Price
                              </div>
                              <div className="text-lg sm:text-xl font-bold text-amber-600">
                                ₹{toNumber(item.price)}
                              </div>
                            </div>

                            {/* Total Quantity */}
                            <div className="text-center p-2 sm:p-3 border-2 border-black rounded-lg">
                              <div className="text-sm sm:text-base font-medium text-gray-600">
                                Total Amount
                              </div>
                              <div className="text-lg sm:text-xl font-bold text-black">
                                ₹
                                {toNumber(item.quantity) * toNumber(item.price)}
                              </div>
                            </div>

                            {/* Buyer */}
                            {item.supplier && (
                              <div className="text-center p-2 sm:p-3 border-2 border-black rounded-lg">
                                <div className="text-sm sm:text-base font-medium text-gray-600">
                                  Supplier
                                </div>
                                <div className="text-lg sm:text-xl font-bold text-black">
                                  {item.supplier}
                                </div>
                              </div>
                            )}

                            <div>
                              <div className="text-sm sm:text-base font-medium text-gray-600 flex justify-between">
                                <button
                                  className="text-xl text-blue-500"
                                  onClick={() => handleStockEdit(item.id)}
                                >
                                  Edit
                                </button>
                                <button className="text-xl text-red-500" onClick={() => handledelete(item._id)}>
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Empty State */}
            {filteredStock.length === 0 && (
              <motion.div
                className="text-center py-16"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="text-6xl sm:text-8xl mb-4">📦</div>
                <h3 className="text-2xl sm:text-3xl font-bold text-black mb-2">
                  No items found
                </h3>
                <p className="text-gray-600 max-w-md mx-auto text-sm sm:text-base">
                  {searchQuery
                    ? `No items matching "${searchQuery}"`
                    : "No stock items available"}
                </p>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default StockPage;
