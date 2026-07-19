// ============================================================================
// SHARED TAILWIND CONFIG  (Play CDN)
// ----------------------------------------------------------------------------
// Load this on EVERY page, immediately AFTER the Tailwind CDN script:
//
//   <script src="https://cdn.tailwindcss.com"></script>
//   <script src="/src/config/tailwind.js"></script>
//   <link rel="stylesheet" href="/src/styles/main.css" />
//
// Registering the palette here makes every `bg-navy-*`, `text-gold-*`,
// gradient, and their hover/focus/responsive variants work natively — which
// is what was previously missing (colours only "sometimes" applied because
// they were hand-patched in main.css). Keep the hexes in sync with the
// CSS variables in main.css.
// ============================================================================
tailwind.config = {
  theme: {
    extend: {
      colors: {
        navy: {
          50:'#f1f5fa', 100:'#dde7f1', 200:'#b8cce0', 300:'#7fa3c4',
          400:'#4977a3', 500:'#2c5a8c', 600:'#1f4570', 700:'#1a3a5f',
          800:'#142e4d', 900:'#0e2240', 950:'#07172d',
        },
        gold: {
          100:'#fbf3d4', 200:'#f6e5a8', 300:'#efd47e', 400:'#e6c155',
          500:'#d4af37', 600:'#b8932a', 700:'#8c6f1f',
        },
      },
      fontFamily: {
        display: ['Fraunces', 'ui-serif', 'Georgia', 'serif'],
        sans:    ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 1px 3px rgba(15,23,42,0.04), 0 12px 30px -12px rgba(14,34,64,0.14)',
      },
    },
  },
};
