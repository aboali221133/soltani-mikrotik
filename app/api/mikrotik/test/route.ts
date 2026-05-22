import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { localIp, remoteDnsDomain, sslEnabled, apiPort, username, plainPassword } = await req.json();

    const host = remoteDnsDomain || localIp;
    if (!host) {
      return NextResponse.json({ success: false, error: 'Host is required' }, { status: 400 });
    }

    const protocol = sslEnabled ? 'https' : 'http';
    const port = apiPort || (sslEnabled ? 8729 : 8728);
    
    // RouterOS v7 REST API standard path for testing (just checking system resource or identity)
    const url = `${protocol}://${host}:${port}/rest/system/identity`;

    // Construct Basic Auth header
    const token = Buffer.from(`${username}:${plainPassword}`).toString('base64');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const resp = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${token}`,
        'Content-Type': 'application/json'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (resp.ok) {
      const data = await resp.json();
      return NextResponse.json({ success: true, data });
    } else {
      let errorMsg = 'Unknown error';
      try {
        const errorData = await resp.json();
        errorMsg = JSON.stringify(errorData);
      } catch (e) {
        errorMsg = resp.statusText;
      }
      return NextResponse.json({ success: false, error: `Router returned ${resp.status}: ${errorMsg}` }, { status: resp.status });
    }

  } catch (error: any) {
    if (error.name === 'AbortError') {
      return NextResponse.json({ success: false, error: 'Connection timed out. Router might be offline or port is closed.' }, { status: 504 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
