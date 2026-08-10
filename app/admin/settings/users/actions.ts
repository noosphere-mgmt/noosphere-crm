"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createCrmUser, updateCrmUser } from "@/lib/repos/crmUsers";
const t=(f:FormData,n:string)=>String(f.get(n)??"").trim()||null;
const data=(f:FormData)=>({display_name:t(f,"display_name")??"Unnamed user",email:t(f,"email"),user_type:(t(f,"user_type")==="virtual"?"virtual":"human") as "virtual"|"human",role:t(f,"role")??"staff",channel:t(f,"channel"),coverage:String(f.get("coverage")??"").split(",").map(x=>x.trim()).filter(Boolean),login_enabled:f.get("login_enabled")==="on",api_enabled:f.get("api_enabled")==="on",is_active:f.get("is_active")==="on",instructions:t(f,"instructions")});
export async function createCrmUserAction(f:FormData){const id=await createCrmUser(data(f));revalidatePath("/admin/settings/users");redirect(`/admin/settings/users?user=${id}&saved=1`);}
export async function updateCrmUserAction(id:number,f:FormData){await updateCrmUser(id,data(f));revalidatePath("/admin/settings/users");redirect(`/admin/settings/users?user=${id}&saved=1`);}
