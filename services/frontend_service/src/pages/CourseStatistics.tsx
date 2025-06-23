import { useState, useEffect } from "react";

import { config } from "../config";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Helper: counts of grades
const histogram = (grades: number[]) => {
  const counts: Record<number, number> = {};
  for (const g of grades) counts[g] = (counts[g] || 0) + 1;
  return Object.entries(counts)
    .map(([grade, count]) => ({ grade: +grade, count }))
    .sort((a, b) => a.grade - b.grade);
};

interface GradeRow {
  student_id: string;
  student_name: string;
  grade: number;
}

interface GradeSheet {
  name: string;
  columns: string[];
  rows: GradeRow[];
}

interface CoursePeriodEntry {
  courseName: string;
  courseCode: string;
  period: string;
  semester: string;
}

export default function CourseStatistics() {

    const [allCourses, setAllCourses] = useState<CoursePeriodEntry[]>([]); 
    const [loadingCourses, setLoadingCourses] = useState(true);

    const [searchTerm, setSearchTerm] = useState("");
    const [sortField, setSortField] = useState<keyof CoursePeriodEntry>("courseCode");
    const [sortAsc, setSortAsc] = useState(true);
    const [selectedEntry, setSelectedEntry] = useState<CoursePeriodEntry | null>(null);

    const [gradeSheets] = useState<GradeSheet[]>([]);

    useEffect(() => {
      fetch(`${config.apiUrl}/student-courses/courses`,
        {
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("token")}`
          }
        })
        .then((res) => res.json())
        .then((data) => {
          const mappedCourses = data.courses.map((c: any) => ({
            courseName: c.course_name,
            courseCode: c.course_code,
            period: c.academic_year,
            semester: c.semester,
          }));
          setAllCourses(mappedCourses);
        })
        .catch((err) => console.error("Failed to fetch courses:", err))
        .finally(() => setLoadingCourses(false));
    }, []);

const filteredAndSorted = allCourses
  .filter((entry) => {
    const search = searchTerm.toLowerCase();
    return (
      entry.courseName.toLowerCase().includes(search) ||
      entry.courseCode.toLowerCase().includes(search) ||
      entry.semester.toLowerCase().includes(search) ||
      entry.period.toString().toLowerCase().includes(search)
    );
  })
  .sort((a, b) => {
    const valA = a?.[sortField] ?? "";
    const valB = b?.[sortField] ?? "";
    return sortAsc
      ? valA.localeCompare(valB)
      : valB.localeCompare(valA);
  });
    const [statistics, setStatistics] = useState<{
    count: number;
    total: number[];
    partials: Record<string, number[]>;
    } | null>(null);

    useEffect(() => {
        if (!selectedEntry) return;

        // Replace this with a real fetch later
        const mockResponse = {
            count: 100,
            total: Array.from({ length: 100 }, () => Math.floor(Math.random() * 11)), // random grades
            partials: {
            "Question 1": Array.from({ length: 100 }, () => Math.floor(Math.random() * 6)),
            "Question 2": Array.from({ length: 100 }, () => Math.floor(Math.random() * 6)),
            "Question 3": Array.from({ length: 100 }, () => Math.floor(Math.random() * 6)),
            "Question 4": Array.from({ length: 100 }, () => Math.floor(Math.random() * 6)),
            "Question 5": Array.from({ length: 100 }, () => Math.floor(Math.random() * 6)),
            },
        };

        // Simulate async fetch
        setTimeout(() => {
            setStatistics(mockResponse);
        }, 500);
    }, [selectedEntry]);

    return (
    <div className="statistics-container">
    <h1 className="statistics-title">Course Grade Statistics</h1>

    <div className="mt-4">
        <label className="statistics-label">Search Courses</label>
        <input
        type="text"
        className="statistics-search"
        placeholder="Type course code or period"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        />

        <div className="statistics-table-container statistics-table-scrollable mt-2">
        <table className="statistics-table w-full text-sm">
            <thead className="statistics-thead">
            <tr>
                {(["courseName", "courseCode", "period", "semester"] as const).map((field) => (
                <th
                    key={field}
                    className="statistics-th statistics-header-clickable"
                    onClick={() => {
                    if (sortField === field) setSortAsc(!sortAsc);
                    else {
                        setSortField(field);
                        setSortAsc(true);
                    }
                    }}
                >
                    {{
                    courseName: "CourseName",
                    courseCode: "CourseCode",
                    period: "Exam Period",
                    semester: "Semester",
                    }[field]}
                </th>
                ))}
            </tr>
            </thead>
            <tbody>
            {filteredAndSorted.map((entry, idx) => {
                const selected =
                selectedEntry?.courseCode === entry.courseCode && selectedEntry?.period === entry.period;
                return (
                <tr
                    key={idx}
                    className={`statistics-tr statistics-row-hover ${
                    selected ? "statistics-row-selected" : ""
                    }`}
                    onClick={() => setSelectedEntry(entry)}
                >
                    <td className="statistics-td">{entry.courseName}</td>
                    <td className="statistics-td">{entry.courseCode}</td>
                    <td className="statistics-td">{entry.period}</td>
                    <td className="statistics-td">{entry.semester}</td>
                </tr>
                );
            })}
            </tbody>
        </table>
        </div>
    </div>

    {selectedEntry && gradeSheets.length > 0 && (
        <div className="statistics-spreadsheet-container">
        {gradeSheets.map((sheet, i) => (
            <div key={i} className="statistics-spreadsheet">
            <h2 className="statistics-subtitle">{sheet.name}</h2>
            <div className="overflow-auto">
                <table className="statistics-table w-full text-sm">
                <thead className="statistics-thead">
                    <tr>
                    {sheet.columns.map((col, j) => (
                        <th key={j} className="statistics-th">
                        {col}
                        </th>
                    ))}
                    </tr>
                </thead>
                <tbody>
                    {sheet.rows.map((row, ri) => (
                    <tr key={ri} className="statistics-tr">
                        {sheet.columns.map((col, ci) => (
                        <td key={ci} className="statistics-td">
                            {row[col as keyof GradeRow]}
                        </td>
                        ))}
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
            </div>
        ))}
        </div>
    )}

    {statistics && (
    <div className="mt-6 grid grid-cols-[5fr_4fr] gap-4">
    {/* Left: Total Grades Graph */}
    <div className="statistics-chart-large">
      <h2 className="statistics-subtitle">Total Grade Distribution</h2>
      <ResponsiveContainer width="100%" height={360}>
        <BarChart data={histogram(statistics.total)}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="grade" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" fill="#3b82f6" />
        </BarChart>
      </ResponsiveContainer>
    </div>

    {/* Right: Partial Grades Graphs (max 4 visible, scrollable) */}
    <div className="statistics-partial-chart-container">
  <div className="statistics-partial-chart-grid">
    {Object.entries(statistics.partials).map(([question, grades]) => (
      <div key={question} className="statistics-partial-chart-card">
        <h2 className="statistics-small-subtitle text-sm text-center">{question}</h2>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={histogram(grades)}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="grade" fontSize={10} />
            <YAxis fontSize={10} />
            <Tooltip />
            <Bar dataKey="count" fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    ))}
  </div>
</div>
  </div>
)}
</div>
);
}