import { NavLink } from 'react-router-dom';
import { Settings } from 'lucide-react';
import useLogout from '../utils/Logout';

const Navbar = () => {

  const handleLogout = useLogout();

  const linkClasses = ({ isActive }: { isActive: boolean }) =>
    `navbar-link ${isActive ? 'navbar-link-active' : ''}`;

  return (
    <nav className="navbar justify-between">
      <div className="flex items-center space-x-4">

        <span className="navbar-title">ClearSky</span>
        <NavLink to="/course-statistics" className={linkClasses}>Course Statistics</NavLink>
        {/*<NavLink to="/dashboard" className={linkClasses}>Dashboard</NavLink>*/}
        <NavLink to="/my-courses" className={linkClasses}>My Courses</NavLink>
        <NavLink to="/post-grades" className={linkClasses}>Post Grades</NavLink>
        <NavLink to="/review-requests" className={linkClasses}>Review Requests</NavLink>

      </div>

      <div className="flex items-center space-x-6">

        <NavLink to="/settings" className="navbar-settings">
          <Settings className="w-5 h-5 hover:text-gray-900 text-gray-600 transition-colors" />
        </NavLink>
        
        <button onClick={handleLogout} className="navbar-logout-button">Logout</button>
      </div>
      
    </nav>
  );
};

export default Navbar;