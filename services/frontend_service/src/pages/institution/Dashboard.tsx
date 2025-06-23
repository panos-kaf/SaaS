// src/pages/InstitutionDashboard.tsx
import React, { useState, useEffect } from "react";
import { useMessage } from "../../components/Messages";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronUp, Search } from "lucide-react";
import { config } from "../../config";
import NewCourseModal from "../../components/RegisterCourseModal";

const initialCourse = {
  course_code: "",
  course_name: "",
  department: "",
  semester: "",
  professor_id: "",
  academic_year: "",
};

const InstitutionDashboard: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [, setCourse] = useState(initialCourse);
  const [students] = useState<string[]>([]);
  const [instructors, setInstructors] = useState<string[]>([]);

  const navigate = useNavigate();
  const { showMessage } = useMessage();

  const [studentsExpanded, setStudentsExpanded] = useState(false);
  const [instructorsExpanded, setInstructorsExpanded] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const [instructorSearch, setInstructorSearch] = useState("");

  const [isRegistered, setIsRegistered] = useState<boolean | null>(null);

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

  useEffect(() => {
    // Check if institution is registered (e.g. by checking credits)
    const checkRegistration = async () => {
      try {
        const response = await fetch(`${config.apiUrl}/institution/view-creds/1`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          },
        });
        if (response.ok) {
          setIsRegistered(true);
        } else {
          setIsRegistered(false);
        }
      } catch {
        setIsRegistered(false);
      }
    };
    checkRegistration();
  }, []);

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

  const handleRegisterCourse = async (courseData: typeof initialCourse) => {
    if (
      !courseData.course_code ||
      !courseData.course_name ||
      !courseData.department ||
      !courseData.semester ||
      !courseData.academic_year ||
      !courseData.professor_id
    ) {
      showMessage({ type: "cancel", text: "Please fill in all fields." });
      return;
    }

    try {
      const response = await fetch(`${config.apiUrl}/institution/register-courses/${1}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ courses: [courseData] }),
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

  // const handleChange = (
  //   e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  // ) => {
  //     setCourse({ ...course, [e.target.name]: e.target.value });
  //   };

  const [form, setForm] = useState({
    institutionName: "",
    institutionEmail: "",
    contactPerson: "",
    contactEmail: "",
    institutionAddress: "",
    contactPhone: "",
  });

  const [submitting, setSubmitting] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate required fields
    if (
      !form.institutionName.trim() ||
      !form.institutionEmail.trim() ||
      !form.contactPerson.trim() ||
      !form.contactEmail.trim()
    ) {
      showMessage({ type: "cancel", text: "Please fill in all required fields." });
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch(`${config.apiUrl}/institution/add-inst`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token") || ""}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          institution_name: form.institutionName,
          institution_email: form.institutionEmail,
          institution_address: form.institutionAddress,
          contact_person: form.contactPerson,
          contact_email: form.contactEmail,
          contact_phone: form.contactPhone,
        }),
      });
      if (response.ok) {
        showMessage({ type: "success", text: "Institution registered successfully!" });
        setIsRegistered(true);
      } else {
        showMessage({ type: "cancel", text: "Failed to register institution." });
      }
    } catch {
      showMessage({ type: "error", text: "Error registering institution." });
    }
    setSubmitting(false);
  };

  const handleChangeForm = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  if (isRegistered === null) {
    return <div>Loading...</div>;
  }

  if (!isRegistered) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <form
          className="bg-white dark:bg-gray-900 p-8 rounded shadow-md w-full max-w-md space-y-4"
          onSubmit={handleRegister}
        >
          <h2 className="text-xl font-bold mb-2">Register Institution</h2>
          <div>
            <label className="block font-medium mb-1">
              Institution Name <span className="text-red-500">*</span>
            </label>
            <input
              className="w-full px-3 py-2 text-neutral-800 border rounded"
              name="institutionName"
              value={form.institutionName}
              onChange={handleChangeForm}
              required
            />
          </div>
          <div>
            <label className="block font-medium mb-1">
              Institution Email <span className="text-red-500">*</span>
            </label>
            <input
              className="w-full px-3 py-2 text-neutral-800 border rounded"
              name="institutionEmail"
              type="email"
              value={form.institutionEmail}
              onChange={handleChangeForm}
              required
            />
          </div>
          <div>
            <label className="block font-medium mb-1">
              Contact Person <span className="text-red-500">*</span>
            </label>
            <input
              className="w-full px-3 py-2 text-neutral-800 border rounded"
              name="contactPerson"
              value={form.contactPerson}
              onChange={handleChangeForm}
              required
            />
          </div>
          <div>
            <label className="block font-medium mb-1">
              Contact Email <span className="text-red-500">*</span>
            </label>
            <input
              className="w-full px-3 py-2 text-neutral-800 border rounded"
              name="contactEmail"
              type="email"
              value={form.contactEmail}
              onChange={handleChangeForm}
              required
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Institution Address</label>
            <input
              className="w-full px-3 py-2 text-neutral-800 border rounded"
              name="institutionAddress"
              value={form.institutionAddress}
              onChange={handleChangeForm}
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Contact Phone</label>
            <input
              className="w-full px-3 py-2 text-neutral-800 border rounded"
              name="contactPhone"
              value={form.contactPhone}
              onChange={handleChangeForm}
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded font-semibold mt-2"
            disabled={submitting}
          >
            {submitting ? "Registering..." : "Register Institution"}
          </button>
        </form>
      </div>
    );
  }

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
        <NewCourseModal
          onSubmit={handleRegisterCourse}
          onCancel={handleCloseModal}
        />
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
