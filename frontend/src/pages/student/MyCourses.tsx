import React, { useState } from "react";
import { config } from '../../config';

const showMessage = ({ type, text }: { type: string; text: string }) => {
  alert(`${type.toUpperCase()}: ${text}`);
};


interface Course {
  id: number;
  courseName: string;
  examPeriod: string;
  gradingStatus: string;
  gradeID: number;
  profID: number;
}

const MyCourses = () => {
  const courses: Course[] = [
    {
      id: 1,
      courseName: "physics",
      examPeriod: "spring 2025",
      gradingStatus: "open",
      gradeID: 5,
      profID: 1
    },
    {
      id: 2,
      courseName: "software",
      examPeriod: "fall 2024",
      gradingStatus: "open",
      gradeID: 5,
      profID: 2
    },
    {
      id: 3,
      courseName: "mathematics",
      examPeriod: "fall 2024",
      gradingStatus: "closed",
      gradeID: 3,
      profID: 3
    },
  ];

  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [reviewMessage, setReviewMessage] = useState("");
  const [viewStatusCourse, setViewStatusCourse] = useState<Course | null>(null);
  const [gradeViewCourse, setGradeViewCourse] = useState<Course | null>(null);

  const handleReviewClick = (course: Course) => {
    if (course.gradingStatus === "open") {
      setSelectedCourse(course);
      setViewStatusCourse(null);
      setGradeViewCourse(null);
    }
  };

  const handleViewStatusClick = (course: Course) => {
    setViewStatusCourse(course);
    setSelectedCourse(null);
    setGradeViewCourse(null);
  };

  const handleViewGradeClick = (course: Course) => {
    setGradeViewCourse(course);
    setSelectedCourse(null);
    setViewStatusCourse(null);
  };

  const handleSubmitReview = async () => {
    if (!selectedCourse || reviewMessage.trim() === "") {
      showMessage({ type: "cancel", text: "Review message is required." });
      return;
    }

    const courseID = selectedCourse.id;   // από props ή state
    const gradeID = selectedCourse.gradeID;     // μοναδικό ID βαθμού
    const profID = selectedCourse.profID;       // καθηγητής που ανήκει ο βαθμός

    try {
      const response = await fetch(`http://localhost:3005/post-request/${courseID}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem("token") || ""}`
        },
        body: JSON.stringify({
          requestBody: reviewMessage,
          gradeID,
          profID
        })
      });

      const result = await response.json();

      if (response.ok) {
        showMessage({ type: 'success', text: 'Review request submitted successfully!' });
        setReviewMessage("");
        setSelectedCourse(null);
      } else {
        showMessage({ type: 'cancel', text: result.error || 'Failed to submit review request.' });
      }
    } catch (err) {
      console.error('Error submitting review:', err);
      showMessage({ type: 'cancel', text: 'An error occurred while submitting the review.' });
    }
  };


  return (
    <div className="p-6 text-white">
      <h2 className="text-2xl font-semibold mb-4">My Courses</h2>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-700 text-white">
            <th className="p-2 border">Course name</th>
            <th className="p-2 border">Exam period</th>
            <th className="p-2 border">Grading status</th>
            <th className="p-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {courses.map((course) => (
            <tr key={course.id} className="bg-gray-800">
              <td className="p-2 border">{course.courseName}</td>
              <td className="p-2 border">{course.examPeriod}</td>
              <td className="p-2 border">{course.gradingStatus}</td>
              <td className="p-2 border space-x-2">
                <button
                  onClick={() => handleViewGradeClick(course)}
                  className="bg-blue-500 px-2 py-1 rounded text-sm"
                >
                  View my grade
                </button>
                <button
                  onClick={() => handleReviewClick(course)}
                  className={`px-2 py-1 rounded text-sm ${
                    course.gradingStatus === "open"
                      ? "bg-yellow-500 hover:bg-yellow-600"
                      : "bg-yellow-300 opacity-50 cursor-not-allowed"
                  }`}
                  disabled={course.gradingStatus !== "open"}
                >
                  Ask for review
                </button>
                <button
                  onClick={() => handleViewStatusClick(course)}
                  className="bg-green-600 px-2 py-1 rounded text-sm"
                >
                  View review status
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedCourse && (
        <div className="mt-6 p-4 bg-gray-700 rounded">
          <h3 className="text-xl font-semibold mb-2">
            NEW REVIEW REQUEST – {selectedCourse.courseName} – {selectedCourse.examPeriod}
          </h3>
          <textarea
            className="w-full p-2 rounded text-black"
            rows={4}
            placeholder="Message to instructor"
            value={reviewMessage}
            onChange={(e) => setReviewMessage(e.target.value)}
          ></textarea>
          <button
            className="mt-2 bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded text-white"
            onClick={handleSubmitReview}
          >
            Submit grade review request
          </button>
        </div>
      )}

      {viewStatusCourse && (
        <div className="mt-6 p-4 bg-gray-600 rounded">
          <h3 className="text-xl font-semibold mb-2">
            REVIEW REQUEST STATUS – {viewStatusCourse.courseName} – {viewStatusCourse.examPeriod}
          </h3>
          <label className="block mb-1 font-semibold">Message FROM instructor</label>
          <textarea
            className="w-full p-2 rounded text-black"
            rows={4}
            readOnly
            value="Here is my review, you need to try harder!"
          ></textarea>
          <div className="mt-3 flex gap-2">
            <button className="bg-gray-400 hover:bg-gray-500 px-4 py-2 rounded text-white">
              Download attachment
            </button>
            <button
              className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded text-white"
              onClick={() => setViewStatusCourse(null)}
            >
              Ack
            </button>
          </div>
        </div>
      )}

      {gradeViewCourse && (
        <div className="mt-6 p-4 bg-gray-700 rounded">
          <h3 className="text-xl font-semibold mb-4">
            my grades – {gradeViewCourse.courseName} – {gradeViewCourse.examPeriod}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-800 p-4 rounded">
              <p className="font-semibold mb-2">Total</p>
              <input
                className="w-full p-2 rounded text-black"
                type="text"
                value="8.5"
                readOnly
              />
              <p className="font-semibold mt-2">Q1</p>
              <input
                className="w-full p-2 rounded text-black"
                type="text"
                value="9"
                readOnly
              />
              <p className="font-semibold mt-2">Q2</p>
              <input
                className="w-full p-2 rounded text-black"
                type="text"
                value="7"
                readOnly
              />
              <p className="font-semibold mt-2">Q3</p>
              <input
                className="w-full p-2 rounded text-black"
                type="text"
                value="9.5"
                readOnly
              />
            </div>
            <div className="bg-gray-800 p-4 rounded">
              <p className="font-semibold mb-2">physics – spring 2025 – total</p>
              <div className="h-40 bg-white text-black flex items-center justify-center">
                ΤΑΞΙΝΟΜΗΣΗ ΒΑΘΜΩΝ (Mock Graph)
              </div>
            </div>
            <div className="bg-gray-800 p-4 rounded">
              <p className="font-semibold mb-2">physics – spring 2025 – Q1</p>
              <div className="h-40 bg-white text-black flex items-center justify-center">
                Q1 (Mock Graph)
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyCourses;
