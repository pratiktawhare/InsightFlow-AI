import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Tabs } from '../components/ui/Tabs';
import { Button } from '../components/ui/Button';
import { TranscriptView } from '../components/features/TranscriptView';
import { ChatInterface } from '../components/features/ChatInterface';

const mockMeeting = {
  id: '1',
  title: 'Product Planning Q1 2026',
  source: 'youtube' as const,
  status: 'completed' as const,
  language: 'english',
  createdAt: new Date('2026-10-28'),
  transcript: 'Full transcript would go here...',
  summary: 'This meeting discussed Q1 product priorities and roadmap decisions.',
  actionItems: '1. Follow up on API design\n2. Schedule architecture review',
  keyDecisions: '1. Decided on new pricing model\n2. Approved backend refactor',
  openQuestions: '1. When to launch mobile app?',
};

export const MeetingDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      content: (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-3">Summary</h3>
            <p className="text-gray-700">{mockMeeting.summary}</p>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-bold mb-3">Action Items</h3>
              <p className="text-gray-700 whitespace-pre-line">{mockMeeting.actionItems}</p>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-bold mb-3">Key Decisions</h3>
              <p className="text-gray-700 whitespace-pre-line">
                {mockMeeting.keyDecisions}
              </p>
            </Card>
          </div>

          <Card className="p-6">
            <h3 className="text-lg font-bold mb-3">Open Questions</h3>
            <p className="text-gray-700">{mockMeeting.openQuestions}</p>
          </Card>
        </div>
      ),
    },
    {
      id: 'transcript',
      label: 'Transcript',
      content: <TranscriptView transcript={mockMeeting.transcript} />,
    },
    {
      id: 'chat',
      label: 'Chat',
      content: <ChatInterface meetingId={id || ''} />,
    },
  ];

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/meetings')}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-3xl font-bold">{mockMeeting.title}</h1>
          <p className="text-gray-500 text-sm mt-1">
            {mockMeeting.createdAt.toLocaleDateString()} • <Badge>{mockMeeting.source}</Badge>
          </p>
        </div>
      </div>

      <div className="mb-6 flex gap-3">
        <Button variant="outline">Export PDF</Button>
        <Button variant="outline">Share</Button>
      </div>

      <Tabs tabs={tabs} />
    </div>
  );
};
