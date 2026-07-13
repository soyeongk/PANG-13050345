# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 기술 스택

- **React 19** + **TypeScript** (`~6.0.2`)
- **Vite 8** (빌드 도구, `@vitejs/plugin-react` 사용)
- **Oxlint** (린터, ESLint 대신 사용)
- 패키지 매니저: npm (`package-lock.json` 존재)

## 개발 명령어

```bash
npm run dev       # 개발 서버 실행 (Vite, HMR 지원)
npm run build     # 타입 체크(tsc -b) 후 프로덕션 빌드
npm run preview   # 빌드 결과물 로컬 미리보기
npm run lint      # Oxlint로 린트 검사
```

단일 파일 타입 체크만 하려면:

```bash
npx tsc --noEmit
```

## 테스트

현재 이 저장소에는 테스트 프레임워크(Vitest, Jest 등)가 구성되어 있지 않고, `package.json`에도 test 스크립트가 없습니다. 테스트를 추가하려면 먼저 테스트 러너를 설치하고 `package.json`에 `test` 스크립트를 정의해야 합니다.

## 아키텍처

- `src/main.tsx`: 앱 진입점. `ReactDOM.createRoot`로 `<App />`을 `#root`에 마운트.
- `src/App.tsx`: 최상위 컴포넌트. 현재 단순 "Hello World" 페이지만 렌더링.
- `src/App.css`, `src/index.css`: 컴포넌트별/전역 스타일시트.
- `src/assets/`: 정적 이미지 리소스 (React/Vite 로고 등, 템플릿 기본 제공).
- TypeScript 설정은 `tsconfig.json`(참조용 루트) → `tsconfig.app.json`(앱 소스용), `tsconfig.node.json`(Vite 설정 파일용)으로 분리되어 있음.
- 타입 인지(type-aware) 린트 규칙을 확장하려면 `oxlint-tsgolint`를 설치하고 `.oxlintrc.json`을 수정해야 함 (README.md 참고).
