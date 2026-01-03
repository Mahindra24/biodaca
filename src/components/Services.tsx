import { Dna, FileCode, BarChart3, Microscope, Database, Cpu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useScrollAnimation } from '@/hooks/use-scroll-animation';

const services = [
  {
    icon: Dna,
    title: 'Genomic Data Analysis',
    description: 'Comprehensive analysis of whole genome sequencing data with advanced bioinformatics pipelines.',
    features: ['Variant calling', 'Structural variation', 'Copy number analysis'],
  },
  {
    icon: BarChart3,
    title: 'RNA-Seq Analysis',
    description: 'Full transcriptome profiling and differential gene expression analysis for your research.',
    features: ['Differential expression', 'Pathway analysis', 'Alternative splicing'],
  },
  {
    icon: FileCode,
    title: 'Sanger Sequencing Analysis',
    description: 'Accurate analysis of Sanger sequencing chromatograms with quality assessment.',
    features: ['Base calling', 'Sequence alignment', 'Mutation detection'],
  },
  {
    icon: Microscope,
    title: 'Metagenomics',
    description: 'Microbial community analysis and taxonomic profiling from environmental samples.',
    features: ['16S/18S analysis', 'Taxonomic classification', 'Diversity metrics'],
  },
  {
    icon: Database,
    title: 'Data Management',
    description: 'Secure storage and management of your genomic data with easy access and sharing.',
    features: ['Cloud storage', 'Data encryption', 'Version control'],
  },
  {
    icon: Cpu,
    title: 'Custom Pipelines',
    description: 'Tailored bioinformatics solutions designed specifically for your research needs.',
    features: ['Custom scripts', 'Workflow automation', 'Integration support'],
  },
];

const Services = () => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });

  return (
    <section id="services" className="py-20 md:py-32 bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-dna-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-dna-accent/5 rounded-full blur-3xl" />

      <div ref={ref} className={`container mx-auto px-4 relative z-10 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 bg-secondary text-secondary-foreground rounded-full text-sm font-medium mb-4">
            Our Services
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold mb-6">
            Comprehensive <span className="gradient-text">Bioinformatics</span> Solutions
          </h2>
          <p className="text-lg text-muted-foreground">
            From genomic data analysis to custom pipeline development, we provide end-to-end 
            bioinformatics services tailored to your research needs.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <div
              key={service.title}
              className="group glass-card p-6 rounded-2xl hover:scale-[1.02] transition-all duration-300"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-dna flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                <service.icon className="h-7 w-7 text-primary-foreground" />
              </div>
              
              <h3 className="text-xl font-heading font-semibold mb-3 group-hover:text-primary transition-colors">
                {service.title}
              </h3>
              
              <p className="text-muted-foreground mb-4">
                {service.description}
              </p>

              <ul className="space-y-2">
                {service.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-dna-accent" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <Link to="/auth?mode=signup">
            <Button variant="hero" size="lg">
              Get Started with Your Project
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Services;
