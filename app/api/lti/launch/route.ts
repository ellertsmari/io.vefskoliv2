import { NextRequest, NextResponse } from 'next/server';
import { validateLTIToken, extractUserInfo, extractContextInfo, extractGradingInfo, LTIAuthError } from '../../../lib/lti-auth';
import { getUserRoleFromLTI, getLTIConfig, LTI_MESSAGE_TYPES } from '../../../lib/lti-config';
import { connectToDatabase } from '../../../serverActions/mongoose-connector';
import { User } from '../../../models/user';
import { LTILaunch } from '../../../models/lti-launch';
import { SignJWT } from 'jose';
import { validateLTIState, consumeLTIState } from '../../../lib/lti-state-store';
import bcrypt from 'bcrypt';

export async function POST(request: NextRequest) {
  try {
    const body = await request.formData();
    const idToken = body.get('id_token') as string;
    const state = body.get('state') as string;

    if (!idToken) {
      return NextResponse.json({ error: 'Missing id_token' }, { status: 400 });
    }

    if (!state) {
      return NextResponse.json({ error: 'Missing state parameter' }, { status: 400 });
    }

    // Connect to database first
    await connectToDatabase();

    // Validate the LTI token
    const claims = await validateLTIToken(idToken);
    
    // Validate state and nonce
    const stateValidation = await validateLTIState(state, claims.nonce);
    
    if (!stateValidation.valid) {
      console.error('State validation failed:', stateValidation.error);
      throw new LTIAuthError(
        'Invalid or expired authentication state',
        'INVALID_STATE'
      );
    }
    
    // Consume the state to prevent replay attacks (single-use only)
    await consumeLTIState(state);
    
    // Extract user and context information
    const userInfo = extractUserInfo(claims);
    const contextInfo = extractContextInfo(claims);
    const gradingInfo = extractGradingInfo(claims);
    
    // Find or create user
    let user = await User.findOne({ email: userInfo.email });
    
    if (!user) {
      // Create new user from LTI data
      const userRole = getUserRoleFromLTI(userInfo.roles);
      
      // Generate a secure random password and hash it
      // LTI users authenticate via Canvas, so they never use this password
      const randomPassword = crypto.randomUUID();
      const hashedPassword = await bcrypt.hash(randomPassword, 10);
      
      user = new User({
        name: userInfo.name,
        email: userInfo.email,
        password: hashedPassword, // Store hashed password
        role: userRole,
        ltiId: userInfo.id,
        createdAt: new Date(),
      });
      
      await user.save();
    } else {
      // Update existing user's LTI ID if not set
      if (!user.ltiId) {
        user.ltiId = userInfo.id;
        await user.save();
      }
    }

    // Store or update LTI launch context
    const ltiLaunch = await LTILaunch.findOneAndUpdate(
      {
        userId: userInfo.id,
        contextId: contextInfo.contextId,
        resourceLinkId: contextInfo.resourceLinkId,
      },
      {
        userId: userInfo.id,
        contextId: contextInfo.contextId || '',
        resourceLinkId: contextInfo.resourceLinkId || '',
        deploymentId: claims['https://purl.imsglobal.org/spec/lti/claim/deployment_id'],
        issuer: claims.iss,
        targetLinkUri: claims['https://purl.imsglobal.org/spec/lti/claim/target_link_uri'],
        lineitemsUrl: gradingInfo.lineitemsUrl,
        lineitemUrl: gradingInfo.lineitemUrl,
        contextTitle: contextInfo.contextTitle,
        resourceLinkTitle: contextInfo.resourceLinkTitle,
        roles: userInfo.roles,
        lastAccessed: new Date(),
      },
      {
        upsert: true,
        new: true,
      }
    );

    // Create a session token for the user
    const nextAuthSecret = process.env.NEXTAUTH_SECRET;
    if (!nextAuthSecret) {
      throw new Error('NEXTAUTH_SECRET environment variable is required');
    }
    const secret = new TextEncoder().encode(nextAuthSecret);
    
    const sessionToken = await new SignJWT({
      sub: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      ltiContext: {
        contextId: contextInfo.contextId,
        resourceLinkId: contextInfo.resourceLinkId,
        hasGrading: gradingInfo.hasGrading,
      },
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(secret);

    // Handle different message types
    const messageType = claims['https://purl.imsglobal.org/spec/lti/claim/message_type'];
    
    if (messageType === LTI_MESSAGE_TYPES.DEEP_LINKING_REQUEST) {
      // Extract deep linking return URL from claims
      const deepLinkingSettings = claims['https://purl.imsglobal.org/spec/lti-dl/claim/deep_linking_settings'];
      const deepLinkReturnUrl = deepLinkingSettings?.deep_link_return_url;
      
      if (!deepLinkReturnUrl) {
        throw new LTIAuthError(
          'Missing deep_link_return_url in deep linking request',
          'MISSING_RETURN_URL'
        );
      }
      
      // Validate that the return URL is from a trusted domain (Canvas)
      try {
        const returnUrl = new URL(deepLinkReturnUrl);
        const config = getLTIConfig();
        const issuerUrl = new URL(config.issuer);
        
        if (returnUrl.origin !== issuerUrl.origin) {
          throw new LTIAuthError(
            'Deep linking return URL must be from the same origin as the issuer',
            'INVALID_RETURN_URL'
          );
        }
      } catch (error) {
        if (error instanceof LTIAuthError) throw error;
        throw new LTIAuthError(
          'Invalid deep_link_return_url format',
          'INVALID_RETURN_URL'
        );
      }
      
      // Redirect to deep linking page where teachers can select content
      const response = NextResponse.redirect(new URL('/lti/deep-linking', request.url));
      
      // Store validated deep linking return URL in cookie
      response.cookies.set('lti-deep-link-return', deepLinkReturnUrl, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 3600, // 1 hour
        path: '/lti',
      });
      
      response.cookies.set('lti-session', sessionToken, {
        httpOnly: true,
        secure: true, // Always secure, not conditional
        sameSite: 'none', // Required for LTI cross-domain
        maxAge: 3600, // 1 hour instead of 24
        path: '/lti', // Restrict to LTI routes
      });
      return response;
    } else {
      // Regular resource link launch - redirect to main LMS
      const targetUrl = new URL('/LMS/dashboard', request.url);
      
      // Add context parameters if available
      if (contextInfo.resourceLinkId) {
        targetUrl.searchParams.set('resource_link', contextInfo.resourceLinkId);
      }
      
      const response = NextResponse.redirect(targetUrl);
      response.cookies.set('lti-session', sessionToken, {
        httpOnly: true,
        secure: true, // Always secure, not conditional
        sameSite: 'none', // Required for LTI cross-domain
        maxAge: 3600, // 1 hour instead of 24
        path: '/lti', // Restrict to LTI routes
      });
      
      return response;
    }

  } catch (error) {
    console.error('LTI Launch Error:', error);
    
    if (error instanceof LTIAuthError) {
      return NextResponse.json(
        { 
          error: 'LTI Authentication Failed', 
          details: error.message,
          code: error.code 
        }, 
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}