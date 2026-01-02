import { ArrowRight, Zap, Activity, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import DNAHelix from './DNAHelix';

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center hero-gradient overflow-hidden pt-20">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Animated grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--primary)/0.05)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--primary)/0.05)_1px,transparent_1px)] bg-[size:80px_80px]" />
        
        {/* Glowing orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-[100px] animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm neon-border bg-card/50 backdrop-blur-sm animate-fade-up">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-foreground">Advanced Bioinformatics Solutions</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-heading font-bold leading-tight animate-fade-up" style={{ animationDelay: '0.1s' }}>
              Unlock the Power of{' '}
              <span className="gradient-text neon-text">Genomic Data</span>{' '}
              Analysis
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-xl animate-fade-up" style={{ animationDelay: '0.2s' }}>
              BioDaCa provides cutting-edge bioinformatics services including RNA-Seq analysis, 
              Sanger sequencing, and comprehensive genomic data solutions.
            </p>

            <div className="flex flex-wrap gap-4 animate-fade-up" style={{ animationDelay: '0.3s' }}>
              <Link to="/dashboard">
                <Button variant="hero" size="xl" className="group">
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
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
              {[
                { icon: Database, value: '500+', label: 'Projects' },
                { icon: Activity, value: '50+', label: 'Partners' },
                { icon: Zap, value: '99%', label: 'Accuracy' },
              ].map((stat, index) => (
                <div key={index} className="glass-card rounded-xl p-4 text-center">
                  <stat.icon className="h-5 w-5 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-heading font-bold gradient-text">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* DNA Visual - Right Side */}
          <div className="relative hidden lg:flex justify-center items-center">
            {/* Large background glow */}
            <div className="absolute w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px]" />
            
            {/* DNA Helix centered */}
            <div className="relative z-10">
              <DNAHelix />
            </div>

            {/* Floating tech badges */}
            <div className="absolute top-10 -left-10 glass-card px-4 py-3 rounded-xl animate-float">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                <span className="text-sm font-medium">RNA-Seq</span>
              </div>
            </div>
            
            <div className="absolute top-1/3 -right-5 glass-card px-4 py-3 rounded-xl animate-float-delayed">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                <span className="text-sm font-medium">Genomics</span>
              </div>
            </div>
            
            <div className="absolute bottom-20 -left-5 glass-card px-4 py-3 rounded-xl animate-float">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-dna-accent rounded-full animate-pulse" />
                <span className="text-sm font-medium">Analysis</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background via-background/50 to-transparent" />
    </section>
  );
};

export default Hero;