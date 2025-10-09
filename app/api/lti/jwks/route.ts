import { NextResponse } from 'next/server';
import { getLTIConfig } from '../../../lib/lti-config';
import { importPKCS8, exportJWK } from 'jose';

export async function GET() {
  try {
    const config = getLTIConfig();
    
    if (!config.toolPrivateKey) {
      return NextResponse.json({ error: 'Tool private key not configured' }, { status: 500 });
    }

    const ltiKeyId = process.env.LTI_KEY_ID;
    if (!ltiKeyId) {
      return NextResponse.json({ error: 'LTI_KEY_ID not configured' }, { status: 500 });
    }

    // Import the private key and extract the public key
    const privateKey = await importPKCS8(config.toolPrivateKey, 'RS256');
    
    // Export as JWK
    const jwk = await exportJWK(privateKey);
    
    // Remove private key components, keeping only public key parts
    const publicJWK = {
      kty: jwk.kty,
      use: 'sig',
      alg: 'RS256',
      kid: ltiKeyId,
      n: jwk.n,
      e: jwk.e,
    };

    const jwks = {
      keys: [publicJWK]
    };

    return NextResponse.json(jwks, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });

  } catch (error) {
    console.error('JWKS Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate JWKS',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}