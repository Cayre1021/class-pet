import React, { useState } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TeacherPanel from './TeacherPanel';
import { useAppStore } from '../lib/store';

function TeacherPanelHarness() {
  const [user, setUser] = useState<{ uid: string } | null>({ uid: 'teacher@classpet.test' });
  return <TeacherPanel user={user} setUser={setUser} />;
}

describe('TeacherPanel first-time pin flow', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(
      'class_pet_settings',
      JSON.stringify({ rules: [], updatedAt: Date.now() }),
    );
    useAppStore.setState({
      students: [],
      settings: { rules: [], updatedAt: Date.now() },
      loading: false,
    });
  });

  it('returns to a usable login form without a blocking alert after setting the first class pin', async () => {
    const user = userEvent.setup();
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => undefined);

    render(
      <MemoryRouter>
        <TeacherPanelHarness />
      </MemoryRouter>,
    );

    await user.type(screen.getByPlaceholderText('输入新密码'), '1234');
    await user.click(screen.getByRole('button', { name: '设置密码并进入' }));

    await screen.findByText('👑 教师登录');

    const emailInput = screen.getByPlaceholderText('邮箱账号');
    await user.click(emailInput);

    expect(document.activeElement).toBe(emailInput);
    expect(alertSpy).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.getByText('班级管理密码设置成功，请使用新密码重新登录')).toBeTruthy();
    });
  });
});
