import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config({ override: true });

const apiKey = process.env.GEMINI_API_KEY;
let genAI = null;

if (apiKey && apiKey.trim() !== '') {
  try {
    genAI = new GoogleGenerativeAI(apiKey);
    console.log('Gemini API service initialized with API Key prefix:', apiKey.substring(0, 6) + '...');
  } catch (err) {
    console.error('Failed to initialize GoogleGenerativeAI:', err.message);
  }
} else {
  console.warn('GEMINI_API_KEY environment variable not set. Running in MOCK FALLBACK mode.');
}

// Global wrapper to catch API key issues and gracefully fall back to mock data
async function callWithFallback(apiCall, mockCall) {
  try {
    if (!genAI) {
      return mockCall();
    }
    return await apiCall();
  } catch (error) {
    const errMsg = error.message || '';
    if (
      errMsg.includes('API key not valid') || 
      errMsg.includes('API_KEY_INVALID') || 
      errMsg.includes('API key') ||
      errMsg.includes('key')
    ) {
      console.warn('Invalid Gemini API key detected. Gracefully falling back to MOCK MODE.');
      return mockCall();
    }
    throw error;
  }
}

async function generateJSON(prompt, systemInstruction = '') {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: systemInstruction,
  });

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: 'application/json',
    },
  });

  const responseText = result.response.text();
  try {
    return JSON.parse(responseText);
  } catch (error) {
    console.error('Failed to parse Gemini JSON output:', responseText);
    throw new Error('AI response was not in the expected JSON format.');
  }
}

/* ==========================================================================
   1. CAREER ROADMAP GENERATOR
   ========================================================================== */
export const generateRoadmap = async (role, level, timeline) => {
  return callWithFallback(
    async () => {
      const systemPrompt = `You are a Career Path Optimization Specialist. Output your plan strictly in JSON format.
The JSON must follow this schema:
{
  "role": "string",
  "level": "string",
  "timeline": "string",
  "summary": "string",
  "milestones": [
    {
      "id": 1,
      "title": "string",
      "duration": "string",
      "description": "string",
      "key_skills": ["string"],
      "action_items": ["string"],
      "resources": [{"name": "string", "type": "string", "url": "string"}]
    }
  ]
}`;
      const prompt = `Create a structured career roadmap to transition into or advance as a "${role}" starting from experience level "${level}", with a target timeline of "${timeline}". Define at least 4 clear progressive milestones, including key skills, exact actions to take, and recommended study resources (e.g. documentation, tutorials, courses).`;
      return await generateJSON(prompt, systemPrompt);
    },
    () => getMockRoadmap(role, level, timeline)
  );
};

/* ==========================================================================
   2. RESUME ANALYSIS
   ========================================================================== */
export const analyzeResume = async (resumeText, targetRole) => {
  return callWithFallback(
    async () => {
      const systemPrompt = `You are an expert Technical Recruiter and Resume Consultant. Evaluate the resume text against the target role and output a comprehensive feedback report strictly in JSON format.
The JSON must follow this schema:
{
  "score": 85,
  "target_role": "string",
  "strengths": ["string"],
  "gaps": ["string"],
  "bullet_improvements": [
    {
      "original": "string",
      "revised": "string",
      "impact_reason": "string"
    }
  ],
  "formatting_tips": ["string"],
  "skills_found": ["string"],
  "skills_missing": ["string"]
}`;
      const prompt = `Analyze this resume content relative to the target career role: "${targetRole || 'Software Engineer'}".
Resume Text:
"""
${resumeText}
"""
Provide clear scores, bullet point rewrites using action verbs and quantifiable metrics (following the Google X-Y-Z formula), missing key terms, and formatting suggestions.`;
      return await generateJSON(prompt, systemPrompt);
    },
    () => getMockResumeAnalysis(resumeText, targetRole)
  );
};

/* ==========================================================================
   3. COVER LETTER GENERATOR
   ========================================================================== */
export const generateCoverLetter = async (resumeText, jobDescription, tone = 'Professional') => {
  return callWithFallback(
    async () => {
      const systemPrompt = `You are an expert copywriter specializing in job application cover letters.
Write a personalized, compelling cover letter that highlights how the candidate's skills map directly to the job requirements.
Output your response strictly in JSON format matching this schema:
{
  "subject": "string",
  "salutation": "string",
  "body_paragraphs": ["string"],
  "sign_off": "string",
  "full_letter": "string"
}`;
      const prompt = `Create a cover letter with a "${tone}" tone based on this user profile/resume:
"""
${resumeText}
"""
And this target Job Description:
"""
${jobDescription}
"""`;
      return await generateJSON(prompt, systemPrompt);
    },
    () => getMockCoverLetter(resumeText, jobDescription, tone)
  );
};

/* ==========================================================================
   4. LINKEDIN HEADLINE & PROFILE OPTIMIZER
   ========================================================================== */
export const generateLinkedInOptimizer = async (resumeText, targetRole) => {
  return callWithFallback(
    async () => {
      const systemPrompt = `You are a LinkedIn Branding Coach. Help optimize the user's profile presence. Output strictly in JSON format.
Schema:
{
  "headlines": ["string"],
  "about_summary": "string",
  "profile_tips": ["string"]
}`;
      const prompt = `Based on the user's details and target role "${targetRole}":
Resume:
"""
${resumeText}
"""
Generate high-conversion headlines and a customized LinkedIn "About" section that attracts recruiters.`;
      return await generateJSON(prompt, systemPrompt);
    },
    () => getMockLinkedInOptimizer(resumeText, targetRole)
  );
};

/* ==========================================================================
   5. SKILL GAP ANALYSIS
   ========================================================================== */
export const analyzeSkillGap = async (resumeText, targetRole, jobDescription) => {
  return callWithFallback(
    async () => {
      const systemPrompt = `You are a Skill Strategy consultant. Compare the candidate's experience with the job description and output a details gap analysis in JSON.
Schema:
{
  "match_percentage": 65,
  "matching_skills": ["string"],
  "missing_skills": [
    {
      "skill": "string",
      "priority": "Critical" | "Preferred" | "Optional",
      "learning_difficulty": "Easy" | "Medium" | "Hard",
      "description": "string"
    }
  ],
  "bridging_recommendations": ["string"]
}`;
      const prompt = `Compare this candidate's resume/skills:
"""
${resumeText}
"""
With this target job description for a "${targetRole}":
"""
${jobDescription}
"""
Identify exactly what critical skills are missing and provide actionable recommendations to bridge the gap.`;
      return await generateJSON(prompt, systemPrompt);
    },
    () => getMockSkillGapAnalysis(resumeText, targetRole, jobDescription)
  );
};

/* ==========================================================================
   6. DAILY LEARNING PLAN
   ========================================================================== */
export const generateLearningPlan = async (skillsToLearn, currentLevel = 'Beginner') => {
  return callWithFallback(
    async () => {
      const systemPrompt = `You are an expert Educational Curriculum Designer. Generate a high-yield learning plan strictly in JSON format.
Schema:
{
  "plan_name": "string",
  "duration_weeks": 2,
  "daily_tasks": [
    {
      "day": 1,
      "week": 1,
      "topic": "string",
      "estimated_minutes": 45,
      "sub_tasks": ["string"],
      "resources": ["string"],
      "quiz": {
        "question": "string",
        "options": ["string"],
        "answer_index": 0,
        "explanation": "string"
      }
    }
  ]
}`;
      const prompt = `Create a daily learning schedule to master the following skills or bridge these gaps: "${skillsToLearn}".
Current candidate proficiency: "${currentLevel}".
Generate a structured 7-day learning block (Day 1 to Day 7) including daily subtopics, recommended study durations, resources, and a single multiple-choice self-test question for each day's task to check understanding.`;
      return await generateJSON(prompt, systemPrompt);
    },
    () => getMockLearningPlan(skillsToLearn, currentLevel)
  );
};

/* ==========================================================================
   7. MOCK INTERVIEW EVALUATOR & QUESTION GENERATOR
   ========================================================================== */
export const startMockInterview = async (role, type = 'Technical') => {
  return callWithFallback(
    async () => {
      const systemPrompt = `You are an elite interviewer conducting a ${type} interview for a "${role}" position.
Generate a set of 5 progressive questions. Output strictly in JSON format matching this schema:
{
  "role": "string",
  "type": "string",
  "questions": [
    {
      "id": 1,
      "question": "string",
      "intent": "What is the interviewer looking for?",
      "difficulty": "Easy" | "Medium" | "Hard"
    }
  ]
}`;
      const prompt = `Create a list of 5 standard interview questions for a "${role}" role. Ensure they cover realistic, situational, or code-logical domains matching the ${type} category.`;
      return await generateJSON(prompt, systemPrompt);
    },
    () => getMockInterviewQuestions(role, type)
  );
};

export const evaluateInterviewResponse = async (question, userResponse) => {
  return callWithFallback(
    async () => {
      const systemPrompt = `You are a Senior Hiring Manager. Evaluate the user's interview answer and generate structured feedback strictly in JSON.
Schema:
{
  "score": 78,
  "feedback_summary": "string",
  "strengths": ["string"],
  "weaknesses": ["string"],
  "revised_better_version": "string",
  "rating": "Strong Pass" | "Pass" | "Borderline" | "Fail"
}`;
      const prompt = `Evaluate the candidate's response to the interview question.
Question: "${question}"
Candidate Response: "${userResponse}"
Provide constructive critique, points to include, and a revised, high-impact answer.`;
      return await generateJSON(prompt, systemPrompt);
    },
    () => getMockInterviewEvaluation(question, userResponse)
  );
};

/* ==========================================================================
   8. CODING QUESTIONS & EVALUATOR
   ========================================================================== */
export const getCodingQuestions = async (topic = 'Algorithms', difficulty = 'Medium') => {
  return callWithFallback(
    async () => {
      const systemPrompt = `You are a Technical Interview Committee Leader. Generate a coding challenge strictly in JSON format.
Schema:
{
  "title": "string",
  "topic": "string",
  "difficulty": "string",
  "problem_statement": "string",
  "constraints": ["string"],
  "examples": [
    {
      "input": "string",
      "output": "string",
      "explanation": "string"
    }
  ],
  "starter_code": {
    "javascript": "string",
    "python": "string",
    "cpp": "string"
  }
}`;
      const prompt = `Generate a ${difficulty}-level coding problem related to "${topic}". Include detailed requirements, examples, and starter function templates for JavaScript, Python, and C++.`;
      return await generateJSON(prompt, systemPrompt);
    },
    () => getMockCodingQuestions(topic, difficulty)
  );
};

export const evaluateCodeSubmission = async (problemTitle, code, language) => {
  return callWithFallback(
    async () => {
      const systemPrompt = `You are an automated code analysis engine powered by Gemini. Assess the efficiency, correctness, complexity, and safety of the submitted solution. Output strictly in JSON format.
Schema:
{
  "is_correct": true,
  "time_complexity": "string",
  "space_complexity": "string",
  "issues_found": ["string"],
  "review": "string",
  "optimized_code": "string",
  "score": 90
}`;
      const prompt = `Evaluate the following code submission for the problem "${problemTitle}".
Language: ${language}
Code:
\`\`\`${language}
${code}
\`\`\`
Provide detailed evaluation on logic, algorithmic runtime, and a cleaner rewrite.`;
      return await generateJSON(prompt, systemPrompt);
    },
    () => getMockCodeEvaluation(problemTitle, code, language)
  );
};

/* ==========================================================================
   9. SALARY INSIGHTS
   ========================================================================== */
export const getSalaryInsights = async (role, location = 'United States') => {
  return callWithFallback(
    async () => {
      const systemPrompt = `You are a Global Compensation Strategy Advisor. Provide realistic compensation ranges and insights. Output strictly in JSON format.
Schema:
{
  "role": "string",
  "location": "string",
  "currency": "string",
  "ranges": {
    "entry": { "min": 50000, "median": 70000, "max": 90000 },
    "mid": { "min": 85000, "median": 110000, "max": 135000 },
    "senior": { "min": 130000, "median": 165000, "max": 220000 }
  },
  "benefits": ["string"],
  "market_demand": "High" | "Moderate" | "Growing",
  "negotiation_tips": ["string"]
}`;
      const prompt = `Generate salary insight percentiles and standard perks for the role of "${role}" in the region "${location}". Include negotiation recommendations specific to current market demand.`;
      return await generateJSON(prompt, systemPrompt);
    },
    () => getMockSalaryInsights(role, location)
  );
};

/* ==========================================================================
   10. CHAT ASSISTANT
   ========================================================================== */
export const getChatAssistantResponse = async (history, message, profile = {}) => {
  return callWithFallback(
    async () => {
      const systemInstruction = `You are a highly skilled AI Career Coach, Recruiter, and Corporate Success Mentor.
Your tone is professional, encouraging, analytical, and highly structured.
You should leverage the user's target role (${profile.target_role || 'Not specified'}) and experience level (${profile.experience_level || 'Not specified'}) to tailor your answers.
Use bullet points, bold sections, and checklists to make your advice clear and easy to read.`;

      const contents = [];
      for (const item of history) {
        contents.push({
          role: item.sender === 'user' ? 'user' : 'model',
          parts: [{ text: item.message }]
        });
      }
      contents.push({
        role: 'user',
        parts: [{ text: message }]
      });

      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: systemInstruction,
      });

      const result = await model.generateContent({ contents });
      return result.response.text();
    },
    () => "This is a mock advisor response because your GEMINI_API_KEY is not configured or is invalid. To chat with the real Gemini Advisor, update your API key in the backend settings."
  );
};

/* ==========================================================================
   MOCK GENERATOR FALLBACKS
   ========================================================================== */

function getMockRoadmap(role, level, timeline) {
  return {
    role, level, timeline,
    summary: `Structured development roadmap to excel as a ${role} over the course of ${timeline}. Focused on building foundational skills, gaining hands-on project experience, and preparing for job placement.`,
    milestones: [
      {
        id: 1, title: "Foundations and Fundamentals", duration: "Week 1-3",
        description: "Focus on understanding core theories, syntax, and tooling required for this domain.",
        key_skills: ["Basic tools", "Syntax", "Environment setup"],
        action_items: ["Install development environment", "Complete introductory online documentation modules", "Build a hello-world template"],
        resources: [
          { name: "Official Documentation Reference", type: "Docs", url: "https://example.com/docs" },
          { name: "Introductory Fundamentals Course", type: "Video Tutorial", url: "https://example.com/course" }
        ]
      },
      {
        id: 2, title: "Intermediate Concept Mastery", duration: "Week 4-6",
        description: "Dive deeper into structural architectural design, database hooks, or specific workflows.",
        key_skills: ["Data flow", "State management", "DB connectivity"],
        action_items: ["Build a CRUD layout application", "Read about performance design models", "Configure database bindings"],
        resources: [{ name: "Architectural Deep Dive Series", type: "Blog", url: "https://example.com/blog" }]
      },
      {
        id: 3, title: "Advanced Projects & Deployments", duration: "Week 7-9",
        description: "Combine all skills to build a complete project featuring full authentication, error handling, and cloud deployments.",
        key_skills: ["CI/CD pipelines", "Security auth hooks", "Performance optimization"],
        action_items: ["Implement user authentication and sessions", "Deploy code to a cloud environment (Vercel/Heroku/AWS)", "Run test coverage scripts"],
        resources: [{ name: "Production Deployment Practices", type: "Guide", url: "https://example.com/deploy" }]
      },
      {
        id: 4, title: "Job Readiness & Portfolio Review", duration: "Week 10-12",
        description: "Polish resume, structure portfolio representations, and engage in targeted interview practice.",
        key_skills: ["Interview communication", "Resume formatting", "System designs"],
        action_items: ["Build public portfolio website", "Optimize LinkedIn profile sections", "Practice 10 mock coding and behavioral challenges"],
        resources: [{ name: "Tech Interview preparation list", type: "Handbook", url: "https://example.com/interview" }]
      }
    ]
  };
}

function getMockResumeAnalysis(resumeText, targetRole) {
  return {
    score: 68,
    target_role: targetRole || "Software Engineer",
    strengths: [
      "Good foundational technical skill listings.",
      "Clear chronological job history structure.",
      "Demonstrates solid teamwork experience."
    ],
    gaps: [
      "Lack of quantifiable business metrics and outcomes in task listings.",
      "Vague descriptions for core accomplishments (needs action verbs).",
      "Missing relevant industry-specific keywords like 'CI/CD' or 'Agile methodologies'."
    ],
    bullet_improvements: [
      {
        original: "Responsible for fixing bugs in the core front-end project files.",
        revised: "Redesigned React front-end error-handling architecture, resolving 45+ critical bugs and improving customer checkout page load speeds by 23%.",
        impact_reason: "Replaces 'responsible for' with a strong verb, highlights the direct technical action, and adds quantifiable results."
      },
      {
        original: "Worked on setting up the server database and helped the backend team.",
        revised: "Collaborated in database migrations to PostgreSQL, optimizing lookup query indices which reduced server response times by 350ms.",
        impact_reason: "Shows technical depth, collaboration context, and measures database improvement performance metrics."
      }
    ],
    formatting_tips: [
      "Keep the resume strictly to 1 page if under 5 years of experience.",
      "Replace the generic 'Summary' statement with a 'Core Professional Highlight' focusing on target role metrics."
    ],
    skills_found: ["JavaScript", "HTML/CSS", "React", "Node.js", "SQL"],
    skills_missing: ["Docker", "TypeScript", "CI/CD", "AWS", "Agile Methodologies"]
  };
}

function getMockCoverLetter(resumeText, jobDescription, tone) {
  return {
    subject: "Application for Open Role position",
    salutation: "Dear Hiring Team,",
    body_paragraphs: [
      `I am writing to express my strong interest in joining your team. Based on my experience and technical backgrounds, I believe I can make immediate, high-quality contributions as a member of your company.`,
      `In my past work, I have focused on writing scalable systems and collaborating closely with design groups to build interfaces. Aligning my skills directly with your job description, I am excited about the opportunity to solve your technical challenges and work with your current stack.`,
      `Thank you for your time and consideration of my application. I look forward to discussing how my experience fits your team's ongoing project needs.`
    ],
    sign_off: "Best Regards,\nCandidate",
    full_letter: "Dear Hiring Team,\n\nI am writing to express my strong interest in joining your team. Based on my experience and technical backgrounds, I believe I can make immediate, high-quality contributions as a member of your company.\n\nIn my past work, I have focused on writing scalable systems and collaborating closely with design groups to build interfaces. Aligning my skills directly with your job description, I am excited about the opportunity to solve your technical challenges and work with your current stack.\n\nThank you for your time and consideration of my application. I look forward to discussing how my experience fits your team's ongoing project needs.\n\nBest Regards,\nCandidate"
  };
}

function getMockLinkedInOptimizer(resumeText, targetRole) {
  return {
    headlines: [
      `${targetRole} | Specialized in building scalable high-performance Web Apps | React & Node.js`,
      `${targetRole} | Focused on improving page speed, cloud deployments, and clean software architecture`,
      `Passionate ${targetRole} | Crafting modern user experiences & robust backend solutions`
    ],
    about_summary: "I am a dedicated software developer focused on building applications that solve real-world problems. With experience spanning frontend interfaces and backend APIs, I enjoy structural clean code and collaborative system designs.\n\nOver the past years, I have successfully deployed products, resolved performance latency challenges, and integrated third-party platforms.\n\nKey Skills: JavaScript, React, Node.js, Express, SQL, Git, and Docker. Always eager to explore cloud scalability patterns and automated testing workflows.",
    profile_tips: [
      "Upload a professional, clean headshot with a neutral or solid background.",
      "Add a customized banner related to coding, systems, or design."
    ]
  };
}

function getMockSkillGapAnalysis(resumeText, targetRole, jobDescription) {
  return {
    match_percentage: 70,
    matching_skills: ["JavaScript", "React", "Node.js", "SQL", "Git"],
    missing_skills: [
      { skill: "Docker", priority: "Critical", learning_difficulty: "Medium", description: "Required for shipping local code configurations into consistent containerized environments." }
    ],
    bridging_recommendations: [
      "Create a sample docker image for your portfolio projects."
    ]
  };
}

function getMockLearningPlan(skillsToLearn, currentLevel) {
  return {
    plan_name: `Fast-track ${skillsToLearn} Course`,
    duration_weeks: 1,
    daily_tasks: [
      {
        day: 1, week: 1, topic: "Core Concept Introductions", estimated_minutes: 40,
        sub_tasks: ["Understand the core syntax and basic architectural structure"],
        resources: ["Official Beginner Handbook Tutorial"],
        quiz: {
          question: "Which of the following describes the main benefit of this technology?",
          options: ["Consistent environment packaging and dependency isolation", "Accelerates general hardware speeds by 5x"],
          answer_index: 0,
          explanation: "Isolated containment packages all system libraries and dependencies together."
        }
      }
    ]
  };
}

function getMockInterviewQuestions(role, type) {
  return {
    role, type,
    questions: [
      { id: 1, question: `Tell me about a challenging project you built as a ${role}. What technical hurdles did you face, and how did you resolve them?`, intent: "Assess problem-solving capabilities.", difficulty: "Medium" }
    ]
  };
}

function getMockInterviewEvaluation(question, userResponse) {
  return { score: 75, feedback_summary: "The answer shows good experience but lacks STAR structure.", strengths: ["Honest depiction of technical challenges."], weaknesses: ["Vague about the exact role played."], revised_better_version: "In my last role, we had a server slowdown...", rating: "Pass" };
}

function getMockCodingQuestions(topic, difficulty) {
  return {
    title: "Two Sum Target Summation", topic, difficulty,
    problem_statement: "Given an array of integers 'nums' and an integer 'target', return indices of the two numbers such that they add up to the target.",
    constraints: ["2 <= nums.length <= 10^4"],
    examples: [{ input: "nums = [2,7], target = 9", output: "[0,1]", explanation: "nums[0] + nums[1] == 9" }],
    starter_code: { javascript: "function twoSum(nums, target) {\n  return [];\n}", python: "def two_sum(nums, target):\n    return []", cpp: "class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        return {};\n    }\n};" }
  };
}

function getMockCodeEvaluation(problemTitle, code, language) {
  return { is_correct: true, time_complexity: "O(N)", space_complexity: "O(N)", issues_found: ["Optimal hash map usage."], review: "Optimal linear solution.", optimized_code: "code...", score: 95 };
}

function getMockSalaryInsights(role, location) {
  return {
    role, location, currency: "USD",
    ranges: {
      entry: { min: 65000, median: 80000, max: 95000 },
      mid: { min: 95000, median: 120000, max: 145000 },
      senior: { min: 140000, median: 175000, max: 220000 }
    },
    benefits: ["Health, Vision, and Dental Insurance", "401(k) Matching"],
    market_demand: "High",
    negotiation_tips: ["Research standard salaries for this role in your region before negotiating."]
  };
}
