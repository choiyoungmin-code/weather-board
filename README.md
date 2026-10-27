# 현장 일정 날씨판

오늘 현장 일정과 지역별 날씨를 한 화면에서 보고, 날씨 때문에 주의 · 중지를 검토할 일정을 표시합니다. (교육용 가상 데이터)

## 여는 법
- 내 PC : 정적 파일 서버로 열기 (Supabase 연결은 `file://` 더블클릭에서 차단될 수 있음)
- 인터넷 : (배포 후 Vercel 주소를 여기에 적기)

## Supabase 설정
1. `setup.sql` 내용을 Supabase SQL Editor에 붙여 넣고 실행합니다. 표와 지역·구분 제약조건, 읽기·추가 권한이 만들어집니다.
2. `config.js`의 두 자리표시자를 프로젝트 URL과 공개용 publishable/anon 키로 바꿉니다. `service_role` 또는 secret 키는 사용하지 않습니다.
3. `index.html`을 정적 웹 호스트에서 열면 `wx_tasks`에서 일정을 읽고 추가합니다.

## 파일
| 파일 | 역할 |
|---|---|
| index.html | 화면 구조 |
| style.css | 디자인 |
| logic.js | 판단 규칙 |
| app.js | 화면 동작 |
| config.js | Supabase URL과 공개용 키 |
| setup.sql | Supabase 표·제약조건·정책 설정 |
| PRD.md | 무엇을 · 왜 만드는지 |
| CLAUDE.md | AI가 지킬 작업 규칙 |
| .gitignore | GitHub에 올리지 않을 파일 목록 |
