# 평화로운 섬 성장 업데이트 · 2026-10-29

사용자의 마지막 검토 제안 10개와 기존 반영 대기를 이번 작업에 합쳤습니다.

## 반영
- 모바일 하단 아이콘·슬라이드 축소. 상세 창은 배경을 차단하지 않는 작은 동일 패널로 전환. 설명은 펼쳐 보기. 자원은 고정, 섬 정보와 목표는 접힘 기본값. 첫 시작에는 모닥불 목표 안내.
- 기본 낚시터를 신규·기존 저장에 제공. 초기 재료 없이 낚시, 업그레이드는 재료와 거점 단계 필요.
- 굴곡진 해안과 넓은 4개 확장 구역. 거점 2·4·6·8단계 해금, 미개방 지형은 흐리게 표시하고 이동·건설 차단. 다음 지역 요구 단계 안내와 새 지역·시설 통합 알림.
- 메인 거점은 성장과 지형, 주택은 입주 정원, 주민센터는 오프라인 시간·효율 담당.
- 전투 비활성화: 괴물 생성·피해·파손·발사 조작 없음. 상어는 배경 생물. 섬 발견 보상 수정 2·금화 15. 배는 금화 구매, 평화로운 정착·교류.
- 주민 생산 기본 20초/1개, 특기 15초/1개. 기본 작업 1자리 + 시설 단계별 2자리. 주민센터 1·2·3단계: 4·6·8시간 및 효율 0·10·20% 증가.
- 온라인·오프라인 동일 주민 생산 규칙. 귀환 시 자동 지급, 시간 상한·재정산 중복 방지. 설정에 실제 부재/인정 시간 표시. 브라우저 시간 기반이며 서버 검증은 추후.
- 기본 창고 120개 + 창고 단계당 180개. 가득 차면 주민 작업 중단. 직접 수집·구매·보상 초과분은 임시 보관, 설정에서 회수. 목재·석재·식량 우선순위 선택.
- 다음 목표에 필요한 재료를 남기는 일괄 판매, 희귀품 판매 확인. 선택 주민 부탁은 기본 진행에 필수 아님.
- 건물 이동 확정 전 원본 보존, 취소 유지. 실제 건물 모델 기반 이동 미리보기와 주요 건물의 신규 미리보기. 건물 출입 공간 충돌 검사. 선택 시설 철거 시 최초 건설 재료 50% 반환; 성장 필수·주민 주거·작업 배정 시설은 보호.
- 지상 경로 탐색, 주민 느린 이동과 재탐색, 안전 위치 복구. 건물·주민 찾기 및 카메라 복귀.
- 자연 자원은 장식·건물 주변을 피해 재생성. 장식용 심은 나무는 자동 생성 자원과 별개.
- 한 행동의 연속 터치 중복 방지, 이동·메뉴·화면 변경·앱 이탈 시 취소. 완료 보상과 진행 저장.
- 자동 저장 시각·실패 표시, 이전 저장 백업·복구. 기존 건물·주민 데이터 유지.
- 기본 30fps, 60fps 선택, 그림자 끄기, 화면 숨김 렌더 중단. 배경음악/효과음, 카메라 민감도·효과 줄이기 설정.
- 현재와 바로 다음 성장 단계의 건물만 메뉴 표시. 자주 쓰는 메뉴는 유지.

## 검증
`node verify.mjs`: 전체 성장, 기존 저장 변환, 낚시/채집 취소·보상, 건설·이동, 거래, 행사 중복 방지, 오프라인 상한·시계 역행·중복 정산, 창고·임시 보관, 지형 해금·경로 검증.
브라우저 844×390 및 390×844에서 하단 목록·꾸미기·건물 패널·초기 낚시 확인. 실제 아이폰 발열/장시간 배터리는 기기 플레이 확인 필요.

## 후속으로 남는 품질 작업
- 모든 신규 건물 미리보기의 세부 외형 완전 일치 (주요 시설·기존 이동 모델은 적용, 일부 특수 시설은 간소화).
- 실제 기기 장시간 밸런스·발열 측정, 지속 플레이에 따른 수치 조정.
- 계정·서버 시각 검증·친구 방문·Roblox 이전은 기존 결정대로 추후.

## v18 — Terrain and camera navigation

- `dist/navigation.js` owns original compact-support hills, a gridded grass surface, consistent actor heights, and a five-ray camera envelope. The main settlement stays level. No Marble Blast code or assets are incorporated.
- Open region terrain, visible resources, building roots and the notice board obstruct the camera. Locked regions, hidden descendants and translucent meshes do not. A blocked close view first seeks a higher angle; inward motion is immediate and outward recovery is damped. The interpolated camera path is swept again.
- Ground clicks raycast rendered land. Player, residents, animals, resources, nature, decor, markers and building foundations use the same height function. Sea movement continues to use its water plane.
- Existing progression/save schema is retained. Resource restoration now accepts unlocked expansion land rather than discarding every deposit outside the original radius.
- Automated verification covers terrain vertices, gradients, grounding drift, gathering on a hill, route endpoints, terrain ray hits, locked regions, camera wall/corner/hidden/translucent cases, foundation support and expanded deposit restoration. Browser QA uses a temporary copy and a separate save key, not the player's save.
