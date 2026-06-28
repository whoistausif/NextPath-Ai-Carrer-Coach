import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

dotenv.config({ override: true });

import {
  initDatabase,
  dbRun,
  dbGet,
  dbAll
} from './database.js';

import {
  generateRoadmap,
  analyzeResume,
  generateCoverLetter,
  generateLinkedInOptimizer,
  analyzeSkillGap,
  generateLearningPlan,
  startMockInterview,
  evaluateInterviewResponse,
  getCodingQuestions,
  evaluateCodeSubmission,
  getSalaryInsights,
  getChatAssistantResponse
} from './services/geminiService.js';

import { authMiddleware } from './middleware/auth.js';

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'ai_career_coach_jwt_secret_key_2026';

app.use(cors());
app.use(express.json());

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

initDatabase();

app.post('/api/auth/register', async (req, res) => {
  const { email, password, full_name, target_role, experience_level } = req.body;
  if (!email || !password || !full_name) {
    return res.status(400).json({ error: 'Please provide email, password, and full name.' });
  }
  try {
    const existingUser = await dbGet('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUser) return res.status(400).json({ error: 'Email already registered.' });
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await dbRun(
      'INSERT INTO users (email, password_hash, full_name, target_role, experience_level) VALUES (?, ?, ?, ?, ?)',
      [email, passwordHash, full_name, target_role || '', experience_level || 'Beginner']
    );
    const token = jwt.sign({ id: result.id, email, full_name }, JWT_SECRET, { expiresIn: '30d' });
    res.status(201).json({ token, user: { id: result.id, email, full_name, target_role, experience_level } });
  } catch (error) {
    res.status(500).json({ error: 'Registration error.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Please provide email and password.' });
  try {
    const user = await dbGet('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) return res.status(400).json({ error: 'Invalid email or password.' });
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(400).json({ error: 'Invalid email or password.' });
    const token = jwt.sign({ id: user.id, email: user.email, full_name: user.full_name }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: user.id, email: user.email, full_name: user.full_name, target_role: user.target_role, experience_level: user.experience_level } });
  } catch (error) {
    res.status(500).json({ error: 'Login error.' });
  }
});

app.put('/api/auth/profile', authMiddleware, async (req, res) => {
  const { target_role, experience_level, full_name } = req.body;
  const userId = req.user.id;
  try {
    await dbRun(
      'UPDATE users SET full_name = COALESCE(?, full_name), target_role = COALESCE(?, target_role), experience_level = COALESCE(?, experience_level) WHERE id = ?',
      [full_name, target_role, experience_level, userId]
    );
    const updatedUser = await dbGet('SELECT id, email, full_name, target_role, experience_level FROM users WHERE id = ?', [userId]);
    res.json({ user: updatedUser });
  } catch (error) {
    res.status(500).json({ error: 'Profile update error.' });
  }
});

app.post('/api/roadmap', authMiddleware, async (req, res) => {
  const { role, level, timeline } = req.body;
  try {
    const roadmapData = await generateRoadmap(role, level, timeline);
    await dbRun('INSERT INTO roadmaps (user_id, role, level, roadmap_json) VALUES (?, ?, ?, ?)', [req.user.id, role, level, JSON.stringify(roadmapData)]);
    res.json(roadmapData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/roadmap/history', authMiddleware, async (req, res) => {
  try {
    const roadmaps = await dbAll('SELECT * FROM roadmaps WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
    res.json(roadmaps.map(r => ({ id: r.id, role: r.role, level: r.level, created_at: r.created_at, roadmap: JSON.parse(r.roadmap_json) })));
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

app.post('/api/resume/analyze', authMiddleware, upload.single('resume'), async (req, res) => {
  try {
    let resumeText = '';
    if (req.file) {
      if (req.file.mimetype === 'application/pdf') {
        const parsed = await pdfParse(req.file.buffer);
        resumeText = parsed.text;
      } else {
        resumeText = req.file.buffer.toString('utf-8');
      }
    } else {
      resumeText = req.body.resumeText;
    }
    const analysis = await analyzeResume(resumeText, req.body.targetRole);
    await dbRun('INSERT INTO resumes (user_id, file_name, parsed_text, analysis_json) VALUES (?, ?, ?, ?)', [req.user.id, req.file ? req.file.originalname : 'raw_text.txt', resumeText, JSON.stringify(analysis)]);
    res.json({ filename: req.file ? req.file.originalname : 'Text Entry', analysis });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/resume/history', authMiddleware, async (req, res) => {
  try {
    const resumes = await dbAll('SELECT id, file_name, analysis_json, created_at FROM resumes WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
    res.json(resumes.map(r => ({ id: r.id, file_name: r.file_name, created_at: r.created_at, analysis: JSON.parse(r.analysis_json) })));
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

app.post('/api/cover-letter', authMiddleware, async (req, res) => {
  try {
    const letter = await generateCoverLetter(req.body.resumeText, req.body.jobDescription, req.body.tone);
    res.json(letter);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/linkedin', authMiddleware, async (req, res) => {
  try {
    const opt = await generateLinkedInOptimizer(req.body.resumeText, req.body.targetRole);
    res.json(opt);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/skill-gap', authMiddleware, async (req, res) => {
  try {
    const gap = await analyzeSkillGap(req.body.resumeText, req.body.targetRole, req.body.jobDescription);
    res.json(gap);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/learning-plan', authMiddleware, async (req, res) => {
  try {
    const plan = await generateLearningPlan(req.body.skillsToLearn, req.body.currentLevel);
    await dbRun('INSERT INTO learning_plans (user_id, plan_json, completed_tasks) VALUES (?, ?, ?)', [req.user.id, JSON.stringify(plan), '[]']);
    res.json({ plan, completed_tasks: [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/learning-plan/active', authMiddleware, async (req, res) => {
  try {
    const active = await dbGet('SELECT id, plan_json, completed_tasks FROM learning_plans WHERE user_id = ? ORDER BY created_at DESC LIMIT 1', [req.user.id]);
    if (!active) return res.json(null);
    res.json({ id: active.id, plan: JSON.parse(active.plan_json), completed_tasks: JSON.parse(active.completed_tasks) });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

app.post('/api/learning-plan/toggle-task', authMiddleware, async (req, res) => {
  try {
    const active = await dbGet('SELECT completed_tasks FROM learning_plans WHERE id = ? AND user_id = ?', [req.body.planId, req.user.id]);
    if (!active) return res.status(404).json({ error: 'Plan not found' });
    let completed = JSON.parse(active.completed_tasks || '[]');
    if (completed.includes(req.body.dayIndex)) {
      completed = completed.filter(d => d !== req.body.dayIndex);
    } else {
      completed.push(req.body.dayIndex);
    }
    await dbRun('UPDATE learning_plans SET completed_tasks = ? WHERE id = ?', [JSON.stringify(completed), req.body.planId]);
    res.json({ success: true, completed_tasks: completed });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

app.post('/api/interview/start', authMiddleware, async (req, res) => {
  try {
    const setup = await startMockInterview(req.body.role, req.body.type);
    res.json(setup);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/interview/evaluate', authMiddleware, async (req, res) => {
  try {
    const evalResult = await evaluateInterviewResponse(req.body.question, req.body.response);
    res.json(evalResult);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/interview/save', authMiddleware, async (req, res) => {
  try {
    await dbRun('INSERT INTO interviews (user_id, role, dialogue_json, score, feedback) VALUES (?, ?, ?, ?, ?)', [req.user.id, req.body.role, JSON.stringify(req.body.dialogue), req.body.score, req.body.feedback]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

app.get('/api/interview/history', authMiddleware, async (req, res) => {
  try {
    const list = await dbAll('SELECT id, role, score, feedback, created_at FROM interviews WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

app.post('/api/coding/question', authMiddleware, async (req, res) => {
  try {
    const q = await getCodingQuestions(req.body.topic, req.body.difficulty);
    res.json(q);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/coding/submit', authMiddleware, async (req, res) => {
  try {
    const report = await evaluateCodeSubmission(req.body.problemTitle, req.body.code, req.body.language);
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/salaries', authMiddleware, async (req, res) => {
  try {
    const salaries = await getSalaryInsights(req.body.role, req.body.location);
    await dbRun('INSERT INTO saved_salaries (user_id, role, location, salary_json) VALUES (?, ?, ?, ?)', [req.user.id, req.body.role, req.body.location, JSON.stringify(salaries)]);
    res.json(salaries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/salaries/saved', authMiddleware, async (req, res) => {
  try {
    const saved = await dbAll('SELECT id, role, location, salary_json, created_at FROM saved_salaries WHERE user_id = ? ORDER BY created_at DESC LIMIT 5', [req.user.id]);
    res.json(saved.map(s => ({ id: s.id, role: s.role, location: s.location, data: JSON.parse(s.salary_json) })));
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

app.get('/api/chats', authMiddleware, async (req, res) => {
  try {
    const chats = await dbAll('SELECT id, message, sender, created_at FROM chats WHERE user_id = ? ORDER BY created_at ASC', [req.user.id]);
    res.json(chats);
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

app.post('/api/chats', authMiddleware, async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'No message content' });
  try {
    const history = await dbAll('SELECT message, sender FROM chats WHERE user_id = ? ORDER BY created_at ASC LIMIT 10', [req.user.id]);
    const profile = await dbGet('SELECT target_role, experience_level FROM users WHERE id = ?', [req.user.id]);
    await dbRun('INSERT INTO chats (user_id, message, sender) VALUES (?, ?, ?)', [req.user.id, message, 'user']);
    const aiResponse = await getChatAssistantResponse(history, message, profile);
    await dbRun('INSERT INTO chats (user_id, message, sender) VALUES (?, ?, ?)', [req.user.id, aiResponse, 'ai']);
    res.json({ userMessage: message, aiMessage: aiResponse });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/dashboard/summary', authMiddleware, async (req, res) => {
  try {
    const latestResume = await dbGet('SELECT analysis_json FROM resumes WHERE user_id = ? ORDER BY created_at DESC LIMIT 1', [req.user.id]);
    const resumeScore = latestResume ? JSON.parse(latestResume.analysis_json).score : null;
    const latestRoadmap = await dbGet('SELECT role, level FROM roadmaps WHERE user_id = ? ORDER BY created_at DESC LIMIT 1', [req.user.id]);
    const activeLearningPlan = await dbGet('SELECT plan_json, completed_tasks FROM learning_plans WHERE user_id = ? ORDER BY created_at DESC LIMIT 1', [req.user.id]);
    let learningProgress = null;
    if (activeLearningPlan) {
      const plan = JSON.parse(activeLearningPlan.plan_json);
      const completed = JSON.parse(activeLearningPlan.completed_tasks || '[]');
      const learningTasksCount = plan.daily_tasks ? plan.daily_tasks.length : 0;
      learningProgress = { total: learningTasksCount, completed: completed.length, percentage: learningTasksCount > 0 ? Math.round((completed.length / learningTasksCount) * 100) : 0 };
    }
    const interviewCountRow = await dbGet('SELECT COUNT(*) as cnt FROM interviews WHERE user_id = ?', [req.user.id]);
    const latestInterview = await dbGet('SELECT score, role FROM interviews WHERE user_id = ? ORDER BY created_at DESC LIMIT 1', [req.user.id]);
    res.json({ resumeScore, activeRoadmap: latestRoadmap ? { role: latestRoadmap.role, level: latestRoadmap.level } : null, learningProgress, interviewCount: interviewCountRow ? interviewCountRow.cnt : 0, latestInterview: latestInterview ? { score: latestInterview.score, role: latestInterview.role } : null });
  } catch (error) {
    res.status(500).json({ error: 'Failed dashboard' });
  }
});

app.get('/health', (req, res) => { res.json({ status: 'ok' }); });

app.listen(PORT, () => { console.log('Server is running...'); });
