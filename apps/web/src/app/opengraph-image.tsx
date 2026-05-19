import { ImageResponse } from 'next/og';

export const alt = 'Luận Giải Vận Mệnh — Tử Vi, Tứ Trụ, Tarot, Phong Thủy';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background:
            'linear-gradient(135deg, #0f0a08 0%, #2a1c14 45%, #5a3a1a 100%)',
          padding: 80,
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              'radial-gradient(circle at 20% 30%, rgba(200,145,70,0.25) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(200,54,29,0.18) 0%, transparent 50%)',
          }}
        />
        <div
          style={{
            display: 'flex',
            fontSize: 28,
            color: '#c89146',
            letterSpacing: 8,
            fontWeight: 600,
            textTransform: 'uppercase',
            marginBottom: 32,
          }}
        >
          Luangiaivanmenh.com
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 96,
            color: '#fbf3e2',
            fontWeight: 700,
            textAlign: 'center',
            lineHeight: 1.05,
            letterSpacing: -2,
            marginBottom: 32,
          }}
        >
          Vận Mệnh
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 36,
            color: '#e9d4b6',
            textAlign: 'center',
            lineHeight: 1.3,
            maxWidth: 1000,
          }}
        >
          Tử Vi · Tứ Trụ · Tarot · Phong Thủy
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 22,
            color: '#c89146',
            textAlign: 'center',
            marginTop: 40,
            opacity: 0.85,
          }}
        >
          Khoa Chiêm Tinh và Huyền Học Á Đông — luận giải cá nhân hóa bằng AI
        </div>
      </div>
    ),
    { ...size },
  );
}
