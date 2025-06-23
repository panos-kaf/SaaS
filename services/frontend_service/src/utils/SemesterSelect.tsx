import React from "react";

interface SemesterSelectProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  name?: string;
  id?: string;
  required?: boolean;
}

const SemesterSelect: React.FC<SemesterSelectProps> = ({
  value,
  onChange,
  name = "semester",
  id = "semester",
  required = false,
}) => {
  return (
    <select
      name={name}
      id={id}
      value={value}
      onChange={onChange}
      required={required}
      className="register-course-dropdown"
    >
      <option value="">Select semester</option>
      {[...Array(10)].map((_, i) => (
        <option key={i + 1} value={i + 1}>
          {i + 1}
        </option>
      ))}
    </select>
  );
};

export default SemesterSelect;