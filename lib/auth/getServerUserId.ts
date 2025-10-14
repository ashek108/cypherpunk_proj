import { createReadOnlyServerClient } from "@/supabase/clients/server";

export async function getServerUserId(){
    const supabase = await createReadOnlyServerClient()
    const {data} = await supabase.auth.getUser()
    return data?.user?.id;
}
