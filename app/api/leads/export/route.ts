import { NextRequest, NextResponse } from 'next/server';
import { Lead } from '@/lib/schemas/lead';
import { unparse } from 'papaparse';

export const dynamic = 'force-dynamic';

/**
 * POST /api/leads/export
 * Export leads to CSV format
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { leads, format = 'csv' } = body;

    if (!leads || !Array.isArray(leads)) {
      return NextResponse.json(
        { error: 'Leads array is required' },
        { status: 400 }
      );
    }

    if (format === 'csv') {
      const csv = convertLeadsToCSV(leads);

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="leads_export_${Date.now()}.csv"`,
        },
      });
    } else if (format === 'json') {
      return new NextResponse(JSON.stringify(leads, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="leads_export_${Date.now()}.json"`,
        },
      });
    } else {
      return NextResponse.json(
        { error: 'Unsupported format. Use "csv" or "json"' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error exporting leads:', error);
    return NextResponse.json(
      { error: 'Failed to export leads', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Convert leads to CSV format
 * Flattens the lead structure for CSV export
 */
function convertLeadsToCSV(leads: Lead[]): string {
  // Flatten leads into rows (one row per contact)
  const rows: any[] = [];

  for (const lead of leads) {
    const baseData = {
      company_name: lead.company.name,
      company_industry: lead.company.industry || '',
      company_size: lead.company.size || '',
      company_website: lead.company.website || '',
      company_location: lead.company.location || '',
      company_description: lead.company.description || '',
      source_document: lead.source,
      confidence_score: lead.confidence,
      extracted_at: lead.extractedAt?.toISOString() || '',
    };

    if (lead.contacts.length > 0) {
      // Create a row for each contact
      for (const contact of lead.contacts) {
        rows.push({
          ...baseData,
          contact_name: contact.name,
          contact_title: contact.title || '',
          contact_email: contact.email || '',
          contact_phone: contact.phone || '',
          contact_linkedin: contact.linkedin || '',
        });
      }
    } else {
      // If no contacts, still create one row for the company
      rows.push({
        ...baseData,
        contact_name: '',
        contact_title: '',
        contact_email: '',
        contact_phone: '',
        contact_linkedin: '',
      });
    }
  }

  // Convert to CSV using papaparse
  const csv = unparse(rows, {
    header: true,
    columns: [
      'company_name',
      'company_industry',
      'company_size',
      'company_website',
      'company_location',
      'company_description',
      'contact_name',
      'contact_title',
      'contact_email',
      'contact_phone',
      'contact_linkedin',
      'source_document',
      'confidence_score',
      'extracted_at',
    ],
  });

  return csv;
}
