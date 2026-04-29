import { useEffect } from 'react';
import { useAppStore, initSync } from '../lib/store';
import { motion } from 'framer-motion';
import AIAssistant from '../components/AIAssistant';
import PetCard from '../components/PetCard';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export default function BigScreen() {
  const { students, loading } = useAppStore();

  useEffect(() => {
    const unsub = initSync();
    return () => unsub();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center font-black text-2xl text-[var(--color-duo-gray-dark)]">加载中...</div>;
  }

  // Sort by updated time (recent interaction) or just points
  const sortedStudents = [...students].sort((a, b) => b.exp - a.exp);

  return (
    <div className="min-h-screen bg-neutral-100 p-8 pb-32 relative">
      <div className="absolute top-6 left-6">
        <Link to="/" className="flex items-center gap-2 text-neutral-500 font-bold hover:text-[var(--color-duo-blue)] transition-colors bg-white px-4 py-2 rounded-xl shadow-sm">
          <Home className="w-5 h-5"/> 返回主页
        </Link>
      </div>

      <div className="max-w-7xl mx-auto pt-10">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-black text-[var(--color-duo-blue-dark)]">班级宠物大屏</h1>
          <div className="bg-white rounded-2xl px-6 py-3 font-bold text-neutral-600 shadow-sm">
            班级总宠物数: <span className="text-[var(--color-duo-green)] text-xl pl-2">{sortedStudents.length}</span>
          </div>
        </div>

        {sortedStudents.length === 0 ? (
          <div className="text-center py-20 text-[var(--color-duo-gray-dark)] font-bold text-xl">
            还没有学生蛋哦，请老师导入名单
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {sortedStudents.map((student, i) => (
              <PetCard key={student.id} student={student} delay={i * 0.05} />
            ))}
          </div>
        )}
      </div>

      <AIAssistant />
    </div>
  );
}
