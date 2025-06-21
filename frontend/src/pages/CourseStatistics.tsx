import { useState, useEffect } from "react";

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
  course: string;
  period: string;
  initialDate: string;
  finalDate: string;
}

export default function CourseStatistics() {

    // Mock data
    const allCourses: CoursePeriodEntry[] = [
    {
        course: "CS101",
        period: "Midterm 2024",
        initialDate: "2024-03-01",
        finalDate: "2024-04-01",
    },
    {
        course: "CS101",
        period: "Final 2023",
        initialDate: "2023-05-01",
        finalDate: "2023-06-01",
    },
    {
        course: "AS102",
        period: "Midterm 2024",
        initialDate: "2024-03-02",
        finalDate: "2024-04-02",
    },
    {
        course: "CS102",
        period: "Final 2023",
        initialDate: "2023-05-02",
        finalDate: "2023-06-02",
    },
    {
        course: "CS103",
        period: "Midterm 2024",
        initialDate: "2024-03-03",
        finalDate: "2024-04-03",
    },
    {
        course: "AS103",
        period: "Final 2023",
        initialDate: "2023-05-03",
        finalDate: "2023-06-03",
    },
    {
        course: "AS104",
        period: "Midterm 2024",
        initialDate: "2024-03-04",
        finalDate: "2024-04-04",
    }
    // Add more entries...
    ];  

    const [searchTerm, setSearchTerm] = useState("");
    const [sortField, setSortField] = useState<keyof CoursePeriodEntry>("course");
    const [sortAsc, setSortAsc] = useState(true);
    const [selectedEntry, setSelectedEntry] = useState<CoursePeriodEntry | null>(null);

    const [gradeSheets] = useState<GradeSheet[]>([]);

    const filteredAndSorted = allCourses
    .filter((entry) =>
    `${entry.course} ${entry.period}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
    const valA = a[sortField];
    const valB = b[sortField];
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
                {(["course", "period", "initialDate", "finalDate"] as const).map((field) => (
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
                    course: "Course",
                    period: "Exam Period",
                    initialDate: "Initial Grades Submission",
                    finalDate: "Final Grades Submission",
                    }[field]}
                </th>
                ))}
            </tr>
            </thead>
            <tbody>
            {filteredAndSorted.map((entry, idx) => {
                const selected =
                selectedEntry?.course === entry.course && selectedEntry?.period === entry.period;
                return (
                <tr
                    key={idx}
                    className={`statistics-tr statistics-row-hover ${
                    selected ? "statistics-row-selected" : ""
                    }`}
                    onClick={() => setSelectedEntry(entry)}
                >
                    <td className="statistics-td">{entry.course}</td>
                    <td className="statistics-td">{entry.period}</td>
                    <td className="statistics-td">{entry.initialDate}</td>
                    <td className="statistics-td">{entry.finalDate}</td>
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