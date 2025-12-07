import React, { useCallback, useRef, useState } from 'react';

interface Options {
  shouldPreventDefault?: boolean;
  delay?: number;
}

const useLongPress = (
  onLongPress: (event: React.TouchEvent | React.MouseEvent) => void,
  onClick: (event: React.TouchEvent | React.MouseEvent) => void,
  { shouldPreventDefault = true, delay = 500 }: Options = {}
) => {
  const [longPressTriggered, setLongPressTriggered] = useState(false);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const target = useRef<EventTarget | null>(null);

  const start = useCallback(
    (event: React.TouchEvent | React.MouseEvent) => {
      if (shouldPreventDefault && event.target) {
        target.current = event.target;
      }
      setLongPressTriggered(false);
      timeout.current = setTimeout(() => {
        onLongPress(event);
        setLongPressTriggered(true);
      }, delay);
    },
    [onLongPress, delay, shouldPreventDefault]
  );

  const clear = useCallback(
    (event: React.TouchEvent | React.MouseEvent, shouldTriggerClick = true) => {
      // If the timeout exists, it means long press hasn't fired yet
      if (timeout.current) {
        clearTimeout(timeout.current);
      }
      
      // If long press didn't fire, and we should trigger click (i.e. it was a short tap)
      if (shouldTriggerClick && !longPressTriggered && onClick) {
        onClick(event);
      }

      setLongPressTriggered(false);
      timeout.current = null;
      target.current = null;
    },
    [shouldPreventDefault, onClick, longPressTriggered]
  );

  return {
    onMouseDown: (e: React.MouseEvent) => start(e),
    onTouchStart: (e: React.TouchEvent) => start(e),
    onMouseUp: (e: React.MouseEvent) => clear(e, true), // Mouse up triggers click if short
    onMouseLeave: (e: React.MouseEvent) => clear(e, false), // Leaving cancels everything
    onTouchEnd: (e: React.TouchEvent) => clear(e, false), // Touch end logic handled manually usually, but here we separate LongPress vs Click
  };
};

export default useLongPress;