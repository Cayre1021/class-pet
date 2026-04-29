import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAppStore, initSync } from '../lib/store';
import { BehaviorLog } from '../lib/db';
import PetCard from '../components/PetCard';
import { Search, ChevronLeft, Calendar, Home } from 'lucide-react';
import { motion } from 'framer-motion';

export default function StudentQuery() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { students, loading } = useAppStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [logs, setLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  useEffect(() => {
    const unsub = initSync();
    return () => unsub();
  }, []);

  useEffect(() => {
    if (id) {
      // Fetch logs
      const fetchLogs = async () => {
        setLogsLoading(true);
        // Using localStorage for logs
        try {
          const allLogsStr = localStorage.getItem('class_pet_logs');
          const allLogs = allLogsStr ? JSON.parse(allLogsStr) : [];
          let fetched = allLogs.filter((log: any) => log.studentId === id);
          fetched.sort((a: any, b: any) => b.timestamp - a.timestamp);
          setLogs(fetched);
        } catch (e) {
          console.error(e);
        }
        setLogsLoading(false);
      };
      fetchLogs();
    }
  }, [id]);

  if (loading) return <div className="text-center p-8">加载中...</div>;

  if (!id) {
    const filtered = students.filter(s => s.name.includes(searchTerm));
    return (
      <div className="min-h-screen bg-neutral-100 p-6 flex flex-col items-center relative">
        <div className="absolute top-6 left-6">
          <Link to="/" className="flex items-center gap-2 text-neutral-500 font-bold hover:text-[var(--color-duo-yellow-dark)] transition-colors bg-white px-4 py-2 rounded-xl shadow-sm">
            <Home className="w-5 h-5"/> 返回主页
          </Link>
        </div>
        
        <div className="max-w-md w-full mt-10 text-center mb-8">
          <h1 className="text-3xl font-black text-[var(--color-duo-yellow-dark)] mb-2">学生查询中心</h1>
          <p className="text-neutral-500 font-bold">请选择你的名字，查看宠物状态</p>
        </div>
        
        <div className="max-w-md w-full bg-white rounded-[2rem] p-6 shadow-sm border-2 border-neutral-100">
          <div className="flex bg-neutral-100 rounded-xl p-3 mb-6 items-center">
             <Search className="w-5 h-5 text-neutral-400 mr-2" />
             <input 
              className="bg-transparent border-none outline-none w-full font-bold text-neutral-700" 
              placeholder="输入姓名搜索..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
             />
          </div>
          <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-2">
            {filtered.map(student => (
              <motion.div 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                key={student.id} 
                onClick={() => navigate(`/student/${student.id}`)}
                className="bg-neutral-50 p-4 rounded-2xl flex items-center justify-between cursor-pointer border-2 border-transparent hover:border-[var(--color-duo-yellow)] transition-colors"
              >
                <span className="font-black text-neutral-700 text-lg">{student.name}</span>
                <span className="text-[var(--color-duo-yellow-dark)] font-bold">Lv.{student.level}</span>
              </motion.div>
            ))}
            {filtered.length === 0 && <div className="text-center text-neutral-400 py-4 font-bold">没找到对应的名字哦</div>}
          </div>
        </div>
      </div>
    );
  }

  const student = students.find(s => s.id === id);
  if (!student) return <div>未找到学生</div>;

  return (
    <div className="min-h-screen bg-neutral-100 p-6 md:p-12">
      <div className="max-w-4xl mx-auto flex flex-col lg:flex-row gap-8">
        
        {/* Left Side: Pet Card Profile */}
        <div className="w-full lg:w-1/3 space-y-6">
          <button 
            onClick={() => navigate('/student')}
            className="flex items-center gap-2 text-neutral-500 font-bold hover:text-neutral-800 transition-colors bg-white px-4 py-2 rounded-xl shadow-sm w-fit active:translate-y-1"
          >
            <ChevronLeft className="w-4 h-4"/> 返回列表
          </button>
          
          {/* We reuse the PetCard but make it a bit larger by wrapping. It scales reasonably. */}
          <div className="transform scale-100 origin-top">
            <PetCard student={student} />
          </div>
        </div>

        {/* Right Side: Bill & Records */}
        <div className="w-full lg:w-2/3">
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border-2 border-neutral-100 min-h-[500px]">
             <h2 className="text-2xl font-black text-neutral-800 mb-6 flex items-center gap-2">
               <Calendar className="w-6 h-6 text-[var(--color-duo-blue)]" /> 积分进化账单
             </h2>
             
             {logsLoading ? (
               <div className="text-neutral-400 font-bold">读取中...</div>
             ) : logs.length === 0 ? (
               <div className="text-center py-20">
                 <div className="text-4xl mb-4">📭</div>
                 <p className="text-neutral-400 font-bold">还没有记录哦，继续加油吧！</p>
               </div>
             ) : (
               <div className="space-y-4">
                 {logs.map(log => (
                   <div key={log.id} className="flex items-center justify-between p-4 bg-neutral-50 rounded-2xl border-2 border-neutral-100">
                     <div>
                       <div className="font-black text-neutral-700 text-lg">{log.actionName}</div>
                       <div className="text-xs font-bold text-neutral-400">
                         {new Date(log.timestamp).toLocaleString()}
                       </div>
                     </div>
                     <div className={`font-black text-2xl ${log.points > 0 ? 'text-[var(--color-duo-green)]' : 'text-[var(--color-duo-red)]'}`}>
                       {log.points > 0 ? '+' : ''}{log.points}
                     </div>
                   </div>
                 ))}
               </div>
             )}
          </div>
        </div>

      </div>
    </div>
  );
}
