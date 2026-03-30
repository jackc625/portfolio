import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);

let ctx: gsap.Context | null = null;

function initAnimations() {
  // Check reduced motion first (D-13, ANIM-04)
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // Show all content in final state, no animations
    gsap.set('[data-animate]', { opacity: 1, y: 0 });
    return;
  }

  ctx = gsap.context(() => {
    // 1. Section reveals (D-07, D-08)
    // Every section with data-animate="section" gets a fade-in + slide-up
    gsap.utils.toArray<HTMLElement>('[data-animate="section"]').forEach((el) => {
      gsap.from(el, {
        opacity: 0,
        y: 24,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          once: true,
        },
      });
    });

    // 2. Stagger items (D-09)
    // Project cards, skill groups, contact channels stagger in sequentially
    gsap.utils.toArray<HTMLElement>('[data-animate-container="stagger"]').forEach((container) => {
      const items = container.querySelectorAll('[data-animate="stagger-item"]');
      if (items.length === 0) return;
      gsap.from(items, {
        opacity: 0,
        y: 24,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: container,
          start: 'top 85%',
          once: true,
        },
      });
    });

    // 3. SplitText display headings (D-11)
    // Line-by-line slide-up reveal on display-sized headings only
    gsap.utils.toArray<HTMLElement>('[data-animate="split-text"]').forEach((el) => {
      SplitText.create(el, {
        type: 'lines',
        mask: 'lines',
        autoSplit: true,
        onSplit(self) {
          return gsap.from(self.lines, {
            y: '100%',
            opacity: 0,
            duration: 0.7,
            stagger: 0.12,
            ease: 'power2.out',
          });
        },
      });
    });
  });
}

function cleanupAnimations() {
  ctx?.revert();
  ctx = null;
}

document.addEventListener('astro:page-load', initAnimations);
document.addEventListener('astro:before-preparation', cleanupAnimations);
