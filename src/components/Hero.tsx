import { ArrowRight, Microscope, Dna, FlaskConical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import DNAHelix from './DNAHelix';

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center hero-gradient overflow-hidden pt-20">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating particles */}
        <div className="absolute top-20 left-10 w-3 h-3 bg-dna-accent/40 rounded-full animate-float" />
        <div className="absolute top-40 right-20 w-4 h-4 bg-dna-primary/30 rounded-full animate-float-delayed" />
        <div className="absolute bottom-40 left-1/4 w-2 h-2 bg-dna-secondary/50 rounded-full animate-float" />
        <div className="absolute top-1/3 right-1/3 w-5 h-5 bg-dna-glow/20 rounded-full animate-pulse-glow" />
        
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:60px_60px] opacity-30" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary rounded-full text-sm text-secondary-foreground animate-fade-up">
              <FlaskConical className="h-4 w-4" />
              <span>Advanced Bioinformatics Solutions</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold leading-tight animate-fade-up" style={{ animationDelay: '0.1s' }}>
              Unlock the Power of{' '}
              <span className="gradient-text">Genomic Data</span>{' '}
              Analysis
            </h1>
            
            <p className="text-lg text-muted-foreground max-w-xl animate-fade-up" style={{ animationDelay: '0.2s' }}>
              BioDaCa provides cutting-edge bioinformatics services including RNA-Seq analysis, 
              Sanger sequencing, and comprehensive genomic data solutions for researchers worldwide.
            </p>

            <div className="flex flex-wrap gap-4 animate-fade-up" style={{ animationDelay: '0.3s' }}>
              <Link to="/auth?mode=signup">
                <Button variant="hero" size="xl">
                  Start Your Analysis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <a href="#services">
                <Button variant="hero-outline" size="xl">
                  Explore Services
                </Button>
              </a>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8 animate-fade-up" style={{ animationDelay: '0.4s' }}>
              <div className="space-y-1">
                <p className="text-3xl font-heading font-bold text-primary">500+</p>
                <p className="text-sm text-muted-foreground">Projects Completed</p>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-heading font-bold text-primary">50+</p>
                <p className="text-sm text-muted-foreground">Research Partners</p>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-heading font-bold text-primary">99%</p>
                <p className="text-sm text-muted-foreground">Accuracy Rate</p>
              </div>
            </div>
          </div>

          {/* Visual */}
          <div className="relative hidden lg:flex justify-center items-center">
            <div className="absolute w-80 h-80 bg-dna-primary/10 rounded-full blur-3xl animate-pulse-glow" />
            <div className="absolute w-60 h-60 bg-dna-accent/10 rounded-full blur-2xl animate-float" />
            
            <div className="relative">
              <DNAHelix />
              
              {/* Floating icons */}
              <div className="absolute -left-20 top-20 glass-card p-4 rounded-xl animate-float">
                <Microscope className="h-8 w-8 text-primary" />
              </div>
              <div className="absolute -right-16 top-1/2 glass-card p-4 rounded-xl animate-float-delayed">
                <Dna className="h-8 w-8 text-dna-accent" />
              </div>
              <div className="absolute -left-10 bottom-20 glass-card p-4 rounded-xl animate-float">
                <FlaskConical className="h-8 w-8 text-dna-secondary" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default Hero;
