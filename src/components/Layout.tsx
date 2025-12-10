import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bot, Home, GraduationCap, BarChart3 } from 'lucide-react';
import { StepProgressBar } from '@/components/StepProgressBar';
import { cn } from '@/lib/utils';
import { WORKFLOW_STEPS } from '@/lib/workflow';

interface LayoutProps {
  children: ReactNode;
  showProgress?: boolean;
}

export function Layout({ children, showProgress = false }: LayoutProps) {
  const location = useLocation();
  const isWorkflowPage = WORKFLOW_STEPS.some(s => s.path === location.pathname);
  const isDashboard = location.pathname === '/dashboard';
  const isLanding = location.pathname === '/';

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Bot className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg text-foreground leading-tight">
                Tangible AI
              </h1>
              <p className="text-xs text-muted-foreground">3D Learning Environment</p>
            </div>
          </Link>

          <nav className="flex items-center gap-2">
            <Link
              to="/"
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                isLanding 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Home</span>
            </Link>
            
            {isWorkflowPage && (
              <Link
                to="/3d"
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  "bg-accent text-accent-foreground"
                )}
              >
                <GraduationCap className="w-4 h-4" />
                <span className="hidden sm:inline">Lesson</span>
              </Link>
            )}
            
            <Link
              to="/dashboard"
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                isDashboard 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
          </nav>
        </div>

        {/* Progress Bar */}
        {(showProgress || isWorkflowPage) && !isLanding && !isDashboard && (
          <div className="border-t border-border bg-muted/30">
            <div className="container mx-auto">
              <StepProgressBar />
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Tangible AI Learning Environment — Understanding 3D Space Through Color</p>
        </div>
      </footer>
    </div>
  );
}
