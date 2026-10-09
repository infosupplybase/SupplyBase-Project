import { useCallback, useEffect, useRef, useState } from 'react';

export default function useChatScroll(itemCount, conversationId) {
  const listRef = useRef(null);
  const [showNew, setShowNew] = useState(false);

  const isNearBottom = useCallback(() => {
    const el = listRef.current;

    if (!el) return true;

    return (
      el.scrollHeight - el.scrollTop - el.clientHeight < 80
    );
  }, []);

  const scrollToBottom = useCallback((behavior = 'auto') => {
    const el = listRef.current;

    if (!el) return;

    el.scrollTo({
      top: el.scrollHeight,
      behavior,
    });

    setShowNew(false);
  }, []);

  const onScroll = useCallback(() => {
    setShowNew(!isNearBottom());
  }, [isNearBottom]);

  useEffect(() => {
    setShowNew(false);

    const timer = setTimeout(() => {
      scrollToBottom('auto');
    }, 50);

    return () => clearTimeout(timer);
  }, [conversationId, scrollToBottom]);

  useEffect(() => {
    const el = listRef.current;

    if (!el) return;

    if (isNearBottom()) {
      scrollToBottom('smooth');
    } else {
      setShowNew(true);
    }
  }, [itemCount, isNearBottom, scrollToBottom]);

  return {
    listRef,
    onScroll,
    showNew,
    scrollToBottom,
  };
}