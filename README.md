# WIP EV 무선충전 전시용 키오스크

768 × 1024 세로형 터치 디스플레이를 위한 오프라인 전시 소프트웨어입니다. EV와 AMR 무선충전 과정을 감지 → 위치 정렬 → 안전 확인 → 실시간 충전 → 완료 순서로 체험할 수 있습니다.

## 바로 실행

- 설치 없이 미리보기: `run-browser.bat`
- Electron 키오스크: Node.js 설치 후 `npm install`, 이어서 `npm run kiosk`
- Windows 설치 파일/포터블 빌드: `npm run dist` (`dist/` 폴더에 생성)

인터넷은 최초 의존성 설치 때만 필요하며 앱 실행 중에는 필요하지 않습니다. 전시장 PC의 시작프로그램 폴더에 `run-kiosk.bat` 바로가기를 등록하면 로그인 후 자동 실행할 수 있습니다.

## 주요 기능

- 정상 충전 전 과정을 자동 시뮬레이션하는 DEMO MODE
- SOC, 전력, 효율, 온도, 시간, 전달 에너지 실시간 변화
- 정렬 실패, 이물질 감지, 통신 오류, 비상 정지 시나리오
- 한국어/영어 즉시 전환 및 설정 로컬 저장
- 기본 2분 미사용 시 홈 자동 복귀(관리자 설정에서 30~300초)
- 768 × 1024 우선 설계와 작은 화면 대응
- 외부 폰트, 이미지, 서버가 없는 완전 오프라인 UI

## 관리자 메뉴

화면 왼쪽 위 WIP 로고를 1.8초 안에 5회 터치합니다. 개발 중에는 `Ctrl + Shift + A`도 사용할 수 있습니다.

관리자 화면에서는 시나리오 실행, DEMO/LIVE 전환, 언어, 데모 속도, 시작/목표 SOC, 자동 복귀 시간을 설정할 수 있습니다. 설정은 브라우저의 `localStorage`에 보존됩니다.

## LIVE MODE 확장

현재 LIVE MODE는 장비 미연결 상태를 안전하게 표현하는 확장 준비 모드입니다. 실제 연동 시 [device/device-adapter.js](device/device-adapter.js)의 계약을 구현하고 다음 구조로 데이터를 공급합니다.

```text
CAN / RS-485 / Ethernet / Charger API
                  ↓
          Site Device Adapter
                  ↓
   normalized charging snapshot
                  ↓
             Kiosk UI
```

필수 표준 필드는 `battery_soc`, `charging_power_kw`, `efficiency_percent`, `pad_temperature_c`, `elapsed_time_sec`, `estimated_remaining_time_sec`, `alignment_left_right_percent`, `alignment_front_back_percent`, `pad_gap_mm`, `fod_status`, `communication_status`, `charger_status`입니다.

## 운영 권장 설정

- Windows 디스플레이 방향: 세로, 해상도 768 × 1024, 배율 100%
- 화면 보호기/절전/알림/자동 업데이트 팝업 비활성화
- 작업 표시줄 자동 숨김 및 키오스크 실행
- 운영 전 터치 보정, 오디오·밝기, 자동 로그인 확인
- 관리자 메뉴에서 정상/오류 시나리오를 각각 1회 리허설

## 파일 구성

- `index.html`, `styles.css`, `app.js`: 화면, 디자인, 상태 머신과 DEMO 엔진
- `electron-main.cjs`, `preload.cjs`: Windows 키오스크 셸과 안전한 브리지
- `device/device-adapter.js`: 실장비 연동 인터페이스
- `package.json`: Electron 및 electron-builder 설정
- `run-browser.bat`, `run-kiosk.bat`: 현장 실행 도우미

## 현장 안전 및 자동 실행

- 릴레이 출력은 기획서 기준으로 CHARGING 상태에서만 켜집니다. EV는 채널 2, AMR은 채널 4를 사용하며 나머지 상태는 모두 OFF입니다.
- 앱 시작, 정상 종료, 재시작, 렌더러 중단 및 처리되지 않은 오류 시 전체 OFF를 요청합니다.
- `install-autostart.bat`를 한 번 실행하면 현재 프로젝트의 키오스크 실행 파일이 Windows 사용자 시작프로그램에 등록됩니다. 해제는 `uninstall-autostart.bat`를 실행합니다.
- 코드 검증은 `npm run check`, 릴레이 상태 회귀 테스트는 `npm test`로 실행합니다.
- 소프트웨어의 OFF 처리는 PC가 명령을 보낼 수 있을 때만 유효합니다. 실제 제어박스는 NO 접점, 퓨즈, 전원 투입 시 OFF 및 통신 watchdog OFF를 하드웨어에서 별도로 보장해야 합니다.

실제 USB 릴레이 사용 전에는 구매한 장비의 공식 프로토콜과 VID/PID 또는 COM 포트를 확인하여 `MockRelayDriver`를 해당 장비 드라이버로 교체해야 합니다. 모델명이 같더라도 HID/가상 COM 펌웨어가 다를 수 있으므로 확인되지 않은 명령을 실제 부하에 전송하지 않습니다.

## USB Relay field integration

The kiosk now uses a relay hardware abstraction layer. The default mode is `mock`, so no hardware command is sent until the actual relay type and vendor protocol are confirmed.

Current architecture:

```text
UI state
  -> preload IPC
  -> electron-main.cjs
  -> RelayController
  -> Relay Driver Factory
  -> Mock / Serial skeleton / HID skeleton
```

Default channel map:

```text
EV charging  -> CH2 ON only
AMR charging -> CH4 ON only
All other phases -> ALL OFF
```

Field setup order:

```text
1. Before connecting the relay:
   npm run relay:detect

2. Connect the USB Relay.

3. Run again:
   npm run relay:detect

4. Identify the newly added device:
   - manufacturer
   - product name
   - VID
   - PID
   - COM Port
   - HID or Serial mode

5. Confirm the communication protocol from the product manual.

6. Fill the TODO(HARDWARE) hook in the matching driver:
   - device/relay-drivers/serial-relay-driver.cjs
   - device/relay-drivers/hid-relay-driver.cjs
   - device/relay-config.cjs or environment variables

7. Verify:
   npm run check
   npm test
   npm run relay:test -- status
   npm run relay:test -- all-off

8. Only after ALL OFF is verified, test EV and AMR charging channels.

9. Start kiosk:
   npm run kiosk
```

Useful commands:

```bash
npm run relay:detect
npm run relay:test -- status
npm run relay:test -- all-off
npm run relay:test -- ev-charge
npm run relay:test -- ev-off
npm run relay:test -- amr-charge
npm run relay:test -- amr-off
```

Configuration can be supplied with environment variables:

```text
WIP_RELAY_MODE=mock
WIP_RELAY_MODE=serial
WIP_RELAY_PORT=COM4
WIP_RELAY_BAUD=9600

WIP_RELAY_MODE=hid
WIP_RELAY_VENDOR_ID=1234
WIP_RELAY_PRODUCT_ID=5678
WIP_RELAY_USAGE_PAGE=
WIP_RELAY_USAGE=
WIP_RELAY_REPORT_ID=
```

Do not guess relay protocol bytes. Until the vendor protocol is implemented, serial and HID drivers fail with `TODO(HARDWARE)` and send no command.
