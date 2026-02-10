import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false,
                },
            }
        );

        const { users } = await req.json();

        if (!users || !Array.isArray(users)) {
            return new Response(JSON.stringify({ error: "Missing users list or invalid format" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 400,
            });
        }

        const success = [];
        const errors = [];

        for (const user of users) {
            const { data, error } = await supabaseClient.auth.admin.createUser({
                email: user.email,
                password: user.password || "123456",
                email_confirm: true,
                user_metadata: {
                    full_name: user.full_name,
                    department: user.department,
                    phone: user.phone,
                    role: "user"
                }
            });

            if (error) {
                errors.push({ email: user.email, error: error.message });
            } else {
                success.push({ email: user.email, id: data.user.id });
            }
        }

        return new Response(JSON.stringify({ message: "Bulk import completed", success, errors }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
