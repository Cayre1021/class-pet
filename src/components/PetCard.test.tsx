import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import PetCard from './PetCard';
import * as db from '../lib/db';

vi.mock('../lib/ai', () => ({
  generatePetReply: vi.fn(async () => '你好呀'),
}));

describe('PetCard hatch flow', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows a normal egg before the hatch threshold', () => {
    render(
      <PetCard
        student={{
          id: 'std_egg',
          name: '小明',
          nickname: '小明的宠物',
          eggColor: 'blue',
          exp: 20,
          level: 1,
          effects: [],
          petType: 'bird',
          hatchState: 'egg',
          mood: 100,
          lastInteractionTime: Date.now(),
          createdAt: Date.now(),
        }}
      />,
    );

    expect(screen.getAllByText('🥚').length).toBeGreaterThan(0);
    expect(screen.queryByText('可孵化')).toBeNull();
  });

  it('keeps showing the egg with a hatch-ready cue until the student opens it', async () => {
    const user = userEvent.setup();

    render(
      <PetCard
        student={{
          id: 'std_ready',
          name: '小红',
          nickname: '小红的宠物',
          eggColor: 'red',
          exp: 50,
          level: 2,
          effects: [],
          petType: 'puppy',
          hatchState: 'ready',
          mood: 100,
          lastInteractionTime: Date.now(),
          createdAt: Date.now(),
        }}
      />,
    );

    expect(screen.getByText('可孵化')).toBeTruthy();
    expect(screen.queryByText('🐶')).toBeNull();

    await user.click(screen.getByText('小红'));
    expect(screen.getAllByText('🥚').length).toBeGreaterThan(0);
    expect(screen.queryByText('🐶')).toBeNull();
  });

  it('reveals the stored pet type after hatching in remembered teacher scope', async () => {
    const account = await db.registerTeacherAccount({
      className: '一班',
      teacherName: '张老师',
      password: '1234',
    });
    await db.initTeacherSettings(account.accountKey);
    await db.createTeacherStudent(account.accountKey, {
      id: 'std_hatch',
      name: '小龙',
      nickname: '小龙的宠物',
      eggColor: 'purple',
      exp: 50,
      level: 2,
      effects: [],
      petType: 'dragon',
      hatchState: 'ready',
    });

    const user = userEvent.setup();

    render(<PetCard student={db.getTeacherStudents(account.accountKey)[0]} accountKey={account.accountKey} />);

    await user.click(screen.getByText('小龙'));
    await user.click(screen.getByRole('button', { name: '点击孵化宠物蛋' }));

    expect((await screen.findAllByText('🐉')).length).toBeGreaterThan(0);
    expect(db.getTeacherStudents(account.accountKey)[0]?.hatchState).toBe('hatched');
  });

  it('restores only a random 1% to 5% of mood on interaction instead of resetting to full mood', async () => {
    const now = 1_700_000_000_000;
    vi.spyOn(Date, 'now').mockReturnValue(now);
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.8);

    const account = await db.registerTeacherAccount({
      className: '一班',
      teacherName: '张老师',
      password: '1234',
    });
    await db.initTeacherSettings(account.accountKey);
    localStorage.setItem(
      `class_pet_students:${account.accountKey}`,
      JSON.stringify([
        {
          id: 'std_mood',
          name: '小暖',
          nickname: '小暖的宠物',
          eggColor: 'yellow',
          exp: 10,
          level: 1,
          effects: [],
          petType: 'bunny',
          hatchState: 'egg',
          mood: 40,
          lastInteractionTime: now - 60 * 60 * 1000,
          createdAt: now - 2 * 60 * 60 * 1000,
        },
      ]),
    );

    const user = userEvent.setup();

    render(<PetCard student={db.getTeacherStudents(account.accountKey)[0]} accountKey={account.accountKey} />);

    await user.click(screen.getByText('小暖'));
    expect(
      await screen.findByText((_, element) => element?.textContent === '主人：小暖 | 当前心情：35%'),
    ).toBeTruthy();

    await user.click(screen.getAllByText('🥚')[1]);

    await waitFor(() => {
      expect(db.getTeacherStudents(account.accountKey)[0]?.mood).toBe(40);
    });

    expect(randomSpy).toHaveBeenCalled();
  });

  it('keeps low-mood pets colorful instead of turning them grayscale', () => {
    render(
      <PetCard
        student={{
          id: 'std_low_mood',
          name: '小灰',
          nickname: '小灰的宠物',
          eggColor: 'blue',
          exp: 20,
          level: 1,
          effects: [],
          petType: 'fish',
          hatchState: 'egg',
          mood: 15,
          lastInteractionTime: Date.now(),
          createdAt: Date.now(),
        }}
      />,
    );

    expect(document.querySelector('.grayscale')).toBeNull();
  });
});
