import React, { useState } from 'react';
import { Upload as UploadIcon, Youtube } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export const Upload: React.FC = () => {
  const [method, setMethod] = useState<'file' | 'youtube'>('file');
  const [language, setLanguage] = useState('english');

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Upload Meeting</h1>

      <Card className="p-8 max-w-2xl">
        <div className="mb-6 flex gap-4">
          <Button
            variant={method === 'file' ? 'primary' : 'outline'}
            onClick={() => setMethod('file')}
          >
            Upload File
          </Button>
          <Button
            variant={method === 'youtube' ? 'primary' : 'outline'}
            onClick={() => setMethod('youtube')}
            className="flex items-center gap-2"
          >
            <Youtube size={18} />
            YouTube URL
          </Button>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Language</label>
          <select
            value={language}
            onChange={e => setLanguage(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="english">English</option>
            <option value="hinglish">Hinglish</option>
          </select>
        </div>

        {method === 'file' ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <UploadIcon size={48} className="mx-auto text-gray-400 mb-3" />
            <p className="text-gray-600 mb-2">Drag & drop your video/audio file here</p>
            <Button variant="outline">Browse Files</Button>
          </div>
        ) : (
          <Input
            label="YouTube URL"
            placeholder="https://www.youtube.com/watch?v=..."
            type="url"
          />
        )}

        <Button className="w-full mt-6">Process Meeting</Button>
      </Card>
    </div>
  );
};
