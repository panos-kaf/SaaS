// src/pages/MyCourses.tsx
import React, { useEffect, useState } from 'react';
import { config } from '../../config';
import { useMessage } from '../../components/Messages';

interface Course {
  course_name: string;
  course_code: string;
  department: string;
  semester: number;
  academic_year: string;
  finalized: boolean;
}

const MyCourses: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const { showMessage } = useMessage();

  useEffect(() => {
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

    fetchCourses();
  }, []);

  if (loading) return <p>Loading courses...</p>;

  return (
    <div style={{ padding: '1rem' }}>
      <h2>My Courses</h2>

      {courses.length === 0 ? (
        <p>No courses found.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ccc' }}>
              <th>Όνομα Μαθήματος</th>
              <th>Course Code</th>
              <th>Department</th>
              <th>Semester</th>
              <th>Academic Year</th>
              <th>Finalized</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((course, index) => (
              <tr key={index} style={{ borderBottom: '1px solid #ddd', textAlign: 'center' }}>
                <td>{course.course_name}</td>
                <td>{course.course_code}</td>
                <td>{course.department}</td>
                <td>{course.semester}</td>
                <td>{course.academic_year}</td>
                <td>{course.finalized ? '✔️' : '❌'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default MyCourses;
