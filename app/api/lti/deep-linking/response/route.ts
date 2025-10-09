import { NextRequest, NextResponse } from 'next/server';
import { SignJWT, importPKCS8 } from 'jose';
import { getLTIConfig } from '../../../../lib/lti-config';
import { connectToDatabase } from '../../../../serverActions/mongoose-connector';
import { Guide } from '../../../../models/guide';

export async function POST(request: NextRequest) {
  try {
    const { selectedGuides } = await request.json();
    
    if (!selectedGuides || selectedGuides.length === 0) {
      return NextResponse.json({ error: 'No guides selected' }, { status: 400 });
    }

    // Validate selectedGuides is an array of valid ObjectIds
    if (!Array.isArray(selectedGuides) || selectedGuides.length > 50) {
      return NextResponse.json({ error: 'Invalid guides selection' }, { status: 400 });
    }

    // Validate each guide ID format
    const objectIdPattern = /^[0-9a-fA-F]{24}$/;
    for (const guideId of selectedGuides) {
      if (typeof guideId !== 'string' || !objectIdPattern.test(guideId)) {
        return NextResponse.json({ error: 'Invalid guide ID format' }, { status: 400 });
      }
    }

    // Get LTI session from cookie to access deep linking context
    const ltiSession = request.cookies.get('lti-session')?.value;
    if (!ltiSession) {
      return NextResponse.json({ error: 'No LTI session found' }, { status: 401 });
    }

    await connectToDatabase();
    
    // Fetch selected guides
    const guides = await Guide.find({ _id: { $in: selectedGuides } });
    
    const config = getLTIConfig();
    const baseUrl = process.env.NEXTAUTH_URL;
    if (!baseUrl) {
      throw new Error('NEXTAUTH_URL environment variable is required');
    }
    
    // Create content items for each selected guide
    const contentItems = guides.map(guide => ({
      type: 'ltiResourceLink',
      title: guide.title,
      text: guide.description || `Learn with ${guide.title}`,
      url: `${baseUrl}/lti/content/${guide._id}`,
      custom: {
        guide_id: guide._id.toString(),
        guide_category: guide.category,
        guide_module: guide.module?.title || 'Unknown',
      },
      lineItem: {
        scoreMaximum: 100,
        label: `${guide.title} - Score`,
        resourceId: guide._id.toString(),
      },
    }));

    // Create deep linking response JWT
    const privateKey = await importPKCS8(config.toolPrivateKey, 'RS256');
    
    const ltiKeyId = process.env.LTI_KEY_ID;
    if (!ltiKeyId) {
      throw new Error('LTI_KEY_ID environment variable is required');
    }
    
    const deepLinkingResponse = await new SignJWT({
      iss: config.clientId,
      aud: config.issuer,
      exp: Math.floor(Date.now() / 1000) + 600, // 10 minutes
      iat: Math.floor(Date.now() / 1000),
      nonce: crypto.randomUUID(),
      'https://purl.imsglobal.org/spec/lti/claim/message_type': 'LtiDeepLinkingResponse',
      'https://purl.imsglobal.org/spec/lti/claim/version': '1.3.0',
      'https://purl.imsglobal.org/spec/lti/claim/deployment_id': config.deploymentId,
      'https://purl.imsglobal.org/spec/lti-dl/claim/content_items': contentItems,
    })
      .setProtectedHeader({ 
        alg: 'RS256',
        kid: ltiKeyId
      })
      .sign(privateKey);

    // Get the validated deep linking return URL from cookie
    const returnUrl = request.cookies.get('lti-deep-link-return')?.value;
    
    if (!returnUrl) {
      return NextResponse.json(
        { error: 'Deep linking return URL not found. Session may have expired.' },
        { status: 400 }
      );
    }
    
    // Escape HTML entities to prevent XSS
    const escapeHtml = (text: string) => text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
    
    const form = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Returning to Canvas...</title>
      </head>
      <body>
        <p>Returning to Canvas...</p>
        <form id="deepLinkingResponse" action="${escapeHtml(returnUrl)}" method="POST">
          <input type="hidden" name="JWT" value="${escapeHtml(deepLinkingResponse)}" />
        </form>
        <script>
          document.getElementById('deepLinkingResponse').submit();
        </script>
      </body>
      </html>
    `;

    return NextResponse.json({ 
      success: true, 
      form,
      contentItems: contentItems.length 
    });

  } catch (error) {
    console.error('Deep linking response error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create deep linking response',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}