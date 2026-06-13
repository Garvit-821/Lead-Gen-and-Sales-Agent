import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import axios from 'axios';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const ai = new GoogleGenAI({ 
    apiKey: process.env.GEMINI_API_KEY || '',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  console.log('Registering API routes...');
  // API: Search Businesses
  app.post('/api/search', async (req, res) => {
    const { category, location, noWebsiteOnly } = req.body;
    try {
      const constraint = noWebsiteOnly 
        ? "crucially, only find businesses that DO NOT HAVE A WEBSITE listed or appear to have no digital presence." 
        : "include their website URL if they have one.";

      const prompt = `Find 10 real or highly representative local businesses for the category "${category}" in "${location}". 
      Requirements: ${constraint}
      Return the data as a JSON array of objects with the following keys:
      name, category, address, phone, website, rating (0-5), reviewCount.
      Ensure the JSON is raw and valid.`;

      const result = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });
      const text = result.text || '';
      // Extract JSON if it contains markdown markers
      const jsonStr = text.replace(/```json|```/g, '').trim();
      const businesses = JSON.parse(jsonStr);
      res.json(businesses);
    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({ error: 'Failed to search businesses' });
    }
  });

  // API: Audit Website
  app.post('/api/audit', async (req, res) => {
    const { website } = req.body;
    if (!website) {
      return res.status(400).json({ error: 'Website URL is required' });
    }

    try {
      let htmlContent = '';
      try {
        const response = await axios.get(website, { timeout: 5000, headers: { 'User-Agent': 'Mozilla/5.0' } });
        htmlContent = response.data;
      } catch (e) {
        console.warn(`Could not fetch ${website}, proceeding with partial data.`);
      }

      const $ = cheerio.load(htmlContent);
      const textSummary = $('body').text().slice(0, 3000).replace(/\s+/g, ' ');
      const title = $('title').text();
      const metaDescription = $('meta[name="description"]').attr('content') || '';

      const prompt = `Analyze the following website metadata and content summary for "${website}".
      Title: ${title}
      Description: ${metaDescription}
      Content Summary: ${textSummary}

      Provide a full website audit report in JSON format with:
      1. scores: { ui: 1-10, seo: 1-10, performance: 1-10, conversion: 1-10 }
      2. issues: (array of strings)
      3. pitch: (a persuasive 2-3 sentence pitch to the business owner about how we can improve their online presence).
      
      Return raw JSON only.`;

      const result = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });
      const auditText = result.text || '';
      const auditJson = JSON.parse(auditText.replace(/```json|```/g, '').trim());
      
      res.json(auditJson);
    } catch (error) {
      console.error('Audit error:', error);
      res.status(500).json({ error: 'Failed to perform audit' });
    }
  });

  // AI Lead Scoring
  app.post('/api/score', async (req, res) => {
    const { leadData } = req.body;
    try {
      const prompt = `Score this business lead for "web design & SEO services" potential. 
      Lead Data: ${JSON.stringify(leadData)}
      Return a lead_score (0-100), priority (LOW/MEDIUM/HIGH), and reasons (array of strings).
      Return raw JSON only.`;

      const result = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });
      const scoreJson = JSON.parse((result.text || '').replace(/```json|```/g, '').trim());
      res.json(scoreJson);
    } catch (error) {
      console.error('Scoring error:', error);
      res.status(500).json({ error: 'Failed to score lead' });
    }
  });

  // Outreach Generator
  app.post('/api/outreach', async (req, res) => {
    const { lead, audit, tone } = req.body;
    try {
      const prompt = `Generate a personalized outreach message for the business "${lead.name}".
      Audit Issues: ${audit?.issues?.join(', ')}
      Tone: ${tone || 'professional'}
      Goal: Offer web design/SEO upgrade services.
      Base it on their specific weaknesses.
      Return raw text message.`;

      const result = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });
      res.json({ message: (result.text || '').trim() });
    } catch (error) {
      console.error('Outreach error:', error);
      res.status(500).json({ error: 'Failed to generate outreach' });
    }
  });

  // Vite handles the frontend
  if (process.env.NODE_ENV !== 'production') {
    console.log('Initializing Vite in middleware mode...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Vite middleware mounted.');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

console.log('Starting server...');
startServer().catch(err => {
  console.error('SERVER FATAL ERROR:', err);
  process.exit(1);
});
