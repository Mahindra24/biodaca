import { CheckCircle2, Users, Award, Clock } from 'lucide-react';

const features = [
  {
    icon: Users,
    title: 'Expert Team',
    description: 'PhD-level bioinformaticians with years of research experience',
  },
  {
    icon: Award,
    title: 'Quality Assured',
    description: 'Rigorous quality control at every step of analysis',
  },
  {
    icon: Clock,
    title: 'Fast Turnaround',
    description: 'Efficient pipelines for timely delivery of results',
  },
];

const About = () => {
  return (
    <section id="about" className="py-20 md:py-32 bg-background relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <div className="space-y-8">
            <span className="inline-block px-4 py-1.5 bg-secondary text-secondary-foreground rounded-full text-sm font-medium">
              About BioDaCa
            </span>
            
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold leading-tight">
              Making Complex{' '}
              <span className="gradient-text">Bioinformatics</span>{' '}
              Simple
            </h2>
            
            <p className="text-lg text-muted-foreground">
              BioDaCa was founded with a simple mission: to democratize access to 
              advanced bioinformatics analysis. We believe that cutting-edge genomic 
              research shouldn't be limited by technical barriers.
            </p>

            <p className="text-muted-foreground">
              Our team of experienced bioinformaticians and data scientists work 
              together to provide comprehensive solutions that transform raw sequencing 
              data into actionable biological insights.
            </p>

            <ul className="space-y-4">
              {[
                'State-of-the-art analysis pipelines',
                'Customized solutions for unique research needs',
                'Secure and confidential data handling',
                'Collaborative approach with researchers',
              ].map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-dna-accent flex-shrink-0" />
                  <span className="text-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Features Cards */}
          <div className="space-y-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="glass-card p-6 rounded-2xl flex items-start gap-5 hover:scale-[1.02] transition-transform duration-300"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-dna flex items-center justify-center flex-shrink-0">
                  <feature.icon className="h-7 w-7 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-heading font-semibold mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}

            {/* Highlight Box */}
            <div className="bg-gradient-dna p-6 rounded-2xl text-primary-foreground">
              <p className="text-2xl font-heading font-bold mb-2">
                Ready to Transform Your Research?
              </p>
              <p className="opacity-90">
                Join hundreds of researchers who trust BioDaCa for their 
                bioinformatics needs.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
