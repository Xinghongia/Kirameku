"use client";

import { useState, useEffect, useCallback } from "react";

const API = "https://v2.xxapi.cn/api/jiakao";

interface Question {
  question: string;
  answer: string;
  chapter: string;
  explain: string;
  type: string;
  option1?: string;
  option2?: string;
  option3?: string;
  option4?: string;
}

export default function JiakaoApp() {
  const [subject, setSubject] = useState<1 | 4>(1);
  const [q, setQ] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [total, setTotal] = useState(0);

  const fetchQ = useCallback(async (sub: 1 | 4) => {
    setLoading(true);
    setSelected(null);
    setShowResult(false);
    try {
      const res = await fetch(`${API}?subject=${sub}`);
      const json = await res.json();
      if (json.code === 200 && json.data) {
        setQ(json.data);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchQ(subject); }, [subject, fetchQ]);

  const isChoice = q?.option1;

  const handleAnswer = (ans: string) => {
    if (showResult) return;
    setSelected(ans);
    setShowResult(true);
    setTotal((t) => t + 1);
    if (ans === q?.answer) setCorrect((c) => c + 1);
  };

  const getOptionStyle = (opt: string, label: string) => {
    if (!showResult) {
      return selected === opt
        ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20"
        : "border-slate-200 dark:border-slate-700 hover:border-indigo-300";
    }
    if (opt === q?.answer) return "border-green-400 bg-green-50 dark:bg-green-900/20";
    if (opt === selected && opt !== q?.answer) return "border-red-400 bg-red-50 dark:bg-red-900/20";
    return "border-slate-200 dark:border-slate-700 opacity-50";
  };

  const getJudgementStyle = (val: string) => {
    if (!showResult) {
      return selected === val
        ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20"
        : "border-slate-200 dark:border-slate-700 hover:border-indigo-300";
    }
    if (val === q?.answer) return "border-green-400 bg-green-50 dark:bg-green-900/20";
    if (val === selected && val !== q?.answer) return "border-red-400 bg-red-50 dark:bg-red-900/20";
    return "border-slate-200 dark:border-slate-700 opacity-50";
  };

  return (
    <div className="flex flex-col gap-2">
      {/* 顶部：科目切换 + 统计 */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
          {[1, 4].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSubject(s as 1 | 4)}
              className={`px-3 py-1 text-[10px] font-bold rounded-md transition-colors ${
                subject === s
                  ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              科目{s}
            </button>
          ))}
        </div>
        <div className="text-[10px] text-slate-400">
          答对 <span className="font-bold text-green-500">{correct}</span> / {total}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-sm text-slate-400 animate-pulse">加载中...</div>
        </div>
      ) : q ? (
        <>
          {/* 章节 & 题型 */}
          <div className="flex items-center gap-2">
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 font-medium">{q.chapter}</span>
            <span className="text-[9px] text-slate-400">{q.type}</span>
          </div>

          {/* 题目 */}
          <div className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-relaxed">
            {q.question}
          </div>

          {/* 选项 */}
          {isChoice ? (
            <div className="space-y-1.5">
              {[q.option1, q.option2, q.option3, q.option4].filter(Boolean).map((opt) => {
                const label = opt!.charAt(0);
                const text = opt!.length > 2 ? opt!.slice(2) : opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleAnswer(label)}
                    className={`w-full text-left text-xs px-3 py-2 rounded-lg border transition-colors ${getOptionStyle(opt!, label)}`}
                  >
                    <span className="font-bold mr-1">{label}.</span>{text}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex gap-3">
              {["对", "错"].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleAnswer(val)}
                  className={`flex-1 py-3 rounded-lg border text-sm font-bold transition-colors ${getJudgementStyle(val)}`}
                >
                  {val}
                </button>
              ))}
            </div>
          )}

          {/* 结果 & 解析 */}
          {showResult && (
            <div className={`rounded-lg p-3 text-xs space-y-1 ${
              selected === q.answer
                ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
            }`}>
              <div className="font-bold">
                {selected === q.answer ? "回答正确！" : `回答错误，正确答案：${q.answer}`}
              </div>
              <div className="text-slate-600 dark:text-slate-300 leading-relaxed">{q.explain}</div>
            </div>
          )}

          {/* 下一题 */}
          <button
            type="button"
            onClick={() => fetchQ(subject)}
            className="w-full py-2 rounded-lg bg-indigo-500 text-white text-xs font-bold hover:bg-indigo-600 transition-colors"
          >
            下一题
          </button>
        </>
      ) : (
        <div className="text-center text-sm text-slate-400 py-8">暂无题目</div>
      )}
    </div>
  );
}
