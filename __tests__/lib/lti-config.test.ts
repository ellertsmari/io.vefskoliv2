import { describe, expect, it, beforeEach } from '@jest/globals';
import { getUserRoleFromLTI, LTI_ROLES } from '../../app/lib/lti-config';

describe('LTI Config Utils', () => {
  describe('getUserRoleFromLTI', () => {
    it('should return teacher for Instructor role', () => {
      const roles = [LTI_ROLES.TEACHER];
      const result = getUserRoleFromLTI(roles);
      expect(result).toBe('teacher');
    });

    it('should return teacher for Administrator role', () => {
      const roles = [LTI_ROLES.ADMIN];
      const result = getUserRoleFromLTI(roles);
      expect(result).toBe('teacher');
    });

    it('should return student for Learner role', () => {
      const roles = [LTI_ROLES.STUDENT];
      const result = getUserRoleFromLTI(roles);
      expect(result).toBe('student');
    });

    it('should return teacher when user has both teacher and student roles', () => {
      const roles = [LTI_ROLES.STUDENT, LTI_ROLES.TEACHER];
      const result = getUserRoleFromLTI(roles);
      expect(result).toBe('teacher');
    });

    it('should return student when no recognized roles are present', () => {
      const roles = ['http://purl.imsglobal.org/vocab/lis/v2/membership#ContentDeveloper'];
      const result = getUserRoleFromLTI(roles);
      expect(result).toBe('student');
    });

    it('should return student for empty roles array', () => {
      const roles: string[] = [];
      const result = getUserRoleFromLTI(roles);
      expect(result).toBe('student');
    });

    it('should handle roles with partial matches containing Instructor', () => {
      const roles = ['http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor#Guest'];
      const result = getUserRoleFromLTI(roles);
      expect(result).toBe('teacher');
    });

    it('should handle roles with partial matches containing Teacher', () => {
      const roles = ['http://example.com/roles/TeacherAssistant'];
      const result = getUserRoleFromLTI(roles);
      expect(result).toBe('teacher');
    });

    it('should handle roles with partial matches containing Administrator', () => {
      const roles = ['http://example.com/roles/SystemAdministrator'];
      const result = getUserRoleFromLTI(roles);
      expect(result).toBe('teacher');
    });
  });
});
