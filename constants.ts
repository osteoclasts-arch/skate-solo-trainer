

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
    GUEST: "Guest"
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
    GUEST: "게스트"
  }
};

export const BASE_TRICKS: Trick[] = [
  // Easy / Basics
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
  
  // Medium / Flip Tricks
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
    description: {
      EN: "Grinding on an obstacle with both trucks.",
      KR: "두 트럭 모두를 사용하여 기물 위를 그라인딩하는 기술입니다."
    }
  },
  
  // Hard
  { 
    id: 'tre', 
    name: '360 Flip', 
    category: TrickCategory.FLATGROUND, 
    difficulty: Difficulty.HARD,
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
    description: {
      EN: "Sliding on an obstacle using only the nose of the board.",
      KR: "보드의 노즈 부분만을 사용하여 기물 위를 슬라이딩하는 기술입니다."
    }
  },

  // Pro
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
    description: {
      EN: "Sliding on the tail with the board nearly vertical and wheels on top of the ledge.",
      KR: "보드를 거의 수직으로 세우고 휠을 레지 위에 올린 채 테일로 슬라이딩하는 기술입니다."
    }
  },
];

export const TRICK_TIPS_DB: Record<string, TrickTip[]> = {
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
        source: "Aaron Kyro (Braille)", 
        video: "Easiest Way To Kickflip" 
    },
    { 
        text: { 
            EN: "Focus on catching with your back foot first to level it out.", 
            KR: "뒤발로 먼저 캐치하는 데 집중하세요."
        }, 
        source: "Christopher Chann", 
        video: "Kickflip Tips" 
    }
  ],
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
    },
    { 
        text: {
            EN: "Don't lean back, stay committed over the board.",
            KR: "뒤로 기울이지 말고 보드 위에 머무르세요."
        }, 
        source: "Andrew Reynolds", 
        video: "Battle Commander" 
    }
  ],
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
            EN: "Pop and jump at the same time, not one after the other.",
            KR: "팝과 점프를 동시에 하세요."
        }, 
        source: "Rodney Mullen", 
        video: "Ollie Advice" 
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