/*
 * LinkPreviewRegistry - optional per-domain tweaks for previews
 */

export function getRenderer(domain, url, preview) {
  const d = (domain || '').toLowerCase();

  // YouTube handled primarily in card, but return hint icon/label
  if (/(^|\.)youtube\.com$/.test(d) || /(^|\.)youtu\.be$/.test(d)) {
    return {
      label: 'YouTube'
    };
  }

  // GitHub issues/PRs/repos
  if (/(^|\.)github\.com$/.test(d)) {
    try {
      const u = new URL(url);
      const parts = u.pathname.split('/').filter(Boolean);
      // /owner/repo/issues/123 or /owner/repo/pull/123
      if (parts.length >= 4 && (parts[2] === 'issues' || parts[2] === 'pull')) {
        const owner = parts[0];
        const repo = parts[1];
        const num = parts[3];
        const type = parts[2] === 'issues' ? '#' : 'PR#';
        const title = preview?.title || `${owner}/${repo} ${type}${num}`;
        return {
          title,
          label: 'GitHub'
        };
      }
      // Repo root: /owner/repo
      if (parts.length >= 2) {
        const owner = parts[0];
        const repo = parts[1];
        const title = preview?.title || `${owner}/${repo}`;
        return {
          title,
          label: 'GitHub'
        };
      }
    } catch {}
  }

  return null;
}