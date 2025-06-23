import React from "react";

interface AcademicYearSelectProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  name?: string;
  id?: string;
  required?: boolean;
}

const AcademicYearSelect: React.FC<AcademicYearSelectProps> = ({
  value,
  onChange,
  name = "academic_year",
  id = "academic_year",
  required = false,
}) => {
  const startYear = 2020;
  const endYear = 2030;
  const academicYears = Array.from({ length: endYear - startYear }, (_, i) => {
    const year = startYear + i;
    return `${year}-${year + 1}`;
  });

  return (
    <select
      name={name}
      id={id}
      value={value}
      onChange={onChange}
      required={required}
      className="register-course-dropdown"
    >
      <option value="">Select academic year</option>
      {academicYears.map((year) => (
        <option key={year} value={year}>
          {year}
        </option>
      ))}
    </select>
  );
};

export default AcademicYearSelect;