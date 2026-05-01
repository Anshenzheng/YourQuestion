import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import UserPage from './pages/UserPage';
import HostPage from './pages/HostPage';
import BigScreenPage from './pages/BigScreenPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/user/:roomId" element={<UserPage />} />
        <Route path="/host/:roomId" element={<HostPage />} />
        <Route path="/bigscreen/:roomId" element={<BigScreenPage />} />
      </Routes>
    </Router>
  );
}

export default App;
