/**
 * Tooltip Component
 * Hover tooltip for additional information
 */

import React, { useState } from 'react';
import { tooltipStyles } from './styles';

export function Tooltip({ text, children }) {
  const [show, setShow] = useState(false);

  return (
    <span
      style={tooltipStyles.wrapper}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <span style={tooltipStyles.tooltip}>
          {text}
          <span style={tooltipStyles.arrow} />
        </span>
      )}
    </span>
  );
}
