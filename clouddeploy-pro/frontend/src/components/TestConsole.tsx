import { useEffect, useState } from 'react';

const TestConsole = () => {
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const originalConsoleLog = console.log;
    console.log = (...args) => {
      setLogs(prev => [...prev, args.join(' ')]);
      originalConsoleLog.apply(console, args);
    };

    console.log('Effect ran');
    setTimeout(() => {
      console.log('Timeout ran');
      setLogs(prev => [...prev, 'Timeout completed']);
    }, 1000);

    return () => {
      console.log = originalConsoleLog;
    };
  }, []);

  return (
    <div>
      <h2>Logs:</h2>
      <ul>
        {logs.map((log, index) => (
          <li key={index}>{log}</li>
        ))}
      </ul>
    </div>
  );
};

export default TestConsole;