import { ChatSimple } from "@/components/chat-simple";
import { ArtifactPanel } from "@/components/artifact-panel";
import { ArtifactProvider } from "@/lib/contexts/artifact-context";

export default function Home() {
  return (
    <ArtifactProvider>
      <div className="flex h-screen overflow-hidden">
        {/* Left Panel - Chat */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <ChatSimple />
        </div>

        {/* Right Panel - Artifact */}
        <div className="w-full lg:w-1/2 flex-shrink-0">
          <ArtifactPanel />
        </div>
      </div>
    </ArtifactProvider>
  );
}
