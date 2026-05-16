const fs = require('fs');
const path = '/home/philmong/projects/Aura/server/src/index.ts';
let content = fs.readFileSync(path, 'utf8');

// 🛡️ [Emergency Fix] 중복 삽입된 코드 블록 제거
// ");" 와 "import jwt" 사이의 불필요한 공백과 중복 구문 소탕
const targetErrorPattern = ");\n;\nimport jwt from 'jsonwebtoken';";
const cleanReplacement = ");";

if (content.includes(targetErrorPattern)) {
    // 첫 번째 중복 블록을 찾아서 그 이후의 잘못된 삽입본을 제거
    // 실제로는 index.ts의 중간에 imports가 다시 시작되는 지점을 찾아야 함
    const lines = content.split('\n');
    let duplicateStartLine = -1;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('import jwt from') && i > 50) { // 파일 초반부가 아닌 중간에 imports가 나오면 중복임
            duplicateStartLine = i;
            break;
        }
    }

    if (duplicateStartLine !== -1) {
        // 중복 시작점부터 다음 유효한 핸들러 시작점 전까지 삭제하거나, 
        // 아예 정밀하게 해당 블록만 소탕
        console.log(`🚀 Found duplicate imports starting at line ${duplicateStartLine + 1}. Cleaning up...`);
        
        // 간단한 해결책: 잘못 삽입된 특정 패턴을 교체
        content = content.replace("});\n;\nimport jwt from 'jsonwebtoken';", "});");
        // 중복된 미들웨어 설정부 등도 제거해야 함. 
        // 하지만 일단 구문 에러부터 잡고 다시 정렬하겠습니다.
        
        // 더 확실한 방법: 중복된 import 구문들을 모두 제거
        const importsToRemove = [
            "import jwt from 'jsonwebtoken';",
            "import { authenticateToken, AuthRequest } from './middleware/auth.js';",
            "import usersRouter from './routes/users.js';",
            "import permissionsRouter from './routes/permissions.js';",
            "import brainstormRouter from './routes/brainstorm.js';",
            "import quickbuyRouter from './routes/quickbuy.js';",
            "import tacticalRouter from './routes/tactical.js';",
            "import { execSync } from 'child_process';",
            "const app = express();",
            "const prisma = new PrismaClient();",
            "const PORT = Number(process.env.PORT) || 3002;",
            "app.use(cors());",
            "app.use(express.json());"
        ];

        // 파일 중간(320번대 이후)에서 발견되는 이 패턴들을 공백으로 처리
        let newContent = content;
        // ... (생략하고 그냥 정밀 치환 사용)
    }
}

// 🛡️ [Final Clean] 수동으로 확인된 중복 구간 통째로 제거
const duplicatedBlockStart = "});\n;\nimport jwt from 'jsonwebtoken';";
const duplicatedBlockEnd = "app.use('/api/tactical', tacticalRouter);";

const startIdx = content.indexOf(duplicatedBlockStart);
const endIdx = content.indexOf(duplicatedBlockEnd);

if (startIdx !== -1 && endIdx !== -1 && startIdx < endIdx) {
    const part1 = content.substring(0, startIdx + 3); // "});" 까지 보존
    const part2 = content.substring(endIdx + duplicatedBlockEnd.length);
    fs.writeFileSync(path, part1 + part2);
    console.log('✅ Success: Emergency cleanup of duplicated code blocks completed.');
} else {
    console.log('❌ Error: Could not pinpoint the duplicated block.');
}
