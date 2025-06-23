import React, { useEffect, useState } from 'react';
import { config } from '../../config';
import { useMessage } from '../../components/Messages';
import '../../global.css';

interface Course {
  course_name: string;
  course_code: string;
  department: string;
  semester: number;
  academic_year: string;
  finalized: boolean;
  submission_id: number;
}

const MyCourses: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const { showMessage } = useMessage();

  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`${config.apiUrl}/post-grades/get-courses`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch courses');
      }

      setCourses(data.courses || []);
    } catch (error: any) {
      console.error('Error fetching courses:', error);
      showMessage({ type: 'cancel', text: error.message || 'Error occurred' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleFinalize = async (submission_id: number) => {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`${config.apiUrl}/post-grades/finalize/${submission_id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to finalize submission');
      }

      showMessage({ type: 'success', text: 'Course finalized successfully' });
      fetchCourses(); // Refresh course list
    } catch (error: any) {
      console.error('Error finalizing submission:', error);
      showMessage({ type: 'cancel', text: error.message || 'Error finalizing submission' });
    }
  };

  if (loading) return <p className="loading-text">Loading courses...</p>;

  return (
    <div className="page-container">
      <h2 className="page-title">My Courses</h2>

      {courses.length === 0 ? (
        <p className="empty-message">No courses found.</p>
      ) : (
        <table className="table">
          <thead>
            <tr className="table-header">
              <th>Course Name</th>
              <th>Course Code</th>
              <th>Department</th>
              <th>Semester</th>
              <th>Academic Year</th>
              <th>Finalized</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((course, index) => (
              <tr key={index} className="table-row">
                <td>{course.course_name}</td>
                <td>{course.course_code}</td>
                <td>{course.department}</td>
                <td>{course.semester}</td>
                <td>{course.academic_year}</td>
                <td className="text-center">{course.finalized ? '✔️' : '❌'}</td>
                <td className="text-center">
                  {!course.finalized && (
                    <button
                      className="finalize-button"
                      onClick={() => handleFinalize(course.submission_id)}
                    >
                      Finalize
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default MyCourses;