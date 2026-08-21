import { useEffect, useState } from 'react';

const TestTimeout = () => {
  const [text, setText] = useState<string>('Initial');

  useEffect(() => {
    const timer = setTimeout(() => {
      setText('Updated after 1 second');
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return <div>{text}</div>;
};

export default TestTimeout;