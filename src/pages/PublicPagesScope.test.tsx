import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import BigScreen from './BigScreen';
import Dashboard from './Dashboard';
import StudentQuery from './StudentQuery';
import * as db from '../lib/db';
import { useAppStore } from '../lib/store';

describe('public pages follow remembered teacher scope', () => {
  let rememberedTeacherAccountKey = '';

  beforeEach(async () => {
    localStorage.clear();
    useAppStore.setState({
      students: [],
      settings: null,
      loading: false,
    });

    const accountA = await db.registerTeacherAccount({
      className: '一班',
      teacherName: '张老师',
      password: '1234',
    });
    const accountB = await db.registerTeacherAccount({
      className: '二班',
      teacherName: '李老师',
      password: '5678',
    });

    await db.initTeacherSettings(accountA.accountKey);
    await db.initTeacherSettings(accountB.accountKey);

    await db.createTeacherStudent(accountA.accountKey, {
      id: 'std_a',
      name: '小明',
      nickname: '小明的宠物',
      eggColor: 'red',
      exp: 30,
      level: 2,
      effects: [],
      petType: 'bird',
      hatchState: 'egg',
    });

    await db.createTeacherStudent(accountB.accountKey, {
      id: 'std_b',
      name: '小红',
      nickname: '小红的宠物',
      eggColor: 'blue',
      exp: 45,
      level: 2,
      effects: [],
      petType: 'bird',
      hatchState: 'egg',
    });

    await db.updateTeacherStudentPoints(
      accountB.accountKey,
      'std_b',
      5,
      2,
      ['Star'],
      'teacher-uid-li',
      '课堂表现',
    );

    rememberedTeacherAccountKey = accountB.accountKey;
    db.rememberTeacherAccount(accountB);
  });

  afterEach(() => {
    cleanup();
  });

  it('shows remembered teacher students on the big screen', async () => {
    render(
      <MemoryRouter>
        <BigScreen />
      </MemoryRouter>,
    );

    await screen.findByText('班级宠物大屏');

    await waitFor(() => {
      expect(screen.getByText('小红')).toBeTruthy();
    });

    expect(screen.queryByText('小明')).toBeNull();
  });

  it('shows remembered teacher rankings on the dashboard', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    );

    await screen.findByText('班级仪表盘');

    await waitFor(() => {
      expect(screen.getByText('小红')).toBeTruthy();
    });

    expect(screen.queryByText('小明')).toBeNull();
  });

  it('shows remembered teacher student logs in student query', async () => {
    render(
      <MemoryRouter initialEntries={['/student/std_b']}>
        <Routes>
          <Route path="/student/:id" element={<StudentQuery />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('课堂表现')).toBeTruthy();
    });

    expect(screen.getByText('小红')).toBeTruthy();
    expect(screen.queryByText('小明')).toBeNull();
  });

  it('keeps hatch-ready pets scoped to the remembered teacher in public views', async () => {
    const readyStudent = db.getTeacherStudents(rememberedTeacherAccountKey)[0];
    localStorage.setItem(
      `class_pet_students:${rememberedTeacherAccountKey}`,
      JSON.stringify([
        {
          ...readyStudent,
          exp: 50,
          level: 2,
          petType: 'fish',
          hatchState: 'ready',
        },
      ]),
    );

    render(
      <MemoryRouter initialEntries={['/student/std_b']}>
        <Routes>
          <Route path="/student/:id" element={<StudentQuery />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('可孵化')).toBeTruthy();
    });

    expect(screen.queryByText('🐟')).toBeNull();
  });
});
