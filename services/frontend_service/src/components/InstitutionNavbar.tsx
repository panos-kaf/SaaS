import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Coins, Settings } from 'lucide-react';
import useLogout from '../utils/Logout';
import { config } from '../config';

const Navbar = () => {
  const handleLogout = useLogout();
  const [credits, setCredits] = useState<number | null>(null);

  useEffect(() => {
    const fetchCredits = async () => {
      try {
        const response = await fetch(`${config.apiUrl}/institution/view-creds/1`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
          },
        });
        const data = await response.json();
        setCredits(data.credits.available_credits ?? 0);
      } catch (err) {
        setCredits(0);
      }
    };
    fetchCredits();
  }, []);

  const linkClasses = ({ isActive }: { isActive: boolean }) =>
    `navbar-link ${isActive ? 'navbar-link-active' : ''}`;

  return (
    <nav className="navbar justify-between">
      <div className="flex items-center space-x-4">
        <span className="navbar-title">ClearSky</span>
        <NavLink to="/dashboard" className={linkClasses}>Dashboard</NavLink>
        <NavLink to="/user-management" className={linkClasses}>User Management</NavLink>
        <NavLink to="/course-statistics" className={linkClasses}>Course Statistics</NavLink>
      </div>

      <div className="flex items-center space-x-6">
        <NavLink to="/credits" className="navbar-credits">
          <Coins className="coins" />
          <span className="credits-text">
            {credits !== null ? `${credits} credits` : '...'}
          </span>
        </NavLink>
        <NavLink to="/settings" className="navbar-settings">
          <Settings className="w-5 h-5 hover:text-gray-900 text-gray-600 transition-colors" />
        </NavLink>
        <button onClick={handleLogout} className="navbar-logout-button">Logout</button>
      </div>
    </nav>
  );
};

export default Navbar;