"use client";

import { useRouter } from "next/navigation";
import React from "react";

function Page() {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center h-screen ">
      <div className="flex flex-col items-center gap-4 bg-white rounded-xl  p-10 text-center">
        <h1 className="text-5xl font-bold text-gray-800 font-mono">Expenses</h1>
        <p className="text-black-500">Track and manage your expenses effortlessly</p>
        
      </div>
    </div>
  );
}

export default Page;
