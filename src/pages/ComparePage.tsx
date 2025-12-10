import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, GitCompare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/Layout';
import { ComparisonPanel } from '@/components/ComparisonPanel';
import { useSession } from '@/context/SessionContext';

const ComparePage = () => {
  const navigate = useNavigate();
  const { state, setCurrentStep, completeStep } = useSession();

  useEffect(() => {
    setCurrentStep('compare');
  }, [setCurrentStep]);

  useEffect(() => {
    if (!state.aiRgb) {
      navigate('/predict');
    }
  }, [state.aiRgb, navigate]);

  const handleContinue = () => {
    completeStep('compare');
    navigate('/chat');
  };

  if (!state.aiRgb) {
    return null;
  }

  return (
    <Layout showProgress>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <GitCompare className="w-4 h-4" />
              Step 6: Compare Results
            </span>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
              Your Prediction vs AI Result
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Let's see how close your color prediction was to the AI's calculated value 
              based on the robot's actual position.
            </p>
          </div>

          {/* Comparison Panel */}
          <ComparisonPanel
            studentRgb={state.studentRgb}
            aiRgb={state.aiRgb}
            className="mb-8"
          />

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate('/predict')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            
            <Button 
              variant="hero" 
              size="lg"
              onClick={handleContinue}
            >
              Chat with AI Tutor
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ComparePage;
