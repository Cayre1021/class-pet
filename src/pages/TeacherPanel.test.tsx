import React, { useState } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';
import TeacherPanel from './TeacherPanel';
import * as db from '../lib/db';
import { initSharedSync, initTeacherSync, useAppStore } from '../lib/store';

function TeacherPanelHarness({
  initialUser = null,
}: {
  initialUser?: db.RememberedTeacherAccount | null;
}) {
  const [user, setUser] = useState<db.RememberedTeacherAccount | null>(initialUser);
  return <TeacherPanel user={user} setUser={setUser} />;
}

describe('TeacherPanel storage helpers', () => {
  beforeEach(() => {
    localStorage.clear();
    useAppStore.setState({
      students: [],
      settings: null,
      loading: false,
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('isolates student data by teacher account', async () => {
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

    await db.createTeacherStudent(accountA.accountKey, {
      id: 'std_a',
      name: '小明',
      nickname: '小明的宠物',
      eggColor: 'red',
      exp: 0,
      level: 1,
      effects: [],
    });

    expect(db.getTeacherStudents(accountA.accountKey)).toHaveLength(1);
    expect(db.getTeacherStudents(accountB.accountKey)).toHaveLength(0);
  });

  it('stores settings and logs inside the active teacher namespace', async () => {
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
    await db.updateTeacherClassPin(accountA.accountKey, '1234');
    await db.createTeacherStudent(accountA.accountKey, {
      id: 'std_a',
      name: '小明',
      nickname: '小明的宠物',
      eggColor: 'red',
      exp: 0,
      level: 1,
      effects: [],
    });

    await db.updateTeacherStudentPoints(
      accountA.accountKey,
      'std_a',
      5,
      2,
      ['Star'],
      'teacher-uid-zhang',
      '课堂表现',
    );

    expect(db.getTeacherSettings(accountA.accountKey)?.classPin).toBe('1234');
    expect(db.getTeacherSettings(accountB.accountKey)?.classPin).toBeUndefined();
    expect(db.getTeacherBehaviorLogs(accountA.accountKey)).toHaveLength(1);
    expect(db.getTeacherBehaviorLogs(accountB.accountKey)).toHaveLength(0);
    expect(db.getTeacherBehaviorLogs(accountA.accountKey)[0]?.teacherId).toBe('teacher-uid-zhang');
  });

  it('hydrates shared student and settings data when initSync runs without an account key', () => {
    const legacySettings = { rules: [], updatedAt: 111, classPin: '2468' };
    const legacyStudents = [
      {
        id: 'legacy_student',
        name: '共享学生',
        nickname: '共享宠物',
        eggColor: 'green',
        exp: 8,
        level: 2,
        effects: [],
        lastInteractionTime: 111,
        createdAt: 111,
      },
    ];

    localStorage.setItem('class_pet_settings', JSON.stringify(legacySettings));
    localStorage.setItem('class_pet_students', JSON.stringify(legacyStudents));

    const stop = initSharedSync();

    expect(useAppStore.getState().students).toEqual(legacyStudents);
    expect(useAppStore.getState().settings).toEqual(legacySettings);
    expect(useAppStore.getState().loading).toBe(false);

    stop();
  });

  it('seeds missing settings from defaults before updating the class pin', async () => {
    await db.updateSharedClassPin('9999');

    const settings = db.getSharedSettings();

    expect(settings?.classPin).toBe('9999');
    expect(settings?.rules.length).toBeGreaterThan(0);
  });

  it('rejects duplicate teacher registration for the same class and teacher identity', async () => {
    await db.registerTeacherAccount({
      className: '一班',
      teacherName: '张老师',
      password: '1234',
    });

    await expect(
      db.registerTeacherAccount({
        className: ' 一班 ',
        teacherName: '张老师',
        password: '5678',
      }),
    ).rejects.toThrow(/already exists|已存在/);
  });

  it('surfaces storage write failures when creating a teacher account', async () => {
    const originalSetItem = Storage.prototype.setItem;
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key, value) {
      if (key === 'class_pet_teachers') {
        throw new Error('quota exceeded');
      }
      return originalSetItem.call(this, key, value);
    });

    await expect(
      db.registerTeacherAccount({
        className: '三班',
        teacherName: '王老师',
        password: '2468',
      }),
    ).rejects.toThrow('quota exceeded');

    expect(setItemSpy).toHaveBeenCalled();
  });

  it('remembers the last teacher identity without touching legacy auth storage', async () => {
    const account = await db.registerTeacherAccount({
      className: ' 一班 ',
      teacherName: ' 张老师 ',
      password: '1234',
    });

    db.rememberTeacherAccount(account);

    expect(db.getRememberedTeacherAccount()).toEqual({
      accountKey: '一班::张老师',
      className: ' 一班 ',
      teacherName: ' 张老师 ',
    });
    expect(localStorage.getItem('class_pet_auth_user')).toBeNull();
  });

  it('ignores unrelated teacher-student writes when subscribing to one account namespace', async () => {
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
    const snapshots: string[][] = [];

    const stop = db.subscribeToTeacherStudents(accountA.accountKey, (students) => {
      snapshots.push(students.map((student) => student.id));
    });

    await db.createTeacherStudent(accountB.accountKey, {
      id: 'std_b',
      name: '小红',
      nickname: '小红的宠物',
      eggColor: 'blue',
      exp: 0,
      level: 1,
      effects: [],
    });

    await db.createTeacherStudent(accountA.accountKey, {
      id: 'std_a',
      name: '小明',
      nickname: '小明的宠物',
      eggColor: 'red',
      exp: 0,
      level: 1,
      effects: [],
    });

    expect(snapshots).toEqual([[], ['std_a']]);

    stop();
  });

  it('syncs the store from the selected teacher account namespace', async () => {
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
      exp: 0,
      level: 1,
      effects: [],
    });
    await db.createTeacherStudent(accountB.accountKey, {
      id: 'std_b',
      name: '小红',
      nickname: '小红的宠物',
      eggColor: 'blue',
      exp: 0,
      level: 1,
      effects: [],
    });

    const stop = initTeacherSync(accountB.accountKey);

    expect(useAppStore.getState().students.map((student) => student.id)).toEqual(['std_b']);
    expect(useAppStore.getState().settings).toEqual(db.getTeacherSettings(accountB.accountKey));

    stop();
  });
});

describe('TeacherPanel teacher auth flow', () => {
  beforeEach(() => {
    localStorage.clear();
    useAppStore.setState({
      students: [],
      settings: null,
      loading: false,
    });
    window.history.pushState({}, '', '/');
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    window.history.pushState({}, '', '/');
  });

  it('registers a new teacher identity, returns to teacher verification, and enters with the login password', async () => {
    const user = userEvent.setup();
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => undefined);

    render(
      <MemoryRouter>
        <TeacherPanelHarness />
      </MemoryRouter>,
    );

    await user.type(screen.getByPlaceholderText('班级名称'), '一班');
    await user.type(screen.getByPlaceholderText('教师姓名'), '张老师');
    await user.click(screen.getByRole('button', { name: '继续' }));

    await screen.findByText('创建教师账号');

    await user.type(screen.getByPlaceholderText('设置登录密码'), '1234');
    await user.type(screen.getByPlaceholderText('确认登录密码'), '1234');
    await user.click(screen.getByRole('button', { name: '创建账号' }));

    await screen.findByText('教师验证');

    expect(screen.getByText(/一班/)).toBeTruthy();
    expect(screen.getByText(/张老师/)).toBeTruthy();
    expect(screen.getByPlaceholderText('登录密码')).toBeTruthy();
    expect(screen.queryByPlaceholderText('班级名称')).toBeNull();
    expect(alertSpy).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(screen.getByText('教师账号创建成功，请输入登录密码')).toBeTruthy();
    });

    await user.type(screen.getByPlaceholderText('登录密码'), '1234');
    await user.click(screen.getByRole('button', { name: '进入教师工作台' }));

    await screen.findByText('教师工作台');
  });

  it('prompts for the existing teacher password after identity selection', async () => {
    await db.registerTeacherAccount({
      className: '二班',
      teacherName: '李老师',
      password: '5678',
    });

    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <TeacherPanelHarness />
      </MemoryRouter>,
    );

    await user.type(screen.getByPlaceholderText('班级名称'), '二班');
    await user.type(screen.getByPlaceholderText('教师姓名'), '李老师');
    await user.click(screen.getByRole('button', { name: '继续' }));

    await screen.findByText('教师验证');

    expect(screen.getByText(/二班/)).toBeTruthy();
    expect(screen.getByText(/李老师/)).toBeTruthy();
    expect(screen.getByPlaceholderText('登录密码')).toBeTruthy();
    expect(screen.queryByPlaceholderText('设置登录密码')).toBeNull();
  });

  it('restores the remembered teacher identity on app boot and clears it when switching accounts', async () => {
    const account = await db.registerTeacherAccount({
      className: '三班',
      teacherName: '王老师',
      password: '2468',
    });
    db.rememberTeacherAccount(account);
    localStorage.setItem('class_pet_auth_user', 'legacy@example.com');
    window.history.pushState({}, '', '/#/admin');

    const user = userEvent.setup();

    render(<App />);

    await screen.findByText('教师验证');

    expect(screen.getByText(/三班/)).toBeTruthy();
    expect(screen.getByText(/王老师/)).toBeTruthy();
    expect(screen.getByPlaceholderText('登录密码')).toBeTruthy();
    expect(screen.queryByPlaceholderText('班级名称')).toBeNull();

    await waitFor(() => {
      expect(localStorage.getItem('class_pet_auth_user')).toBeNull();
    });

    await user.click(screen.getByRole('button', { name: '切换账号' }));

    await screen.findByPlaceholderText('班级名称');
    expect(db.getRememberedTeacherAccount()).toBeNull();
  });
});
