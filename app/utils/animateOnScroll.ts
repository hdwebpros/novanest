export const animateOnScroll = (
  element: Element | ComponentPublicInstance | null,
  className = "visible",
  options: IntersectionObserverInit = {}
) => {
  if (!element) return;

  // Handle Vue components by getting their root element
  const el = (element as any)?.$el || (element as HTMLElement);

  if (!el || typeof el.classList === "undefined") return;

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        el.classList.add(className);
      } else {
        el.classList.remove(className);
      }
    },
    { threshold: 0.1, rootMargin: "-10%", ...options }
  );

  observer.observe(el);

  // Check if element is already visible on initial load
  const rect = el.getBoundingClientRect();
  const windowHeight = window.innerHeight;
  const elementVisible =
    rect.top < windowHeight * 0.9 && rect.bottom > windowHeight * 0.1;

  if (elementVisible) {
    el.classList.add(className);
  }
};
