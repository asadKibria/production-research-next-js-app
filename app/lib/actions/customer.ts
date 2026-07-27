"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/app/lib/prisma";
import { customerInfoSchema } from "@/app/lib/validation";
import { ensureCustomerSessionToken } from "@/app/lib/customer-session";

export type CustomerFormValues = {
  fullName: string;
  district: string;
  residenceType: string;
  age: string;
  gender: string;
  profession: string;
  mobileNumber: string;
};

export type CustomerFormState = {
  error: string | null;
  fieldErrors: Record<string, string>;
  values: CustomerFormValues;
};

export async function submitCustomerInfo(
  _prevState: CustomerFormState,
  formData: FormData,
): Promise<CustomerFormState> {
  const raw: CustomerFormValues = {
    fullName: formData.get("fullName")?.toString() ?? "",
    district: formData.get("district")?.toString() ?? "",
    residenceType: formData.get("residenceType")?.toString() ?? "",
    age: formData.get("age")?.toString() ?? "",
    gender: formData.get("gender")?.toString() ?? "",
    profession: formData.get("profession")?.toString() ?? "",
    mobileNumber: formData.get("mobileNumber")?.toString() ?? "",
  };

  const parsed = customerInfoSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return {
      error: "ফর্মে কিছু তথ্য সঠিক নয়, ঠিক করে আবার চেষ্টা করুন।",
      fieldErrors,
      values: raw,
    };
  }

  const data = parsed.data;
  const mobileNumber = data.mobileNumber ? data.mobileNumber : null;
  const token = await ensureCustomerSessionToken();

  let customer = await prisma.customer.findUnique({ where: { sessionToken: token } });

  if (!customer && mobileNumber) {
    const byMobile = await prisma.customer.findFirst({ where: { mobileNumber } });
    if (byMobile) {
      customer = await prisma.customer.update({
        where: { id: byMobile.id },
        data: { sessionToken: token },
      });
    }
  }

  const payload = {
    fullName: data.fullName,
    district: data.district,
    residenceType: data.residenceType,
    age: data.age,
    gender: data.gender,
    profession: data.profession,
    mobileNumber,
  };

  if (customer) {
    await prisma.customer.update({ where: { id: customer.id }, data: payload });
  } else {
    await prisma.customer.create({ data: { sessionToken: token, ...payload } });
  }

  redirect("/survey/products");
}
