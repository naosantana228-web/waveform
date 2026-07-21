import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Key, Sparkles, Trash2, Check, Cloud, CloudOff, RefreshCw, Upload, Download, Loader2 } from "lucide-react";
import { getGeminiApiKey, setGeminiApiKey, removeGeminiApiKey } from "@/services/gemini";
import { getGitHubToken, setGitHubToken, removeGitHubToken, verifyToken, pushToGist, pullFromGist } from "@/services/gistSync";
import { resetAll } from "@/data";

export default function Settings() {
  const [apiKey, setApiKeyState] = useState(getGeminiApiKey() || '');
  const [saved, setSaved] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // GitHub Gist sync state
  const [ghToken, setGhToken] = useState(getGitHubToken() || '');
  const [ghSaved, setGhSaved] = useState(!!getGitHubToken());
  const [ghUsername, setGhUsername] = useState<string | null>(null);
  const [ghError, setGhError] = useState<string | null>(null);
  const [ghLoading, setGhLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

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

  // GitHub token handlers
  const handleGhSave = async () => {
    if (!ghToken.trim()) return;
    setGhLoading(true);
    setGhError(null);
    
    const result = await verifyToken(ghToken.trim());
    if (result.valid) {
      setGitHubToken(ghToken.trim());
      setGhSaved(true);
      setGhUsername(result.username || null);
      setGhError(null);
    } else {
      setGhError(result.error || 'Invalid token');
    }
    setGhLoading(false);
  };

  const handleGhRemove = () => {
    removeGitHubToken();
    setGhToken('');
    setGhSaved(false);
    setGhUsername(null);
    setGhError(null);
    setSyncStatus(null);
  };

  const handlePush = async () => {
    setGhLoading(true);
    setSyncStatus(null);
    const result = await pushToGist();
    if (result.success) {
      setSyncStatus('Pushed successfully! Your data is now in the cloud.');
    } else {
      setSyncStatus(`Push failed: ${result.error}`);
    }
    setGhLoading(false);
  };

  const handlePull = async () => {
    setGhLoading(true);
    setSyncStatus(null);
    const result = await pullFromGist();
    if (result.success) {
      setSyncStatus(`Pulled successfully! Last updated: ${result.data?.lastUpdated ? new Date(result.data.lastUpdated).toLocaleString() : 'unknown'}. Reloading...`);
      setTimeout(() => window.location.reload(), 1500);
    } else {
      setSyncStatus(`Pull failed: ${result.error}`);
    }
    setGhLoading(false);
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
        {/* GitHub Gist Sync Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-[oklch(0.7_0.12_150)]/20 flex items-center justify-center">
              <Cloud className="w-5 h-5 text-[oklch(0.7_0.12_150)]" />
            </div>
            <div>
              <h2 className="font-semibold">Cloud Sync</h2>
              <p className="text-xs text-[oklch(0.6_0.01_260)]">Sync your data across devices via GitHub Gist</p>
            </div>
          </div>

          <p className="text-sm text-[oklch(0.6_0.01_260)] mb-4">
            Sync your likes, dislikes, and discovery progress across all your devices using a private GitHub Gist.
            Changes auto-sync after every action.
          </p>

          <div className="space-y-3">
            {!ghSaved ? (
              <>
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-[oklch(0.6_0.01_260)]" />
                  <input
                    type="password"
                    value={ghToken}
                    onChange={(e) => { setGhToken(e.target.value); setGhError(null); }}
                    placeholder="Paste your GitHub token here (ghp_...)..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[oklch(0.7_0.12_150)] transition-colors"
                  />
                </div>
                <button
                  onClick={handleGhSave}
                  disabled={!ghToken.trim() || ghLoading}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[oklch(0.7_0.12_150)] text-[oklch(0.08_0.005_260)] hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {ghLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Connect GitHub
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 text-sm text-[oklch(0.7_0.12_150)]">
                  <Cloud className="w-4 h-4" />
                  <span>Connected{ghUsername ? ` as @${ghUsername}` : ''}</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={handlePush}
                    disabled={ghLoading}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-[oklch(0.7_0.12_150)]/20 text-[oklch(0.7_0.12_150)] hover:bg-[oklch(0.7_0.12_150)]/30 transition-colors disabled:opacity-50"
                  >
                    {ghLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                    Push to Cloud
                  </button>
                  <button
                    onClick={handlePull}
                    disabled={ghLoading}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-[oklch(0.7_0.12_150)]/20 text-[oklch(0.7_0.12_150)] hover:bg-[oklch(0.7_0.12_150)]/30 transition-colors disabled:opacity-50"
                  >
                    {ghLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                    Pull from Cloud
                  </button>
                  <button
                    onClick={handleGhRemove}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <CloudOff className="w-3 h-3" /> Disconnect
                  </button>
                </div>
              </>
            )}

            {ghError && (
              <p className="text-xs text-red-400 mt-2">{ghError}</p>
            )}
            {syncStatus && (
              <p className="text-xs text-[oklch(0.7_0.12_150)] mt-2">{syncStatus}</p>
            )}
          </div>

          <div className="mt-4 p-3 rounded-lg bg-white/5 border border-white/5">
            <p className="text-xs text-[oklch(0.6_0.01_260)] mb-2 font-medium">How to get a GitHub token:</p>
            <ol className="text-xs text-[oklch(0.6_0.01_260)] space-y-1 list-decimal list-inside">
              <li>Go to <a href="https://github.com/settings/tokens/new?scopes=gist&description=Waveform+Sync" target="_blank" rel="noopener noreferrer" className="text-[oklch(0.7_0.12_150)] underline">github.com/settings/tokens</a></li>
              <li>Select <strong>"Generate new token (classic)"</strong></li>
              <li>Check ONLY the <strong>"gist"</strong> scope</li>
              <li>Generate and paste it above</li>
            </ol>
            <p className="text-xs text-[oklch(0.6_0.01_260)] mt-2">
              Your data is stored in a private Gist — only you can see it.
            </p>
          </div>
        </motion.section>

        {/* Groq API Key Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-[oklch(0.7_0.15_200)]/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-[oklch(0.7_0.15_200)]" />
            </div>
            <div>
              <h2 className="font-semibold">AI Recommendations</h2>
              <p className="text-xs text-[oklch(0.6_0.01_260)]">Powered by Groq + Llama 3.3 (free)</p>
            </div>
          </div>

          <p className="text-sm text-[oklch(0.6_0.01_260)] mb-4">
            Get AI-powered music recommendations when you finish discovering all tracks in a genre.
            You need a free Groq API key (no credit card required).
          </p>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-[oklch(0.6_0.01_260)]" />
              <input
                type="password"
                value={apiKey}
                onChange={(e) => { setApiKeyState(e.target.value); setSaved(false); }}
                placeholder="Paste your Groq API key here (gsk_...)..."
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
              <li>Go to <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="text-[oklch(0.7_0.15_200)] underline">console.groq.com/keys</a></li>
              <li>Create a free account (no credit card needed)</li>
              <li>Click "Create API Key"</li>
              <li>Copy and paste it above</li>
            </ol>
            <p className="text-xs text-[oklch(0.6_0.01_260)] mt-2">
              Free tier: 30 requests/minute, 14,400/day — more than enough for music discovery.
            </p>
          </div>
        </motion.section>

        {/* Data Management */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
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
          transition={{ delay: 0.3 }}
          className="glass-card rounded-2xl p-6"
        >
          <h2 className="font-semibold mb-2">About Waveform</h2>
          <p className="text-sm text-[oklch(0.6_0.01_260)]">
            A personal music discovery app. Data syncs via GitHub Gist across devices.
            No tracking, no ads from us.
          </p>
          <p className="text-xs text-[oklch(0.6_0.01_260)] mt-2">
            6 genres · 600+ curated tracks · AI recommendations via Groq · Cloud sync via GitHub
          </p>
        </motion.section>
      </main>
    </div>
  );
}
