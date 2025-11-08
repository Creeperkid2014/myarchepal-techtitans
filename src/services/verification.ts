// Archaeologist Verification Code
// The valid verification code is stored in environment variable for security

export class VerificationService {
  // Get the valid verification code from environment variable
  private static getValidCode(): string {
    return import.meta.env.VITE_ARCHAEOLOGIST_VERIFICATION_CODE || '';
  }

  // Verify if the provided code is valid
  static isValidVerificationCode(code: string): boolean {
    const validCode = this.getValidCode();
    return validCode && code.trim() === validCode;
  }

  // Get hint about verification codes
  static getVerificationHint(): string {
    return 'Please enter the archaeologist verification code provided to you.';
  }

  // Check if email domain is from a recognized institution (optional additional verification)
  static isAcademicEmail(email: string): boolean {
    const academicDomains = [
      '.edu',
      '.ac.uk',
      '.ac.',
      'university',
      'college',
      'museum'
    ];

    const lowercaseEmail = email.toLowerCase();
    return academicDomains.some(domain => lowercaseEmail.includes(domain));
  }
}