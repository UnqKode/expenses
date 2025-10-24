'use client';
import { usePathname, useRouter } from "next/navigation";
import React from "react";

function Nav() {
  const pathname = usePathname(); // e.g., "/dashboard/stock"
  const tab = pathname.startsWith("/dashboard") ? pathname.split("/")[2] || "expenses" : "";

  const router = useRouter();

  // helper function to apply active styles
  const getButtonClasses = (buttonTab) =>
    `text-black px-4 py-4 w-full h-full transition-colors ${
      tab.toLowerCase() === buttonTab.toLowerCase()
        ? "bg-black text-white font-bold"
        : "hover:bg-black hover:text-white"
    }`;

  return (
    <div className="w-full bg-white border border-black  flex sticky top-0 z-10">
      <button className={getButtonClasses("expenses")} onClick={()=>router.push('/dashboard/expenses')}>Expenses</button>
      <button className={getButtonClasses("stock")} onClick={()=>router.push('/dashboard/stock')}>Stock</button>
      <button className={getButtonClasses("report")} onClick={()=>router.push('/dashboard/report')}>Report</button>
      <button className={getButtonClasses("pending")} onClick={()=>router.push('/dashboard/pending')}>Pending</button>
    </div>
  );
}

export default Nav;
