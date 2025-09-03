import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Navigation from './Navigation';
import HeroSection from './HeroSection';
import FeaturesSection from './FeaturesSection';
import Footer from './Footer';

export default function WelcomePage() {
  return (
    <div className="min-h-screen">
      <Navigation />
      <HeroSection />
      <FeaturesSection />
      
      {/* Call to Action Section */}
      <section className="py-16 bg-gradient-to-r from-emerald-600 to-cyan-600">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Mulakan Perjalanan Digital Anda Hari Ini
            </h2>
            <p className="text-xl text-emerald-100 mb-8 leading-relaxed">
              Bergabung dengan ribuan rumah mengaji yang telah mempercayai sistem kami untuk 
              menguruskan pusat tadika Al-Quran dengan lebih efisien dan berkesan.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-white text-emerald-600 hover:bg-emerald-50">
                <Link to="/register">
                  Daftar Sekarang 📚
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-emerald-600">
                <Link to="/login">
                  Log Masuk
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Dipercayai Oleh Komuniti Malaysia
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Sistem pengurusan rumah mengaji yang telah membantu ribuan institusi di seluruh Malaysia
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-emerald-600 mb-2">500+</div>
              <p className="text-gray-600">Rumah Mengaji</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-emerald-600 mb-2">10,000+</div>
              <p className="text-gray-600">Pelajar Aktif</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-emerald-600 mb-2">2,500+</div>
              <p className="text-gray-600">Guru Berdaftar</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-emerald-600 mb-2">50+</div>
              <p className="text-gray-600">Kawasan Diliputi</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}