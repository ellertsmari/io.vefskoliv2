import { SignJWT, importPKCS8 } from 'jose';
import { getLTIConfig } from './lti-config';

export interface GradeData {
  userId: string;
  scoreGiven: number;
  scoreMaximum: number;
  comment?: string;
  activityProgress: 'Initialized' | 'Started' | 'InProgress' | 'Submitted' | 'Completed';
  gradingProgress: 'FullyGraded' | 'Pending' | 'PendingManual' | 'Failed' | 'NotReady';
}

export interface LineItem {
  id: string;
  scoreMaximum: number;
  label: string;
  resourceId?: string;
  resourceLinkId?: string;
}

export class LTIGradingService {
  private config = getLTIConfig();

  async getAccessToken(): Promise<string> {
    try {
      const privateKey = await importPKCS8(this.config.toolPrivateKey, 'RS256');
      
      // Create JWT assertion for OAuth 2.0 client credentials flow
      const assertion = await new SignJWT({
        iss: this.config.clientId,
        sub: this.config.clientId,
        aud: this.config.authTokenUrl,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 60, // 1 minute
        jti: crypto.randomUUID(),
      })
        .setProtectedHeader({ 
          alg: 'RS256',
          kid: process.env.LTI_KEY_ID || 'lms-key-1'
        })
        .sign(privateKey);

      // Request access token from Canvas
      const response = await fetch(this.config.authTokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
          client_assertion: assertion,
          scope: 'https://purl.imsglobal.org/spec/lti-ags/scope/lineitem https://purl.imsglobal.org/spec/lti-ags/scope/score',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get access token: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      return data.access_token;
      
    } catch (error) {
      console.error('Error getting LTI access token:', error);
      throw error;
    }
  }

  async getLineItems(lineitemsUrl: string): Promise<LineItem[]> {
    try {
      const accessToken = await this.getAccessToken();
      
      const response = await fetch(lineitemsUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/vnd.ims.lis.v2.lineitemcontainer+json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get line items: ${response.status}`);
      }

      return await response.json();
      
    } catch (error) {
      console.error('Error getting line items:', error);
      throw error;
    }
  }

  async createLineItem(lineitemsUrl: string, lineItem: Omit<LineItem, 'id'>): Promise<LineItem> {
    try {
      const accessToken = await this.getAccessToken();
      
      const response = await fetch(lineitemsUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/vnd.ims.lis.v2.lineitem+json',
        },
        body: JSON.stringify(lineItem),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create line item: ${response.status} ${errorText}`);
      }

      return await response.json();
      
    } catch (error) {
      console.error('Error creating line item:', error);
      throw error;
    }
  }

  async submitGrade(lineitemUrl: string, gradeData: GradeData): Promise<void> {
    try {
      const accessToken = await this.getAccessToken();
      
      const scoresUrl = `${lineitemUrl}/scores`;
      
      const scoreSubmission = {
        userId: gradeData.userId,
        scoreGiven: gradeData.scoreGiven,
        scoreMaximum: gradeData.scoreMaximum,
        comment: gradeData.comment,
        timestamp: new Date().toISOString(),
        activityProgress: gradeData.activityProgress,
        gradingProgress: gradeData.gradingProgress,
      };

      const response = await fetch(scoresUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/vnd.ims.lis.v1.score+json',
        },
        body: JSON.stringify(scoreSubmission),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to submit grade: ${response.status} ${errorText}`);
      }

      console.log('Grade submitted successfully');
      
    } catch (error) {
      console.error('Error submitting grade:', error);
      throw error;
    }
  }

  async updateGrade(lineitemUrl: string, gradeData: GradeData): Promise<void> {
    // For Canvas, updating a grade is the same as submitting a new score
    return this.submitGrade(lineitemUrl, gradeData);
  }
}