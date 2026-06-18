# 登入/註冊 UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把既有的 `AuthContext`（`app/contexts/AuthContext.tsx`）接上實際畫面：一個可在登入/註冊模式間切換的 Modal 表單，以及 Nav 上的登入入口與已登入狀態顯示。

**Architecture:** 三個新元件分層：`AuthModal`（容器，管理開關與模式切換）→ `LoginForm` / `RegisterForm`（各自管理輸入欄位、提交狀態與錯誤訊息，呼叫 `useAuth()`）。`Nav.tsx` 持有 `isAuthModalOpen` state 並依登入狀態切換顯示「登入」按鈕或「顯示名稱 + 登出」。文字走 next-intl 既有架構，新增 `auth.json` namespace。

**Tech Stack:** Next.js App Router、React (Client Components)、next-intl、既有 CSS variables（`var(--background)` 等）。

詳細設計見 `docs/superpowers/specs/2026-06-18-login-register-ui-design.md`。

---

## 前置需求

- [[2026-06-18-go-auth-backend]] 的後端與 `AuthContext` 已合併進 `master`（已完成）。
- 本機測試時需要 Go 後端跑在 `localhost:8080`，前端 `npm run dev` 跑在 `localhost:3000`（沿用前一個子專案的本機環境）。

---

### Task 1: 新增 Auth i18n 文字

**Files:**
- Create: `messages/zh-TW/auth.json`
- Create: `messages/en-US/auth.json`
- Modify: `intl/request.ts`

- [ ] **Step 1: 建立中文文字檔**

```json
{
  "Auth": {
    "loginTitle": "登入",
    "registerTitle": "註冊",
    "email": "Email",
    "password": "密碼",
    "displayName": "顯示名稱",
    "loginButton": "登入",
    "registerButton": "註冊",
    "switchToRegister": "還沒有帳號？註冊",
    "switchToLogin": "已經有帳號？登入",
    "loggingIn": "登入中...",
    "registering": "註冊中...",
    "navLogin": "登入",
    "navLogout": "登出",
    "greeting": "你好，{name}"
  }
}
```

寫入 `messages/zh-TW/auth.json`。

- [ ] **Step 2: 建立英文文字檔**

```json
{
  "Auth": {
    "loginTitle": "Login",
    "registerTitle": "Register",
    "email": "Email",
    "password": "Password",
    "displayName": "Display Name",
    "loginButton": "Log In",
    "registerButton": "Register",
    "switchToRegister": "No account yet? Register",
    "switchToLogin": "Already have an account? Log in",
    "loggingIn": "Logging in...",
    "registering": "Registering...",
    "navLogin": "Log In",
    "navLogout": "Log Out",
    "greeting": "Hi, {name}"
  }
}
```

寫入 `messages/en-US/auth.json`。

- [ ] **Step 3: 在 `intl/request.ts` 加入新 namespace**

目前的 `intl/request.ts`:

```ts
import { getRequestConfig } from 'next-intl/server';
import { routing } from '@/intl/routing';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (
    !locale ||
    !routing.locales.includes(locale as (typeof routing.locales)[number])
  ) {
    locale = routing.defaultLocale;
  }

  const messages = {
    ...(await import(`../messages/${locale}/home.json`)).default,
    ...(await import(`../messages/${locale}/banner.json`)).default,
    ...(await import(`../messages/${locale}/about.json`)).default,
  };

  return {
    locale: locale as typeof routing.defaultLocale,
    messages,
  };
});
```

修改 messages 區塊,加入 `auth.json`:

```diff
   const messages = {
     ...(await import(`../messages/${locale}/home.json`)).default,
     ...(await import(`../messages/${locale}/banner.json`)).default,
     ...(await import(`../messages/${locale}/about.json`)).default,
+    ...(await import(`../messages/${locale}/auth.json`)).default,
   };
```

- [ ] **Step 4: 驗證**

```bash
npm run build
```

預期:建置成功,無錯誤(此時還沒有任何元件使用 `Auth` namespace,純粹確認 JSON 格式正確、import 路徑正確)。

- [ ] **Step 5: Commit**

```bash
git add messages/zh-TW/auth.json messages/en-US/auth.json intl/request.ts
git commit -m "feat: add Auth i18n messages"
```

---

### Task 2: LoginForm 元件

**Files:**
- Create: `app/components/auth/LoginForm.tsx`

- [ ] **Step 1: 建立元件**

```tsx
'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/app/contexts/AuthContext';

export default function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const t = useTranslations('Auth');
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
      onSuccess();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : t('loginButton'));
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {errorMessage && (
        <p className="text-xs" style={{ color: '#dc2626' }}>
          {errorMessage}
        </p>
      )}
      <label className="flex flex-col gap-1">
        <span
          className="text-xs uppercase tracking-wider"
          style={{ color: 'var(--text-muted)' }}
        >
          {t('email')}
        </span>
        <input
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="border px-3 py-2 text-sm"
          style={{
            borderColor: 'var(--border)',
            backgroundColor: 'transparent',
            color: 'var(--foreground)',
          }}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span
          className="text-xs uppercase tracking-wider"
          style={{ color: 'var(--text-muted)' }}
        >
          {t('password')}
        </span>
        <input
          type="password"
          required
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="border px-3 py-2 text-sm"
          style={{
            borderColor: 'var(--border)',
            backgroundColor: 'transparent',
            color: 'var(--foreground)',
          }}
        />
      </label>
      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-2 px-4 py-2 text-xs uppercase tracking-wider font-semibold"
        style={{ backgroundColor: 'var(--foreground)', color: 'var(--background)' }}
      >
        {isSubmitting ? t('loggingIn') : t('loginButton')}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: 驗證可編譯**

```bash
npm run build
```

預期:建置成功(此時 `LoginForm` 還沒被任何頁面引用,Next.js 對未被引用的 client component 不會報錯,只會做型別檢查)。

- [ ] **Step 3: Commit**

```bash
git add app/components/auth/LoginForm.tsx
git commit -m "feat: add LoginForm component"
```

---

### Task 3: RegisterForm 元件

**Files:**
- Create: `app/components/auth/RegisterForm.tsx`

- [ ] **Step 1: 建立元件**

```tsx
'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/app/contexts/AuthContext';

export default function RegisterForm({ onSuccess }: { onSuccess: () => void }) {
  const t = useTranslations('Auth');
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await register(email, password, displayName);
      onSuccess();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : t('registerButton'));
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {errorMessage && (
        <p className="text-xs" style={{ color: '#dc2626' }}>
          {errorMessage}
        </p>
      )}
      <label className="flex flex-col gap-1">
        <span
          className="text-xs uppercase tracking-wider"
          style={{ color: 'var(--text-muted)' }}
        >
          {t('displayName')}
        </span>
        <input
          type="text"
          required
          value={displayName}
          onChange={e => setDisplayName(e.target.value)}
          className="border px-3 py-2 text-sm"
          style={{
            borderColor: 'var(--border)',
            backgroundColor: 'transparent',
            color: 'var(--foreground)',
          }}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span
          className="text-xs uppercase tracking-wider"
          style={{ color: 'var(--text-muted)' }}
        >
          {t('email')}
        </span>
        <input
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="border px-3 py-2 text-sm"
          style={{
            borderColor: 'var(--border)',
            backgroundColor: 'transparent',
            color: 'var(--foreground)',
          }}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span
          className="text-xs uppercase tracking-wider"
          style={{ color: 'var(--text-muted)' }}
        >
          {t('password')}
        </span>
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="border px-3 py-2 text-sm"
          style={{
            borderColor: 'var(--border)',
            backgroundColor: 'transparent',
            color: 'var(--foreground)',
          }}
        />
      </label>
      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-2 px-4 py-2 text-xs uppercase tracking-wider font-semibold"
        style={{ backgroundColor: 'var(--foreground)', color: 'var(--background)' }}
      >
        {isSubmitting ? t('registering') : t('registerButton')}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: 驗證可編譯**

```bash
npm run build
```

預期:建置成功。

- [ ] **Step 3: Commit**

```bash
git add app/components/auth/RegisterForm.tsx
git commit -m "feat: add RegisterForm component"
```

---

### Task 4: AuthModal 元件

**Files:**
- Create: `app/components/auth/AuthModal.tsx`

- [ ] **Step 1: 建立元件**

```tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

type AuthMode = 'login' | 'register';

export default function AuthModal({ onClose }: { onClose: () => void }) {
  const t = useTranslations('Auth');
  const [mode, setMode] = useState<AuthMode>('login');

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center px-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm border p-8"
        style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2
            className="text-lg font-bold font-serif"
            style={{ color: 'var(--foreground)' }}
          >
            {mode === 'login' ? t('loginTitle') : t('registerTitle')}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-xs uppercase tracking-wider"
            style={{ color: 'var(--text-muted)' }}
          >
            ✕
          </button>
        </div>

        {mode === 'login' ? (
          <LoginForm onSuccess={onClose} />
        ) : (
          <RegisterForm onSuccess={onClose} />
        )}

        <button
          onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
          className="mt-6 text-xs underline"
          style={{ color: 'var(--text-muted)' }}
        >
          {mode === 'login' ? t('switchToRegister') : t('switchToLogin')}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 驗證可編譯**

```bash
npm run build
```

預期:建置成功。

- [ ] **Step 3: Commit**

```bash
git add app/components/auth/AuthModal.tsx
git commit -m "feat: add AuthModal component"
```

---

### Task 5: 整合 Nav

**Files:**
- Modify: `app/components/layout/Nav.tsx`

- [ ] **Step 1: 加入 import 與 state**

在 `app/components/layout/Nav.tsx` 檔案開頭:

```diff
 'use client';

 import { useTranslations, useLocale } from 'next-intl';
 import { Link, useRouter, usePathname } from '@/intl/routing';
 import { useTheme } from '../ThemeProvider';
 import { useSyncExternalStore, useState } from 'react';
+import { useAuth } from '@/app/contexts/AuthContext';
+import AuthModal from '../auth/AuthModal';

 export default function Nav() {
   const t = useTranslations('Nav');
+  const tAuth = useTranslations('Auth');
   const locale = useLocale();
   const router = useRouter();
   const pathname = usePathname();
   const { theme, toggleTheme } = useTheme();
   const [menuOpen, setMenuOpen] = useState(false);
+  const { user, logout } = useAuth();
+  const [authModalOpen, setAuthModalOpen] = useState(false);
```

- [ ] **Step 2: 在「Right controls」區塊加入登入/已登入顯示**

目前的 Right controls 區塊開頭(語言切換按鈕之前):

```tsx
          {/* Right controls */}
          <div className="flex items-center gap-3">
            {/* Language toggle */}
```

改成:

```tsx
          {/* Right controls */}
          <div className="flex items-center gap-3">
            {/* Auth control */}
            {user ? (
              <div className="flex items-center gap-2">
                <span
                  className="text-xs tracking-[0.1em]"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {tAuth('greeting', { name: user.display_name })}
                </span>
                <button
                  onClick={() => logout()}
                  className="text-xs tracking-[0.15em] uppercase font-semibold border px-3 py-1.5 transition-all"
                  style={{
                    borderColor: 'var(--border)',
                    color: 'var(--text-muted)',
                    backgroundColor: 'transparent',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'var(--foreground)';
                    e.currentTarget.style.color = 'var(--foreground)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.color = 'var(--text-muted)';
                  }}
                >
                  {tAuth('navLogout')}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="text-xs tracking-[0.15em] uppercase font-semibold border px-3 py-1.5 transition-all"
                style={{
                  borderColor: 'var(--border)',
                  color: 'var(--text-muted)',
                  backgroundColor: 'transparent',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--foreground)';
                  e.currentTarget.style.color = 'var(--foreground)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.color = 'var(--text-muted)';
                }}
              >
                {tAuth('navLogin')}
              </button>
            )}

            {/* Language toggle */}
```

- [ ] **Step 3: 在元件結尾渲染 Modal**

目前 `Nav.tsx` 的結尾(在 mobile menu 區塊之後、`</nav>` 之前):

```tsx
      {/* Mobile menu */}
      {menuOpen && (
        <div ...>
          ...
        </div>
      )}
    </nav>
  );
}
```

改成在 `</nav>` 之前、`{menuOpen && (...)}` 之後加入:

```diff
       {/* Mobile menu */}
       {menuOpen && (
         <div ...>
           ...
         </div>
       )}
+
+      {authModalOpen && (
+        <AuthModal onClose={() => setAuthModalOpen(false)} />
+      )}
     </nav>
   );
 }
```

- [ ] **Step 4: 驗證可編譯**

```bash
npm run build
```

預期:建置成功,無 TypeScript 錯誤。

- [ ] **Step 5: Commit**

```bash
git add app/components/layout/Nav.tsx
git commit -m "feat: integrate auth state and modal trigger into Nav"
```

---

### Task 6: 手動端對端驗證

**Files:** 無新檔案,純驗證步驟。

- [ ] **Step 1: 啟動 Go 後端**

```bash
cd backend
export $(grep -v '^#' .env | xargs)
go run ./cmd/server
```

預期輸出包含 `server listening on :8080`。(若尚未設定過 `.env`,先 `cp .env.example .env` 並依本機 Postgres 設定調整 `DATABASE_URL`/`JWT_SECRET`。)

- [ ] **Step 2: 啟動前端**

```bash
npm run dev
```

打開 `http://localhost:3000`。

- [ ] **Step 3: 驗證註冊流程**

1. 確認 Nav 右上角顯示「登入」按鈕(未登入狀態)。
2. 點擊「登入」,確認 Modal 開啟,預設顯示登入表單。
3. 點擊「還沒有帳號？註冊」,確認切換成註冊表單(顯示名稱/Email/密碼三個欄位)。
4. 填入一組新的 email(例如 `ui-test@example.com`)、密碼(至少 8 字)、顯示名稱,送出。
5. 預期:Modal 自動關閉,Nav 右上角變成「你好,<顯示名稱>」+「登出」按鈕。

- [ ] **Step 4: 驗證登出流程**

1. 點擊「登出」。
2. 預期:Nav 變回顯示「登入」按鈕。

- [ ] **Step 5: 驗證登入流程**

1. 點擊「登入」,確認 Modal 預設是登入表單。
2. 用 Step 3 註冊的 email/密碼登入。
3. 預期:Modal 關閉,Nav 顯示該使用者名稱。

- [ ] **Step 6: 驗證錯誤訊息顯示**

1. 登出後再次點「登入」。
2. 輸入錯誤密碼送出。
3. 預期:表單上方顯示紅色錯誤訊息(後端回傳的 `invalid email or password`),按鈕恢復可點擊狀態。

- [ ] **Step 7: 驗證重新整理後自動恢復登入狀態**

1. 登入成功後,重新整理頁面(F5)。
2. 預期:短暫的 loading 後,Nav 仍顯示已登入狀態(因為 `AuthContext` 在 mount 時會用 `refresh_token` cookie 自動換發新的 access token)。

- [ ] **Step 8: 確認沒有遺漏的變更**

```bash
git status
```

預期:working tree clean(所有變更都已在前面的任務中 commit)。
