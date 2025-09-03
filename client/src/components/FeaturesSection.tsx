import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Calendar, 
  DollarSign, 
  BookOpen, 
  Video, 
  Package, 
  Heart,
  BarChart3,
  Shield,
  Clock,
  CheckCircle,
  Globe
} from 'lucide-react';

const features = [
  {
    icon: Users,
    title: 'Pengurusan Pusat Mengaji',
    description: 'Daftarkan dan uruskan maklumat terperinci pusat tadika Al-Quran serta cawangan-cawangannya.',
    color: 'emerald',
    popular: false
  },
  {
    icon: BookOpen,
    title: 'Pengurusan Guru & Pelajar',
    description: 'Profil lengkap guru dengan kelayakan JAIJ dan sistem pendaftaran pelajar yang komprehensif.',
    color: 'cyan',
    popular: true
  },
  {
    icon: Calendar,
    title: 'Jadual Kelas Digital',
    description: 'Jadual untuk kelas Al-Quran dan agama (fizikal, online, panggilan). Penugasan guru dan pelajar.',
    color: 'emerald',
    popular: false
  },
  {
    icon: DollarSign,
    title: 'Sistem Pembayaran',
    description: 'Rekod dan jejaki pembayaran yuran pelajar dengan sejarah transaksi yang terperinci.',
    color: 'cyan',
    popular: false
  },
  {
    icon: Video,
    title: 'Pengurusan Video Kelas',
    description: 'Muat naik, urus, dan akses video rakaman kelas agama untuk pembelajaran berterusan.',
    color: 'emerald',
    popular: false
  },
  {
    icon: Package,
    title: 'Inventori & Bahan Edaran',
    description: 'Rekod pengedaran Al-Quran (jualan & amal), pengurusan bahan mengajar dan buku tulis.',
    color: 'cyan',
    popular: false
  },
  {
    icon: Heart,
    title: 'Tabung & Sumbangan',
    description: 'Sistem pengurusan pelbagai tabung: sumbangan, ngaji, wakaf, infaq, dan sedekah komuniti.',
    color: 'emerald',
    popular: true
  },
  {
    icon: BarChart3,
    title: 'Laporan Kewangan',
    description: 'Jana laporan kewangan berkaitan pembayaran pelajar, sumbangan, dan perbelanjaan.',
    color: 'cyan',
    popular: false
  },
  {
    icon: Shield,
    title: 'Keselamatan Data',
    description: 'Sistem yang selamat dengan kawalan akses berlapis dan backup data automatik.',
    color: 'emerald',
    popular: false
  },
  {
    icon: Clock,
    title: 'Rekod Kehadiran',
    description: 'Jejaki kehadiran pelajar dalam kelas dengan sistem pelaporan yang terperinci.',
    color: 'cyan',
    popular: false
  },
  {
    icon: CheckCircle,
    title: 'Kawalan Kualiti',
    description: 'Sistem penilaian dan pemantauan kualiti pengajaran serta prestasi pelajar.',
    color: 'emerald',
    popular: false
  },
  {
    icon: Globe,
    title: 'Multi-Platform',
    description: 'Akses daripada mana-mana peranti - komputer, tablet, atau telefon pintar.',
    color: 'cyan',
    popular: false
  }
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4 bg-emerald-100 text-emerald-700 border-emerald-200">
            Ciri-ciri Utama
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
            Semua yang Anda Perlukan untuk{' '}
            <span className="bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
              Rumah Mengaji Modern
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Sistem pengurusan yang lengkap dan mudah digunakan, direka khusus untuk 
            memenuhi keperluan rumah mengaji di Malaysia dengan sokongan pelbagai peranan pengguna.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            const colorClasses = feature.color === 'emerald' 
              ? 'bg-emerald-100 text-emerald-600 border-emerald-200'
              : 'bg-cyan-100 text-cyan-600 border-cyan-200';
            
            return (
              <Card 
                key={index} 
                className={`relative transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-0 shadow-sm ${
                  feature.popular ? 'ring-2 ring-emerald-200 bg-gradient-to-br from-emerald-50 to-white' : 'bg-white'
                }`}
              >
                {feature.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-emerald-600 text-white px-3 py-1">
                      Popular ✨
                    </Badge>
                  </div>
                )}
                <CardHeader className="pb-4">
                  <div className={`w-12 h-12 rounded-lg ${colorClasses} flex items-center justify-center mb-4`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-xl font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="text-gray-600 text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Role-based Access Section */}
        <div className="mt-20 text-center">
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">
            Peranan Pengguna Mengikut Keperluan
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 max-w-6xl mx-auto">
            {[
              { role: 'Administrator', desc: 'Pengurusan sistem penuh', color: 'bg-purple-100 text-purple-700' },
              { role: 'Admin Pusat', desc: 'Operasi pusat mengaji', color: 'bg-emerald-100 text-emerald-700' },
              { role: 'Pengurus Pusat', desc: 'Pengawasan & laporan', color: 'bg-cyan-100 text-cyan-700' },
              { role: 'Pengajar Pusat', desc: 'Pengurusan kelas & pelajar', color: 'bg-orange-100 text-orange-700' },
              { role: 'Pelajar', desc: 'Akses maklumat peribadi', color: 'bg-blue-100 text-blue-700' }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className={`w-16 h-16 ${item.color} rounded-full flex items-center justify-center mx-auto mb-3`}>
                  <Users className="w-8 h-8" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">{item.role}</h4>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}