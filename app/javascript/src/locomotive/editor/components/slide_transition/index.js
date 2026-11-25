import React, { useRef } from 'react';
import { CSSTransition } from 'react-transition-group';

// CSSTransition on a wrapper we own, so it does not need findDOMNode (removed in React 19).
// TransitionGroup passes its props (in, onExited...) through to the CSSTransition.
const SlideTransition = ({ children, ...props }) => {
  const nodeRef = useRef(null);

  return (
    <CSSTransition nodeRef={nodeRef} {...props}>
      <div ref={nodeRef} className="editor-transition">{children}</div>
    </CSSTransition>
  );
}

export default SlideTransition;
