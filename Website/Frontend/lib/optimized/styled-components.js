// Optimized styled-components replacement
import React from 'react';

const styled = new Proxy(() => {}, {
  get: (target, prop) => () => React.forwardRef((props, ref) => 
    React.createElement(prop, { ref, className: props.className, ...props })
  )
});

export const ThemeProvider = ({ children }) => children;
export const createGlobalStyle = () => () => null;
export const keyframes = () => '';
export default styled;
