import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { Upload } from './pages/Upload';
import { Meetings } from './pages/Meetings';
import { MeetingDetail } from './pages/MeetingDetail';
import { Analytics } from './pages/Analytics';
import { Settings } from './pages/Settings';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/meetings" element={<Meetings />} />
          <Route path="/meeting/:id" element={<MeetingDetail />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
