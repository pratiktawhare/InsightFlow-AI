import React from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Link } from 'react-router-dom';

const mockMeetings = [
  {
    id: '1',
    title: 'Product Planning Q1',
    date: '2026-10-28',
    status: 'completed',
    duration: '45 min',
  },
  {
    id: '2',
    title: 'Engineering Standup',
    date: '2026-10-27',
    status: 'completed',
    duration: '30 min',
  },
];

export const Meetings: React.FC = () => {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Meetings</h1>
        <input
          type="search"
          placeholder="Search meetings..."
          className="px-4 py-2 border border-gray-300 rounded-lg w-64"
        />
      </div>

      <div className="grid gap-4">
        {mockMeetings.map(meeting => (
          <Link key={meeting.id} to={`/meeting/${meeting.id}`}>
            <Card hoverable className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {meeting.title}
                  </h2>
                  <p className="text-gray-500 text-sm mt-1">{meeting.date}</p>
                </div>
                <div className="flex gap-2 items-center">
                  <Badge variant="success">{meeting.status}</Badge>
                  <span className="text-gray-600 text-sm">{meeting.duration}</span>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};
