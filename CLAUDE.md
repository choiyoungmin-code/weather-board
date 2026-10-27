# CLAUDE.md – 현장 일정 날씨판 작업 규칙

## 프로젝트 개요
- 교육용 프로토타입이다. 무엇을 만들지는 PRD.md를 따른다.
- PRD.md에 없는 기능은 먼저 제안하고, 내가 승인한 뒤에만 구현한다.

## 기술 스택 (변경 금지)
- HTML + CSS + 순수 JavaScript만 사용한다. (React 등 프레임워크, 빌드 도구 사용 금지)
- 외부 스크립트는 Supabase JS CDN 하나만 사용한다. 앱 코드는 로컬 JavaScript 파일로 유지한다.
- Supabase 연결이 필요하므로 정적 웹 주소에서 사용한다. `file://` 로컬 열기는 연결 실패 안내를 보여 준다.

## 폴더 구조
- index.html : 화면 구조
- style.css  : 디자인
- logic.js   : 판단 규칙만 (화면을 다루는 코드 금지)
- app.js     : 화면 동작 (목록 그리기, 일정 추가)
- config.js  : Supabase URL · 공개용 키 두 줄만
- setup.sql  : Supabase 표·제약조건·권한을 만드는 SQL (Supabase SQL Editor에서 수동 실행)
- data/tasks.json : F-05 초기 데이터 예시 (앱의 기준 일정은 Supabase wx_tasks)
- PRD.md · CLAUDE.md · README.md : 문서

## 작업 방식
1. 코드를 고치기 전에 계획(수정할 파일과 이유)을 먼저 보여 주고 승인을 받는다.
2. 한 번에 한 가지만 고친다.
3. 끝나면 바꾼 파일, 내가 확인할 방법(T-번호), 남은 문제를 보고한다.

## 보안 · 데이터 규칙
- 가상 데이터만 사용한다. 실제 이름 · 연락처 · 기관 내부 자료를 넣지 않는다.
- 일정 읽기와 추가는 Supabase public.wx_tasks 를 기준으로 한다. 브라우저 저장소나 JSON 파일에 일정 데이터를 저장하지 않는다.
- config.js 에는 프로젝트 URL 과 공개용 publishable/anon 키만 둔다. service_role/secret 키는 절대 브라우저나 GitHub 에 넣지 않는다.
- Supabase 표에는 지역·구분 CHECK 제약조건과 RLS 읽기·추가 정책을 둔다. setup.sql 은 사용자가 Supabase SQL Editor 에서 실행한다.
- 사용자가 입력한 글자는 textContent 로 표시한다.
- 비밀 키는 코드 · 채팅 · GitHub 에 넣지 않는다.
