import { z } from "zod";
import {
    AT_LEAST_ONE_DIGIT,
    AT_LEAST_ONE_UPPERCASE_LETTER,
    AT_LEAST_ONE_LOWERCASE_LETTER,
    AT_LEAST_ONE_SPECIAL_CHARACTER,
    AT_LEAST_EIGHT_CHARACTERS,
    NUMBERS,
} from "$lib/common/constants/regex";

export const authLoginValidator = z.object({
    email: z
        .string({ required_error: "Email address is required" })
        .email({ message: "Enter a valid email address" }),
    password: z.string({ required_error: "Password is required" }),
});

export const passwordValidator = z
    .string()
    .regex(AT_LEAST_ONE_DIGIT, "must contain a number")
    .regex(AT_LEAST_ONE_UPPERCASE_LETTER, "must contain an uppercase letter")
    .regex(AT_LEAST_ONE_LOWERCASE_LETTER, "must contain a lowercase letter")
    .regex(AT_LEAST_ONE_SPECIAL_CHARACTER, "must contain a special character")
    .regex(AT_LEAST_EIGHT_CHARACTERS, "must be at least 8 characters");

export const authRegisterValidator = z
    .object({
        email: z.string().email(),
        password: passwordValidator,
        passwordConfirm: passwordValidator,
    })
    .refine((data) => data.password === data.passwordConfirm, {
        message: "Passwords do not match",
        path: ["passwordConfirm"],
    });

export const authTOTPValidator = z.object({
    otp: z
        .string({ required_error: "One time password is required" })
        .length(6, "One time password must be 6 characters long")
        .regex(NUMBERS, "One time password must only contain numbers"),
});
