import { useState, useEffect } from "react";

/**
 * Reactive media-query hook for inline-style responsive patterns.
 * Returns { isMobile, isTablet, isDesktop } based on viewport width.
 *
 * Breakpoints:
 *   mobile:  < 768px
 *   tablet:  768px–1023px
 *   desktop: >= 1024px
 */
export function useMediaQuery() {
  const [width, setWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return {
    isMobile: width < 768,
    isTablet: width >= 768 && width < 1024,
    isDesktop: width >= 1024,
    width,
  };
}

/**
 * Responsive style helper — picks value based on current breakpoint.
 * Usage: r(isMobile, mobileValue, desktopValue)
 */
export const r = (isMobile, mobile, desktop) => (isMobile ? mobile : desktop);
