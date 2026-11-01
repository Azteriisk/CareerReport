import { NextResponse } from 'next/server';

export async function GET() {
  const assetlinks = [
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: 'net.azterisk.careerreport',
        sha256_cert_fingerprints: [
          '5C:D7:AE:63:85:4F:3B:6F:24:21:0E:1E:71:D4:8E:AF:A2:61:F9:24:3A:1C:C5:B7:95:FC:2F:4C:80:8B:BA:C3',
        ],
      },
    },
  ];

  return NextResponse.json(assetlinks, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
