import { useEffect } from 'react';

const OAuthSuccess = () => {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (token) {
      localStorage.setItem('token', token);
      const payload = JSON.parse(atob(token.split('.')[1]));
      const role = payload.role;
      localStorage.setItem('role', role);

      switch (role) {
        case 'student':
        case 'instructor':
          window.location.href = '/course-statistics';
          break;
        case 'institution':
          window.location.href = '/dashboard';
          break;
        default:
          window.location.href = '/';
      }
    } else {
      window.location.href = '/login';
    }
  }, []);

  return (
    <div className="text-white text-center mt-10">
      Logging you in with Google...
    </div>
  );
};

export default OAuthSuccess;
