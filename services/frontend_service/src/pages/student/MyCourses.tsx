import { useEffect, useState } from "react";
import { config } from "../../config";
import { useMessage } from "../../components/Messages";

interface Course {
  id: number;
  courseName: string;
  examPeriod: string;
  gradingStatus: string;
  grade: number;
  profID: number;
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

        const transformedCourses: Course[] = (data.courses || []).map((c: any) => ({
          id: c.course_id,
          courseName: c.course_name,
          examPeriod: c.semester ?? "N/A",
          gradingStatus: "open", // ή υπολόγισε βάση grade === null
          grade: c.grade ?? null,
          profID: c.professor_id ?? null,
          courseCode: c.course_code,
          department: c.department,
        }));


        setCourses(transformedCourses);
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
      const res = await fetch(`${config.apiUrl}/student-courses/add-course`, {
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

    const { id: courseID, grade, profID } = selectedCourse;

    try {
      const res = await fetch(`${config.apiUrl}/requests/post-request/${courseID}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ requestBody: reviewMessage, grade, profID }),
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

      const reqRes = await fetch(`${config.apiUrl}/requests/my-request?course_id=${course.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!reqRes.ok) {
        setInstructorReply(null);
        setViewStatusCourse(course);
        return;
      }

      const reqData = await reqRes.json();
      const requestID = reqData?.request?.request_id;

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

      {/* rest of the UI remains unchanged */}
    </div>
  );
};

export default MyCourses;
