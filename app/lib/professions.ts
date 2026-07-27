export type Profession = { value: string; bn: string };

// "Other" is handled separately in the UI (reveals a free-text field) and is
// not part of this canonical list.
export const professions: Profession[] = [
  { value: "Student", bn: "শিক্ষার্থী" },
  { value: "Housewife", bn: "গৃহিণী" },
  { value: "Teacher", bn: "শিক্ষক/শিক্ষিকা" },
  { value: "Private Job", bn: "বেসরকারি চাকরি" },
  { value: "Government Job", bn: "সরকারি চাকরি" },
  { value: "Business Owner", bn: "ব্যবসায়ী" },
  { value: "Farmer", bn: "কৃষক" },
  { value: "Doctor", bn: "ডাক্তার" },
  { value: "Engineer", bn: "ইঞ্জিনিয়ার" },
  { value: "Freelancer", bn: "ফ্রিল্যান্সার" },
  { value: "Driver", bn: "চালক" },
  { value: "Unemployed", bn: "বেকার" },
  { value: "Retired", bn: "অবসরপ্রাপ্ত" },
];

export const PROFESSION_VALUES = professions.map((p) => p.value);
export const PROFESSION_OTHER_VALUE = "Other";
