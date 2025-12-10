import { Link } from 'react-router-dom';
import { Bot, Play, BarChart3, Box, Palette, MessageCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/Layout';
import { useSession } from '@/context/SessionContext';

const Index = () => {
  const { resetSession } = useSession();

  const handleStartLesson = () => {
    resetSession();
  };

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative gradient-hero py-20 md:py-32 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center">
            {/* Robot Icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 mb-8 animate-float">
              <Bot className="w-10 h-10 text-primary" />
            </div>

            <h1 className="font-display text-4xl md:text-6xl font-bold text-foreground mb-6 text-balance">
              Learn 3D Coordinates Through{' '}
              <span className="text-primary">Color</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto text-balance">
              Meet your robot friend who lives in a 3D world! Help place the robot, 
              draw what you see, and discover the magical connection between 
              position and color.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild variant="hero" size="xl" onClick={handleStartLesson}>
                <Link to="/3d">
                  <Play className="w-5 h-5 mr-2" />
                  Start Lesson
                </Link>
              </Button>
              
              <Button asChild variant="outline" size="xl">
                <Link to="/dashboard">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Teacher Dashboard
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16 md:py-24 bg-card">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <span className="inline-block px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
                The Story
              </span>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
                Meet RoboFarmer
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                RoboFarmer lives in a special 3D cube where every position has a unique color. 
                Your mission is to understand how X, Y, and Z coordinates create RGB colors!
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Card 1 */}
              <div className="p-6 rounded-2xl border border-border bg-background hover:shadow-lg transition-shadow">
                <div className="w-14 h-14 rounded-xl bg-destructive/10 flex items-center justify-center mb-4">
                  <Box className="w-7 h-7 text-destructive" />
                </div>
                <h3 className="font-display font-semibold text-lg text-foreground mb-2">
                  X → Red
                </h3>
                <p className="text-sm text-muted-foreground">
                  The X-axis controls the Red channel. Move right for more red, left for less.
                </p>
              </div>

              {/* Card 2 */}
              <div className="p-6 rounded-2xl border border-border bg-background hover:shadow-lg transition-shadow">
                <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                  <Box className="w-7 h-7 text-accent" />
                </div>
                <h3 className="font-display font-semibold text-lg text-foreground mb-2">
                  Y → Green
                </h3>
                <p className="text-sm text-muted-foreground">
                  The Y-axis controls the Green channel. Move up for more green, down for less.
                </p>
              </div>

              {/* Card 3 */}
              <div className="p-6 rounded-2xl border border-border bg-background hover:shadow-lg transition-shadow">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Box className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-lg text-foreground mb-2">
                  Z → Blue
                </h3>
                <p className="text-sm text-muted-foreground">
                  The Z-axis controls the Blue channel. Move forward for more blue, back for less.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              The Journey
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              How It Works
            </h2>
          </div>

          <div className="max-w-4xl mx-auto space-y-8">
            {[
              { icon: Box, title: '1. Place the Robot', desc: 'Drag RoboFarmer to any position inside the 3D cube' },
              { icon: Palette, title: '2. Draw What You See', desc: 'Sketch the 3D scene on paper and upload your drawing' },
              { icon: MessageCircle, title: '3. Predict the Color', desc: 'Based on the position, predict what RGB color the AI will show' },
            ].map(({ icon: Icon, title, desc }, i) => (
              <div 
                key={i}
                className="flex items-start gap-6 p-6 rounded-2xl bg-card border border-border hover:shadow-md transition-shadow animate-slide-up"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-lg text-foreground mb-1">
                    {title}
                  </h3>
                  <p className="text-muted-foreground">
                    {desc}
                  </p>
                </div>
                {i < 2 && (
                  <ArrowRight className="w-6 h-6 text-muted-foreground/30 hidden lg:block shrink-0 mt-3" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Ready to Explore?
          </h2>
          <p className="text-lg opacity-90 mb-8 max-w-xl mx-auto">
            Begin your journey into the world of 3D coordinates and discover the beautiful connection with color.
          </p>
          <Button 
            asChild 
            variant="glass" 
            size="xl"
            className="bg-white/10 hover:bg-white/20 border-white/20"
            onClick={handleStartLesson}
          >
            <Link to="/3d">
              <Play className="w-5 h-5 mr-2" />
              Start Learning Now
            </Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
