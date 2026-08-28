import { NextResponse } from 'next/server';
import { LTI_SCOPES, getToolBaseUrl } from '../../../lib/lti-config';

/**
 * Canvas LTI developer-key configuration, as JSON.
 *
 * A Canvas admin creates the key with Developer Keys -> + LTI Key -> Method:
 * "Enter URL" and pastes the URL of this endpoint. Canvas fetches it and fills in
 * every field itself, which turns a twenty-field form (and the support ticket
 * that follows when one field is wrong) into a paste and a save.
 *
 * This route must keep working BEFORE the key exists — it is what produces the
 * key — so it never touches `getLTIConfig()`, which throws without a client ID.
 */

const TOOL_TITLE = 'Vefskólinn Guides';
const TOOL_ID = 'vefskolinn-guides';
const TOOL_DESCRIPTION =
  'Guide submissions, peer reviews and grades from the Vefskólinn LMS, synced into the Canvas gradebook.';

export async function GET() {
  try {
    const baseUrl = getToolBaseUrl();
    const domain = new URL(baseUrl).host;

    const config = {
      title: TOOL_TITLE,
      description: TOOL_DESCRIPTION,
      oidc_initiation_url: `${baseUrl}/api/lti/login`,
      target_link_uri: `${baseUrl}/LMS/dashboard`,
      public_jwk_url: `${baseUrl}/api/lti/jwks`,
      scopes: [...LTI_SCOPES],
      extensions: [
        {
          domain,
          tool_id: TOOL_ID,
          platform: 'canvas.instructure.com',
          // `public` so the launch carries name and email: the email is how an
          // LTI identity is matched to an existing account in `User`, and
          // without it every launch would create a duplicate user.
          privacy_level: 'public',
          settings: {
            text: TOOL_TITLE,
            placements: [
              {
                placement: 'course_navigation',
                message_type: 'LtiResourceLinkRequest',
                text: TOOL_TITLE,
                target_link_uri: `${baseUrl}/LMS/dashboard`,
                // Visible to everyone: students use it to reach their guides,
                // teachers to reach grading.
                default: 'enabled',
                windowTarget: '_blank',
              },
              {
                // How a teacher turns guides into Canvas assignments: pick the
                // module's guides once and Canvas creates every assignment (and
                // therefore every line item) in one round trip.
                placement: 'assignment_selection',
                message_type: 'LtiDeepLinkingRequest',
                text: `Add ${TOOL_TITLE}`,
                target_link_uri: `${baseUrl}/lti/deep-linking`,
              },
            ],
          },
        },
      ],
    };

    return NextResponse.json(config, {
      headers: {
        'Content-Type': 'application/json',
        // Short: an admin who re-pastes the URL after a config change should get
        // the change, not a stale copy from a CDN edge.
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (error) {
    console.error('LTI config error:', error);
    return NextResponse.json(
      {
        error: 'Failed to build LTI configuration',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
