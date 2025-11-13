import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    // Fetch the website content
    let websiteContent = '';
    try {
      const fetchResponse = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (!fetchResponse.ok) {
        throw new Error(`Failed to fetch website: ${fetchResponse.status}`);
      }

      websiteContent = await fetchResponse.text();

      // Clean up HTML - remove scripts, styles, etc. and keep only text content
      websiteContent = websiteContent
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 30000); // Limit to first 30k characters to avoid token limits
    } catch (fetchError) {
      console.error('Error fetching website:', fetchError);
      return NextResponse.json(
        {
          error: 'Failed to fetch website content',
          details: fetchError instanceof Error ? fetchError.message : 'Unknown error',
        },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-pro',
    });

    // Create a detailed prompt for website analysis
    const prompt = `You are an expert lead generation AI assistant. Analyze the following website content and extract all relevant company information and contact details that could be useful for B2B sales and lead generation.

Website URL: ${url}

Website Content:
${websiteContent}

Please analyze this website and provide:

1. **Company Information:**
   - Company name
   - Industry/sector
   - Company description
   - Products or services offered
   - Company size (if available)
   - Location/headquarters
   - Website URL

2. **Contact Information:**
   - Any contact person names mentioned
   - Email addresses
   - Phone numbers
   - LinkedIn profiles
   - Other social media

3. **Lead Quality Assessment:**
   - A confidence score (0.0 to 1.0) for the quality and completeness of information
   - Notes on whether this appears to be a legitimate business

4. **Recommended Outreach:**
   - Suggested talking points for initial contact
   - Key value propositions visible on the site

Please format your response as JSON following this structure:

\`\`\`json
{
  "leads": [
    {
      "company": {
        "name": "Company Name",
        "industry": "Industry",
        "website": "${url}",
        "location": "City, Country",
        "description": "Brief description",
        "size": "Company size if available"
      },
      "contacts": [
        {
          "name": "Contact Name (if found)",
          "title": "Job Title (if found)",
          "email": "email@example.com (if found)",
          "phone": "+1-555-0123 (if found)",
          "linkedin": "LinkedIn URL (if found)"
        }
      ],
      "source": "${url}",
      "confidence": 0.85,
      "notes": "Additional notes about the lead quality"
    }
  ],
  "outreachSuggestions": [
    "Talking point 1",
    "Talking point 2"
  ]
}
\`\`\`

Important:
- Only include information that is explicitly available on the website
- If certain fields are not available, omit them or use empty string
- Provide realistic confidence scores based on information completeness
- Be thorough but accurate`;

    // Generate content using Gemini with web grounding
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 8192,
      },
      // Note: Web grounding/search would require additional configuration
      // For now, we'll rely on Gemini's training data and explicit URL analysis
    });

    const response = result.response;
    const text = response.text();

    // Try to extract JSON from the response
    let analysisData;
    try {
      // Try to find JSON in code blocks
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        analysisData = JSON.parse(jsonMatch[1]);
      } else {
        // Try to parse the entire response as JSON
        analysisData = JSON.parse(text);
      }
    } catch (parseError) {
      // If parsing fails, return the raw text
      console.error('Failed to parse JSON from Gemini response:', parseError);
      return NextResponse.json({
        text,
        error: 'Failed to parse structured data',
      });
    }

    return NextResponse.json({
      success: true,
      data: analysisData,
      rawText: text,
    });
  } catch (error) {
    console.error('Website analysis error:', error);
    return NextResponse.json(
      {
        error: 'Failed to analyze website',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
