import React from 'react';
import { Card } from '../components/ui/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const mockData = [
  { name: 'Jan', meetings: 4 },
  { name: 'Feb', meetings: 6 },
  { name: 'Mar', meetings: 8 },
];

export const Dashboard: React.FC = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6">
          <h3 className="text-gray-600 text-sm font-medium">Total Meetings</h3>
          <p className="text-3xl font-bold text-primary-600 mt-2">24</p>
        </Card>
        <Card className="p-6">
          <h3 className="text-gray-600 text-sm font-medium">Processing</h3>
          <p className="text-3xl font-bold text-yellow-600 mt-2">2</p>
        </Card>
        <Card className="p-6">
          <h3 className="text-gray-600 text-sm font-medium">Storage Used</h3>
          <p className="text-3xl font-bold text-secondary-600 mt-2">1.2 GB</p>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={mockData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="meetings" fill="#6366f1" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};
