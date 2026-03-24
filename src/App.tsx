import { useEffect, useState } from 'react';
import { fetchHealth } from './lib/api';
import './App.css';

function App() {
  const [health, setHealth] = useState<string>('checking…');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchHealth()
      .then((data) => {
        if (!cancelled) {
          setHealth(data.status);
          setError(null);
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Unknown error');
          setHealth('unreachable');
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="app">
      <h1>Pharmacy Inventory</h1>
      <p className="lede">
        React + TypeScript + Vite. API health:{' '}
        <strong className={error ? 'status-error' : 'status-ok'}>
          {error ? error : health}
        </strong>
      </p>
      <p className="hint">
        Start the API (<code>pharmacy-inventory-api</code>) and use the Vite dev proxy, or set{' '}
        <code>VITE_API_URL</code> for production builds.
      </p>
    </main>
  );
}

export default App;
