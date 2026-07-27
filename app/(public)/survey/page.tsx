import { redirect } from "next/navigation";
import { getCurrentCustomer } from "@/app/lib/customer-session";
import { CustomerForm } from "./CustomerForm";

export default async function SurveyEntryPage() {
  const customer = await getCurrentCustomer();
  if (customer) {
    redirect("/survey/products");
  }

  return <CustomerForm />;
}
