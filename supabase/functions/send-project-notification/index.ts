import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

interface NotificationRequest {
  event: "project_created" | "file_uploaded" | "status_changed";
  project_name: string;
  project_type?: string;
  file_name?: string;
  file_size?: number;
  old_status?: string;
  new_status?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function buildEmailContent(data: NotificationRequest, userEmail: string): { subject: string; html: string } {
  const safeName = escapeHtml(data.project_name);
  const safeEmail = escapeHtml(userEmail);

  switch (data.event) {
    case "project_created":
      return {
        subject: `New Project Created: ${safeName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #0ea5e9;">🧬 New Project Created</h2>
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Project:</strong> ${safeName}</p>
              <p><strong>Type:</strong> ${escapeHtml(data.project_type || 'Genomic')}</p>
              <p><strong>Created by:</strong> ${safeEmail}</p>
            </div>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e2e8f0;" />
            <p style="color: #64748b; font-size: 12px;">This notification was sent from BioDaCa.</p>
          </div>`,
      };

    case "file_uploaded":
      return {
        subject: `File Uploaded to ${safeName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #0ea5e9;">📁 File Uploaded</h2>
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>File:</strong> ${escapeHtml(data.file_name || 'Unknown')}</p>
              <p><strong>Size:</strong> ${data.file_size ? formatFileSize(data.file_size) : 'N/A'}</p>
              <p><strong>Project:</strong> ${safeName}</p>
              <p><strong>Uploaded by:</strong> ${safeEmail}</p>
            </div>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e2e8f0;" />
            <p style="color: #64748b; font-size: 12px;">This notification was sent from BioDaCa.</p>
          </div>`,
      };

    case "status_changed":
      return {
        subject: `Project Status Updated: ${safeName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #0ea5e9;">🔄 Project Status Changed</h2>
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Project:</strong> ${safeName}</p>
              <p><strong>Old Status:</strong> ${escapeHtml(data.old_status || '')}</p>
              <p><strong>New Status:</strong> ${escapeHtml(data.new_status || '')}</p>
              <p><strong>Changed by:</strong> ${safeEmail}</p>
            </div>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e2e8f0;" />
            <p style="color: #64748b; font-size: 12px;">This notification was sent from BioDaCa.</p>
          </div>`,
      };
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const userEmail = claimsData.claims.email as string || "unknown";

    const body: NotificationRequest = await req.json();

    if (!body.event || !body.project_name) {
      return new Response(JSON.stringify({ error: "Missing event or project_name" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { subject, html } = buildEmailContent(body, userEmail);

    const emailResponse = await resend.emails.send({
      from: "BioDaCa Notifications <onboarding@resend.dev>",
      to: ["biodaca1@gmail.com"],
      subject,
      html,
    });

    console.log("Notification email sent:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-project-notification:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
