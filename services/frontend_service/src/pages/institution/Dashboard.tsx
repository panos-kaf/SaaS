// src/pages/InstitutionDashboard.tsx
import React, { useState, useEffect } from "react";
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

const InstitutionDashboard: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [course, setCourse] = useState(initialCourse);
  const [students] = useState<string[]>([]);
  const [instructors, setInstructors] = useState<string[]>([]);

  const navigate = useNavigate();
  const { showMessage } = useMessage();

  const [studentsExpanded, setStudentsExpanded] = useState(false);
  const [instructorsExpanded, setInstructorsExpanded] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const [instructorSearch, setInstructorSearch] = useState("");

  useEffect(() => {
    const fetchInstructors = async () => {
      try {
        const response = await fetch(`${config.apiUrl}/institution/instructors`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
        });
        const result = await response.json();
        if (response.ok && result.success) {
          const names = result.data.map((inst: any) => `${inst.first_name} ${inst.last_name}`);
          setInstructors(names);
        } else {
          showMessage({ type: "cancel", text: "Failed to fetch instructors." });
        }
      } catch (err) {
        console.error("Error fetching instructors:", err);
        showMessage({ type: "cancel", text: "Could not load instructors." });
      }
    };
    fetchInstructors();
  }, [showMessage]);

  const filteredStudents = students.filter((s) =>
    s.toLowerCase().includes(studentSearch.toLowerCase())
  );
  const filteredInstructors = instructors.filter((i) =>
    i.toLowerCase().includes(instructorSearch.toLowerCase())
  );

  const handleOpenModal = () => {
    setCourse(initialCourse);
    setShowModal(true);
  };

  const handleCloseModal = () => setShowModal(false);

  const handleRegisterCourse = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !course.course_code ||
      !course.course_name ||
      !course.department ||
      !course.semester ||
      !course.academic_year ||
      !course.professor_id
    ) {
      showMessage({ type: "cancel", text: "Please fill in all fields." });
      return;
    }

    try {
      const response = await fetch(`${config.apiUrl}/institution/register-courses/${6}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ courses: [course] }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Signup failed");
      }

      showMessage({ type: "success", text: "Course registered successfully!" });
      setShowModal(false);
    } catch (error: any) {
      showMessage({ type: "error", text: error.message || "Course registration failed" });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCourse({ ...course, [e.target.name]: e.target.value });
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

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-window">
            <h3 className="modal-title">Register a New Course</h3>
            <form className="modal-form" onSubmit={handleRegisterCourse}>
              {Object.entries(initialCourse).map(([field, _]) => (
                <label key={field} className="modal-label">
                  {field.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                  <input
                    className="modal-input"
                    name={field}
                    value={(course as any)[field]}
                    onChange={handleChange}
                    required
                  />
                </label>
              ))}
              <div className="modal-actions">
                <button type="button" className="modal-cancel" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="modal-submit">
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
          >
            Purchase Credits
          </button>
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
