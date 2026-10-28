import React from 'react';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export const Settings: React.FC = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      <Card className="p-6 max-w-2xl">
        <h2 className="text-xl font-bold mb-4">Account Settings</h2>

        <div className="space-y-4">
          <Input label="Email" type="email" placeholder="your@email.com" />
          <Input label="Full Name" placeholder="Your Name" />

          <div>
            <label className="block text-sm font-medium mb-2">
              Default Language
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              <option>English</option>
              <option>Hinglish</option>
            </select>
          </div>

          <Button className="w-full mt-6">Save Changes</Button>
        </div>
      </Card>
    </div>
  );
};
