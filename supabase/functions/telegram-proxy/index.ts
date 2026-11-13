import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const TELEGRAM_API_BASE = "https://api.telegram.org";

interface AppSettings {
  telegram_bot_token: string | null;
  telegram_chat_id: string | null;
}

async function getSettings(
  supabase: ReturnType<typeof createClient>
): Promise<AppSettings> {
  const { data, error } = await supabase
    .from("app_settings")
    .select("telegram_bot_token, telegram_chat_id")
    .eq("id", 1)
    .maybeSingle();

  if (error) throw new Error(`Failed to read settings: ${error.message}`);
  return {
    telegram_bot_token: data?.telegram_bot_token ?? null,
    telegram_chat_id: data?.telegram_chat_id ?? null,
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const url = new URL(req.url);
  const pathParts = url.pathname.split("/").filter(Boolean);
  const action = url.searchParams.get("action") || pathParts.at(-1) || "";

  try {
    // ---- Save settings ----
    if (action === "settings" && req.method === "POST") {
      const body = await req.json();
      const { telegram_bot_token, telegram_chat_id } = body;

      // If token is provided, verify it by calling getMe
      let verifiedChatId = telegram_chat_id;
      if (telegram_bot_token) {
        const meRes = await fetch(`${TELEGRAM_API_BASE}/bot${telegram_bot_token}/getMe`);
        const meData = await meRes.json();
        if (!meData.ok) {
          return jsonResponse({ error: "Invalid bot token. Telegram rejected it." }, 400);
        }

        // If no chat_id provided, try to get updates to find a chat
        if (!verifiedChatId) {
          const updatesRes = await fetch(
            `${TELEGRAM_API_BASE}/bot${telegram_bot_token}/getUpdates?limit=10`
          );
          const updatesData = await updatesRes.json();
          if (updatesData.ok && updatesData.result.length > 0) {
            // Find the first chat that isn't the bot itself
            for (const update of updatesData.result) {
              const chat = update.message?.chat;
              if (chat) {
                verifiedChatId = String(chat.id);
                break;
              }
            }
          }
        }
      }

      // If we have a chat_id, verify the bot can send to it
      if (telegram_bot_token && verifiedChatId) {
        const testRes = await fetch(
          `${TELEGRAM_API_BASE}/bot${telegram_bot_token}/sendMessage`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: verifiedChatId,
              text: "✅ Telegram Gallery connected successfully! Your files will be stored here.",
            }),
          }
        );
        const testData = await testRes.json();
        if (!testData.ok) {
          return jsonResponse(
            { error: `Bot cannot send to chat ${verifiedChatId}: ${testData.description}` },
            400
          );
        }
      }

      const { error } = await supabase
        .from("app_settings")
        .update({
          telegram_bot_token: telegram_bot_token || null,
          telegram_chat_id: verifiedChatId || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", 1);

      if (error) throw new Error(`Failed to save settings: ${error.message}`);

      return jsonResponse({
        success: true,
        bot_verified: !!telegram_bot_token,
        chat_id: verifiedChatId || null,
      });
    }

    // ---- Get settings status (no token returned) ----
    if (action === "settings" && req.method === "GET") {
      const settings = await getSettings(supabase);
      return jsonResponse({
        configured: !!settings.telegram_bot_token && !!settings.telegram_chat_id,
        has_token: !!settings.telegram_bot_token,
        chat_id: settings.telegram_chat_id,
      });
    }

    // ---- Upload file to Telegram ----
    if (action === "upload" && req.method === "POST") {
      const settings = await getSettings(supabase);
      if (!settings.telegram_bot_token || !settings.telegram_chat_id) {
        return jsonResponse({ error: "Telegram not configured. Please set up your bot token and chat ID first." }, 400);
      }

      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return jsonResponse({ error: "No file provided" }, 400);
      }
      if (file.size > 50 * 1024 * 1024) {
        return jsonResponse({ error: "Files must be 50 MB or smaller." }, 413);
      }

      // Send file to Telegram — use sendDocument for all files
      // For images, use sendPhoto so Telegram generates thumbnails
      const isImage = file.type.startsWith("image/");
      const endpoint = isImage ? "sendPhoto" : "sendDocument";

      const tgFormData = new FormData();
      tgFormData.append("chat_id", settings.telegram_chat_id);
      tgFormData.append(isImage ? "photo" : "document", file, file.name);
      // Add caption with filename for document types
      if (!isImage) {
        tgFormData.append("caption", file.name);
      }

      const tgRes = await fetch(
        `${TELEGRAM_API_BASE}/bot${settings.telegram_bot_token}/${endpoint}`,
        { method: "POST", body: tgFormData }
      );
      const tgData = await tgRes.json();

      if (!tgData.ok) {
        return jsonResponse({ error: `Telegram upload failed: ${tgData.description}` }, 500);
      }

      const message = tgData.result;
      let fileId: string | null = null;
      let fileUniqueId: string | null = null;
      let thumbnailFileId: string | null = null;

      if (isImage && message.photo) {
        // photo is an array of sizes, take the largest
        const photos = message.photo as Array<{ file_id: string; file_unique_id: string; width: number; height: number }>;
        const largest = photos.reduce((a, b) => (b.width > a.width ? b : a));
        fileId = largest.file_id;
        fileUniqueId = largest.file_unique_id;

        const smallest = photos.reduce((a, b) => (a.width < b.width ? a : b));
        thumbnailFileId = smallest.file_id;
      } else if (message.document) {
        fileId = message.document.file_id;
        fileUniqueId = message.document.file_unique_id;
        if (message.document.thumb) {
          thumbnailFileId = message.document.thumb.file_id;
        }
      }

      return jsonResponse({
        success: true,
        message_id: message.message_id,
        chat_id: settings.telegram_chat_id,
        file_id: fileId,
        file_unique_id: fileUniqueId,
        telegram_file_id: fileId,
        telegram_thumbnail_file_id: thumbnailFileId,
      });
    }

    // ---- Download file from Telegram ----
    if (action === "download" && req.method === "GET") {
      const settings = await getSettings(supabase);
      if (!settings.telegram_bot_token) {
        return jsonResponse({ error: "Telegram not configured" }, 400);
      }

      const fileId = url.searchParams.get("file_id");
      if (!fileId) {
        return jsonResponse({ error: "Missing file_id parameter" }, 400);
      }

      // Step 1: get file path
      const filePathRes = await fetch(
        `${TELEGRAM_API_BASE}/bot${settings.telegram_bot_token}/getFile?file_id=${fileId}`
      );
      const filePathData = await filePathRes.json();
      if (!filePathData.ok) {
        return jsonResponse({ error: `Telegram getFile failed: ${filePathData.description}` }, 500);
      }

      const filePath = filePathData.result.file_path;
      // Step 2: download the actual file
      const fileRes = await fetch(
        `${TELEGRAM_API_BASE}/file/bot${settings.telegram_bot_token}/${filePath}`
      );
      if (!fileRes.ok) {
        return jsonResponse({ error: "Failed to download file from Telegram" }, 500);
      }

      const fileBuffer = await fileRes.arrayBuffer();
      const contentType = fileRes.headers.get("content-type") || "application/octet-stream";

      return new Response(fileBuffer, {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": contentType,
          "Content-Disposition": `inline; filename="${filePath.split("/").pop()}"`,
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    // ---- Delete file from Telegram ----
    if (action === "delete" && req.method === "POST") {
      const settings = await getSettings(supabase);
      if (!settings.telegram_bot_token || !settings.telegram_chat_id) {
        return jsonResponse({ error: "Telegram not configured" }, 400);
      }

      const body = await req.json();
      const { message_id } = body;
      if (!message_id) {
        return jsonResponse({ error: "Missing message_id" }, 400);
      }

      const tgRes = await fetch(
        `${TELEGRAM_API_BASE}/bot${settings.telegram_bot_token}/deleteMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: settings.telegram_chat_id,
            message_id: message_id,
          }),
        }
      );
      const tgData = await tgRes.json();

      if (!tgData.ok) {
        return jsonResponse({ error: `Telegram delete failed: ${tgData.description}` }, 500);
      }

      return jsonResponse({ success: true });
    }

    // ---- Forward a stored file message to Telegram ----
    if (action === "forward" && req.method === "POST") {
      const settings = await getSettings(supabase);
      if (!settings.telegram_bot_token || !settings.telegram_chat_id) {
        return jsonResponse({ error: "Telegram not configured" }, 400);
      }

      const body = await req.json();
      const { message_id, from_chat_id } = body;
      if (!message_id) {
        return jsonResponse({ error: "Missing message_id" }, 400);
      }

      const sourceChatId = from_chat_id || settings.telegram_chat_id;

      const tgRes = await fetch(
        `${TELEGRAM_API_BASE}/bot${settings.telegram_bot_token}/forwardMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: settings.telegram_chat_id,
            from_chat_id: sourceChatId,
            message_id: Number(message_id),
          }),
        }
      );
      const tgData = await tgRes.json();

      if (!tgData.ok) {
        return jsonResponse({ error: `Telegram forward failed: ${tgData.description}` }, 500);
      }

      return jsonResponse({
        success: true,
        message_id: tgData.result.message_id,
        chat_id: settings.telegram_chat_id,
      });
    }

    // ---- Get storage stats ----
    if (action === "stats" && req.method === "GET") {
      const { count: fileCount, error: fcErr } = await supabase
        .from("files")
        .select("*", { count: "exact", head: true });
      if (fcErr) throw new Error(fcErr.message);

      const { count: folderCount, error: fldErr } = await supabase
        .from("folders")
        .select("*", { count: "exact", head: true });
      if (fldErr) throw new Error(fldErr.message);

      const { data: sizeData, error: szErr } = await supabase
        .from("files")
        .select("size_bytes");
      if (szErr) throw new Error(szErr.message);

      const totalSize = (sizeData || []).reduce((sum, f) => sum + Number(f.size_bytes || 0), 0);

      return jsonResponse({
        file_count: fileCount || 0,
        folder_count: folderCount || 0,
        total_size_bytes: totalSize,
      });
    }

    return jsonResponse({ error: `Unknown action: ${action}` }, 404);
  } catch (err) {
    return jsonResponse({ error: err.message || "Internal server error" }, 500);
  }
});
