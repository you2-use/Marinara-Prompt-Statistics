/* 프롬프트 통계 1.0.0 — full-page compatibility adapter for Marinara 2.5.2 */
const categories = [
  "프리셋",
  "사용자 지침",
  "캐릭터",
  "페르소나",
  "로어북",
  "기억",
  "최근 대화",
  "기타",
];
const english = [
  "Preset",
  "User instructions",
  "Character",
  "Persona",
  "Lorebook",
  "Memory",
  "Recent chat",
  "Other",
];
const palettes = [
  [
    "Bold",
    [
      "#273155",
      "#125393",
      "#18979A",
      "#818B4F",
      "#F36F63",
      "#E099AC",
      "#FBDA29",
      "#B5BAB6",
    ],
  ],
  [
    "Pink",
    [
      "#A85F6A",
      "#EB6777",
      "#F36F63",
      "#EA82A7",
      "#EE6D8B",
      "#F3A8C4",
      "#F7A29D",
      "#F48E9A",
    ],
  ],
  [
    "Earth",
    [
      "#CB997E",
      "#DDBEA8",
      "#FFE7D6",
      "#B6B7A5",
      "#A6A58C",
      "#6B705D",
      "#B1A7A5",
      "#6C584A",
    ],
  ],
  [
    "Rainbow",
    [
      "#F74245",
      "#F2732B",
      "#F7961E",
      "#FAC64E",
      "#8FBE6E",
      "#45A989",
      "#277DA1",
      "#55758E",
    ],
  ],
  [
    "Blue",
    [
      "#04045E",
      "#023E89",
      "#0277B6",
      "#0395C7",
      "#06B4D8",
      "#4BCAE3",
      "#91E0EE",
      "#CAEFF7",
    ],
  ],
  [
    "Soft Pastel",
    [
      "#F5EBC8",
      "#D5D5D7",
      "#EBD8DC",
      "#F0EFEC",
      "#D4E4F1",
      "#F0D9CC",
      "#C9D3C0",
      "#DBD4DC",
    ],
  ],
  [
    "Vintage Pastel",
    [
      "#EDE992",
      "#F6D0E1",
      "#B0B0AB",
      "#BED390",
      "#CDC2D3",
      "#6D5B97",
      "#F8B2A8",
      "#3F3D55",
    ],
  ],
];
const ko =
  !document.documentElement.lang ||
  document.documentElement.lang.startsWith("ko");
const tr = (a, b) => (ko ? a : b);
const names = ko ? categories : english;
function normalizedLabel(label) {
  return label
    .normalize("NFC")
    .toLowerCase()
    .replace(/[ _-]+/g, " ")
    .trim();
}
const presetLabels = new Set([
  "system prompt",
  "role",
  "instructions",
  "commands",
  "guidelines",
  "npc playbook",
  "main instruction",
  "story maker",
  "character logic",
  "intimacy",
  "user agency",
  "world bias",
  "genre",
  "prose style",
  "dialogue",
  "tone",
  "gemini fix",
  "output format",
  "how to write",
  "free indirect discourse",
  "nsfw core",
  "hard constraints",
  "main rule",
  "main prompt",
  "character and story rule",
  "ooc instruction",
  "style rule",
  "writing style",
  "rp status",
  "thinking",
  "novel mode",
  "canon continuity",
  "characters living world",
  "prose quality",
  "scene craft dialogue",
  "progression echo",
  "selected style genre",
  "메인 프롬프트",
  "캐릭터스토리 지침",
  "작성 스타일",
]);
function infer(label) {
  const s = normalizedLabel(label);
  if (/^(chat history|last message)$/.test(s)) return 6;
  if (
    /^(chat summary|story summary|past events|current scene summary|recalled scenes|recalled messages|memory|memories|요약된 채팅|채팅 요약|기억)$/.test(
      s,
    )
  )
    return 5;
  if (
    /^(setting|lore|lorebook|world info before|world info after|world info|월드인포|월드 인포|로어북|세계관)$/.test(
      s,
    )
  )
    return 4;
  if (/^(dialogue examples|example dialogue|mes example)$/.test(s)) return 2;
  if (
    /^(persona|persona info|user persona|persona profile|페르소나|페르소나 프로필)$/.test(
      s,
    )
  )
    return 3;
  if (
    /^(character|character info|character description|characters|character profile|캐릭터|캐릭터 프로필)$/.test(
      s,
    )
  )
    return 2;
  if (
    /^(?:author['’]?s? notes?|user instructions|custom instructions|작가\s*노트|사용자 지침)(?:$|[\s:：])/.test(
      s,
    )
  )
    return 1;
  if (presetLabels.has(s)) return 0;
  return 7;
}
function hasContent(text) {
  return (
    text.replace(/^[ \t]*<\/?[\p{L}_][\p{L}\p{N}_-]*>[ \t]*\r?$/gmu, "").trim()
      .length > 0
  );
}
function partition(messages) {
  const spans = [];
  let history = false;
  messages.forEach((m, mi) => {
    function add(start, end, label, cat, path = [label], basis) {
      if (end <= start) return;
      const text = m.content.slice(start, end);
      const visible = hasContent(text);
      spans.push({
        mi,
        start,
        end,
        label,
        role: m.role,
        text,
        cat,
        path,
        key: JSON.stringify(["path", m.role, path]),
        legacyKey: JSON.stringify([m.role, label]),
        visible,
        basis:
          basis ?? (!visible ? "structure" : cat === 7 ? "unknown" : "tag"),
      });
    }
    function parse(start, end) {
      const root = { children: [] },
        stack = [root];
      let fence = null;
      for (const match of m.content
        .slice(start, end)
        .matchAll(/^.*(?:\r?\n|$)/gm)) {
        const line = match[0].trim(),
          marker = line.match(/^(`{3,}|~{3,})/);
        if (marker) {
          if (!fence) fence = marker[1];
          else if (
            marker[1][0] === fence[0] &&
            marker[1].length >= fence.length
          )
            fence = null;
          continue;
        }
        if (fence) continue;
        const tag = line.match(/^<(\/?)([\p{L}_][\p{L}\p{N}_-]*)>$/u);
        if (!tag) continue;
        if (!tag[1]) {
          const node = {
            label: tag[2],
            start: start + match.index,
            children: [],
          };
          stack.at(-1).children.push(node);
          stack.push(node);
          if (stack.length > 128) {
            add(start, end, m.role, 7);
            return;
          }
        } else {
          const index = stack.findLastIndex((n) => n.label === tag[2]);
          if (index > 0) {
            stack[index].end = start + match.index + match[0].length;
            stack.length = index;
          }
        }
      }
      // Unpaired markers (e.g. <START>) remain text; paired descendants survive.
      function paired(nodes) {
        return nodes.flatMap((n) =>
          n.end === undefined ? paired(n.children) : [n],
        );
      }
      function visit(node, parents = [], inherited = 7) {
        const cat = infer(node.label),
          children = paired(node.children);
        const path = [...parents, node.label];
        // Lore can be a mixed group. Source leaves own their fields, including
        // persona example dialogue and tag-looking content inside memories.
        const effective = cat === 7 ? inherited : cat;
        if (
          (cat > 0 && cat !== 7 && normalizedLabel(node.label) !== "lore") ||
          !children.length
        ) {
          add(node.start, node.end, node.label, effective, path);
          return;
        }
        let at = node.start;
        for (const child of children) {
          add(
            at,
            child.start,
            node.label,
            effective === 0 && hasContent(m.content.slice(at, child.start))
              ? 0
              : 7,
            path,
          );
          visit(child, path, effective === 0 ? 0 : 7);
          at = child.end;
        }
        add(
          at,
          node.end,
          node.label,
          effective === 0 && hasContent(m.content.slice(at, node.end)) ? 0 : 7,
          path,
        );
      }
      function plain(a, b) {
        // Headings have hierarchy too. A persona heading owns deeper fields;
        // a generic group exposes its child headings. Roles alone prove nothing.
        const root = { children: [], start: a, end: b },
          stack = [root];
        let fence = null;
        for (const match of m.content
          .slice(a, b)
          .matchAll(/^.*(?:\r?\n|$)/gm)) {
          const line = match[0].trim(),
            marker = line.match(/^(`{3,}|~{3,})/);
          if (marker) {
            if (!fence) fence = marker[1];
            else if (
              marker[1][0] === fence[0] &&
              marker[1].length >= fence.length
            )
              fence = null;
            continue;
          }
          if (fence) continue;
          const heading = line.match(/^(#{1,6})\s+(.+?)(?:\s+#+)?$/);
          if (!heading) continue;
          const level = heading[1].length,
            pos = a + match.index;
          while (stack.length > 1 && stack.at(-1).level >= level)
            stack.pop().end = pos;
          const node = {
            label: heading[2],
            level,
            start: pos,
            end: b,
            children: [],
          };
          stack.at(-1).children.push(node);
          stack.push(node);
        }
        let at = a;
        for (const node of root.children) {
          add(at, node.start, m.role, 7);
          visit(node);
          at = node.end;
        }
        add(at, b, m.role, 7);
      }
      let at = start;
      for (const node of paired(root.children)) {
        plain(at, node.start);
        visit(node);
        at = node.end;
      }
      plain(at, end);
    }
    // Engine history wrappers span messages. Content inside is opaque to the
    // classifier; arbitrary names such as story_development are not aliases.
    let at = 0,
      fence = null;
    const opaque = [];
    for (const match of m.content.matchAll(/^.*(?:\r?\n|$)/gm)) {
      const line = match[0].trim(),
        marker = line.match(/^(`{3,}|~{3,})/);
      if (marker) {
        if (!fence) fence = marker[1];
        else if (marker[1][0] === fence[0] && marker[1].length >= fence.length)
          fence = null;
        continue;
      }
      if (fence) continue;
      if (!history) {
        const tag = line.match(/^<(\/?)([\p{L}_][\p{L}\p{N}_-]*)>$/u);
        if (tag) {
          const cat = infer(tag[2]);
          if (tag[1]) {
            const index = opaque.lastIndexOf(tag[2]);
            if (index >= 0) {
              opaque.length = index;
              continue;
            }
          } else if (
            opaque.length ||
            (cat >= 1 && cat <= 5 && normalizedLabel(tag[2]) !== "lore") ||
            normalizedLabel(tag[2]) === "last message"
          ) {
            opaque.push(tag[2]);
            continue;
          }
        }
        if (opaque.length) continue;
      }
      const open =
        /^<chat_history>$/i.test(line) || /^## Chat History$/i.test(line);
      const close = /^<\/chat_history>$/i.test(line);
      const last = /^(?:<last_message>|## Last Message)$/i.test(line);
      if (open && !history) {
        parse(at, match.index);
        at = match.index;
        history = true;
      } else if (close && history) {
        const end = match.index + match[0].length;
        add(at, end, "chat_history", 6);
        at = end;
        history = false;
      } else if (last && history) {
        add(at, match.index, "chat_history", 6);
        at = match.index;
        history = false;
        if (/^<last_message>$/i.test(line)) opaque.push("last_message");
      }
    }
    if (history) add(at, m.content.length, "chat_history", 6);
    else parse(at, m.content.length);
  });
  return spans;
}
function ruleCategory(span, rules, chat) {
  const matches = rules.filter(
    (r) =>
      (r.key === span.key || r.key === span.legacyKey) &&
      (r.chat === chat || r.chat === "*"),
  );
  const local = matches.filter((r) => r.chat === chat);
  const scoped = local.length ? local : matches;
  const exact = scoped.filter((r) => r.key === span.key);
  const cs = new Set(
    (exact.length ? exact : scoped).map((r) => (r.cat === 8 ? 2 : r.cat)),
  );
  return cs.size === 1 ? [...cs][0] : cs.size > 1 ? 7 : null;
}
// Textarea values normalize CRLF and CR. Translate selections back to the
// untouched prompt's UTF-16 coordinates before making any slices.
function originalRange(text, start, end) {
  const offsets = [0];
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "\r" && text[i + 1] === "\n") i++;
    offsets.push(i + 1);
  }
  return [offsets[start], offsets[end]];
}
function splitSpan(span, start, end) {
  if (
    !Number.isInteger(start) ||
    !Number.isInteger(end) ||
    start < 0 ||
    end > span.text.length ||
    start >= end
  )
    throw Error("range");
  const boundaries = new Set([span.text.length]);
  for (const { index } of new Intl.Segmenter(undefined, {
    granularity: "grapheme",
  }).segment(span.text))
    boundaries.add(index);
  if (!boundaries.has(start) || !boundaries.has(end)) throw Error("boundary");
  return [
    [0, start],
    [start, end],
    [end, span.text.length],
  ]
    .filter(([a, b]) => b > a)
    .map(([a, b]) => ({
      ...span,
      start: span.start + a,
      end: span.start + b,
      text: span.text.slice(a, b),
      visible: hasContent(span.text.slice(a, b)),
      split: true,
    }));
}
function record(value) {
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return {};
    }
  }
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}
function stringIds(value) {
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return [];
    }
  }
  return Array.isArray(value)
    ? [
        ...new Set(
          value.filter(
            (id) => typeof id === "string" && id.length > 0 && id.length <= 512,
          ),
        ),
      ]
    : [];
}
function referenceText(value, charName, userName) {
  if (typeof value !== "string") return "";
  // Only deterministic name macros are expanded here. Unknown/dynamic macros
  // are never evaluated, guessed or sent back through the prompt assembler.
  const text = value
    .replace(/\{\{\/\/[\s\S]*?\}\}/g, "")
    .replace(
      /\{\{\s*(char|charName|user|userName)\s*\}\}/gi,
      (all, name) => (/^char/i.test(name) ? charName : userName) || all,
    )
    .replace(/\r\n?/g, "\n")
    .trim();
  return /\{\{|\}\}/.test(text) ? "" : text;
}
function referenceCandidates(bundle) {
  const candidates = [],
    chat = record(bundle.chat),
    meta = record(chat.metadata);
  const cards = (bundle.characters ?? []).map((row) => ({
    row,
    data: record(row.data),
  }));
  const persona = record(bundle.persona);
  const primary =
    cards.find(({ row }) => row.id === bundle.characterId) ?? cards[0];
  const charName = primary?.data.name ?? "",
    userName = persona.name ?? "";
  const add = (text, cat, id, label, character = charName, role) => {
    text = referenceText(text, character, userName);
    if (text) candidates.push({ text, cat, id, label, role });
  };
  const profileFields = (data) => {
    const ext = record(data.extensions);
    return [
      data.description,
      data.personality,
      data.backstory ?? ext.backstory,
      data.appearance ?? ext.appearance,
      data.scenario,
    ];
  };
  const profile = (data, cat, id) => {
    const label = typeof data.name === "string" ? data.name : names[cat];
    const fields = profileFields(data);
    // Full profile candidates also cover short fields when the combined block
    // is distinctive. Individual fields support custom marker field subsets.
    const resolved = fields
      .map((v) => referenceText(v, cat === 2 ? data.name : charName, userName))
      .filter(Boolean);
    add(resolved.join("\n"), cat, id, label);
    for (const value of [
      ...fields,
      data.mes_example,
      data.system_prompt,
      data.post_history_instructions,
    ])
      add(value, cat, id, label, cat === 2 ? data.name : charName);
  };
  for (const { row, data } of cards) profile(data, 2, `character:${row.id}`);
  if (bundle.persona) profile(persona, 3, `persona:${bundle.persona.id}`);
  for (const entry of bundle.entries ?? [])
    add(
      entry.content,
      4,
      `lorebook:${entry.id}`,
      entry.comment || entry.name || names[4],
    );
  add(meta.authorNotes, 1, "author-notes", tr("작가 노트", "Author notes"));
  for (const message of bundle.messages ?? []) {
    if (!["user", "assistant"].includes(message.role)) continue;
    const owner = cards.find(({ row }) => row.id === message.characterId);
    add(
      message.content,
      6,
      `message:${message.id}`,
      tr("대화 원본", "Chat message"),
      owner?.data.name ?? charName,
      message.role,
    );
  }
  // Literal preset sections can identify suffix instructions merged into the
  // last user message. Choice/macro-heavy sections remain unclassified.
  for (const section of bundle.preset?.sections ?? []) {
    if (
      section.enabled === false ||
      section.enabled === "false" ||
      section.isMarker === true ||
      section.isMarker === "true"
    )
      continue;
    add(section.content, 0, `section:${section.id}`, section.name || names[0]);
  }
  return candidates;
}
function matchReferences(messages, candidates) {
  const views = messages.map((m) => {
    const text = m.content.replace(/\r\n?/g, "\n");
    let offsets;
    if (text !== m.content) {
      offsets = [0];
      for (let i = 0; i < m.content.length; i++) {
        if (m.content[i] === "\r" && m.content[i + 1] === "\n") i++;
        offsets.push(i + 1);
      }
    }
    return { text, offsets };
  });
  const found = [];
  let work = 0;
  for (const candidate of candidates) {
    const hits = [];
    if (!candidate.text || candidate.text.length > 2 * 1024 * 1024) continue;
    for (let mi = 0; mi < messages.length; mi++) {
      if (candidate.role && candidate.role !== messages[mi].role) continue;
      const { text, offsets } = views[mi];
      // ponytail: bounded exact matching, not a fuzzy search index. If larger
      // libraries reach this ceiling, add an indexed matcher with the same rules.
      work += text.length;
      if (work > 512 * 1024 * 1024) return { matches: [], limited: true };
      let at = text.indexOf(candidate.text);
      while (at >= 0) {
        const end = at + candidate.text.length;
        const before = text.slice(text.lastIndexOf("\n", at - 1) + 1, at);
        const nextLine = text.indexOf("\n", end);
        const after = text.slice(end, nextLine < 0 ? text.length : nextLine);
        const whole = text.trim() === candidate.text;
        if (
          !before.trim() &&
          !after.trim() &&
          (candidate.text.length >= 4 ||
            (candidate.cat === 6 && (whole || at === text.search(/\S/))))
        )
          hits.push({
            ...candidate,
            mi,
            start: offsets?.[at] ?? at,
            end: offsets?.[end] ?? end,
          });
        if (hits.length > 128) break;
        at = text.indexOf(candidate.text, at + 1);
      }
      if (hits.length > 128) break;
    }
    // Repeated data passages cannot identify which occurrence is the source.
    // A full chat message can repeat verbatim in separate provider messages.
    if (
      hits.length === 1 ||
      (candidate.cat === 6 &&
        hits.length <= 128 &&
        hits.every(
          (hit) =>
            hit.start === messages[hit.mi].content.search(/\S/) ||
            views[hit.mi].text.trim() === candidate.text,
        ))
    )
      found.push(...hits);
  }
  // Reject an entire overlapping component if different sources claim it as
  // different categories. The unclaimed remainder is never guessed as lore.
  const matches = [];
  found.sort((a, b) => a.mi - b.mi || a.start - b.start || b.end - a.end);
  let component = [];
  const flush = () => {
    if (!component.length) return;
    if (new Set(component.map((m) => m.cat)).size === 1) {
      const first = component[0];
      matches.push({ ...first, end: Math.max(...component.map((m) => m.end)) });
    }
    component = [];
  };
  let end = -1,
    mi = -1;
  for (const hit of found) {
    if (hit.mi !== mi || hit.start >= end) {
      flush();
      end = hit.end;
      mi = hit.mi;
    } else end = Math.max(end, hit.end);
    component.push(hit);
  }
  flush();
  return { matches, limited: false };
}
function applyReferences(spans, matches, rules, chat) {
  const output = [];
  for (const span of spans) {
    // Explicit user rules and existing source/history wrappers keep priority.
    if (
      ruleCategory(span, rules, chat) !== null ||
      (span.cat >= 1 && span.cat <= 6)
    ) {
      output.push(span);
      continue;
    }
    let at = span.start;
    const add = (start, end, match) => {
      if (end <= start) return;
      const text = span.text.slice(start - span.start, end - span.start);
      const source = match
        ? {
            cat: match.cat,
            label: match.label,
            path: [
              tr("원본 대조", "Source match"),
              names[match.cat],
              match.label,
            ],
            key: JSON.stringify(["source", span.role, match.cat, match.id]),
            legacyKey: "",
            basis: "reference",
          }
        : {};
      output.push({
        ...span,
        ...source,
        start,
        end,
        text,
        visible: hasContent(text),
      });
    };
    for (const match of matches) {
      if (match.mi !== span.mi || match.end <= at || match.start >= span.end)
        continue;
      const start = Math.max(at, match.start),
        end = Math.min(span.end, match.end);
      add(at, start);
      add(start, end, match);
      at = end;
    }
    add(at, span.end);
  }
  return output;
}
async function loadReferences(chatId, data, request, signal) {
  const budget = { remaining: 24 * 1024 * 1024 },
    bundle = {
      characters: [],
      entries: [],
      messages: [],
      characterId: data.characterId,
    };
  let partial = false;
  const read = async (path) => {
    if (signal.aborted || budget.remaining <= 0) {
      partial = true;
      return null;
    }
    try {
      const response = await marinara.fetch(path, {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
        redirect: "error",
        signal,
      });
      if (!response.ok) throw Error("reference");
      return await boundedJSON(response, budget);
    } catch {
      partial = true;
      return null;
    }
  };
  // Share identical reads only within this snapshot. Reopening always reads fresh data.
  const reads = new Map(),
    waiting = [];
  let running = 0;
  const get = (path) => {
    if (!reads.has(path)) {
      const ready = new Promise((resolve) => {
        const start = () => {
          running++;
          resolve();
        };
        if (running < 4) start();
        else waiting.push(start);
      });
      reads.set(
        path,
        ready
          .then(() => read(path))
          .finally(() => {
            running--;
            waiting.shift()?.();
          }),
      );
    }
    return reads.get(path);
  };
  const idPath = encodeURIComponent(chatId);
  bundle.chat = await get(`/api/chats/${idPath}`);
  if (
    !bundle.chat ||
    bundle.chat.id !== chatId ||
    bundle.chat.mode !== "roleplay"
  )
    return { candidates: [], partial: true };
  const meta = record(bundle.chat.metadata);
  const characterIds = stringIds(bundle.chat.characterIds);
  if (
    typeof data.characterId === "string" &&
    data.characterId.length <= 512 &&
    !characterIds.includes(data.characterId)
  )
    characterIds.push(data.characterId);
  if (characterIds.length > 12) partial = true;
  const ids = characterIds.slice(0, 12);
  const personaCharacter = bundle.chat.personaCharacterId;
  const personaId = bundle.chat.personaId;
  const presetId = bundle.chat.promptPresetId || meta.presetId;
  // These branches depend only on chat linkage; do not serialize unrelated sources.
  await Promise.all([
    (async () => {
      const [persona, preset] = await Promise.all([
        typeof personaCharacter === "string" && personaCharacter
          ? get(`/api/characters/${encodeURIComponent(personaCharacter)}`)
          : typeof personaId === "string" && personaId
            ? get(`/api/characters/personas/${encodeURIComponent(personaId)}`)
            : null,
        typeof presetId === "string" && presetId
          ? get(`/api/prompts/${encodeURIComponent(presetId)}/full`)
          : null,
      ]);
      if (persona && persona.id === (personaCharacter || personaId))
        bundle.persona = personaCharacter
          ? { ...record(persona.data), id: persona.id }
          : persona;
      if (
        preset &&
        preset.preset?.id === presetId &&
        Array.isArray(preset.sections)
      )
        bundle.preset = preset;
    })(),
    (async () => {
      const query = new URLSearchParams({
        limit: "32",
        offset: "0",
        active: "true",
        chatId,
        activeLorebookIds: stringIds(meta.activeLorebookIds).join(","),
        characterIds: [
          ...ids,
          ...(personaCharacter ? [personaCharacter] : []),
        ].join(","),
        personaId: personaCharacter ? "" : personaId || "",
      });
      const books = await get(`/api/lorebooks?${query}`);
      if (!books || !Array.isArray(books.items) || books.hasMore)
        partial = true;
      const bookIds = [
        ...new Set([
          ...stringIds(meta.activeLorebookIds),
          ...stringIds((books?.items ?? []).map((book) => book.id)),
        ]),
      ];
      if (bookIds.length > 32) partial = true;
      for (
        let offset = 0;
        offset < Math.min(bookIds.length, 32) && !signal.aborted;
        offset += 4
      ) {
        const pages = await Promise.all(
          bookIds
            .slice(offset, Math.min(offset + 4, 32))
            .map((id) =>
              get(`/api/lorebooks/${encodeURIComponent(id)}/entries`),
            ),
        );
        for (const entries of pages) {
          if (!Array.isArray(entries)) {
            partial = true;
            continue;
          }
          bundle.entries.push(
            ...entries.filter(
              (e) =>
                e && typeof e.id === "string" && typeof e.content === "string",
            ),
          );
        }
        if (bundle.entries.length > 2000) {
          bundle.entries.length = 2000;
          partial = true;
          break;
        }
      }
    })(),
    (async () => {
      let before = "";
      const messages = [];
      for (let page = 0; page < 4 && !signal.aborted; page++) {
        const query = new URLSearchParams({ limit: "250" });
        if (before) query.set("before", before);
        const rows = await get(`/api/chats/${idPath}/messages?${query}`);
        if (
          !Array.isArray(rows) ||
          !rows.every(
            (m) =>
              m &&
              typeof m.id === "string" &&
              typeof m.content === "string" &&
              typeof m.role === "string",
          )
        ) {
          partial = true;
          break;
        }
        messages.unshift(...rows);
        // For an explicitly selected historical answer, first locate its anchor.
        // Otherwise 250 recent messages is ample for the usual history window.
        const anchor = request.messageId
          ? messages.findIndex((m) => m.id === request.messageId)
          : -1;
        if (rows.length < 250 || !request.messageId || anchor >= 250) {
          if (rows.length === 250) partial = true;
          break;
        }
        if (page === 3) partial = true;
        const first = rows[0];
        if (typeof first.createdAt !== "string") {
          partial = true;
          break;
        }
        const cursor = `${first.createdAt}|${encodeURIComponent(first.id)}`;
        if (cursor === before) {
          partial = true;
          break;
        }
        before = cursor;
      }
      if (request.messageId) {
        const index = messages.findIndex((m) => m.id === request.messageId);
        if (index < 0) partial = true;
        else bundle.messages = messages.slice(0, index);
      } else if (data.source === "cached") {
        // The active answer is not input to its own request.
        const index = messages.findLastIndex((m) => m.role === "assistant");
        if (index >= 0) bundle.messages = messages.slice(0, index);
        else partial = true;
      } else bundle.messages = messages;
    })(),
    (async () => {
      // The only calls are scoped GETs. No scan/preview/generate routes are used.
      const rows = await Promise.all(
        ids.map((id) => get(`/api/characters/${encodeURIComponent(id)}`)),
      );
      bundle.characters = rows.filter((row, i) => row && row.id === ids[i]);
    })(),
  ]);
  if (signal.aborted) partial = true;
  return { candidates: referenceCandidates(bundle), partial };
}

function allocate(weights, total) {
  const sum = weights.reduce((a, b) => a + b, 0);
  if (!sum) return weights.map(() => 0);
  const raw = weights.map((w) => (w / sum) * total),
    a = raw.map(Math.floor);
  const order = raw
    .map((x, i) => ({ i, r: x - a[i] }))
    .sort((x, y) => y.r - x.r || x.i - y.i);
  for (let n = total - a.reduce((x, y) => x + y, 0), i = 0; i < n; i++)
    a[order[i % order.length].i]++;
  return a;
}
const weight = (text) => {
  let n = 0;
  for (const ch of text) {
    const c = ch.codePointAt(0);
    const inRange = (a, b) => c >= a && c <= b;
    n += [
      [0x1100, 0x11ff],
      [0x3130, 0x318f],
      [0xa960, 0xa97f],
      [0xac00, 0xd7af],
      [0xd7b0, 0xd7ff],
    ].some(([a, b]) => inRange(a, b))
      ? 50
      : [
            [0x3400, 0x4dbf],
            [0x4e00, 0x9fff],
            [0xf900, 0xfaff],
            [0x20000, 0x323af],
            [0x3040, 0x309f],
            [0x30a0, 0x30ff],
            [0x31f0, 0x31ff],
            [0xff66, 0xff9f],
            [0x1b000, 0x1b16f],
          ].some(([a, b]) => inRange(a, b))
        ? 67
        : 25;
  }
  return n;
};
let alive = true,
  pending = null,
  referenceController = null,
  sequence = 0,
  active = null,
  rules = [],
  saving = false,
  settingsReady = false;
const settings = marinara.storage.get().catch(() => ({}));
let palette = palettes[0];
let storageWrites = Promise.resolve();
function patchStorage(value) {
  // The host reads and merges each patch. Keep palette and rule writes in order.
  const write = storageWrites.then(() => marinara.storage.patch(value));
  storageWrites = write.catch(() => {});
  return write;
}
const originalFetch = window.fetch;
const existing = new WeakSet(document.querySelectorAll('[role="dialog"]'));
function element(tag, text, cls) {
  const e = document.createElement(tag);
  if (text !== undefined) e.textContent = text;
  if (cls) e.className = cls;
  return e;
}
function button(label, fn) {
  const b = element("button", label);
  b.type = "button";
  b.addEventListener("click", fn);
  return b;
}
function palettePicker(root, weights) {
  const picker = element("details", undefined, "ps-palette");
  const toggle = element("summary", undefined, "ps-palette-toggle");
  const bar = element("span", undefined, "ps-bar");
  bar.setAttribute("aria-hidden", "true");
  for (const [index, weight] of weights.entries()) {
    const part = element("span");
    part.style.flexGrow = weight;
    part.style.backgroundColor = `var(--ps-${index})`;
    bar.append(part);
  }
  toggle.append(bar);
  const choices = element("div", undefined, "ps-palette-choices");
  const feedback = element("p");
  feedback.setAttribute("role", "status");

  function applyPalette() {
    const [name, colors] = palette;
    toggle.setAttribute(
      "aria-label",
      `${tr("그래프 팔레트 변경", "Change chart palette")} · ${name}`,
    );
    colors.forEach((color, index) =>
      root.style.setProperty(`--ps-${index}`, color),
    );
    for (const choice of choices.children) {
      choice.setAttribute(
        "aria-pressed",
        String(choice.dataset.palette === name),
      );
    }
  }
  for (const entry of palettes) {
    const [name, colors] = entry;
    const choice = button(name, async () => {
      palette = entry;
      applyPalette();
      picker.open = false;
      toggle.focus();
      feedback.remove();
      try {
        await patchStorage({ promptStatsPalette: name });
      } catch {
        if (palette === entry) {
          feedback.textContent = tr(
            "팔레트를 저장하지 못했습니다.",
            "Could not save the palette.",
          );
          picker.after(feedback);
        }
      }
    });
    choice.className = "ps-palette-option";
    choice.dataset.palette = name;
    choice.setAttribute("aria-label", name);
    const swatches = element("span", undefined, "ps-palette-swatches");
    swatches.setAttribute("aria-hidden", "true");
    for (const color of colors) {
      const swatch = element("span");
      swatch.style.backgroundColor = color;
      swatches.append(swatch);
    }
    choice.append(swatches);
    choices.append(choice);
  }
  picker.append(toggle, choices);
  applyPalette();
  return picker;
}
function iconButton(label, path, fn) {
  const control = button(label, fn);
  control.className = "ps-icon-button";
  control.title = label;
  control.setAttribute("aria-label", label);

  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  const shape = document.createElementNS(ns, "path");
  shape.setAttribute("d", path);
  svg.append(shape);
  control.replaceChildren(svg);
  return control;
}
function restore() {
  if (!active) return;
  const a = active;
  active = null;
  a.root.remove();
  a.dialog.removeEventListener("keydown", a.keys, true);
  for (const [node, hidden] of a.hidden) {
    node.hidden = hidden;
    node.removeAttribute("data-ps-hidden");
  }
}
function mount(dialog, snapshot) {
  if (active) return;
  const children = [...dialog.children];
  if (children.length < 2) return;
  const root = element("section");
  root.dataset.promptStatsRoot = "";
  const hidden = children.slice(1).map((n) => [n, n.hidden]);
  const baseSpans = partition(snapshot.data.messages);
  let spans = applyReferences(
    baseSpans,
    snapshot.references?.matches ?? [],
    rules,
    snapshot.chat,
  );
  // Span objects are immutable; split/undo naturally use their own cache entries.
  const spanWeights = new WeakMap();
  let estimatedTotal;
  const overrides = new Map();
  let tab = "stats",
    undo = [];
  let editor = null;
  const selected = new Set();
  const toolbar = element("nav", undefined, "ps-tabs"),
    body = element("div", undefined, "ps-body"),
    status = element("p");
  status.setAttribute("role", "status");
  toolbar.setAttribute("aria-label", tr("프롬프트 보기", "Prompt views"));
  const tabs = [
    ["stats", tr("통계", "Statistics")],
    ["raw", tr("원문", "Original")],
    ["rules", tr("설정", "Settings")],
    ["native", tr("기본", "Default")],
  ].map(([view, label]) => {
    const control = button(label, () => {
      tab = view;
      render();
    });
    toolbar.append(control);
    return [view, control];
  });
  root.append(toolbar, body);
  const keys = (e) => {
    if (tab === "native") return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
      e.preventDefault();
      e.stopPropagation();
      tab = "raw";
      render();
      body.querySelector("input")?.focus();
    }
  };
  active = {
    root,
    dialog,
    hidden,
    keys,
    snapshot,
    finishReferences() {
      spans = applyReferences(
        baseSpans,
        snapshot.references?.matches ?? [],
        rules,
        snapshot.chat,
      );
      // Source loading has no editable statistics. Preserve searches and the native tab.
      if (tab === "stats") render();
    },
  };
  dialog.addEventListener("keydown", keys, true);
  function category(s, i) {
    if (overrides.has(i)) return overrides.get(i);
    return ruleCategory(s, rules, snapshot.chat) ?? s.cat;
  }
  function remember() {
    undo.push({ spans: spans.slice(), overrides: new Map(overrides) });
    // ponytail: keep the last 50 in-memory edits; use a delta history if larger sessions need it.
    if (undo.length > 50) undo.shift();
  }
  function focusItem(i) {
    const row = body.querySelector(`[data-span-index="${i}"]`);
    if (!row) return;
    row.parentElement.open = true;
    row.open = true;
    row.firstElementChild.focus();
  }
  async function saveRules(next, feedback = status) {
    if (saving) return false;
    saving = true;
    try {
      const fresh = await marinara.storage.get();
      if (
        JSON.stringify(fresh.promptStatsRules ?? []) !== JSON.stringify(rules)
      ) {
        feedback.textContent = tr(
          "다른 창에서 규칙이 변경되었습니다. 창을 다시 여세요.",
          "Rules changed in another tab. Reopen this viewer.",
        );
        return false;
      }
      await patchStorage({ promptStatsRules: next });
      rules = next;
      return true;
    } catch {
      feedback.textContent = tr(
        "저장 실패. 다시 시도하세요.",
        "Save failed. Please retry.",
      );
      return false;
    } finally {
      saving = false;
    }
  }
  function closeEditor() {
    if (!editor) return;
    editor.trigger.setAttribute("aria-expanded", "false");
    editor.box.remove();
    editor = null;
  }
  function edit(s, i, anchor, trigger) {
    closeEditor();
    const box = element("div", undefined, "ps-editor");
    const feedback = element("p");
    feedback.setAttribute("role", "status");
    const select = element("select");
    names.forEach((n, j) => {
      const o = element("option", n);
      o.value = j;
      select.append(o);
    });
    select.value = i === -1 ? 0 : category(s, i);
    select.setAttribute("aria-label", tr("분류", "Category"));
    const scope = element("select");
    [
      tr("이번 스냅샷", "This snapshot"),
      tr("이 채팅의 같은 경로·이름", "Same path and name in this chat"),
      tr("전체 채팅의 같은 경로·이름", "Same path and name in all chats"),
    ].forEach((n, j) => {
      const o = element("option", n);
      o.value = j;
      scope.append(o);
    });
    scope.setAttribute("aria-label", tr("적용 범위", "Scope"));
    const targets = i === -1 ? [...selected] : [i];
    if (targets.some((j) => spans[j].split)) {
      scope.disabled = true;
      feedback.textContent = tr(
        "나눈 구간은 이번 창에서만 변경됩니다.",
        "Split ranges apply only in this viewer.",
      );
    }
    const actions = element("span", undefined, "ps-editor-actions");
    actions.append(
      button(tr("적용", "Apply"), async () => {
        const cat = Number(select.value);
        const targets = i === -1 ? [...selected] : [i];
        if (scope.value === "0" || targets.some((j) => spans[j].split)) {
          remember();
          targets.forEach((j) => overrides.set(j, cat));
        } else {
          const chat = scope.value === "1" ? snapshot.chat : "*";
          const keys = new Set(targets.map((j) => spans[j].key));
          if (
            !(await saveRules(
              [
                ...rules.filter((r) => !(keys.has(r.key) && r.chat === chat)),
                ...[...keys].map((key) => ({ key, chat, cat })),
              ],
              feedback,
            ))
          )
            return;
        }
        selected.clear();
        render();
        focusItem(targets[0]);
      }),
      button(tr("취소", "Cancel"), () => {
        closeEditor();
        trigger.focus();
      }),
    );
    box.append(select, scope, actions, feedback);
    anchor.after(box);
    editor = { box, trigger };
    trigger.setAttribute("aria-expanded", "true");
    select.focus();
  }
  function splitEditor(s, i, anchor, trigger) {
    closeEditor();
    const box = element("div", undefined, "ps-editor ps-split-editor");
    const help = element(
      "p",
      tr(
        "나눌 내용을 선택하고 분류를 고르세요. 원문은 바뀌지 않으며, 창을 닫으면 분할이 사라집니다.",
        "Select a passage and choose its category. Original text stays unchanged. Splits are cleared when this viewer closes.",
      ),
    );
    const input = element("textarea");
    input.readOnly = true;
    input.spellcheck = false;
    input.rows = 8;
    input.value = s.text;
    input.setAttribute(
      "aria-label",
      tr("나눌 원문 범위 선택", "Select a passage to split"),
    );
    const preview = element("p", undefined, "ps-selection");
    preview.setAttribute("role", "status");
    const select = element("select");
    names.forEach((name, cat) => {
      const option = element("option", name);
      option.value = cat;
      select.append(option);
    });
    select.value = category(s, i);
    select.setAttribute("aria-label", tr("선택 구간 분류", "Passage category"));
    const feedback = element("p");
    feedback.setAttribute("role", "status");
    const apply = button(tr("선택 구간 적용", "Apply to passage"), () => {
      const [start, end] = originalRange(
        s.text,
        input.selectionStart,
        input.selectionEnd,
      );
      let parts;
      try {
        parts = splitSpan(s, start, end);
      } catch {
        feedback.textContent = tr(
          "완전한 글자를 포함하도록 범위를 다시 선택하세요.",
          "Select a range containing complete characters.",
        );
        input.focus();
        return;
      }
      remember();
      const previous = new Map(overrides);
      overrides.clear();
      previous.forEach((cat, j) => {
        if (j < i) overrides.set(j, cat);
        else if (j > i) overrides.set(j + parts.length - 1, cat);
      });
      const chosen = start === 0 ? 0 : 1;
      parts.forEach((_, offset) => {
        if (previous.has(i)) overrides.set(i + offset, previous.get(i));
      });
      overrides.set(i + chosen, Number(select.value));
      spans = [...spans.slice(0, i), ...parts, ...spans.slice(i + 1)];
      selected.clear();
      render();
      status.textContent = tr(
        "선택 구간을 분류했습니다. 아래에서 마지막 임시 변경을 취소할 수 있습니다.",
        "Passage classified. Use Undo last temporary change below to restore it.",
      );
      focusItem(i + chosen);
    });
    apply.disabled = true;
    let selectionKey = null;
    const updateSelection = () => {
      const nextKey = `${input.selectionStart}:${input.selectionEnd}`;
      if (nextKey === selectionKey) return;
      feedback.textContent = "";
      selectionKey = nextKey;
      const text = input.value.slice(input.selectionStart, input.selectionEnd);
      apply.disabled = !text.length;
      const previewChars = [];
      for (const char of text) {
        previewChars.push(char);
        if (previewChars.length > 100) break;
      }
      preview.textContent = text.length
        ? tr("선택: ", "Selected: ") +
          previewChars.slice(0, 100).join("") +
          (previewChars.length > 100 ? "…" : "")
        : tr(
            "텍스트를 드래그하거나 Shift + 방향키로 선택하세요.",
            "Select text by dragging or using Shift + arrow keys.",
          );
    };
    input.addEventListener("select", updateSelection);
    input.addEventListener("keyup", updateSelection);
    input.addEventListener("mouseup", updateSelection);
    const actions = element("span", undefined, "ps-editor-actions");
    actions.append(
      apply,
      button(tr("취소", "Cancel"), () => {
        closeEditor();
        trigger.focus();
      }),
    );
    box.append(help, input, preview, select, actions, feedback);
    anchor.after(box);
    editor = { box, trigger };
    trigger.setAttribute("aria-expanded", "true");
    input.focus();
    input.setSelectionRange(0, 0);
    updateSelection();
  }
  function render() {
    closeEditor();
    body.replaceChildren();
    status.textContent = "";
    const native = tab === "native";
    root.dataset.mode = tab;
    body.hidden = native;
    status.hidden = native;
    for (const [node, wasHidden] of hidden) {
      node.hidden = native ? wasHidden : true;
      if (native) node.removeAttribute("data-ps-hidden");
      else node.setAttribute("data-ps-hidden", "");
    }

    for (const [view, control] of tabs) {
      control.setAttribute("aria-pressed", String(view === tab));
    }
    if (tab === "native") return;
    if (tab === "rules") {
      rules.forEach((r, i) => {
        const row = element("div", undefined, "ps-row");
        row.append(
          element(
            "span",
            `${r.key} → ${names[r.cat === 8 ? 2 : r.cat]} (${r.chat === "*" ? tr("전체", "Global") : tr("채팅", "Chat")})`,
          ),
          button(tr("삭제", "Delete"), async () => {
            row.append(status);
            if (await saveRules(rules.filter((_, j) => j !== i))) render();
          }),
        );
        body.append(row);
      });
      if (!rules.length)
        body.append(
          element("p", tr("저장한 규칙이 없습니다.", "No saved rules.")),
        );
      return;
    }
    if (tab === "raw") {
      const search = element("input");
      search.type = "search";
      search.placeholder = tr("원문 검색", "Find in original");
      search.setAttribute("aria-label", search.placeholder);
      const output = element("div");
      const show = () => {
        output.replaceChildren();
        const q = search.value.toLowerCase();
        snapshot.data.messages.forEach((m, i) => {
          const section = element("section");
          section.append(element("h4", `${i + 1}. ${m.role}`));
          const pre = element("pre");
          const searchable = q ? m.content.toLowerCase() : "";
          let start = 0,
            index = q ? searchable.indexOf(q) : -1;
          while (index >= 0) {
            pre.append(
              document.createTextNode(m.content.slice(start, index)),
              element("mark", m.content.slice(index, index + q.length)),
            );
            start = index + q.length;
            index = searchable.indexOf(q, start);
          }
          pre.append(document.createTextNode(m.content.slice(start)));
          section.append(pre);
          output.append(section);
        });
      };
      search.addEventListener("input", show);
      body.append(search, output);
      show();
      return;
    }
    if (snapshot.loading) {
      status.textContent = tr(
        "원본 자료를 대조하고 있습니다. 원문과 기본 보기는 바로 사용할 수 있습니다.",
        "Matching source material. Original and Default views are available now.",
      );
      body.append(status);
      return;
    }
    const weights = Array(names.length).fill(0);
    const spanRules = spans.map((s) => ruleCategory(s, rules, snapshot.chat));
    const spanCategories = spans.map(
      (s, i) => overrides.get(i) ?? spanRules[i] ?? s.cat,
    );
    spans.forEach((s, i) => {
      if (!spanWeights.has(s)) spanWeights.set(s, weight(s.text));
      weights[spanCategories[i]] += spanWeights.get(s);
    });
    const total = (estimatedTotal ??= marinara.estimateTextTokens(
      snapshot.data.messages.map((m) => m.content).join(""),
    ));
    if (total !== Math.ceil(weights.reduce((a, b) => a + b, 0) / 100)) {
      body.append(
        element(
          "p",
          tr(
            "토큰 추정 방식이 달라 통계를 표시할 수 없습니다. 원문을 확인하세요.",
            "Estimator changed. Please use original text.",
          ),
        ),
      );
      return;
    }
    const g = snapshot.data.generationInfo;
    const reported =
      g?.tokensLastRequestInput ??
      ((g?.requestCount ?? 1) <= 1 ? g?.tokensPrompt : null);
    const heading = element(
      "p",
      reported != null
        ? `${tr("제공자 보고", "Provider reported")} ${reported.toLocaleString()} ${tr("토큰", "tokens")}`
        : tr("제공자 보고 토큰 없음", "Provider token count unavailable"),
      "ps-total",
    );
    heading.title = tr(
      "아래 분류별 수치는 텍스트 추정치입니다.",
      "Category counts below are text estimates.",
    );
    body.append(heading);
    const amounts = allocate(weights, total),
      percents = allocate(weights, 1000);
    body.append(palettePicker(root, weights));
    names.forEach((name, c) => {
      const details = element("details", undefined, "ps-category");
      const summary = element("summary");
      const swatch = element("span", undefined, "ps-category-color");
      swatch.setAttribute("aria-hidden", "true");
      swatch.style.backgroundColor = `var(--ps-${c})`;
      summary.append(
        swatch,
        `${name} · ~${amounts[c].toLocaleString()} · ${(percents[c] / 10).toFixed(1)}%`,
      );
      details.append(summary);
      spans.forEach((s, i) => {
        if (!s.visible || spanCategories[i] !== c) return;
        const row = element("details", undefined, "ps-item");
        row.dataset.spanIndex = i;
        const itemHeader = element("summary", undefined, "ps-item-heading");
        const check = element("input");
        check.type = "checkbox";
        check.checked = selected.has(i);
        check.setAttribute("aria-label", tr("선택: ", "Select: ") + s.label);
        check.addEventListener("click", (e) => e.stopPropagation());
        check.addEventListener("change", () => {
          if (check.checked) selected.add(i);
          else selected.delete(i);
          bulk.hidden = selected.size === 0;
          if (bulk.hidden && editor?.trigger === bulk) closeEditor();
        });
        const actions = element("span", undefined, "ps-item-actions");
        const change = iconButton(
          tr("분류 변경", "Change category"),
          "M4 6h5m4 0h7M4 12h9m4 0h3M4 18h2m4 0h10M9 4v4m8 2v4m-7 2v4",
          () => edit(s, i, itemHeader, change),
        );
        change.setAttribute("aria-expanded", "false");
        const reset = iconButton(
          tr("임시 변경 취소", "Reset temporary change"),
          "M3 12a9 9 0 1 1 2.6 6.4M3 12V5m0 7h7",
          () => {
            remember();
            overrides.delete(i);
            render();
            focusItem(i);
          },
        );
        reset.disabled = !overrides.has(i);
        const split = iconButton(
          tr("구간 나누기", "Split passage"),
          "M9 9 3 3m6 12-6 6m18-18L9 15m12 6-8-8M7 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0m0 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0",
          () => splitEditor(s, i, itemHeader, split),
        );
        split.setAttribute("aria-expanded", "false");
        actions.append(change, split, reset);
        itemHeader.append(
          check,
          element("span", s.label, "ps-item-title"),
          actions,
        );
        const rule = spanRules[i];
        const basis = overrides.has(i)
          ? tr("수동 지정", "Manual")
          : rule !== null
            ? tr("저장 규칙", "Saved rule")
            : s.basis === "reference"
              ? tr("현재 자료 원문과 일치", "Matches current source text")
              : s.basis === "unknown"
                ? tr(
                    "분류 미확정 · 혼합 내용일 수 있음",
                    "Unclassified · may contain mixed sources",
                  )
                : tr("태그·제목 기준 추정", "Estimated from tags or headings");
        const detail = element(
          "p",
          `${s.role} · ${s.path.join(" / ")} · ${basis}${s.split ? tr(" · 나눈 구간", " · Split passage") : ""}`,
          "ps-basis",
        );
        row.append(itemHeader, detail, element("pre", s.text));
        details.append(row);
      });
      if (spans.some((s, i) => !s.visible && spanCategories[i] === c))
        details.append(
          element(
            "p",
            tr(
              "표시하지 않은 구조 태그와 공백도 합계에 포함됩니다.",
              "Totals include hidden structural tags and whitespace.",
            ),
            "ps-basis",
          ),
        );
      body.append(details);
    });
    const bulk = button(
      tr("선택 항목 일괄 분류", "Classify selected items"),
      () => {
        if (!selected.size) return;
        status.textContent = "";
        edit(null, -1, bulk, bulk);
      },
    );
    bulk.hidden = selected.size === 0;
    body.append(bulk, status);
    if (snapshot.references) {
      const count = spans.filter(
        (s) => s.basis === "reference" && s.visible,
      ).length;
      body.append(
        element(
          "p",
          tr(
            `원본 대조: ${count}개 구간. 현재 연결 자료 기준이며, 불일치·중복은 자동 분류하지 않습니다.${snapshot.references.partial ? " 일부 자료를 읽지 못했거나 조회 한도에 도달했습니다." : ""}`,
            `Source match: ${count} passages. Uses currently linked sources; unmatched or ambiguous text is left unchanged.${snapshot.references.partial ? " Some sources were unavailable or a limit was reached." : ""}`,
          ),
          "ps-basis ps-reference-status",
        ),
      );
    }
    if (undo.length)
      body.append(
        button(
          tr("마지막 임시 변경 취소", "Undo last temporary change"),
          () => {
            const prev = undo.pop();
            spans = prev.spans;
            overrides.clear();
            prev.overrides.forEach((v, k) => overrides.set(k, v));
            selected.clear();
            render();
            tabs[0][1].focus();
            status.textContent = tr(
              "마지막 임시 변경을 취소했습니다.",
              "Last temporary change undone.",
            );
          },
        ),
      );
  }
  try {
    render();
    children[0].after(root);
    hidden.forEach(([n]) => {
      n.hidden = true;
      n.setAttribute("data-ps-hidden", "");
    });
  } catch {
    restore();
  }
}
async function boundedJSON(response, budget) {
  const reader = response.body.getReader();
  let size = 0,
    chunks = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (budget) {
        budget.remaining -= value.byteLength;
        if (budget.remaining < 0) throw Error("budget");
      }
      if (size > 8 * 1024 * 1024) throw Error("size");
      chunks.push(value);
    }
    const all = new Uint8Array(size);
    let at = 0;
    for (const c of chunks) {
      all.set(c, at);
      at += c.length;
    }
    return JSON.parse(new TextDecoder().decode(all));
  } finally {
    void reader.cancel().catch(() => {});
  }
}
function wrappedFetch(...args) {
  let match = null,
    body = null;
  try {
    const input = args[0],
      init = args[1];
    const url = new URL(
      input instanceof Request ? input.url : input,
      location.href,
    );
    const method = (
      init?.method || (input instanceof Request ? input.method : "GET")
    ).toUpperCase();
    if (alive && url.origin === location.origin && method === "POST")
      match = url.pathname.match(/^\/api\/chats\/([^/]+)\/peek-prompt$/);
    body = init?.body;
    if (match && input instanceof Request && body === undefined)
      body = boundedJSON(input.clone()).catch(() => ({}));
  } catch {}
  if (!match) return Reflect.apply(originalFetch, this, args);
  if (active && !active.dialog.isConnected) restore();
  // Native current-context/test views keep the opening snapshot, as documented.
  if (active) return Reflect.apply(originalFetch, this, args);
  const seq = ++sequence;
  referenceController?.abort();
  pending = null;
  observeDialog();
  const before = new Set(document.querySelectorAll('[role="dialog"]'));
  return Reflect.apply(originalFetch, this, args).then((response) => {
    if (response.ok && alive && seq === sequence) {
      try {
        const copy = response.clone();
        void boundedJSON(copy)
          .then(async (data) => {
            if (
              !alive ||
              seq !== sequence ||
              !Array.isArray(data.messages) ||
              !data.messages.every(
                (m) =>
                  m &&
                  typeof m.role === "string" &&
                  typeof m.content === "string",
              )
            )
              return;
            const chat = decodeURIComponent(match[1]);
            let request = {};
            try {
              const parsed =
                typeof body === "string" ? JSON.parse(body) : await body;
              if (
                typeof parsed?.messageId === "string" &&
                parsed.messageId.length <= 512
              )
                request.messageId = parsed.messageId;
            } catch {}
            if (!alive || seq !== sequence) return;
            const snapshot = {
              chat,
              data,
              before,
              loading:
                data.chatMode === "roleplay" &&
                typeof marinara.fetch === "function" &&
                partition(data.messages).some((s) => s.cat === 7 && s.visible),
            };
            pending = snapshot;
            attach();
            if (snapshot.loading) {
              const controller = new AbortController();
              referenceController = controller;
              const timer = setTimeout(() => controller.abort(), 8000);
              try {
                const result = await loadReferences(
                  chat,
                  data,
                  request,
                  controller.signal,
                );
                if (!alive || seq !== sequence) return;
                const matched = matchReferences(
                  data.messages,
                  result.candidates,
                );
                snapshot.references = {
                  matches: matched.matches,
                  partial: result.partial || matched.limited,
                };
              } catch {
                snapshot.references = { matches: [], partial: true };
              } finally {
                clearTimeout(timer);
                if (referenceController === controller)
                  referenceController = null;
              }
            }
            if (!alive || seq !== sequence) return;
            const wasLoading = snapshot.loading;
            snapshot.loading = false;
            if (wasLoading && active?.snapshot === snapshot)
              active.finishReferences();
            attach();
          })
          .catch(() => {});
      } catch {}
    }
    return response;
  });
}
function attach() {
  if (active && !active.dialog.isConnected) restore();
  if (!alive || !settingsReady || active || !pending) {
    observeDialog();
    return;
  }
  const candidates = [
    ...document.querySelectorAll('[data-chat-floating-panel] [role="dialog"]'),
  ].filter(
    (d) =>
      !existing.has(d) &&
      !pending.before.has(d) &&
      d.querySelector('input[type="search"]') &&
      /Assembled Prompt|프롬프트 구성/i.test(d.textContent),
  );
  if (candidates.length === 1) {
    const p = pending;
    pending = null;
    existing.add(candidates[0]);
    mount(candidates[0], p);
  }
  observeDialog();
}
// Wait for new dialogs only while a snapshot needs one. Once mounted, observe
// direct ancestors for removal, not every streamed token or extension UI change.
function observeDialog() {
  observer.disconnect();
  if (!alive) return;
  if (active) {
    for (
      let parent = active.dialog.parentElement;
      parent;
      parent = parent.parentElement
    )
      observer.observe(parent, { childList: true });
  } else if (pending) {
    observer.observe(document.body, { childList: true, subtree: true });
  }
}
window.fetch = wrappedFetch;
const observer = new MutationObserver((records) => {
  if (
    active ||
    records.some(
      (record) =>
        record.target.closest?.("[data-chat-floating-panel]") ||
        [...record.addedNodes, ...record.removedNodes].some(
          (node) =>
            node.nodeType === 1 &&
            (node.matches("[data-chat-floating-panel]") ||
              node.querySelector("[data-chat-floating-panel]")),
        ),
    )
  )
    attach();
});
marinara.onCleanup(() => {
  alive = false;
  referenceController?.abort();
  pending = null;
  observer.disconnect();
  restore();
  if (window.fetch === wrappedFetch) window.fetch = originalFetch;
});

// Observe requests immediately, including clicks while extension storage is loading.
const stored = await settings;
if (alive) {
  palette =
    palettes.find(([name]) => name === stored.promptStatsPalette) ??
    palettes[0];
  if (Array.isArray(stored.promptStatsRules))
    rules = stored.promptStatsRules
      .filter(
        (r) =>
          r &&
          typeof r.key === "string" &&
          Number.isInteger(r.cat) &&
          r.cat >= 0 &&
          r.cat <= 8 &&
          typeof r.chat === "string",
      )
      .slice(0, 1000);
  settingsReady = true;
  attach();
}
