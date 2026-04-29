import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Student, updateStudentInteraction } from '../lib/db';
import { generatePetReply } from '../lib/ai';
import { X } from 'lucide-react';
import clsx from 'clsx';

export interface PetCardProps {
  key?: React.Key;
  student: Student;
  delay?: number;
  hideChat?: boolean;
}

export default function PetCard({ student, delay = 0, hideChat = false }: PetCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [interactionEffect, setInteractionEffect] = useState<string | null>(null);
  
  // Calculate Mood: 100 - (hours since last interaction * 2). Minimum 10
  const hoursSince = (Date.now() - student.lastInteractionTime) / (1000 * 60 * 60);
  const mood = Math.max(10, Math.min(100, 100 - hoursSince * 5));
  
  const handleOpenModal = () => {
    if (hideChat) return;
    setIsModalOpen(true);
  };

  const closeModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsModalOpen(false);
    setShowChat(false);
  };

  const handleInteractWithPet = async () => {
    updateStudentInteraction(student.id);
    setShowChat(true);
    setIsTyping(true);
    const greetings = ["摸摸头～", "你好呀！", "今天过得好吗？", "有什么开心的事？", "哇哦！", "我好喜欢你陪我！"];
    const greeting = greetings[Math.floor(Math.random() * greetings.length)];
    const reply = await generatePetReply(student.name, greeting, student.exp);
    setChatMessage(reply);
    setIsTyping(false);

    setTimeout(() => {
      setShowChat(false);
    }, 5000);
  };

  const handleAction = async (actionType: string) => {
    updateStudentInteraction(student.id);
    let emoji = "✨";
    let message = "";
    if (actionType === 'feed') { emoji = "🍎"; message = "好吃！谢谢主人！"; }
    else if (actionType === 'pet') { emoji = "❤️"; message = "好舒服呀～"; }
    else if (actionType === 'play') { emoji = "🎾"; message = "太好玩啦！"; }
    
    setInteractionEffect(emoji);
    setTimeout(() => setInteractionEffect(null), 1000);

    // Show a quick custom chat without AI for fast feedback
    setShowChat(true);
    setIsTyping(false);
    setChatMessage(message);
    setTimeout(() => setShowChat(false), 3000);
  };

  const getPetImage = () => {
    let face = "🥚";
    if (student.level >= 2) face = "🐣";
    if (student.level >= 3) face = "🐥";
    if (student.level >= 5) face = "🐉";
    
    const bgColorMap: Record<string, string> = {
      'red': 'bg-red-400',
      'blue': 'bg-blue-400',
      'green': 'bg-green-400',
      'purple': 'bg-purple-400',
      'yellow': 'bg-yellow-400',
    };
    
    return {
      face,
      bg: bgColorMap[student.eggColor] || 'bg-gray-400'
    };
  };

  const pet = getPetImage();

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 200, delay }}
        whileHover={{ y: -5 }}
        onClick={handleOpenModal}
        className="bg-white rounded-[2rem] p-4 shadow-sm border-[3px] border-neutral-100 flex flex-col items-center relative cursor-pointer active:scale-95 transition-transform"
      >
        <div className="w-full flex justify-between items-center mb-2 px-1">
          <span className="font-black text-neutral-800 truncate block max-w-[80px]">{student.name}</span>
          <span className="bg-[var(--color-duo-yellow)] text-white text-xs font-black px-2 py-1 rounded-lg">
            Lv.{student.level}
          </span>
        </div>
        
        <div 
          className={clsx(
            "w-24 h-24 rounded-[2rem] mb-4 flex items-center justify-center text-4xl shadow-inner relative",
            pet.bg,
            mood < 30 ? "grayscale opacity-80" : ""
          )}
        >
          <motion.div 
            animate={mood < 30 ? { x: [-2, 2, -2, 2, 0] } : { y: [0, -5, 0] }}
            transition={mood < 30 ? { repeat: Infinity, duration: 2 } : { repeat: Infinity, duration: 3, ease: "easeInOut" }}
          >
            {pet.face}
          </motion.div>
          {student.effects.includes('Crown') && <div className="absolute -top-4 text-2xl">👑</div>}
          {student.effects.includes('Wings') && <div className="absolute -left-4 -right-4 text-3xl flex justify-between"><span>✨</span><span>✨</span></div>}
          {student.effects.includes('Star') && <div className="absolute bottom-0 right-0 text-xl">⭐</div>}
        </div>

        <div className="w-full space-y-2">
          <div>
            <div className="flex justify-between text-[10px] font-black text-neutral-400 mb-1">
              <span>EXP ({student.exp})</span>
            </div>
            <div className="w-full bg-neutral-100 h-3 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-[var(--color-duo-blue)]"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (student.exp % 50) / 50 * 100)}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[10px] font-black text-neutral-400 mb-1">
              <span>心情 (Mood)</span>
            </div>
            <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
              <motion.div 
                className={clsx("h-full", mood > 50 ? "bg-[var(--color-duo-green)]" : "bg-[var(--color-duo-red)]")}
                initial={{ width: 0 }}
                animate={{ width: `${mood}%` }}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Interaction Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white p-6 rounded-[2rem] shadow-xl relative z-10 w-full max-w-sm flex flex-col items-center"
            >
              <button 
                onClick={closeModal}
                className="absolute top-4 right-4 bg-neutral-100 text-neutral-500 rounded-full p-2 hover:bg-neutral-200"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-2xl font-black text-neutral-800 mb-1">{student.nickname}</h2>
              <p className="text-sm font-bold text-neutral-400 mb-6">主人：{student.name} | 当前心情：{mood.toFixed(0)}%</p>
              
              <div 
                onClick={handleInteractWithPet}
                className={clsx(
                  "w-32 h-32 rounded-[2rem] mb-8 flex items-center justify-center text-6xl shadow-inner cursor-pointer relative",
                  pet.bg,
                  mood < 30 ? "grayscale opacity-80" : ""
                )}
              >
                <motion.div 
                  animate={interactionEffect ? { y: [-10, 0, -10, 0] } : (mood < 30 ? { x: [-2, 2, -2, 2, 0] } : { y: [0, -5, 0] })}
                  transition={interactionEffect ? { duration: 0.4 } : (mood < 30 ? { repeat: Infinity, duration: 2 } : { repeat: Infinity, duration: 3, ease: "easeInOut" })}
                >
                  {pet.face}
                </motion.div>
                
                {/* Floating effect */}
                <AnimatePresence>
                  {interactionEffect && (
                    <motion.div 
                      key={interactionEffect + Date.now()}
                      initial={{ opacity: 1, y: 0, scale: 0.5 }}
                      animate={{ opacity: 0, y: -40, scale: 1.5 }}
                      exit={{ opacity: 0 }}
                      className="absolute top-0 text-3xl z-20 pointer-events-none"
                    >
                      {interactionEffect}
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {showChat && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 bg-white border-2 border-neutral-200 rounded-2xl p-3 z-10 shadow-lg text-sm font-bold text-neutral-700"
                    >
                      {isTyping ? <div className="flex gap-1 justify-center"><div className="w-2 h-2 bg-neutral-300 rounded-full animate-bounce"></div><div className="w-2 h-2 bg-neutral-300 rounded-full animate-bounce delay-100"></div><div className="w-2 h-2 bg-neutral-300 rounded-full animate-bounce delay-200"></div></div> : chatMessage}
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-b-2 border-r-2 border-neutral-200 rotate-45"></div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex gap-4 w-full justify-center">
                <button 
                  onClick={() => handleAction('feed')}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="w-14 h-14 bg-red-100 text-red-500 rounded-full flex items-center justify-center text-2xl hover:bg-red-200 transition-colors shadow-sm active:scale-95">🍎</div>
                  <span className="text-xs font-bold text-neutral-500">喂食</span>
                </button>
                <button 
                  onClick={() => handleAction('pet')}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="w-14 h-14 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center text-2xl hover:bg-blue-200 transition-colors shadow-sm active:scale-95">✋</div>
                  <span className="text-xs font-bold text-neutral-500">抚摸</span>
                </button>
                <button 
                  onClick={() => handleAction('play')}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="w-14 h-14 bg-green-100 text-green-500 rounded-full flex items-center justify-center text-2xl hover:bg-green-200 transition-colors shadow-sm active:scale-95">🎾</div>
                  <span className="text-xs font-bold text-neutral-500">陪玩</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
