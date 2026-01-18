"use client";
import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const FlipWords = ({
    words,
    duration = 3000,
    className,
}) => {
    const [currentWord, setCurrentWord] = useState(words[0]);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentWord((prev) => {
                const currentIndex = words.indexOf(prev);
                const nextIndex = (currentIndex + 1) % words.length;
                return words[nextIndex];
            });
        }, duration);

        return () => clearInterval(interval);
    }, [words, duration]);

    return (
        <div className={cn("inline-grid grid-cols-1 items-center justify-items-start gap-0", className)}>
            <AnimatePresence mode="popLayout">
                <motion.span
                    key={currentWord}
                    initial={{ y: "100%", opacity: 0 }}
                    animate={{ y: "0%", opacity: 1 }}
                    exit={{ y: "-100%", opacity: 0 }}
                    transition={{
                        type: "spring",
                        stiffness: 100,
                        damping: 20,
                        duration: 0.5,
                    }}
                    className={cn(
                        "block whitespace-nowrap", // Ensures the word doesn't break
                        className
                    )}
                >
                    {currentWord}
                </motion.span>
            </AnimatePresence>
        </div>
    );
};