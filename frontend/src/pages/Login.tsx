import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMessage } from '../components/Messages';
import { useLocation } from 'react-router-dom';
import '../global.css';
import { config } from '../config';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {

  const { showMessage } = useMessage();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    const response = await fetch(`${config.apiUrl}/users/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: username, // username or email
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    // Save token and role to localStorage
    localStorage.setItem('token', data.token);
    localStorage.setItem('role', data.user.role);

    onLogin(); // Notify app of login

    // Redirect based on role
    switch (data.user.role) {
      case 'student':
        navigate('/course-statistics');
        break;
      case 'instructor':
        navigate('/course-statistics');
        break;
      case 'institution':
        navigate('/dashboard');
        break;
      default:
        showMessage({ type: 'cancel', text: 'Unknown role' });
    }
  } catch (error: any) {
    showMessage({ type: 'cancel', text: error.message || 'Login failed' });
  }
};

  const handleGoogleLogin = () => {
    window.location.href = `${config.apiUrl}/users/auth/google`;
  };


const [showSignup, setShowSignup] = useState(false);
const [signupEmail, setSignupEmail] = useState('');
const [signupUsername, setSignupUsername] = useState('');
const [signupPassword, setSignupPassword] = useState('');
const [signupRole, setSignupRole] = useState('student');

const location = useLocation();

useEffect(() => {
  const params = new URLSearchParams(location.search);
  const error = params.get('error');

  if (error === 'user_not_found') {
    showMessage({ type: 'cancel', text: 'Ο Google λογαριασμός δεν είναι εγγεγραμμένος. Κάνε εγγραφή πρώτα!' });

    // Καθάρισε το query param από το URL
    window.history.replaceState({}, document.title, '/login');
  }
}, [location.search]);


const handleSignup = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    const response = await fetch(`${config.apiUrl}/users/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: signupEmail,
        username: signupUsername,
        password: signupPassword,
        role: signupRole,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Signup failed');
    }

    showMessage({ type: 'success', text: 'Account created! You can log in now.' });
    setShowSignup(false);
  } catch (error: any) {
    showMessage({ type: 'cancel', text: error.message || 'Signup failed' });
  }
};

return (
  <>
    {showSignup && (
      <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm">
          <h3 className="text-lg font-semibold mb-4">Sign Up</h3>
          <form onSubmit={handleSignup} className="space-y-3">
            <input
              type="email"
              placeholder="Email"
              value={signupEmail}
              onChange={(e) => setSignupEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded"
            />
            <input
              type="text"
              placeholder="Username"
              value={signupUsername}
              onChange={(e) => setSignupUsername(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded"
            />
            <input
              type="password"
              placeholder="Password"
              value={signupPassword}
              onChange={(e) => setSignupPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded"
            />
            <select
              value={signupRole}
              onChange={(e) => setSignupRole(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="student">Student</option>
              <option value="instructor">Instructor</option>
            </select>
            <div className="flex justify-between">
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                Register
              </button>
              <button type="button" onClick={() => setShowSignup(false)} className="text-gray-600 hover:underline">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    )}

    <div className="login-container">
      <form onSubmit={handleSubmit} className="form-container">
        <h2 className="form-title">Sign in to ClearSky</h2>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          placeholder="Email or Username"
          className="form-input"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="Password"
          className="form-input"
        />
        <button type="submit" className="form-button">Log in</button>

        <div className="text-center text-sm text-gray-500">or</div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full border border-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-100 transition flex items-center justify-center space-x-2"
        >
          <img
            src="google-color.svg"
            alt="Google icon"
            className="w-5 h-5"
          />
          <span>Log in with Google</span>
        </button>

        <div className="text-center mt-4">
          <button
            type="button"
            onClick={() => setShowSignup(true)}
            className="text-sm text-blue-600 hover:underline"
          >
            Not registered? Sign up
          </button>
        </div>
      </form>
    </div>
  </>
);
}
export default Login;