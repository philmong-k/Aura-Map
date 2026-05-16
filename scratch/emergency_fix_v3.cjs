const fs = require('fs');
const path = '/home/philmong/projects/Aura/server/src/index.ts';
let content = fs.readFileSync(path, 'utf8');

// 🛡️ [Emergency Fix v3] 누락된 괄호 및 에러 처리 블록 복구
const targetLine = "updated_at: finalRecord?.updatedAt \n    });";
const replacement = `      updated_at: finalRecord?.updatedAt 
    });
  } catch (error) {
    console.error('Save Map Error:', error);
    res.status(500).json({ error: '데이터 저장 중 내부 서버 오류가 발생했습니다.' });
  }
});`;

// 더 안전한 검색: res.json 호출 이후에 세미콜론(;)만 남은 지점을 찾아 복구
const badPattern = /res\.json\(\{[\s\S]+?updated_at: finalRecord\?\.updatedAt \n    \}\);\n;/;
const goodPattern = `res.json({ 
      message: '✅ 전술 데이터 저장 완료', 
      id: finalId, 
      version: finalVersion,
      user_id, 
      folder_name: finalRecord?.folderName, 
      title: finalRecord?.title, 
      visibility: finalRecord?.visibility, 
      updated_at: finalRecord?.updatedAt 
    });
  } catch (error) {
    console.error('Save Map Error:', error);
    res.status(500).json({ error: '데이터 저장 중 내부 서버 오류가 발생했습니다.' });
  }
});`;

if (content.includes("updated_at: finalRecord?.updatedAt \n    });\n;")) {
    content = content.replace("updated_at: finalRecord?.updatedAt \n    });\n;", goodPattern);
    fs.writeFileSync(path, content);
    console.log('✅ Success: Missing catch block and closing braces restored.');
} else {
    // 만약 줄바꿈이 다를 경우를 대비한 2차 시도
    const simpleTarget = "updated_at: finalRecord?.updatedAt \n    });";
    if (content.includes(simpleTarget)) {
         content = content.replace(simpleTarget, goodPattern);
         fs.writeFileSync(path, content);
         console.log('✅ Success: Missing block restored via secondary match.');
    } else {
        console.log('❌ Error: Could not find the truncated response block.');
    }
}
