import { Request, Response } from 'express';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface InterviewSession {
  questionNumber: number;
  question: string;
  transcript: string;
  duration: number;
  timestamp: string;
}

interface AnswerFeedback {
  questionNumber: number;
  question: string;
  transcript: string;
  grades: {
    confidence: number;
    clarity: number;
    engagement: number;
    conciseness: number;
    poise: number;
  };
  coachingTip: string;
}

interface SessionFeedback {
  answers: AnswerFeedback[];
  overallTips: string[];
  summary: string;
}

// Transcribe audio to text
export async function transcribeAudio(req: Request, res: Response) {
  try {
    const { audio, questionNumber, question, duration } = req.body;

    if (!audio) {
      return res.status(400).json({ error: 'Audio data is required' });
    }

    console.log(`[Interview] Transcribing audio for question ${questionNumber}`);
    console.log(`[Interview] Audio data length: ${audio.length} characters`);

    // Convert base64 to buffer
    const audioBuffer = Buffer.from(audio, 'base64');
    console.log(`[Interview] Audio buffer size: ${audioBuffer.length} bytes`);

    // Validate audio buffer
    if (audioBuffer.length < 1000) {
      return res.status(400).json({ error: 'Audio data too small. Please record a longer response.' });
    }

    // Create a temporary file for OpenAI
    const tempDir = path.join(process.cwd(), 'temp');
    
    // Ensure temp directory exists
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Use appropriate file extension based on audio format
    const tempFilePath = path.join(tempDir, `audio_${Date.now()}.webm`);
    fs.writeFileSync(tempFilePath, audioBuffer);
    console.log(`[Interview] Temporary file created: ${tempFilePath}, size: ${fs.statSync(tempFilePath).size} bytes`);

    try {
      const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(tempFilePath),
        model: 'whisper-1',
        language: 'en',
      });

      // Clean up temp file
      fs.unlinkSync(tempFilePath);

      console.log(`[Interview] Transcription completed for question ${questionNumber}`);

      res.json({
        success: true,
        transcript: transcription.text,
        questionNumber,
        question,
        duration
      });
    } catch (transcriptionError) {
      // Clean up temp file on error
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
      throw transcriptionError;
    }

  } catch (error: any) {
    console.error('[Interview] Transcription error:', error);
    res.status(500).json({ 
      error: 'Failed to transcribe audio',
      details: error.message 
    });
  }
}

// Generate feedback for interview sessions
export async function generateFeedback(req: Request, res: Response) {
  try {
    const { sessions }: { sessions: InterviewSession[] } = req.body;

    if (!sessions || sessions.length === 0) {
      return res.status(400).json({ error: 'Interview sessions are required' });
    }

    console.log(`[Interview] Generating feedback for ${sessions.length} sessions`);

    // Create the prompt for OpenAI
    const prompt = `You are an extremely strict pageant judge with impossibly high standards. Grade these interview responses like you're judging Miss Universe finals.

INTERVIEW SESSIONS:
${sessions.map((session, index) => `
Question ${session.questionNumber}: ${session.question}
Response: ${session.transcript}
Duration: ${session.duration} seconds
`).join('\n')}

EXTREMELY HARSH GRADING CRITERIA:
- Scores of 8+ are ONLY for absolutely flawless, competition-winning responses
- Scores of 6-7 are for very good responses with minor flaws
- Scores of 4-5 are for average/mediocre responses (most responses fall here)
- Scores of 1-3 are for poor responses with major issues
- PENALIZE HEAVILY: generic answers, filler words, "um/uh", lack of specifics, vague statements, poor grammar, going over time, being under-prepared
- REWARD ONLY: specific examples, perfect articulation, unique perspectives, confident delivery, structured answers, memorable content

For each response, provide:
1. BRUTALLY HONEST grades (1-10 scale):
   - confidence: Voice strength, conviction, no hesitation
   - clarity: Perfect speech, zero filler words, logical flow  
   - engagement: Captivating, memorable, stands out from competition
   - conciseness: Efficient, every word matters, perfect timing
   - poise: Grace, composure, pageant-ready presence

2. ONE specific, harsh coaching tip targeting the biggest weakness in this response
3. NO overall tips - just individual response feedback

CRITICAL FORMATTING RULES:
- Use ONLY plain text in all response fields
- NO bold text (**text**), NO italics (*text*), NO headers (### text)
- NO markdown formatting of any kind
- Write in natural, conversational language
- Structure feedback as flowing paragraphs, not bullet points
- Be direct and clear without special formatting

Format as JSON:
{
  "answers": [
    {
      "questionNumber": 1,
      "question": "question text",
      "transcript": "response text", 
      "grades": {
        "confidence": 3,
        "clarity": 4,
        "engagement": 2,
        "conciseness": 5,
        "poise": 3
      },
      "coachingTip": "brutal but specific improvement needed for this exact response"
    }
  ],
  "overallTips": [],
  "summary": "harsh but fair assessment focusing on what needs major work"
}

BE MERCILESS. Real pageant judges are brutal. Most responses deserve 3-5 range. Don't be nice.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o', // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: 'system',
          content: 'You are an expert pageant coach providing interview feedback. Respond only with valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const responseText = completion.choices[0]?.message?.content;
    
    if (!responseText) {
      throw new Error('No response from OpenAI');
    }

    // Parse the JSON response
    let feedback: SessionFeedback;
    try {
      // Remove markdown code blocks if present
      let cleanResponse = responseText.trim();
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      feedback = JSON.parse(cleanResponse);
    } catch (parseError) {
      console.error('[Interview] Failed to parse OpenAI response:', responseText);
      throw new Error('Invalid response format from AI');
    }

    // Validate the feedback structure
    if (!feedback.answers || !feedback.overallTips || !feedback.summary) {
      throw new Error('Invalid feedback structure');
    }

    console.log(`[Interview] Feedback generated successfully for ${sessions.length} sessions`);

    res.json({
      success: true,
      feedback
    });

  } catch (error: any) {
    console.error('[Interview] Feedback generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate feedback',
      details: error.message 
    });
  }
}

// Test OpenAI connection
export async function testConnection(req: Request, res: Response) {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o', // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [{ role: 'user', content: 'Hello' }],
      max_tokens: 5,
    });

    res.json({
      success: true,
      message: 'OpenAI connection successful',
      model: completion.model
    });

  } catch (error: any) {
    console.error('[Interview] OpenAI connection test failed:', error);
    res.status(500).json({ 
      error: 'OpenAI connection failed',
      details: error.message 
    });
  }
} 