import { supabase } from "./supabase";

export async function enableMember(id: number) {
  return await supabase
    .from("members")
    .update({
      is_active: true,
    })
    .eq("id", id);
}

export async function disableMember(id: number) {
  return await supabase
    .from("members")
    .update({
      is_active: false,
    })
    .eq("id", id);
}
