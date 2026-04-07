'use client';

import { useEffect, useState } from 'react';

export default function Counter({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  const [displayValue, setDisplayValue] = useState(0);

  const match = value.match(/^([\d.]+)(.*)$/);
  const target = match ? parseFloat(match[1]) : 0;
  const suffix = match ? match[2] : value;
  const isFloat = match && match[1].includes('.');

  useEffect(() => {
    let startTime: number;
    const duration = 2000;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);

      const easeProgress = 1 - Math.pow(1 - progress, 4);

      setDisplayValue(target * easeProgress);

      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [target]);

  return (
    <div className={className}>
      {isFloat ? displayValue.toFixed(1) : Math.floor(displayValue)}
      {suffix}
    </div>
  );
}
