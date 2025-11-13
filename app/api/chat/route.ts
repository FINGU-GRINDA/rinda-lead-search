import { modelID, models, myProvider } from "@/lib/models";
import { convertToModelMessages, smoothStream, streamText, UIMessage } from "ai";
import { NextRequest } from "next/server";
import { isLeadExtractionQuery, containsDriveLink, createLeadExtractor } from "@/lib/lead-extractor";
import { createGeminiClient } from "@/lib/gemini-file-search";
import { createDriveClient } from "@/lib/google-drive";

export async function POST(request: NextRequest) {
  const {
    messages,
    selectedModelId,
    isReasoningEnabled,
  }: {
    messages: Array<UIMessage>;
    selectedModelId?: modelID;
    isReasoningEnabled?: boolean;
  } = await request.json();

  const fallbackModel: modelID = "sonnet-3.7";
  const resolvedModelId =
    selectedModelId &&
    Object.prototype.hasOwnProperty.call(models, selectedModelId)
      ? selectedModelId
      : fallbackModel;

  const reasoningEnabled = typeof isReasoningEnabled === "boolean" ? isReasoningEnabled : true;

  // Get the last user message text
  const lastMessage = messages[messages.length - 1];
  let userQuery = "";
  if (lastMessage && typeof lastMessage === 'object') {
    // Check for 'content' field first (standard AI SDK format)
    if ('content' in lastMessage && typeof lastMessage.content === 'string') {
      userQuery = lastMessage.content;
    } else if ('text' in lastMessage && typeof lastMessage.text === 'string') {
      userQuery = lastMessage.text;
    } else if ('parts' in lastMessage && Array.isArray(lastMessage.parts)) {
      const textParts = lastMessage.parts.filter((p: any) => p.type === 'text');
      userQuery = textParts.map((p: any) => p.text).join(' ');
    }
  }

  console.log('📝 Received query:', userQuery);
  console.log('🔍 Is lead query:', isLeadExtractionQuery(userQuery));

  // Check if this is a lead extraction query
  const isLeadQuery = isLeadExtractionQuery(userQuery) || containsDriveLink(userQuery);

  // Handle lead extraction queries differently
  if (isLeadQuery) {
    try {
      const geminiClient = createGeminiClient();

      // Create Google Drive client for text-based approach
      let driveClient;
      try {
        driveClient = createDriveClient();
        console.log('✅ Google Drive client initialized');
      } catch (error) {
        console.warn('⚠️ Could not initialize Google Drive client:', error);
        // Continue without Drive client - will fall back to file reference approach
      }

      const uploadedFiles = await geminiClient.listFiles();
      const activeFiles = uploadedFiles.filter(f => f.state === "ACTIVE");

      if (activeFiles.length === 0 && !driveClient) {
        // No files available - return helpful message
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          start(controller) {
            const message = "현재 분석 가능한 문서가 없습니다. 먼저 Google Drive 동기화를 실행해주세요.\n\nNo documents are currently available for analysis. Please sync your Google Drive first.";
            controller.enqueue(encoder.encode(`0:${JSON.stringify([{ type: 'text', text: message }])}\n`));
            controller.close();
          }
        });

        return new Response(stream, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'X-Vercel-AI-Data-Stream': 'v1'
          }
        });
      }

      // Extract leads using Gemini File Search with proper system instruction
      // Pass Drive client for text-based approach (NEW!)
      const leadExtractor = createLeadExtractor(geminiClient, driveClient);

      console.log(`🔍 Extracting leads from ${activeFiles.length} active files for query: "${userQuery.substring(0, 100)}"`);

      // Use the lead extractor with system instruction - pass file objects instead of names
      const extractionResult = await leadExtractor.extractLeads(activeFiles, userQuery, {
        maxLeads: 50,
        minConfidence: 0.6,
      });

      console.log(`✅ Lead extraction completed: ${extractionResult.leads.length} leads found`);

      // Format the results for display
      const formattedResponse = {
        leads: extractionResult.leads,
        summary: extractionResult.leads.length > 0
          ? `Found ${extractionResult.leads.length} leads with average confidence of ${(extractionResult.averageConfidence * 100).toFixed(1)}%`
          : `No leads found matching your query. Try:\n- Using different keywords (e.g., "회사", "기업", "업체")\n- Being more specific about what you're looking for\n- Checking if documents are properly synced`,
        rawData: extractionResult.rawResponse
      };

      // Convert to JSON string for display
      const resultText = JSON.stringify(formattedResponse, null, 2);
      
      // Create a stream that directly returns our text without calling a model
      // This avoids the error from streamText trying to call the model
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          try {
            // Split text into chunks for streaming effect
            const chunks = resultText.match(/.{1,200}/g) || [resultText];
            for (let i = 0; i < chunks.length; i++) {
              const chunk = chunks[i];
              // Format: "0:" prefix + JSON array of text parts (Vercel AI SDK format)
              const data = `0:${JSON.stringify([{ type: 'text', text: chunk }])}\n`;
              controller.enqueue(encoder.encode(data));
              // Small delay to simulate streaming
              if (i < chunks.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 10));
              }
            }
            controller.close();
          } catch (error) {
            console.error('Error in stream:', error);
            controller.error(error);
          }
        }
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'X-Vercel-AI-Data-Stream': 'v1'
        }
      });

    } catch (error) {
      // Enhanced error logging
      const errorDetails = error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : { message: String(error) };
      
      console.error("Lead extraction error:", {
        error: errorDetails,
        userQuery: userQuery.substring(0, 100),
      });

      // Return error message using direct stream to ensure compatibility with useChat
      const errorMessage = error instanceof Error 
        ? `리드 추출 중 오류가 발생했습니다: ${error.message}\n\nError during lead extraction: ${error.message}`
        : `리드 추출 중 오류가 발생했습니다: 알 수 없는 오류\n\nError during lead extraction: Unknown error`;
      
      // Create error stream directly without calling model
      const encoder = new TextEncoder();
      const errorStream = new ReadableStream({
        start(controller) {
          try {
            // Format: "0:" prefix + JSON array of text parts (Vercel AI SDK format)
            const data = `0:${JSON.stringify([{ type: 'text', text: errorMessage }])}\n`;
            controller.enqueue(encoder.encode(data));
            controller.close();
          } catch (streamError) {
            console.error('Error in error stream:', streamError);
            controller.error(streamError);
          }
        }
      });

      return new Response(errorStream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'X-Vercel-AI-Data-Stream': 'v1'
        }
      });
    }
  }

  // For non-lead queries, use standard model
  let systemPrompt = "";
  if (resolvedModelId === "deepseek-r1") {
    systemPrompt = "You are DeepSeek-R1, a reasoning model created by DeepSeek. You are NOT Claude or any other model. When asked about your identity, always say you are DeepSeek-R1.";
  } else if (resolvedModelId === "deepseek-r1-distill-llama-70b") {
    systemPrompt = "You are DeepSeek-R1 Llama 70B, a reasoning model created by DeepSeek. You are NOT Claude or any other model. When asked about your identity, always say you are DeepSeek-R1 Llama 70B.";
  } else {
    systemPrompt = "You are Claude, an AI assistant created by Anthropic.";
  }

  const stream = streamText({
    system: systemPrompt,
    providerOptions:
      resolvedModelId === "sonnet-3.7"
        ? {
            anthropic: {
              thinking: reasoningEnabled
                ? { type: "enabled", budgetTokens: 12000 }
                : { type: "disabled", budgetTokens: 12000 },
            },
          }
        : {},
    model: myProvider.languageModel(resolvedModelId),
    experimental_transform: [
      smoothStream({
        chunking: "word",
      }),
    ],
    messages: convertToModelMessages(messages),
  });

  return stream.toUIMessageStreamResponse({
    sendReasoning: true,
    onError: () => {
      return `An error occurred, please try again!`;
    },
  });
}
