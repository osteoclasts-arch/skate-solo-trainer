

import { Difficulty, Trick, TrickCategory, TrickTip } from "./types";

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
    AI_PLACEHOLDER: "e.g. 'Focus on consistency' or 'Only ledge tricks'",
    CONFIRM_ABORT: "End current session? Progress will be lost.",
    // Learning
    LEARNING: "Learning",
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
    NEW_SESSION: "새 세션",
    CUSTOMIZED_TRAINING: "맞춤형 훈련",
    TOTAL_LANDED: "성공한 기술",
    AVG_SUCCESS: "평균 성공률",
    PROGRESSION: "진행도 (최근 10회)",
    SETUP_SESSION: "세션 설정",
    SESSION_LENGTH: "세션 길이",
    DIFFICULTY: "난이도",
    AI_COACH_MODE: "AI 코치 모드",
    CATEGORIES: "카테고리",
    STANCES: "스탠스",
    STANCE_MIX: "스탠스 믹스 설정",
    START_SKATING: "시작하기",
    GENERATING: "세션 생성 중...",
    TRICK_COUNTER: "기술",
    ABORT: "중단",
    GET_TIP: "팁 보기",
    ASKING_COACH: "코치에게 물어보는 중...",
    PRO_TIP: "프로 팁",
    FAILED: "실패",
    LANDED: "성공",
    SESSION_COMPLETE: "세션 완료",
    COMPLETED: "완료",
    CLEAN_SHEET: "완벽한 성공",
    AI_FEEDBACK: "AI 코치 피드백",
    DETAILS: "상세 정보",
    DASHBOARD: "홈",
    ANALYTICS: "분석",
    SUCCESS: "성공",
    SOURCE: "출처",
    VIDEO: "비디오",
    // Analytics
    TOTAL_SESSIONS: "총 세션 수",
    BEST_STREAK: "최고 연승",
    WEAKNESS_ANALYSIS: "약점 분석",
    RECOMMENDED_PRACTICE: "추천 연습 메뉴",
    STATS: "통계",
    PRACTICE_MORE: "더 연습하세요!",
    COMPREHENSIVE_DIAGNOSIS: "한국어 종합 진단",
    SESSION_SUMMARY: "세션 분석 요약",
    KEY_WEAKNESSES: "주요 약점",
    IMPROVEMENT_DIRECTIONS: "개선 방향",
    AI_COACH_FEEDBACK_TITLE: "AI 코치 피드백",
    GENERATE_INSIGHT: "AI 진단 생성",
    GENERATING_INSIGHT: "데이터 분석 중...",
    SHARE_STORY: "인스타 스토리 공유",
    SHARING: "이미지 생성 중...",
    // Values
    Easy: "쉬움",
    Medium: "중간",
    Hard: "어려움",
    Pro: "프로",
    Flatground: "플랫그라운드",
    Grind: "그라인드",
    Transition: "트랜지션",
    Regular: "레귤러",
    Fakie: "페이키",
    Switch: "스위치",
    Nollie: "널리",
    AI_PLACEHOLDER: "예: '일관성 집중' 또는 '레지 트릭만'",
    CONFIRM_ABORT: "현재 세션을 종료하시겠습니까? 진행 상황이 손실됩니다.",
    // Learning
    LEARNING: "기술 배우기",
    PRACTICE_THIS: "이 기술 연습하기",
    HOW_TO: "배우는 법",
    ANALYZING: "세션 데이터 분석 중...",
    DESCRIPTION: "설명",
    VIDEO_TUTORIAL: "영상 강의",
    // Profile & Experience
    DAYS_SKATING: "보드 경력",
    START_DATE: "시작일",
    SET_START_DATE: "시작일 설정",
    SAVE: "저장",
    CANCEL: "취소",
    DAY: "일차",
    EXPERIENCE_LEVEL: "경력 레벨",
    LEVEL_BEGINNER: "입문",
    LEVEL_INTERMEDIATE: "중급",
    LEVEL_ADVANCED: "고급",
    // Auth
    LOGIN_GOOGLE: "Google 계정으로 로그인",
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
    videoUrl: 'https://www.youtube.com/watch?v=Oq9Y3i7JfGs',
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
    videoUrl: 'https://www.youtube.com/watch?v=N6s3t-Z7C0E',
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
    videoUrl: 'https://www.youtube.com/watch?v=Lq1t_WG2t_s',
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
    videoUrl: 'https://www.youtube.com/watch?v=7X_1X_2X_4o',
    description: {
      EN: "The board wraps vertically around the back foot in a 360 motion.",
      KR: "보드가 뒷발을 감싸며 수직으로 360도 회전하는 기술입니다."
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
];

export const TRICK_TIPS_DB: Record<string, TrickTip[]> = {
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
            KR: "어깨를 90도 돌리고 보드 중앙을 레일 위에 맞추세요."
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