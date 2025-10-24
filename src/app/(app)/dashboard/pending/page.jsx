"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  AlertTriangle,
  DollarSign,
  Download,
  Filter,
  FileText,
  TrendingUp,
  Package,
  CalendarClock,
  ChevronDown,
  User,
  Calendar,
  ArrowUpDown,
} from "lucide-react";

const PendingReportPage = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("all");
  const [expandedRows, setExpandedRows] = useState({});
  const [sortConfig, setSortConfig] = useState({
    key: "totalPending",
    direction: "desc",
  });

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        const res = await fetch("/api/expenses");
        if (res.ok) {
          const data = await res.json();
          setEntries(data);
        }
      } catch (error) {
        console.error("Error fetching entries:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEntries();
  }, []);

  // 1️⃣ Filter by selected period
  const getFilteredEntries = () => {
    const now = new Date();
    if (selectedPeriod === "all") return entries;
    const periodStart = new Date(now);
    switch (selectedPeriod) {
      case "today":
        periodStart.setHours(0, 0, 0, 0);
        break;
      case "week":
        periodStart.setDate(periodStart.getDate() - 7);
        break;
      case "month":
        periodStart.setMonth(periodStart.getMonth() - 1);
        break;
      case "year":
        periodStart.setFullYear(periodStart.getFullYear() - 1);
        break;
    }
    return entries.filter((entry) => new Date(entry.date) >= periodStart);
  };

  const filteredEntries = getFilteredEntries();

  // 2️⃣ Group by Bill Number
  const billsMap = filteredEntries.reduce((acc, e) => {
    const billNo = e.billno;
    if (!acc[billNo]) {
      acc[billNo] = {
        billno: billNo,
        buyer: e.buyer,
        date: e.date,
        items: [],
        totalAmount: 0,
        paidCash: 0,
        paidOnline: 0,
      };
    }

    const quantity = parseFloat(e.quantity?.$numberDecimal ?? e.quantity ?? 0);
    const rate = parseFloat(
      e.sellingPrice?.$numberDecimal ?? e.sellingPrice ?? 0
    );
    const paidCash = parseFloat(e.paidCash?.$numberDecimal ?? e.paidCash ?? 0);
    const paidOnline = parseFloat(
      e.paidOnline?.$numberDecimal ?? e.paidOnline ?? 0
    );
    const total = quantity * rate;

    acc[billNo].items.push({
      ...e,
      quantity,
      rate,
      total,
      paidCash,
      paidOnline,
    });
    acc[billNo].totalAmount += total;
    acc[billNo].paidCash += paidCash;
    acc[billNo].paidOnline += paidOnline;

    return acc;
  }, {});

  const bills = Object.values(billsMap).map((bill) => ({
    ...bill,
    totalPaid: bill.paidCash + bill.paidOnline,
    pending: Math.max(bill.totalAmount - (bill.paidCash + bill.paidOnline), 0),
  }));

  // 3️⃣ Filter bills with pending amount
  const pendingBills = bills.filter((bill) => bill.pending > 0);

  // 4️⃣ Group by Buyer
  const groupedByBuyer = pendingBills.reduce((acc, bill) => {
    const buyer = bill.buyer || "Unknown";
    if (!acc[buyer]) {
      acc[buyer] = {
        buyer,
        totalPending: 0,
        totalAmount: 0,
        transactionCount: 0,
        lastDate: bill.date,
        oldestDate: bill.date,
        bills: [],
        transactions: [],
      };
    }

    acc[buyer].totalPending += bill.pending;
    acc[buyer].totalAmount += bill.totalAmount;
    acc[buyer].transactionCount += bill.items.length;
    acc[buyer].bills.push(bill);

    // Add individual transactions for expanded view
    bill.items.forEach((item) => {
      acc[buyer].transactions.push({
        date: bill.date,
        billno: bill.billno,
        item: item.item || item.description || "N/A",
        total: item.total,
        paid: item.paidCash + item.paidOnline,
        pending: Math.max(item.total - (item.paidCash + item.paidOnline), 0),
        notes: item.notes || "",
      });
    });

    if (new Date(bill.date) > new Date(acc[buyer].lastDate)) {
      acc[buyer].lastDate = bill.date;
    }
    if (new Date(bill.date) < new Date(acc[buyer].oldestDate)) {
      acc[buyer].oldestDate = bill.date;
    }

    return acc;
  }, {});

  const sortedPending = Object.values(groupedByBuyer).sort((a, b) => {
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];

    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortConfig.direction === "desc"
        ? bValue - aValue
        : aValue - bValue;
    }
    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortConfig.direction === "desc"
        ? bValue.localeCompare(aValue)
        : aValue.localeCompare(bValue);
    }
    return 0;
  });

  const totalPending = pendingBills.reduce(
    (sum, bill) => sum + bill.pending,
    0
  );
  const totalAmount = pendingBills.reduce(
    (sum, bill) => sum + bill.totalAmount,
    0
  );
  const oldestPendingDate =
    pendingBills.length > 0
      ? pendingBills.reduce((oldest, bill) =>
          new Date(bill.date) < new Date(oldest.date) ? bill : oldest
        ).date
      : null;

  // Count total pending entries (individual items)
  const pendingEntriesCount = pendingBills.reduce(
    (sum, bill) => sum + bill.items.length,
    0
  );

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction:
        sortConfig.key === key && sortConfig.direction === "desc"
          ? "asc"
          : "desc",
    });
  };

  const handleExport = () => {
    const csvContent = [
      [
        "Date",
        "Buyer",
        "Bill No",
        "Item",
        "Quantity",
        "Rate",
        "Total Amount",
        "Paid Cash",
        "Paid Online",
        "Total Paid",
        "Pending Amount",
        "Notes",
      ],
      ...pendingBills.flatMap((bill) =>
        bill.items.map((item) => {
          const itemPending = Math.max(
            item.total - (item.paidCash + item.paidOnline),
            0
          );
          return [
            new Date(bill.date).toLocaleDateString(),
            bill.buyer,
            bill.billno,
            item.item || item.description || "N/A",
            item.quantity.toFixed(2),
            item.rate.toFixed(2),
            item.total.toFixed(2),
            item.paidCash.toFixed(2),
            item.paidOnline.toFixed(2),
            (item.paidCash + item.paidOnline).toFixed(2),
            itemPending.toFixed(2),
            `"${item.notes || ""}"`,
          ];
        })
      ),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pending-report-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleRow = (name) => {
    setExpandedRows((prev) => ({ ...prev, [name]: !prev[name] }));
  };

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
      <ArrowUpDown className="w-3 h-3" />
    </motion.span>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="text-6xl mb-4">⏳</div>
          <h2 className="text-2xl font-black uppercase text-black">
            Loading Pending Report...
          </h2>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-8 text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="space-y-4 mb-8">
            <h1 className="text-5xl sm:text-7xl font-black uppercase tracking-tight text-black">
              PENDING REPORTS
            </h1>
            <div className="h-1 bg-black w-48 mx-auto"></div>
            <p className="text-gray-600 text-lg font-medium">
              Detailed overview of all pending payments and dues
            </p>
          </div>
        </motion.div>

        {/* Filter Section */}
        <motion.div
          className="bg-gray-50 rounded-2xl border-2 border-black p-6 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-black" />
            <h2 className="text-lg font-black uppercase text-black">
              FILTER PERIOD
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { id: "all", label: "All Time", emoji: "∞" },
              { id: "today", label: "Today", emoji: "📅" },
              { id: "week", label: "This Week", emoji: "📆" },
              { id: "month", label: "This Month", emoji: "🗓️" },
              { id: "year", label: "This Year", emoji: "📊" },
            ].map((period) => (
              <motion.button
                key={period.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedPeriod(period.id)}
                className={`py-3 px-4 rounded-xl border-2 border-black font-bold transition-all flex items-center gap-2 ${
                  selectedPeriod === period.id
                    ? "bg-black text-white shadow-[4px_4px_0px_rgba(0,0,0,1)]"
                    : "bg-white text-black hover:bg-gray-100 hover:shadow-[2px_2px_0px_rgba(0,0,0,1)]"
                }`}
              >
                <span>{period.emoji}</span>
                {period.label}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Pending Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white border-2 border-black rounded-2xl p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="bg-black text-white p-3 rounded-lg">
                <DollarSign className="w-6 h-6" />
              </div>
              <AlertTriangle className="w-5 h-5 text-black" />
            </div>
            <p className="text-gray-600 text-sm font-bold uppercase mb-1">
              TOTAL PENDING
            </p>
            <p className="text-3xl font-black text-black">
              ₹{totalPending.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Across {pendingEntriesCount} transactions
            </p>
          </motion.div>

          {/* Total Amount Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white border-2 border-black rounded-2xl p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="bg-black text-white p-3 rounded-lg">
                <FileText className="w-6 h-6" />
              </div>
              <TrendingUp className="w-5 h-5 text-black" />
            </div>
            <p className="text-gray-600 text-sm font-bold uppercase mb-1">
              TOTAL AMOUNT
            </p>
            <p className="text-3xl font-black text-black">
              ₹{totalAmount.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              {totalAmount > 0
                ? ((totalPending / totalAmount) * 100).toFixed(1)
                : 0}
              % pending
            </p>
          </motion.div>

          {/* Buyers with Dues Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white border-2 border-black rounded-2xl p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="bg-black text-white p-3 rounded-lg">
                <User className="w-6 h-6" />
              </div>
              <Package className="w-5 h-5 text-black" />
            </div>
            <p className="text-gray-600 text-sm font-bold uppercase mb-1">
              BUYERS WITH DUES
            </p>
            <p className="text-3xl font-black text-black">
              {sortedPending.length}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Unique buyers with unpaid balances
            </p>
          </motion.div>

          {/* Oldest Due Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white border-2 border-black rounded-2xl p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="bg-black text-white p-3 rounded-lg">
                <CalendarClock className="w-6 h-6" />
              </div>
            </div>
            <p className="text-gray-600 text-sm font-bold uppercase mb-1">
              OLDEST DUE DATE
            </p>
            <p className="text-3xl font-black text-black">
              {oldestPendingDate
                ? new Date(oldestPendingDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                : "N/A"}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Longest outstanding payment
            </p>
          </motion.div>
        </div>

        {/* Export Button */}
        <motion.div
          className="flex justify-center mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleExport}
            className="group flex items-center gap-3 bg-black text-white font-black py-4 px-8 rounded-2xl border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all"
          >
            <Download className="w-5 h-5" />
            <span>EXPORT DETAILED CSV</span>
          </motion.button>
        </motion.div>

        {/* Pending Breakdown Table */}
        <motion.div
          className="bg-white border-2 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <div className="p-6 border-b-2 border-black">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-black" />
              <h2 className="text-2xl font-black uppercase text-black">
                PENDING BREAKDOWN BY BUYER
              </h2>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b-2 border-black">
                <tr>
                  <th className="w-12"></th>
                  <th className="text-left p-4">
                    <button
                      onClick={() => handleSort("buyer")}
                      className="flex items-center gap-1 font-black uppercase text-black hover:bg-gray-100 p-2 rounded-lg transition-all"
                    >
                      BUYER
                      <SortIcon columnKey="buyer" />
                    </button>
                  </th>
                  <th className="text-right p-4">
                    <button
                      onClick={() => handleSort("totalPending")}
                      className="flex items-center gap-1 font-black uppercase text-black hover:bg-gray-100 p-2 rounded-lg transition-all justify-end w-full"
                    >
                      TOTAL PENDING
                      <SortIcon columnKey="totalPending" />
                    </button>
                  </th>
                  <th className="text-right p-4">
                    <button
                      onClick={() => handleSort("transactionCount")}
                      className="flex items-center gap-1 font-black uppercase text-black hover:bg-gray-100 p-2 rounded-lg transition-all justify-end w-full"
                    >
                      ITEMS
                      <SortIcon columnKey="transactionCount" />
                    </button>
                  </th>
                  <th className="text-right p-4">
                    <button
                      onClick={() => handleSort("lastDate")}
                      className="flex items-center gap-1 font-black uppercase text-black hover:bg-gray-100 p-2 rounded-lg transition-all justify-end w-full"
                    >
                      LAST UPDATED
                      <SortIcon columnKey="lastDate" />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {sortedPending.length > 0 ? (
                    sortedPending.map((group, index) => (
                      <React.Fragment key={group.buyer}>
                        <motion.tr
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={`border-b border-gray-200 transition-colors duration-200 cursor-pointer ${
                            expandedRows[group.buyer]
                              ? "bg-black text-white"
                              : "hover:bg-gray-50"
                          }`}
                          onClick={() => toggleRow(group.buyer)}
                        >
                          <td className="p-4 text-center">
                            <motion.div
                              animate={{
                                rotate: expandedRows[group.buyer] ? 180 : 0,
                              }}
                              transition={{ duration: 0.3 }}
                            >
                              <ChevronDown className="w-5 h-5" />
                            </motion.div>
                          </td>
                          <td className="p-4">
                            <div
                              className={`font-bold text-lg ${
                                expandedRows[group.buyer]
                                  ? "text-white"
                                  : "text-black"
                              }`}
                            >
                              {group.buyer}
                            </div>
                          </td>
                          <td className="p-4 text-right">
                            <div
                              className={`font-black text-xl ${
                                expandedRows[group.buyer]
                                  ? "text-red-400"
                                  : "text-red-600"
                              }`}
                            >
                              ₹{group.totalPending.toLocaleString()}
                            </div>
                          </td>
                          <td className="p-4 text-right">
                            <div
                              className={`font-bold ${
                                expandedRows[group.buyer]
                                  ? "text-gray-300"
                                  : "text-gray-700"
                              }`}
                            >
                              {group.transactionCount}
                            </div>
                          </td>
                          <td className="p-4 text-right">
                            <div
                              className={`${
                                expandedRows[group.buyer]
                                  ? "text-gray-300"
                                  : "text-gray-600"
                              }`}
                            >
                              {new Date(group.lastDate).toLocaleDateString()}
                            </div>
                          </td>
                        </motion.tr>
                        {expandedRows[group.buyer] && (
                          <tr>
                            <td colSpan={5} className="p-0">
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                                className="bg-gray-50"
                              >
                                <div className="p-6">
                                  <h4 className="font-black text-xl text-black mb-4 flex items-center gap-2">
                                    <User className="w-5 h-5" />
                                    SETTLEMENT DETAILS FOR {group.buyer}
                                  </h4>
                                  <div className="bg-white border-2 border-black rounded-xl overflow-hidden">
                                    <table className="w-full text-sm">
                                      <thead className="bg-black text-white">
                                        <tr>
                                          <th className="text-left p-3 font-bold">
                                            DATE
                                          </th>
                                          <th className="text-left p-3 font-bold">
                                            BILL NO
                                          </th>
                                          <th className="text-left p-3 font-bold">
                                            ITEM
                                          </th>
                                          <th className="text-right p-3 font-bold">
                                            TOTAL (₹)
                                          </th>
                                          <th className="text-right p-3 font-bold">
                                            PAID (₹)
                                          </th>
                                          <th className="text-right p-3 font-bold">
                                            PENDING (₹)
                                          </th>
                                          <th className="text-left p-3 font-bold">
                                            NOTES
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {group.transactions.map((tx, idx) => (
                                          <tr
                                            key={idx}
                                            className="border-b border-gray-200 last:border-b-0"
                                          >
                                            <td className="p-3 text-gray-700">
                                              {new Date(
                                                tx.date
                                              ).toLocaleDateString()}
                                            </td>
                                            <td className="p-3 text-gray-700 font-medium">
                                              {tx.billno}
                                            </td>
                                            <td className="p-3 font-medium text-gray-700">
                                              {tx.item}
                                            </td>
                                            <td className="p-3 text-right text-gray-700">
                                              {tx.total.toLocaleString()}
                                            </td>
                                            <td className="p-3 text-right text-green-600 font-bold">
                                              {tx.paid.toLocaleString()}
                                            </td>
                                            <td className="p-3 text-right text-red-600 font-bold">
                                              {tx.pending.toLocaleString()}
                                            </td>
                                            <td className="p-3 text-gray-500 max-w-xs truncate">
                                              {tx.notes || "-"}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </motion.div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center py-16">
                        <div className="text-6xl mb-4">✅</div>
                        <h3 className="text-2xl font-black text-black mb-2">
                          No Pending Entries
                        </h3>
                        <p className="text-gray-600">
                          All payments are settled for the selected period.
                        </p>
                      </td>
                    </tr>
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PendingReportPage;