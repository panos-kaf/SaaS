import React, { useState } from 'react';
import { useMessage } from '../../components/Messages';

interface ReplyRow {
  id: string;
  courseName: string;
  examPeriod: string;
  studentName: string;
  requestMessage: string;
}

const mockData: ReplyRow[] = [
    { id: '1', courseName: 'Algorithms', examPeriod: 'Jan 2025', studentName: 'Alice Smith', requestMessage: 'I would like to discuss my exam results.' },
    { id: '2', courseName: 'Databases', examPeriod: 'Mar 2025', studentName: 'Bob Johnson', requestMessage: 'I would like to discuss my exam results.' },
    { id: '3', courseName: 'Operating Systems', examPeriod: 'Jan 2025', studentName: 'Charlie Brown', requestMessage: 'I would like to discuss my exam results.' },
    { id: '4', courseName: 'Analysis', examPeriod: 'Jan 2025', studentName: 'Alice Smith', requestMessage: 'I would like to discuss my exam results.' },
    { id: '5', courseName: 'Circuits', examPeriod: 'Mar 2025', studentName: 'Bob Johnson', requestMessage: 'I would like to discuss my exam results.' },
    { id: '6', courseName: 'Linear Algebra', examPeriod: 'Jan 2025', studentName: 'Alice Smith', requestMessage: 'I would like to discuss my exam results.' },
    { id: '7', courseName: 'Computer Architecture', examPeriod: 'Mar 2025', studentName: 'Bob Johnson' , requestMessage: 'I would like to discuss my exam results.'},
    { id: '8', courseName: 'Discrete Mathematics', examPeriod: 'Jan 2025', studentName: 'Charlie Brown', requestMessage: 'I would like to discuss my exam results.' },
    { id: '9', courseName: 'Software Engineering', examPeriod: 'Jan 2025', studentName: 'Alice Smith', requestMessage: 'I would like to discuss my exam results.' },
    { id: '10', courseName: 'Machine Learning', examPeriod: 'Mar 2025', studentName: 'Bob Johnson', requestMessage: 'I would like to discuss my exam results.' },
    { id: '11', courseName: 'Web Development', examPeriod: 'Jan 2025', studentName: 'Charlie Brown', requestMessage: 'I would like to discuss my exam results.' },
    { id: '12', courseName: 'Computer Networks', examPeriod: 'Mar 2025', studentName: 'Alice Smith', requestMessage: 'I would like to discuss my exam results.' },
    { id: '13', courseName: 'Cybersecurity', examPeriod: 'Jan 2025', studentName: 'Bob Johnson', requestMessage: 'I would like to discuss my exam results.' },
    { id: '14', courseName: 'Data Science', examPeriod: 'Mar 2025', studentName: 'Charlie Brown', requestMessage: 'I would like to discuss my exam results.' },
    { id: '15', courseName: 'Artificial Intelligence', examPeriod: 'Jan 2025', studentName: 'Alice Smith', requestMessage: 'I would like to discuss my exam results.' },
];

type SortKey = keyof Pick<ReplyRow, 'courseName' | 'examPeriod' | 'studentName'>;

const ReplyRequestsPage: React.FC = () => {
    const [data, setData] = useState<ReplyRow[]>(mockData);
    const [sortKey, setSortKey] = useState<SortKey>('courseName');
    const [sortAsc, setSortAsc] = useState(true);
    const [activeReply, setActiveReply] = useState<ReplyRow | null>(null);
    const [replyMessage, setReplyMessage] = useState('');

  const handleSort = (key: SortKey) => {
    const sorted = [...data].sort((a, b) => a[key].localeCompare(b[key]));
    if (!sortAsc) sorted.reverse();
    setData(sorted);
    setSortKey(key);
    setSortAsc(!sortAsc);
  };

  const { showMessage } = useMessage();

    const handleReply = () => {
        if (!activeReply) return;

        if (replyMessage.trim() === '') {
            showMessage({ type: 'cancel', text: 'Reply cannot be empty.' });
            return;
        }

        // Simulate sending the reply
        showMessage({ type: 'success', text: `Reply sent to ${activeReply.studentName}` });
        setActiveReply(null);
        setReplyMessage(''); // reset textarea
    };

  return (
    <div className="reply-table-container">
      <table className="w-full border-collapse">
        <thead>
          <tr className="reply-table-header text-left">
            <th className="p-2 cursor-pointer" onClick={() => handleSort('courseName')}>
              Course Name {sortKey === 'courseName' && (sortAsc ? '▲' : '▼')}
            </th>
            <th className="p-2 cursor-pointer" onClick={() => handleSort('examPeriod')}>
              Exam Period {sortKey === 'examPeriod' && (sortAsc ? '▲' : '▼')}
            </th>
            <th className="p-2 cursor-pointer" onClick={() => handleSort('studentName')}>
              Student {sortKey === 'studentName' && (sortAsc ? '▲' : '▼')}
            </th>
            <th className="p-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.id} className="border-t">
              <td className="p-2">{row.courseName}</td>
              <td className="p-2">{row.examPeriod}</td>
              <td className="p-2">{row.studentName}</td>
              <td className="p-2">
                <button
                  className="reply-button"
                  onClick={() => setActiveReply(row)}
                >
                  Reply
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Floating Reply Modal */}
      {activeReply && (
        <div className="reply-window-container">
            <div className="reply-window">
            <h2 className="reply-window-header">
                Reply to {activeReply.studentName}
            </h2>

            <div className="flex flex-col md:flex-row gap-6">
                {/* Left: Student Request */}
                <div className="w-full md:w-1/2">
                <h3 className="text-sm font-semibold mb-1 text-gray-700">Student Request</h3>
                <div className="reply-request-box">
                    {activeReply.requestMessage}
                </div>
                </div>

                {/* Right: Reply Form */}
                <div className="w-full md:w-1/2 space-y-4">
                <div>
                    <label className="block text-sm text-gray-700 font-medium mb-1">Your Reply</label>
                    <textarea
                    placeholder="Write your reply..."
                    className="reply-text"
                    rows={4}
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    />
                </div>

                <div>
                    <label className="block text-sm text-gray-700 font-medium mb-1">New Grade</label>
                    <input
                    type="number"
                    placeholder="optional"
                    className="reply-text"
                    min={0}
                    max={30}
                    />
                </div>
                </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
                <button className="reply-submit-button"
                onClick={handleReply}
                >
                    Submit</button>
                <button
                className="reply-cancel-button"
                onClick={() => setActiveReply(null)}
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

export default ReplyRequestsPage;