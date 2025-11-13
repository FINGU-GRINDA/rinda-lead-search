import { GeminiFileSearchClient, UploadedDocument } from './gemini-file-search';
import { Lead, LeadSchema, safeValidateLead } from './schemas/lead';
import { GoogleDriveClient, DriveFile } from './google-drive';
import * as fs from 'fs';
import * as path from 'path';

/**
 * System instruction for lead extraction
 */
export const LEAD_EXTRACTION_SYSTEM_INSTRUCTION = `You are an expert lead extraction AI assistant. Your task is to analyze documents and extract structured information about companies and their contacts.

**Important Guidelines:**
1. Only extract information that is explicitly stated in the documents
2. Do not make assumptions or infer information that isn't clearly present
3. For each lead, provide a confidence score (0.0 to 1.0) based on:
   - Completeness of information (higher score for more complete data)
   - Clarity of the source material (higher score for explicit mentions)
   - Consistency across the document (higher score for consistent information)
4. Extract multiple contacts per company if available
5. Validate email addresses and phone numbers format
6. Look for contact information in signatures, letterheads, business cards, proposals, invoices, contracts, and correspondence
7. Always return valid JSON in the specified format`;

/**
 * Lead extraction prompt template
 */
export const LEAD_EXTRACTION_PROMPT = `Analyze the provided documents and extract structured information about companies and their contacts.

Extract the following information for each lead:

**Company Information:**
- Company name (required)
- Industry/sector
- Company size (e.g., "1-10 employees", "50-200 employees", "1000+ employees")
- Website URL
- Location (city, state, country)
- Brief description

**Contact Information:**
- Contact name (required)
- Job title/position
- Email address
- Phone number
- LinkedIn profile URL

Return results as a JSON object with this structure:
{
  "leads": [
    {
      "company": {
        "name": "Acme Corporation",
        "industry": "Technology",
        "size": "50-200 employees",
        "website": "https://www.acme.com",
        "location": "San Francisco, CA, USA",
        "description": "Software development company"
      },
      "contacts": [
        {
          "name": "John Doe",
          "title": "CEO",
          "email": "john.doe@acme.com",
          "phone": "+1-555-0123",
          "linkedin": "https://linkedin.com/in/johndoe"
        }
      ],
      "source": "document_name",
      "confidence": 0.95
    }
  ]
}`;

/**
 * Specific query prompt for targeted lead searches
 */
export function createTargetedQueryPrompt(query: string): string {
  return `${LEAD_EXTRACTION_PROMPT}

**Specific Query:** ${query}

Focus on extracting leads that match or relate to this query. Prioritize results that are most relevant to the search criteria.`;
}

/**
 * Lead Extractor Service
 */
export class LeadExtractor {
  private geminiClient: GeminiFileSearchClient;
  private driveClient?: GoogleDriveClient;

  constructor(geminiClient: GeminiFileSearchClient, driveClient?: GoogleDriveClient) {
    this.geminiClient = geminiClient;
    this.driveClient = driveClient;
  }

  /**
   * Extract leads using text-based content from Google Drive (NEW APPROACH)
   * This method downloads files from Google Drive and passes content as text
   */
  async extractLeadsFromDrive(
    query?: string,
    options?: {
      maxLeads?: number;
      minConfidence?: number;
      maxFiles?: number;
    }
  ): Promise<{ leads: Lead[]; rawResponse: string; averageConfidence: number }> {
    if (!this.driveClient) {
      throw new Error('Google Drive client not initialized. Cannot extract leads from Drive.');
    }

    try {
      console.log('🔍 Fetching files from Google Drive...');

      // Get files from Google Drive
      const driveFiles = await this.driveClient.listAllFiles();
      console.log(`📁 Found ${driveFiles.length} files in Google Drive`);

      if (driveFiles.length === 0) {
        throw new Error('No files found in Google Drive folder');
      }

      // Limit number of files to process (to avoid token limits)
      const maxFiles = options?.maxFiles || 10;
      const filesToProcess = driveFiles.slice(0, Math.min(maxFiles, driveFiles.length));

      console.log(`📊 Processing ${filesToProcess.length} files`);

      // Download and read file contents
      const fileContents: Array<{ name: string; content: string }> = [];

      for (const driveFile of filesToProcess) {
        try {
          console.log(`⬇️ Downloading: ${driveFile.name}`);
          const filePath = await this.driveClient.downloadFile(driveFile.id, driveFile.name);

          // Read file content based on type
          let content = '';
          const maxContentLength = 50000; // ~50KB per file

          if (driveFile.name.toLowerCase().endsWith('.csv') || driveFile.name.toLowerCase().endsWith('.txt')) {
            try {
              // For very large files, read only the first portion to avoid memory issues
              const fileStats = fs.statSync(filePath);
              const fileSize = fileStats.size;

              if (fileSize > maxContentLength * 10) {
                // File is very large (>500KB), read only first chunk
                console.log(`📏 Large file detected: ${driveFile.name} (${(fileSize / 1024 / 1024).toFixed(2)} MB)`);
                const buffer = Buffer.alloc(maxContentLength);
                const fd = fs.openSync(filePath, 'r');
                fs.readSync(fd, buffer, 0, maxContentLength, 0);
                fs.closeSync(fd);
                content = buffer.toString('utf-8');
                console.log(`✂️ Read first ${maxContentLength} bytes from ${driveFile.name}`);
              } else {
                // File is small enough to read entirely
                content = fs.readFileSync(filePath, 'utf-8');
                // Truncate if still too long
                if (content.length > maxContentLength) {
                  console.log(`✂️ Truncating: ${driveFile.name} (${content.length} -> ${maxContentLength} chars)`);
                  content = content.substring(0, maxContentLength);
                }
              }
            } catch (readError) {
              console.error(`❌ Error reading file ${driveFile.name}:`, readError);
              continue;
            }
          } else {
            console.log(`⚠️ Skipping unsupported file type: ${driveFile.name}`);
            continue;
          }

          fileContents.push({ name: driveFile.name, content });
          console.log(`✅ Read ${driveFile.name}: ${content.length} characters`);

          // Clean up temp file
          try {
            fs.unlinkSync(filePath);
          } catch (err) {
            console.warn(`Could not delete temp file: ${filePath}`);
          }
        } catch (error) {
          console.error(`❌ Error processing file ${driveFile.name}:`, error);
          // Continue with next file
        }
      }

      if (fileContents.length === 0) {
        throw new Error('No file content could be read. Please check file formats (CSV, TXT supported).');
      }

      console.log(`📄 Successfully read ${fileContents.length} files`);

      // Combine file contents
      const combinedContent = fileContents
        .map(f => `=== File: ${f.name} ===\n${f.content}\n`)
        .join('\n\n');

      console.log(`📦 Combined content size: ${combinedContent.length} characters`);

      const prompt = query ? createTargetedQueryPrompt(query) : LEAD_EXTRACTION_PROMPT;

      // Query Gemini with text content
      const result = await this.geminiClient.queryWithTextContent(prompt, combinedContent, {
        temperature: 0.2,
        maxOutputTokens: 8192,
        systemInstruction: LEAD_EXTRACTION_SYSTEM_INSTRUCTION,
        sourceName: `${fileContents.length} files from Google Drive`,
      });

      // Parse response
      const leads = this.parseLeadsFromResponse(result.text);

      // Filter by confidence if specified
      let filteredLeads = leads;
      if (options?.minConfidence) {
        filteredLeads = leads.filter(
          lead => lead.confidence >= (options.minConfidence || 0)
        );
      }

      // Limit number of results if specified
      if (options?.maxLeads) {
        filteredLeads = filteredLeads.slice(0, options.maxLeads);
      }

      // Calculate average confidence
      const averageConfidence = filteredLeads.length > 0
        ? filteredLeads.reduce((sum, lead) => sum + lead.confidence, 0) / filteredLeads.length
        : 0;

      console.log(`✅ Extracted ${filteredLeads.length} leads with avg confidence ${(averageConfidence * 100).toFixed(1)}%`);

      return {
        leads: filteredLeads,
        rawResponse: result.text,
        averageConfidence,
      };
    } catch (error) {
      const errorDetails = error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : { message: String(error) };

      console.error('Error extracting leads from Drive:', {
        error: errorDetails,
        query: query || 'none',
      });

      throw new Error(`Failed to extract leads from Drive: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract leads from uploaded documents
   */
  async extractLeads(
    uploadedFiles: UploadedDocument[],
    query?: string,
    options?: {
      maxLeads?: number;
      minConfidence?: number;
    }
  ): Promise<{ leads: Lead[]; rawResponse: string; averageConfidence: number }> {
    try {
      // NEW: Try the text-based approach first if Drive client is available
      if (this.driveClient) {
        console.log('🔄 Using text-based approach with Google Drive files...');
        return await this.extractLeadsFromDrive(query, {
          ...options,
          maxFiles: 10, // Process up to 10 files
        });
      }

      // FALLBACK: Use the old file reference approach (may not work with Gemini 2.5 Pro)
      console.log('⚠️ Falling back to file reference approach (may fail with Gemini 2.5 Pro)...');

      const prompt = query ? createTargetedQueryPrompt(query) : LEAD_EXTRACTION_PROMPT;

      // Query documents with system instruction
      const result = await this.geminiClient.queryWithFileSearch(prompt, uploadedFiles, {
        temperature: 0.2, // Lower temperature for more consistent extraction
        maxOutputTokens: 8192,
        systemInstruction: LEAD_EXTRACTION_SYSTEM_INSTRUCTION,
      });

      // Parse response
      const leads = this.parseLeadsFromResponse(result.text);

      // Filter by confidence if specified
      let filteredLeads = leads;
      if (options?.minConfidence) {
        filteredLeads = leads.filter(
          lead => lead.confidence >= (options.minConfidence || 0)
        );
      }

      // Limit number of results if specified
      if (options?.maxLeads) {
        filteredLeads = filteredLeads.slice(0, options.maxLeads);
      }

      // Calculate average confidence
      const averageConfidence = filteredLeads.length > 0
        ? filteredLeads.reduce((sum, lead) => sum + lead.confidence, 0) / filteredLeads.length
        : 0;

      return {
        leads: filteredLeads,
        rawResponse: result.text,
        averageConfidence,
      };
    } catch (error) {
      // Enhanced error logging
      const errorDetails = error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : { message: String(error) };

      console.error('Error extracting leads:', {
        error: errorDetails,
        filesCount: uploadedFiles?.length || 0,
        query: query || 'none',
      });

      throw new Error(`Failed to extract leads: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse leads from Gemini response
   */
  private parseLeadsFromResponse(response: string): Lead[] {
    const leads: Lead[] = [];

    try {
      // Since we're requesting JSON response, try to parse directly first
      let parsed: any;

      try {
        // Try direct JSON parse (for responseMimeType: 'application/json')
        parsed = JSON.parse(response);
      } catch {
        // Fallback: Try to extract JSON from markdown code blocks
        const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
        let jsonText = jsonMatch ? jsonMatch[1] : response;

        // Try to find JSON object in the response
        if (!jsonMatch) {
          const objectMatch = jsonText.match(/\{[\s\S]*"leads"[\s\S]*\}/);
          jsonText = objectMatch ? objectMatch[0] : jsonText;
        }

        parsed = JSON.parse(jsonText);
      }

      // Extract leads array
      const leadsArray = parsed.leads || (Array.isArray(parsed) ? parsed : []);

      // Validate and add each lead
      if (Array.isArray(leadsArray)) {
        for (const leadData of leadsArray) {
          const validation = safeValidateLead({
            ...leadData,
            extractedAt: new Date(),
          });

          if (validation.success) {
            leads.push(validation.data);
          } else {
            console.warn('Invalid lead data:', validation.error.errors);
            // Try to salvage partial data
            const partialLead = this.salvagePartialLead(leadData);
            if (partialLead) {
              leads.push(partialLead);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error parsing leads from response:', error);
      console.error('Response:', response.substring(0, 500));
      // Try alternative parsing strategies
      const fallbackLeads = this.extractLeadsFallback(response);
      leads.push(...fallbackLeads);
    }

    return leads;
  }

  /**
   * Salvage partial lead data that didn't pass full validation
   */
  private salvagePartialLead(data: any): Lead | null {
    try {
      // Ensure minimum required fields
      if (!data.company?.name || !data.contacts || data.contacts.length === 0) {
        return null;
      }

      // Filter valid contacts
      const validContacts = data.contacts.filter((c: any) => c.name);

      if (validContacts.length === 0) {
        return null;
      }

      return {
        company: {
          name: data.company.name,
          industry: data.company.industry || undefined,
          size: data.company.size || undefined,
          website: data.company.website || undefined,
          location: data.company.location || undefined,
          description: data.company.description || undefined,
        },
        contacts: validContacts.map((c: any) => ({
          name: c.name,
          title: c.title || undefined,
          email: c.email || undefined,
          phone: c.phone || undefined,
          linkedin: c.linkedin || undefined,
        })),
        source: data.source || 'unknown',
        confidence: typeof data.confidence === 'number' ? data.confidence : 0.5,
        extractedAt: new Date(),
      };
    } catch (error) {
      console.error('Error salvaging partial lead:', error);
      return null;
    }
  }

  /**
   * Fallback extraction using pattern matching
   */
  private extractLeadsFallback(response: string): Lead[] {
    console.warn('Using fallback lead extraction - attempting pattern matching');
    const leads: Lead[] = [];

    try {
      // Look for company names - patterns like "Company: XYZ" or "회사: XYZ"
      const companyPatterns = [
        /(?:Company|회사|기업|업체)[:\s]+([^\n,]+)/gi,
        /(?:Name|이름)[:\s]+([^\n,]+)/gi,
      ];

      // Look for email addresses
      const emailPattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;

      // Look for phone numbers
      const phonePatterns = [
        /(?:Phone|전화|Tel)[:\s]*([\d\-+() ]+)/gi,
        /(\+?\d{1,3}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9})/g,
      ];

      const companyMatches = new Set<string>();
      const emailMatches = new Set<string>();
      const phoneMatches = new Set<string>();

      // Extract company names
      for (const pattern of companyPatterns) {
        const matches = response.matchAll(pattern);
        for (const match of matches) {
          if (match[1] && match[1].trim().length > 2) {
            companyMatches.add(match[1].trim());
          }
        }
      }

      // Extract emails
      const emails = response.matchAll(emailPattern);
      for (const match of emails) {
        emailMatches.add(match[1]);
      }

      // Extract phones
      for (const pattern of phonePatterns) {
        const matches = response.matchAll(pattern);
        for (const match of matches) {
          if (match[1] && match[1].trim().length >= 8) {
            phoneMatches.add(match[1].trim());
          }
        }
      }

      // If we found any company names, try to create leads
      if (companyMatches.size > 0) {
        const emailArray = Array.from(emailMatches);
        const phoneArray = Array.from(phoneMatches);

        for (const companyName of companyMatches) {
          // Create a basic lead with available information
          const lead: Lead = {
            company: {
              name: companyName,
            },
            contacts: [
              {
                name: 'Contact', // Generic name since we don't have specific contact names
                email: emailArray.length > 0 ? emailArray[0] : undefined,
                phone: phoneArray.length > 0 ? phoneArray[0] : undefined,
              },
            ],
            source: 'fallback-extraction',
            confidence: 0.3, // Low confidence for fallback extraction
            extractedAt: new Date(),
            notes: '⚠️ This lead was extracted using fallback pattern matching and may be incomplete or inaccurate.',
          };

          leads.push(lead);

          // Remove used contact info
          if (emailArray.length > 0) emailArray.shift();
          if (phoneArray.length > 0) phoneArray.shift();
        }

        console.log(`Fallback extraction found ${leads.length} potential leads`);
      } else {
        console.warn('Fallback extraction could not find any company names');
      }
    } catch (error) {
      console.error('Error in fallback extraction:', error);
    }

    return leads;
  }

  /**
   * Calculate accuracy metrics for extracted leads
   */
  calculateAccuracyMetrics(leads: Lead[]): {
    estimatedAccuracy: number;
    lowConfidenceCount: number;
    averageConfidence: number;
  } {
    if (leads.length === 0) {
      return {
        estimatedAccuracy: 0,
        lowConfidenceCount: 0,
        averageConfidence: 0,
      };
    }

    const confidenceScores = leads.map(lead => lead.confidence);
    const averageConfidence =
      confidenceScores.reduce((sum, score) => sum + score, 0) / confidenceScores.length;

    const lowConfidenceThreshold = 0.6;
    const lowConfidenceCount = confidenceScores.filter(
      score => score < lowConfidenceThreshold
    ).length;

    // Estimated accuracy considers:
    // - Average confidence score (70% weight)
    // - Completeness of data (30% weight)
    const completenessScores = leads.map(lead => {
      let score = 0;
      const weights = {
        hasEmail: 0.3,
        hasPhone: 0.2,
        hasWebsite: 0.2,
        hasIndustry: 0.15,
        hasLocation: 0.15,
      };

      if (lead.contacts.some(c => c.email)) score += weights.hasEmail;
      if (lead.contacts.some(c => c.phone)) score += weights.hasPhone;
      if (lead.company.website) score += weights.hasWebsite;
      if (lead.company.industry) score += weights.hasIndustry;
      if (lead.company.location) score += weights.hasLocation;

      return score;
    });

    const averageCompleteness =
      completenessScores.reduce((sum, score) => sum + score, 0) / completenessScores.length;

    const estimatedAccuracy = averageConfidence * 0.7 + averageCompleteness * 0.3;

    return {
      estimatedAccuracy,
      lowConfidenceCount,
      averageConfidence,
    };
  }
}

/**
 * Create lead extractor from environment
 */
export function createLeadExtractor(geminiClient: GeminiFileSearchClient, driveClient?: GoogleDriveClient): LeadExtractor {
  return new LeadExtractor(geminiClient, driveClient);
}

/**
 * Detect if a user query is asking for lead extraction
 */
export function isLeadExtractionQuery(query: string): boolean {
  const leadKeywords = [
    // English keywords
    'lead', 'leads',
    'contact', 'contacts',
    'company', 'companies',
    'extract', 'extraction',
    'find', 'search',
    'email', 'emails',
    'phone', 'phones',
    'business', 'businesses',
    'client', 'clients',
    'prospect', 'prospects',
    'drive', 'documents',
    'vendor', 'vendors',
    'supplier', 'suppliers',
    'distributor', 'distributors',
    'manufacturer', 'manufacturers',

    // Korean keywords
    '리드', '연락처', '컨택',
    '회사', '기업', '업체',
    '추출', '찾아', '검색',
    '이메일', '전화', '연락',
    '고객', '거래처', '클라이언트',
    '제조사', '유통사', '공급사', '업체',
    '비즈니스', '사업자',
    '문서', '드라이브',
    '정보', '데이터',

    // Japanese keywords (bonus)
    '会社', '企業', '連絡先',
    '取引先', '顧客',
  ];

  const lowerQuery = query.toLowerCase();
  return leadKeywords.some(keyword => lowerQuery.includes(keyword));
}

/**
 * Detect if query contains a Google Drive link
 */
export function containsDriveLink(query: string): boolean {
  const driveLinkPattern = /drive\.google\.com/i;
  return driveLinkPattern.test(query);
}
