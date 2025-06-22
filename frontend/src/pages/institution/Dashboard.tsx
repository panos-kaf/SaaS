// src/pages/InstitutionDashboard.tsx
import React, { useState } from "react";
import { useMessage } from "../../components/Messages";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronUp, Search } from "lucide-react";
import { config } from "../../config";

const initialCourse = {
  course_code: "",
  course_name: "",
  department: "",
  semester: "",
  academic_year: "",
  professor_id: "",
};

// Sample mock data
const dummyStudents = [
  "Alice Smith",
  "Bob Johnson",
  "Charlie Lee",
  "Diana Adams",
  "Evan Young",
];

const dummyInstructors = [
  "Prof. Green",
  "Dr. Brown",
  "Prof. White",
  "Dr. Black",
  "Prof. Gray",
];

const InstitutionDashboard: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [course, setCourse] = useState(initialCourse);

  const navigate = useNavigate();
  const { showMessage } = useMessage();

  const [studentsExpanded, setStudentsExpanded] = useState(false);
  const [instructorsExpanded, setInstructorsExpanded] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const [instructorSearch, setInstructorSearch] = useState("");

  const filteredStudents = dummyStudents.filter((s) =>
    s.toLowerCase().includes(studentSearch.toLowerCase())
  );
  const filteredInstructors = dummyInstructors.filter((i) =>
    i.toLowerCase().includes(instructorSearch.toLowerCase())
  );

  const handleOpenModal = () => {
    setCourse(initialCourse);
    setShowModal(true);
  };

  const handleCloseModal = () => setShowModal(false);

  const handleRegisterCourseMock = () => {
    showMessage({
      type: "success",
      text: "Course registered successfully!",
    });
    setShowModal(false);
  };

const handleRegisterCourse = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!course.course_code || !course.course_name || !course.department || !course.semester || !course.academic_year || !course.professor_id) {
    showMessage({ type: 'cancel', text: 'Please fill in all fields.' });
    return;
  }

  try {
    const response = await fetch(`${config.apiUrl}/institution/register-courses/${6}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({courses: [course]}),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Signup failed');
    }

    showMessage({ type: 'success', text: 'Course registered successfully!' });
    setShowModal(false);
  } catch (error: any) {
    showMessage({ type: 'error', text: error.message || 'Course registration failed' });
  }
};

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCourse({ ...course, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Add API call to register the course here
    // Example: await api.post('/api/register_courses/:institution_ID', { courses: [course] })
    setShowModal(false);
  };

  return (
    <main className="dashboard-container">
      <section className="dashboard-panel courses-panel">
        <div className="dashboard-header">
          <h2 className="dashboard-title">Courses</h2>
          <button className="dashboard-button" onClick={handleOpenModal}>
            Register a new Course
          </button>
        </div>
        <div className="dashboard-content">
          <p>Manage and view all courses.</p>
        </div>
      </section>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-window">
            <h3 className="modal-title">Register a New Course</h3>
            <form className="modal-form" onSubmit={handleSubmit}>
              <label className="modal-label">
                Course Code
                <input
                  className="modal-input"
                  name="course_code"
                  value={course.course_code}
                  onChange={handleChange}
                  required
                />
              </label>
              <label className="modal-label">
                Course Name
                <input
                  className="modal-input"
                  name="course_name"
                  value={course.course_name}
                  onChange={handleChange}
                  required
                />
              </label>
              <label className="modal-label">
                Department
                <input
                  className="modal-input"
                  name="department"
                  value={course.department}
                  onChange={handleChange}
                  required
                />
              </label>
              <label className="modal-label">
                Semester
                <input
                  className="modal-input"
                  name="semester"
                  value={course.semester}
                  onChange={handleChange}
                  required
                />
              </label>
              <label className="modal-label">
                Academic Year
                <input
                  className="modal-input"
                  name="academic_year"
                  value={course.academic_year}
                  onChange={handleChange}
                  required
                />
              </label>
              <label className="modal-label">
                Professor ID
                <input
                  className="modal-input"
                  name="professor_id"
                  value={course.professor_id}
                  onChange={handleChange}
                  required
                />
              </label>
              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-cancel"
                  onClick={handleCloseModal}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="modal-submit"
                  onClick={handleRegisterCourse}
                >
                  Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <section className="dashboard-panel credits-panel">
        <div className="dashboard-header">
          <h2 className="dashboard-title">Credits</h2>
          <button
          type="button"
          className="dashboard-button"
          onClick={() => navigate("/credits")}
          >Purchase Credits</button>
        </div>
        <div className="dashboard-content">
          <p>View institution credits and allocation.</p>
        </div>
      </section>

<section className="dashboard-panel instructors-panel">
  <div className="dashboard-header justify-between items-center">
    <div
      className="flex items-center gap-2 cursor-pointer select-none"
      onClick={() => setInstructorsExpanded(!instructorsExpanded)}
      tabIndex={0}
      role="button"
      aria-pressed={instructorsExpanded}
    >
      <h2 className="dashboard-title">Instructors</h2>
      {instructorsExpanded ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
    </div>
  </div>
  <div className="dashboard-content">
    <p>Manage and assign instructors to courses.</p>
    {instructorsExpanded && (
      <div className="expansion-section mt-4">
        <div className="relative mb-3">
          <Search className="absolute left-2.5 top-2.5 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search instructors..."
            value={instructorSearch}
            onChange={(e) => setInstructorSearch(e.target.value)}
            className="modal-input-search w-full"
          />
        </div>
        <ul className="list-disc pl-6 text-gray-700 dark:text-gray-200">
          {filteredInstructors.length ? (
            filteredInstructors.map((instructor) => (
              <li key={instructor}>{instructor}</li>
            ))
          ) : (
            <li className="text-sm text-gray-500 italic">No instructors found</li>
          )}
        </ul>
      </div>
    )}
  </div>
</section>

<section className="dashboard-panel students-panel">
  <div className="dashboard-header justify-between items-center">
    <div
      className="flex items-center gap-2 cursor-pointer select-none"
      onClick={() => setStudentsExpanded(!studentsExpanded)}
      tabIndex={0}
      role="button"
      aria-pressed={studentsExpanded}
    >
      <h2 className="dashboard-title">Students</h2>
      {studentsExpanded ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
    </div>
  </div>
  <div className="dashboard-content">
    <p>View enrolled students and their progress.</p>
    {studentsExpanded && (
      <div className="expansion-section mt-4">
        <div className="relative mb-3">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search students..."
            value={studentSearch}
            onChange={(e) => setStudentSearch(e.target.value)}
            className="modal-input-search w-full"
          />
        </div>
        <ul className="list-disc pl-6 text-gray-700 dark:text-gray-200">
          {filteredStudents.length ? (
            filteredStudents.map((student) => (
              <li key={student}>{student}</li>
            ))
          ) : (
            <li className="text-sm text-gray-500 italic">No students found</li>
          )}
        </ul>
      </div>
    )}
  </div>
</section>

    </main>
  );
};

export default InstitutionDashboard;