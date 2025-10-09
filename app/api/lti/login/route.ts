import { NextRequest, NextResponse } from 'next/server';
import { getLTIConfig } from '../../../lib/lti-config';
import { storeLTIState } from '../../../lib/lti-state-store';
import { connectToDatabase } from '../../../serverActions/mongoose-connector';

export async function POST(request: NextRequest) {
  try {
    const body = await request.formData();
    const iss = body.get('iss') as string;
    const loginHint = body.get('login_hint') as string;
    const targetLinkUri = body.get('target_link_uri') as string;
    const ltiMessageHint = body.get('lti_message_hint') as string;
    const clientId = body.get('client_id') as string;
    const ltiDeploymentId = body.get('lti_deployment_id') as string;

    if (!iss || !loginHint || !targetLinkUri) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const config = getLTIConfig();

    // Validate issuer and client ID
    if (iss !== config.issuer || clientId !== config.clientId) {
      return NextResponse.json({ error: 'Invalid issuer or client ID' }, { status: 400 });
    }

    // Generate state and nonce for security
    const state = crypto.randomUUID();
    const nonce = crypto.randomUUID();

    // Store state and nonce in database with TTL for validation
    // This prevents replay attacks and ensures single-use
    await connectToDatabase();
    
    await storeLTIState(state, nonce, {
      targetLinkUri,
    });

    // Build authorization URL
    const nextAuthUrl = process.env.NEXTAUTH_URL;
    if (!nextAuthUrl) {
      throw new Error('NEXTAUTH_URL environment variable is required');
    }
    
    const authUrl = new URL(config.authLoginUrl);
    authUrl.searchParams.set('response_type', 'id_token');
    authUrl.searchParams.set('client_id', config.clientId);
    authUrl.searchParams.set('redirect_uri', `${nextAuthUrl}/api/lti/launch`);
    authUrl.searchParams.set('login_hint', loginHint);
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('response_mode', 'form_post');
    authUrl.searchParams.set('nonce', nonce);
    authUrl.searchParams.set('prompt', 'none');
    authUrl.searchParams.set('scope', 'openid');

    if (ltiMessageHint) {
      authUrl.searchParams.set('lti_message_hint', ltiMessageHint);
    }

    if (ltiDeploymentId) {
      authUrl.searchParams.set('lti_deployment_id', ltiDeploymentId);
    }

    // Redirect to Canvas authorization endpoint
    return NextResponse.redirect(authUrl.toString());

  } catch (error) {
    console.error('LTI Login Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}