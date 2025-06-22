import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import MainRouter from './MainRouter';
import { LoadingSpinner } from './components/LoadingSpinner';
import OAuthSuccess from './OAuthSuccess';
//import { useNavigate } from 'react-router-dom';


function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  //const navigate = useNavigate();

  useEffect(() => {
    const handleStorageChange = () => {
      const token = localStorage.getItem('token');
      const storedRole = localStorage.getItem('role');
      console.log('Token from localStorage:', token);
      console.log('Role from localStorage:', storedRole);
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
      <Route path="/oauth-success" element={<OAuthSuccess />} />
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