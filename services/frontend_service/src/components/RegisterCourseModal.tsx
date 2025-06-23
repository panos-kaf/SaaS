import React, { useState } from "react";
import AcademicYearSelect from "../utils/AcademicYearSelect";
import SemesterSelect from "../utils/SemesterSelect";

interface NewCourseModalProps {
  onSubmit: (course: {
    course_code: string;
    course_name: string;
    department: string;
    semester: string;
    academic_year: string;
    professor_id: string;
  }) => void;
  onCancel: () => void;
}

const NewCourseModal: React.FC<NewCourseModalProps> = ({ onSubmit, onCancel }) => {
  const [form, setForm] = useState({
    course_code: "",
    course_name: "",
    department: "",
    semester: "",
    academic_year: "",
    professor_id: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-window">
        <h3 className="modal-title">Register a New Course</h3>
        <form className="modal-form" onSubmit={handleSubmit}>
          <label className="modal-label">
            Course Code
            <input
              className="modal-input"
              name="course_code"
              value={form.course_code}
              onChange={handleChange}
              required
            />
          </label>
          <label className="modal-label">
            Course Name
            <input
              className="modal-input"
              name="course_name"
              value={form.course_name}
              onChange={handleChange}
              required
            />
          </label>
          <label className="modal-label">
            Department
            <input
              className="modal-input"
              name="department"
              value={form.department}
              onChange={handleChange}
              required
            />
            </label>
            <label className="modal-label">
                Professor ID
                <input
                className="modal-input"
                name="professor_id"
                value={form.professor_id}
                onChange={handleChange}
                required
                />
          <label className="modal-label">
            Semester
            <SemesterSelect
              value={form.semester}
              onChange={handleChange}
              required
            />
          </label>
          <label className="modal-label">
            Academic Year
            <AcademicYearSelect
              value={form.academic_year}
              onChange={handleChange}
              required
            />
          </label>
          </label>
          <div className="modal-actions">
            <button type="button" className="modal-cancel" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="modal-submit">
              Register
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewCourseModal;