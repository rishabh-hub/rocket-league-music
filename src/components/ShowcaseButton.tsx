'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Eye, TrendingUp } from 'lucide-react';

// SVG for better sparkle effect
const SparkleIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M12 2L9.1 9.1 2 12l7.1 2.9L12 22l2.9-7.1L22 12l-7.1-2.9z" />
  </svg>
);

export default function ShowcaseButton() {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);

  // Better sparkle positions for animation
  const [sparkles, setSparkles] = useState<
    {
      key: number;
      x: number;
      y: number;
      delay: number;
      size: number;
      rotation: number;
    }[]
  >([]);

  useEffect(() => {
    if (isHovered) {
      // Generate sparkle positions with better distribution and properties
      const newSparkles = Array.from({ length: 8 }).map((_, i) => {
        // Use a circular distribution for more natural positioning
        const angle = (i / 8) * Math.PI * 2 + Math.random() * 0.5;
        const distance = 30 + Math.random() * 60;

        return {
          key: i,
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance,
          delay: i * 0.1 + Math.random() * 0.2, // Sequential delays with small randomness
          size: 0.7 + Math.random() * 0.6, // Varied sizes
          rotation: Math.random() * 360, // Random rotation for variety
        };
      });
      setSparkles(newSparkles);
    }
  }, [isHovered]);

  return (
    <div className="relative my-4">
      {/* Improved sparkle animations with better elements */}
      {isHovered &&
        sparkles.map((sparkle) => (
          <motion.div
            key={sparkle.key}
            initial={{ opacity: 0, scale: 0, rotate: sparkle.rotation }}
            animate={{
              opacity: [0, 1, 1, 0],
              scale: [0, sparkle.size, sparkle.size, 0],
              rotate: [sparkle.rotation, sparkle.rotation + 20],
            }}
            transition={{
              duration: 1.8,
              delay: sparkle.delay,
              ease: 'easeInOut',
              times: [0, 0.3, 0.8, 1], // Control the timing of opacity and scale
              repeat: Infinity,
              repeatDelay: 0.5,
            }}
            className="absolute z-10 pointer-events-none"
            style={{
              left: `calc(50% + ${sparkle.x}px)`,
              top: `calc(50% + ${sparkle.y}px)`,
              transformOrigin: 'center',
            }}
          >
            <SparkleIcon className="h-5 w-5 text-yellow-300 filter drop-shadow-lg" />
          </motion.div>
        ))}

      {/* Main button with improved gradient background */}
      <motion.div
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        className="relative"
      >
        {/* Enhanced glow effect behind button */}
        <motion.div
          className="absolute inset-0 rounded-xl blur-xl bg-gradient-to-r from-indigo-500/40 via-purple-500/40 to-pink-500/40"
          animate={{
            scale: isHovered ? [1, 1.12, 1.06] : 1,
          }}
          transition={{
            duration: 2,
            repeat: isHovered ? Infinity : 0,
            repeatType: 'reverse',
          }}
        />

        <Button
          onClick={() => router.push('/showcase')}
          className="relative w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 z-20 overflow-hidden"
          size="lg"
        >
          {/* Subtle background motion effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10"
            animate={{
              x: isHovered ? ['0%', '100%', '0%'] : '0%',
            }}
            transition={{
              duration: 3,
              repeat: isHovered ? Infinity : 0,
              ease: 'linear',
            }}
          />

          <div className="flex items-center gap-3 relative z-10">
            <div className="relative flex items-center justify-center">
              <motion.div
                animate={{
                  opacity: isHovered ? 0 : 1,
                }}
                transition={{ duration: 0.3 }}
              >
                <Eye className="h-5 w-5" />
              </motion.div>
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: isHovered ? 1 : 0,
                }}
                transition={{ duration: 0.3 }}
              >
                <TrendingUp className="h-5 w-5" />
              </motion.div>
            </div>

            <motion.span
              className="text-lg font-medium"
              animate={{
                y: isHovered ? [0, -2, 0, 2, 0] : 0,
              }}
              transition={{
                duration: 0.6,
                delay: 0.1,
                ease: 'easeInOut',
                repeat: isHovered ? 0 : 0,
              }}
            >
              Explore Replay Showcase
            </motion.span>
          </div>
        </Button>
      </motion.div>
    </div>
  );
}
