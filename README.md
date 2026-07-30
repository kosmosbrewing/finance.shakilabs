# 급여·연봉 계산기 · shakilabs

**▶ 라이브 서비스: <https://shakilabs.com/finance>**

연봉 실수령액부터 건보료 역산, 퇴직금, 실업급여, 근로장려금까지 — 2026년 세율·요율을 반영한 급여 계산기 26종.

## 주요 도구

- [연봉 실수령액](https://shakilabs.com/finance/salary)
- [건강보험료로 연봉 역산](https://shakilabs.com/finance/insurance)
- [퇴직금](https://shakilabs.com/finance/severance-pay)
- [실업급여](https://shakilabs.com/finance/unemployment)
- [종합소득세](https://shakilabs.com/finance/comprehensive-tax)
- [근로장려금(EITC)](https://shakilabs.com/finance/eitc)
- [전체 계산기 26종](https://shakilabs.com/finance/all)

전체 서비스 12종: <https://shakilabs.com>

## 스택

Vue 3 (Composition API) · TypeScript · Vite · Tailwind CSS · 공유 UI `@shakilabs/ui`
정적 프리렌더/SSG로 배포하며, 계산 로직은 Vitest 경계값 테스트로 검증합니다.

## 개발

```bash
cd client
npm install
npm run dev
```
