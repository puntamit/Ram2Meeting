import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const IT_EMAIL = Deno.env.get("IT_EMAIL");

interface BookingPayload {
    record: {
        id: string;
        room_id: string;
        user_id: string;
        title: string;
        start_time: string;
        end_time: string;
        description: string;
        meeting_type: string;
        meeting_link: string;
    };
}

const handler = async (req: Request): Promise<Response> => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*" } });
    }

    try {
        const payload: BookingPayload = await req.json();
        const { record } = payload;

        // Format dates
        const startDate = new Date(record.start_time).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });
        const endDate = new Date(record.end_time).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });

        if (!RESEND_API_KEY) {
            console.error("Missing RESEND_API_KEY");
            return new Response("Missing API Key", { status: 500 });
        }

        // Send Email via Resend
        const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: "Meeting Notification <onboarding@resend.dev>", // Or your verified domain
                to: [IT_EMAIL],
                subject: `[New Booking] ${record.title}`,
                html: `
          <h1>มีการจองห้องประชุมใหม่</h1>
          <p><strong>หัวข้อ:</strong> ${record.title}</p>
          <p><strong>เวลา:</strong> ${startDate} - ${endDate}</p>
          <p><strong>รูปแบบ:</strong> ${record.meeting_type}</p>
          ${record.meeting_link ? `<p><strong>ลิงก์ประชุม:</strong> ${record.meeting_link}</p>` : ""}
          ${record.description ? `<p><strong>รายละเอียด:</strong> ${record.description}</p>` : ""}
          <br/>
          <p><em>ส่งจากระบบจองห้องประชุมอัตโนมัติ</em></p>
        `,
            }),
        });

        const data = await res.json();

        return new Response(JSON.stringify(data), {
            headers: { "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { "Content-Type": "application/json" },
            status: 400,
        });
    }
};

serve(handler);
