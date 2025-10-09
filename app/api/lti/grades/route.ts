import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '../../../serverActions/mongoose-connector';
import { LTILaunch } from '../../../models/lti-launch';
import { LTIGradingService } from '../../../lib/lti-grading';
import { auth } from '../../../../auth';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only teachers can submit grades
    if (session.user.role !== 'teacher') {
      return NextResponse.json({ error: 'Forbidden: Only teachers can submit grades' }, { status: 403 });
    }

    const {
      studentUserId,
      contextId,
      resourceLinkId,
      score,
      maxScore = 100,
      comment,
      activityProgress = 'Completed',
      gradingProgress = 'FullyGraded'
    } = await request.json();

    // Validate score ranges
    if (typeof score !== 'number' || score < 0 || score > maxScore) {
      return NextResponse.json({ 
        error: 'Invalid score: must be a number between 0 and maxScore' 
      }, { status: 400 });
    }

    if (typeof maxScore !== 'number' || maxScore <= 0) {
      return NextResponse.json({ 
        error: 'Invalid maxScore: must be a positive number' 
      }, { status: 400 });
    }

    if (!studentUserId || !contextId || !resourceLinkId || score === undefined) {
      return NextResponse.json({ 
        error: 'Missing required fields: studentUserId, contextId, resourceLinkId, score' 
      }, { status: 400 });
    }

    // Validate input types and lengths
    if (typeof studentUserId !== 'string' || studentUserId.length > 255) {
      return NextResponse.json({ error: 'Invalid studentUserId' }, { status: 400 });
    }
    
    if (typeof contextId !== 'string' || contextId.length > 255) {
      return NextResponse.json({ error: 'Invalid contextId' }, { status: 400 });
    }
    
    if (typeof resourceLinkId !== 'string' || resourceLinkId.length > 255) {
      return NextResponse.json({ error: 'Invalid resourceLinkId' }, { status: 400 });
    }

    if (comment && (typeof comment !== 'string' || comment.length > 1000)) {
      return NextResponse.json({ error: 'Invalid comment: must be string under 1000 characters' }, { status: 400 });
    }

    await connectToDatabase();

    // Find the LTI launch context for this student and resource
    const ltiLaunch = await LTILaunch.findOne({
      userId: studentUserId,
      contextId,
      resourceLinkId,
    });

    if (!ltiLaunch) {
      return NextResponse.json({ 
        error: 'LTI launch context not found for this student and resource' 
      }, { status: 404 });
    }

    if (!ltiLaunch.lineitemsUrl && !ltiLaunch.lineitemUrl) {
      return NextResponse.json({ 
        error: 'No grade passback URLs available for this resource' 
      }, { status: 400 });
    }

    const gradingService = new LTIGradingService();

    try {
      let lineitemUrl = ltiLaunch.lineitemUrl;

      // If we don't have a specific line item URL, we might need to create one
      if (!lineitemUrl && ltiLaunch.lineitemsUrl) {
        // Check if a line item already exists for this resource
        const lineItems = await gradingService.getLineItems(ltiLaunch.lineitemsUrl);
        const existingLineItem = lineItems.find(item => 
          item.resourceId === resourceLinkId || 
          item.resourceLinkId === resourceLinkId
        );

        if (existingLineItem) {
          lineitemUrl = existingLineItem.id;
        } else {
          // Create a new line item
          const newLineItem = await gradingService.createLineItem(ltiLaunch.lineitemsUrl, {
            scoreMaximum: maxScore,
            label: ltiLaunch.resourceLinkTitle || 'LMS Assignment',
            resourceId: resourceLinkId,
            resourceLinkId: resourceLinkId,
          });
          lineitemUrl = newLineItem.id;
        }
      }

      if (!lineitemUrl) {
        return NextResponse.json({ 
          error: 'Could not determine line item URL for grade submission' 
        }, { status: 400 });
      }

      // Submit the grade
      await gradingService.submitGrade(lineitemUrl, {
        userId: studentUserId,
        scoreGiven: score,
        scoreMaximum: maxScore,
        comment,
        activityProgress,
        gradingProgress,
      });

      return NextResponse.json({ 
        success: true,
        message: 'Grade submitted successfully to Canvas'
      });

    } catch (gradingError) {
      console.error('Error submitting grade to Canvas:', gradingError);
      return NextResponse.json({ 
        error: 'Failed to submit grade to Canvas',
        details: gradingError instanceof Error ? gradingError.message : 'Unknown error'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('LTI Grade submission error:', error);
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}