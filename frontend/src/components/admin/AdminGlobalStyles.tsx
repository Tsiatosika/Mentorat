'use client';

/**
 * Mount once per admin page. Centralizes keyframes, motion utilities and the
 * display typeface so the 5 admin pages stay visually consistent without
 * duplicating CSS. Respects prefers-reduced-motion globally.
 */
export default function AdminGlobalStyles() {
  return (
    <style jsx global>{`
      @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap');

      .admin-display {
        font-family: 'Outfit', ui-sans-serif, system-ui, sans-serif;
        letter-spacing: -0.02em;
      }
      .admin-mono {
        font-family: 'JetBrains Mono', ui-monospace, monospace;
        font-variant-numeric: tabular-nums;
      }

      @keyframes adminFadeUp {
        from { opacity: 0; transform: translateY(12px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes adminFadeIn {
        from { opacity: 0; }
        to   { opacity: 1; }
      }
      @keyframes adminShimmer {
        0%   { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
      @keyframes adminLatticeDrift {
        0%, 100% { transform: translate(0, 0); }
        50%      { transform: translate(-6px, 5px); }
      }
      @keyframes adminPulseDot {
        0%, 100% { opacity: 0.35; transform: scale(1); }
        50%      { opacity: 1; transform: scale(1.5); }
      }
      @keyframes adminPulseRing {
        0%   { box-shadow: 0 0 0 0 currentColor; opacity: .5; }
        100% { box-shadow: 0 0 0 8px currentColor; opacity: 0; }
      }
      @keyframes adminSpinSlow {
        from { transform: rotate(0deg); }
        to   { transform: rotate(360deg); }
      }

      .admin-fade-up {
        animation: adminFadeUp .55s cubic-bezier(.16,1,.3,1) both;
        animation-delay: calc(var(--i, 0) * 55ms + var(--base-delay, 0ms));
      }
      .admin-fade-in {
        animation: adminFadeIn .4s ease both;
        animation-delay: calc(var(--i, 0) * 45ms);
      }

      .admin-skeleton {
        background: linear-gradient(90deg, var(--bg-secondary) 25%, var(--border) 37%, var(--bg-secondary) 63%);
        background-size: 400% 100%;
        animation: adminShimmer 1.5s ease infinite;
        border-radius: 10px;
      }

      .admin-card-hover {
        transition: transform .25s cubic-bezier(.16,1,.3,1), box-shadow .25s ease, border-color .25s ease;
      }
      .admin-card-hover:hover {
        transform: translateY(-3px);
        box-shadow: 0 14px 28px -16px rgba(15, 23, 42, 0.22);
      }

      .admin-row {
        position: relative;
        transition: background-color .18s ease;
      }
      .admin-row::before {
        content: '';
        position: absolute;
        left: 0; top: 0; bottom: 0;
        width: 3px;
        background: var(--row-accent, transparent);
        transform: scaleY(0);
        transition: transform .2s ease;
        transform-origin: center;
      }
      .admin-row:hover::before { transform: scaleY(1); }

      .admin-btn {
        transition: transform .15s cubic-bezier(.16,1,.3,1), box-shadow .15s ease, opacity .15s ease;
      }
      .admin-btn:active { transform: scale(0.96); }

      .admin-input {
        transition: border-color .2s ease, box-shadow .2s ease;
      }
      .admin-input:focus {
        border-color: var(--accent) !important;
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 18%, transparent);
      }

      .admin-focus:focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: 2px;
        border-radius: 8px;
      }

      .admin-tab-indicator {
        transition: transform .3s cubic-bezier(.16,1,.3,1), width .3s cubic-bezier(.16,1,.3,1);
      }

      /* Admin header surface — light by default, dark when .dark is on <html>
         (this matches ThemeContext.tsx: root.classList.add('dark')). Plain
         CSS cascade, so it reacts instantly with no JS/hook involved. */
      .admin-header {
        background: linear-gradient(135deg, #FFFFFF, #F1F5F9 60%, #FFFFFF);
        border-bottom: 1px solid rgba(15, 23, 42, 0.08);
        transition: background .3s ease, border-color .3s ease;
      }
      .dark .admin-header {
        background: linear-gradient(135deg, #0B1220, #152238, #1E3A5F);
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      }
      .admin-header-title {
        color: #0F172A;
        transition: color .3s ease;
      }
      .dark .admin-header-title {
        color: #FFFFFF;
      }
      .admin-header-subtitle {
        color: #475569;
        transition: color .3s ease;
      }
      .dark .admin-header-subtitle {
        color: #BFDBFE;
      }

      .admin-chip-pulse::after {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: inherit;
        animation: adminPulseRing 1.8s ease-out infinite;
        pointer-events: none;
      }

      @media (prefers-reduced-motion: reduce) {
        .admin-fade-up, .admin-fade-in, .admin-skeleton, .admin-lattice-drift,
        .admin-chip-pulse::after, [class*="animate-"] {
          animation: none !important;
        }
        .admin-card-hover, .admin-btn, .admin-input, .admin-tab-indicator {
          transition: none !important;
        }
      }
    `}</style>
  );
}