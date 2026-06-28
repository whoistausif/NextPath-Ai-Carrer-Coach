import React, { useState, useEffect } from 'react';

export default function LearningPlan({ token, user }) {
  const [skillsInput, setSkillsInput] = useState('');
  const [level, setLevel] = useState(user?.experience_level || 'Beginner');
  const [loading, setLoading] = useState(false);
  const [planId, setPlanId] = useState(null);
  const [plan, setPlan] = useState(null);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [activeQuizDay, setActiveQuizDay] = useState(null);
  const [selectedOptionIdx, setSelectedOptionIdx] = useState(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  useEffect(() => {
    const pending = localStorage.getItem('pending_skills_to_learn');
    if (pending) {
      setSkillsInput(pending);
      localStorage.removeItem('pending_skills_to_learn');
    }
    fetchActivePlan();
  }, []);

  const fetchActivePlan = async () => {
    try {
      const res = await fetch('/api/learning-plan/active', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setPlanId(data.id);
          setPlan(data.plan);
          setCompletedTasks(data.completed_tasks || []);
        }
      }
    } catch (err) { console.error(err); }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/learning-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ skillsToLearn: skillsInput, currentLevel: level })
      });
      const data = await res.json();
      setPlanId(data.id);
      setPlan(data.plan);
      setCompletedTasks([]);
    } catch (err) { alert(err.message); }
    finally { setLoading(false); }
  };

  const handleToggleTask = async (dayIndex) => {
    let updated = completedTasks.includes(dayIndex) ? completedTasks.filter(d => d !== dayIndex) : [...completedTasks, dayIndex];
    setCompletedTasks(updated);
    try {
      await fetch('/api/learning-plan/toggle-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ planId, dayIndex })
      });
    } catch (err) { console.error(err); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div className="glass-card">
        <h3>Create Study Plan</h3>
        <form onSubmit={handleGenerate} style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', marginTop: '16px' }}>
          <input type="text" className="form-input" style={{ flexGrow: 2 }} value={skillsInput} onChange={e => setSkillsInput(e.target.value)} placeholder="Skills..." required />
          <button type="submit" className="btn btn-primary" disabled={loading}>Generate Plan</button>
        </form>
      </div>

      {loading ? <div className="spinner-wrapper"><div className="spinner"></div></div> : plan ? (
        <div>
          <h2>{plan.plan_name}</h2>
          <div className="learning-grid" style={{ marginTop: '20px' }}>
            {plan.daily_tasks?.map(task => (
              <div key={task.day} className="glass-card learning-day-card">
                <div className={`learning-checkbox ${completedTasks.includes(task.day) ? 'checked' : ''}`} onClick={() => handleToggleTask(task.day)}>
                  {completedTasks.includes(task.day) ? '✓' : ''}
                </div>
                <h4>Day {task.day}: {task.topic}</h4>
                <p style={{ color: 'var(--text-secondary)' }}>{task.sub_tasks?.join(', ')}</p>
                {task.quiz && <button className="btn btn-secondary btn-full" style={{ marginTop: '12px' }} onClick={() => { setActiveQuizDay(task); setSelectedOptionIdx(null); setQuizSubmitted(false); }}>Take Quiz</button>}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {activeQuizDay && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '500px', padding: '32px' }}>
            <h3>Quiz: {activeQuizDay.quiz.question}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
              {activeQuizDay.quiz.options?.map((opt, idx) => (
                <button key={idx} className="btn btn-secondary" onClick={() => !quizSubmitted && setSelectedOptionIdx(idx)} style={{ borderColor: selectedOptionIdx === idx ? 'var(--primary)' : 'transparent' }}>{opt}</button>
              ))}
            </div>
            {quizSubmitted && <p style={{ marginTop: '20px' }}>{selectedOptionIdx === activeQuizDay.quiz.answer_index ? 'Correct!' : 'Incorrect.'} {activeQuizDay.quiz.explanation}</p>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
              <button className="btn btn-secondary" onClick={() => setActiveQuizDay(null)}>Close</button>
              {!quizSubmitted ? <button className="btn btn-primary" onClick={() => setQuizSubmitted(true)}>Submit</button> : <button className="btn btn-accent" onClick={() => { handleToggleTask(activeQuizDay.day); setActiveQuizDay(null); }}>Complete Day</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
