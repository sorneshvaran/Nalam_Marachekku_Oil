'use server';

import { AuthError } from 'next-auth';

import { signIn, signOut } from '@/auth';
import { hashPassword } from '@/lib/password';
import { loginSchema, normalizeEmail, registrationSchema } from '@/lib/auth-validation';
import { safeReturnTo } from '@/lib/auth';
import { usersData } from '@/lib/users';

export type AuthFormState = {
  message?: string;
  fieldErrors?: Partial<
    Record<'name' | 'email' | 'password' | 'confirmPassword', string[]>
  >;
};

export async function registerAction(
  _previousState: AuthFormState | undefined,
  formData: FormData,
): Promise<AuthFormState | undefined> {
  const parsed = registrationSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  });

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      message: 'Check the highlighted fields and try again.',
    };
  }

  const callbackUrl = safeReturnTo(formData.get('callbackUrl'));
  const passwordHash = await hashPassword(parsed.data.password);
  const createdUser = await usersData.createCustomer({
    name: parsed.data.name,
    email: normalizeEmail(parsed.data.email),
    passwordHash,
  });

  if (!createdUser) {
    return { message: 'Unable to create an account with those details.' };
  }

  await signIn('credentials', {
    email: parsed.data.email,
    password: parsed.data.password,
    redirectTo: callbackUrl,
  });
}

export async function loginAction(
  _previousState: AuthFormState | undefined,
  formData: FormData,
): Promise<AuthFormState | undefined> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
      message: 'Enter a valid email and password.',
    };
  }

  const callbackUrl = safeReturnTo(formData.get('callbackUrl'));

  try {
    await signIn('credentials', {
      email: normalizeEmail(parsed.data.email),
      password: parsed.data.password,
      redirectTo: callbackUrl,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { message: 'Email or password is incorrect.' };
    }

    throw error;
  }
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: '/' });
}
