import { notFound, redirect } from "next/navigation";
import { prisma } from "@/app/lib/prisma";
import { getCurrentCustomer } from "@/app/lib/customer-session";
import { WizardClient } from "./WizardClient";

export default async function WizardPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/survey");

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { questions: { orderBy: { displayOrder: "asc" } } },
  });
  if (!product || !product.isActive) notFound();

  const response = await prisma.response.findUnique({
    where: { customerId_productId: { customerId: customer.id, productId } },
    include: { answers: true },
  });
  if (!response) redirect("/survey/products");
  if (response.status === "completed") redirect(`/survey/${productId}/complete`);

  const initialAnswers = Object.fromEntries(
    response.answers.map((a) => [
      a.productQuestionId,
      { answerValue: a.answerValue, rating: a.rating },
    ]),
  );

  const questions = product.questions.map((q) => ({
    id: q.id,
    questionText: q.questionText,
    questionType: q.questionType,
    questionImage: q.questionImage,
    optionsRaw: q.options,
  }));

  return (
    <WizardClient
      responseId={response.id}
      productId={product.id}
      productTitle={product.title}
      productImage={product.image}
      questions={questions}
      initialAnswers={initialAnswers}
      initialStep={response.currentStep}
    />
  );
}
