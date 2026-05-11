/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { HashRouter, Route, Routes } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Portal from './pages/Portal';
import BigScreen from './pages/BigScreen';
import TeacherPanel, { type TeacherUser } from './pages/TeacherPanel';
import StudentQuery from './pages/StudentQuery';
import Dashboard from './pages/Dashboard';
import { clearLegacyTeacherAuthUser, initSharedSettings } from './lib/db';

export default function App() {
  const [user, setUser] = useState<TeacherUser | null>(null);

  useEffect(() => {
    clearLegacyTeacherAuthUser();
    initSharedSettings();
  }, []);

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Portal />} />
        <Route path="/screen" element={<BigScreen />} />
        <Route path="/admin" element={<TeacherPanel user={user} setUser={setUser} />} />
        <Route path="/student" element={<StudentQuery />} />
        <Route path="/student/:id" element={<StudentQuery />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </HashRouter>
  );
}
