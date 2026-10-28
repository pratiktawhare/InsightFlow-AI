import React from 'react';
import { Card } from '../components/ui/Card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const mockData = [
  { name: 'Week 1', meetings: 5, processed: 5 },
  { name: 'Week 2', meetings: 8, processed: 7 },
  { name: 'Week 3', meetings: 6, processed: 6 },
];

export const Analytics: React.FC = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Analytics</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Meeting Trends</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={mockData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="meetings"
                stroke="#6366f1"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="processed"
                stroke="#10b981"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Stats</h2>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Avg Processing Time</span>
              <span className="font-bold">12 min</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Action Items Created</span>
              <span className="font-bold">156</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Questions Asked</span>
              <span className="font-bold">89</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
