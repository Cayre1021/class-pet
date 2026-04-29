import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Portal() {
  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <motion.h1 
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            className="text-4xl md:text-5xl font-black text-[var(--color-duo-green-dark)] mb-4"
          >
            班级电子宠物平台
          </motion.h1>
          <p className="text-xl text-[var(--color-duo-gray-dark)] font-bold">Classroom Virtual Pets</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <PortalCard 
            to="/screen"
            color="bg-[var(--color-duo-blue)]"
            title="👨‍🏫 大屏展示"
            desc="全班萌宠 一览无余"
            shadowClassName="shadow-btn-blue"
            delay={0.1}
          />
          <PortalCard 
            to="/admin"
            color="bg-[var(--color-duo-purple)]"
            title="👑 教师管理"
            desc="快捷加分 班级调整"
            shadowClassName="shadow-[#A562D6]"
            delay={0.2}
          />
          <PortalCard 
            to="/student"
            color="bg-[var(--color-duo-yellow)]"
            title="👦 学生查询"
            desc="我的宠物 成长账单"
            shadowClassName="shadow-btn-yellow"
            delay={0.3}
          />
        </div>
      </div>
    </div>
  );
}

function PortalCard({ to, color, title, desc, shadowClassName, delay }: any) {
  return (
    <Link to={to} className="block">
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20, delay }}
        whileHover={{ y: -4, scale: 1.02 }}
        whileTap={{ y: 4, scale: 0.98, boxShadow: "0 0 0 transparent" }}
        className={`rounded-3xl p-8 text-white ${color} ${shadowClassName} cursor-pointer transition-transform`}
        style={{ boxShadow: shadowClassName.includes('box-shadow') ? '' : undefined }}
      >
        <h2 className="text-2xl font-black mb-2">{title}</h2>
        <p className="opacity-90 font-bold">{desc}</p>
      </motion.div>
    </Link>
  );
}
