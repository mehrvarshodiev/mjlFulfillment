import { pricing, type FulfillmentModel, type PackagingType } from "../../data/pricing";

export type CalculatorOptions = {
  units: number;
  packaging: PackagingType;
  marking: boolean;
  storageDays: number;
  model: FulfillmentModel;
};

export type EstimateLineKey =
  | "services.calculator.receiving"
  | "services.calculator.inspection"
  | "services.calculator.packaging"
  | "services.calculator.marking"
  | "services.calculator.storage"
  | "services.calculator.dispatch";

export type EstimateLine = {
  key: EstimateLineKey;
  amount: number;
};

export type Estimate = {
  lines: EstimateLine[];
  total: number;
};

/** Pure pricing calculation: no UI, translation, or browser dependencies. */
export function calculateEstimate(options: CalculatorOptions): Estimate {
  const units = Math.max(1, Math.min(100_000, Math.floor(options.units) || 1));
  const lines: EstimateLine[] = [
    { key: "services.calculator.receiving", amount: units * pricing.receivingPerUnit },
    { key: "services.calculator.inspection", amount: units * pricing.inspectionPerUnit },
    { key: "services.calculator.packaging", amount: units * pricing.packagingPerUnit[options.packaging] },
  ];

  if (options.marking) {
    lines.push({ key: "services.calculator.marking", amount: units * pricing.markingPerUnit });
  }

  if (options.storageDays > 0) {
    lines.push({
      key: "services.calculator.storage",
      amount: units * options.storageDays * pricing.storagePerUnitPerDay,
    });
  }

  lines.push({
    key: "services.calculator.dispatch",
    amount: units * pricing.dispatchPerUnit[options.model],
  });

  return {
    lines,
    total: lines.reduce((sum, line) => sum + line.amount, 0),
  };
}
