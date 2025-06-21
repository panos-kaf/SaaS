import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import MainRouter from './MainRouter';
import { LoadingSpinner } from './components/LoadingSpinner'; // Assuming you have a Spinner component for loading state

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleStorageChange = () => {
      const token = localStorage.getItem('token');
      const storedRole = localStorage.getItem('role');
      setIsAuthenticated(!!token);
      setRole(storedRole);
      setLoading(false);
    };

    // Run once on mount
    handleStorageChange();

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <Routes>
      <Route
        path="/login"
        element={
          <Login
            onLogin={() => {
              const token = localStorage.getItem('token');
              const storedRole = localStorage.getItem('role');
              setIsAuthenticated(!!token);
              setRole(storedRole);
            }}
          />
        }
      />
      <Route
        path="/*"
        element={
          isAuthenticated && role
            ? <MainRouter role={role} />
            : <Navigate to="/login" replace />
        }
      />
    </Routes>
  );
}

export default App;