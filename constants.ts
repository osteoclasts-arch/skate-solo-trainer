

import { Difficulty, Stance, Trick, TrickCategory, TrickTip } from "./types";

export const SKATE_LETTERS = ['S', 'K', 'A', 'T', 'E'];

export const TRANSLATIONS = {
  EN: {
    NEW_SESSION: "New Session",
    CUSTOMIZED_TRAINING: "Customized Training",
    TOTAL_LANDED: "Total Landed",
    AVG_SUCCESS: "Avg Success",
    PROGRESSION: "Progression (Last 10)",
    SETUP_SESSION: "Setup Session",
    SESSION_LENGTH: "Session Length",
    DIFFICULTY: "Difficulty",
    AI_COACH_MODE: "AI Coach Mode",
    CATEGORIES: "Categories",
    STANCES: "Stances",
    STANCE_MIX: "Stance Mix Settings",
    START_SKATING: "Start Skating",
    GENERATING: "Generating Session...",
    TRICK_COUNTER: "Trick",
    ABORT: "Abort",
    GET_TIP: "Get a Tip",
    ASKING_COACH: "Asking Coach...",
    PRO_TIP: "Pro Tip",
    FAILED: "Failed",
    LANDED: "Landed",
    SESSION_COMPLETE: "Session Complete",
    COMPLETED: "Completed",
    CLEAN_SHEET: "Clean Sheet",
    AI_FEEDBACK: "AI Coach Feedback",
    DETAILS: "Details",
    DASHBOARD: "Dashboard",
    ANALYTICS: "Analytics",
    SUCCESS: "Success",
    SOURCE: "Source",
    VIDEO: "Video",
    // Analytics
    TOTAL_SESSIONS: "Total Sessions",
    BEST_STREAK: "Best Streak",
    WEAKNESS_ANALYSIS: "Weakness Analysis",
    RECOMMENDED_PRACTICE: "Recommended Practice",
    STATS: "Stats",
    PRACTICE_MORE: "Practice more!",
    COMPREHENSIVE_DIAGNOSIS: "Comprehensive Diagnosis",
    SESSION_SUMMARY: "Session Analysis Summary",
    KEY_WEAKNESSES: "Key Weaknesses",
    IMPROVEMENT_DIRECTIONS: "Improvement Suggestions",
    AI_COACH_FEEDBACK_TITLE: "AI Coach Feedback",
    GENERATE_INSIGHT: "Generate AI Diagnosis",
    GENERATING_INSIGHT: "Analyzing Data...",
    SHARE_STORY: "Share to Instagram",
    SHARING: "Capturing...",
    // Values
    "Beginner": "Beginner",
    "Amateur 1": "Amateur Lv.1",
    "Amateur 2": "Amateur Lv.2",
    "Amateur 3": "Amateur Lv.3",
    "Pro": "Pro",
    Flatground: "Flatground",
    Grind: "Grind",
    Transition: "Transition",
    Regular: "Regular",
    Goofy: "Goofy",
    Fakie: "Fakie",
    Switch: "Switch",
    Nollie: "Nollie",
    AI_PLACEHOLDER: "e.g. 'Backside pop tricks' or 'Focus on heelflips'",
    CONFIRM_ABORT: "End current session? Progress will be lost.",
    // Learning
    LEARNING: "Trick Guide",
    PRACTICE_THIS: "Practice Trick",
    HOW_TO: "How To",
    ANALYZING: "Analyzing session data...",
    DESCRIPTION: "Description",
    VIDEO_TUTORIAL: "Video Tutorial",
    // Profile & Experience
    DAYS_SKATING: "Days Skating",
    START_DATE: "Start Date",
    SET_START_DATE: "Set Start Date",
    SAVE: "Save",
    CANCEL: "Cancel",
    DAY: "Day",
    EXPERIENCE_LEVEL: "Experience Level",
    LEVEL_BEGINNER: "Beginner",
    LEVEL_INTERMEDIATE: "Amateur",
    LEVEL_ADVANCED: "Pro",
    LEVEL_REQ_PRO: "Approval Required",
    REQUEST_PRO: "Request Pro Verification",
    REQUEST_PENDING: "Under Review",
    // Level System Details
    LEVEL_INFO_TITLE: "Level System",
    LEVEL_BEGINNER_RANGE: "0 - 60 Days",
    LEVEL_BEGINNER_DESC: "You are in the beginner stage. Focus on basics and having fun.",
    LEVEL_AMATEUR_RANGE: "61+ Days",
    LEVEL_AMATEUR_DESC: "Amateur stage where you build consistency and try new tricks.",
    LEVEL_PRO_RANGE: "Pro Approval Required",
    LEVEL_PRO_DESC: "The pro stage for mastering your style and advanced tricks. Approval required.",
    PRO_BTN_TEXT: "Request Pro Verification",
    // Ranking
    GLOBAL_RANKING: "Global Ranking",
    YOUR_TIER: "Your Tier",
    TOP_PERCENT: "Top",
    TIER_1: "Street Rat",
    TIER_2: "Local Hero",
    TIER_3: "Sponsored Am",
    TIER_4: "G.O.A.T",
    RANKING_DESC: "Based on Hard/Pro tricks landed",
    // Auth
    LOGIN_GUEST: "Create Profile",
    LOGOUT: "Reset Profile",
    GUEST: "Guest",
    PROFILE_SETUP: "Profile Setup",
    NICKNAME: "Nickname",
    AGE: "Age",
    ENTER_NICKNAME: "Enter nickname",
    // Tips
    TIP_VARIATION_STANDARD: "Standard",
    TIP_VARIATION_FAKIE: "Fakie Variation",
    TIP_VARIATION_NOLLIE: "Nollie Variation",
    TIP_VARIATION_SWITCH: "Switch Variation",
    // Game
    LAST_CHANCE: "Last Try! (Rebate)",
    // AI Vision
    AI_VISION_TITLE: "AI Vision",
    AI_VISION_DESC: "Upload a photo or video to analyze your trick.",
    UPLOAD_MEDIA: "Upload Media",
    ANALYZE_TRICK: "Analyze Trick",
    ANALYZING_MEDIA: "Tracking Skater & Board...",
    ANALYZING_WITH_GEMINI: "Analyzing with Gemini 3 Pro...",
    TRICK_DETECTED: "Trick Detected",
    FORM_SCORE: "Form Score",
    HEIGHT_EST: "Est. Height",
    POSTURE_ANALYSIS: "Posture Analysis",
    LANDING_ANALYSIS: "Landing Analysis",
    IMPROVEMENT_TIP: "Coach Tip",
    FILE_TOO_LARGE: "File is too large. Please use video under 20MB.",
    ENTER_TRICK_NAME: "Trick Name (Optional)",
    TRICK_NAME_DESC: "Providing the trick name helps accuracy. If left blank, AI may guess incorrectly.",
    WRONG_ANALYSIS: "Report Issue",
    PROVIDE_FEEDBACK: "Help us improve. What was wrong?",
    ACTUAL_TRICK_NAME: "Actual Trick Name",
    ACTUAL_HEIGHT: "Actual Height (e.g. 50cm)",
    SEND_FEEDBACK: "Send Feedback",
    FEEDBACK_THANKS: "피드백 감사합니다! 학습에 반영하겠습니다.",
    SELECT_YOUR_STANCE: "Select Your Stance",
    SELECT_STANCE_DESC: "Essential for detecting Fakie, Nollie, and Switch.",
    TRACKING_BOARD: "Tracking Board Physics...",
    TRACKING_OBSTACLE: "Obstacle Detected:",
    UPLOAD_GUIDE: "Upload Guide",
    GUIDE_1: "Use a Tripod (Static Camera)",
    GUIDE_2: "Film from Side View",
    GUIDE_3: "Keep Whole Body in Frame",
    TRIM_RANGE: "Trim Range",
    SET_START: "Set Start",
    SET_END: "Set End",
    RESET_TRIM: "Reset",
    CLIP_DURATION: "Clip Duration",
    PHYSICS_ANALYSIS: "Physics Analysis",
    AXIS_ROLL: "Roll (Flip)",
    AXIS_YAW: "Yaw (Spin)",
    AXIS_MIXED: "Mixed Axis",
    AXIS_NONE: "No Rotation",
    FRAMING_GUIDE_TITLE: "How to Film for Best Results",
    FRAMING_TIP_1: "Use a tripod or static camera angle.",
    FRAMING_TIP_2: "Keep skater's whole body and board in frame.",
    FRAMING_TIP_3: "Side view is best for trick recognition.",
    // Quests
    DAILY_QUESTS: "Daily Quests",
    LEVEL: "Lv.",
    XP: "XP",
    CLAIM: "Claim",
    QUEST_LOGIN: "Daily Check-in",
    QUEST_SESSION: "Complete Session",
    QUEST_PRACTICE: "Practice in Guide",
    QUEST_LAND_TRICKS: "Land Tricks",
    QUEST_PERFECT: "Clean Sheet (No S.K.A.T.E)",
    LEVEL_UP: "LEVEL UP!",
    LEVEL_UP_DESC: "You are getting stronger.",
    QUEST_REFRESH: "Resets at midnight",
    // Line Generator
    LINE_GEN_TITLE: "Line Generator",
    LINE_GEN_DESC: "AI creates a flowy line based on tricks you can do.",
    SELECT_OBSTACLES: "Select Obstacles",
    MY_TRICKS: "My Tricks",
    GENERATE_LINE: "Generate Line",
    LINE_RESULT: "Recommended Line",
    OBSTACLE_FLAT: "Flatground",
    OBSTACLE_LEDGE: "Ledge",
    OBSTACLE_RAIL: "Rail",
    OBSTACLE_GAP: "Gap/Stairs",
    OBSTACLE_MANUAL: "Manual Pad",
    LINE_STYLE_TECH: "Tech",
    LINE_STYLE_FLOW: "Flow",
    LINE_STYLE_GNAR: "Gnar",
    LINE_STYLE_CHILL: "Chill",
    GENERATING_LINE: "Designing line..."
  },
  KR: {
    NEW_SESSION: "새로운 세션",
    CUSTOMIZED_TRAINING: "맞춤형 훈련 설정",
    TOTAL_LANDED: "성공 횟수",
    AVG_SUCCESS: "평균 성공률",
    PROGRESSION: "성장 그래프 (최근 10회)",
    SETUP_SESSION: "세션 설정",
    SESSION_LENGTH: "트릭 개수",
    DIFFICULTY: "난이도",
    AI_COACH_MODE: "AI 코치 모드",
    CATEGORIES: "카테고리",
    STANCES: "스탠스",
    STANCE_MIX: "스탠스 믹스",
    START_SKATING: "세션 시작",
    GENERATING: "루틴 짜는 중...",
    TRICK_COUNTER: "트릭",
    ABORT: "그만하기",
    GET_TIP: "팁 보기",
    ASKING_COACH: "코치에게 물어보는 중...",
    PRO_TIP: "프로 팁",
    FAILED: "실패",
    LANDED: "성공",
    SESSION_COMPLETE: "세션 종료",
    COMPLETED: "완료",
    CLEAN_SHEET: "퍼펙트 게임",
    AI_FEEDBACK: "AI 코치 피드백",
    DETAILS: "상세 기록",
    DASHBOARD: "홈",
    ANALYTICS: "분석실",
    SUCCESS: "성공",
    SOURCE: "출처",
    VIDEO: "영상",
    // Analytics
    TOTAL_SESSIONS: "총 세션 횟수",
    BEST_STREAK: "최고 연승",
    WEAKNESS_ANALYSIS: "집중 공략 포인트",
    RECOMMENDED_PRACTICE: "추천 연습 메뉴",
    STATS: "통계",
    PRACTICE_MORE: "연습이 더 필요해요!",
    COMPREHENSIVE_DIAGNOSIS: "종합 진단 리포트",
    SESSION_SUMMARY: "세션 요약",
    KEY_WEAKNESSES: "주요 약점",
    IMPROVEMENT_DIRECTIONS: "솔루션",
    AI_COACH_FEEDBACK_TITLE: "AI 코치 피드백",
    GENERATE_INSIGHT: "AI 진단 받기",
    GENERATING_INSIGHT: "데이터 분석 중...",
    SHARE_STORY: "인스타 스토리 공유",
    SHARING: "캡처 중...",
    // Values
    "Beginner": "비기너",
    "Amateur 1": "아마추어 Lv.1",
    "Amateur 2": "아마추어 Lv.2",
    "Amateur 3": "아마추어 Lv.3",
    "Pro": "프로",
    Flatground: "플랫",
    Grind: "그라인드",
    Transition: "트랜지션",
    Regular: "레귤러",
    Goofy: "구피",
    Fakie: "페이키",
    Switch: "스위치",
    Nollie: "널리",
    AI_PLACEHOLDER: "예: '팝을 뒷방향으로 차는 연습' 또는 '알리 높이 높이기'",
    CONFIRM_ABORT: "세션을 종료하시겠어요? 기록이 저장되지 않습니다.",
    // Learning
    LEARNING: "트릭 가이드",
    PRACTICE_THIS: "트릭 연습하기",
    HOW_TO: "배우는 법",
    ANALYZING: "데이터 분석 중...",
    DESCRIPTION: "기술 설명",
    VIDEO_TUTORIAL: "영상 강의",
    // Profile & Experience
    DAYS_SKATING: "스케이트 라이프",
    START_DATE: "시작일",
    SET_START_DATE: "시작일 설정",
    SAVE: "완료",
    CANCEL: "취소",
    DAY: "일차",
    EXPERIENCE_LEVEL: "레벨",
    LEVEL_BEGINNER: "비기너",
    LEVEL_INTERMEDIATE: "아마추어",
    LEVEL_ADVANCED: "프로",
    LEVEL_REQ_PRO: "프로 승인 필요",
    REQUEST_PRO: "프로 승인 신청",
    REQUEST_PENDING: "심사 중",
    // Level System Details
    LEVEL_INFO_TITLE: "레벨",
    LEVEL_BEGINNER_RANGE: "0 - 60 Days",
    LEVEL_BEGINNER_DESC: "스케이트보드에 입문한 비기너 단계입니다. 기본기와 흥미 위주의 훈련을 추천합니다.",
    LEVEL_AMATEUR_RANGE: "61+ Days",
    LEVEL_AMATEUR_DESC: "기술의 일관성을 높이고 새로운 트릭에 도전하는 아마추어 단계입니다.",
    LEVEL_PRO_RANGE: "프로 승인 필요",
    LEVEL_PRO_DESC: "자신만의 스타일을 완성하고 고난도 기술을 연마하는 프로 단계입니다. 이 단계로 승급하려면 별도의 승인이 필요합니다.",
    PRO_BTN_TEXT: "프로 승인 신청",
    // Ranking
    GLOBAL_RANKING: "글로벌 랭킹",
    YOUR_TIER: "현재 티어",
    TOP_PERCENT: "상위",
    TIER_1: "스트릿 랫",
    TIER_2: "로컬 히어로",
    TIER_3: "스폰서드",
    TIER_4: "G.O.A.T",
    RANKING_DESC: "상급/프로 기술 성공 횟수 기준",
    // Auth
    LOGIN_GUEST: "프로필 생성",
    LOGOUT: "프로필 초기화",
    GUEST: "게스트",
    PROFILE_SETUP: "프로필 설정",
    NICKNAME: "닉네임",
    AGE: "나이",
    ENTER_NICKNAME: "닉네임 입력",
    // Tips
    TIP_VARIATION_STANDARD: "기본",
    TIP_VARIATION_FAKIE: "페이키",
    TIP_VARIATION_NOLLIE: "널리",
    TIP_VARIATION_SWITCH: "스위치",
    // Game
    LAST_CHANCE: "마지막 기회! (리베이트)",
    // AI Vision
    AI_VISION_TITLE: "AI 비전",
    AI_VISION_DESC: "영상이나 사진을 올리면 AI가 자세를 분석해드립니다.",
    UPLOAD_MEDIA: "미디어 업로드",
    ANALYZE_TRICK: "트릭 분석하기",
    ANALYZING_MEDIA: "스케이터와 보드를 추적 중...",
    ANALYZING_WITH_GEMINI: "Gemini 3 Pro가 정밀 분석 중...",
    TRICK_DETECTED: "감지된 트릭",
    FORM_SCORE: "자세 점수",
    HEIGHT_EST: "예상 높이",
    POSTURE_ANALYSIS: "자세 분석",
    LANDING_ANALYSIS: "랜딩 분석",
    IMPROVEMENT_TIP: "코치 팁",
    FILE_TOO_LARGE: "파일이 너무 큽니다. 20MB 이하의 영상을 사용해주세요.",
    ENTER_TRICK_NAME: "기술 이름 (선택사항)",
    TRICK_NAME_DESC: "기술 이름을 적어주시면 더 정확하게 분석됩니다. 비워두면 AI가 잘못 인식할 수 있습니다.",
    WRONG_ANALYSIS: "결과가 다른가요?",
    PROVIDE_FEEDBACK: "AI 학습을 위해 정확한 정보를 알려주세요.",
    ACTUAL_TRICK_NAME: "실제 기술 이름",
    ACTUAL_HEIGHT: "실제 높이 (예: 50cm)",
    SEND_FEEDBACK: "피드백 보내기",
    FEEDBACK_THANKS: "피드백 감사합니다! 학습에 반영하겠습니다.",
    SELECT_YOUR_STANCE: "내 스탠스 선택",
    SELECT_STANCE_DESC: "페이키, 널리, 스위치를 구분하기 위해 꼭 필요합니다.",
    TRACKING_BOARD: "보드 물리엔진 분석 중...",
    TRACKING_OBSTACLE: "장애물 감지:",
    UPLOAD_GUIDE: "촬영 가이드",
    GUIDE_1: "삼각대 고정 (흔들림 X)",
    GUIDE_2: "측면 촬영 (Side View)",
    GUIDE_3: "전신과 보드가 나오게",
    TRIM_RANGE: "구간 편집",
    SET_START: "시작점",
    SET_END: "종료점",
    RESET_TRIM: "초기화",
    CLIP_DURATION: "선택된 길이",
    PHYSICS_ANALYSIS: "물리 엔진 분석",
    AXIS_ROLL: "플립 축 (Roll)",
    AXIS_YAW: "회전 축 (Yaw)",
    AXIS_MIXED: "복합 축 (Mixed)",
    AXIS_NONE: "축 없음",
    FRAMING_GUIDE_TITLE: "정확한 분석을 위한 촬영 가이드",
    FRAMING_TIP_1: "카메라는 삼각대로 고정해주세요.",
    FRAMING_TIP_2: "스케이터의 전신과 보드가 모두 나와야 합니다.",
    FRAMING_TIP_3: "측면(Side view)에서 촬영하면 가장 정확합니다.",
    // Quests
    DAILY_QUESTS: "일일 퀘스트",
    LEVEL: "Lv.",
    XP: "XP",
    CLAIM: "보상 받기",
    QUEST_LOGIN: "매일 출석체크",
    QUEST_SESSION: "세션 1회 완료하기",
    QUEST_PRACTICE: "트릭 가이드에서 연습하기",
    QUEST_LAND_TRICKS: "기술 성공하기",
    QUEST_PERFECT: "퍼펙트 게임 (노 SKATE)",
    LEVEL_UP: "레벨 업!",
    LEVEL_UP_DESC: "점점 강해지고 있습니다.",
    QUEST_REFRESH: "매일 자정에 초기화",
    // Line Generator
    LINE_GEN_TITLE: "라인 제너레이터",
    LINE_GEN_DESC: "할 수 있는 기술을 바탕으로 멋진 라인을 짜드립니다.",
    SELECT_OBSTACLES: "기물 선택",
    MY_TRICKS: "내 기술 목록",
    GENERATE_LINE: "라인 생성하기",
    LINE_RESULT: "추천 라인",
    OBSTACLE_FLAT: "플랫",
    OBSTACLE_LEDGE: "렛지",
    OBSTACLE_RAIL: "레일",
    OBSTACLE_GAP: "계단/갭",
    OBSTACLE_MANUAL: "매뉴얼 패드",
    LINE_STYLE_TECH: "테크니컬",
    LINE_STYLE_FLOW: "플로우",
    LINE_STYLE_GNAR: "하드코어",
    LINE_STYLE_CHILL: "칠(Chill)",
    GENERATING_LINE: "라인 구상 중..."
  }
};

export const BASE_TRICKS: Trick[] = [
  // Beginner (Basic) - Was Easy
  { id: 'ollie', name: 'Ollie', category: TrickCategory.FLATGROUND, difficulty: Difficulty.BEGINNER, videoUrl: 'https://www.youtube.com/watch?v=arQV9_seXl0', description: { EN: "The foundation of street skating. Pop the tail and slide your front foot up.", KR: "스케이트보딩의 가장 기본이 되는 기술입니다. 테일을 팝하고 앞발을 끌어올려 점프합니다." } },
  { id: 'shuvit', name: 'Shuvit', category: TrickCategory.FLATGROUND, difficulty: Difficulty.BEGINNER, videoUrl: 'https://www.youtube.com/watch?v=4270O2pD9Rg', description: { EN: "Spin the board 180 degrees without popping.", KR: "팝 없이 보드만 180도 회전시키는 기술입니다." } },
  { id: 'fs-180', name: 'Frontside 180', category: TrickCategory.FLATGROUND, difficulty: Difficulty.BEGINNER, videoUrl: 'https://www.youtube.com/watch?v=_4O9Lh5x80s', description: { EN: "Rotate your body and board 180 degrees facing forward.", KR: "몸과 보드를 앞쪽 방향으로 180도 회전합니다." } },
  { id: 'bs-180', name: 'Backside 180', category: TrickCategory.FLATGROUND, difficulty: Difficulty.BEGINNER, videoUrl: 'https://www.youtube.com/watch?v=HchYqOXy8JI', description: { EN: "Rotate your body and board 180 degrees with your back leading.", KR: "등을 진행 방향으로 돌리며 180도 회전합니다." } },
  { id: 'fakie-ollie', name: 'Fakie Ollie', category: TrickCategory.FLATGROUND, difficulty: Difficulty.BEGINNER, videoUrl: 'https://www.youtube.com/watch?v=l4qJv5h8Wvw', description: { EN: "An ollie while rolling backwards.", KR: "뒤로 가는 상태(페이키)에서 하는 알리입니다." } },
  { id: 'nollie', name: 'Nollie', category: TrickCategory.FLATGROUND, difficulty: Difficulty.BEGINNER, videoUrl: 'https://www.youtube.com/watch?v=kYv95J6wQ0I', description: { EN: "Popping with the nose while rolling forward.", KR: "주행 중 노즈를 팝하여 점프하는 기술입니다." } },
  { id: 'pop-shuvit', name: 'Pop Shuvit', category: TrickCategory.FLATGROUND, difficulty: Difficulty.BEGINNER, videoUrl: 'https://www.youtube.com/watch?v=vA1EPid4aiw', description: { EN: "Spin the board 180 degrees with a pop.", KR: "테일을 팝하면서 보드를 180도 회전시킵니다." } },
  { id: 'fs-pop-shuvit', name: 'Frontside Pop Shuvit', category: TrickCategory.FLATGROUND, difficulty: Difficulty.BEGINNER, videoUrl: 'https://www.youtube.com/watch?v=nEcssJ5_xK4', description: { EN: "Spin the board 180 degrees frontside with a pop.", KR: "보드를 등 뒤쪽으로 180도 회전시킵니다." } },
  { id: 'fakie-shuvit', name: 'Fakie Shuvit', category: TrickCategory.FLATGROUND, difficulty: Difficulty.BEGINNER, videoUrl: 'https://www.youtube.com/watch?v=GkC5Rmv5_6o', description: { EN: "Shuvit while riding backwards.", KR: "페이키 상태에서 하는 셔빗입니다." } },
  { id: 'manual', name: 'Manual', category: TrickCategory.FLATGROUND, difficulty: Difficulty.BEGINNER, videoUrl: 'https://www.youtube.com/watch?v=A_2t5_n7yJc', description: { EN: "Balancing on the back wheels.", KR: "뒷바퀴로만 중심을 잡고 주행하는 기술입니다." } },
  { id: 'nose-manual', name: 'Nose Manual', category: TrickCategory.FLATGROUND, difficulty: Difficulty.BEGINNER, videoUrl: 'https://www.youtube.com/watch?v=1dJjPjjW5QA', description: { EN: "Balancing on the front wheels.", KR: "앞바퀴로만 중심을 잡고 주행합니다." } },
  { id: 'boneless', name: 'Boneless', category: TrickCategory.FLATGROUND, difficulty: Difficulty.BEGINNER, videoUrl: 'https://www.youtube.com/watch?v=M5FzOq_XJc8', description: { EN: "Plant your front foot and grab the board.", KR: "앞발을 땅에 짚고 보드를 손으로 잡고 점프합니다." } },
  { id: 'no-comply', name: 'No Comply 180', category: TrickCategory.FLATGROUND, difficulty: Difficulty.BEGINNER, videoUrl: 'https://www.youtube.com/watch?v=yY1X_tgJ8c8', description: { EN: "Plant front foot, pop the board 180.", KR: "앞발을 땅에 짚고 뒷발로 보드를 팝하여 180도 돌립니다." } },
  { id: 'boardslide', name: 'Boardslide', category: TrickCategory.GRIND, difficulty: Difficulty.BEGINNER, videoUrl: 'https://www.youtube.com/watch?v=7M0fS9iOq_o', description: { EN: "Slide the middle of your board on a rail or ledge.", KR: "레일이나 렛지 위를 보드 중간으로 미끄러집니다." } },

  // Amateur 1 (Intermediate) - Was Medium
  { 
    id: 'kickflip', 
    name: 'Kickflip', 
    category: TrickCategory.FLATGROUND, 
    difficulty: Difficulty.AMATEUR_1, 
    videoUrl: 'https://www.youtube.com/watch?v=rCJoTnMP16M', 
    description: { EN: "Flip the board with your toe.", KR: "알리를 하며 앞발가락으로 보드를 차서 회전시킵니다." },
    stanceDocs: { 
        [Stance.FAKIE]: { 
            videoUrl: 'https://www.youtube.com/watch?v=Jj3_3D0CgZQ', 
            description: { EN: "Fakie Kickflip: Pop a kickflip while riding backwards.", KR: "페이키 킥플립: 뒤로 가면서 하는 킥플립입니다. 무게중심을 중앙에 유지하세요." } 
        } 
    }
  },
  { id: 'heelflip', name: 'Heelflip', category: TrickCategory.FLATGROUND, difficulty: Difficulty.AMATEUR_1, videoUrl: 'https://www.youtube.com/watch?v=339k4XEvbxY', description: { EN: "Flip the board with your heel.", KR: "앞발 뒤꿈치로 보드를 차서 반대 방향으로 회전시킵니다." } },
  { id: 'varial-kickflip', name: 'Varial Kickflip', category: TrickCategory.FLATGROUND, difficulty: Difficulty.AMATEUR_1, videoUrl: 'https://www.youtube.com/watch?v=MfIkBXXZrEY', description: { EN: "Pop shuvit mixed with a kickflip.", KR: "팝샤빗과 킥플립을 동시에 하는 기술입니다." } },
  { id: 'varial-heelflip', name: 'Varial Heelflip', category: TrickCategory.FLATGROUND, difficulty: Difficulty.AMATEUR_1, videoUrl: 'https://www.youtube.com/watch?v=iX61qqQvQkM', description: { EN: "Frontside shuvit mixed with a heelflip.", KR: "프론트사이드 셔빗과 힐플립을 섞은 기술입니다." } },
  { id: 'half-cab', name: 'Half Cab', category: TrickCategory.FLATGROUND, difficulty: Difficulty.AMATEUR_1, videoUrl: 'https://www.youtube.com/watch?v=II6v_5c4i9g', description: { EN: "Fakie backside 180.", KR: "페이키 상태에서 백사이드로 180도 회전합니다." } },
  { id: 'fakie-bigspin', name: 'Fakie Bigspin', category: TrickCategory.FLATGROUND, difficulty: Difficulty.AMATEUR_1, videoUrl: 'https://www.youtube.com/watch?v=KjYk4tK5L8c', description: { EN: "Fakie 360 shuvit with a 180 body varial.", KR: "페이키 상태에서 보드는 360도, 몸은 180도 회전합니다." } },
  { id: 'nollie-pop-shuvit', name: 'Nollie Pop Shuvit', category: TrickCategory.FLATGROUND, difficulty: Difficulty.AMATEUR_1, videoUrl: 'https://www.youtube.com/watch?v=0w5_v0g5_0k', description: { EN: "Pop shuvit from the nose.", KR: "노즈를 팝하여 하는 팝샤빗입니다." } },
  { id: 'fs-kickflip', name: 'Frontside Flip', category: TrickCategory.FLATGROUND, difficulty: Difficulty.AMATEUR_1, videoUrl: 'https://www.youtube.com/watch?v=uK4WJ7P6t5E', description: { EN: "Kickflip while doing a frontside 180.", KR: "프론트사이드 180과 킥플립을 동시에 합니다." } },
  { id: 'bs-kickflip', name: 'Backside Flip', category: TrickCategory.FLATGROUND, difficulty: Difficulty.AMATEUR_1, videoUrl: 'https://www.youtube.com/watch?v=D-4z2t2f_kE', description: { EN: "Kickflip while doing a backside 180.", KR: "백사이드 180과 킥플립을 동시에 합니다." } },
  { id: 'fs-heelflip', name: 'Frontside Heelflip', category: TrickCategory.FLATGROUND, difficulty: Difficulty.AMATEUR_1, videoUrl: 'https://www.youtube.com/watch?v=2zW_6y3y_yE', description: { EN: "Heelflip while doing a frontside 180.", KR: "프론트사이드 180과 힐플립을 동시에 합니다." }, 
    stanceDocs: { 
        [Stance.FAKIE]: { videoUrl: 'https://www.youtube.com/watch?v=mYcViRQRoH4', description: { EN: "Fakie Frontside Heelflip", KR: "페이키 프론트사이드 힐플립 튜토리얼입니다." } }
    } 
  },
  { id: 'bs-heelflip', name: 'Backside Heelflip', category: TrickCategory.FLATGROUND, difficulty: Difficulty.AMATEUR_1, description: { EN: "Heelflip while doing a backside 180.", KR: "백사이드 180과 힐플립을 동시에 합니다." } },
  { id: '50-50', name: '50-50 Grind', category: TrickCategory.GRIND, difficulty: Difficulty.AMATEUR_1, videoUrl: 'https://www.youtube.com/watch?v=hpzC9tXz8g8', description: { EN: "Grind on both trucks.", KR: "두 트럭 모두 레일이나 렛지에 걸고 그라인드합니다." } },
  { id: '5-0', name: '5-0 Grind', category: TrickCategory.GRIND, difficulty: Difficulty.AMATEUR_1, description: { EN: "Grind only on the back truck.", KR: "뒷 트럭으로만 그라인드하고 앞바퀴는 듭니다." } },
  { id: 'nosegrind', name: 'Nosegrind', category: TrickCategory.GRIND, difficulty: Difficulty.AMATEUR_1, description: { EN: "Grind only on the front truck.", KR: "앞 트럭으로만 그라인드합니다." } },
  
  // Amateur 2 (Advanced Low) - Split from Hard
  { id: 'treflip', name: '360 Flip (Tre Flip)', category: TrickCategory.FLATGROUND, difficulty: Difficulty.AMATEUR_2, videoUrl: 'https://www.youtube.com/watch?v=XGw3YkQmNig', description: { EN: "360 shuvit mixed with a kickflip.", KR: "보드를 360도 돌리면서 동시에 킥플립을 합니다. 스케이터들의 로망 기술입니다." } },
  { id: 'hardflip', name: 'Hardflip', category: TrickCategory.FLATGROUND, difficulty: Difficulty.AMATEUR_2, videoUrl: 'https://www.youtube.com/watch?v=subb5N6_a68', description: { EN: "Frontside pop shuvit mixed with a kickflip, creates an illusion.", KR: "프론트사이드 팝샤빗과 킥플립의 조합으로, 다리 사이로 보드가 세워져서 돕니다." } },
  { id: 'inward-heelflip', name: 'Inward Heelflip', category: TrickCategory.FLATGROUND, difficulty: Difficulty.AMATEUR_2, description: { EN: "Backside pop shuvit mixed with a heelflip.", KR: "백사이드 팝샤빗과 힐플립을 섞은 기술입니다." } },
  { id: 'bigspin', name: 'Bigspin', category: TrickCategory.FLATGROUND, difficulty: Difficulty.AMATEUR_2, description: { EN: "360 shuvit while your body does a 180.", KR: "보드는 360도 돌고, 몸은 같은 방향으로 180도 돕니다." } },

  // Amateur 3 (Advanced High) - Split from Hard
  { id: 'laserflip', name: 'Laser Flip', category: TrickCategory.FLATGROUND, difficulty: Difficulty.AMATEUR_3, description: { EN: "Frontside 360 shuvit mixed with a heelflip.", KR: "프론트사이드 360 셔빗과 힐플립을 섞은 고난도 기술입니다." } },
  { id: 'impossible', name: 'Impossible', category: TrickCategory.FLATGROUND, difficulty: Difficulty.AMATEUR_3, videoUrl: 'https://www.youtube.com/watch?v=WzzhO6fBqsc', description: { EN: "Wrap the board vertically around your back foot.", KR: "보드가 뒷발을 감싸듯이 360도 회전하는 기술입니다." } },
  { id: 'casper-flip', name: 'Casper Flip', category: TrickCategory.FLATGROUND, difficulty: Difficulty.AMATEUR_3, videoUrl: 'https://www.youtube.com/watch?v=tm6wP-CFJxk&t=17s', description: { EN: "Half kickflip, catch upside down with back foot, flip back.", KR: "반쯤 킥플립 후 뒷발로 보드를 뒤집힌 채로 받아 다시 돌려놓는 기술입니다." } },
  { id: 'full-cab', name: 'Full Cab', category: TrickCategory.FLATGROUND, difficulty: Difficulty.AMATEUR_3, description: { EN: "Fakie backside 360.", KR: "페이키 상태에서 백사이드로 360도 회전합니다." } },
  { id: 'half-cab-flip', name: 'Half Cab Flip', category: TrickCategory.FLATGROUND, difficulty: Difficulty.AMATEUR_3, description: { EN: "Half Cab mixed with a kickflip.", KR: "하프캡을 하면서 킥플립을 넣는 기술입니다." } },
  { id: 'bigspin-flip', name: 'Bigspin Flip', category: TrickCategory.FLATGROUND, difficulty: Difficulty.AMATEUR_3, description: { EN: "Bigspin mixed with a kickflip.", KR: "빅스핀을 하면서 킥플립을 넣는 기술입니다." } },
  { id: 'feeble', name: 'Feeble Grind', category: TrickCategory.GRIND, difficulty: Difficulty.AMATEUR_3, description: { EN: "Back truck grinds while front truck hangs over the rail.", KR: "뒷 트럭을 걸고 앞 트럭은 레일 너머로 넘겨서 그라인드합니다." } },
  { id: 'smith', name: 'Backside Smith', category: TrickCategory.GRIND, difficulty: Difficulty.AMATEUR_3, description: { EN: "Back truck grinds while front truck hangs down the side.", KR: "뒷 트럭을 걸고 앞부분은 아래로 떨어뜨린 채 그라인드합니다." } },
  { id: 'crooked', name: 'Crooked Grind', category: TrickCategory.GRIND, difficulty: Difficulty.AMATEUR_3, description: { EN: "Grind on the nose with the board angled out.", KR: "노즈로 그라인드하며 보드를 바깥쪽으로 비스듬히 둡니다." } },

  // Pro (Expert)
  { id: 'dolphin-flip', name: 'Dolphin Flip (Forward Flip)', category: TrickCategory.FLATGROUND, difficulty: Difficulty.PRO, description: { EN: "Board flips vertically forward between legs.", KR: "보드가 다리 사이에서 수직으로 앞으로 튀어나가며 도는 기술입니다." } },
  { id: 'hospital-flip', name: 'Hospital Flip', category: TrickCategory.FLATGROUND, difficulty: Difficulty.PRO, description: { EN: "Half kickflip, catch with front foot, wrap around.", KR: "킥플립 반 바퀴 후 앞발로 보드를 잡아 돌리는 기술입니다." } },
  { id: 'double-kickflip', name: 'Double Kickflip', category: TrickCategory.FLATGROUND, difficulty: Difficulty.PRO, description: { EN: "Kickflip that spins twice.", KR: "공중에서 보드가 두 바퀴 도는 킥플립입니다." } },
  { id: 'nightmare-flip', name: 'Nightmare Flip', category: TrickCategory.FLATGROUND, difficulty: Difficulty.PRO, description: { EN: "Varial double kickflip.", KR: "바리엘 플립인데 킥플립 회전이 두 번 들어갑니다." } },
  { id: 'overcrook', name: 'Overcrook', category: TrickCategory.GRIND, difficulty: Difficulty.PRO, description: { EN: "Crooked grind but over the other side of the rail.", KR: "크룩드 그라인드보다 더 깊게, 레일 반대편으로 넘겨서 그라인드합니다." } },
  { id: 'bluntslide', name: 'Bluntslide', category: TrickCategory.GRIND, difficulty: Difficulty.PRO, description: { EN: "Slide on the tail with wheels on top of the ledge.", KR: "테일을 수직으로 세워 렛지 위로 올리고 슬라이드합니다." } },
  { id: 'noseblunt', name: 'Nosebluntslide', category: TrickCategory.GRIND, difficulty: Difficulty.PRO, description: { EN: "Slide on the nose with wheels on top of the ledge.", KR: "노즈를 수직으로 세워 렛지 위로 올리고 슬라이드합니다." } },
];

export const TRICK_TIPS_DB: Record<string, TrickTip[]> = {
  "Ollie": [
    { text: { EN: "Pop HARD with a snap, not a press.", KR: "테일은 누르는 게 아니라, 발목 스냅으로 강하게 '쳐야' 합니다." }, source: "Pro Coach" },
    { text: { EN: "Slide your front foot like 'Jegichagi' (ankle roll).", KR: "앞발을 제기차기하듯 눕혀서 노즈 끝까지 밀어 올리세요." }, source: "Pro Coach" },
    { text: { EN: "Lift your back foot immediately after the pop.", KR: "팝을 찬 직후 뒷무릎을 가슴 쪽으로 당겨 보드 수평을 맞추세요." }, source: "Community" },
    { text: { EN: "Jump WITH the pop, not after.", KR: "앞발만 들지 말고, 팝과 동시에 몸 전체가 점프해야 합니다." }, source: "Pro Coach" }
  ],
  "Kickflip": [
    { text: { EN: "Flick out, not down.", KR: "아래가 아니라 대각선 밖으로 플릭하세요." }, source: "Pro Coach" },
    { text: { EN: "Keep your shoulders parallel to the board.", KR: "어깨가 보드와 평행이 되도록 유지하세요." }, source: "Community" }
  ],
  "Fakie Kickflip": [
    { text: { EN: "Lean slightly more forward (towards tail) than usual.", KR: "진행 방향(테일 쪽)으로 무게중심을 조금 더 실어주세요." }, source: "Pro Coach" },
    { text: { EN: "Pop straight down, don't scoop.", KR: "테일을 비스듬히 차지 말고 수직으로 팝을 주세요." }, source: "Community" },
    { text: { EN: "Mastered this? Try Half Cab Kickflip next!", KR: "이게 익숙해졌다면 하프캡 킥플립(Half Cab Flip)에 도전해보세요!" }, source: "Pro Coach" }
  ],
  "Half Cab Flip": [
    { text: { EN: "Wind up shoulders like a Half Cab, but focus on the flick.", KR: "하프캡처럼 어깨를 감았다가 풀면서 플릭에 집중하세요." }, source: "Pro Coach" },
    { text: { EN: "Pivot on the front truck if you under-rotate.", KR: "회전이 부족하면 앞발(노즈)로 피봇하며 랜딩하세요." }, source: "Community" }
  ],
  "Fakie Ollie": [
    { 
      text: { 
        EN: "Look over your back shoulder, commit to the pop and slide. Trust your feet, land it!", 
        KR: "진행 방향(뒤쪽) 어깨를 열어 시선을 확보하고, 팝과 슬라이드를 과감하게 하세요. 발을 믿고 랜딩하세요!" 
      }, 
      source: "AI Coach" 
    },
    {
      text: {
        EN: "It's just an Ollie in reverse. Keep your weight centered, don't lean back.",
        KR: "그냥 뒤로 가는 알리일 뿐입니다. 무게중심을 중앙에 두고, 뒤로 눕지 않도록 주의하세요."
      },
      source: "Community"
    }
  ],
  "Pop Shuvit": [
      {
        text: {
            EN: "Don't just press down; snap your back ankle 45 degrees diagonally backwards.",
            KR: "뒷발은 누르지 말고, 발목 스냅을 이용해 45도 대각선 뒤로 '톡' 튕겨주세요."
        },
        source: "Pro Coach"
      },
      {
        text: {
            EN: "Pop and Scoop must happen simultaneously to keep the board level.",
            KR: "팝과 스쿱을 따로 하지 말고 '동시에' 해야 데크가 수평으로 돕니다."
        },
        source: "Pro Coach"
      },
      {
         text: {
             EN: "Keep your front foot hovering as a guide, then catch the board when it completes 180.",
             KR: "앞발은 회전을 방해하지 않게 가이드해주고, 180도가 돌았을 때 먼저 캐치하세요."
         },
         source: "Pro Coach"
      },
      {
          text: {
              EN: "Lean slightly towards your front foot to land smoothly.",
              KR: "랜딩 시 무게중심을 앞발 쪽에 두면 뒷발이 자연스럽게 따라 올라옵니다."
          },
          source: "Community"
      }
  ],
  "Shuvit": [
      {
        text: {
            EN: "Scoop back with your back foot, don't pop. Jump slightly forward.",
            KR: "팝을 주지 말고 뒷발로 뒤로 살짝 긁어주세요(Scoop). 몸은 살짝 앞으로 점프해야 보드를 잡기 쉽습니다."
        },
        source: "Pro Coach"
      }
  ],
  "Frontside 180": [
      {
        text: {
            EN: "Wind up your shoulders before popping. Turn your head and shoulders first.",
            KR: "팝을 차기 전에 어깨를 반대로 감았다가(Wind up), 시선과 어깨를 먼저 돌리며 하체를 따라오게 하세요."
        },
        source: "Pro Coach"
      }
  ],
  "Backside 180": [
      {
        text: {
            EN: "Wind up your shoulders before you pop. Release the turn AS you pop, not after.",
            KR: "점프 전에 어깨를 먼저 감았다가(Wind up), 팝과 동시에 몸을 던져야 합니다. 팝하고 돌면 늦습니다."
        },
        source: "Pro Coach"
      },
      {
        text: {
            EN: "Your body follows your head. Turn your head aggressively to look behind you.",
            KR: "머리와 시선이 가는 곳으로 몸이 따라갑니다. 등이 보이는 쪽으로 시선을 과감하게 보내세요."
        },
        source: "Pro Coach"
      },
      {
        text: {
            EN: "Pop like an Ollie but add a slight scoop to help the board stick to your feet.",
            KR: "알리 팝과 동시에 뒷발에 약간의 스쿱을 섞어주면 보드가 발에 잘 붙어옵니다."
        },
        source: "Community"
      },
      {
        text: {
            EN: "If you under-rotate, land heavy on the nose wheels and pivot the rest.",
            KR: "각도가 모자라면 착지할 때 앞발(노즈)을 축으로 나머지 각도를 비벼서(Pivot) 채우세요."
        },
        source: "Pro Coach"
      }
  ]
};