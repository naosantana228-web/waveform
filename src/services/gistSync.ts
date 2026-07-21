// GitHub Gist Sync Service
// Syncs user data (likes, dislikes, broken, AI tracks) to a private GitHub Gist
// Requires a GitHub Personal Access Token with 'gist' scope

const STORAGE_KEY_TOKEN = 'waveform_github_token';
const STORAGE_KEY_GIST_ID = 'waveform_gist_id';
const GIST_FILENAME = 'waveform-sync-data.json';
const GITHUB_API = 'https://api.github.com';

export function getGitHubToken(): string | null {
  return localStorage.getItem(STORAGE_KEY_TOKEN);
}

export function setGitHubToken(token: string) {
  localStorage.setItem(STORAGE_KEY_TOKEN, token);
}

export function removeGitHubToken() {
  localStorage.removeItem(STORAGE_KEY_TOKEN);
  localStorage.removeItem(STORAGE_KEY_GIST_ID);
}

export function getGistId(): string | null {
  return localStorage.getItem(STORAGE_KEY_GIST_ID);
}

function setGistId(id: string) {
  localStorage.setItem(STORAGE_KEY_GIST_ID, id);
}

interface SyncData {
  version: number;
  lastUpdated: string;
  state: {
    liked: Record<string, number[]>;
    disliked: Record<string, number[]>;
    broken: Record<string, number[]>;
  };
  customTracks?: any[]; // AI-recommended tracks that were added
}

/**
 * Find existing Waveform sync gist or return null
 */
async function findExistingGist(token: string): Promise<string | null> {
  // Check if we have a cached gist ID
  const cachedId = getGistId();
  if (cachedId) {
    // Verify it still exists
    try {
      const resp = await fetch(`${GITHUB_API}/gists/${cachedId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (resp.ok) return cachedId;
    } catch {}
    // Cached ID is invalid, clear it
    localStorage.removeItem(STORAGE_KEY_GIST_ID);
  }

  // Search through user's gists
  try {
    const resp = await fetch(`${GITHUB_API}/gists?per_page=100`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!resp.ok) return null;
    const gists = await resp.json();
    for (const gist of gists) {
      if (gist.files && gist.files[GIST_FILENAME]) {
        setGistId(gist.id);
        return gist.id;
      }
    }
  } catch {}
  return null;
}

/**
 * Create a new private gist for Waveform sync
 */
async function createGist(token: string, data: SyncData): Promise<string> {
  const resp = await fetch(`${GITHUB_API}/gists`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      description: 'Waveform Music Discovery - Sync Data (auto-generated)',
      public: false,
      files: {
        [GIST_FILENAME]: {
          content: JSON.stringify(data, null, 2),
        },
      },
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Failed to create gist: ${err}`);
  }

  const gist = await resp.json();
  setGistId(gist.id);
  return gist.id;
}

/**
 * Update an existing gist with new data
 */
async function updateGist(token: string, gistId: string, data: SyncData): Promise<void> {
  const resp = await fetch(`${GITHUB_API}/gists/${gistId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      files: {
        [GIST_FILENAME]: {
          content: JSON.stringify(data, null, 2),
        },
      },
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Failed to update gist: ${err}`);
  }
}

/**
 * Read data from the gist
 */
async function readGist(token: string, gistId: string): Promise<SyncData | null> {
  try {
    const resp = await fetch(`${GITHUB_API}/gists/${gistId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!resp.ok) return null;
    const gist = await resp.json();
    const file = gist.files?.[GIST_FILENAME];
    if (!file || !file.content) return null;
    return JSON.parse(file.content);
  } catch {
    return null;
  }
}

/**
 * Push local state to GitHub Gist
 */
export async function pushToGist(customTracks?: any[]): Promise<{ success: boolean; error?: string }> {
  const token = getGitHubToken();
  if (!token) {
    return { success: false, error: 'No GitHub token configured' };
  }

  try {
    // Get current local state
    const stateStr = localStorage.getItem('waveform_state');
    if (!stateStr) {
      return { success: false, error: 'No local data to sync' };
    }

    const state = JSON.parse(stateStr);
    const data: SyncData = {
      version: 1,
      lastUpdated: new Date().toISOString(),
      state,
      customTracks,
    };

    // Find or create gist
    let gistId = await findExistingGist(token);
    if (gistId) {
      await updateGist(token, gistId, data);
    } else {
      gistId = await createGist(token, data);
    }

    console.log('[Gist Sync] Pushed successfully to gist:', gistId);
    return { success: true };
  } catch (err: any) {
    console.error('[Gist Sync] Push failed:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Pull state from GitHub Gist and merge with local
 */
export async function pullFromGist(): Promise<{ success: boolean; error?: string; data?: SyncData }> {
  const token = getGitHubToken();
  if (!token) {
    return { success: false, error: 'No GitHub token configured' };
  }

  try {
    const gistId = await findExistingGist(token);
    if (!gistId) {
      return { success: false, error: 'No sync data found. Push your data first.' };
    }

    const data = await readGist(token, gistId);
    if (!data) {
      return { success: false, error: 'Could not read sync data from gist.' };
    }

    // Apply the remote state to localStorage
    localStorage.setItem('waveform_state', JSON.stringify(data.state));

    console.log('[Gist Sync] Pulled successfully. Last updated:', data.lastUpdated);
    return { success: true, data };
  } catch (err: any) {
    console.error('[Gist Sync] Pull failed:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Verify that a GitHub token is valid and has gist scope
 */
export async function verifyToken(token: string): Promise<{ valid: boolean; username?: string; error?: string }> {
  try {
    const resp = await fetch(`${GITHUB_API}/user`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!resp.ok) {
      return { valid: false, error: 'Invalid token' };
    }
    const user = await resp.json();
    
    // Check scopes
    const scopes = resp.headers.get('x-oauth-scopes') || '';
    if (!scopes.includes('gist')) {
      return { valid: false, error: 'Token needs "gist" scope. Create a new token with gist permission.' };
    }
    
    return { valid: true, username: user.login };
  } catch (err: any) {
    return { valid: false, error: err.message };
  }
}

/**
 * Auto-sync: push after every state change (debounced)
 */
let syncTimeout: ReturnType<typeof setTimeout> | null = null;

export function scheduleSync() {
  if (!getGitHubToken()) return;
  
  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(async () => {
    const result = await pushToGist();
    if (!result.success) {
      console.warn('[Gist Sync] Auto-sync failed:', result.error);
    }
  }, 5000); // Debounce 5 seconds to batch rapid changes
}
