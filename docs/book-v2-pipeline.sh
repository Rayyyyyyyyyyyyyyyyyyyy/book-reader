#!/bin/zsh
# 新書《把自己的部分做完》逐章寫作流程；說明見 docs/book-v2-workflow.md
#
# 用法：
#   docs/book-v2-pipeline.sh full  <NN> <檔名標題> <章卡名稱> <目標字數>   寫作→讀者→編輯→潤飾→稽核
#   docs/book-v2-pipeline.sh expand <NN> <檔名標題> <章卡名稱> <目標字數>  擴寫既有章→讀者→編輯→潤飾→稽核
#   docs/book-v2-pipeline.sh audit <NN> <檔名標題> <章卡名稱>              只跑一致性稽核
#   docs/book-v2-pipeline.sh reflect <NN> <檔名標題> <章卡名稱> <字數>     章末 ## 回頭看 的五步
# 例：
#   docs/book-v2-pipeline.sh full 07 "住在一起以後" "第七章｜住在一起以後" "8,000–9,000"
set -u
MODE="$1"; NN="$2"; TITLE="$3"; CARD="$4"; TARGET="${5:-}"
REPO=/Users/ray.shao/book-reader
OUT="book-reader/book-v2/${NN}-${TITLE}.md"
FB="book-reader/book-v2/_feedback"
CONT="book-reader/book-v2/_continuity.md"
SCENES="${FB}/${NN}-scenes.md"
GENERAL="docs/chapter/00-總則.md"
CONCEPTS="docs/chapter/觀念核對.md"
CARDFILE=$(cd "$REPO" && ls docs/chapter/${NN}-*.md 2>/dev/null | grep -v 總則 | head -1)
nb() { local n=$((10#$NN + $1)); (( n < 0 )) && return; (cd "$REPO" && ls book-reader/book-v2/$(printf %02d $n)-*.md 2>/dev/null | head -1); }
PREV=$(nb -1); PREV2=$(nb -2); NEXT=$(nb 1)
NEIGHBORS="${PREV:+前一章 ${PREV}}${NEXT:+、後一章 ${NEXT}}"
LOG="${BOOK_V2_LOG:-$HOME/.cache/book-v2-logs}"
mkdir -p "$REPO/$FB" "$LOG"

# 作者手改句清單：從 commit 訊息含 hand edit 的 commit 取出新增行，只留現在仍在正文裡的句子
AUTHOR="$LOG/${NN}-author-lines.md"
{
  echo "# 作者手改或確認過的句子（${OUT}）"
  echo "以下句子原樣保留；若它們與事實矛盾，列入「留給作者決定」並附建議改法，不直接改。"
  echo
  (cd "$REPO" && git log -i --grep="hand edit" --format=%H --follow -- "$OUT" 2>/dev/null \
    | while read c; do git show -U0 --format= "$c" -- "$OUT" 2>/dev/null; done \
    | grep '^+[^+]' | sed 's/^+//' | grep -v '^[[:space:]]*$' | sort -u \
    | while IFS= read -r l; do grep -qxF -- "$l" "$OUT" 2>/dev/null && echo "- $l"; done)
} > "$AUTHOR"

# 每一步都是新的 codex session，避免上下文污染
run() { # step name, prompt
  echo "=== [$NN] $1 start $(date +%T)"
  # 輸出同時顯示在 terminal 並存成 log
  codex exec -m gpt-5.6-sol -c model_reasoning_effort="high" -C "$REPO" -s workspace-write --color never \
    -o "$LOG/${NN}-$1.last.md" "$2" 2>&1 | tee "$LOG/${NN}-$1.log"
  local rc=${pipestatus[1]}
  echo "=== [$NN] $1 end rc=$rc $(date +%T)"
  # Codex 偶爾漏掉 book-reader/ 前綴，把檔案寫到 repo 根目錄的 book-v2/；移到 log 並警告
  if [[ -d "$REPO/book-v2" ]]; then
    mkdir -p "$LOG/stray"; mv "$REPO/book-v2" "$LOG/stray/${NN}-$1-$(date +%H%M%S)"
    echo "!!! [$NN] $1 wrote files to repo-root book-v2/ (moved to $LOG/stray); check the real output path"
  fi
  [[ $rc -ne 0 ]] && { tail -30 "$LOG/${NN}-$1.log"; exit $rc; }
}

COUNT="字數計法：不含標題行與所有空白，含標點（\`sed 1d 檔案 | tr -d '[:space:]' | wc -m\`）。"

LENGTH="篇幅：全書目標 10–12 萬字，本章目標 ${TARGET} 字。${COUNT}
長度來自場景完整展開，不是形容詞、同義反覆或回看說理：
- 章卡的主要場次寫成「場景」而非「摘要」：有時間、地點、進場與離場，對白之間有動作、停頓與距離的變化，讓讀者和人物一起經過那段時間
- 用具體、屬於那個年代與處境的物件、聲音、光線、氣味、身體感受錨定畫面；細節要有作用（揭露人物、改變關係、之後會回來），不堆砌
- 日常與甜蜜可以完整發生，讓兩人為什麼喜歡彼此被讀者親身經歷
- 摘要只用在真正需要跳過的時間；每次跳接後，盡快落回一個具體的時刻
- 回看聲音仍然短，不以說理灌字數"

COMMON="新書《把自己的部分做完》是經使用者授權的改編敘事書稿。章節腳本已分檔：總則 ${GENERAL}（寫作總則、章末回看拆解、全書進程、篇幅），本章章卡 ${CARDFILE}；除非本步驟另外指定，不要讀 docs/chapter.md 或其他章卡。跨章已定的事實與資訊邊界記在 ${CONT}；本章場景表在 ${SCENES}；作者手改句清單在 ${AUTHOR}（清單內的句子原樣保留）。docs/book-v2-workflow.md 的「使用者修稿偏好」與「一致性清單」必須遵守。章末若已有 \`## 回頭看\` 一節，除非本步驟明說要處理它，否則不要修改。所有書稿與回饋檔都在 book-reader/book-v2/ 底下，寫檔時使用完整路徑；repo 根目錄沒有 book-v2/，不要在那裡建立檔案。不要修改 docs/、book-reader/book/、book-reader/is-me/ 以及其他章節檔。"

CONSISTENCY="一致性要求：
- 細節要從已建立的設定推出來，不從類型的預設想像補上（例如已設定為豪華露營，就不會自己煮鍋、在帳篷外刷牙）
- 物件歸屬：照片是誰的手機拍的、東西是誰帶的、誰付的錢，前後一致；只在可能混淆時交代，不要每次都寫「自己的手機」這類補充
- 時間、天氣與身體狀態的延續合理（前一晚淋濕的外套，隔天晚上不會還在滴水）
- 資訊邊界：人物只能知道自己實際得知的事；他沒說出口的念頭、願望、計畫，她不知道；她沒說的，他也只能推測
- 對白的呼應與笑點讀得出在接哪一句；動作順序可以演出來（坐在駕駛座不能替副駕開門）
- 年代器物的操作合乎實際（按鍵手機是打一個字要連按好幾下）
- 擴寫時，舊稿的摘要句若已被新場景完整演出，要刪去摘要，不能讓同一件事發生兩次；同一個問題或玩笑不要在同一場對話裡出現兩次
- 文中提到的字數、次數、時長等數量要與實際內容相符（「我喜歡妳」是四個字）
- 同一類場景（重訪同一地點、認錯人、看著別的情侶）不在同一章完整演兩次；章卡寫「選一次」就只展開一次，其餘以一兩句帶出差異"

audit() {
run audit "對 ${OUT} 做一致性稽核。這一步只抓事實矛盾並做最小修正，不改文風、不刪減或擴寫、不處理結構與觀念。
${COMMON}
${CONSISTENCY}
做法：
1. 讀 ${CONT}、${SCENES}（若存在）、${CARDFILE}、前兩章（${PREV2:+${PREV2}、}${PREV}）與本章全文
2. 從頭到尾逐段讀本章，建立帳本：地點與場地配備、時間與天氣、每個物件的來源與歸屬、每個人在每個時點知道與不知道的事、跨章沿用的事實
   並逐項做以下機械檢查，每項在稽核報告寫出檢查結果：
   a. 對白中每一次提到往事或對方的心情，核對說話者是否在場或曾被告知（例如他只在心裡想過的事，她不能說出來）
   b. 每一段新展開的場景，搜尋同一事件在前後是否還有一句舊摘要，同一動作不能發生兩次
   c. 「剛才、一路、中午、那晚、上次」等時間指示詞與實際經過的時間相符
   d. 人物姿勢與位置（站、坐、手上拿著什麼、手機在哪）逐段延續
   e. 你／妳等代名詞與稱呼對象一致
   f. 與前兩章比對，同一個玩笑、梗或話題（例如拖延作業）不能連續多章重複使用
3. 列出所有矛盾：章內前後、與前文、與 ${CONT}、資訊邊界越界、動作順序演不出來、對白呼應接不上
4. 逐項以最小改動修正正文，刪改後接好相鄰句子；修正若會改變情節或章卡事件，只記錄不修改。作者手改句清單 ${AUTHOR} 內的句子不直接改，列入「留給作者決定」並附建議改法
5. 把本章的「資訊邊界」（沒說出口的事、誰不知道什麼）補進 ${CONT} 的本章小節；若修正改動了事實，同步更新
6. 寫 ${FB}/${NN}-audit.md：帳本摘要、矛盾清單（原句→修改後／未修改原因）
完成後簡短回報修正了幾處、有哪些留給作者決定。"
}

if [[ "$MODE" == "audit" ]]; then
  audit
  echo "=== [$NN] audit done"
  exit 0
fi
# ── 章末回看拆解 ──────────────────────────────────────────
# reflect：在既有章節末尾寫 `## 回頭看`，五步只處理這一節（部稿已取消）
if [[ "$MODE" == "reflect" ]]; then
  [[ -z "$TARGET" ]] && { echo "usage: $0 reflect NN TITLE CARD TARGET"; exit 2; }
  REFLECTIONS="$LOG/reflections.md"
  (cd "$REPO" && for f in book-reader/book-v2/[0-9][0-9]-*.md; do [[ "$f" == "$OUT" ]] && continue; grep -q "^## 回頭看" "$f" && { echo "# $f"; awk '/^## 回頭看/{x=1} x' "$f"; echo; }; done) > "$REFLECTIONS"
  if true; then
    K="${NN}-reflect"
    SCOPE="只處理 ${OUT} 末尾的 \`## 回頭看\` 一節；故事正文一字不動。"
    WHAT="第 ${NN} 章「${CARD}」章末的回看拆解"
    RULES="依 ${GENERAL}「核心困境與回看聲音」下的「章末回看拆解」與本章章卡 ${CARDFILE}：篇幅 ${TARGET} 字（只計這一節）；由現在的我直接對讀者說話，從本章核心困境拆一個機制，對照 ${CONCEPTS} 的「初版觀念保留核對」選本章主要驗收的觀念，一節只一個主軸；用「你／我們」讓讀者代入，「我」承認自己的參與；可給一個今天就能做的小動作或自問句，不做表格或練習清單；相關工具只取一個區分或一個動作；只用一兩句點到故事畫面，不重述情節；不替她下結論；聲音依 \$rui-xuan-book-v2 的反思隨筆，不喊口號、不說教。其他章已寫好的 \`## 回頭看\` 集中在 ${REFLECTIONS}，不要與它們的主軸或句子重複；不必讀其他章的故事正文。
口吻與密度以第一章的 \`## 回頭看\`（作者已校閱）為範本。另外遵守：
- 不照搬章卡或觀念核對表的分析詞（例如約定的範圍、履行、續期、詮釋、共同確認、內耗、控制），改成人回想自己時會說的話
- 故事只點一兩個畫面當錨點，不按時間順序重述本章；不重複故事裡已經寫過的回看句
- 至少一個具體畫面當入口，結尾留一個讀者可以問自己的問題或今天能做的小動作
- 不為了公平替每一方補免責句；「不等於……也不表示……」這類兩邊都顧的平衡句全節最多一次
- 一節只講一件事，講清楚就停，寧可短"
  fi
  run ${MODE} "使用 \$rui-xuan-book-v2（.agents/skills/rui-xuan-book-v2/SKILL.md）撰寫${WHAT}。
${COMMON}
${RULES}
${SCOPE}
寫完量字數（只計 \`## 回頭看\` 一節，不含標題行與空白），須落在 ${TARGET}。完成後簡短回報：主軸、對應的觀念、字數。"
  run ${MODE}-reader "使用 \$ai-reader（.agents/skills/ai-reader/SKILL.md），以一般讀者的身份讀 ${OUT}（${WHAT}；請先讀完該章故事再讀章末一節）。不要讀 docs/chapter/ 的任何檔案。
回饋寫到 ${FB}/${K}-reader.md，只寫這個檔。內容：這一節讓你多理解了什麼、能不能帶走一個觀念或做法；哪裡像說教、口號、重述故事或替她下結論；機制講得準不準、有沒有過度簡化、有沒有交代適用邊界；和故事的銜接是否自然；與書中其他回看是否重複。區分原始反應與推測原因，不改稿。"
  run ${MODE}-editor "使用 \$ai-editor（.agents/skills/ai-editor/SKILL.md）判讀 ${FB}/${K}-reader.md，對照 ${OUT}、${GENERAL} 的章末回看拆解、${CARDFILE}、${CONCEPTS}、.agents/skills/rui-xuan-book-v2/SKILL.md、docs/book-v2-workflow.md 的使用者修稿偏好。${SCOPE}
判讀寫到 ${FB}/${K}-editor.md，只寫這個檔：合併意見並分級（必須處理／建議處理／暫時觀察／不建議修改）；補上讀者沒提的問題（觀念錯誤或過度簡化、替她定性、與故事事實不符、說白、重複其他章、字數不在 ${TARGET}）；列出要保留的句子與修訂清單。"
  run ${MODE}-polish "使用 \$rui-xuan-book-v2 依 ${FB}/${K}-editor.md 修訂${WHAT}。
${COMMON}
${RULES}
${SCOPE}
執行「必須處理」與「建議處理」，保留編輯指定的句子；完成後量字數須落在 ${TARGET}；在 ${FB}/${K}-editor.md 末尾追加「## 潤飾紀錄」。"
  run ${MODE}-audit "對${WHAT}做事實稽核，只抓與故事事實、連續性（${CONT}）或資訊邊界不符之處並最小修正；不改文風與觀點。${SCOPE}
核對：提到的故事細節是否與正文一致；是否把她的動機或心情寫成確定事實；是否提到人物當時不可能知道的事而沒有標明是現在的理解；作者手改句清單 ${AUTHOR} 內的句子不改，列入留給作者決定。結果寫到 ${FB}/${K}-audit.md。"
  echo "=== [$NN] ${MODE} done"
  exit 0
fi

[[ "$MODE" != "full" && "$MODE" != "expand" || -z "$TARGET" ]] && { echo "usage: $0 full|expand|audit NN TITLE CARD [TARGET]"; exit 2; }

if [[ "$MODE" == "expand" ]]; then
run expand "使用 \$rui-xuan-book-v2（.agents/skills/rui-xuan-book-v2/SKILL.md）的「改編敘事書稿」分流，把已完成的 ${OUT} 擴寫到本章目標字數。這不是重寫：以現稿為底，把摘要帶過的時刻展開成場景。
${COMMON}
${LENGTH}
${CONSISTENCY}
動筆前讀：${GENERAL}、${CARDFILE}、${CONT}、${AUTHOR}、相鄰章節（${NEIGHBORS}；擴寫不能與它們衝突），需要素材時再查 book-reader/is-me/story-base.txt、docs/my-story/ 中相關章稿。
要求：
- 作者手改句清單 ${AUTHOR} 內的句子保留原樣，擴寫圍繞它們展開，不改回、不換句
- 保留現稿所有事件、先後、已成立的事實與有效對白；不改變章卡事件與停點，也不新增會改變後續章節事實的情節
- 先寫場景表 ${SCENES}：列出本章 3–5 個要完整展開的場景（優先是現稿以幾行摘要帶過、章卡卻需要讀者親身經過的時刻），每場記地點與場地配備、時間與天氣、在場人物、關鍵物件與其歸屬、兩人各自此時知道與不知道的事
- 照場景表展開；新增的細節要合乎年代與人物處境，並與前後章一致
- 本章新增、後續需沿用的事實追加到 ${CONT} 的本章小節，並補上「資訊邊界」：沒說出口的事、誰不知道什麼
- 完成後量字數，須達 ${TARGET} 下限；不足時繼續把摘要展開成場景，而非加形容
完成後簡短回報：擴寫前後字數、展開了哪些場景、新增的連續性設定、刻意未處理的問題。"
else
run write "使用 \$rui-xuan-book-v2（.agents/skills/rui-xuan-book-v2/SKILL.md）的「改編敘事書稿」分流，撰寫章卡「${CARD}」的正文初稿。
${COMMON}
${LENGTH}
${CONSISTENCY}
動筆前讀：${GENERAL}、${CARDFILE}、${CONT}、前一章 ${PREV}（需要時再往前查一章），以及素材 book-reader/is-me/story-base.txt、docs/my-story/ 中相關章稿、book-reader/is-me/Rui-Xuan-生命素材.md 的相關條目。
要求：
- 先寫場景表 ${SCENES}：列出本章 3–5 個要完整展開的場景，每場記地點與場地配備、時間與天氣、在場人物、關鍵物件與其歸屬、兩人各自此時知道與不知道的事。正文照場景表寫
- 依章卡的核心困境、場次、回看、停點與交接寫。回看欄是暫定落點，不是配額
- 觀念核對表只在初稿完成後自我驗收，不為補觀念加戲
- 正文寫到 ${OUT}，第一行為 \`# ${CARD}\`
- 本章新定下、後續章節需沿用的事實，追加到 ${CONT} 的本章小節（條列、只記事實），並另列「資訊邊界」：沒說出口的事、誰不知道什麼
- 完成後量字數；未達 ${TARGET} 下限時，回頭把仍是摘要的段落展開成場景，而非加形容
完成後簡短回報：字數、主要場景、新增的連續性設定、刻意未處理的問題。"
fi

run reader "使用 \$ai-reader（.agents/skills/ai-reader/SKILL.md）的判斷力，以一般讀者的身份讀 ${OUT}（新書正文，改編敘事）。必要時參考前一章 ${PREV} 了解脈絡，但以「第一次讀到這章的讀者」回應，不要讀 docs/chapter/ 與場景表，避免用作者意圖替原稿補完。
回饋寫到 ${FB}/${NN}-reader.md，只寫這個檔，不改正文。內容包含：
- 逐段閱讀反應：哪裡被吸住、哪裡卡住、出戲、看不懂、覺得重複或說教；引用原句定位
- 畫面感：哪些段落看得見、聽得見、身在現場；哪些段落像被告知的摘要，讓你想「停下來看這一幕」卻被帶過
- 人物是否可信、動機是否看得懂，兩人各自的立場與選擇有沒有被看見
- 情節與時間是否清楚；有沒有讀起來前後不合、動作演不出來的地方；hook 是否讓人想讀下一章、是否有兌現
- 書中觀念（責任、界線、控制、需求等）出現時是否自然、是否過度簡化或說教
- 讀完留下的整體感受與最想問作者的問題
區分自己的原始反應與推測原因，不替作者改稿。"

run editor "使用 \$ai-editor（.agents/skills/ai-editor/SKILL.md），從編輯角度判讀讀者回饋 ${FB}/${NN}-reader.md，對照正文 ${OUT}、場景表 ${SCENES}、總則 ${GENERAL}、本章章卡 ${CARDFILE}、${CONT}，以及 .agents/skills/rui-xuan-book-v2/SKILL.md 的聲音規則。
${LENGTH}
判讀寫到 ${FB}/${NN}-editor.md，只寫這個檔，不改正文。內容包含：
- 先量目前字數，對照目標 ${TARGET}
- 合併讀者意見，對每項給「必須處理／建議處理／暫時觀察／不建議修改」與理由；區分共通障礙與個人偏好
- 分開判斷兩種問題：同義反覆、過度解釋（刪）；場景質地不足、摘要帶過應展開的時刻（補）。不要只給刪減建議
- 補上讀者沒提、但編輯看到的問題：與章卡/連續性/前文衝突、視角越界（寫出她的內心、提前塞事後理解）、破折號或句尾標點等違反 skill 的地方（逐行事實核對另有稽核步驟，這裡看到仍要列）
- 需要保留的有效段落與句子
- 依影響範圍與修改成本排出修訂清單（具體到段落與策略），其中列出要展開成場景的段落與展開方向；清單執行後字數應落在 ${TARGET}"

run polish "使用 \$rui-xuan-book-v2（.agents/skills/rui-xuan-book-v2/SKILL.md）依編輯判讀 ${FB}/${NN}-editor.md 潤飾 ${OUT}。
${COMMON}
${LENGTH}
${CONSISTENCY}
要求：
- 執行「必須處理」與「建議處理」的修訂清單，包括場景展開；「暫時觀察／不建議修改」不動。編輯要保留的段落不要改壞
- 局部修改依 skill 的「依註解修稿」規則：按引文定位，刪改後接好相鄰段落，不為修一處而增加解釋或抽象度
- 新增或大幅展開場景時，先讀場景表與全章中所有提到同一物件、地點、事件的段落，新內容必須與它們一致；並把新場景補進 ${SCENES}
- 完成後量字數，須落在 ${TARGET}；不足時優先展開仍是摘要的場景
- 若修訂改動了具體事實或資訊邊界，同步更新 ${CONT}
- 最後在 ${FB}/${NN}-editor.md 末尾追加「## 潤飾紀錄」，逐項註明已處理／未處理及原因，並記錄潤飾後字數
完成後簡短回報主要改動與字數。"

audit

echo "=== [$NN] pipeline done"
sed 1d "$REPO/$OUT" | tr -d '[:space:]' | wc -m
