import { NextResponse } from 'next/server';
import { getLTIConfig } from '../../../lib/lti-config';
import { importPKCS8, importSPKI, exportJWK } from 'jose';

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

    // Prefer the public key: this endpoint publishes public material, and there
    // is no reason for the private key to be in scope on the path that serves it.
    //
    // `extractable: true` is required. jose imports keys as non-extractable by
    // default, and `exportJWK` on a non-extractable key throws — which surfaced
    // here as a 500 on an endpoint nothing in the app calls, but that CANVAS
    // fetches while creating the developer key. A broken JWKS fails key creation
    // with an error the admin sees and we don't.
    const publicKey = config.toolPublicKey
      ? await importSPKI(config.toolPublicKey, 'RS256', { extractable: true })
      : await importPKCS8(config.toolPrivateKey, 'RS256', { extractable: true });

    // Export as JWK
    const jwk = await exportJWK(publicKey);
    
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