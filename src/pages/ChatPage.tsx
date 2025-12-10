import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Home, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/Layout';
import { ChatTutor } from '@/components/ChatTutor';
import { ComparisonPanel } from '@/components/ComparisonPanel';
import { useSession } from '@/context/SessionContext';
import { sendChatMessage, saveSessionResults, calculateRgbDelta, type ChatMessage } from '@/lib/api';

const ChatPage = () => {
  const navigate = useNavigate();
  const { state, addChatMessage, setCurrentStep, completeStep, resetSession } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setCurrentStep('chat');
  }, [setCurrentStep]);

  useEffect(() => {
    if (!state.aiRgb) {
      navigate('/compare');
    }
  }, [state.aiRgb, navigate]);

  const handleSendMessage = async (content: string) => {
    // Add user message
    const userMessage: ChatMessage = {
      role: 'user',
      content,
      timestamp: new Date(),
    };
    addChatMessage(userMessage);

    setIsLoading(true);
    try {
      const response = await sendChatMessage(content, {
        coords: state.robotCoordinates,
        studentRgb: state.studentRgb,
        aiRgb: state.aiRgb!,
      });

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };
      addChatMessage(assistantMessage);
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: "I'm sorry, I couldn't process your message. Please try again.",
        timestamp: new Date(),
      };
      addChatMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinishSession = async () => {
    try {
      await saveSessionResults({
        studentId: state.studentId,
        date: new Date(),
        robotCoordinates: state.robotCoordinates,
        cvAccuracy: state.cvResult?.accuracy || 0,
        studentRgb: state.studentRgb,
        aiRgb: state.aiRgb!,
        rgbDelta: calculateRgbDelta(state.studentRgb, state.aiRgb!),
      });
      completeStep('chat');
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  };

  const handleStartNewSession = async () => {
    await handleFinishSession();
    resetSession();
    navigate('/');
  };

  if (!state.aiRgb) {
    return null;
  }

  return (
    <Layout showProgress>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <MessageCircle className="w-4 h-4" />
              Step 7: Discuss with AI Tutor
            </span>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
              Learn From Your Results
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Chat with the AI tutor to understand the connection between 3D coordinates 
              and RGB colors. Ask any questions you have!
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            {/* Results Summary */}
            <div>
              <h2 className="font-display font-semibold text-lg text-foreground mb-4">
                Your Results Summary
              </h2>
              <ComparisonPanel
                studentRgb={state.studentRgb}
                aiRgb={state.aiRgb}
              />
            </div>

            {/* Chat */}
            <div>
              <h2 className="font-display font-semibold text-lg text-foreground mb-4">
                AI Tutor
              </h2>
              <ChatTutor
                messages={state.chatHistory}
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
              />
            </div>
          </div>

          {/* Session Complete Actions */}
          <div className="rounded-xl border border-border bg-accent/10 p-6 mb-8">
            <div className="text-center">
              <h3 className="font-display font-semibold text-lg text-foreground mb-2">
                🎉 Great job completing the lesson!
              </h3>
              <p className="text-muted-foreground mb-6">
                You've learned how 3D coordinates map to RGB colors. Ready for another round?
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="hero" onClick={handleStartNewSession}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Start New Session
                </Button>
                <Button asChild variant="outline">
                  <Link to="/">
                    <Home className="w-4 h-4 mr-2" />
                    Back to Home
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-start">
            <Button variant="ghost" onClick={() => navigate('/compare')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Comparison
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ChatPage;
