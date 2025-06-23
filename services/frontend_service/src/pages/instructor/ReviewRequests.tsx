// src/pages/ReplyRequestsPage.tsx
import React, { useState, useEffect } from 'react';
import { useMessage } from '../../components/Messages';
import { config } from '../../config';

interface ReplyRow {
  id: number;
  course_name: string;
  exam_period: string;
  student_name: string;
  request_body: string;
  has_reply: boolean;
}

type SortKey = keyof Pick<ReplyRow, 'course_name' | 'exam_period' | 'student_name' | 'request_body'>;

const ReplyRequestsPage: React.FC = () => {
  const [data, setData] = useState<ReplyRow[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>('course_name');
  const [sortAsc, setSortAsc] = useState(true);
  const [activeReply, setActiveReply] = useState<ReplyRow | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const { showMessage } = useMessage();

  useEffect(() => {
    const fetchRequests = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        showMessage({ type: 'cancel', text: 'User not authenticated' });
        return;
      }

      try {
        const response = await fetch(`${config.apiUrl}/requests/view-requests`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch requests');
        }

        const jsonData = await response.json();
        setData(jsonData.requests.map((r: any) => ({
          id: r.request_id,
          course_name: r.course_name,
          exam_period: r.exam_period,
          student_name: r.student_name,
          request_body: r.request_body,
          has_reply: r.has_reply,
        })));
      } catch (error) {
        console.error(error);
        showMessage({ type: 'cancel', text: 'Error loading requests' });
      }
    };

    fetchRequests();
  }, []);

  const handleSort = (key: SortKey) => {
    const sorted = [...data].sort((a, b) => a[key].localeCompare(b[key]));
    if (!sortAsc) sorted.reverse();
    setData(sorted);
    setSortKey(key);
    setSortAsc(!sortAsc);
  };

  const handleReply = async () => {
    if (!activeReply) return;

    if (replyMessage.trim() === '') {
      showMessage({ type: 'cancel', text: 'Reply cannot be empty.' });
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      showMessage({ type: 'cancel', text: 'User not authenticated' });
      return;
    }

    try {
      const newGradeInput = document.querySelector('input[placeholder="optional"]') as HTMLInputElement;
      const newGrade = newGradeInput ? newGradeInput.value.trim() : '';

      const combinedReplyBody = `Reply: ${replyMessage.trim()}${newGrade ? `\nNew Grade: ${newGrade}` : ''}`;

      const response = await fetch(`${config.apiUrl}/replies/create-reply/${activeReply.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          reply_body: combinedReplyBody,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send reply');
      }

      showMessage({ type: 'success', text: `Reply sent to ${activeReply.student_name}` });
      setActiveReply(null);
      setReplyMessage('');
      if (newGradeInput) newGradeInput.value = '';

      // Refresh data
      setData(prev =>
        prev.map(row =>
          row.id === activeReply.id ? { ...row, has_reply: true } : row
        )
      );
    } catch (error: any) {
      showMessage({ type: 'cancel', text: error.message || 'Error sending reply' });
    }
  };

  return (
    <div className="reply-table-container">
      {data.length === 0 ? (
        <div className="no-requests-message p-4 text-center text-gray-600">
          Δεν υπάρχουν αιτήματα για ανασκόπηση προς το παρόν.
        </div>
      ) : (
        <>
          <table className="w-full border-collapse">
            <thead>
              <tr className="reply-table-header text-left">
                <th className="p-2 cursor-pointer" onClick={() => handleSort('course_name')}>
                  Course Name {sortKey === 'course_name' && (sortAsc ? '▲' : '▼')}
                </th>
                <th className="p-2 cursor-pointer" onClick={() => handleSort('exam_period')}>
                  Exam Period {sortKey === 'exam_period' && (sortAsc ? '▲' : '▼')}
                </th>
                <th className="p-2 cursor-pointer" onClick={() => handleSort('student_name')}>
                  Student {sortKey === 'student_name' && (sortAsc ? '▲' : '▼')}
                </th>
                <th className="p-2 cursor-pointer" onClick={() => handleSort('request_body')}>
                  Message {sortKey === 'request_body' && (sortAsc ? '▲' : '▼')}
                </th>
                <th className="p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <tr key={row.id || index} className="border-t">
                  <td className="p-2">{row.course_name}</td>
                  <td className="p-2">{row.exam_period}</td>
                  <td className="p-2">{row.student_name}</td>
                  <td className="p-2">{row.request_body}</td>
                  <td className="p-2">
                    <button
                      className="reply-button"
                      onClick={() => setActiveReply(row)}
                      disabled={row.has_reply}
                      style={row.has_reply ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                    >
                      {row.has_reply ? 'Replied' : 'Reply'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {activeReply && (
            <div className="reply-window-container">
              <div className="reply-window">
                <h2 className="reply-window-header">
                  Reply to {activeReply.student_name}
                </h2>

                <div className="flex flex-col md:flex-row gap-6">
                  <div className="w-full md:w-1/2">
                    <h3 className="text-sm font-semibold mb-1 text-gray-700">Student Request</h3>
                    <div className="reply-request-box">
                      {activeReply.request_body}
                    </div>
                  </div>

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
                        max={10}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button className="reply-submit-button" onClick={handleReply}>
                    Submit
                  </button>
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
        </>
      )}
    </div>
  );
};

export default ReplyRequestsPage;
