import React from 'react';
import GradeUploadForm from '../../components/GradeUploadForm';

const PostGradesPage: React.FC = () => {

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-center mb-6">Post Grades</h1>
      <GradeUploadForm />
    </div>
  );
};

export default PostGradesPage;