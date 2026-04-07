'use client';

import { useEffect, useState } from 'react';

export default function Typewriter({ words }: { words: string[] }) {
  const [text, setText] = useState('');
  const [wordIndex, setWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(150);

  useEffect(() => {
    const currentWord = words[wordIndex % words.length];

    const type = () => {
      setText(current =>
        isDeleting
          ? currentWord.substring(0, current.length - 1)
          : currentWord.substring(0, current.length + 1)
      );

      setTypingSpeed(isDeleting ? 50 : 150);

      if (!isDeleting && text === currentWord) {
        setTimeout(() => setIsDeleting(true), 2000);
      } else if (isDeleting && text === '') {
        setIsDeleting(false);
        setWordIndex(prev => prev + 1);
      }
    };

    const timer = setTimeout(type, typingSpeed);
    return () => clearTimeout(timer);
  }, [text, isDeleting, wordIndex, words, typingSpeed]);

  return (
    <span className="inline-block min-h-[1.5em]">
      {text}
      <span className="animate-blink ml-1">|</span>
    </span>
  );
}
