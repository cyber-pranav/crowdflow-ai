'use client';

export default function TopAppBar() {
  return (
    <header
      role="banner"
      aria-label="Application header"
      className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center w-full px-6 py-4 bg-background/80 backdrop-blur-lg"
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-full overflow-hidden border border-primary/20 bg-surface-container-highest flex items-center justify-center"
          aria-hidden="true"
        >
          <span className="material-symbols-outlined text-primary text-lg">person</span>
        </div>
        <span className="text-lg font-bold text-primary uppercase tracking-widest font-headline">
          CrowdFlow AI
        </span>
      </div>

      <button
        aria-label="Toggle high contrast mode"
        className="material-symbols-outlined text-primary hover:text-secondary transition-colors active:scale-95 duration-150 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 cursor-pointer"
      >
        contrast
      </button>

      {/* Bottom gradient line */}
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" aria-hidden="true" />
    </header>
  );
}
