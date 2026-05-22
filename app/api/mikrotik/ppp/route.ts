import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://rdkrpswllzurqwbkcxgy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJka3Jwc3dsbHp1cnF3YmtjeGd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NTM4NjAsImV4cCI6MjA4NzAyOTg2MH0.Og8d4sSVD84cp7wSxpGRl1IJ9vuWMdDlDwKmqn4gbbY'
);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const serverId = searchParams.get('serverId');
    
    if (!serverId) {
      return NextResponse.json({ success: false, error: 'Server ID required' }, { status: 400 });
    }

    const { data: server, error } = await supabase.from('servers').select('*').eq('id', serverId).single();
    
    if (error || !server) {
      return NextResponse.json({ success: false, error: 'Server not found' }, { status: 404 });
    }

    const host = server.remote_dns_domain || server.local_ip;
    const protocol = server.ssl_enabled ? 'https' : 'http';
    const port = server.api_port || (server.ssl_enabled ? 443 : 80);
    const baseUrl = `${protocol}://${host}:${port}/rest/ppp`;
    const token = Buffer.from(`${server.username}:${server.plain_password}`).toString('base64');
    
    const headers = {
      'Authorization': `Basic ${token}`,
      'Content-Type': 'application/json'
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const [secretsResp, activeResp, profilesResp] = await Promise.all([
      fetch(`${baseUrl}/secret`, { method: 'GET', headers, signal: controller.signal }).catch(e => null),
      fetch(`${baseUrl}/active`, { method: 'GET', headers, signal: controller.signal }).catch(e => null),
      fetch(`${baseUrl}/profile`, { method: 'GET', headers, signal: controller.signal }).catch(e => null)
    ]);

    clearTimeout(timeoutId);

    const secrets = secretsResp && secretsResp.ok ? (await secretsResp.json() || []) : [];
    const active = activeResp && activeResp.ok ? (await activeResp.json() || []) : [];
    const profiles = profilesResp && profilesResp.ok ? (await profilesResp.json() || []) : [];

    return NextResponse.json({ success: true, secrets, active, profiles });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { serverId, action, targetUserId, newProfileName, newDate, profileId, price } = body;

    const { data: server, error } = await supabase.from('servers').select('*').eq('id', serverId).single();
    if (error || !server) return NextResponse.json({ success: false, error: 'Server not found' }, { status: 404 });

    const host = server.remote_dns_domain || server.local_ip;
    const protocol = server.ssl_enabled ? 'https' : 'http';
    const port = server.api_port || (server.ssl_enabled ? 443 : 80);
    const token = Buffer.from(`${server.username}:${server.plain_password}`).toString('base64');
    
    const headers = { 'Authorization': `Basic ${token}`, 'Content-Type': 'application/json' };

    if (action === 'extend_profile') {
      const formattedDate = `@@${newDate}@@`;
      /* Appending price for milestone 5 preview optionally `$Price$` */
      const commentAppend = price ? `${formattedDate} $${price}$` : formattedDate;
      const payload = {
        profile: newProfileName,
        comment: commentAppend
      };

      const updateResp = await fetch(`${protocol}://${host}:${port}/rest/ppp/secret/${targetUserId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(payload)
      });

      if (!updateResp.ok) throw new Error(`MikroTik Update Failed: ${updateResp.statusText}`);

      // Log into accounting_logs
      await supabase.from('accounting_logs').insert([{
        profile_id: profileId,
        server_id: serverId,
        action: 'renewal',
        target_user: targetUserId,
        details: payload,
        revenue_generated: price || 0
      }]);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Unknown Action' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
