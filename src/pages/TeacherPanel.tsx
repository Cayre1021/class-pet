import React, { useState, useEffect } from 'react';
import { useAppStore, initSync } from '../lib/store';
import { createStudent, updateStudentPoints, updateClassPin } from '../lib/db';
import { LogOut, Plus, Search, Check, AlertCircle, Home, KeyRound } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';

const colors = ['red', 'blue', 'green', 'purple', 'yellow'];
const EVOLUTION_POOL = ['Crown', 'Wings', 'Star', 'Aura', 'Glasses'];

function TeacherAuth({
  setUser,
  successMsg,
}: {
  setUser: (user: { uid: string } | null) => void;
  successMsg?: string;
}) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [grade, setGrade] = useState('');
  const [className, setClassName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      if (isLogin) {
        // Mock login
        const storedUsers = JSON.parse(localStorage.getItem('class_pet_users') || '{}');
        if (storedUsers[email] && storedUsers[email].password === password) {
          localStorage.setItem('class_pet_auth_user', email);
          setUser({ uid: email });
        } else {
          setErrorMsg('邮箱或密码错误');
        }
      } else {
        if (password !== confirmPassword) {
          setErrorMsg('两次输入的密码不一致');
          return;
        }
        if (!email || !password || !teacherName || !grade || !className) {
          setErrorMsg('请填写所有必填字段');
          return;
        }
        
        const storedUsers = JSON.parse(localStorage.getItem('class_pet_users') || '{}');
        if (storedUsers[email]) {
          setErrorMsg('该邮箱已被注册');
          return;
        }
        
        storedUsers[email] = { password, teacherName, grade, className };
        localStorage.setItem('class_pet_users', JSON.stringify(storedUsers));
        localStorage.setItem('class_pet_auth_user', email);
        setUser({ uid: email });
      }
    } catch (err: any) {
      setErrorMsg(err.message || '认证失败，请重试');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-100 p-4">
      <div className="absolute top-6 left-6">
        <Link to="/" className="flex items-center gap-2 text-neutral-500 font-bold hover:text-neutral-800 transition-colors bg-white px-4 py-2 rounded-xl shadow-sm">
          <Home className="w-4 h-4"/> 返回首页
        </Link>
      </div>
      <div className="bg-white p-8 rounded-3xl shadow-lg max-w-sm w-full border-4 border-neutral-100">
        <h2 className="text-2xl font-black text-center text-[var(--color-duo-purple)] mb-6">
          {isLogin ? '👑 教师登录' : '🌟 注册新账号'}
        </h2>
        {successMsg && <p className="text-[var(--color-duo-green-dark)] font-bold text-sm text-center mb-4">{successMsg}</p>}
        {errorMsg && <p className="text-red-500 font-bold text-sm text-center mb-4">{errorMsg}</p>}
        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <>
              <input type="text" placeholder="教师名称" value={teacherName} onChange={e => setTeacherName(e.target.value)} className="w-full bg-neutral-100 rounded-xl p-3 font-bold outline-none focus:ring-4 ring-[var(--color-duo-purple-dark)]" required />
              <input type="text" placeholder="年级 (如: 三年级)" value={grade} onChange={e => setGrade(e.target.value)} className="w-full bg-neutral-100 rounded-xl p-3 font-bold outline-none focus:ring-4 ring-[var(--color-duo-purple-dark)]" required />
              <input type="text" placeholder="班级 (如: 2班)" value={className} onChange={e => setClassName(e.target.value)} className="w-full bg-neutral-100 rounded-xl p-3 font-bold outline-none focus:ring-4 ring-[var(--color-duo-purple-dark)]" required />
            </>
          )}
          <input type="email" placeholder="邮箱账号" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-neutral-100 rounded-xl p-3 font-bold outline-none focus:ring-4 ring-[var(--color-duo-purple-dark)]" required />
          <input type="password" placeholder="密码" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-neutral-100 rounded-xl p-3 font-bold outline-none focus:ring-4 ring-[var(--color-duo-purple-dark)]" required />
          {!isLogin && (
            <input type="password" placeholder="确认密码" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full bg-neutral-100 rounded-xl p-3 font-bold outline-none focus:ring-4 ring-[var(--color-duo-purple-dark)]" required />
          )}
          <button type="submit" className="w-full bg-[var(--color-duo-blue)] text-white font-black text-lg rounded-2xl py-3 shadow-btn-blue active:translate-y-1 active:shadow-none transition-all mt-4">
            {isLogin ? '登录' : '同意并注册'}
          </button>
        </form>
        <div className="mt-6 text-center">
          <button onClick={() => setIsLogin(!isLogin)} className="text-neutral-500 hover:text-[var(--color-duo-blue)] font-bold text-sm">
            {isLogin ? '还没有账号？点击注册' : '已有账号？点击登录'}
          </button>
        </div>
      </div>
    </div>
  );
}

type TeacherUser = { uid: string };

export default function TeacherPanel({ user, setUser }: { user: TeacherUser | null, setUser: (user: TeacherUser | null) => void }) {
  const { settings, loading } = useAppStore();
  const [unlocked, setUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authSuccessMsg, setAuthSuccessMsg] = useState('');

  const handleLogout = () => {
    localStorage.removeItem('class_pet_auth_user');
    setUnlocked(false);
    setPasswordInput('');
    setAuthSuccessMsg('');
    setUser(null);
  };

  useEffect(() => {
    let unsub = () => {};
    if (user) {
      unsub = initSync();
    }
    return () => unsub();
  }, [user]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (settings?.classPin && passwordInput === settings.classPin) {
      setUnlocked(true);
    } else {
      alert("密码错误");
    }
  };

  const handleSetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput.length < 3) {
      alert("密码至少 3 位");
      return;
    }
    await updateClassPin(passwordInput);
    localStorage.removeItem('class_pet_auth_user');
    setUnlocked(false);
    setPasswordInput('');
    setAuthSuccessMsg('班级管理密码设置成功，请使用新密码重新登录');
    setUser(null);
  };

  if (!user) {
    return <TeacherAuth setUser={setUser} successMsg={authSuccessMsg} />;
  }

  if (loading || !settings) {
    return <div className="min-h-screen flex items-center justify-center bg-neutral-100 text-[var(--color-duo-purple)] font-black text-xl">加载数据中...</div>;
  }

  if (!settings.classPin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-100 p-4">
        <div className="bg-white p-8 rounded-3xl shadow-lg max-w-sm w-full text-center border-4 border-neutral-100">
          <h2 className="text-2xl font-black text-[var(--color-duo-green)] mb-4">🎉 欢迎! 首次配置</h2>
          <p className="text-neutral-500 font-bold mb-6 text-sm">为保障班级数据安全，请设置一个您的专属管理密码。</p>
          <form onSubmit={handleSetPin}>
            <input 
              type="password" 
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="w-full bg-neutral-100 rounded-xl p-4 font-bold text-center text-xl mb-4 outline-none focus:ring-4 ring-[var(--color-duo-green-dark)]"
              placeholder="输入新密码"
            />
            <button 
              type="submit"
              className="w-full bg-[var(--color-duo-green)] text-white font-black text-lg rounded-2xl py-3 shadow-btn-green active:translate-y-1 active:shadow-none transition-all"
            >
              设置密码并进入
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!unlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-100 p-4">
        <div className="absolute top-6 left-6">
          <Link to="/" className="flex items-center gap-2 text-neutral-500 font-bold hover:text-neutral-800 transition-colors bg-white px-4 py-2 rounded-xl shadow-sm">
            <Home className="w-4 h-4"/> 返回首页
          </Link>
        </div>
        <div className="bg-white p-8 rounded-3xl shadow-lg max-w-sm w-full text-center border-4 border-neutral-100">
          <h2 className="text-2xl font-black text-[var(--color-duo-purple)] mb-4">🔒 安全验证</h2>
          <p className="text-neutral-500 font-bold mb-6 text-sm">请输入班级管理密码</p>
          <form onSubmit={handleUnlock}>
            <input 
              type="password" 
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="w-full bg-neutral-100 rounded-xl p-4 font-bold text-center text-xl mb-4 outline-none focus:ring-4 ring-[var(--color-duo-purple-dark)]"
              placeholder="密码"
            />
            <button 
              type="submit"
              className="w-full bg-[var(--color-duo-purple)] text-white font-black text-lg rounded-2xl py-3 shadow-btn-purple active:translate-y-1 active:shadow-none transition-all"
            >
              验证进入
            </button>
          </form>
          <button
            onClick={handleLogout}
            className="mt-6 text-neutral-400 hover:text-neutral-600 font-bold text-sm"
          >
            切换账号退出
          </button>
        </div>
      </div>
    );
  }

  return <TeacherDashboard user={user} onLogout={handleLogout} />;
}

function TeacherDashboard({ user, onLogout }: { user: TeacherUser; onLogout: () => void }) {
  const { students, settings, loading } = useAppStore();
  const [newStudentName, setNewStudentName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [toast, setToast] = useState<{msg: string, type: string} | null>(null);

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;
    
    await createStudent({
      id: "std_" + Date.now(),
      name: newStudentName.trim(),
      nickname: newStudentName.trim() + "的宠物",
      eggColor: colors[Math.floor(Math.random() * colors.length)],
      exp: 0,
      level: 1,
      effects: [],
    });
    setNewStudentName("");
    showToast("添加成功！");
  };

  const showToast = (msg: string) => {
    setToast({ msg, type: 'success' });
    setTimeout(() => setToast(null), 3000);
  };

  const fireConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#58CC02', '#1CB0F6', '#FFC800', '#FF4B4B']
    });
  };

  const handleAction = async (points: number, actionName: string) => {
    if (selectedStudents.length === 0) {
      alert("请先选择学生！");
      return;
    }

    const promises = selectedStudents.map(async (id) => {
      const student = students.find(s => s.id === id);
      if (!student) return;
      
      let newExp = student.exp + points;
      let newLevel = student.level;
      let newEffects = [...student.effects];

      // PRD: No level down on negative points
      if (points < 0 && newExp < 0) {
        newExp = 0; 
      } else if (points > 0) {
        // Evaluate level up (e.g. 50 exp per level)
        const calculatedLevel = Math.floor(newExp / 50) + 1;
        if (calculatedLevel > newLevel) {
          newLevel = calculatedLevel;
          // Unlock an effect
          const available = EVOLUTION_POOL.filter(e => !newEffects.includes(e));
          if (available.length > 0) {
            newEffects.push(available[Math.floor(Math.random() * available.length)]);
          }
          if (selectedStudents.length === 1) fireConfetti();
        }
      }

      await updateStudentPoints(id, points, newLevel, newEffects, user.uid, actionName);
    });

    await Promise.all(promises);
    showToast(`批量操作成功: ${actionName}`);
    // Do not clear selected students to allow continuous action
    // setSelectedStudents([]);
  };

  const toggleSelect = (id: string) => {
    setSelectedStudents(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const [batchMode, setBatchMode] = useState(false);

  const handleBatchAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;
    
    const names = newStudentName.split('\n').map(n => n.trim()).filter(n => n);
    if (names.length === 0) return;

    for (const name of names) {
      await createStudent({
        id: "std_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
        name: name,
        nickname: name + "的宠物",
        eggColor: colors[Math.floor(Math.random() * colors.length)],
        exp: 0,
        level: 1,
        effects: [],
      });
    }
    setNewStudentName("");
    setBatchMode(false);
    showToast(`成功批量添加 ${names.length} 名学生！`);
  };

  if (loading) return <div>Loading...</div>;

  const filtered = students.filter(s => s.name.includes(searchTerm));

  return (
    <div className="min-h-screen bg-neutral-100 flex pb-32 relative">
      <div className="absolute top-6 left-6">
        <Link to="/" className="flex items-center gap-2 text-neutral-500 font-bold hover:text-[var(--color-duo-purple)] transition-colors bg-white px-4 py-2 rounded-xl shadow-sm">
          <Home className="w-5 h-5"/> 返回主页
        </Link>
      </div>
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 20 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed top-0 left-1/2 -translate-x-1/2 bg-[var(--color-duo-green)] text-white px-6 py-3 rounded-2xl shadow-xl font-black flex items-center z-50 gap-2"
          >
            <Check className="w-5 h-5"/> {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 p-8 pt-20 max-w-7xl mx-auto w-full">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-black text-[var(--color-duo-purple)] mb-2">教师工作台</h1>
            <p className="text-neutral-500 font-bold">批量管理、快捷加减分、密码管理</p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={async () => {
                const newPin = prompt("请输入新的班级管理密码（至少3位）：");
                if (newPin && newPin.length >= 3) {
                  await updateClassPin(newPin);
                  alert("密码修改成功！");
                } else if (newPin !== null) {
                  alert("密码修改失败：至少需要3位");
                }
              }}
              className="flex items-center gap-2 text-neutral-400 hover:text-[var(--color-duo-purple)] font-bold transition-colors"
            >
              <KeyRound className="w-5 h-5" /> 修改密码
            </button>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 text-neutral-400 hover:text-red-500 font-bold transition-colors"
            >
              <LogOut className="w-5 h-5" /> 退出
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex gap-4 mb-4">
              <div className="flex-1 bg-white rounded-2xl flex items-center px-4 border-2 border-neutral-200">
                <Search className="w-5 h-5 text-neutral-400" />
                <input 
                  className="bg-transparent border-none outline-none p-3 w-full font-bold text-neutral-700" 
                  placeholder="搜索学生..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <button 
                onClick={() => setSelectedStudents(students.map(s => s.id))}
                className="bg-neutral-200 text-neutral-600 px-4 rounded-2xl font-bold hover:bg-neutral-300"
              >
                全选
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {filtered.map(student => {
                const isSelected = selectedStudents.includes(student.id);
                return (
                  <motion.div 
                    whileTap={{ scale: 0.96 }}
                    key={student.id}
                    onClick={() => toggleSelect(student.id)}
                    className={`cursor-pointer rounded-2xl p-4 border-4 transition-all relative ${isSelected ? 'border-[var(--color-duo-blue)] bg-blue-50' : 'border-transparent bg-white shadow-sm'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-neutral-100 rounded-xl flex items-center justify-center text-2xl">
                         {/* Simple visual fallback for teacher view */}
                         {student.level >= 5 ? '🐉' : (student.level >= 2 ? '🐥' : '🥚')}
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
                )
              })}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Add Student */}
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border-2 border-neutral-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-black text-xl text-neutral-800">添加学生</h3>
                <button 
                  onClick={() => setBatchMode(!batchMode)} 
                  className="text-sm font-bold text-[var(--color-duo-purple)] hover:opacity-80 transition-opacity"
                >
                  {batchMode ? "单条模式" : "批量导入"}
                </button>
              </div>
              <form onSubmit={batchMode ? handleBatchAddStudent : handleAddStudent} className="flex flex-col gap-3 pb-1 lg:pb-0">
                {batchMode ? (
                  <textarea 
                    className="w-full bg-neutral-100 rounded-xl p-3 px-4 font-bold outline-none focus:ring-2 ring-[var(--color-duo-green)] text-neutral-700 min-h-[120px] resize-none" 
                    placeholder="输入学生姓名，每行一个"
                    value={newStudentName}
                    onChange={e => setNewStudentName(e.target.value)}
                  />
                ) : (
                  <input 
                    className="w-full bg-neutral-100 rounded-xl p-3 px-4 font-bold outline-none focus:ring-2 ring-[var(--color-duo-green)] text-neutral-700" 
                    placeholder="输入姓名"
                    value={newStudentName}
                    onChange={e => setNewStudentName(e.target.value)}
                  />
                )}
                <button type="submit" className="w-full bg-[var(--color-duo-green)] text-white h-12 rounded-[1rem] flex items-center justify-center font-black shadow-btn-green active:translate-y-1 active:shadow-none transition-all">
                  <Plus className="w-5 h-5 mr-1" /> {batchMode ? "批量添加学生" : "添加"}
                </button>
              </form>
            </div>

            {/* Actions panel */}
            <div className="bg-white rounded-3xl justify-center items-center p-6 shadow-sm border-2 border-neutral-100 sticky top-8">
              <h3 className="font-black text-xl mb-2 text-neutral-800">快捷操作</h3>
              <p className="text-sm text-neutral-400 font-bold mb-4">
                当前选中: <span className="text-[var(--color-duo-blue)]">{selectedStudents.length}</span> 人
              </p>

              <div className="space-y-6">
                <div>
                  <div className="text-sm font-black text-[var(--color-duo-green)] mb-3 flex items-center gap-1"><Plus className="w-4 h-4"/> 正向行为 (加分)</div>
                  <div className="flex flex-wrap gap-2">
                    {settings?.rules.filter(r => r.type === 'positive').map(rule => (
                      <button 
                        key={rule.id}
                        onClick={() => handleAction(rule.points, rule.name)}
                        className="bg-green-50 text-green-700 border-2 border-green-200 hover:bg-green-100 font-bold py-2 px-3 rounded-xl text-sm transition-colors"
                      >
                        {rule.name} (+{rule.points})
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-black text-[var(--color-duo-red)] mb-3 flex items-center gap-1"><AlertCircle className="w-4 h-4"/> 负向行为 (扣分)</div>
                  <div className="flex flex-wrap gap-2">
                    {settings?.rules.filter(r => r.type === 'negative').map(rule => (
                      <button 
                        key={rule.id}
                        onClick={() => handleAction(rule.points, rule.name)}
                        className="bg-red-50 text-red-700 border-2 border-red-200 hover:bg-red-100 font-bold py-2 px-3 rounded-xl text-sm transition-colors"
                      >
                        {rule.name} ({rule.points})
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}
