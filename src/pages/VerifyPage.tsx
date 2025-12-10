import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Eye, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/Layout';
import { CvResultsPanel } from '@/components/CvResultsPanel';
import { useSession } from '@/context/SessionContext';
import { fetchCvResult } from '@/lib/api';

const VerifyPage = () => {
  const navigate = useNavigate();
  const { state, setCvResult, setCurrentStep, completeStep } = useSession();
  const [isLoading, setIsLoading] = useState(!state.cvResult);

  useEffect(() => {
    setCurrentStep('verify');
  }, [setCurrentStep]);

  useEffect(() => {
    if (!state.uploadedImage) {
      navigate('/upload');
      return;
    }

    if (!state.cvResult) {
      const fetchResults = async () => {
        setIsLoading(true);
        try {
          const result = await fetchCvResult(state.uploadedImage!);
          setCvResult(result);
        } catch (error) {
          console.error('Failed to fetch CV results:', error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchResults();
    }
  }, [state.uploadedImage, state.cvResult, setCvResult, navigate]);

  const handleContinue = () => {
    completeStep('verify');
    navigate('/coords');
  };

  return (
    <Layout showProgress>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Eye className="w-4 h-4" />
              Step 3: CV Verification
            </span>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
              Computer Vision Analysis
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Our AI is analyzing your drawing to verify it shows the 3D scene correctly.
            </p>
          </div>

          {/* Results Panel */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 rounded-xl border border-border bg-card">
              <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
              <p className="text-lg font-medium text-foreground mb-2">Analyzing your drawing...</p>
              <p className="text-sm text-muted-foreground">
                Detecting objects, measuring accuracy, and verifying positions
              </p>
            </div>
          ) : state.cvResult && state.uploadedImage ? (
            <CvResultsPanel
              result={state.cvResult}
              imageUrl={state.uploadedImage}
              className="mb-8"
            />
          ) : (
            <div className="text-center py-20 rounded-xl border border-border bg-card">
              <p className="text-muted-foreground">No image uploaded yet.</p>
              <Button variant="outline" onClick={() => navigate('/upload')} className="mt-4">
                Go to Upload
              </Button>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate('/upload')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            
            <Button 
              variant="hero" 
              size="lg"
              onClick={handleContinue}
              disabled={isLoading}
            >
              Accept & Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default VerifyPage;
