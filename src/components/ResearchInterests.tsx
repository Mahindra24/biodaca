import { BookOpen, Beaker, BrainCircuit, Leaf, HeartPulse, Atom } from 'lucide-react';

const researchAreas = [
  {
    icon: BrainCircuit,
    title: 'Cancer Genomics',
    description: 'Investigating genetic mutations and biomarkers for early cancer detection and personalized treatment strategies.',
    color: 'from-rose-500 to-pink-600',
  },
  {
    icon: Leaf,
    title: 'Plant Genomics',
    description: 'Exploring plant genomes to improve crop yield, disease resistance, and sustainable agriculture practices.',
    color: 'from-emerald-500 to-green-600',
  },
  {
    icon: HeartPulse,
    title: 'Cardiovascular Research',
    description: 'Analyzing genetic factors in heart diseases to develop targeted therapies and preventive measures.',
    color: 'from-red-500 to-rose-600',
  },
  {
    icon: Beaker,
    title: 'Drug Discovery',
    description: 'Leveraging genomic data for novel drug target identification and pharmacogenomic studies.',
    color: 'from-violet-500 to-purple-600',
  },
  {
    icon: Atom,
    title: 'Structural Biology',
    description: 'Computational analysis of protein structures and molecular interactions for therapeutic development.',
    color: 'from-cyan-500 to-teal-600',
  },
  {
    icon: BookOpen,
    title: 'Evolutionary Studies',
    description: 'Comparative genomics and phylogenetic analysis to understand species evolution and adaptation.',
    color: 'from-amber-500 to-orange-600',
  },
];

const ResearchInterests = () => {
  return (
    <section id="research" className="py-20 md:py-32 bg-muted/30 relative overflow-hidden">
      {/* DNA strand decoration */}
      <div className="absolute left-0 top-0 bottom-0 w-20 opacity-10">
        <div className="h-full bg-[repeating-linear-gradient(0deg,transparent,transparent_40px,hsl(var(--primary))_40px,hsl(var(--primary))_42px,transparent_42px,transparent_80px)]" />
      </div>
      <div className="absolute right-0 top-0 bottom-0 w-20 opacity-10">
        <div className="h-full bg-[repeating-linear-gradient(0deg,transparent,transparent_40px,hsl(var(--accent))_40px,hsl(var(--accent))_42px,transparent_42px,transparent_80px)]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 bg-secondary text-secondary-foreground rounded-full text-sm font-medium mb-4">
            Research Focus
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold mb-6">
            Our <span className="gradient-text">Research Interests</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            We collaborate with researchers worldwide on diverse genomics projects, 
            driving innovation in healthcare, agriculture, and beyond.
          </p>
        </div>

        {/* Research Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {researchAreas.map((area, index) => (
            <div
              key={area.title}
              className="group relative bg-card rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden"
            >
              {/* Gradient background on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${area.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
              
              <div className="relative z-10">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${area.color} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                  <area.icon className="h-8 w-8 text-primary-foreground" />
                </div>
                
                <h3 className="text-xl font-heading font-semibold mb-3 group-hover:text-primary transition-colors">
                  {area.title}
                </h3>
                
                <p className="text-muted-foreground leading-relaxed">
                  {area.description}
                </p>

                {/* Decorative line */}
                <div className={`mt-5 h-1 w-0 bg-gradient-to-r ${area.color} rounded-full group-hover:w-full transition-all duration-500`} />
              </div>
            </div>
          ))}
        </div>

        {/* Stats Banner */}
        <div className="mt-20 glass-card rounded-2xl p-8 md:p-12">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-4xl md:text-5xl font-heading font-bold gradient-text mb-2">150+</p>
              <p className="text-muted-foreground">Publications</p>
            </div>
            <div>
              <p className="text-4xl md:text-5xl font-heading font-bold gradient-text mb-2">30+</p>
              <p className="text-muted-foreground">Research Partners</p>
            </div>
            <div>
              <p className="text-4xl md:text-5xl font-heading font-bold gradient-text mb-2">10TB+</p>
              <p className="text-muted-foreground">Data Analyzed</p>
            </div>
            <div>
              <p className="text-4xl md:text-5xl font-heading font-bold gradient-text mb-2">25+</p>
              <p className="text-muted-foreground">Countries Served</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ResearchInterests;
