/*
const StudentDashboard = () => 
<h2>Student Dashboard Page </h2>;

export default StudentDashboard;
*/

import React from "react";

const Dashboard = () => {
  const statistics = [
    {
      courseName: "physics",
      examPeriod: "fall 2024",
      firstGradeSubmission: "2025-02-02",
      finalGradeSubmission: "2025-02-28",
    },
    {
      courseName: "software",
      examPeriod: "fall 2024",
      firstGradeSubmission: "2025-02-01",
      finalGradeSubmission: "2025-02-18",
    },
    {
      courseName: "mathematics",
      examPeriod: "fall 2024",
      firstGradeSubmission: "2025-02-02",
      finalGradeSubmission: "2025-02-14",
    },
  ];

  return (
    <div className="p-6 text-white">
      <h2 className="text-2xl font-semibold mb-4">Available course statistics</h2>

      <table className="w-full text-left border-collapse mb-6">
        <thead>
          <tr className="bg-gray-700 text-white">
            <th className="p-2 border">Course name</th>
            <th className="p-2 border">Exam period</th>
            <th className="p-2 border">First grade submission</th>
            <th className="p-2 border">Final grade submission</th>
          </tr>
        </thead>
        <tbody>
          {statistics.map((item, index) => (
            <tr key={index} className="bg-gray-800">
              <td className="p-2 border">{item.courseName}</td>
              <td className="p-2 border">{item.examPeriod}</td>
              <td className="p-2 border">{item.firstGradeSubmission}</td>
              <td className="p-2 border">{item.finalGradeSubmission}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800 p-4 rounded">
          <p className="font-semibold mb-2">physics – spring 2025 – total</p>
          <div className="h-40 bg-white text-black flex items-center justify-center">
            ΤΑΞΙΝΟΜΗΣΗ ΒΑΘΜΩΝ (Mock Graph)
          </div>
        </div>
        <div className="bg-gray-800 p-4 rounded">
          <p className="font-semibold mb-2">physics – spring 2025 – Q1</p>
          <div className="h-40 bg-white text-black flex items-center justify-center">
            Q1 Graph (Mock)
          </div>
        </div>
        <div className="bg-gray-800 p-4 rounded">
          <p className="font-semibold mb-2">physics – spring 2025 – Q2</p>
          <div className="h-40 bg-white text-black flex items-center justify-center">
            Q2 Graph (Mock)
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
