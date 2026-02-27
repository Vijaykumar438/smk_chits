"use client";

import React from "react";
import { formatCurrency } from "@/lib/firestore";

interface BarData {
  label: string;
  value: number;
}

interface CollectionChartProps {
  data: BarData[];
  title: string;
  maxBars?: number;
}

export default function CollectionChart({ data, title, maxBars = 7 }: CollectionChartProps) {
  const displayData = data.slice(-maxBars);
  const maxValue = Math.max(...displayData.map((d) => d.value), 1);

  if (displayData.length === 0) {
    return (
      <div className="p-6 text-center text-muted-foreground text-sm">
        No data to display
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-smk-green">{title}</h3>

      <div className="flex items-end gap-2 h-40">
        {displayData.map((item, i) => {
          const height = Math.max(8, (item.value / maxValue) * 100);
          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center justify-end gap-1"
            >
              {/* Value label */}
              <span className="text-xs font-medium text-smk-green whitespace-nowrap">
                {item.value >= 1000
                  ? `₹${(item.value / 1000).toFixed(0)}K`
                  : `₹${item.value}`}
              </span>

              {/* Bar */}
              <div
                className="w-full rounded-t-md bg-gradient-to-t from-smk-green to-smk-green-light transition-all duration-500"
                style={{ height: `${height}%`, minHeight: "4px" }}
              />

              {/* Label */}
              <span className="text-xs text-muted-foreground truncate w-full text-center">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Total */}
      <div className="flex justify-between items-center pt-2 border-t border-smk-gold/10">
        <span className="text-xs text-muted-foreground">Total</span>
        <span className="font-bold text-smk-green">
          {formatCurrency(displayData.reduce((s, d) => s + d.value, 0))}
        </span>
      </div>
    </div>
  );
}
