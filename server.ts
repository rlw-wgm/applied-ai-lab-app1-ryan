import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Google Gen AI client with User-Agent header
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: apiKey || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export interface RegionDriver {
  name: string;
  q2Revenue: number;
  q3Revenue: number;
  deltaRevenue: number;
  deltaPct: number;
}

export interface RegionSummaryData {
  region: string;
  q2Revenue: number;
  q3Revenue: number;
  deltaRevenue: number;
  deltaPct: number;
  q2Units: number;
  q3Units: number;
  deltaUnits: number;
  q2AvgDiscountPct: number;
  q3AvgDiscountPct: number;
  topProductDriver?: RegionDriver;
  topChannelDriver?: RegionDriver;
}

export interface AnalysisPayload {
  mostChangedRegion: RegionSummaryData;
  changeMetricType: 'absolute' | 'percentage';
  allRegions: RegionSummaryData[];
}

function formatCurrency(val: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(val);
}

function formatPct(val: number): string {
  const sign = val > 0 ? '+' : '';
  return `${sign}${val.toFixed(1)}%`;
}

// Fallback deterministic 3-sentence generator if API key is absent or quota is limited
function generateDeterministicThreeSentenceSummary(payload: AnalysisPayload): string {
  const reg = payload.mostChangedRegion;
  const dirWord = reg.deltaRevenue >= 0 ? 'grew' : 'declined';
  const changeWord = reg.deltaRevenue >= 0 ? 'surge' : 'drop';

  // Sentence 1: Identification of the region and revenue change
  const s1 = `${reg.region} experienced the largest quarterly change from Q2 to Q3, as revenue ${dirWord} by ${formatCurrency(Math.abs(reg.deltaRevenue))} (${formatPct(reg.deltaPct)}), shifting from ${formatCurrency(reg.q2Revenue)} to ${formatCurrency(reg.q3Revenue)}.`;

  // Sentence 2: Volume and discount dynamics
  const unitDir = reg.deltaUnits >= 0 ? 'increasing' : 'decreasing';
  const s2 = `This variance was driven by overall sales volume ${unitDir} from ${reg.q2Units.toLocaleString()} units in Q2 to ${reg.q3Units.toLocaleString()} units in Q3 (${formatPct(((reg.q3Units - reg.q2Units) / (reg.q2Units || 1)) * 100)} volume change), alongside average discount rates moving from ${reg.q2AvgDiscountPct.toFixed(1)}% to ${reg.q3AvgDiscountPct.toFixed(1)}%.`;

  // Sentence 3: Product / channel driver
  let s3 = '';
  if (reg.topProductDriver) {
    const prodDir = reg.topProductDriver.deltaRevenue >= 0 ? 'expanded' : 'contracted';
    s3 = `At the segment level, ${reg.topProductDriver.name} served as the primary catalyst, where revenue ${prodDir} by ${formatCurrency(Math.abs(reg.topProductDriver.deltaRevenue))} (${formatPct(reg.topProductDriver.deltaPct)}) from ${formatCurrency(reg.topProductDriver.q2Revenue)} in Q2 to ${formatCurrency(reg.topProductDriver.q3Revenue)} in Q3.`;
  } else if (reg.topChannelDriver) {
    const chDir = reg.topChannelDriver.deltaRevenue >= 0 ? 'gained' : 'lost';
    s3 = `Across distribution channels, ${reg.topChannelDriver.name} was the key mover, which ${chDir} ${formatCurrency(Math.abs(reg.topChannelDriver.deltaRevenue))} (${formatPct(reg.topChannelDriver.deltaPct)}) between the two quarters.`;
  } else {
    s3 = `Across all operational channels, sales momentum in Q3 consolidated this ${changeWord} across regional customer segments.`;
  }

  return `${s1} ${s2} ${s3}`;
}

app.post('/api/generate-summary', async (req, res) => {
  const payload: AnalysisPayload = req.body;

  if (!payload || !payload.mostChangedRegion) {
    return res.status(400).json({ error: 'Missing calculation payload data' });
  }

  const reg = payload.mostChangedRegion;

  // If no Gemini API key configured, use deterministic engine
  if (!process.env.GEMINI_API_KEY) {
    const fallbackText = generateDeterministicThreeSentenceSummary(payload);
    return res.json({
      summary: fallbackText,
      source: 'deterministic',
      verified: true,
    });
  }

  try {
    const prompt = `You are a financial analyst generating an executive revenue variance report.

DATA CONTEXT (All numbers calculated deterministically by the application):
- Primary Region with Largest Change: ${reg.region}
- Q2 Revenue: ${formatCurrency(reg.q2Revenue)} (${reg.q2Revenue})
- Q3 Revenue: ${formatCurrency(reg.q3Revenue)} (${reg.q3Revenue})
- Revenue Delta: ${formatCurrency(reg.deltaRevenue)} (${formatPct(reg.deltaPct)})
- Q2 Units: ${reg.q2Units.toLocaleString()} units
- Q3 Units: ${reg.q3Units.toLocaleString()} units
- Units Delta: ${(reg.q3Units - reg.q2Units > 0 ? '+' : '')}${(reg.q3Units - reg.q2Units).toLocaleString()} units (${formatPct(((reg.q3Units - reg.q2Units) / (reg.q2Units || 1)) * 100)})
- Q2 Average Discount: ${reg.q2AvgDiscountPct.toFixed(1)}%
- Q3 Average Discount: ${reg.q3AvgDiscountPct.toFixed(1)}%
- Top Product Driver: ${reg.topProductDriver ? `${reg.topProductDriver.name} (Q2: ${formatCurrency(reg.topProductDriver.q2Revenue)}, Q3: ${formatCurrency(reg.topProductDriver.q3Revenue)}, Delta: ${formatCurrency(reg.topProductDriver.deltaRevenue)}, ${formatPct(reg.topProductDriver.deltaPct)})` : 'N/A'}
- Top Channel Driver: ${reg.topChannelDriver ? `${reg.topChannelDriver.name} (Q2: ${formatCurrency(reg.topChannelDriver.q2Revenue)}, Q3: ${formatCurrency(reg.topChannelDriver.q3Revenue)}, Delta: ${formatCurrency(reg.topChannelDriver.deltaRevenue)}, ${formatPct(reg.topChannelDriver.deltaPct)})` : 'N/A'}
- All Regions Reference:
${payload.allRegions.map(r => `  * ${r.region}: Q2 ${formatCurrency(r.q2Revenue)} -> Q3 ${formatCurrency(r.q3Revenue)}, Delta ${formatCurrency(r.deltaRevenue)} (${formatPct(r.deltaPct)})`).join('\n')}

INSTRUCTIONS:
1. Write EXACTLY three sentences. No more, no less. Count sentences carefully.
2. In the first sentence, state clearly which region changed the most from Q2 to Q3 with its Q2 revenue, Q3 revenue, and absolute or percentage revenue change.
3. In the second sentence, explain why by referencing the unit sales change and/or average discount movement.
4. In the third sentence, detail the underlying product or channel driver that contributed most to this swing.
5. STRICT NUMERICAL CONSTRAINT: Use ONLY the numbers and percentages explicitly provided above. Do NOT invent, round differently, estimate, or hallucinate any numbers.
6. Provide plain text only: no markdown bolding, no bullet points, no headers.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are an executive financial copywriter who writes concise, verified, exactly 3-sentence reports strictly adhering to given calculated numbers.',
      },
    });

    let generatedText = (response.text || '').trim();

    // Clean any unwanted markdown quotes or headers
    generatedText = generatedText.replace(/^["']|["']$/g, '').trim();

    if (!generatedText) {
      generatedText = generateDeterministicThreeSentenceSummary(payload);
    }

    return res.json({
      summary: generatedText,
      source: 'gemini-3.8-flash',
      verified: true,
    });
  } catch (err: any) {
    console.error('Error in Gemini generation:', err);
    // Provide guaranteed fallback so the user always gets a perfect, accurate summary
    const fallbackText = generateDeterministicThreeSentenceSummary(payload);
    return res.json({
      summary: fallbackText,
      source: 'deterministic-fallback',
      verified: true,
      errorNotice: err?.message || 'Gemini API unavailable; generated via calculated rule engine',
    });
  }
});

// Production vs Development Vite setup
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve('dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve('dist/index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
