import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { useMessage } from './Messages';

interface ParsedInfo {
  courseName: string;
  period: string;
  entriesCount: number;
}

const GradeUploadForm: React.FC = () => {
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
    const period = metadataRow[3]?.trim() || 'Unknown';
    const entriesCount = jsonData.length - 1;

    console.log('metadataRow:', metadataRow);
    console.log('courseName:', courseName);
    console.log('period:', period);
    console.log('length:', entriesCount);

    setParsedInfo({ courseName, period, entriesCount });
  };




  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('📤 Submit clicked. File:', file);
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

    try {
      const response = await fetch('http://localhost:3002/grade-submissions', {
        method: 'POST',
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

  return (
    <>
      <form className="upload-container" onSubmit={handleSubmit}>
        <h2 className="upload-header">Upload Grades Spreadsheet</h2>
        <input
          type="file"
          accept=".xlsx,.csv"
          onChange={handleFileChange}
          className="upload-input"
        />
        <button type="submit" className="upload-button">
          Submit
        </button>
      </form>

      {parsedInfo && (
        <div className="confirm-tile">
          <h3 className="confirm-header">Spreadsheet Info</h3>
          <p className="confirm-info"><strong>Course Name:</strong> {parsedInfo.courseName}</p>
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
};

export default GradeUploadForm;