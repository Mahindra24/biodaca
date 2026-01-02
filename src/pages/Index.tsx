import { Helmet } from 'react-helmet-async';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Services from '@/components/Services';
import About from '@/components/About';
import Contact from '@/components/Contact';
import Footer from '@/components/Footer';

const Index = () => {
  return (
    <>
      <Helmet>
        <title>BioDaCa - Advanced Bioinformatics Solutions | Genomic Data Analysis</title>
        <meta name="description" content="BioDaCa provides cutting-edge bioinformatics services including RNA-Seq analysis, Sanger sequencing, and genomic data solutions for researchers worldwide." />
        <meta name="keywords" content="bioinformatics, genomic analysis, RNA-Seq, Sanger sequencing, data analysis, research" />
      </Helmet>

      <div className="min-h-screen">
        <Navbar />
        <main>
          <Hero />
          <Services />
          <About />
          <Contact />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Index;
