import React, { useEffect, useRef } from 'react';

// A target with a panel below it while open; a mousedown outside closes it.
const Dropdown = ({ open, onClose, target, children }) => {
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const closeOutside = event => { if (!ref.current.contains(event.target)) onClose(); };
    document.addEventListener('mousedown', closeOutside);
    return () => document.removeEventListener('mousedown', closeOutside);
  }, [open, onClose]);

  return (
    <div className="dropdown" ref={ref}>
      {target}
      {open && <div className="dropdown-panel">{children}</div>}
    </div>
  );
}

export default Dropdown;
