const { z } = require("zod");

try {
  console.log("Testing z.record(z.any())...");
  const schema1 = z.object({
    reportType: z.enum(["sales", "vendors", "commission", "products", "orders"]),
    filters: z.record(z.any()).optional().default({}),
    format: z.enum(["csv"]).default("csv"),
  });

  const res1 = schema1.safeParse({ reportType: "sales", filters: { a: 1 } });
  console.log("Result 1:", res1.success);
} catch (e) {
  console.error("Result 1 Error:", e.message, "\n", e.stack);
}

try {
  console.log("\nTesting z.any()...");
  const schema2 = z.object({
    reportType: z.enum(["sales", "vendors", "commission", "products", "orders"]),
    filters: z.any().optional().default({}),
    format: z.enum(["csv"]).default("csv"),
  });

  const res2 = schema2.safeParse({ reportType: "sales", filters: { a: 1 } });
  console.log("Result 2:", res2.success);
} catch (e) {
  console.error("Result 2 Error:", e.message, "\n", e.stack);
}
