# 2026 연봉 계산 근거 및 검증 절차

Last verified: 2026-02-23 (KST)

## 공식 출처

- 국민연금 보험료율/기준소득월액  
  - https://www.nps.or.kr/jsppage/info/easy/pension_03_07.jsp
  - 반영값: 근로자 4.75%, 기준소득월액 하한 400,000원 / 상한 6,370,000원 (2025.07~2026.06)

- 건강보험료율  
  - https://www.nhis.or.kr/english/wbheaa02500m01.do
  - 반영값: 직장가입자 총 7.19%, 근로자 부담 3.595%

- 노인장기요양보험료율(건강보험료 대비)
  - https://www.mohw.go.kr/board.es?act=view&bid=0027&list_no=1487817
  - 반영값: 13.14%

- 고용보험 근로자 부담률
  - https://www.moel.go.kr/info/astmgmt/employ/employList.do
  - 반영값: 0.9%

- 소득세법(세율/세액공제/자녀세액공제)
  - https://www.law.go.kr/LSW/lsInfoP.do?lsiSeq=276127
  - 반영값: 8단계 세율, 근로소득세액공제 한도, 자녀세액공제

## 코드 매핑

- 상수 파일: `src/lib/tax-constants.ts`
- 계산 로직: `src/composables/useSalaryCalc.ts`

## 검증 체크리스트

1. 세율/공제/보험료 상수 변경 시 공식 출처 URL과 시행일 확인
2. 상수 변경 후 `npm run typecheck && npm run build` 실행
3. 샘플 케이스(3,000/5,000/8,000/10,000만원, 부양가족 1~4명, 비과세 0/20만원) 비교 검증
4. 운영 배포 전 변경 이력(값, 근거 URL, 시행일) 기록

## 주의

- 본 계산기는 참고용 추정치다.
- 회사별 원천징수 방식/수당 구조/비과세 항목 적용 차이로 실수령액은 달라질 수 있다.
