import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { useMessage } from './Messages';
import { config } from '../config';

interface GradeUploadFormProps {
  apiEndpoint: string;
  title?: string;
  submitButtonText?: string;
  updateForm: boolean;
}

interface ParsedInfo {
  courseName: string;
  courseCode: string;
  period: string;
  entriesCount: number;
}

interface Course {
  course_name: string;
  course_code: string;
  department: string;
  semester: number;
  academic_year: string;
  submission_id: number;
  finalized: boolean;
}

const GradeUploadForm: React.FC<GradeUploadFormProps> = ({
  apiEndpoint,
  title = "Upload Grades Spreadsheet",
  submitButtonText = "Submit",
  updateForm = false,
}) => {
  const { showMessage } = useMessage();
  const [file, setFile] = useState<File | null>(null);
  const [parsedInfo, setParsedInfo] = useState<ParsedInfo | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const parseFile = async (file: File) => {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });

    if (!jsonData || jsonData.length < 2) {
      showMessage({ type: 'cancel', text: 'Empty or invalid file.' });
      return;
    }

    // Ξεκίνα από τη δεύτερη γραμμή και βρες την πρώτη που έχει πραγματικό περιεχόμενο
    const metadataRow = jsonData.slice(1).find(
      (row) => Array.isArray(row) && row[4]?.includes('ΛΟΓΙΣΜΙΚΟΥ') && row[3]
    ) as string[] | undefined;

    if (!metadataRow) {
      showMessage({ type: 'cancel', text: 'Could not detect course or period row.' });
      return;
    }

    const courseName = metadataRow[4]?.split('(')[0]?.trim() || 'Unknown';
    const courseCode = metadataRow[4]?.split('(')[1]?.replace(')', '').trim() || 'Unknown';
    const period = metadataRow[3]?.trim() || 'Unknown';
    const entriesCount = jsonData.length - 1;

    console.log('metadataRow:', metadataRow);
    console.log('courseName:', courseName);
    console.log('period:', period);
    console.log('length:', entriesCount);

    setParsedInfo({ courseName, courseCode, period, entriesCount });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log(' Submit clicked. File:', file);
    if (!file) {
      showMessage({ type: 'cancel', text: 'No file selected.' });
      return;
    }

    await parseFile(file);
  };

const handleConfirm = async () => {
  if (!file) return;

  const formData = new FormData();
  formData.append('gradesFile', file);

  let method: 'POST' | 'PUT';
  let url: string;

  try {
    if (updateForm) {
      if (!submissionId) {
        showMessage({ type: 'cancel', text: 'Please select a course to update.' });
        return;
      }
      url = `${config.apiUrl}/post-grades/${apiEndpoint}/${submissionId}`;
      method = 'PUT';
    } else {
      url = `${config.apiUrl}/post-grades/${apiEndpoint}`;
      method = 'POST';
    }

    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      },
      body: formData
    });

    const result = await response.json();

    if (response.ok && result.success) {
      showMessage({ type: 'success', text: 'Grades submitted successfully.' });
      setParsedInfo(null);
      setFile(null);
    } else {
      showMessage({ type: 'cancel', text: result.message || 'Upload failed.' });
    }
  } catch (err) {
    console.error('Upload error:', err);
    showMessage({ type: 'cancel', text: 'An error occurred during upload.' });
  }
};

  const handleCancel = () => {
    setParsedInfo(null);
    setFile(null);
    showMessage({ type: 'cancel', text: 'Grade submission cancelled.' });
  };


  const [courses, setCourses] = useState<Course[]>([]);
  const [, setLoading] = useState(true);
  const [submissionId, setSubmissionId] = useState<number | null>(null);

  useEffect(() => {
    if (!updateForm) return;

    const fetchCourses = async () => {
      try {
        const token = localStorage.getItem('token');

        const response = await fetch(`${config.apiUrl}/post-grades/get-courses`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch courses');
        }

        setCourses((data.courses || []).filter((c: Course) => !c.finalized));
      } catch (error: any) {
        console.error('Error fetching courses:', error);
        showMessage({ type: 'cancel', text: error.message || 'Error occurred' });
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [updateForm]);

return (
  <>
    <form className="upload-container" onSubmit={handleSubmit}>
      <h2 className="upload-header">{title}</h2>

      {updateForm && (
        <div className="dropdown-container mt-4">
          <label htmlFor="course-select" className="dropdown-label">
            Select Course to Update:
          </label>
          <select
            id="course-select"
            className="dropdown-select w-full border border-gray-600 text-zinc-800 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={submissionId ?? ''}
            onChange={(e) => setSubmissionId(parseInt(e.target.value))}
          >
            <option value="" disabled>Select a course</option>
            {courses.filter(c => !c.finalized).map((course) => (
              <option key={course.submission_id} value={course.submission_id}>
                {course.course_name} ({course.academic_year})
              </option>
            ))}
          </select>
        </div>
      )}
      <br></br>

      <input
        type="file"
        accept=".xlsx,.csv"
        onChange={handleFileChange}
        className="upload-input"
      />

      <button type="submit" className="upload-button mt-4">
        {submitButtonText}
      </button>
    </form>

    {parsedInfo && (
      <div className="confirm-tile">
        <h3 className="confirm-header">Spreadsheet Info</h3>
        <p className="confirm-info"><strong>Course Name:</strong> {parsedInfo.courseName}</p>
        <p className="confirm-info"><strong>Course Code:</strong> {parsedInfo.courseCode}</p>
        <p className="confirm-info"><strong>Period:</strong> {parsedInfo.period}</p>
        <p className="confirm-info"><strong>Entries:</strong> {parsedInfo.entriesCount}</p>
        <div className="flex gap-4 mt-4">
          <button className="confirm-button" onClick={handleConfirm}>
            Confirm and Submit Grades
          </button>
          <button className="cancel-button" onClick={handleCancel}>
            Cancel
          </button>
        </div>
      </div>
    )}
  </>
);
}

export default GradeUploadForm;