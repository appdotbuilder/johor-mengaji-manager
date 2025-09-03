import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Star, Users, BookOpen, TrendingUp } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="relative py-20 lg:py-32 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-cyan-50"></div>
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwNDczN2EiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iNyIgY3k9IjciIHI9IjEiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-40"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-5xl mx-auto">
          {/* Badge */}
          <Badge variant="secondary" className="mb-6 bg-emerald-100 text-emerald-700 border-emerald-200 px-4 py-2">
            <Star className="w-4 h-4 mr-2" />
            Platform #1 untuk Pengurusan Rumah Mengaji di Malaysia
          </Badge>

          {/* Main Heading */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            Sistem Pengurusan{' '}
            <span className="bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
              Rumah Mengaji
            </span>{' '}
            Terkini
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed max-w-4xl mx-auto">
            Permudahkan pengurusan pusat tadika Al-Quran anda dengan sistem yang komprehensif, 
            dari pendaftaran pelajar hingga laporan kewangan. Khusus direka untuk keperluan 
            rumah mengaji di Malaysia. 🕌
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button asChild size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-lg px-8 py-6">
              <Link to="/register">
                Mulakan Percubaan Percuma
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50 text-lg px-8 py-6">
              <Link to="/demo">
                Lihat Demo
              </Link>
            </Button>
          </div>

          {/* Features Highlight */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="flex items-center justify-center sm:justify-start space-x-3 text-gray-600">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="font-medium">Pengurusan Pelajar & Guru</span>
            </div>
            <div className="flex items-center justify-center sm:justify-start space-x-3 text-gray-600">
              <div className="w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-cyan-600" />
              </div>
              <span className="font-medium">Jadual & Kehadiran</span>
            </div>
            <div className="flex items-center justify-center sm:justify-start space-x-3 text-gray-600">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="font-medium">Laporan & Kewangan</span>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-br from-emerald-200 to-cyan-200 rounded-full opacity-20 animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-16 h-16 bg-gradient-to-br from-cyan-200 to-emerald-200 rounded-full opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="absolute top-1/2 right-1/4 w-8 h-8 bg-emerald-300 rounded-full opacity-30 animate-bounce" style={{ animationDelay: '2s' }}></div>
    </section>
  );
}