import React from 'react';
import GradeUploadForm from '../../components/GradeUploadForm';

const PostGradesPage: React.FC = () => {

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-center mb-6">Post Grades</h1>
      <GradeUploadForm
        apiEndpoint="grade-submissions"
        title="Upload Grades Spreadsheet"
        submitButtonText="Submit Grades"
        updateForm={false}
      />
      <GradeUploadForm
        apiEndpoint="grade-submissions"
        title="Update Existing Grades"
        submitButtonText="Update Grades"
        updateForm={true}
      />
    </div>
  );
};

export default PostGradesPage;