// src/pages/analytics.jsx (or wherever your old analytics page was)
// This file should ONLY export React components and helpers.

import React from "react";
import "./../../utils/registerCharts.js"; // Make sure this path is correct
import { Bar, Doughnut, Pie, Line } from "react-chartjs-2";

// Re-export chart components
export { Bar, Doughnut, Pie, Line };

/**
 * A reusable component for displaying a key performance indicator.
 */
export function KpiCard({ title, value, icon: Icon, format = (v) => v }) {
  return (
    <div className="p-5 bg-white border border-gray-200 rounded-lg shadow-sm flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-3xl font-bold text-gray-900">{format(value)}</p>
      </div>
      {Icon && (
        <div className="p-2 bg-brand-primary/10 rounded-full">
          <Icon className="w-5 h-5 text-brand-primary" />
        </div>
      )}
    </div>
  );
}

/**
 * A reusable component for rendering chart containers.
 */
export function ChartCard({ title, children, vizLoading }) {
  return (
    <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">{title}</h3>
      <div className="h-[350px]">
        {vizLoading ? <Placeholder /> : children}
      </div>
    </div>
  );
}

/**
 * Loading placeholder for charts and data.
 */
export function Placeholder() {
  return (
    <div className="flex items-center justify-center h-full bg-gray-50 rounded text-gray-400 animate-pulse">
      Loading...
    </div>
  );
}

/**
 * Helper to format currency
 */
export const formatCurrency = (value) =>
  `₱ ${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;