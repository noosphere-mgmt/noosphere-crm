"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createOperator,
  deleteOperator,
  updateOperator,
} from "@/lib/repos/operators";

export async function createOperatorAction(formData: FormData) {
  const id = await createOperator({
    name: String(formData.get("name") ?? ""),
    is_active: formData.get("is_active") === "on",
    notes: String(formData.get("notes") ?? "") || null,
  });
  revalidatePath("/admin/operators");
  redirect(`/admin/operators/${id}`);
}

export async function updateOperatorAction(id: number, formData: FormData) {
  await updateOperator(id, {
    name: String(formData.get("name") ?? ""),
    is_active: formData.get("is_active") === "on",
    notes: String(formData.get("notes") ?? "") || null,
  });
  revalidatePath("/admin/operators");
  redirect("/admin/operators");
}

export async function deleteOperatorAction(id: number) {
  await deleteOperator(id);
  revalidatePath("/admin/operators");
  redirect("/admin/operators");
}
