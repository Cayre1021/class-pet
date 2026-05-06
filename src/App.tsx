/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */



import {HashRouter, Route, Routes} from 'react-router-dom';
import Portal from './pages/Portal';
import BigScreen from './pages/BigScreen';
import TeacherPanel from './pages/TeacherPanel';
import StudentQuery from './pages/StudentQuery';
import Dashboard from './pages/Dashboard';
import { useEffect, useState } from 'react';
import { initSettings } from './lib/db';

export default function App() {
  const [user, setUser] = useState<{ uid: string } | null>(null);

  useEffect(() => {
    // Check local storage for simple auth state
    const localUser = localStorage.getItem('class_pet_auth_user');
    if (localUser) {
      setUser({ uid: localUser });
    }
    initSettings();
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
