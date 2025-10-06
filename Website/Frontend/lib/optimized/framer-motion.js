import React from 'react';
const createMotionComponent = (element) => React.forwardRef((props, ref) => {
  const { initial, animate, exit, transition, whileHover, whileTap, layout, ...rest } = props;
  return React.createElement(element, { ref, ...rest });
});
export const motion = new Proxy({}, {
  get: (target, prop) => target[prop] || (target[prop] = createMotionComponent(prop))
});
export const AnimatePresence = ({ children }) => React.createElement(React.Fragment, null, children);
export const useAnimation = () => ({ start: () => {}, stop: () => {}, set: () => {} });
export default motion;