import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Pencil, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/Layout';
import { UploadCard } from '@/components/UploadCard';
import { AxisIndicator } from '@/components/AxisIndicator';
import { useSession } from '@/context/SessionContext';
import { uploadDrawing } from '@/lib/api';

const UploadPage = () => {
  const navigate = useNavigate();
  const { state, setUploadedImage, setCurrentStep, completeStep } = useSession();
  const [previewUrl, setPreviewUrl] = useState<string | null>(state.uploadedImage);

  useEffect(() => {
    setCurrentStep('upload');
  }, [setCurrentStep]);

  const handleUpload = async (file: File) => {
    const result = await uploadDrawing(file);
    if (result.success) {
      setPreviewUrl(result.imageUrl);
      setUploadedImage(result.imageUrl);
    }
  };

  const handleClear = () => {
    setPreviewUrl(null);
  };

  const handleContinue = () => {
    completeStep('upload');
    navigate('/verify');
  };

  return (
    <Layout showProgress>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Pencil className="w-4 h-4" />
              Step 2: Draw & Upload
            </span>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
              Draw What You See
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              On a piece of paper, draw the 3D cube with RoboFarmer inside. 
              Show the robot's position clearly, then upload your drawing.
            </p>
          </div>

          {/* Current Position Reminder */}
          <div className="flex justify-center mb-8">
            <div className="inline-block p-4 rounded-xl bg-card border border-border shadow-sm">
              <p className="text-sm text-muted-foreground text-center mb-3">
                Robot Position to Draw
              </p>
              <AxisIndicator
                x={state.robotCoordinates.x}
                y={state.robotCoordinates.y}
                z={state.robotCoordinates.z}
                size="md"
              />
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            {/* Instructions */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="font-display font-semibold text-lg text-foreground mb-4">
                Drawing Instructions
              </h2>
              <ol className="space-y-4 text-muted-foreground">
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center shrink-0">1</span>
                  <span>Draw a 3D cube (like a box) on your paper</span>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center shrink-0">2</span>
                  <span>Draw the X, Y, Z axes on the cube edges</span>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center shrink-0">3</span>
                  <span>Draw RoboFarmer inside at the correct position</span>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center shrink-0">4</span>
                  <span>Label the coordinates (X={state.robotCoordinates.x}, Y={state.robotCoordinates.y}, Z={state.robotCoordinates.z})</span>
                </li>
                <li className="flex gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center shrink-0">5</span>
                  <span>Take a photo or scan your drawing</span>
                </li>
              </ol>
            </div>

            {/* Upload Area */}
            <div>
              <h2 className="font-display font-semibold text-lg text-foreground mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload Your Drawing
              </h2>
              <UploadCard
                onUpload={handleUpload}
                previewUrl={previewUrl}
                onClear={handleClear}
              />
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate('/3d')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            
            <Button 
              variant="hero" 
              size="lg"
              onClick={handleContinue}
              disabled={!previewUrl}
            >
              Continue to Verification
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default UploadPage;
