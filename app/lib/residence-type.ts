export type ResidenceType = { value: string; bn: string };

export const residenceTypes: ResidenceType[] = [
  { value: "City", bn: "শহর" },
  { value: "Village", bn: "গ্রাম" },
];

export const RESIDENCE_TYPE_VALUES = residenceTypes.map((r) => r.value);
