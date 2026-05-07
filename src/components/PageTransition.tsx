"use client";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const getTabIndex = (path: string) => {
  if (path === "/") return 0;
  if (path.startsWith("/builder")) return 1;
  if (path.startsWith("/jobs")) return 2;
  if (path.startsWith("/u/")) return 3;
  return -1; // Support pages or unknown routes
};

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [prevPath, setPrevPath] = useState(pathname);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    if (pathname !== prevPath) {
      const prevIndex = getTabIndex(prevPath);
      const currentIndex = getTabIndex(pathname);
      
      // If we move to a higher index (right), slide from right (direction 1). Else, from left (-1)
      setDirection(currentIndex >= prevIndex ? 1 : -1);
      setPrevPath(pathname);
    }
  }, [pathname, prevPath]);

  const variants = {
    initial: (dir: number) => ({
      x: dir > 0 ? "15%" : "-15%",
      opacity: 0,
    }),
    animate: {
      x: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 500,
        damping: 45,
        mass: 1
      },
    },
    exit: (dir: number) => ({
      x: dir > 0 ? "-15%" : "15%",
      opacity: 0,
      transition: {
        type: "spring",
        stiffness: 500,
        damping: 45,
        mass: 1
      },
    }),
  };

  return (
    <div style={{ flex: 1, display: "grid", position: "relative", overflowX: "hidden", overflowY: "hidden" }}>
      <AnimatePresence custom={direction} initial={false}>
        <motion.div
          key={pathname}
          custom={direction}
          variants={variants}
          initial="initial"
          animate="animate"
          exit="exit"
          style={{ gridArea: "1 / 1", flex: 1, display: "flex", flexDirection: "column", width: "100%", height: "100%" }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
