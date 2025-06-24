import { useEffect, useState } from "react";
import { config } from "../../config";
import { useMessage } from "../../components/Messages";

interface Course {
  id: number;
  courseName: string;
  examPeriod: string;
  gradingStatus: string;
  grade: number | null;
  profID: number | null;
  gradeID: number | null;
  courseCode: string;
  department: string;
}


interface InstitutionCourse {
  id: number;
  name: string;
}

const MyCourses = () => {
  const { showMessage } = useMessage();
  const [courses, setCourses] = useState<Course[]>([]);
  const [institutionCourses, setInstitutionCourses] = useState<InstitutionCourse[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [reviewMessage, setReviewMessage] = useState("");
  const [viewStatusCourse, setViewStatusCourse] = useState<Course | null>(null);
  const [gradeViewCourse, setGradeViewCourse] = useState<Course | null>(null);
  const [instructorReply, setInstructorReply] = useState<string | null>(null);
  const [selectedToAdd, setSelectedToAdd] = useState<number | null>(null);

  useEffect(() => {
    const fetchStudentCourses = async () => {
      try {
        const token = localStorage.getItem("token") || "";
        const res = await fetch(`${config.apiUrl}/student-courses/get-courses`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        console.log("Fetched student courses:", data.courses);
        setCourses(data.courses || []);

      } catch (err) {
        console.error("Error loading courses:", err);
        showMessage({ type: "cancel", text: "Failed to load your courses." });
      }
    };


    const fetchInstitutionCourses = async () => {
      try {
        const token = localStorage.getItem("token") || "";
        const res = await fetch(`${config.apiUrl}/student-courses/institution-student-courses`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setInstitutionCourses(data.courses || []);
      } catch (err) {
        console.error("Error loading institution courses:", err);
      }
    };

    fetchStudentCourses();
    fetchInstitutionCourses();
  }, []);

  const handleAddCourse = async () => {
    if (!selectedToAdd) return;

    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${config.apiUrl}/student-courses/add-course/${selectedToAdd}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ course_id: selectedToAdd }),
      });

      const result = await res.json();

      if (res.ok) {
        showMessage({ type: "success", text: "Course added successfully!" });
      } else {
        showMessage({ type: "cancel", text: result.message || "Failed to add course." });
      }
    } catch (err) {
      console.error("Error adding course:", err);
      showMessage({ type: "cancel", text: "An error occurred while adding course." });
    }
  };

  const handleReviewClick = (course: Course) => {
    if (course.gradingStatus === "open") {
      setSelectedCourse(course);
      setViewStatusCourse(null);
      setGradeViewCourse(null);
    }
  };

  const handleSubmitReview = async () => {
    if (!selectedCourse || reviewMessage.trim() === "") {
      showMessage({ type: "cancel", text: "Review message is required." });
      return;
    }

    const { id: courseID, grade, profID, gradeID } = selectedCourse;

    try {
      const res = await fetch(`${config.apiUrl}/requests/post-request/${courseID}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ requestBody: reviewMessage, grade, profID, gradeID }),
      });

      const result = await res.json();

      if (res.ok) {
        showMessage({ type: "success", text: "Review request submitted!" });
        setReviewMessage("");
        setSelectedCourse(null);
      } else {
        showMessage({ type: "cancel", text: result.error || "Failed to submit review." });
      }
    } catch (err) {
      console.error("Review request error:", err);
      showMessage({ type: "cancel", text: "Could not submit review." });
    }
  };

  const handleViewStatusClick = async (course: Course) => {
    try {
      const token = localStorage.getItem("token") || "";

      const reqRes = await fetch(`${config.apiUrl}/requests/my-requests?course_id=${course.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });


      if (!reqRes.ok) {
        setInstructorReply(null);
        setViewStatusCourse(course);
        return;
      }

      const reqData = await reqRes.json();
      console.log("Request data:", reqData);
      const requestID = reqData?.requests?.[0]?.request_id;

      //debugging
      const userID = reqData?.requests?.[0]?.owner_id;
      console.log("Request owner_id (user_id):", userID);

      if (!requestID) {
        setInstructorReply(null);
        setViewStatusCourse(course);
        return;
      }

      const replyRes = await fetch(`${config.apiUrl}/replies/view-replies/${requestID}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const replyData = await replyRes.json();
      setInstructorReply(replyData?.data?.[0]?.reply_body ?? "");
      console.log(replyData)

      setViewStatusCourse(course);
      setSelectedCourse(null);
      setGradeViewCourse(null);
    } catch (err) {
      console.error("Error fetching review status:", err);
      showMessage({ type: "cancel", text: "Could not load review status." });
    }
  };

  const handleViewGradeClick = (course: Course) => {
    setGradeViewCourse(course);
    setSelectedCourse(null);
    setViewStatusCourse(null);
  };

  return (
    <div className="p-6 text-white">
      <h2 className="text-2xl font-semibold mb-4">My Courses</h2>

      <div className="mb-4 flex items-center gap-2">
        <select
          className="p-2 rounded text-black"
          value={selectedToAdd ?? ""}
          onChange={(e) => setSelectedToAdd(Number(e.target.value))}
        >
          <option value="">Select a course</option>
          {institutionCourses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.name}
            </option>
          ))}
        </select>
        <button
          onClick={handleAddCourse}
          disabled={!selectedToAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          Add
        </button>
      </div>

      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-700 text-white">
            <th className="p-2 border">Course name</th>
            <th className="p-2 border">Exam period</th>
            <th className="p-2 border">Grade</th>
            <th className="p-2 border">Grading status</th>
            <th className="p-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {courses.map((course) => (
            <tr key={course.id} className="bg-gray-800">
              <td className="p-2 border">{course.courseName}</td>
              <td className="p-2 border">{course.examPeriod}</td>
              <td className="p-2 border">{course.grade ?? "N/A"}</td>
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
          <div className="mt-3 flex gap-2">
            <button
              className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded text-white"
              onClick={handleSubmitReview}
            >
              Submit grade review request
            </button>
            <button
              className="bg-gray-500 hover:bg-gray-600 px-4 py-2 rounded text-white"
              onClick={() => {
                setSelectedCourse(null);
                setReviewMessage("");
              }}
            >
              Cancel
            </button>
          </div>
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
            value={instructorReply || "No reply yet"}
          ></textarea>
          <div className="mt-3 flex gap-2">
            <button className="bg-gray-400 hover:bg-gray-500 px-4 py-2 rounded text-white">
              Download attachment
            </button>
            <button
              className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded text-white"
              onClick={() => setViewStatusCourse(null)}
            >
              Cancel
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
            <div className="col-span-full flex justify-end">
              <button
                className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded text-white"
                onClick={() => setGradeViewCourse(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyCourses;
