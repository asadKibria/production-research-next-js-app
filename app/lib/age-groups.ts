export type AgeGroup = { value: string; bn: string };

export const ageGroups: AgeGroup[] = [
  { value: "Under 18", bn: "১৮ এর নিচে" },
  { value: "18-21", bn: "১৮-২১" },
  { value: "22-25", bn: "২২-২৫" },
  { value: "26-29", bn: "২৬-২৯" },
  { value: "30-34", bn: "৩০-৩৪" },
  { value: "34+", bn: "৩৪+" },
];

export const AGE_GROUP_VALUES = ageGroups.map((g) => g.value);
