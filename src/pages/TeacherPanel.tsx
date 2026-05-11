import React, { useEffect, useMemo, useState } from 'react';
import { initTeacherSync, useAppStore } from '../lib/store';
import {
  TeacherAccountExistsError,
  clearLegacyTeacherAuthUser,
  clearRememberedTeacherAccount,
  createTeacherStudent,
  findTeacherAccount,
  getRememberedTeacherAccount,
  getTeacherAccount,
  initTeacherSettings,
  registerTeacherAccount,
  rememberTeacherAccount,
  updateTeacherPassword,
  updateTeacherProfileColor,
  updateTeacherStudentPoints,
  validateTeacherCredentials,
  addTeacherBehaviorRule,
  deleteTeacherStudents,
  type PetType,
} from '../lib/db';
import { LogOut, Plus, Search, Check, AlertCircle, Home, KeyRound } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import clsx from 'clsx';
import { getStudentPetVisual } from '../lib/pets';

const colors = ['red', 'blue', 'green', 'purple', 'yellow'] as const;
const petTypes: PetType[] = ['bird', 'bunny', 'puppy', 'fish', 'dragon'];
const profileColorClasses: Record<(typeof colors)[number], string> = {
  red: 'bg-red-400',
  blue: 'bg-blue-400',
  green: 'bg-green-400',
  purple: 'bg-purple-400',
  yellow: 'bg-yellow-400',
};
const EVOLUTION_POOL = ['Crown', 'Wings', 'Star', 'Aura', 'Glasses'];

export type TeacherUser = {
  accountKey: string;
  className: string;
  teacherName: string;
};

type TeacherAuthMode = 'login' | 'registerIdentity' | 'registerPassword' | 'password';

function TeacherAuth({
  setUser,
}: {
  setUser: (user: TeacherUser | null) => void;
}) {
  const rememberedTeacher = useMemo(() => getRememberedTeacherAccount(), []);
  const [mode, setMode] = useState<TeacherAuthMode>(rememberedTeacher ? 'password' : 'login');
  const [className, setClassName] = useState(rememberedTeacher?.className ?? '');
  const [teacherName, setTeacherName] = useState(rememberedTeacher?.teacherName ?? '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [activeTeacher, setActiveTeacher] = useState<TeacherUser | null>(rememberedTeacher);
  const [errorMsg, setErrorMsg] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  const resetPasswordFields = () => {
    setPassword('');
    setConfirmPassword('');
  };

  const buildCurrentTeacher = () => ({
    accountKey: `${className.trim()}::${teacherName.trim()}`,
    className: className.trim(),
    teacherName: teacherName.trim(),
  });

  const handleLoginIdentitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setStatusMsg('');

    const nextTeacher = buildCurrentTeacher();

    if (!nextTeacher.className || !nextTeacher.teacherName) {
      setErrorMsg('请填写班级名称和教师姓名');
      return;
    }

    const existingTeacher = findTeacherAccount(nextTeacher.className, nextTeacher.teacherName);
    if (!existingTeacher) {
      setActiveTeacher(null);
      resetPasswordFields();
      setErrorMsg('该教师账号不存在，请先注册');
      return;
    }

    const teacherIdentity = {
      accountKey: existingTeacher.accountKey,
      className: existingTeacher.className,
      teacherName: existingTeacher.teacherName,
    };
    setActiveTeacher(teacherIdentity);
    rememberTeacherAccount(teacherIdentity);
    resetPasswordFields();
    setMode('password');
  };

  const handleRegisterIdentitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setStatusMsg('');

    const nextTeacher = buildCurrentTeacher();

    if (!nextTeacher.className || !nextTeacher.teacherName) {
      setErrorMsg('请填写班级名称和教师姓名');
      return;
    }

    setActiveTeacher(nextTeacher);
    resetPasswordFields();
    setMode('registerPassword');
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setStatusMsg('');

    if (!activeTeacher) {
      setErrorMsg('请先填写班级名称和教师姓名');
      setMode('registerIdentity');
      return;
    }

    if (password.length < 3) {
      setErrorMsg('登录密码至少 3 位');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('两次输入的密码不一致');
      return;
    }

    try {
      const teacherAccount = await registerTeacherAccount({
        className: activeTeacher.className,
        teacherName: activeTeacher.teacherName,
        password,
      });
      await initTeacherSettings(teacherAccount.accountKey);
      const teacherIdentity = {
        accountKey: teacherAccount.accountKey,
        className: teacherAccount.className,
        teacherName: teacherAccount.teacherName,
      };
      rememberTeacherAccount(teacherAccount);
      setActiveTeacher(teacherIdentity);
      resetPasswordFields();
      clearLegacyTeacherAuthUser();
      setUser(teacherIdentity);
    } catch (error: any) {
      if (error instanceof TeacherAccountExistsError) {
        setErrorMsg('该班级下的教师账号已存在');
        return;
      }
      setErrorMsg(error.message || '创建教师账号失败，请重试');
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!activeTeacher) {
      setErrorMsg('请先选择教师账号');
      setMode('identity');
      return;
    }

    if (!validateTeacherCredentials(activeTeacher.accountKey, password)) {
      setErrorMsg('登录密码错误');
      return;
    }

    rememberTeacherAccount(activeTeacher);
    clearLegacyTeacherAuthUser();
    setUser(activeTeacher);
  };

  const handleSwitchAccount = () => {
    clearRememberedTeacherAccount();
    setActiveTeacher(null);
    setClassName('');
    setTeacherName('');
    resetPasswordFields();
    setErrorMsg('');
    setStatusMsg('');
    setMode('login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-100 p-4">
      <div className="absolute top-6 left-6">
        <Link to="/" className="flex items-center gap-2 text-neutral-500 font-bold hover:text-neutral-800 transition-colors bg-white px-4 py-2 rounded-xl shadow-sm">
          <Home className="w-4 h-4" /> 返回首页
        </Link>
      </div>
      <div className="bg-white p-8 rounded-3xl shadow-lg max-w-sm w-full border-4 border-neutral-100">
        <h2 className="text-2xl font-black text-center text-[var(--color-duo-purple)] mb-6">
          {mode === 'password' ? '教师验证' : mode === 'registerIdentity' || mode === 'registerPassword' ? '创建教师账号' : '教师登录'}
        </h2>
        {statusMsg && <p className="text-[var(--color-duo-green-dark)] font-bold text-sm text-center mb-4">{statusMsg}</p>}
        {errorMsg && <p className="text-red-500 font-bold text-sm text-center mb-4">{errorMsg}</p>}

        {mode === 'login' && (
          <form onSubmit={handleLoginIdentitySubmit} className="space-y-4">
            <input
              type="text"
              placeholder="班级名称"
              value={className}
              onChange={(event) => setClassName(event.target.value)}
              className="w-full bg-neutral-100 rounded-xl p-3 font-bold outline-none focus:ring-4 ring-[var(--color-duo-purple-dark)]"
              required
            />
            <input
              type="text"
              placeholder="教师姓名"
              value={teacherName}
              onChange={(event) => setTeacherName(event.target.value)}
              className="w-full bg-neutral-100 rounded-xl p-3 font-bold outline-none focus:ring-4 ring-[var(--color-duo-purple-dark)]"
              required
            />
            <button type="submit" className="w-full bg-[var(--color-duo-blue)] text-white font-black text-lg rounded-2xl py-3 shadow-btn-blue active:translate-y-1 active:shadow-none transition-all mt-4">
              继续
            </button>
            <button type="button" onClick={() => {
              setErrorMsg('');
              setStatusMsg('');
              resetPasswordFields();
              setActiveTeacher(null);
              setMode('registerIdentity');
            }} className="w-full text-neutral-400 hover:text-neutral-600 font-bold text-sm">
              注册
            </button>
          </form>
        )}

        {mode === 'registerIdentity' && (
          <form onSubmit={handleRegisterIdentitySubmit} className="space-y-4">
            <input
              type="text"
              placeholder="班级名称"
              value={className}
              onChange={(event) => setClassName(event.target.value)}
              className="w-full bg-neutral-100 rounded-xl p-3 font-bold outline-none focus:ring-4 ring-[var(--color-duo-purple-dark)]"
              required
            />
            <input
              type="text"
              placeholder="教师姓名"
              value={teacherName}
              onChange={(event) => setTeacherName(event.target.value)}
              className="w-full bg-neutral-100 rounded-xl p-3 font-bold outline-none focus:ring-4 ring-[var(--color-duo-purple-dark)]"
              required
            />
            <button type="submit" className="w-full bg-[var(--color-duo-blue)] text-white font-black text-lg rounded-2xl py-3 shadow-btn-blue active:translate-y-1 active:shadow-none transition-all mt-4">
              继续
            </button>
            <button type="button" onClick={handleSwitchAccount} className="w-full text-neutral-500 hover:text-[var(--color-duo-blue)] font-bold text-sm">
              返回登录
            </button>
          </form>
        )}

        {mode === 'registerPassword' && activeTeacher && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div className="bg-neutral-100 rounded-2xl p-4 text-sm font-bold text-neutral-500 space-y-1">
              <div>班级：{activeTeacher.className}</div>
              <div>教师：{activeTeacher.teacherName}</div>
            </div>
            <input
              type="password"
              placeholder="设置登录密码"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full bg-neutral-100 rounded-xl p-3 font-bold outline-none focus:ring-4 ring-[var(--color-duo-purple-dark)]"
              required
            />
            <input
              type="password"
              placeholder="确认登录密码"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="w-full bg-neutral-100 rounded-xl p-3 font-bold outline-none focus:ring-4 ring-[var(--color-duo-purple-dark)]"
              required
            />
            <button type="submit" className="w-full bg-[var(--color-duo-blue)] text-white font-black text-lg rounded-2xl py-3 shadow-btn-blue active:translate-y-1 active:shadow-none transition-all mt-4">
              创建账号
            </button>
            <button type="button" onClick={() => {
              setErrorMsg('');
              setStatusMsg('');
              resetPasswordFields();
              setMode('registerIdentity');
            }} className="w-full text-neutral-500 hover:text-[var(--color-duo-blue)] font-bold text-sm">
              返回修改教师信息
            </button>
          </form>
        )}

        {mode === 'password' && activeTeacher && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="bg-neutral-100 rounded-2xl p-4 text-sm font-bold text-neutral-500 space-y-1">
              <div>{activeTeacher.className}</div>
              <div>{activeTeacher.teacherName}</div>
            </div>
            <input
              type="password"
              placeholder="登录密码"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full bg-neutral-100 rounded-xl p-3 font-bold outline-none focus:ring-4 ring-[var(--color-duo-purple-dark)]"
              required
            />
            <button type="submit" className="w-full bg-[var(--color-duo-purple)] text-white font-black text-lg rounded-2xl py-3 shadow-btn-purple active:translate-y-1 active:shadow-none transition-all">
              进入教师工作台
            </button>
            <button type="button" onClick={handleSwitchAccount} className="w-full text-neutral-400 hover:text-neutral-600 font-bold text-sm">
              切换账号
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function TeacherPanel({ user, setUser }: { user: TeacherUser | null; setUser: (user: TeacherUser | null) => void }) {
  useEffect(() => {
    let unsub = () => {};
    if (user) {
      unsub = initTeacherSync(user.accountKey);
    }
    return () => unsub();
  }, [user]);

  const handleLogout = () => {
    setUser(null);
  };

  const handleSwitchAccount = () => {
    clearRememberedTeacherAccount();
    setUser(null);
  };

  if (!user) {
    return <TeacherAuth setUser={setUser} />;
  }

  return <TeacherDashboard user={user} onLogout={handleLogout} onSwitchAccount={handleSwitchAccount} />;
}

function TeacherDashboard({
  user,
  onLogout,
  onSwitchAccount,
}: {
  user: TeacherUser;
  onLogout: () => void;
  onSwitchAccount: () => void;
}) {
  const { students, settings, loading } = useAppStore();
  const [newStudentName, setNewStudentName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [batchMode, setBatchMode] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [profileColor, setProfileColor] = useState<(typeof colors)[number]>(() => {
    const savedColor = getTeacherAccount(user.accountKey)?.profileColor;
    return colors.includes(savedColor as (typeof colors)[number]) ? (savedColor as (typeof colors)[number]) : 'purple';
  });
  const [currentPassword, setCurrentPassword] = useState('');
  const [nextPassword, setNextPassword] = useState('');
  const [confirmNextPassword, setConfirmNextPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [positiveRuleName, setPositiveRuleName] = useState('');
  const [positiveRulePoints, setPositiveRulePoints] = useState('');
  const [negativeRuleName, setNegativeRuleName] = useState('');
  const [negativeRulePoints, setNegativeRulePoints] = useState('');

  useEffect(() => {
    const savedColor = getTeacherAccount(user.accountKey)?.profileColor;
    setProfileColor(colors.includes(savedColor as (typeof colors)[number]) ? (savedColor as (typeof colors)[number]) : 'purple');
  }, [user.accountKey]);

  const teacherBadge = `${user.teacherName.slice(0, 1) || user.className.slice(0, 1) || '师'}`;

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fireConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#58CC02', '#1CB0F6', '#FFC800', '#FF4B4B'],
    });
  };

  const buildRandomPetType = () => petTypes[Math.floor(Math.random() * petTypes.length)];

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;

    await createTeacherStudent(user.accountKey, {
      id: `std_${Date.now()}`,
      name: newStudentName.trim(),
      nickname: `${newStudentName.trim()}的宠物`,
      eggColor: colors[Math.floor(Math.random() * colors.length)],
      exp: 0,
      level: 1,
      effects: [],
      petType: buildRandomPetType(),
      hatchState: 'egg',
    });
    setNewStudentName('');
    showToast('添加成功！');
  };

  const handleAction = async (points: number, actionName: string) => {
    if (selectedStudents.length === 0) {
      showToast('请先选择学生！', 'error');
      return;
    }

    const promises = selectedStudents.map(async (id) => {
      const student = students.find((item) => item.id === id);
      if (!student) return;

      let newExp = student.exp + points;
      let newLevel = student.level;
      const newEffects = [...student.effects];

      if (points < 0 && newExp < 0) {
        newExp = 0;
      } else if (points > 0) {
        const calculatedLevel = Math.floor(newExp / 50) + 1;
        if (calculatedLevel > newLevel) {
          newLevel = calculatedLevel;
          const available = EVOLUTION_POOL.filter((effect) => !newEffects.includes(effect));
          if (available.length > 0) {
            newEffects.push(available[Math.floor(Math.random() * available.length)]);
          }
          if (selectedStudents.length === 1) fireConfetti();
        }
      }

      await updateTeacherStudentPoints(user.accountKey, id, points, newLevel, newEffects, user.accountKey, actionName);
    });

    await Promise.all(promises);
    showToast(`批量操作成功: ${actionName}`);
  };

  const toggleSelect = (id: string) => {
    setSelectedStudents((prev) => (prev.includes(id) ? prev.filter((studentId) => studentId !== id) : [...prev, id]));
  };

  const handleBatchAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;

    const names = newStudentName.split('\n').map((name) => name.trim()).filter(Boolean);
    if (names.length === 0) return;

    for (const name of names) {
      await createTeacherStudent(user.accountKey, {
        id: `std_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        name,
        nickname: `${name}的宠物`,
        eggColor: colors[Math.floor(Math.random() * colors.length)],
        exp: 0,
        level: 1,
        effects: [],
        petType: buildRandomPetType(),
        hatchState: 'egg',
      });
    }
    setNewStudentName('');
    setBatchMode(false);
    showToast(`成功批量添加 ${names.length} 名学生！`);
  };

  const handleDeleteSelected = async () => {
    if (selectedStudents.length === 0) {
      showToast('请先选择学生！', 'error');
      return;
    }

    if (!window.confirm(`确定删除已选中的 ${selectedStudents.length} 名学生吗？`)) {
      return;
    }

    await deleteTeacherStudents(user.accountKey, selectedStudents);
    setSelectedStudents([]);
    showToast('已删除选中学生');
  };

  const handleAddCustomRule = async (type: 'positive' | 'negative') => {
    const name = (type === 'positive' ? positiveRuleName : negativeRuleName).trim();
    const rawPoints = type === 'positive' ? positiveRulePoints : negativeRulePoints;
    const points = Number(rawPoints);

    if (!name || !Number.isFinite(points) || points <= 0) {
      showToast('请填写事项名称和有效分值', 'error');
      return;
    }

    await addTeacherBehaviorRule(user.accountKey, { name, points, type });

    if (type === 'positive') {
      setPositiveRuleName('');
      setPositiveRulePoints('');
      showToast('已添加加分项');
      return;
    }

    setNegativeRuleName('');
    setNegativeRulePoints('');
    showToast('已添加扣分项');
  };

  const handleProfileColorChange = async (nextColor: (typeof colors)[number]) => {
    if (nextColor === profileColor) {
      return;
    }

    await updateTeacherProfileColor(user.accountKey, nextColor);
    setProfileColor(nextColor);
    showToast('头像颜色已更新');
  };

  const closePasswordModal = () => {
    setPasswordModalOpen(false);
    setCurrentPassword('');
    setNextPassword('');
    setConfirmNextPassword('');
    setPasswordError('');
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (!validateTeacherCredentials(user.accountKey, currentPassword)) {
      setPasswordError('当前密码错误');
      return;
    }

    if (nextPassword.length < 3) {
      setPasswordError('新密码至少 3 位');
      return;
    }

    if (nextPassword !== confirmNextPassword) {
      setPasswordError('两次输入的新密码不一致');
      return;
    }

    await updateTeacherPassword(user.accountKey, nextPassword);
    closePasswordModal();
    showToast('密码修改成功');
  };

  if (loading || !settings) {
    return <div className="min-h-screen flex items-center justify-center bg-neutral-100 text-[var(--color-duo-purple)] font-black text-xl">加载数据中...</div>;
  }

  const filtered = students.filter((student) => student.name.includes(searchTerm));

  return (
    <>
      <div className="min-h-screen bg-neutral-100 flex pb-32 relative">
        <div className="absolute top-6 left-6">
          <Link to="/" className="flex items-center gap-2 text-neutral-500 font-bold hover:text-[var(--color-duo-purple)] transition-colors bg-white px-4 py-2 rounded-xl shadow-sm">
            <Home className="w-5 h-5" /> 返回主页
          </Link>
        </div>
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 20 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className={clsx(
                'fixed top-0 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl shadow-xl font-black flex items-center z-50 gap-2 text-white',
                toast.type === 'error' ? 'bg-[var(--color-duo-red)]' : 'bg-[var(--color-duo-green)]',
              )}
            >
              {toast.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <Check className="w-5 h-5" />} {toast.msg}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 p-8 pt-20 max-w-7xl mx-auto w-full">
          <div className="flex justify-between items-center mb-8 gap-4">
            <div>
              <h1 className="text-4xl font-black text-[var(--color-duo-purple)] mb-2">教师工作台</h1>
              <p className="text-neutral-500 font-bold">批量管理、快捷加减分、密码管理</p>
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => setAccountMenuOpen((open) => !open)}
                className={clsx(
                  'w-14 h-14 rounded-full text-white font-black text-xl shadow-lg border-4 border-white flex items-center justify-center',
                  profileColorClasses[profileColor],
                )}
                aria-label="打开教师账号菜单"
              >
                {teacherBadge}
              </button>
              <AnimatePresence>
                {accountMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    className="absolute right-0 mt-3 w-72 bg-white rounded-3xl border-2 border-neutral-100 shadow-xl p-5 z-40"
                  >
                    <div className="space-y-1 mb-4">
                      <div className="text-lg font-black text-neutral-800">{user.className}</div>
                      <div className="text-sm font-bold text-neutral-500">{user.teacherName}</div>
                    </div>
                    <div className="mb-4">
                      <div className="text-xs font-black text-neutral-400 mb-3">头像颜色</div>
                      <div className="flex gap-3">
                        {colors.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => handleProfileColorChange(color)}
                            className={clsx(
                              'w-8 h-8 rounded-full border-2 transition-transform hover:scale-110',
                              profileColorClasses[color],
                              profileColor === color ? 'border-neutral-800' : 'border-transparent',
                            )}
                            aria-label={`切换为${color}头像颜色`}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => {
                          setPasswordModalOpen(true);
                          setAccountMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-2xl px-4 py-3 font-bold transition-colors"
                      >
                        <KeyRound className="w-4 h-4" /> 修改密码
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAccountMenuOpen(false);
                          onSwitchAccount();
                        }}
                        className="w-full flex items-center gap-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-2xl px-4 py-3 font-bold transition-colors"
                      >
                        <Home className="w-4 h-4" /> 切换账号
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAccountMenuOpen(false);
                          onLogout();
                        }}
                        className="w-full flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-2xl px-4 py-3 font-bold transition-colors"
                      >
                        <LogOut className="w-4 h-4" /> 退出
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex gap-4 mb-4">
                <div className="flex-1 bg-white rounded-2xl flex items-center px-4 border-2 border-neutral-200">
                  <Search className="w-5 h-5 text-neutral-400" />
                  <input
                    className="bg-transparent border-none outline-none p-3 w-full font-bold text-neutral-700"
                    placeholder="搜索学生..."
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                  />
                </div>
                <button
                  onClick={() => setSelectedStudents(students.map((student) => student.id))}
                  className="bg-neutral-200 text-neutral-600 px-4 rounded-2xl font-bold hover:bg-neutral-300"
                >
                  全选
                </button>
                <button
                  onClick={handleDeleteSelected}
                  className="bg-red-100 text-red-600 px-4 rounded-2xl font-bold hover:bg-red-200 disabled:opacity-50"
                  disabled={selectedStudents.length === 0}
                >
                  删除选中
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {filtered.map((student) => {
                  const isSelected = selectedStudents.includes(student.id);
                  const petVisual = getStudentPetVisual(student);
                  return (
                    <motion.div
                      whileTap={{ scale: 0.96 }}
                      key={student.id}
                      onClick={() => toggleSelect(student.id)}
                      className={`cursor-pointer rounded-2xl p-4 border-4 transition-all relative ${isSelected ? 'border-[var(--color-duo-blue)] bg-blue-50' : 'border-transparent bg-white shadow-sm'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={clsx('w-12 h-12 rounded-xl flex items-center justify-center text-2xl relative', petVisual.bg)}>
                          {petVisual.face}
                          {petVisual.readyToHatch && <span className="absolute -top-2 bg-[var(--color-duo-yellow)] text-white text-[9px] px-1.5 py-0.5 rounded-full font-black">可孵化</span>}
                        </div>
                        <div>
                          <div className="font-black text-neutral-800">{student.name}</div>
                          <div className="text-xs font-bold text-neutral-400">EXP: {student.exp} | Lv.{student.level}</div>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="absolute -top-2 -right-2 bg-[var(--color-duo-blue)] rounded-full text-white w-6 h-6 flex items-center justify-center border-2 border-white">
                          <Check className="w-4 h-4" />
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-[2rem] p-6 shadow-sm border-2 border-neutral-100">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-black text-xl text-neutral-800">添加学生</h3>
                  <button
                    onClick={() => setBatchMode(!batchMode)}
                    className="text-sm font-bold text-[var(--color-duo-purple)] hover:opacity-80 transition-opacity"
                  >
                    {batchMode ? '单条模式' : '批量导入'}
                  </button>
                </div>
                <form onSubmit={batchMode ? handleBatchAddStudent : handleAddStudent} className="flex flex-col gap-3 pb-1 lg:pb-0">
                  {batchMode ? (
                    <textarea
                      className="w-full bg-neutral-100 rounded-xl p-3 px-4 font-bold outline-none focus:ring-2 ring-[var(--color-duo-green)] text-neutral-700 min-h-[120px] resize-none"
                      placeholder="输入学生姓名，每行一个"
                      value={newStudentName}
                      onChange={(event) => setNewStudentName(event.target.value)}
                    />
                  ) : (
                    <input
                      className="w-full bg-neutral-100 rounded-xl p-3 px-4 font-bold outline-none focus:ring-2 ring-[var(--color-duo-green)] text-neutral-700"
                      placeholder="输入姓名"
                      value={newStudentName}
                      onChange={(event) => setNewStudentName(event.target.value)}
                    />
                  )}
                  <button type="submit" className="w-full bg-[var(--color-duo-green)] text-white h-12 rounded-[1rem] flex items-center justify-center font-black shadow-btn-green active:translate-y-1 active:shadow-none transition-all">
                    <Plus className="w-5 h-5 mr-1" /> {batchMode ? '批量添加学生' : '添加'}
                  </button>
                </form>
              </div>

              <div className="relative z-10 bg-white rounded-3xl p-6 shadow-sm border-2 border-neutral-100 lg:sticky lg:top-8">
                <h3 className="font-black text-xl mb-2 text-neutral-800">快捷操作</h3>
                <p className="text-sm text-neutral-400 font-bold mb-4">
                  当前选中: <span className="text-[var(--color-duo-blue)]">{selectedStudents.length}</span> 人
                </p>

                <div className="space-y-6">
                  <div>
                    <div className="text-sm font-black text-[var(--color-duo-green)] mb-3 flex items-center gap-1"><Plus className="w-4 h-4" /> 正向行为 (加分)</div>
                    <div className="flex flex-wrap gap-2">
                      {settings.rules.filter((rule) => rule.type === 'positive').map((rule) => (
                        <button
                          key={rule.id}
                          onClick={() => handleAction(rule.points, rule.name)}
                          className="min-h-11 bg-green-50 text-green-700 border-2 border-green-200 hover:bg-green-100 font-bold py-2 px-3 rounded-xl text-sm transition-colors"
                        >
                          {rule.name} (+{rule.points})
                        </button>
                      ))}
                    </div>
                    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_96px]">
                      <input
                        className="min-h-11 bg-neutral-100 border-2 border-transparent rounded-xl px-4 py-3 font-bold text-sm text-neutral-700 outline-none focus:border-[var(--color-duo-green)] focus:bg-white"
                        placeholder="新增加分事项"
                        value={positiveRuleName}
                        onChange={(event) => setPositiveRuleName(event.target.value)}
                      />
                      <input
                        className="min-h-11 bg-neutral-100 border-2 border-transparent rounded-xl px-4 py-3 font-bold text-sm text-neutral-700 outline-none focus:border-[var(--color-duo-green)] focus:bg-white"
                        placeholder="加分分值"
                        inputMode="numeric"
                        value={positiveRulePoints}
                        onChange={(event) => setPositiveRulePoints(event.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => handleAddCustomRule('positive')}
                        className="w-full min-h-11 sm:col-span-2 bg-[var(--color-duo-green)] text-white font-black px-4 rounded-xl text-sm shadow-btn-green active:translate-y-1 active:shadow-none transition-all"
                      >
                        添加加分项
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-black text-[var(--color-duo-red)] mb-3 flex items-center gap-1"><AlertCircle className="w-4 h-4" /> 负向行为 (扣分)</div>
                    <div className="flex flex-wrap gap-2">
                      {settings.rules.filter((rule) => rule.type === 'negative').map((rule) => (
                        <button
                          key={rule.id}
                          onClick={() => handleAction(rule.points, rule.name)}
                          className="min-h-11 bg-red-50 text-red-700 border-2 border-red-200 hover:bg-red-100 font-bold py-2 px-3 rounded-xl text-sm transition-colors"
                        >
                          {rule.name} ({rule.points})
                        </button>
                      ))}
                    </div>
                    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_96px]">
                      <input
                        className="min-h-11 bg-neutral-100 border-2 border-transparent rounded-xl px-4 py-3 font-bold text-sm text-neutral-700 outline-none focus:border-[var(--color-duo-red)] focus:bg-white"
                        placeholder="新增扣分事项"
                        value={negativeRuleName}
                        onChange={(event) => setNegativeRuleName(event.target.value)}
                      />
                      <input
                        className="min-h-11 bg-neutral-100 border-2 border-transparent rounded-xl px-4 py-3 font-bold text-sm text-neutral-700 outline-none focus:border-[var(--color-duo-red)] focus:bg-white"
                        placeholder="扣分分值"
                        inputMode="numeric"
                        value={negativeRulePoints}
                        onChange={(event) => setNegativeRulePoints(event.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => handleAddCustomRule('negative')}
                        className="w-full min-h-11 sm:col-span-2 bg-[var(--color-duo-red)] text-white font-black px-4 rounded-xl text-sm shadow-btn-red active:translate-y-1 active:shadow-none transition-all"
                      >
                        添加扣分项
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {passwordModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closePasswordModal}
              className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.96 }}
              className="relative z-10 bg-white rounded-[2rem] shadow-xl border-2 border-neutral-100 p-6 w-full max-w-md"
            >
              <div className="flex items-center gap-2 text-neutral-800 font-black text-xl mb-5">
                <KeyRound className="w-5 h-5 text-[var(--color-duo-purple)]" /> 修改密码
              </div>
              {passwordError && <p className="text-red-500 font-bold text-sm mb-4">{passwordError}</p>}
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <input
                  type="password"
                  placeholder="当前密码"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  className="w-full bg-neutral-100 rounded-xl p-3 font-bold outline-none focus:ring-4 ring-[var(--color-duo-purple-dark)]"
                  required
                />
                <input
                  type="password"
                  placeholder="新密码"
                  value={nextPassword}
                  onChange={(event) => setNextPassword(event.target.value)}
                  className="w-full bg-neutral-100 rounded-xl p-3 font-bold outline-none focus:ring-4 ring-[var(--color-duo-purple-dark)]"
                  required
                />
                <input
                  type="password"
                  placeholder="确认新密码"
                  value={confirmNextPassword}
                  onChange={(event) => setConfirmNextPassword(event.target.value)}
                  className="w-full bg-neutral-100 rounded-xl p-3 font-bold outline-none focus:ring-4 ring-[var(--color-duo-purple-dark)]"
                  required
                />
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closePasswordModal}
                    className="flex-1 bg-neutral-100 text-neutral-600 font-black rounded-2xl py-3"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-[var(--color-duo-purple)] text-white font-black rounded-2xl py-3 shadow-btn-purple active:translate-y-1 active:shadow-none transition-all"
                  >
                    保存密码
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
