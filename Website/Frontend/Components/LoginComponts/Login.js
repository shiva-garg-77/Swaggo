"use client";
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import OptimizedLink from '../Helper/OptimizedLink';
import { useUnifiedTheme } from '../../context/UnifiedThemeProvider';
import { useFixedSecureAuth as useSecureAuth } from '../../context/FixedSecureAuthContext';
import { toast } from 'react-hot-toast';
import { useMobileDetection } from '../../hooks/useMobileDetection';
import { ResponsiveContainer, ResponsiveCard } from '../Responsive/ResponsiveContainer';
import { AccessibleButton, AccessibleInput } from '../Accessibility/AccessibilityUtils';
import { useI18n } from '../../context/I18nContext';
import LanguageSelector from '../LanguageSelector/LanguageSelector';
import UnifiedThemeToggle from '../Theme/UnifiedThemeToggle';

export default function Login() {
  const { t } = useI18n();
  const { theme } = useUnifiedTheme();
  const { isMobile } = useMobileDetection();
  const { 
    login, 
    isAuthenticated,
    isLoading,
    error,
    clearError
  } = useSecureAuth();
  
  // Map SecureAuth properties to legacy interface
  const initialized = !isLoading;
  const ErrorMsg = error;
  const router = useRouter();
  const [formData, setFormData] = useState({
    emailorUsername: '',
    password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // MFA state
  const [mfaState, setMfaState] = useState({
    required: false,
    token: null,
    code: '',
    useBackupCode: false,
    attemptsRemaining: 3,
    backupCodesAvailable: false
  });

  // Handle redirect on successful login (only after initialization)
  useEffect(() => {
    if (initialized && isAuthenticated) {
      router.push('/home');
    }
  }, [initialized, isAuthenticated, router]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error message when user starts typing
    if (ErrorMsg || error) {
      clearError();
    }
  };
  
  const handleMFACodeChange = (e) => {
    const { value } = e.target;
    
    // Only allow numbers for TOTP codes
    if (!mfaState.useBackupCode && !/^\d*$/.test(value)) {
      return;
    }
    
    setMfaState(prev => ({ ...prev, code: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const { emailorUsername, password } = formData;
    let info;
    if (emailorUsername.includes('@')) {
      info = { email: emailorUsername, password }
    } else {
      info = { username: emailorUsername, password }
    }
    
    try {
      // Use main auth login (already has MFA support built-in)
      const result = await login({
        identifier: emailorUsername,
        password: password
      });
      
      if (result.success) {
        toast.success(t('auth.login.loginSuccess'));
        router.push('/home');
      } else if (result.mfaRequired) {
        // MFA required
        setMfaState({
          required: true,
          token: result.mfaToken,
          code: '',
          useBackupCode: false,
          attemptsRemaining: 3,
          backupCodesAvailable: result.backupCodesAvailable
        });
        toast.info(t('auth.mfa.enterCode'));
      } else {
        toast.error(result.error || t('auth.login.loginFailed'));
      }
    } catch (err) {
      console.error("Login failed:", err);
      toast.error(t('auth.login.loginFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleMFASubmit = async (e) => {
    e.preventDefault();
    if (!mfaState.code.trim()) {
      toast.error(t('validation.required'));
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Use the main login method with MFA code
      const result = await login({
        identifier: formData.emailorUsername,
        password: formData.password
      }, mfaState.code.trim());
      
      if (result && result.success) {
        toast.success(t('auth.mfa.verificationSuccess'));
        setMfaState(prev => ({ ...prev, required: false }));
        router.push('/home');
      } else {
        toast.error(result?.error || t('auth.mfa.verificationFailed'));
        setMfaState(prev => ({
          ...prev,
          code: '',
          attemptsRemaining: prev.attemptsRemaining - 1
        }));
      }
    } catch (error) {
      console.error('MFA verification error:', error);
      toast.error(t('auth.mfa.verificationFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const toggleBackupCode = () => {
    setMfaState(prev => ({
      ...prev,
      useBackupCode: !prev.useBackupCode,
      code: ''
    }));
  };

  // Show nothing until initialized
  if (!initialized) {
    return null;
  }

  // Don't render login form if user is already authenticated
  if (isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center p-5 gap-5 flex-wrap transition-all duration-300">
      <div className="absolute top-4 right-4 flex space-x-2">
        <LanguageSelector variant="icon" />
        <UnifiedThemeToggle showChatThemes={false} />
      </div>
      
      <ResponsiveContainer fullWidth={isMobile}>
        {/* Login Card */}
        <ResponsiveCard 
          className="w-full max-w-md text-center shadow-2xl border border-white/20 dark:border-white/10 hover:transform hover:-translate-y-2 transition-all duration-300 animate-[slideUp_0.6s_ease-out]"
          mobileCompact={true}
        >
          {/* Logo Section */}
          <div className="py-6">
            {/* Fixed consistent dimensions for both light and dark logos */}
            <div className="w-32 h-16 mx-auto flex items-center justify-center">
              <img
                src={theme === 'light' ? '/logo_light.png' : '/Logo_dark1.png'}
                alt="Swaggo Logo"
                className="max-w-full max-h-full object-contain"
              />
            </div>
          </div>

          {/* Login Form */}
          {!mfaState.required ? (
            <form onSubmit={handleSubmit} className="w-full">
              <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">
                {t('auth.login.title')}
              </h1>
              
              <AccessibleInput
                label={t('auth.login.emailOrUsername')}
                id="emailorUsername"
                type="text"
                name="emailorUsername"
                value={formData.emailorUsername}
                onChange={handleInputChange}
                placeholder={t('auth.login.emailOrUsername')}
                required
              />

              <AccessibleInput
                label={t('auth.login.password')}
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder={t('auth.login.password')}
                required
              />

              {ErrorMsg && (
                <p className="text-red-500 text-sm mb-3 text-center" role="alert">
                  {ErrorMsg}
                </p>
              )}
              
              <AccessibleButton
                type="submit"
                disabled={isSubmitting}
                ariaLabel={t('auth.login.loginButton')}
                className="w-full bg-linear-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-3xl transition-all duration-300 mb-5"
              >
                {isSubmitting ? t('common.loading') : t('auth.login.loginButton')}
              </AccessibleButton>
              
              <div className='h-[0.5px] w-full bg-cyan-900'></div>

              <OptimizedLink href={"/forget-password"} prefetch={true}>
                <AccessibleButton
                  type="button"
                  ariaLabel={t('auth.login.forgotPassword')}
                  className="text-red-500 my-5 hover:text-red-600 text-sm font-medium hover:underline hover:scale-105 transition-all duration-300 mb-5"
                >
                  {t('auth.login.forgotPassword')}
                </AccessibleButton>
              </OptimizedLink>
            </form>
          ) : (
            /* MFA Form */
            <form onSubmit={handleMFASubmit} className="w-full">
              <div className="mb-5 text-center">
                <div className="w-16 h-16 mx-auto bg-linear-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                  {t('auth.mfa.title')}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {mfaState.useBackupCode
                    ? t('auth.mfa.backupCode')
                    : t('auth.mfa.enterCode')
                  }
                </p>
              </div>
              
              <AccessibleInput
                label={mfaState.useBackupCode ? t('auth.mfa.backupCodeLabel') : t('auth.mfa.code')}
                id="mfaCode"
                type={mfaState.useBackupCode ? 'text' : 'tel'}
                name="mfaCode"
                value={mfaState.code}
                onChange={handleMFACodeChange}
                placeholder={mfaState.useBackupCode ? t('auth.mfa.backupCodeLabel') : '000000'}
                maxLength={mfaState.useBackupCode ? 16 : 6}
                autoComplete="one-time-code"
                required
                disabled={isSubmitting}
              />
              
              {mfaState.attemptsRemaining < 3 && (
                <div className="mb-4 text-center">
                  <p className="text-yellow-600 dark:text-yellow-400 text-sm">
                    {t('auth.mfa.attemptsRemaining', { count: mfaState.attemptsRemaining })}
                  </p>
                </div>
              )}
              
              <div className="flex flex-col gap-3 mb-5">
                <AccessibleButton
                  type="submit"
                  disabled={isSubmitting || !mfaState.code.trim()}
                  ariaLabel={t('auth.mfa.verifyButton')}
                  className="w-full bg-linear-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-3xl transition-all duration-300"
                >
                  {isSubmitting ? t('common.loading') : t('auth.mfa.verifyButton')}
                </AccessibleButton>
                
                {mfaState.backupCodesAvailable && (
                  <AccessibleButton
                    type="button"
                    onClick={toggleBackupCode}
                    ariaLabel={mfaState.useBackupCode ? t('auth.mfa.useAppCode') : t('auth.mfa.useBackupCode')}
                    disabled={isSubmitting}
                    className="text-blue-500 hover:text-blue-600 text-sm font-medium hover:underline transition-all duration-300"
                  >
                    {mfaState.useBackupCode ? t('auth.mfa.useAppCode') : t('auth.mfa.useBackupCode')}
                  </AccessibleButton>
                )}
                
                <AccessibleButton
                  type="button"
                  onClick={() => setMfaState(prev => ({ ...prev, required: false }))}
                  ariaLabel={t('auth.mfa.backToLogin')}
                  disabled={isSubmitting}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-sm font-medium hover:underline transition-all duration-300"
                >
                  ← {t('auth.mfa.backToLogin')}
                </AccessibleButton>
              </div>
            </form>
          )}
        </ResponsiveCard>
        
        <ResponsiveCard 
          className="w-full max-w-md text-center shadow-2xl border border-white/20 dark:border-white/10 hover:transform hover:-translate-y-2 transition-all duration-300 animate-[slideUp_0.6s_ease-out]"
          mobileCompact={true}
        >
          <span className="text-gray-600 dark:text-gray-300 text-sm">
            {t('auth.login.noAccount')}
          </span>
          <OptimizedLink href={"/signup"} className="text-blue-500 hover:text-blue-600 text-sm font-medium ml-1 hover:underline hover:scale-105 transition-all duration-300" prefetch={true}>
            {t('auth.login.signupLink')}
          </OptimizedLink>
        </ResponsiveCard>
      </ResponsiveContainer>
    </div>
  );
}