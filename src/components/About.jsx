import React from "react";
import { motion } from "framer-motion";
import Section from "./ui/Section";
import { about } from "../data";
import { Terminal, Lightbulb, Coffee, Rocket } from "lucide-react";

const About = () => {
  return (
    <Section id="about" className="py-24 relative">
      <div className="text-center mb-16 relative z-10">
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">{about.title}</h2>
        <div className="w-20 h-1 bg-gradient-to-r from-transparent via-[#00f2ff] to-transparent mx-auto" />
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6 relative z-10">
        {/* Main Bio Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="md:col-span-8 glass-card p-8 md:p-12 flex flex-col justify-center"
        >
          <div className="space-y-6">
            {about.paragraphs.map((paragraph, index) => (
              <p key={index} className="text-lg text-zinc-400 leading-relaxed font-light">
                {paragraph}
              </p>
            ))}
          </div>
        </motion.div>

        {/* Traits Bento Box */}
        <div className="md:col-span-4 flex flex-col gap-6">
          {about.traits.map((trait, index) => {
            const icons = [<Terminal size={24}/>, <Rocket size={24}/>, <Lightbulb size={24}/>, <Coffee size={24}/>];
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="glass-card p-6 flex items-center gap-4 group"
              >
                <div className="w-12 h-12 rounded-full bg-[#00f2ff]/10 flex items-center justify-center text-[#00f2ff] group-hover:scale-110 transition-transform">
                  {icons[index % icons.length]}
                </div>
                <h4 className="text-lg font-bold text-white">{trait}</h4>
              </motion.div>
            )
          })}
        </div>
      </div>
    </Section>
  );
};

export default About;
