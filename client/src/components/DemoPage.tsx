import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Play, Monitor, Smartphone, Tablet } from 'lucide-react';

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-cyan-50 py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Back Button */}
          <div className="mb-8">
            <Button asChild variant="ghost" className="group">
              <Link to="/">
                <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                Kembali ke Laman Utama
              </Link>
            </Button>
          </div>

          {/* Header */}
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Demo Sistem{' '}
            <span className="bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
              RumahMengaji
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-12 leading-relaxed">
            Jelajahi semua ciri-ciri sistem pengurusan rumah mengaji kami melalui demo interaktif ini.
            Lihat sendiri bagaimana sistem ini dapat membantu meningkatkan kecekapan pengurusan pusat tadika Al-Quran anda.
          </p>

          {/* Demo Video Placeholder */}
          <Card className="mb-12 bg-gradient-to-br from-emerald-50 to-cyan-50 border-emerald-200">
            <CardContent className="p-8">
              <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center mb-6">
                <div className="text-center">
                  <div className="w-20 h-20 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Play className="w-8 h-8 text-white ml-1" />
                  </div>
                  <p className="text-white text-lg font-medium">Demo Video</p>
                  <p className="text-emerald-200 text-sm">Sedang dalam pembangunan</p>
                </div>
              </div>
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700">
                <Play className="w-5 h-5 mr-2" />
                Tonton Demo Video
              </Button>
            </CardContent>
          </Card>

          {/* Demo Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Monitor className="w-8 h-8 text-emerald-600" />
                </div>
                <CardTitle className="text-xl">Demo Desktop</CardTitle>
                <CardDescription>
                  Pengalaman penuh pada komputer desktop atau laptop
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button variant="outline" className="w-full">
                  Buka Demo Desktop
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-cyan-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Tablet className="w-8 h-8 text-cyan-600" />
                </div>
                <CardTitle className="text-xl">Demo Tablet</CardTitle>
                <CardDescription>
                  Dioptimumkan untuk penggunaan tablet dan iPad
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button variant="outline" className="w-full">
                  Buka Demo Tablet
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Smartphone className="w-8 h-8 text-emerald-600" />
                </div>
                <CardTitle className="text-xl">Demo Mobile</CardTitle>
                <CardDescription>
                  Aplikasi mudah alih untuk akses pantas di mana sahaja
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button variant="outline" className="w-full">
                  Buka Demo Mobile
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Bersedia untuk Memulakan?
            </h3>
            <p className="text-gray-600 mb-6">
              Dapatkan akses penuh kepada sistem dengan percubaan percuma selama 30 hari.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-emerald-600 hover:bg-emerald-700">
                <Link to="/register">
                  Daftar Percubaan Percuma
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/contact">
                  Hubungi Sales
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}