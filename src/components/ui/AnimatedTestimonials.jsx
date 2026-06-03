"use client";

import { IconArrowLeft, IconArrowRight, IconBrandGithub, IconExternalLink } from "@tabler/icons-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

export const AnimatedTestimonials = ({
    testimonials,
    autoplay = false,
}) => {
    const [active, setActive] = useState(0);

    const handleNext = () => {
        setActive((prev) => (prev + 1) % testimonials.length);
    };

    const handlePrev = () => {
        setActive((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    };

    const isActive = (index) => {
        return index === active;
    };

    useEffect(() => {
        if (autoplay) {
            const interval = setInterval(handleNext, 5000);
            return () => clearInterval(interval);
        }
    }, [autoplay]);

    const randomRotateY = () => {
        return Math.floor(Math.random() * 21) - 10;
    };

    return (
        <div className="mx-auto max-w-sm px-4 py-20 font-sans antialiased md:max-w-4xl md:px-8 lg:px-12">
            <div className="relative grid grid-cols-1 gap-20 md:grid-cols-2">
                <div>
                    <div className="relative h-80 w-full">
                        <AnimatePresence mode="popLayout">
                            {testimonials.map((testimonial, index) => (
                                <motion.div
                                    key={testimonial.src}
                                    initial={{
                                        opacity: 0,
                                        scale: 0.9,
                                        z: -100,
                                        rotate: randomRotateY(),
                                    }}
                                    animate={{
                                        opacity: isActive(index) ? 1 : 0.7,
                                        scale: isActive(index) ? 1 : 0.95,
                                        z: isActive(index) ? 0 : -100,
                                        rotate: isActive(index) ? 0 : randomRotateY(),
                                        zIndex: isActive(index)
                                            ? 40
                                            : testimonials.length + 2 - index,
                                        y: isActive(index) ? [0, -80, 0] : 0,
                                    }}
                                    exit={{
                                        opacity: 0,
                                        scale: 0.9,
                                        z: 100,
                                        rotate: randomRotateY(),
                                    }}
                                    transition={{
                                        duration: 0.4,
                                        ease: "easeInOut",
                                    }}
                                    className="absolute inset-0 origin-bottom"
                                >
                                    <img
                                        src={testimonial.src}
                                        alt={testimonial.name}
                                        width={500}
                                        height={500}
                                        draggable={false}
                                        className="h-full w-full rounded-3xl object-cover object-center shadow-xl"
                                    />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
                <div className="flex flex-col justify-between py-4">
                    <motion.div
                        key={active}
                        initial={{
                            y: 20,
                            opacity: 0,
                        }}
                        animate={{
                            y: 0,
                            opacity: 1,
                        }}
                        exit={{
                            y: -20,
                            opacity: 0,
                        }}
                        transition={{
                            duration: 0.2,
                            ease: "easeInOut",
                        }}
                    >
                        <h3 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
                            {testimonials[active].name}
                        </h3>
                        <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mt-1 uppercase tracking-wider">
                            {testimonials[active].designation}
                        </p>
                        <motion.p className="mt-8 text-lg text-zinc-600 dark:text-zinc-300 leading-relaxed">
                            {testimonials[active].quote.split(" ").map((word, index) => (
                                <motion.span
                                    key={index}
                                    initial={{
                                        filter: "blur(10px)",
                                        opacity: 0,
                                        y: 5,
                                    }}
                                    animate={{
                                        filter: "blur(0px)",
                                        opacity: 1,
                                        y: 0,
                                    }}
                                    transition={{
                                        duration: 0.2,
                                        ease: "easeInOut",
                                        delay: 0.02 * index,
                                    }}
                                    className="inline-block"
                                >
                                    {word}&nbsp;
                                </motion.span>
                            ))}
                        </motion.p>

                        {/* Project Links */}
                        <div className="flex gap-4 mt-8">
                            {testimonials[active].github && (
                                <a
                                    href={testimonials[active].github}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                                    aria-label="GitHub Repository"
                                >
                                    <IconBrandGithub className="h-6 w-6" />
                                </a>
                            )}
                            {testimonials[active].link && (
                                <a
                                    href={testimonials[active].link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                                    aria-label="Live Demo"
                                >
                                    <IconExternalLink className="h-6 w-6" />
                                </a>
                            )}
                        </div>
                    </motion.div>
                    <div className="flex gap-4 pt-12 md:pt-0">
                        <button
                            onClick={handlePrev}
                            className="group/button flex h-9 w-9 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-all"
                        >
                            <IconArrowLeft className="h-6 w-6 text-zinc-700 transition-transform duration-300 group-hover/button:rotate-12 dark:text-zinc-400" />
                        </button>
                        <button
                            onClick={handleNext}
                            className="group/button flex h-9 w-9 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-all"
                        >
                            <IconArrowRight className="h-6 w-6 text-zinc-700 transition-transform duration-300 group-hover/button:-rotate-12 dark:text-zinc-400" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
