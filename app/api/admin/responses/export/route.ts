import { NextResponse, type NextRequest } from "next/server";
import * as XLSX from "xlsx";
import { queryAllResponsesForExport } from "@/app/lib/response-query";
import { responseFilterSchema } from "@/app/lib/validation";

const GENDER_LABELS: Record<string, string> = { male: "পুরুষ", female: "মহিলা", other: "অন্যান্য" };

function displayAnswer(questionType: string, answerValue: string | null): string {
  if (!answerValue) return "";
  if (questionType === "checkbox") {
    try {
      const arr = JSON.parse(answerValue);
      return Array.isArray(arr) ? arr.join(", ") : answerValue;
    } catch {
      return answerValue;
    }
  }
  return answerValue;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const flat: Record<string, string | undefined> = {};
  for (const [key, value] of searchParams.entries()) flat[key] = value;

  const parsed = responseFilterSchema.safeParse(flat);
  const filters = parsed.success ? parsed.data : { page: 1 };
  const format = searchParams.get("format") === "xlsx" ? "xlsx" : "csv";

  const items = await queryAllResponsesForExport(filters);

  const rows: Record<string, string | number>[] = [];
  for (const { response } of items) {
    const sortedAnswers = [...response.answers].sort(
      (a, b) => a.productQuestion.displayOrder - b.productQuestion.displayOrder,
    );
    for (const a of sortedAnswers) {
      rows.push({
        "Response ID": response.id,
        Name: response.customer.fullName,
        District: response.customer.district,
        "City/Village": response.customer.residenceType,
        Age: response.customer.age,
        Gender: GENDER_LABELS[response.customer.gender] ?? response.customer.gender,
        Profession: response.customer.profession,
        Mobile: response.customer.mobileNumber ?? "",
        Product: response.product.title,
        Question: a.productQuestion.questionText,
        Answer: displayAnswer(a.productQuestion.questionType, a.answerValue),
        Rating: a.rating ?? "",
        // Repeated on each of the response's rows so it survives filtering/sorting.
        "Custom Opinion": response.customOpinion ?? "",
        "Completed At": response.completedAt ? response.completedAt.toISOString() : "",
      });
    }
  }

  const worksheet = XLSX.utils.json_to_sheet(rows);

  if (format === "csv") {
    const csv = "﻿" + XLSX.utils.sheet_to_csv(worksheet);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="hizjaab-responses.csv"',
      },
    });
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Responses");
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="hizjaab-responses.xlsx"',
    },
  });
}
