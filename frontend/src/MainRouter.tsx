import { Routes, Route, Navigate } from 'react-router-dom';

import StudentLayout from './layouts/StudentLayout';
import InstructorLayout from './layouts/InstructorLayout';
import InstitutionLayout from './layouts/InstitutionLayout';

import StudentDashboard from './pages/student/Dashboard';
import InstructorDashboard from './pages/instructor/Dashboard';
import InstitutionDashboard from './pages/institution/Dashboard';

/*
import StudentCourses from './pages/student/Courses';     // separate courses?     
import InstructorCourses from './pages/student/Courses';
import InstitutionCourses from './pages/student/Courses';  
*/

import StudentCourses from './pages/student/MyCourses';
import InstructorCourses from './pages/instructor/MyCourses';

// Instructor pages
import PostGrades from './pages/instructor/PostGrades';
import ReviewRequests from './pages/instructor/ReviewRequests';

// Institution pages
import Credits from './pages/institution/Credits';
import UserManagement from './pages/institution/UserManagement';

// Common pages
import CourseStatistics from './pages/CourseStatistics';
import Settings from './pages/Settings';

interface MainRouterProps {
  role: string;
}

const MainRouter = ({ role }: MainRouterProps) => {
  switch (role) {
    case 'student':
      return (
        <Routes>
          <Route element={<StudentLayout />}>
            <Route path="/dashboard" element={<StudentDashboard />} />
            <Route path="/my-courses" element={<StudentCourses />} />
            <Route path="/course-statistics" element={<CourseStatistics />} />
            <Route path="/settings" element={<Settings />} />
            {/* Redirect root or unknown paths to dashboard */}
            <Route path="/" element={<Navigate to="/course-statistics" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      );

    case 'instructor':
      return (
        <Routes>
          <Route element={<InstructorLayout />}>
            <Route path="/dashboard" element={<InstructorDashboard />} />
            <Route path="/my-courses" element={<InstructorCourses />} />
            <Route path="/post-grades" element={<PostGrades />} />
            <Route path="/review-requests" element={<ReviewRequests />} />
            <Route path="/course-statistics" element={<CourseStatistics />} />
            <Route path="/settings" element={<Settings />} />
            {/* Redirect root or unknown paths to dashboard */}
            <Route path="/" element={<Navigate to="/course-statistics" replace />} />
            <Route path="*" element={<Navigate to="/course-statistics" replace />} />
          </Route>
        </Routes>
      );

    case 'institution':
      return (
        <Routes>
          <Route element={<InstitutionLayout />}>
            <Route path="/dashboard" element={<InstitutionDashboard />} />
            <Route path="/course-statistics" element={<CourseStatistics />} />
            <Route path="/credits" element={<Credits />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/user-management" element={<UserManagement />} />
            {/* Redirect root or unknown paths to dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      );

    default:
      return <Navigate to="/login" replace />;
  }
};
export default MainRouter;