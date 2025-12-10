import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ArrowLeft, ArrowRight, Move3D } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/Layout';
import { RobotScene } from '@/components/RobotScene';
import { AxisIndicator } from '@/components/AxisIndicator';
import { useSession } from '@/context/SessionContext';
import { sendRobotCoordinates } from '@/lib/api';

const PlacementPage = () => {
  const navigate = useNavigate();
  const { state, setRobotCoordinates, setCurrentStep, completeStep } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setCurrentStep('placement');
  }, [setCurrentStep]);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await sendRobotCoordinates(state.robotCoordinates);
      completeStep('placement');
      navigate('/upload');
    } catch (error) {
      console.error('Failed to submit coordinates:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout showProgress>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Move3D className="w-4 h-4" />
              Step 1: Place the Robot
            </span>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
              Position RoboFarmer in 3D Space
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Drag the robot to any position inside the cube. The X, Y, Z coordinates 
              will be used to calculate the RGB color.
            </p>
          </div>

          {/* 3D Scene */}
          <div className="rounded-2xl border border-border overflow-hidden bg-card shadow-lg mb-6">
            <RobotScene
              coordinates={state.robotCoordinates}
              onCoordinatesChange={setRobotCoordinates}
              className="w-full h-[400px] md:h-[500px]"
            />
          </div>

          {/* Coordinates Display */}
          <div className="flex justify-center mb-8">
            <div className="inline-block p-4 rounded-xl bg-card border border-border shadow-sm">
              <p className="text-sm text-muted-foreground text-center mb-3">
                Current Position
              </p>
              <AxisIndicator
                x={state.robotCoordinates.x}
                y={state.robotCoordinates.y}
                z={state.robotCoordinates.z}
                size="lg"
              />
            </div>
          </div>

          {/* Tips */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Drag', desc: 'Click and drag the robot to move it horizontally' },
              { label: 'Orbit', desc: 'Click and drag the background to rotate the view' },
              { label: 'Zoom', desc: 'Use scroll wheel to zoom in and out' },
            ].map(({ label, desc }, i) => (
              <div key={i} className="p-4 rounded-lg bg-secondary/50 text-center">
                <p className="font-medium text-foreground">{label}</p>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
            
            <Button 
              variant="hero" 
              size="lg"
              onClick={handleConfirm}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                'Saving...'
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Confirm Placement
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PlacementPage;
