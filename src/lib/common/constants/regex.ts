/**
 * Regular expression pattern for validating strong passwords.
 *
 * The password must contain:
 * - At least one digit (`\d`)
 * - At least one lowercase letter (`[a-z]`)
 * - At least one uppercase letter (`[A-Z]`)
 * - At least one special character (`[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]`)
 * - A minimum length of 8 characters
 *
 * @constant {RegExp}
 */
export const PASSWORD_REGEX =
    /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

export const AT_LEAST_ONE_DIGIT = /\d/;
export const AT_LEAST_ONE_LOWERCASE_LETTER = /[a-z]/;
export const AT_LEAST_ONE_UPPERCASE_LETTER = /[A-Z]/;
export const AT_LEAST_ONE_SPECIAL_CHARACTER =
    /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/;
export const AT_LEAST_EIGHT_CHARACTERS = /.{8,}/;

/**
 * Only allows lowercase letters, numbers and dashes
 */
export const LOWERCASE_NUMBERS_AND_DASHES = /^[a-z0-9-]+$/;

/**
 * Only allows uppercase letters, numbers and dashes
 */
export const UPPERCASE_NUMBERS_AND_DASHES = /^[A-Z0-9-]+$/;

/**
 * Only allows numbers and dashes
 */
export const NUMBERS_AND_DASHES = /^[0-9-]+$/;

/**
 * Only allows numbers
 */
export const NUMBERS = /^[0-9]+$/;
