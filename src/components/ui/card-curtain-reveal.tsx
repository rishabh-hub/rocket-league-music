'use client';

import * as React from 'react';
import { HTMLMotionProps, Variants, motion } from 'motion/react';

import { cn } from '@/lib/utils';

const curtainVariants: Variants = {
  visible: {
    clipPath: 'polygon(0 0,100% 0,100% 100%,0 100%)',
    transition: {
      duration: 0.4,
      ease: [0.32, 0.72, 0, 1],
    },
  },

  hidden: {
    clipPath: 'polygon(50% 0,50% 0,50% 100%,50% 100%)',
    transition: {
      duration: 0.24,
      ease: [0.4, 0, 1, 1],
    },
  },
};

/* Fallback used until the revealed block has been measured, and if
   ResizeObserver is unavailable. Matches the previous hard-coded offset. */
const DEFAULT_REVEAL_OFFSET = 170;

interface CardCurtainRevealContextValue {
  isMouseIn: boolean;
  /* Height of the block that is hidden at rest, including its bottom margin.
     The title rests exactly this far down, so it lands in the space the
     description will occupy instead of on top of whatever follows it. */
  revealOffset: number;
  registerRevealNode: (node: HTMLElement | null) => void;
}
const CardCurtainRevealContext = React.createContext<
  CardCurtainRevealContextValue | undefined
>(undefined);
function useCardCurtainRevealContext() {
  const context = React.useContext(CardCurtainRevealContext);
  if (!context) {
    throw new Error(
      'useCardCurtainRevealContext must be used within a CardCurtainReveal Component'
    );
  }
  return context;
}

const CardCurtainReveal = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ children, className, ...props }, ref) => {
  const [isMouseIn, setIsMouseIn] = React.useState(false);
  const handleMouseEnter = React.useCallback(() => setIsMouseIn(true), []);
  const handleMouseLeave = React.useCallback(() => setIsMouseIn(false), []);

  const [revealNode, setRevealNode] = React.useState<HTMLElement | null>(null);
  const [revealOffset, setRevealOffset] = React.useState(DEFAULT_REVEAL_OFFSET);

  React.useEffect(() => {
    if (!revealNode || typeof ResizeObserver === 'undefined') return;

    const measure = () => {
      const marginBottom =
        parseFloat(window.getComputedStyle(revealNode).marginBottom) || 0;
      setRevealOffset(revealNode.offsetHeight + marginBottom);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(revealNode);
    return () => observer.disconnect();
  }, [revealNode]);

  const contextValue = React.useMemo(
    () => ({ isMouseIn, revealOffset, registerRevealNode: setRevealNode }),
    [isMouseIn, revealOffset]
  );

  return (
    <CardCurtainRevealContext.Provider value={contextValue}>
      <div
        ref={ref}
        className={cn(
          'relative flex flex-col gap-2 overflow-hidden',
          className
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleMouseEnter}
        onBlur={handleMouseLeave}
        {...props}
      >
        {children}
      </div>
    </CardCurtainRevealContext.Provider>
  );
});
CardCurtainReveal.displayName = 'CardCurtainReveal';

const CardCurtainRevealFooter = React.forwardRef<
  HTMLDivElement,
  HTMLMotionProps<'div'>
>(({ className, ...props }, ref) => {
  const { isMouseIn } = useCardCurtainRevealContext();

  return (
    <motion.div
      ref={ref}
      className={className}
      variants={curtainVariants}
      animate={isMouseIn ? 'visible' : 'hidden'}
      {...props}
    />
  );
});
CardCurtainRevealFooter.displayName = 'CardCurtainRevealFooter';

const CardCurtainRevealBody = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return <div ref={ref} className={cn('flex-1 p-6', className)} {...props} />;
});
CardCurtainRevealBody.displayName = 'CardCurtainRevealBody';

const CardCurtainRevealTitle = React.forwardRef<
  HTMLHeadingElement,
  HTMLMotionProps<'h2'>
>(({ className, ...props }, ref) => {
  const { isMouseIn, revealOffset } = useCardCurtainRevealContext();

  return (
    <motion.h2
      ref={ref}
      className={className}
      animate={isMouseIn ? { y: 0 } : { y: revealOffset }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      {...props}
    />
  );
});
CardCurtainRevealTitle.displayName = 'CardCurtainRevealTitle';

const CardCurtain = React.forwardRef<HTMLDivElement, HTMLMotionProps<'div'>>(
  ({ className, ...props }, ref) => {
    const { isMouseIn } = useCardCurtainRevealContext();

    return (
      <motion.div
        ref={ref}
        className={cn(
          'pointer-events-none absolute inset-0 size-full mix-blend-difference',
          className
        )}
        variants={curtainVariants}
        animate={isMouseIn ? 'visible' : 'hidden'}
        {...props}
      />
    );
  }
);
CardCurtain.displayName = 'CardCurtain';

const CardCurtainRevealDescription = React.forwardRef<
  HTMLDivElement,
  HTMLMotionProps<'div'>
>(({ className, ...props }, ref) => {
  const { isMouseIn, registerRevealNode } = useCardCurtainRevealContext();

  return (
    <motion.div
      ref={(node) => {
        registerRevealNode(node);
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
      }}
      className={className}
      variants={curtainVariants}
      animate={isMouseIn ? 'visible' : 'hidden'}
      {...props}
    />
  );
});
CardCurtainRevealDescription.displayName = 'CardCurtainRevealDescription';

export {
  CardCurtainReveal,
  CardCurtainRevealBody,
  CardCurtainRevealFooter,
  CardCurtainRevealDescription,
  CardCurtainRevealTitle,
  CardCurtain,
};
