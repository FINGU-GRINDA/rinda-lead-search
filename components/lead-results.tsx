"use client";

import { Lead } from "@/lib/schemas/lead";
import { motion } from "framer-motion";
import classNames from "classnames";
import { useState } from "react";

interface LeadResultsProps {
  leads: Lead[];
  onExport?: () => void;
}

export function LeadResults({ leads, onExport }: LeadResultsProps) {
  const [expandedLeads, setExpandedLeads] = useState<Set<number>>(new Set());

  const toggleLead = (index: number) => {
    const newExpanded = new Set(expandedLeads);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedLeads(newExpanded);
  };

  if (leads.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-muted/30 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          No leads found. Try a different search query or sync more documents.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Found <span className="font-semibold text-foreground">{leads.length}</span> leads
        </div>
        {onExport && (
          <button
            onClick={onExport}
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Export to CSV
          </button>
        )}
      </div>

      <div className="space-y-3">
        {leads.map((lead, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="rounded-lg border border-border bg-background overflow-hidden"
          >
            {/* Lead Header */}
            <button
              onClick={() => toggleLead(index)}
              className="w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm truncate">
                      {lead.company.name}
                    </h3>
                    {lead.company.industry && (
                      <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-muted">
                        {lead.company.industry}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    {lead.contacts.length > 0 && (
                      <span>{lead.contacts.length} contact{lead.contacts.length > 1 ? 's' : ''}</span>
                    )}
                    {lead.company.location && (
                      <span>{lead.company.location}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <ConfidenceBadge score={lead.confidence} />
                  <svg
                    className={classNames(
                      "w-4 h-4 text-muted-foreground transition-transform",
                      expandedLeads.has(index) && "rotate-180"
                    )}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </button>

            {/* Expanded Details */}
            {expandedLeads.has(index) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-border"
              >
                <div className="p-4 space-y-4">
                  {/* Company Details */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase">
                      Company Information
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {lead.company.website && (
                        <div>
                          <span className="text-muted-foreground">Website:</span>{" "}
                          <a
                            href={lead.company.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {lead.company.website}
                          </a>
                        </div>
                      )}
                      {lead.company.size && (
                        <div>
                          <span className="text-muted-foreground">Size:</span> {lead.company.size}
                        </div>
                      )}
                      {lead.company.description && (
                        <div className="col-span-2">
                          <span className="text-muted-foreground">Description:</span>{" "}
                          {lead.company.description}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Contacts */}
                  {lead.contacts.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase">
                        Contacts ({lead.contacts.length})
                      </h4>
                      <div className="space-y-3">
                        {lead.contacts.map((contact, contactIndex) => (
                          <div
                            key={contactIndex}
                            className="rounded-md bg-muted/30 p-3 space-y-1"
                          >
                            <div className="font-medium text-sm">{contact.name}</div>
                            {contact.title && (
                              <div className="text-xs text-muted-foreground">{contact.title}</div>
                            )}
                            <div className="flex flex-wrap gap-3 text-xs mt-2">
                              {contact.email && (
                                <a
                                  href={`mailto:${contact.email}`}
                                  className="text-primary hover:underline flex items-center gap-1"
                                >
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                  </svg>
                                  {contact.email}
                                </a>
                              )}
                              {contact.phone && (
                                <a
                                  href={`tel:${contact.phone}`}
                                  className="text-primary hover:underline flex items-center gap-1"
                                >
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                  </svg>
                                  {contact.phone}
                                </a>
                              )}
                              {contact.linkedin && (
                                <a
                                  href={contact.linkedin}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline flex items-center gap-1"
                                >
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                  </svg>
                                  LinkedIn
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Source */}
                  <div className="pt-2 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                    <span>Source: {lead.source}</span>
                    {lead.extractedAt && (
                      <span>Extracted: {new Date(lead.extractedAt).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function ConfidenceBadge({ score }: { score: number }) {
  const percentage = Math.round(score * 100);
  const color =
    score >= 0.8
      ? "bg-green-500/10 text-green-600 dark:text-green-400"
      : score >= 0.6
      ? "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
      : "bg-red-500/10 text-red-600 dark:text-red-400";

  return (
    <span className={classNames("px-2 py-0.5 rounded-full text-xs font-medium", color)}>
      {percentage}%
    </span>
  );
}
