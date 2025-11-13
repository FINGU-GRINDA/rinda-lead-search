import { z } from 'zod';

/**
 * Schema for contact information within a lead
 */
export const ContactSchema = z.object({
  name: z.string().min(1, 'Contact name is required'),
  title: z.string().optional(),
  email: z
    .string()
    .email('Invalid email format')
    .optional()
    .or(z.literal('')),
  phone: z.string().optional(),
  linkedin: z.string().url().optional().or(z.literal('')),
});

/**
 * Schema for company information
 */
export const CompanySchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  industry: z.string().optional(),
  size: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  location: z.string().optional(),
  description: z.string().optional(),
});

/**
 * Schema for a complete lead entry
 */
export const LeadSchema = z.object({
  company: CompanySchema,
  contacts: z.array(ContactSchema).min(1, 'At least one contact is required'),
  source: z.string().describe('Source document filename or reference'),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe('Confidence score from 0 to 1'),
  extractedAt: z.date().optional(),
  metadata: z
    .object({
      documentType: z.string().optional(),
      documentUrl: z.string().optional(),
      keywords: z.array(z.string()).optional(),
    })
    .optional(),
});

/**
 * Schema for lead extraction job
 */
export const LeadExtractionJobSchema = z.object({
  jobId: z.string().uuid(),
  status: z.enum(['pending', 'processing', 'completed', 'failed']),
  documentsFound: z.number().int().nonnegative(),
  documentsProcessed: z.number().int().nonnegative(),
  leadsExtracted: z.number().int().nonnegative(),
  startedAt: z.date(),
  completedAt: z.date().optional(),
  error: z.string().optional(),
});

/**
 * Schema for lead extraction results
 */
export const LeadExtractionResultSchema = z.object({
  jobId: z.string().uuid(),
  status: z.enum(['completed', 'partial', 'failed']),
  leads: z.array(LeadSchema),
  documentsProcessed: z.number().int(),
  accuracyMetrics: z.object({
    estimatedAccuracy: z.number().min(0).max(1),
    lowConfidenceCount: z.number().int().nonnegative(),
    averageConfidence: z.number().min(0).max(1),
  }),
  processingTime: z.number().describe('Processing time in milliseconds'),
});

/**
 * Schema for Google Drive sync job
 */
export const DriveSyncJobSchema = z.object({
  jobId: z.string().uuid(),
  folderId: z.string(),
  status: z.enum(['scanning', 'downloading', 'uploading', 'indexing', 'completed', 'failed']),
  filesFound: z.number().int().nonnegative(),
  filesProcessed: z.number().int().nonnegative(),
  filesFailed: z.number().int().nonnegative(),
  progress: z.number().min(0).max(100),
  startedAt: z.date(),
  completedAt: z.date().optional(),
  error: z.string().optional(),
});

// Type exports
export type Contact = z.infer<typeof ContactSchema>;
export type Company = z.infer<typeof CompanySchema>;
export type Lead = z.infer<typeof LeadSchema>;
export type LeadExtractionJob = z.infer<typeof LeadExtractionJobSchema>;
export type LeadExtractionResult = z.infer<typeof LeadExtractionResultSchema>;
export type DriveSyncJob = z.infer<typeof DriveSyncJobSchema>;

/**
 * Validates lead data and returns typed result
 */
export function validateLead(data: unknown): Lead {
  return LeadSchema.parse(data);
}

/**
 * Safely validates lead data and returns result or error
 */
export function safeValidateLead(
  data: unknown
): { success: true; data: Lead } | { success: false; error: z.ZodError } {
  const result = LeadSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}
