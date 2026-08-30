'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Eye, TrendingUp } from 'lucide-react';

export default function ShowcaseButton() {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const reduce = useReducedMotion();

  return (
    <div className="relative my-4">
      <motion.div
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        whileHover={reduce ? undefined : { scale: 1.02 }}
        whileTap={reduce ? undefined : { scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        className="relative"
      >
        <Button
          onClick={() => router.push('/showcase')}
          className="relative z-20 w-full rounded-md bg-primary px-8 text-primary-foreground transition-colors duration-instant hover:bg-primary/90"
          size="lg"
        >
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

            <span className="text-lg font-medium">
              See what other players got
            </span>
          </div>
        </Button>
      </motion.div>
    </div>
  );
}
