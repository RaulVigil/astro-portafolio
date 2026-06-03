import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { cn } from "../../lib/utils";

const Section = ({
    children,
    className,
    id,
    delay = 0
}) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: false, amount: 0.3 });

    return (
        <section
            id={id}
            ref={ref}
            className={cn(
                "min-h-screen w-full flex flex-col justify-center relative overflow-hidden py-20 snap-start snap-always",
                className
            )}
        >
            <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 50, scale: 0.95 }}
                transition={{ duration: 0.8, delay: delay, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10"
            >
                {children}
            </motion.div>
        </section>
    );
};

export default Section;
