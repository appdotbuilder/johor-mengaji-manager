import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import WelcomePage from './components/WelcomePage';
import DemoPage from './components/DemoPage';
import LoginPage from './components/LoginPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-cyan-50">
        <Routes>
          <Route path="/" element={<WelcomePage />} />
          <Route path="/demo" element={<DemoPage />} />
          <Route path="/login" element={<LoginPage />} />
          {/* Future routes will be added here */}
          <Route path="/dashboard" element={<div className="p-8 text-center">Dashboard - Coming Soon</div>} />
          <Route path="/register" element={<div className="p-8 text-center">Register - Coming Soon</div>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;