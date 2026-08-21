import { useEffect, useState } from 'react';

const TestApi = () => {
  const [result, setResult] = useState<string>('Not tested');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testApi = async () => {
      try {
        setResult('Testing...');
        const response = await fetch('/api/health');
        const text = await response.text();
        setResult(`Success: ${response.status} - ${text}`);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(`Error: ${message}`);
        setResult('Failed');
      }
    };

    testApi();
  }, []);

  if (error) return <div>Error: {error}</div>;
  return <div>{result}</div>;
};

export default TestApi;