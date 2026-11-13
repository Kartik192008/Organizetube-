import { useState } from "react";
import { Loader2, Save, Send, AlertCircle, CheckCircle2, Info } from "lucide-react";
import { saveSettings, getSettings } from "../lib/api";
import type { AppSettings } from "../types";

interface SettingsPanelProps {
  onClose: () => void;
  onSaved: () => void;
}

export default function SettingsPanel({ onClose, onSaved }: SettingsPanelProps) {
  const [botToken, setBotToken] = useState("");
  const [chatId, setChatId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [step, setStep] = useState<"form" | "success">("form");

  async function handleSave() {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await saveSettings(botToken, chatId);
      setSuccess(
        result.chat_id
          ? `Connected! Your bot will send files to chat ID ${result.chat_id}.`
          : "Bot token verified, but no chat ID found. Send a message to your bot first, then try again."
      );
      setStep("success");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (step === "success") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl p-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-center text-gray-900 mb-2">Connected!</h2>
          <p className="text-sm text-gray-600 text-center mb-6">{success}</p>
          <div className="flex gap-3">
            <button
              onClick={onSaved}
              className="flex-1 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition"
            >
              Start Uploading
            </button>
            <button
              onClick={() => setStep("form")}
              className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition"
            >
              Edit
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Connect Your Telegram Bot</h2>
          <p className="text-sm text-gray-500 mt-1">
            Your files are stored in Telegram. Enter your bot credentials to get started.
          </p>
        </div>

        <div className="p-6 space-y-5">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900 space-y-2">
                <p className="font-semibold">How to set up:</p>
                <ol className="list-decimal list-inside space-y-1 text-blue-800">
                  <li>
                    Open Telegram and message{" "}
                    <a
                      href="https://t.me/BotFather"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium underline"
                    >
                      @BotFather
                    </a>
                  </li>
                  <li>
                    Send <code className="bg-blue-100 px-1 rounded">/newbot</code> and follow prompts
                  </li>
                  <li>Copy the bot token BotFather gives you</li>
                  <li>
                    Send any message to your new bot (this lets it find your chat)
                  </li>
                  <li>Leave Chat ID blank — we'll auto-detect it</li>
                </ol>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Bot Token
            </label>
            <input
              type="password"
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
              placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 outline-none transition text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">
              From BotFather when you created your bot
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Chat ID <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              placeholder="Auto-detected if you message your bot"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 outline-none transition text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">
              Where files will be sent. Leave blank to auto-detect.
            </p>
          </div>

          {error && (
            <div className="flex gap-2 items-start bg-red-50 border border-red-200 rounded-xl p-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={loading || !botToken}
              className="flex-1 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Connect Bot
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="px-5 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
