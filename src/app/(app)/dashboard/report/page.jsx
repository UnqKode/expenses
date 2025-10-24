"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area,
  Bar as RechartsBar,
} from "recharts";
import {
  TrendingUp,
  Users,
  CreditCard,
  Calendar,
  Download,
  Filter,
  DollarSign,
  PieChart as PieChartIcon,
  BarChart3,
  Activity,
  Target,
} from "lucide-react";

function ReportsPage() {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [selectedReport, setSelectedReport] = useState("overview");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [datePreset, setDatePreset] = useState("month");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/expenses");
        const data = await response.json();
        setTransactions(data);
        setFilteredTransactions(data);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Apply date preset when it changes
  useEffect(() => {
    applyDatePreset(datePreset);
  }, [datePreset, transactions]);

  const toNumber = (decimal) => parseFloat(decimal?.$numberDecimal || 0);

  const applyDatePreset = (preset) => {
    const today = new Date();
    let start = new Date();
    let end = new Date();

    switch (preset) {
      case "today":
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case "week":
        start.setDate(today.getDate() - 7);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case "month":
        start.setMonth(today.getMonth() - 1);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case "year":
        start.setFullYear(today.getFullYear() - 1);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case "custom":
        // Don't auto-apply for custom
        return;
      default:
        break;
    }

    setStartDate(start.toISOString().split("T")[0]);
    setEndDate(end.toISOString().split("T")[0]);
    filterTransactions(start, end);
  };

  const filterTransactions = (start, end) => {
    const filtered = transactions.filter((tx) => {
      const txDate = new Date(tx.date);
      return txDate >= start && txDate <= end;
    });
    setFilteredTransactions(filtered);
  };

  const handleCustomFilter = () => {
    if (!startDate || !endDate) {
      setFilteredTransactions(transactions);
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    filterTransactions(start, end);
    setDatePreset("custom");
  };

  const handleReset = () => {
    setStartDate("");
    setEndDate("");
    setFilteredTransactions(transactions);
    setDatePreset("month");
  };

  // Enhanced metrics calculation
  const calculateMetrics = () => {
    if (!filteredTransactions.length) return null;

    const totalRevenue = filteredTransactions
      .reduce(
        (a, tx) => a + toNumber(tx.sellingPrice) * toNumber(tx.quantity),
        0
      )
      .toFixed(0);
    const totalInvestment = filteredTransactions
      .reduce((a, tx) => a + toNumber(tx.costPrice) * toNumber(tx.quantity), 0)
      .toFixed(0);
    const totalProfit = totalRevenue - totalInvestment;
    const totalPaid = Array.from(
      new Map(filteredTransactions.map((tx) => [tx.billno, tx])).values()
    )
      .reduce(
        (a, tx) => a + (toNumber(tx.paidOnline) + toNumber(tx.paidCash)),
        0
      )
      .toFixed(0);

    const totalPending = totalRevenue - totalPaid;
    const profitMargin =
      totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    const totalTransactions = new Set(
      filteredTransactions.map((tx) => tx.billno)
    ).size;

    const avgOrderValue =
      totalTransactions > 0 ? (totalRevenue / totalTransactions).toFixed(0) : 0;

    // Enhanced monthly breakdown
    const monthly = {};
    filteredTransactions.forEach((tx) => {
      const month = new Date(tx.date).toLocaleString("default", {
        month: "short",
        year: "numeric",
      });
      if (!monthly[month]) {
        monthly[month] = {
          revenue: 0,
          investment: 0,
          profit: 0,
          transactions: 0,
        };
      }
      monthly[month].revenue += toNumber(tx.sellingPrice);
      monthly[month].investment += toNumber(tx.costPrice);
      monthly[month].profit +=
        toNumber(tx.sellingPrice) - toNumber(tx.costPrice);
      monthly[month].transactions += 1;
    });

    const monthlyData = Object.entries(monthly).map(([month, val]) => ({
      month,
      ...val,
    }));

    // Payment method stats
    const paymentMethods = filteredTransactions.reduce(
      (acc, tx) => {
        acc.Cash = (acc.Cash || 0) + toNumber(tx.paidCash);
        acc.Online = (acc.Online || 0) + toNumber(tx.paidOnline);
        return acc;
      },
      { Cash: 0, Online: 0 }
    );

    const paymentData = Object.entries(paymentMethods).map(([name, value]) => ({
      name,
      value,
    }));

    // Buyer stats
    const buyerStats = filteredTransactions.reduce((acc, tx) => {
      const buyer = tx.buyer || "Unknown";
      if (!acc[buyer]) acc[buyer] = { spent: 0, transactions: 0 };
      acc[buyer].spent += toNumber(tx.sellingPrice);
      acc[buyer].transactions += 1;
      return acc;
    }, {});

    const topBuyers = Object.entries(buyerStats)
      .sort(([, a], [, b]) => b.spent - a.spent)
      .slice(0, 8)
      .map(([name, data]) => ({
        name: name.length > 15 ? name.substring(0, 15) + "..." : name,
        spent: data.spent,
        transactions: data.transactions,
      }));

    // Daily performance
    const dailyData = filteredTransactions.reduce((acc, tx) => {
      const date = new Date(tx.date).toLocaleDateString();
      if (!acc[date]) {
        acc[date] = { revenue: 0, profit: 0, transactions: 0 };
      }
      acc[date].revenue += toNumber(tx.sellingPrice);
      acc[date].profit += toNumber(tx.sellingPrice) - toNumber(tx.costPrice);
      acc[date].transactions += 1;
      return acc;
    }, {});

    const dailyChartData = Object.entries(dailyData)
      .sort(([a], [b]) => new Date(a) - new Date(b))
      .slice(-30)
      .map(([date, data]) => ({
        date: new Date(date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        ...data,
      }));

    return {
      totalRevenue,
      totalInvestment,
      totalProfit,
      totalPaid,
      totalPending,
      profitMargin,
      totalTransactions,
      avgOrderValue,
      monthlyData,
      paymentData,
      topBuyers,
      dailyChartData,
    };
  };

  const metrics = calculateMetrics();

  const COLORS = ["#000000", "#666666", "#999999", "#CCCCCC", "#E5E5E5"];

  const datePresets = [
    { id: "today", label: "Today", emoji: "📅" },
    { id: "week", label: "This Week", emoji: "📆" },
    { id: "month", label: "This Month", emoji: "🗓️" },
    { id: "year", label: "This Year", emoji: "📊" },
    { id: "custom", label: "Custom", emoji: "⚙️" },
  ];

  const reportTabs = [
    { id: "overview", label: "Overview", icon: Activity },
    { id: "trend", label: "Trends", icon: TrendingUp },
    { id: "buyers", label: "Top Buyers", icon: Users },
    { id: "payments", label: "Payments", icon: CreditCard },
    { id: "daily", label: "Daily", icon: Calendar },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-2xl font-black uppercase text-black">
            Loading Analytics...
          </h2>
        </motion.div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="text-6xl mb-4">📈</div>
          <h2 className="text-2xl font-black uppercase text-black mb-4">
            No Data Available
          </h2>
          <p className="text-gray-600">
            No transactions found for the selected period.
          </p>
        </motion.div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="font-bold text-black">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: ₹{entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const handleExport = () => {
    const csvContent = [
      [
        "Date",
        "Buyer",
        "Item",
        "Revenue",
        "Cost",
        "Profit",
        "Payment Method",
        "Paid Amount",
      ],
      ...filteredTransactions.map((tx) => [
        new Date(tx.date).toLocaleDateString(),
        tx.buyer,
        tx.item,
        toNumber(tx.sellingPrice).toFixed(2),
        toNumber(tx.costPrice).toFixed(2),
        (toNumber(tx.sellingPrice) - toNumber(tx.costPrice)).toFixed(2),
        tx.paymentMethod || "Cash",
        (toNumber(tx.paidOnline) + toNumber(tx.paidCash)).toFixed(2),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `business-report-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="min-h-screen bg-white py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-12 text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="space-y-4 mb-8">
            <h1 className="text-5xl sm:text-7xl font-black uppercase tracking-tight text-black">
              BUSINESS ANALYTICS
            </h1>
            <div className="h-1 bg-black w-48 mx-auto"></div>
            <p className="text-gray-600 text-lg font-medium">
              {filteredTransactions.length} transactions analyzed
            </p>
          </div>
        </motion.div>

        {/* Enhanced Date Filter with Presets */}
        <motion.div
          className="bg-gray-50 rounded-2xl border-2 border-black max-w-6xl mx-auto p-6 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {/* Date Presets */}
          <div className="flex justify-center gap-3 flex-wrap mb-6">
            {datePresets.map((preset) => (
              <motion.button
                key={preset.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setDatePreset(preset.id)}
                className={`px-5 py-3 font-bold rounded-xl border-2 border-black transition-all flex items-center gap-2 ${
                  datePreset === preset.id
                    ? "bg-black text-white shadow-[4px_4px_0px_rgba(0,0,0,1)]"
                    : "bg-white text-black hover:bg-gray-100 hover:shadow-[2px_2px_0px_rgba(0,0,0,1)]"
                }`}
              >
                <span className="text-lg">{preset.emoji}</span>
                {preset.label}
              </motion.button>
            ))}
          </div>

          {/* Custom Date Inputs */}
          <div
            className={`flex flex-wrap justify-center items-center gap-4 p-4 bg-white rounded-xl border-2 border-dashed ${
              datePreset === "custom" ? "border-black" : "border-gray-300"
            } transition-all`}
          >
            <div className="flex items-center gap-3">
              <span className="font-bold text-black text-sm uppercase">
                From
              </span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border-2 border-black p-3 rounded-lg font-medium bg-white"
                disabled={datePreset !== "custom"}
              />
            </div>
            <div className="flex items-center gap-3">
              <span className="font-bold text-black text-sm uppercase">To</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border-2 border-black p-3 rounded-lg font-medium bg-white"
                disabled={datePreset !== "custom"}
              />
            </div>

            {datePreset === "custom" && (
              <motion.div
                className="flex gap-3"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCustomFilter}
                  className="px-6 py-3 bg-black text-white font-bold rounded-lg border-2 border-black hover:bg-gray-800 text-sm uppercase"
                >
                  Apply Filter
                </motion.button>
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleReset}
              className="px-6 py-3 bg-white border-2 border-black font-bold rounded-lg hover:bg-gray-100 text-sm uppercase"
            >
              Reset All
            </motion.button>
          </div>

          {/* Active Filter Display */}
          <motion.div
            className="text-center mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <span className="text-sm font-bold text-black bg-gray-200 px-3 py-1 rounded-full">
              Showing:{" "}
              {datePreset.charAt(0).toUpperCase() + datePreset.slice(1)} •{" "}
              {filteredTransactions.length} transactions
            </span>
          </motion.div>
        </motion.div>

        {/* Report Tabs */}
        <motion.div
          className="flex justify-center gap-3 flex-wrap mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {reportTabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedReport(tab.id)}
                className={`px-6 py-4 font-black uppercase rounded-xl border-2 border-black transition-all flex items-center gap-3 ${
                  selectedReport === tab.id
                    ? "bg-black text-white shadow-[4px_4px_0px_rgba(0,0,0,1)]"
                    : "bg-white text-black hover:bg-gray-50 hover:shadow-[2px_2px_0px_rgba(0,0,0,1)]"
                }`}
              >
                <IconComponent className="w-5 h-5" />
                {tab.label}
              </motion.button>
            );
          })}
        </motion.div>

        {/* Export Button */}
        <motion.div
          className="flex justify-center mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleExport}
            className="group flex items-center gap-3 bg-black text-white font-black py-4 px-8 rounded-2xl border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all"
          >
            <Download className="w-5 h-5" />
            <span>EXPORT REPORT CSV</span>
          </motion.button>
        </motion.div>

        {/* Overview Section */}
        {selectedReport === "overview" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  label: "TOTAL REVENUE",
                  value: metrics.totalRevenue,
                  icon: DollarSign,
                  bg: "bg-green-50",
                },
                {
                  label: "TOTAL INVESTMENT",
                  value: metrics.totalInvestment,
                  icon: Target,
                  bg: "bg-red-50",
                },
                {
                  label: "NET PROFIT",
                  value: metrics.totalProfit,
                  icon: TrendingUp,
                  bg: "bg-blue-50",
                },
                {
                  label: "PROFIT MARGIN",
                  value: metrics.profitMargin,
                  icon: PieChartIcon,
                  bg: "bg-purple-50",
                  isPercent: true,
                },
              ].map((m, index) => {
                const IconComponent = m.icon;
                return (
                  <motion.div
                    key={m.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`${m.bg} border-2 border-black rounded-2xl p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="bg-black text-white p-3 rounded-lg">
                        <IconComponent className="w-6 h-6" />
                      </div>
                      <div className="text-xs font-black uppercase bg-black text-white px-2 py-1 rounded">
                        {m.label}
                      </div>
                    </div>
                    <div className="text-3xl font-black text-black">
                      {m.isPercent
                        ? `${m.value.toFixed(1)}%`
                        : `₹${m.value.toLocaleString()}`}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Secondary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  label: "Transactions",
                  value: metrics.totalTransactions,
                  icon: BarChart3,
                },
                {
                  label: "Avg Order Value",
                  value: metrics.avgOrderValue,
                  icon: DollarSign,
                },
                {
                  label: "Pending Amount",
                  value: metrics.totalPending,
                  icon: Calendar,
                },
              ].map((m, index) => {
                const IconComponent = m.icon;
                return (
                  <motion.div
                    key={m.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="bg-white border-2 border-black rounded-2xl p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="bg-black text-white p-2 rounded-lg">
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div className="text-sm font-black uppercase text-gray-600">
                        {m.label}
                      </div>
                    </div>
                    <div className="text-2xl font-black text-black">
                      {m.label.includes("Value") || m.label.includes("Amount")
                        ? `₹${m.value.toLocaleString()}`
                        : m.value}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Other report sections remain the same but with updated styling */}
        {selectedReport === "trend" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            <div className="bg-white border-2 border-black rounded-2xl p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <h2 className="text-2xl font-black uppercase mb-6 border-b-2 border-black pb-4 flex items-center gap-3">
                <TrendingUp className="w-6 h-6" />
                MONTHLY PERFORMANCE TREND
              </h2>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={metrics.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                  <XAxis dataKey="month" stroke="#000000" />
                  <YAxis stroke="#000000" />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#000000"
                    fill="#000000"
                    fillOpacity={0.1}
                    strokeWidth={3}
                  />
                  <Area
                    type="monotone"
                    dataKey="profit"
                    stroke="#666666"
                    fill="#666666"
                    fillOpacity={0.1}
                    strokeWidth={3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {selectedReport === "buyers" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            <div className="bg-white border-2 border-black rounded-2xl p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <h2 className="text-2xl font-black uppercase mb-6 border-b-2 border-black pb-4 flex items-center gap-3">
                <Users className="w-6 h-6" />
                TOP BUYERS ANALYSIS
              </h2>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={metrics.topBuyers}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                  <XAxis
                    dataKey="name"
                    stroke="#000000"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis stroke="#000000" />
                  <Tooltip content={<CustomTooltip />} />
                  <RechartsBar
                    dataKey="spent"
                    fill="#000000"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {selectedReport === "payments" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white border-2 border-black rounded-2xl p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <h2 className="text-2xl font-black uppercase mb-6 border-b-2 border-black pb-4 flex items-center gap-3">
                  <CreditCard className="w-6 h-6" />
                  PAYMENT METHODS
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={metrics.paymentData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {metrics.paymentData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white border-2 border-black rounded-2xl p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <h2 className="text-2xl font-black uppercase mb-6 border-b-2 border-black pb-4 flex items-center gap-3">
                  <DollarSign className="w-6 h-6" />
                  PAYMENT SUMMARY
                </h2>
                <div className="space-y-4">
                  {[
                    {
                      label: "Total Paid",
                      value: metrics.totalPaid,
                      icon: "✅",
                    },
                    {
                      label: "Pending Amount",
                      value: metrics.totalPending,
                      icon: "⏳",
                    },
                    {
                      label: "Collection Rate",
                      value: (
                        (metrics.totalPaid / metrics.totalRevenue) *
                        100
                      ).toFixed(1),
                      icon: "🎯",
                      isPercent: true,
                    },
                  ].map((item, index) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 border-2 border-black rounded-lg bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{item.icon}</span>
                        <span className="font-bold text-black">
                          {item.label}
                        </span>
                      </div>
                      <span className="text-xl font-black text-black">
                        {item.isPercent
                          ? `${item.value}%`
                          : `₹${item.value.toLocaleString()}`}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {selectedReport === "daily" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            <div className="bg-white border-2 border-black rounded-2xl p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <h2 className="text-2xl font-black uppercase mb-6 border-b-2 border-black pb-4 flex items-center gap-3">
                <Calendar className="w-6 h-6" />
                DAILY PERFORMANCE (LAST 30 DAYS)
              </h2>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={metrics.dailyChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                  <XAxis dataKey="date" stroke="#000000" />
                  <YAxis stroke="#000000" />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#000000"
                    strokeWidth={3}
                    dot={{ fill: "#000000" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="profit"
                    stroke="#666666"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default ReportsPage;
