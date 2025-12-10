import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/Layout';
import { RgbPredictForm } from '@/components/RgbPredictForm';
import { AxisIndicator } from '@/components/AxisIndicator';
import { useSession } from '@/context/SessionContext';
import { submitStudentRgb, fetchAiRgb, type RGBColor } from '@/lib/api';

const PredictPage = () => {
  const navigate = useNavigate();
  const { state, setStudentRgb, setAiRgb, setCurrentStep, completeStep } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setCurrentStep('predict');
  }, [setCurrentStep]);

  const handleSubmit = async (rgb: RGBColor) => {
    setIsSubmitting(true);
    try {
      await submitStudentRgb(rgb);
      setStudentRgb(rgb);
      
      // Fetch AI's RGB prediction based on actual coordinates
      const aiRgb = await fetchAiRgb(state.robotCoordinates);
      setAiRgb(aiRgb);
      
      completeStep('predict');
      navigate('/compare');
    } catch (error) {
      console.error('Failed to submit RGB:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout showProgress>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Palette className="w-4 h-4" />
              Step 5: Predict RGB Color
            </span>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
              Predict the Color
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Based on the robot's position, predict what RGB color values the AI will calculate.
              Remember: X→Red, Y→Green, Z→Blue!
            </p>
          </div>

          {/* Position Reminder */}
          <div className="flex justify-center mb-8">
            <div className="inline-block p-4 rounded-xl bg-card border border-border shadow-sm">
              <p className="text-sm text-muted-foreground text-center mb-3">
                Robot Position (Reference)
              </p>
              <AxisIndicator
                x={state.robotCoordinates.x}
                y={state.robotCoordinates.y}
                z={state.robotCoordinates.z}
                size="md"
              />
            </div>
          </div>

          {/* Hint Card */}
          <div className="mb-8 p-6 rounded-xl bg-accent/10 border border-accent/20">
            <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
              🎨 Color Theory Tip
            </h3>
            <p className="text-sm text-muted-foreground">
              In this system, the position coordinates directly map to RGB color values:
            </p>
            <ul className="text-sm text-muted-foreground mt-2 space-y-1">
              <li>• <span className="text-destructive font-medium">X position</span> → <span className="text-destructive font-medium">Red</span> value (0-255)</li>
              <li>• <span className="text-accent font-medium">Y position</span> → <span className="text-accent font-medium">Green</span> value (0-255)</li>
              <li>• <span className="text-primary font-medium">Z position</span> → <span className="text-primary font-medium">Blue</span> value (0-255)</li>
            </ul>
          </div>

          {/* Form */}
          <div className="rounded-xl border border-border bg-card p-6 md:p-8 mb-8">
            <RgbPredictForm
              initialValues={state.studentRgb}
              onSubmit={handleSubmit}
              isLoading={isSubmitting}
            />
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate('/coords')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PredictPage;
