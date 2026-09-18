#!/bin/zsh
# 新書《把自己的部分做完》逐章寫作流程；說明見 docs/book-v2-workflow.md
#
# 用法：
#   docs/book-v2-pipeline.sh full  <NN> <檔名標題> <章卡名稱> <目標字數>   寫作→讀者→編輯→潤飾→稽核
#   docs/book-v2-pipeline.sh audit <NN> <檔名標題> <章卡名稱>              只跑一致性稽核
# 例：
#   docs/book-v2-pipeline.sh full 07 "住在一起以後" "第七章｜住在一起以後" "8,000–9,000"
set -u
MODE="$1"; NN="$2"; TITLE="$3"; CARD="$4"; TARGET="${5:-}"
REPO=/Users/ray.shao/book-reader
OUT="book-reader/book-v2/${NN}-${TITLE}.md"
FB="book-reader/book-v2/_feedback"
CONT="book-reader/book-v2/_continuity.md"
SCENES="${FB}/${NN}-scenes.md"
LOG="${BOOK_V2_LOG:-$HOME/.cache/book-v2-logs}"
mkdir -p "$REPO/$FB" "$LOG"

# 每一步都是新的 codex session，避免上下文污染
run() { # step name, prompt
  echo "=== [$NN] $1 start $(date +%T)"
  codex exec -m gpt-5.6-sol -c model_reasoning_effort="high" -C "$REPO" -s workspace-write --color never \
    -o "$LOG/${NN}-$1.last.md" "$2" > "$LOG/${NN}-$1.log" 2>&1
  local rc=$?
  echo "=== [$NN] $1 end rc=$rc $(date +%T)"
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

COMMON="新書《把自己的部分做完》是經使用者授權的改編敘事書稿。章節腳本：docs/chapter.md（寫作總則、全書進程、章卡「${CARD}」、初版觀念核對、連續性紀錄、篇幅）。已完成的前文在 book-reader/book-v2/（依檔名序號）；跨章已定的事實與資訊邊界記在 ${CONT}；本章場景表在 ${SCENES}。不要修改 docs/、book-reader/book/、book-reader/is-me/ 以及其他章節檔。"

CONSISTENCY="一致性要求：
- 細節要從已建立的設定推出來，不從類型的預設想像補上（例如已設定為豪華露營，就不會自己煮鍋、在帳篷外刷牙）
- 物件歸屬：照片是誰的手機拍的、東西是誰帶的、誰付的錢，前後一致
- 時間、天氣與身體狀態的延續合理（前一晚淋濕的外套，隔天晚上不會還在滴水）
- 資訊邊界：人物只能知道自己實際得知的事；他沒說出口的念頭、願望、計畫，她不知道；她沒說的，他也只能推測
- 對白的呼應與笑點讀得出在接哪一句；動作順序可以演出來（坐在駕駛座不能替副駕開門）"

audit() {
run audit "對 ${OUT} 做一致性稽核。這一步只抓事實矛盾並做最小修正，不改文風、不刪減或擴寫、不處理結構與觀念。
${COMMON}
${CONSISTENCY}
做法：
1. 讀 ${CONT}、${SCENES}（若存在）、前一章與本章全文
2. 從頭到尾逐段讀本章，建立帳本：地點與場地配備、時間與天氣、每個物件的來源與歸屬、每個人在每個時點知道與不知道的事、跨章沿用的事實
3. 列出所有矛盾：章內前後、與前文、與 ${CONT}、資訊邊界越界、動作順序演不出來、對白呼應接不上
4. 逐項以最小改動修正正文，刪改後接好相鄰句子；修正若會改變情節或章卡事件，只記錄不修改
5. 把本章的「資訊邊界」（沒說出口的事、誰不知道什麼）補進 ${CONT} 的本章小節；若修正改動了事實，同步更新
6. 寫 ${FB}/${NN}-audit.md：帳本摘要、矛盾清單（原句→修改後／未修改原因）
完成後簡短回報修正了幾處、有哪些留給作者決定。"
}

if [[ "$MODE" == "audit" ]]; then
  audit
  echo "=== [$NN] audit done"
  exit 0
fi
[[ "$MODE" != "full" || -z "$TARGET" ]] && { echo "usage: $0 full|audit NN TITLE CARD [TARGET]"; exit 2; }

run write "使用 \$rui-xuan-book-v2（.agents/skills/rui-xuan-book-v2/SKILL.md）的「改編敘事書稿」分流，撰寫章卡「${CARD}」的正文初稿。
${COMMON}
${LENGTH}
${CONSISTENCY}
動筆前依 skill 讀：docs/chapter.md 全文、${CONT}、book-reader/book-v2/ 已完成的前文、book-reader/is-me/story-base.txt、docs/my-story/ 中相關章稿與 story.txt、book-reader/is-me/Rui-Xuan-生命素材.md。
要求：
- 先寫場景表 ${SCENES}：列出本章 3–5 個要完整展開的場景，每場記地點與場地配備、時間與天氣、在場人物、關鍵物件與其歸屬、兩人各自此時知道與不知道的事。正文照場景表寫
- 依章卡的核心困境、場次、回看、停點與交接寫。回看欄是暫定落點，不是配額
- 觀念核對表只在初稿完成後自我驗收，不為補觀念加戲
- 正文寫到 ${OUT}，第一行為 \`# ${CARD}\`
- 本章新定下、後續章節需沿用的事實，追加到 ${CONT} 的本章小節（條列、只記事實），並另列「資訊邊界」：沒說出口的事、誰不知道什麼
- 完成後量字數；未達 ${TARGET} 下限時，回頭把仍是摘要的段落展開成場景，而非加形容
完成後簡短回報：字數、主要場景、新增的連續性設定、刻意未處理的問題。"

run reader "使用 \$ai-reader（.agents/skills/ai-reader/SKILL.md）的判斷力，以一般讀者的身份讀 ${OUT}（新書正文，改編敘事）。必要時參考 book-reader/book-v2/ 的前文了解脈絡，但以「第一次讀到這章的讀者」回應，不要先讀 docs/chapter.md 的章卡與場景表，避免用作者意圖替原稿補完。
回饋寫到 ${FB}/${NN}-reader.md，只寫這個檔，不改正文。內容包含：
- 逐段閱讀反應：哪裡被吸住、哪裡卡住、出戲、看不懂、覺得重複或說教；引用原句定位
- 畫面感：哪些段落看得見、聽得見、身在現場；哪些段落像被告知的摘要，讓你想「停下來看這一幕」卻被帶過
- 人物是否可信、動機是否看得懂，兩人各自的立場與選擇有沒有被看見
- 情節與時間是否清楚；有沒有讀起來前後不合、動作演不出來的地方；hook 是否讓人想讀下一章、是否有兌現
- 書中觀念（責任、界線、控制、需求等）出現時是否自然、是否過度簡化或說教
- 讀完留下的整體感受與最想問作者的問題
區分自己的原始反應與推測原因，不替作者改稿。"

run editor "使用 \$ai-editor（.agents/skills/ai-editor/SKILL.md），從編輯角度判讀讀者回饋 ${FB}/${NN}-reader.md，對照正文 ${OUT}、場景表 ${SCENES}、docs/chapter.md 的章卡「${CARD}」、寫作總則與連續性紀錄、${CONT}，以及 .agents/skills/rui-xuan-book-v2/SKILL.md 的聲音規則。
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
