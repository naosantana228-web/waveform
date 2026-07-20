import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Key, Sparkles, ExternalLink, Trash2, Check } from "lucide-react";
import { getGeminiApiKey, setGeminiApiKey, removeGeminiApiKey } from "@/services/gemini";
import { resetAll } from "@/data";

export default function Settings() {
  const [apiKey, setApiKeyState] = useState(getGeminiApiKey() || '');
  const [saved, setSaved] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleSave = () => {
    if (apiKey.trim()) {
      setGeminiApiKey(apiKey.trim());
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handleRemove = () => {
    removeGeminiApiKey();
    setApiKeyState('');
    setSaved(false);
  };

  const handleResetAll = () => {
    resetAll();
    setShowResetConfirm(false);
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-[oklch(0.08_0.005_260)]">
      <header className="sticky top-0 z-20 glass-card border-b border-white/5">
        <div className="flex items-center gap-4 px-6 py-4">
          <Link href="/" className="flex items-center gap-2 text-[oklch(0.6_0.01_260)] hover:text-[oklch(0.95_0.005_260)] transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-semibold">Settings</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-6 py-8 space-y-8">
        {/* Gemini API Key Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-[oklch(0.7_0.15_200)]/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-[oklch(0.7_0.15_200)]" />
            </div>
            <div>
              <h2 className="font-semibold">AI Recommendations</h2>
              <p className="text-xs text-[oklch(0.6_0.01_260)]">Powered by Google Gemini Flash (free)</p>
            </div>
          </div>

          <p className="text-sm text-[oklch(0.6_0.01_260)] mb-4">
            Get AI-powered music recommendations when you finish discovering all tracks in a genre.
            You need a free Google AI Studio API key.
          </p>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-[oklch(0.6_0.01_260)]" />
              <input
                type="password"
                value={apiKey}
                onChange={(e) => { setApiKeyState(e.target.value); setSaved(false); }}
                placeholder="Paste your Gemini API key here..."
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[oklch(0.7_0.15_200)] transition-colors"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={!apiKey.trim() || saved}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[oklch(0.7_0.15_200)] text-[oklch(0.08_0.005_260)] hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {saved ? <><Check className="w-4 h-4" /> Saved!</> : 'Save Key'}
              </button>
              {getGeminiApiKey() && (
                <button
                  onClick={handleRemove}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="w-3 h-3" /> Remove
                </button>
              )}
            </div>
          </div>

          <div className="mt-4 p-3 rounded-lg bg-white/5 border border-white/5">
            <p className="text-xs text-[oklch(0.6_0.01_260)] mb-2 font-medium">How to get a free API key:</p>
            <ol className="text-xs text-[oklch(0.6_0.01_260)] space-y-1 list-decimal list-inside">
              <li>Go to <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-[oklch(0.7_0.15_200)] underline">Google AI Studio</a></li>
              <li>Sign in with your Google account</li>
              <li>Click "Create API Key"</li>
              <li>Copy and paste it above</li>
            </ol>
            <p className="text-xs text-[oklch(0.6_0.01_260)] mt-2">
              Free tier includes ~15 requests/minute — more than enough for recommendations.
            </p>
          </div>
        </motion.section>

        {/* Data Management */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-2xl p-6"
        >
          <h2 className="font-semibold mb-4">Data Management</h2>
          <p className="text-sm text-[oklch(0.6_0.01_260)] mb-4">
            Reset all your likes, dislikes, and discovery history. This will re-initialize all tracks as liked.
          </p>
          {showResetConfirm ? (
            <div className="flex items-center gap-2">
              <button
                onClick={handleResetAll}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                Confirm Reset
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-white/10 hover:border-white/30 transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="px-4 py-2 rounded-lg text-sm font-medium border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
            >
              Reset All Data
            </button>
          )}
        </motion.section>

        {/* About */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-2xl p-6"
        >
          <h2 className="font-semibold mb-2">About Waveform</h2>
          <p className="text-sm text-[oklch(0.6_0.01_260)]">
            A personal music discovery app. All data is stored locally in your browser.
            No account needed, no tracking, no ads from us.
          </p>
          <p className="text-xs text-[oklch(0.6_0.01_260)] mt-2">
            6 genres · 600+ curated tracks · AI recommendations via Gemini
          </p>
        </motion.section>
      </main>
    </div>
  );
}
