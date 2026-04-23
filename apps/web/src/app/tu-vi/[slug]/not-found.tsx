import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-24 text-center">
      <h1 className="font-serif text-4xl font-bold text-brand-purple">Không tìm thấy lá số</h1>
      <p className="mt-3 text-brand-mute">
        Đường dẫn này có thể đã hết hạn hoặc chưa được tạo. Vui lòng lập lại lá số mới.
      </p>
      <div className="mt-6">
        <Link href="/xem-tu-vi" className="btn-primary">Xem lá số mới</Link>
      </div>
    </section>
  );
}
