import { createProduct } from "@/app/lib/actions/product";
import { ProductForm } from "../ProductForm";

export default function NewProductPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-ink-900">নতুন প্রোডাক্ট</h1>
      <ProductForm action={createProduct} submitLabel="তৈরি করুন" />
    </div>
  );
}
