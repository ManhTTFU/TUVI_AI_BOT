import type { Metadata } from 'next';
import TuviForm from '@/components/TuviForm';

export const metadata: Metadata = {
  title: 'Xem tử vi — Nhập ngày giờ sinh',
  description:
    'Form nhập ngày giờ sinh để lập lá số Tử Vi Đẩu Số và nhận bản luận giải 6 phần chi tiết bằng AI.',
  alternates: { canonical: '/xem-tu-vi' },
};

export default function XemTuViPage() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-12">
      <header className="text-center">
        <span className="chip">BƯỚC 1 TRÊN 1</span>
        <h1 className="mt-3 font-serif text-3xl font-bold text-brand-purple md:text-4xl">
          Nhập thông tin để xem tử vi
        </h1>
        <p className="mt-3 text-brand-mute">
          Điền chính xác các trường bên dưới. Dữ liệu chỉ dùng để lập lá số, không lưu trữ công khai.
        </p>
      </header>

      <div className="mt-8 card">
        <TuviForm />
      </div>
    </section>
  );
}
