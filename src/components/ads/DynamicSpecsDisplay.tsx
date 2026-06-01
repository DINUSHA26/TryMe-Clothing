"use client";

import React from "react";

interface FieldDefinition {
  fieldKey: string;
  label: string;
}

interface DynamicSpecsDisplayProps {
  fieldDefinitions: FieldDefinition[];
  specifications: Record<string, any> | null | any;
}

export function DynamicSpecsDisplay({
  fieldDefinitions,
  specifications,
}: DynamicSpecsDisplayProps) {
  if (!specifications || typeof specifications !== "object") return null;

  // Build rows
  const rows: { label: string; value: string }[] = [];

  fieldDefinitions.forEach((field) => {
    const rawVal = specifications[field.fieldKey];
    if (rawVal === undefined || rawVal === null || rawVal === "") return;

    let formattedVal = "";
    if (Array.isArray(rawVal)) {
      if (rawVal.length === 0) return;
      formattedVal = rawVal.join(", ");
    } else {
      formattedVal = rawVal.toString();
    }

    rows.push({
      label: field.label,
      value: formattedVal,
    });
  });

  if (rows.length === 0) return null;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm">
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Specifications</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
        {rows.map((row, idx) => (
          <div
            key={`${row.label}-${idx}`}
            className="flex items-center justify-between p-4 text-sm hover:bg-gray-50/50 transition-colors"
          >
            <span className="text-gray-400 font-medium">{row.label}</span>
            <span className="text-gray-800 font-bold text-right pl-4">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
