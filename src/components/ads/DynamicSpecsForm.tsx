"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface FieldDefinition {
  id: string;
  fieldKey: string;
  label: string;
  fieldType: string;
  options: any; // Can be string[] or JSON
  isRequired: boolean;
  isOptional: boolean;
  placeholder: string | null;
  helpText: string | null;
}

interface DynamicSpecsFormProps {
  fieldDefinitions: FieldDefinition[];
  onChange: (specifications: Record<string, any>) => void;
  initialValues?: Record<string, any>;
}

export function DynamicSpecsForm({
  fieldDefinitions,
  onChange,
  initialValues = {},
}: DynamicSpecsFormProps) {
  const [values, setValues] = useState<Record<string, any>>(initialValues);

  // Reset or initialize values when fieldDefinitions change
  useEffect(() => {
    const newValues: Record<string, any> = {};
    fieldDefinitions.forEach((field) => {
      // Retain initial values if present, else set default
      if (initialValues[field.fieldKey] !== undefined) {
        newValues[field.fieldKey] = initialValues[field.fieldKey];
      } else if (field.fieldType === "CHECKBOX") {
        newValues[field.fieldKey] = [];
      } else {
        newValues[field.fieldKey] = "";
      }
    });
    setValues(newValues);
    onChange(newValues);
  }, [fieldDefinitions]);

  const handleFieldChange = (fieldKey: string, val: any) => {
    const updated = { ...values, [fieldKey]: val };
    setValues(updated);
    onChange(updated);
  };

  const handleCheckboxChange = (fieldKey: string, option: string, checked: boolean) => {
    const currentList = Array.isArray(values[fieldKey]) ? values[fieldKey] : [];
    let updatedList;
    if (checked) {
      updatedList = [...currentList, option];
    } else {
      updatedList = currentList.filter((item: string) => item !== option);
    }
    handleFieldChange(fieldKey, updatedList);
  };

  // Safe parse options JSON
  const parseOptions = (options: any): string[] => {
    if (!options) return [];
    if (Array.isArray(options)) return options;
    try {
      if (typeof options === "string") {
        return JSON.parse(options);
      }
    } catch {
      // Fail-safe
    }
    return [];
  };

  return (
    <div className="space-y-5">
      {fieldDefinitions.map((field) => {
        const optionsList = parseOptions(field.options);
        const val = values[field.fieldKey];

        return (
          <div key={field.id} className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Label className="text-sm font-semibold text-gray-800">
                {field.label}
              </Label>
              {field.isRequired ? (
                <span className="text-red-500 font-bold">*</span>
              ) : field.isOptional ? (
                <span className="text-xs text-gray-400 font-normal">(optional)</span>
              ) : null}
            </div>

            {/* Render input based on fieldType */}
            {field.fieldType === "TEXT" && (
              <Input
                type="text"
                placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                value={val || ""}
                onChange={(e) => handleFieldChange(field.fieldKey, e.target.value)}
                className="bg-white rounded-xl border-gray-200 focus:bg-white"
              />
            )}

            {field.fieldType === "NUMBER" && (
              <Input
                type="number"
                placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                value={val || ""}
                onChange={(e) => handleFieldChange(field.fieldKey, e.target.value)}
                className="bg-white rounded-xl border-gray-200 focus:bg-white"
              />
            )}

            {field.fieldType === "TEXTAREA" && (
              <Textarea
                placeholder={field.placeholder || `Enter details for ${field.label.toLowerCase()}`}
                value={val || ""}
                onChange={(e) => handleFieldChange(field.fieldKey, e.target.value)}
                className="bg-white rounded-xl border-gray-200 focus:bg-white min-h-[80px]"
              />
            )}

            {field.fieldType === "SELECT" && (
              <select
                value={val || ""}
                onChange={(e) => handleFieldChange(field.fieldKey, e.target.value)}
                className="w-full flex h-10 rounded-xl border border-input bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select option</option>
                {optionsList.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            )}

            {field.fieldType === "RADIO" && (
              <div className="flex flex-wrap gap-2 pt-1">
                {optionsList.map((opt) => {
                  const isChecked = val === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handleFieldChange(field.fieldKey, opt)}
                      className={`px-4 py-2 border rounded-xl text-xs font-semibold transition-all ${
                        isChecked
                          ? "border-[#FF6600] bg-[#FF6600]/10 text-[#FF6600] font-bold"
                          : "border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            )}

            {field.fieldType === "CHECKBOX" && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
                {optionsList.map((opt) => {
                  const isChecked = Array.isArray(val) && val.includes(opt);
                  return (
                    <label
                      key={opt}
                      className={`flex items-center gap-2.5 px-3 py-2 border rounded-xl cursor-pointer hover:bg-gray-50 transition-colors ${
                        isChecked ? "border-[#FF6600]/50 bg-orange-50/10" : "border-gray-100"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => handleCheckboxChange(field.fieldKey, opt, e.target.checked)}
                        className="rounded border-gray-300 text-[#FF6600] focus:ring-[#FF6600]"
                      />
                      <span className="text-xs text-gray-700 font-medium select-none">{opt}</span>
                    </label>
                  );
                })}
              </div>
            )}

            {field.helpText && (
              <p className="text-[11px] text-gray-400 mt-1 pl-1">
                {field.helpText}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
