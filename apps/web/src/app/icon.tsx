import { ImageResponse } from 'next/og';

export const size = {
  width: 64,
  height: 64,
};

export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#0b0f1f',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 16,
          color: '#8b5cf6',
          fontSize: 36,
          fontWeight: 700,
        }}
      >
        C
      </div>
    ),
    {
      ...size,
    },
  );
}
