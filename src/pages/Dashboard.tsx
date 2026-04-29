import { useEffect } from 'react';
import { useAppStore, initSync } from '../lib/store';
import { motion } from 'framer-motion';
import { Trophy, TrendingUp, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { students, loading } = useAppStore();

  useEffect(() => {
    const unsub = initSync();
    return () => unsub();
  }, []);

  if (loading) return <div>Loading...</div>;

  const totalPoints = students.reduce((acc, s) => acc + s.exp, 0);
  const sorted = [...students].sort((a, b) => b.exp - a.exp);
  const top5 = sorted.slice(0, 5);

  return (
    <div className="min-h-screen bg-neutral-100 p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black text-neutral-800 tracking-tight">班级仪表盘</h1>
            <p className="text-neutral-500 font-bold mt-1">数据总览与排行榜</p>
          </div>
          <Link to="/" className="text-[var(--color-duo-blue)] font-bold hover:underline">返回首页</Link>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="班级总学分" value={totalPoints} icon={<TrendingUp />} color="text-[var(--color-duo-blue)]" />
          <StatCard title="总宠物数" value={students.length} icon={<Users />} color="text-[var(--color-duo-green)]" />
          <StatCard title="平均等级" value={students.length ? (students.reduce((a, b) => a + b.level, 0) / students.length).toFixed(1) : 0} icon={<Trophy />} color="text-[var(--color-duo-yellow-dark)]" />
        </div>

        {/* Top 5 */}
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border-2 border-neutral-100">
          <h2 className="text-2xl font-black text-neutral-800 mb-6 flex items-center gap-2">
            <Trophy className="text-[var(--color-duo-yellow-dark)] w-8 h-8" /> 进化荣誉榜 Top 5
          </h2>
          <div className="space-y-4">
            {top5.map((student, index) => (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                key={student.id} 
                className="flex items-center gap-4 p-4 rounded-2xl bg-neutral-50 border-2 border-transparent hover:border-[var(--color-duo-yellow)] transition-all"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xl shadow-sm ${index === 0 ? 'bg-[var(--color-duo-yellow)] text-white' : index === 1 ? 'bg-neutral-300 text-white' : index === 2 ? 'bg-orange-300 text-white' : 'bg-neutral-200 text-neutral-500'}`}>
                  {index + 1}
                </div>
                <div className="w-14 h-14 bg-white rounded-xl shadow-inner flex items-center justify-center text-3xl">
                  {student.level >= 5 ? '🐉' : (student.level >= 2 ? '🐥' : '🥚')}
                </div>
                <div className="flex-1">
                  <div className="font-black text-neutral-800 text-xl">{student.name}</div>
                  <div className="text-sm font-bold text-neutral-400">{student.nickname}</div>
                </div>
                <div className="text-right">
                  <div className="text-[var(--color-duo-green)] font-black text-2xl">{student.exp} <span className="text-sm text-neutral-400">EXP</span></div>
                  <div className="text-[var(--color-duo-yellow-dark)] font-bold text-sm">Lv.{student.level}</div>
                </div>
              </motion.div>
            ))}
            {top5.length === 0 && <div className="text-center text-neutral-400 py-10 font-bold">榜单还是空的哦</div>}
          </div>
        </div>

      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: any) {
  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="bg-white p-6 rounded-[2rem] shadow-sm border-2 border-neutral-100 flex items-center gap-4"
    >
      <div className={`w-14 h-14 rounded-2xl bg-neutral-50 flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <div className="text-neutral-400 font-bold text-sm">{title}</div>
        <div className={`text-4xl font-black ${color}`}>{value}</div>
      </div>
    </motion.div>
  );
}
