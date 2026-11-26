export const currencies = ["INR", "USD", "GBP", "EUR", "AED", "SGD", "AUD", "CAD"] as const;
export const timeZones = [
  "Asia/Kolkata", "Asia/Dubai", "Asia/Singapore", "Europe/London", "Europe/Paris", "America/New_York",
  "America/Chicago", "America/Denver", "America/Los_Angeles", "America/Toronto", "Australia/Sydney", "UTC",
] as const;

export type BusinessProfile = {
  name: string;
  addressLines: string[];
  gstin: string;
  phone: string;
  fssaiLicense: string;
  currency: (typeof currencies)[number];
  timeZone: (typeof timeZones)[number];
  gstComponentRate: number;
};

export function currencyFormatter(currency: BusinessProfile["currency"]) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency });
}
