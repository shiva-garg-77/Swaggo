/**
 * ANIMATION UTILITIES
 * Comprehensive animation helpers and React hooks
 */

import { useState, useEffect } from 'react';

/**
 * Animate number from start to end
 * @param {number} start
 * @param {number} end
 * @param {number} duration - in ms
 * @param {Function} onUpdate
 * @param {string} easing - 'linear', 'easeIn', 'easeOut', 'easeInOut'
 */
export function animateNumber(start, end, duration, onUpdate, easing = 'easeOut') {
  const startTime = performance.now();
  const change = end - start;
  
  const easingFunctions = {
    linear: t => t,
    easeIn: t => t * t,
    easeOut: t => t * (2 - t),
    easeInOut: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
  };
  
  const ease = easingFunctions[easing] || easingFunctions.easeOut;
  
  function animate(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = ease(progress);
    const current = start + change * easedProgress;
    
    onUpdate(Math.round(current));
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  }
  
  requestAnimationFrame(animate);
}

/**
 * React hook for count-up animation
 * @param {number} end
 * @param {number} duration
 * @param {number} start
 * @returns {number}
 */
export function useCountUp(end, duration = 1000, start = 0) {
  const [count, setCount] = useState(start);
  
  useEffect(() => {
    animateNumber(start, end, duration, setCount);
  }, [end, duration, start]);
  
  return count;
}

/**
 * Animate element with CSS classes
 * @param {HTMLElement} element
 * @param {string} animationClass
 * @param {Function} onComplete
 */
export function animateWithClass(element, animationClass, onComplete) {
  if (!element) return;
  
  element.classList.add(animationClass);
  
  const handleAnimationEnd = () => {
    element.classList.remove(animationClass);
    element.removeEventListener('animationend', handleAnimationEnd);
    if (onComplete) onComplete();
  };
  
  element.addEventListener('animationend', handleAnimationEnd);
}

/**
 * Heart animation for like button
 * @param {HTMLElement} element
 */
export function animateHeart(element) {
  if (!element) return;
  
  element.classList.add('animate-heart');
  
  setTimeout(() => {
    element.classList.remove('animate-heart');
  }, 600);
}

/**
 * Bounce animation
 * @param {HTMLElement} element
 */
export function animateBounce(element) {
  animateWithClass(element, 'animate-bounce-once');
}

/**
 * Shake animation (for errors)
 * @param {HTMLElement} element
 */
export function animateShake(element) {
  animateWithClass(element, 'animate-shake');
}

/**
 * Fade in animation
 * @param {HTMLElement} element
 * @param {number} duration
 */
export function fadeIn(element, duration = 300) {
  if (!element) return;
  
  element.style.opacity = '0';
  element.style.transition = `opacity ${duration}ms ease-in`;
  
  requestAnimationFrame(() => {
    element.style.opacity = '1';
  });
}

/**
 * Fade out animation
 * @param {HTMLElement} element
 * @param {number} duration
 * @param {Function} onComplete
 */
export function fadeOut(element, duration = 300, onComplete) {
  if (!element) return;
  
  element.style.transition = `opacity ${duration}ms ease-out`;
  element.style.opacity = '0';
  
  setTimeout(() => {
    if (onComplete) onComplete();
  }, duration);
}

/**
 * Slide in from direction
 * @param {HTMLElement} element
 * @param {string} direction - 'top', 'right', 'bottom', 'left'
 * @param {number} duration
 */
export function slideIn(element, direction = 'bottom', duration = 300) {
  if (!element) return;
  
  const transforms = {
    top: 'translateY(-100%)',
    right: 'translateX(100%)',
    bottom: 'translateY(100%)',
    left: 'translateX(-100%)'
  };
  
  element.style.transform = transforms[direction];
  element.style.transition = `transform ${duration}ms ease-out`;
  
  requestAnimationFrame(() => {
    element.style.transform = 'translate(0, 0)';
  });
}

/**
 * Scale animation
 * @param {HTMLElement} element
 * @param {number} from
 * @param {number} to
 * @param {number} duration
 */
export function animateScale(element, from = 0, to = 1, duration = 300) {
  if (!element) return;
  
  element.style.transform = `scale(${from})`;
  element.style.transition = `transform ${duration}ms ease-out`;
  
  requestAnimationFrame(() => {
    element.style.transform = `scale(${to})`;
  });
}

/**
 * Stagger animation for list items
 * @param {HTMLElement[]} elements
 * @param {Function} animateFn
 * @param {number} delay - delay between items in ms
 */
export function staggerAnimation(elements, animateFn, delay = 50) {
  elements.forEach((element, index) => {
    setTimeout(() => {
      animateFn(element);
    }, index * delay);
  });
}

/**
 * React hook for intersection observer animation
 * @param {object} options
 * @returns {[ref, boolean]}
 */
export function useInViewAnimation(options = {}) {
  const [ref, setRef] = useState(null);
  const [isInView, setIsInView] = useState(false);
  
  useEffect(() => {
    if (!ref) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.unobserve(ref);
        }
      },
      {
        threshold: 0.1,
        ...options
      }
    );
    
    observer.observe(ref);
    
    return () => observer.disconnect();
  }, [ref, options]);
  
  return [setRef, isInView];
}

/**
 * Parallax scroll effect
 * @param {HTMLElement} element
 * @param {number} speed - 0 to 1 (0.5 = half speed)
 */
export function parallaxScroll(element, speed = 0.5) {
  if (!element) return;
  
  const handleScroll = () => {
    const scrolled = window.pageYOffset;
    const offset = element.offsetTop;
    const distance = scrolled - offset;
    
    element.style.transform = `translateY(${distance * speed}px)`;
  };
  
  window.addEventListener('scroll', handleScroll);
  
  return () => window.removeEventListener('scroll', handleScroll);
}

/**
 * Add CSS animations to globals
 */
export const animationStyles = `
  @keyframes animate-heart {
    0%, 100% { transform: scale(1); }
    15% { transform: scale(1.3); }
    30% { transform: scale(0.9); }
    45% { transform: scale(1.1); }
    60% { transform: scale(1); }
  }
  
  @keyframes animate-bounce-once {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }
  
  @keyframes animate-shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
    20%, 40%, 60%, 80% { transform: translateX(5px); }
  }
  
  .animate-heart {
    animation: animate-heart 0.6s ease-in-out;
  }
  
  .animate-bounce-once {
    animation: animate-bounce-once 0.5s ease-in-out;
  }
  
  .animate-shake {
    animation: animate-shake 0.5s ease-in-out;
  }
`;
