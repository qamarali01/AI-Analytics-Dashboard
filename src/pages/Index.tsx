import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Brain } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <Brain className="h-16 w-16 text-primary" />
        </div>
        <h1 className="text-4xl font-bold">AI Dashboard</h1>
        <p className="text-xl text-muted-foreground max-w-md">
          Your intelligent dashboard for AI-powered data analysis and chat assistance
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild>
            <Link to="/auth">Get Started</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/auth">Sign In</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
