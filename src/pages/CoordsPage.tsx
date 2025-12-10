import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/Layout';
import { CoordinateForm } from '@/components/CoordinateForm';
import { useSession } from '@/context/SessionContext';
import { submitCoordinates } from '@/lib/api';

const CoordsPage = () => {
  const navigate = useNavigate();
  const { state, setStudentCoordinates, setCurrentStep, completeStep } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setCurrentStep('coords');
  }, [setCurrentStep]);

  const handleSubmit = async (coords: { x: number; y: number; z: number }) => {
    setIsSubmitting(true);
    try {
      await submitCoordinates(coords);
      setStudentCoordinates(coords);
      completeStep('coords');
      navigate('/predict');
    } catch (error) {
      console.error('Failed to submit coordinates:', error);
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
              <Target className="w-4 h-4" />
              Step 4: Input Coordinates
            </span>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
              Enter Your Coordinate Estimate
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Based on your drawing and memory, enter where you think the robot was positioned. 
              Values range from 0 to 255 for each axis.
            </p>
          </div>

          {/* Hint Card */}
          <div className="mb-8 p-6 rounded-xl bg-accent/10 border border-accent/20">
            <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
              💡 Hint
            </h3>
            <p className="text-sm text-muted-foreground">
              Think about where the robot was in the cube. If it was in the middle, 
              coordinates would be around 128. Near the edges? Closer to 0 or 255.
            </p>
          </div>

          {/* Form */}
          <div className="rounded-xl border border-border bg-card p-6 md:p-8 mb-8">
            <CoordinateForm
              initialValues={state.studentCoordinates || { x: 128, y: 128, z: 128 }}
              onSubmit={handleSubmit}
              isLoading={isSubmitting}
            />
          </div>

          {/* Axis Legend */}
          <div className="grid grid-cols-3 gap-4 mb-8 text-center text-sm">
            <div className="p-3 rounded-lg bg-destructive/10">
              <span className="font-semibold text-destructive">X</span>
              <p className="text-muted-foreground">Left ↔ Right</p>
            </div>
            <div className="p-3 rounded-lg bg-accent/10">
              <span className="font-semibold text-accent">Y</span>
              <p className="text-muted-foreground">Down ↕ Up</p>
            </div>
            <div className="p-3 rounded-lg bg-primary/10">
              <span className="font-semibold text-primary">Z</span>
              <p className="text-muted-foreground">Back ↔ Front</p>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate('/verify')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CoordsPage;
