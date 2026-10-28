import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';

interface TranscriptViewProps {
  transcript: string;
}

export const TranscriptView: React.FC<TranscriptViewProps> = ({ transcript }) => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div>
      <Card className="p-6 mb-6">
        <div className="flex items-center gap-2">
          <Search size={20} className="text-gray-400" />
          <Input
            placeholder="Search transcript..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="flex-1"
          />
        </div>
      </Card>

      <Card className="p-8 bg-gray-50">
        <div className="max-w-3xl mx-auto leading-relaxed text-gray-800">
          {transcript}
        </div>
      </Card>
    </div>
  );
};
