export type PackagingType = "standard" | "protective" | "custom";
export type FulfillmentModel = "FBO" | "FBS";

export const pricing = {
  receivingPerUnit: 4,
  inspectionPerUnit: 3,
  packagingPerUnit: {
    standard: 8,
    protective: 15,
    custom: 25,
  } satisfies Record<PackagingType, number>,
  markingPerUnit: 5,
  storagePerUnitPerDay: 0.5,
  dispatchPerUnit: {
    FBO: 4,
    FBS: 10,
  } satisfies Record<FulfillmentModel, number>,
} as const;

/** Demo rates only. Replace with approved commercial tariffs before publishing. */
