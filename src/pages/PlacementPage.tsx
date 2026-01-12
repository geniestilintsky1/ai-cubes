import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ArrowLeft, ArrowRight, Move3D } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/Layout';
import { RGBCoordinateLab, type RGBPosition } from '@/components/3d/RGBCoordinateLab';
import { useSession } from '@/context/SessionContext';
import { sendRobotCoordinates } from '@/lib/api';

const PlacementPage = () => {
  const navigate = useNavigate();
  const { state, setRobotCoordinates, setCurrentStep, completeStep } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setCurrentStep('placement');
  }, [setCurrentStep]);

  const handlePositionChange = useCallback((pos: RGBPosition) => {
    // Map RGB position to robot coordinates (R→X, G→Y, B→Z for API compatibility)
    setRobotCoordinates({ x: pos.r, y: pos.g, z: pos.b });
  }, [setRobotCoordinates]);

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
              Step 1: Position in RGB Space
            </span>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
              RGB Coordinate Laboratory
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Position the marker in 3D space. X-axis = Red, Z-axis = Green, Y-axis (height) = Blue. 
              Your spatial position determines the RGB color value.
            </p>
          </div>

          {/* 3D Scene */}
          <div className="rounded-2xl border border-border overflow-hidden bg-card shadow-lg mb-6">
            <RGBCoordinateLab 
              className="w-full h-[500px] md:h-[600px]" 
              onPositionChange={handlePositionChange}
              initialPosition={{ 
                r: state.robotCoordinates.x, 
                g: state.robotCoordinates.y, 
                b: state.robotCoordinates.z 
              }}
              showOctopuses={true}
            />
          </div>

          {/* RGB Mapping Guide */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            {[
              { color: 'bg-red-500', label: 'X-Axis → Red (R)', desc: 'Horizontal position left-right' },
              { color: 'bg-green-500', label: 'Z-Axis → Green (G)', desc: 'Horizontal position front-back' },
              { color: 'bg-blue-500', label: 'Y-Axis → Blue (B)', desc: 'Vertical height (use slider)' },
            ].map(({ color, label, desc }, i) => (
              <div key={i} className="p-4 rounded-lg bg-secondary/50 flex items-start gap-3">
                <div className={`w-4 h-4 rounded-sm ${color} mt-0.5`} />
                <div>
                  <p className="font-medium text-foreground">{label}</p>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
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
                  Confirm Position
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
