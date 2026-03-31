let ctx: any = null;

export async function initAnimations() {
  // D-05: completely disable animations on prefers-reduced-motion
  // Check BEFORE importing GSAP — if reduced motion, GSAP never loads at all
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('[data-animate]').forEach(el => {
      (el as HTMLElement).style.opacity = '1';
      (el as HTMLElement).style.transform = 'none';
    });
    return;
  }

  // Dynamic imports — Vite code-splits these into separate chunks
  const { gsap } = await import('gsap');
  const { ScrollTrigger } = await import('gsap/ScrollTrigger');
  const { SplitText } = await import('gsap/SplitText');

  gsap.registerPlugin(ScrollTrigger, SplitText);

  ctx = gsap.context(() => {
    // 1. Section reveals (D-07, D-08)
    // Every section with data-animate="section" gets a fade-in + slide-up
    gsap.utils.toArray<HTMLElement>('[data-animate="section"]').forEach((el) => {
      gsap.fromTo(el,
        { opacity: 0, y: 24 },
        {
          opacity: 1, y: 0, duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            once: true,
          },
        }
      );
    });

    // 2. Stagger items (D-09)
    // Project cards, skill groups, contact channels stagger in sequentially
    gsap.utils.toArray<HTMLElement>('[data-animate-container="stagger"]').forEach((container) => {
      const items = container.querySelectorAll('[data-animate="stagger-item"]');
      if (items.length === 0) return;
      gsap.fromTo(items,
        { opacity: 0, y: 24 },
        {
          opacity: 1, y: 0, duration: 0.6,
          stagger: 0.1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: container,
            start: 'top 85%',
            once: true,
          },
        }
      );
    });

    // 3. SplitText display headings (D-11)
    // Line-by-line slide-up reveal on display-sized headings only
    gsap.utils.toArray<HTMLElement>('[data-animate="split-text"]').forEach((el) => {
      SplitText.create(el, {
        type: 'lines',
        mask: 'lines',
        autoSplit: true,
        onSplit(self: any) {
          return gsap.fromTo(self.lines,
            { y: '100%', opacity: 0 },
            {
              y: '0%', opacity: 1,
              duration: 0.7,
              stagger: 0.12,
              ease: 'power2.out',
            }
          );
        },
      });
    });
  });
}

export function cleanupAnimations() {
  ctx?.revert();
  ctx = null;
}
