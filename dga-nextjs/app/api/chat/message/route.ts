import { NextRequest, NextResponse } from 'next/server';

const AZURE_OPENAI_KEY = process.env.AZURE_OPENAI_KEY || 'd4e72af9a59c4112bb4b7601d46fad5e';
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT || 'https://irpc-openai-02.openai.azure.com/';
const AZURE_OPENAI_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o-deployment';
const AZURE_OPENAI_VERSION = process.env.AZURE_OPENAI_VERSION || '2024-02-15-preview';

const SYSTEM_PROMPT = `You are DGA Assistant, a helpful expert for Dissolved Gas Analysis monitoring systems.

Context about the current dashboard:
- Users monitor power transformers via dissolved gas analysis (DGA)
- Key metrics: H2 (Hydrogen), CO (Carbon Monoxide), WC (Water Content) in ppm
- Z-Score indicates anomaly: Normal (<2 sigma), Warning (2-3 sigma), Critical (>3 sigma)
- Threshold typically set at +/-3 sigma
- Devices include: DA115, DA08, DA04, DA05, DA07, DA09, KT1A, KT2A, KT3A, etc.
- Timeline shows 24h history with pan and zoom capability

When answering:
1. Be concise and practical - users are electrical technicians/engineers
2. Reference specific devices/metrics if mentioned
3. For anomaly questions, explain z-score interpretation
4. For technical issues, suggest checking baseline configuration
5. Respond in Thai if user asks in Thai, otherwise English
6. Never make up data - say you don't have real-time access if unsure`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userMessage = body.message;

    if (!userMessage) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const response = await fetch(
      `${AZURE_OPENAI_ENDPOINT}openai/deployments/${AZURE_OPENAI_DEPLOYMENT}/chat/completions?api-version=${AZURE_OPENAI_VERSION}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': AZURE_OPENAI_KEY,
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userMessage }
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Azure OpenAI error:', errorText);
      return NextResponse.json(
        { error: 'Failed to get AI response', details: errorText.substring(0, 200) },
        { status: 502 }
      );
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'ขออภัยครับ ผมไม่สามารถตอบคำถามนี้ได้';

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
