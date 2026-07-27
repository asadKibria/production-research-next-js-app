import { z } from "zod";
import { AGE_GROUP_VALUES } from "@/app/lib/age-groups";
import { RESIDENCE_TYPE_VALUES } from "@/app/lib/residence-type";

export const customerInfoSchema = z.object({
  fullName: z.string().trim().min(1, "নাম আবশ্যক").max(120),
  district: z.string().trim().min(1, "জেলা আবশ্যক"),
  residenceType: z.enum(RESIDENCE_TYPE_VALUES as [string, ...string[]], {
    message: "শহর নাকি গ্রাম বেছে নিন",
  }),
  age: z.enum(AGE_GROUP_VALUES as [string, ...string[]], { message: "বয়স গ্রুপ বেছে নিন" }),
  gender: z.enum(["male", "female", "other"]),
  profession: z.string().trim().min(1, "পেশা আবশ্যক").max(120),
  mobileNumber: z
    .union([
      z.literal(""),
      z.string().trim().regex(/^01[3-9]\d{8}$/, "সঠিক মোবাইল নম্বর দিন (যেমন 01712345678)"),
    ])
    .optional(),
});

export type CustomerInfoInput = z.infer<typeof customerInfoSchema>;

export const adminLoginSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
});

export const productSchema = z.object({
  title: z.string().trim().min(1, "শিরোনাম আবশ্যক").max(200),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  isActive: z.coerce.boolean().default(true),
  displayOrder: z.coerce.number().int().default(0),
});

export const questionTypeSchema = z.enum([
  "multiple_choice",
  "checkbox",
  "text",
  "rating",
  "price_opinion",
  "purchase_intent",
]);

const optionsListSchema = z
  .array(z.string().trim().min(1))
  .min(1, "অন্তত একটি অপশন দিন");

export const questionInputSchema = z
  .object({
    questionText: z.string().trim().min(1, "প্রশ্ন আবশ্যক").max(500),
    questionType: questionTypeSchema,
    displayOrder: z.coerce.number().int().default(0),
    optionsList: optionsListSchema.optional(),
    priceMin: z.coerce.number().optional(),
    priceMax: z.coerce.number().optional(),
    priceStep: z.coerce.number().optional(),
  })
  .superRefine((data, ctx) => {
    if (["multiple_choice", "checkbox"].includes(data.questionType)) {
      if (!data.optionsList || data.optionsList.length < 1) {
        ctx.addIssue({
          code: "custom",
          path: ["optionsList"],
          message: "অন্তত একটি অপশন দিন",
        });
      }
    }
  });

export const announcementSchema = z.object({
  message: z.string().trim().min(1, "মেসেজ আবশ্যক").max(500),
  isActive: z.coerce.boolean().default(false),
});

export const responseFilterSchema = z.object({
  productId: z.string().optional(),
  age: z.string().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  profession: z.string().optional(),
  district: z.string().optional(),
  residenceType: z.string().optional(),
  minAvgRating: z.coerce.number().min(1).max(5).optional(),
  purchaseIntent: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
});

export type ResponseFilterInput = z.infer<typeof responseFilterSchema>;
