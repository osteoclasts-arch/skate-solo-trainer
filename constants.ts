
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
    Easy: "Easy",
    Medium: "Medium",
    Hard: "Hard",
    Pro: "Pro",
    Flatground: "Flatground",
    Grind: "Grind",
    Transition: "Transition",
    Regular: "Regular",
    Fakie: "Fakie",
    Switch: "Switch",
    Nollie: "Nollie",
    AI_PLACEHOLDER: "e.g. 'Backside pop tricks' or 'Focus on pop height'",
    CONFIRM_ABORT: "End current session? Progress will be lost.",
    // Learning
    LEARNING: "Trick Guide",
    PRACTICE_THIS: "Practice This",
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
    LEVEL_INTERMEDIATE: "Intermediate",
    LEVEL_ADVANCED: "Advanced",
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
    LOGIN_GOOGLE: "Sign in with Google",
    LOGOUT: "Logout",
    GUEST: "Guest",
    // Tips
    TIP_VARIATION_STANDARD: "Standard",
    TIP_VARIATION_FAKIE: "Fakie Variation",
    TIP_VARIATION_NOLLIE: "Nollie Variation",
    TIP_VARIATION_SWITCH: "Switch Variation"
  },
  KR: {
    NEW_SESSION: "새로운 훈련",
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
    START_SKATING: "훈련 시작",
    GENERATING: "루틴 짜는 중...",
    TRICK_COUNTER: "트릭",
    ABORT: "그만하기",
    GET_TIP: "팁 보기",
    ASKING_COACH: "코치에게 물어보는 중...",
    PRO_TIP: "프로 팁",
    FAILED: "실패",
    LANDED: "성공",
    SESSION_COMPLETE: "훈련 종료",
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
    TOTAL_SESSIONS: "총 훈련 횟수",
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
    Easy: "입문",
    Medium: "중급",
    Hard: "상급",
    Pro: "프로",
    Flatground: "플랫",
    Grind: "그라인드",
    Transition: "트랜지션",
    Regular: "레귤러",
    Fakie: "페이키",
    Switch: "스위치",
    Nollie: "널리",
    AI_PLACEHOLDER: "예: '팝을 뒷방향으로 차는 연습' 또는 '알리 높이 높이기'",
    CONFIRM_ABORT: "훈련을 종료하시겠어요? 기록이 저장되지 않습니다.",
    // Learning
    LEARNING: "트릭 가이드",
    PRACTICE_THIS: "이 기술 연습하기",
    HOW_TO: "배우는 법",
    ANALYZING: "데이터 분석 중...",
    DESCRIPTION: "기술 설명",
    VIDEO_TUTORIAL: "영상 강의",
    // Profile & Experience
    DAYS_SKATING: "스케이트 라이프",
    START_DATE: "시작일",
    SET_START_DATE: "시작일 설정",
    SAVE: "저장",
    CANCEL: "취소",
    DAY: "일차",
    EXPERIENCE_LEVEL: "레벨",
    LEVEL_BEGINNER: "루키",
    LEVEL_INTERMEDIATE: "아마추어",
    LEVEL_ADVANCED: "프로",
    // Ranking
    GLOBAL_RANKING: "전체 랭킹",
    YOUR_TIER: "나의 티어",
    TOP_PERCENT: "상위",
    TIER_1: "Street Rat",
    TIER_2: "Local Hero",
    TIER_3: "Sponsored Am",
    TIER_4: "G.O.A.T",
    RANKING_DESC: "상급/프로 기술 성공 점수 기반",
    // Auth
    LOGIN_GOOGLE: "구글로 시작하기",
    LOGOUT: "로그아웃",
    GUEST: "게스트",
    // Tips
    TIP_VARIATION_STANDARD: "기본 팁",
    TIP_VARIATION_FAKIE: "페이키 팁",
    TIP_VARIATION_NOLLIE: "널리 팁",
    TIP_VARIATION_SWITCH: "스위치 팁"
  }
};

export const BASE_TRICKS: Trick[] = [
  // --- EASY / BASICS ---
  { 
    id: 'ollie', 
    name: 'Ollie', 
    category: TrickCategory.FLATGROUND, 
    difficulty: Difficulty.EASY, 
    videoUrl: 'https://www.youtube.com/watch?v=qRv71FiM7JQ',
    description: {
      EN: "The foundation of street skateboarding. A jump where you pop the tail and slide your front foot up.",
      KR: "스트릿 스케이트보딩의 기초입니다. 테일을 팝하고 앞발을 끌어올려 점프하는 기술입니다."
    }
  },
  { 
    id: 'shuv', 
    name: 'Pop Shuvit', 
    category: TrickCategory.FLATGROUND, 
    difficulty: Difficulty.EASY,
    videoUrl: 'https://www.youtube.com/watch?v=vA1EPid4aiw', 
    description: {
      EN: "Spinning the board 180 degrees under your feet without flipping it, while popping.",
      KR: "보드를 뒤집지 않고 발 아래에서 180도 회전시키는 기술입니다."
    }
  },
  { 
    id: 'fs180', 
    name: 'Frontside 180', 
    category: TrickCategory.FLATGROUND, 
    difficulty: Difficulty.EASY, 
    videoUrl: 'https://www.youtube.com/watch?v=C_yCly3NYUo',
    description: {
      EN: "An ollie where you and the board rotate 180 degrees facing forward (frontside).",
      KR: "알리를 하면서 몸과 보드가 앞쪽(프론트사이드)으로 180도 회전하는 기술입니다."
    }
  },
  { 
    id: 'bs180', 
    name: 'Backside 180', 
    category: TrickCategory.FLATGROUND, 
    difficulty: Difficulty.EASY, 
    videoUrl: 'https://www.youtube.com/watch?v=dJMp-xtb_Hk',
    description: {
      EN: "An ollie where you and the board rotate 180 degrees with your back turning first.",
      KR: "알리를 하면서 등을 먼저 돌리며(백사이드) 180도 회전하는 기술입니다."
    }
  },
  {
    id: 'manual',
    name: 'Manual',
    category: TrickCategory.FLATGROUND,
    difficulty: Difficulty.EASY,
    videoUrl: 'https://www.youtube.com/watch?v=2Tz1rL8yWbY',
    description: {
      EN: "Balancing on the back two wheels while riding.",
      KR: "주행 중에 뒷바퀴 두 개로만 균형을 잡고 가는 기술입니다."
    }
  },
  {
    id: 'nose_manual',
    name: 'Nose Manual',
    category: TrickCategory.FLATGROUND,
    difficulty: Difficulty.EASY,
    videoUrl: 'https://www.youtube.com/watch?v=w6jH3n_h3-E',
    description: {
      EN: "Balancing on the front two wheels while riding.",
      KR: "주행 중에 앞바퀴 두 개로만 균형을 잡고 가는 기술입니다."
    }
  },
  {
    id: 'boneless',
    name: 'Boneless',
    category: TrickCategory.FLATGROUND,
    difficulty: Difficulty.EASY,
    videoUrl: 'https://www.youtube.com/watch?v=0w71T9k5W5Q',
    description: {
      EN: "Planting your front foot on the ground, grabbing the board, and jumping back on.",
      KR: "앞발을 땅에 짚고 보드를 손으로 잡은 뒤 점프하여 다시 타는 올드스쿨 기술입니다."
    }
  },
  {
    id: 'no_comply',
    name: 'No Comply 180',
    category: TrickCategory.FLATGROUND,
    difficulty: Difficulty.EASY,
    videoUrl: 'https://www.youtube.com/watch?v=sO7Zk_F8l-E',
    description: {
      EN: "Planting your front foot and popping the board 180 degrees with your back foot.",
      KR: "앞발을 땅에 짚고 뒷발로 보드를 팝하여 180도 회전시키는 기술입니다."
    }
  },
  {
    id: 'fakie_ollie',
    name: 'Fakie Ollie',
    category: TrickCategory.FLATGROUND,
    difficulty: Difficulty.EASY,
    videoUrl: 'https://www.youtube.com/watch?v=3X_6X_7X_8o',
    description: {
      EN: "An Ollie while riding backward.",
      KR: "뒤로 가면서(페이키) 하는 알리입니다."
    }
  },
  {
    id: 'nollie',
    name: 'Nollie',
    category: TrickCategory.FLATGROUND,
    difficulty: Difficulty.EASY,
    videoUrl: 'https://www.youtube.com/watch?v=4X_9X_0X_1o',
    description: {
      EN: "Popping with the nose while riding forward.",
      KR: "앞으로 가면서 노즈를 팝하여 점프하는 기술입니다."
    }
  },

  // --- MEDIUM / FLIP TRICKS & GRINDS ---
  { 
    id: 'kickflip', 
    name: 'Kickflip', 
    category: TrickCategory.FLATGROUND, 
    difficulty: Difficulty.MEDIUM, 
    videoUrl: 'https://www.youtube.com/watch?v=G8yy5v9IBso',
    description: {
      EN: "Flicking the board with your toe to make it flip 360 degrees along its axis.",
      KR: "발가락으로 보드를 플릭하여 축을 따라 360도 회전시키는 기술입니다."
    }
  },
  { 
    id: 'heelflip', 
    name: 'Heelflip', 
    category: TrickCategory.FLATGROUND, 
    difficulty: Difficulty.MEDIUM, 
    videoUrl: 'https://www.youtube.com/watch?v=a61ycoK_bWM',
    description: {
      EN: "Flicking the board with your heel to make it flip in the opposite direction of a kickflip.",
      KR: "발뒤꿈치로 보드를 차서 킥플립과 반대 방향으로 회전시키는 기술입니다."
    }
  },
  { 
    id: 'varial', 
    name: 'Varial Kickflip', 
    category: TrickCategory.FLATGROUND, 
    difficulty: Difficulty.MEDIUM,
    videoUrl: 'https://www.youtube.com/watch?v=MfIkBXXZrEY',
    description: {
      EN: "A combination of a Pop Shuvit and a Kickflip.",
      KR: "팝 셔빗과 킥플립이 결합된 기술입니다."
    }
  },
  { 
    id: 'fs_shuv', 
    name: 'Frontside Pop Shuvit', 
    category: TrickCategory.FLATGROUND, 
    difficulty: Difficulty.MEDIUM,
    videoUrl: 'https://www.youtube.com/watch?v=nEcssJ5_xK4',
    description: {
      EN: "Popping the board and spinning it 180 degrees frontside (behind you).",
      KR: "보드를 팝하며 등 뒤쪽으로(프론트사이드) 180도 회전시키는 기술입니다."
    }
  },
  { 
    id: '5050', 
    name: '50-50 Grind', 
    category: TrickCategory.GRIND, 
    difficulty: Difficulty.MEDIUM,
    videoUrl: 'https://www.youtube.com/watch?v=hpzG_G9WjUE',
    description: {
      EN: "Grinding on an obstacle with both trucks.",
      KR: "두 트럭 모두를 사용하여 기물 위를 그라인딩하는 기술입니다."
    }
  },
  {
    id: 'boardslide',
    name: 'Boardslide',
    category: TrickCategory.GRIND,
    difficulty: Difficulty.MEDIUM,
    videoUrl: 'https://www.youtube.com/watch?v=jW9SggQ4wXo',
    description: {
      EN: "Sliding the middle of the board on a rail or ledge.",
      KR: "보드의 중간 부분으로 레일이나 레지를 타는 슬라이드 기술입니다."
    }
  },
  {
    id: '50_grind',
    name: '5-0 Grind',
    category: TrickCategory.GRIND, 
    difficulty: Difficulty.MEDIUM,
    videoUrl: 'https://www.youtube.com/watch?v=3RzXk2tB4_s',
    description: {
      EN: "Grinding only on the back truck, like a manual on a ledge.",
      KR: "뒷 트럭으로만 그라인딩하는 기술입니다. 레지 위에서 매뉴얼을 하는 것과 비슷합니다."
    }
  },
  {
    id: 'fakie_bigspin',
    name: 'Fakie Bigspin',
    category: TrickCategory.FLATGROUND,
    difficulty: Difficulty.MEDIUM,
    videoUrl: 'https://www.youtube.com/watch?v=3X_6X_7X_8o', 
    description: {
      EN: "Fakie backside 360 shuvit with a 180 body varial.",
      KR: "페이키 상태에서 보드를 360도 돌리고 몸을 180도 돌리는 기술입니다."
    }
  },
  {
    id: 'half_cab',
    name: 'Half Cab',
    category: TrickCategory.FLATGROUND,
    difficulty: Difficulty.MEDIUM,
    videoUrl: 'https://www.youtube.com/watch?v=def12345',
    description: {
      EN: "Fakie Backside 180 Ollie.",
      KR: "페이키 상태에서 백사이드로 180도 회전하는 알리입니다."
    }
  },
  {
    id: 'half_cab_flip',
    name: 'Half Cab Flip',
    category: TrickCategory.FLATGROUND,
    difficulty: Difficulty.MEDIUM,
    videoUrl: 'https://www.youtube.com/watch?v=HalfCabFlipUrl',
    description: {
      EN: "Fakie Backside 180 Kickflip.",
      KR: "페이키 상태에서 하프캡(백사이드 180)과 킥플립을 동시에 하는 기술입니다."
    }
  },
  {
    id: 'nollie_shuv',
    name: 'Nollie Pop Shuvit',
    category: TrickCategory.FLATGROUND,
    difficulty: Difficulty.MEDIUM,
    videoUrl: 'https://www.youtube.com/watch?v=ghi12345',
    description: {
      EN: "Pop shuvit done from the nose.",
      KR: "노즈에서 팝을 쳐서 하는 팝 셔빗입니다."
    }
  },

  // --- HARD ---
  { 
    id: 'tre', 
    name: '360 Flip', 
    category: TrickCategory.FLATGROUND, 
    difficulty: Difficulty.HARD,
    videoUrl: 'https://www.youtube.com/watch?v=5D4wK3pQ0_0',
    description: {
      EN: "Also known as a Tre Flip. A 360 Shuvit combined with a Kickflip.",
      KR: "트레 플립이라고도 불리며, 360 셔빗과 킥플립이 결합된 기술입니다."
    }
  },
  { 
    id: 'hardflip', 
    name: 'Hardflip', 
    category: TrickCategory.FLATGROUND, 
    difficulty: Difficulty.HARD,
    videoUrl: 'https://www.youtube.com/watch?v=1F_4Xq_3X_o',
    description: {
      EN: "A Frontside Pop Shuvit combined with a Kickflip. Looks like the board goes through your legs.",
      KR: "프론트사이드 팝 셔빗과 킥플립의 결합입니다. 보드가 다리 사이를 통과하는 것처럼 보입니다."
    }
  },
  { 
    id: 'inward', 
    name: 'Inward Heelflip', 
    category: TrickCategory.FLATGROUND, 
    difficulty: Difficulty.HARD,
    videoUrl: 'https://www.youtube.com/watch?v=2Z3X_5X_1_o',
    description: {
      EN: "A Pop Shuvit combined with a Heelflip.",
      KR: "팝 셔빗과 힐플립이 결합된 기술입니다."
    }
  },
  { 
    id: 'fs_heelflip', 
    name: 'Frontside Heelflip', 
    category: TrickCategory.FLATGROUND, 
    difficulty: Difficulty.HARD,
    videoUrl: 'https://www.youtube.com/watch?v=6X_0X_1X_3o',
    description: {
      EN: "A Frontside 180 combined with a Heelflip.",
      KR: "프론트사이드 180와 힐플립이 결합된 기술입니다."
    },
    stanceDocs: {
        [Stance.FAKIE]: {
            videoUrl: 'https://www.youtube.com/watch?v=mYcViRQRoH4',
            description: {
                EN: "Fakie FS Heelflip: Use the momentum to rotate the board.",
                KR: "페이키 프론트 힐: 주행 관성을 이용해 보드를 회전시키세요. 레귤러보다 회전이 자연스럽습니다."
            }
        }
    }
  },
  { 
    id: 'bigspin', 
    name: 'Bigspin', 
    category: TrickCategory.FLATGROUND, 
    difficulty: Difficulty.HARD,
    videoUrl: 'https://www.youtube.com/watch?v=3X_6X_7X_8o',
    description: {
      EN: "A 360 Shuvit while your body does a backside 180 rotation.",
      KR: "보드가 360도 회전하는 동안 몸이 백사이드 180도 회전하는 기술입니다."
    }
  },
  { 
    id: 'bigspin_flip', 
    name: 'Bigspin Flip', 
    category: TrickCategory.FLATGROUND, 
    difficulty: Difficulty.HARD,
    videoUrl: 'https://www.youtube.com/watch?v=BigspinFlipUrl',
    description: {
      EN: "Bigspin combined with a Kickflip.",
      KR: "빅스핀과 킥플립을 결합한 기술입니다."
    }
  },
  { 
    id: 'full_cab', 
    name: 'Full Cab', 
    category: TrickCategory.FLATGROUND, 
    difficulty: Difficulty.HARD,
    videoUrl: 'https://www.youtube.com/watch?v=FullCabUrl',
    description: {
      EN: "Fakie Backside 360 Ollie.",
      KR: "페이키 상태에서 백사이드로 360도 회전하는 알리입니다. (Caballerial)"
    }
  },
  { 
    id: 'crook', 
    name: 'Crooked Grind', 
    category: TrickCategory.GRIND, 
    difficulty: Difficulty.HARD,
    videoUrl: 'https://www.youtube.com/watch?v=4X_9X_0X_1o',
    description: {
      EN: "Grinding on the front truck with the nose pinched down.",
      KR: "앞 트럭으로 그라인드하며 노즈를 눌러주는 기술입니다."
    }
  },
  { 
    id: 'nose_slide', 
    name: 'Noseslide', 
    category: TrickCategory.GRIND, 
    difficulty: Difficulty.HARD,
    videoUrl: 'https://www.youtube.com/watch?v=5X_8X_9X_2o',
    description: {
      EN: "Sliding on an obstacle using only the nose of the board.",
      KR: "보드의 노즈 부분만을 사용하여 기물 위를 슬라이딩하는 기술입니다."
    }
  },
  {
    id: 'smith',
    name: 'Smith Grind',
    category: TrickCategory.GRIND,
    difficulty: Difficulty.HARD,
    videoUrl: 'https://www.youtube.com/watch?v=6X_0X_1X_3o',
    description: {
      EN: "Back truck grinding, front truck dipped down beside the ledge.",
      KR: "뒷 트럭으로 그라인드하고 앞 트럭은 레지 아래로 떨구는 스타일리시한 기술입니다."
    }
  },
  {
    id: 'feeble',
    name: 'Feeble Grind',
    category: TrickCategory.GRIND,
    difficulty: Difficulty.HARD,
    videoUrl: 'https://www.youtube.com/watch?v=jkl12345',
    description: {
      EN: "Back truck grind with front truck dipped over the rail on the other side.",
      KR: "스미스 그라인드와 비슷하지만 앞 트럭이 레일 반대편으로 넘어가는 기술입니다."
    }
  },
  {
    id: 'overcrook',
    name: 'Overcrook',
    category: TrickCategory.GRIND,
    difficulty: Difficulty.HARD,
    videoUrl: 'https://www.youtube.com/watch?v=mno12345',
    description: {
      EN: "Crooked grind but leaning over the other side of the ledge.",
      KR: "크룩드 그라인드보다 더 깊게 노즈를 박고 레지 반대편으로 넘기는 기술입니다."
    }
  },

  // --- PRO ---
  { 
    id: 'laser', 
    name: 'Laser Flip', 
    category: TrickCategory.FLATGROUND, 
    difficulty: Difficulty.PRO, 
    videoUrl: 'https://www.youtube.com/watch?v=0U4OmfatAgo',
    description: {
      EN: "A Frontside 360 Shuvit combined with a Heelflip. Opposite of a 360 Flip.",
      KR: "프론트사이드 360 셔빗과 힐플립의 결합입니다. 360 플립의 반대 버전입니다."
    }
  },
  { 
    id: 'impossible', 
    name: 'Impossible', 
    category: TrickCategory.FLATGROUND, 
    difficulty: Difficulty.PRO,
    videoUrl: 'https://www.youtube.com/watch?v=WzzhO6fBqsc',
    description: {
      EN: "The board wraps vertically around the back foot in a 360 motion.",
      KR: "보드가 뒷발을 감싸며 수직으로 360도 회전하는 기술입니다."
    }
  },
  { 
    id: 'casper_flip', 
    name: 'Casper Flip', 
    category: TrickCategory.FLATGROUND, 
    difficulty: Difficulty.PRO, 
    videoUrl: 'https://www.youtube.com/watch?v=tm6wP-CFJxk',
    description: {
      EN: "Half kickflip caught upside down with back foot, then flipped back.",
      KR: "킥플립을 반만 돌린 상태에서 뒷발로 캐치한 후 다시 뒤집는 기술입니다."
    }
  },
  { 
    id: 'blunt', 
    name: 'Bluntslide', 
    category: TrickCategory.GRIND, 
    difficulty: Difficulty.PRO,
    videoUrl: 'https://www.youtube.com/watch?v=8X_2X_3X_5o',
    description: {
      EN: "Sliding on the tail with the board nearly vertical and wheels on top of the ledge.",
      KR: "보드를 거의 수직으로 세우고 휠을 레지 위에 올린 채 테일로 슬라이딩하는 기술입니다."
    }
  },
  {
    id: 'double_kickflip',
    name: 'Double Kickflip',
    category: TrickCategory.FLATGROUND,
    difficulty: Difficulty.PRO,
    videoUrl: 'https://www.youtube.com/watch?v=pqr12345',
    description: {
      EN: "Kickflip that rotates twice.",
      KR: "보드가 두 바퀴 회전하는 킥플립입니다."
    }
  },
  {
    id: 'dolphin_flip',
    name: 'Dolphin Flip',
    category: TrickCategory.FLATGROUND,
    difficulty: Difficulty.PRO,
    videoUrl: 'https://www.youtube.com/watch?v=stu12345',
    description: {
      EN: "Forward flip where the board flips vertically between your legs.",
      KR: "보드가 다리 사이에서 수직으로 앞으로 도는(Forward Flip) 기술입니다."
    }
  },
  {
    id: 'hospital_flip',
    name: 'Hospital Flip',
    category: TrickCategory.FLATGROUND,
    difficulty: Difficulty.PRO,
    videoUrl: 'https://www.youtube.com/watch?v=vwx12345',
    description: {
      EN: "Half kickflip, catch with front foot, wrap it around like a shuvit.",
      KR: "킥플립 반 바퀴 후 앞발로 잡아 셔빗처럼 돌려주는 기술입니다. 캐스퍼 플립과 비슷합니다."
    }
  },
];

export const TRICK_TIPS_DB: Record<string, TrickTip[]> = {
  // ... (Existing tips remain the same)
  // --- KICKFLIP FAMILY ---
  'Kickflip': [
    { 
        text: { 
            EN: "The flick is more important than the pop. Flick up and out off the nose.", 
            KR: "플릭이 팝보다 더 중요해요. 위로 그리고 바깥으로 플릭하세요."
        }, 
        source: "Jonny Giger", 
        video: "How to Kickflip" 
    },
    { 
        text: { 
            EN: "Don't jump forward, stay centered over the board. Keep shoulders parallel.", 
            KR: "앞으로 점프하지 말고, 보드 중앙에 머물러요."
        }, 
        source: "Aaron Kyro", 
        video: "Easiest Way To Kickflip" 
    }
  ],
  'Fakie Kickflip': [
    {
        text: {
            EN: "Lean slightly forward in the direction of travel. The momentum helps the flip.",
            KR: "진행 방향으로 몸을 살짝 기울이세요. 관성이 플릭을 도와줍니다."
        },
        source: "Pro Tip",
        video: "Fakie Kickflip Tips"
    },
    {
        text: {
            EN: "It's often easier than regular kickflips because the board stays with you naturally.",
            KR: "보드가 자연스럽게 따라오기 때문에 레귤러 킥플립보다 쉬울 수 있습니다."
        },
        source: "Experience",
        video: "Why Fakie is Easier"
    }
  ],
  'Nollie Kickflip': [
    {
        text: {
            EN: "Pop forward with your nose, then flick backwards with your back foot.",
            KR: "노즈로 앞으로 팝을 주고, 뒷발로 뒤쪽으로 플릭하세요."
        },
        source: "Pro Tip",
        video: "Nollie Flip Mechanics"
    },
    {
        text: {
            EN: "Keep your weight over the nose, don't lean back.",
            KR: "체중을 노즈 위에 두세요, 뒤로 눕지 마세요."
        },
        source: "SkateHacks",
        video: "Nollie Flip Guide"
    }
  ],

  // --- HEELFLIP FAMILY ---
  'Heelflip': [
    { 
        text: {
            EN: "Point your toes up and kick out with your heel off the nose corner.",
            KR: "발가락을 위로 하고 노즈 모서리로 뒤꿈치를 차세요."
        }, 
        source: "Daewon Song", 
        video: "Heelflip Tips" 
    },
    { 
        text: {
            EN: "Keep your weight centered, do not lean back on your heels.",
            KR: "체중을 중앙에 두고 뒤꿈치 쪽으로 기울이지 마세요."
        }, 
        source: "Spencer Nuzzi", 
        video: "How to Heelflip" 
    }
  ],
  'Fakie Heelflip': [
    {
        text: {
            EN: "Keep your shoulders square. The motion is almost identical to regular but feels floatier.",
            KR: "어깨를 평행하게 유지하세요. 동작은 레귤러와 거의 같지만 더 떠있는 느낌이 듭니다."
        },
        source: "Pro Tip",
        video: "Fakie Heel"
    }
  ],
  'Nollie Heelflip': [
    {
        text: {
            EN: "Set your front foot (popping foot) slightly in the pocket for better leverage.",
            KR: "팝을 주는 발을 포켓 쪽에 살짝 두어 힘을 더 잘 받게 하세요."
        },
        source: "Pro Tip",
        video: "Nollie Heel"
    }
  ],
  'Frontside Heelflip': [
    {
        text: {
            EN: "Focus on the heelflip first, let the rotation follow.",
            KR: "힐플립에 먼저 집중하고 회전은 따라오게 하세요."
        },
        source: "Pro Tip",
        video: "FS Heel Tips"
    }
  ],
  'Fakie Frontside Heelflip': [
    {
        text: {
            EN: "It rotates much easier than regular. Pop, flick, and turn your shoulders.",
            KR: "레귤러보다 훨씬 쉽게 돌아갑니다. 팝, 플릭, 그리고 어깨를 돌리세요."
        },
        source: "SkateHacks",
        video: "Fakie FS Heel"
    }
  ],

  // --- TRE FLIP ---
  '360 Flip': [
    { 
        text: {
            EN: "Scoop hard and flick late. It's 90% scoop in the back foot.",
            KR: "강하게 스쿠핑하고 늦게 플릭하세요."
        }, 
        source: "Chris Cole", 
        video: "How To Tre Flip" 
    },
    { 
        text: {
            EN: "Your shoulders should wind up before you pop.",
            KR: "팝하기 전에 어깨를 감아야 해요."
        }, 
        source: "Mike Mo Capaldi", 
        video: "Trickipedia" 
    }
  ],
  
  // --- OLLIE ---
  'Ollie': [
    { 
        text: {
            EN: "Slide your front foot all the way to the nose to level it out.",
            KR: "앞발을 노즈까지 쭉 슬라이드하세요."
        }, 
        source: "Tony Hawk", 
        video: "MasterClass" 
    },
    { 
        text: {
            EN: "Suck your knees up to your chest to get height.",
            KR: "무릎을 가슴까지 끌어올리세요."
        }, 
        source: "Aaron Kyro", 
        video: "Learn to Ollie" 
    }
  ],

  // --- GRINDS ---
  '50-50 Grind': [
    { 
        text: {
            EN: "Commit fully or you'll slip out. Lock in on the heel side.",
            KR: "완전히 헌신하지 않으면 미끄러집니다."
        }, 
        source: "Nyjah Huston", 
        video: "Grind Basics" 
    },
    { 
        text: {
            EN: "Focus on your cross-lock pinch.",
            KR: "크로스 락 핀치에 집중하세요."
        }, 
        source: "Paul Rodriguez", 
        video: "Primitive Skate" 
    },
  ],
  'Boardslide': [
    {
        text: {
            EN: "Turn your shoulders 90 degrees and aim the middle of your board over the rail.",
            KR: "어깨를 90도 돌리고 보드 중앙에 레일 위에 맞추세요."
        },
        source: "Braille",
        video: "Boardslide Basics"
    },
    {
        text: {
            EN: "Lean slightly forward to avoid slipping out backwards.",
            KR: "뒤로 넘어지지 않도록 살짝 앞으로 기울이세요."
        }, 
        source: "Pro Tip",
        video: "Safety Tips"
    }
  ],
  'Noseslide': [
    {
        text: {
            EN: "Approach at a slight angle and lock your wheel against the ledge.",
            KR: "약간의 각도로 접근하여 휠을 레지에 딱 붙이세요."
        },
        source: "Pro Tip",
        video: "Locking In"
    }
  ],

  // --- HARD TRICKS ---
  'Hardflip': [
    { 
        text: {
            EN: "It's mostly frontside shuvit with a slight flick. Open your legs.",
            KR: "약간의 플릭이 있는 프론트사이드 셔빗과 비슷합니다."
        }, 
        source: "Bryan Herman", 
        video: "Hardflip Tips" 
    }
  ],
  'Impossible': [
    { 
        text: {
            EN: "Wrap the board around your back foot, don't just scoop.",
            KR: "단순히 스쿠핑하고 뒷발로 보드를 감으세요."
        }, 
        source: "Rodney Mullen", 
        video: "Impossible How-To" 
    }
  ],
  'Casper Flip': [
    {
        text: {
            EN: "Keep your back foot hanging off the tail to catch it upside down.",
            KR: "뒷발을 테일 밖으로 빼서 보드가 뒤집혔을 때 받을 준비를 하세요."
        },
        source: "Jonny Giger",
        video: "Casper Flip Tutorial"
    }
  ]
};

export const MOCK_HISTORY = [
  { date: '2023-10-01', successRate: 45 },
  { date: '2023-10-05', successRate: 52 },
  { date: '2023-10-12', successRate: 48 },
  { date: '2023-10-15', successRate: 60 },
  { date: '2023-10-20', successRate: 58 },
  { date: '2023-10-25', successRate: 65 },
];
