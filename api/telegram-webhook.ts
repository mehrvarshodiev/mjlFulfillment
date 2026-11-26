import {
  appendLeadNote,
  clearNoteSession,
  createDatabase,
  ensureSchema,
  escapeHtml,
  formatDate,
  getLead,
  getLeadStats,
  getNoteSession,
  hasProcessedUpdate,
  LeadFilter,
  LeadRecord,
  LeadStatus,
  leadNumber,
  listLeads,
  markUpdateProcessed,
  setNoteSession,
  STATUS_LABELS,
  telegramCall,
  updateLeadStatus,
  ApiRequest,
  ApiResponse
} from "./_lib";

type TelegramUser = { id: number };
type TelegramChat = { id: number; type?: string };
type TelegramMessage = { message_id: number; chat: TelegramChat; from?: TelegramUser; text?: string };
type TelegramCallback = {
  id: string;
  from: TelegramUser;
  data?: string;
  message?: TelegramMessage;
};
type TelegramUpdate = {
  update_id?: number;
  message?: TelegramMessage;
  callback_query?: TelegramCallback;
};
type KeyboardButton = { text: string; callback_data: string };
type Keyboard = { inline_keyboard: KeyboardButton[][] };

const STATUS_FILTERS: LeadFilter[] = ["new", "in_progress", "waiting", "completed", "rejected", "all"];

function adminAllowed(chat: TelegramChat | undefined, from: TelegramUser | undefined): boolean {
  const adminId = process.env.TELEGRAM_CHAT_ID;
  return Boolean(
    adminId &&
    chat?.type === "private" &&
    String(chat.id) === adminId &&
    from?.id !== undefined &&
    String(from.id) === adminId
  );
}

function menuKeyboard(): Keyboard {
  return {
    inline_keyboard: [
      [{ text: "🆕 Новые заявки", callback_data: "list:new:0" }, { text: "📋 Все заявки", callback_data: "list:all:0" }],
      [{ text: "🟡 В работе", callback_data: "list:in_progress:0" }, { text: "⏳ Ожидают", callback_data: "list:waiting:0" }],
      [{ text: "📊 Статистика", callback_data: "stats" }, { text: "❔ Помощь", callback_data: "help" }]
    ]
  };
}

function mainMenuText(): string {
  return [
    "✨ <b>MJL FULFILLMENT CRM</b>",
    "",
    "Панель управления заявками сайта.",
    "Выберите раздел:",
    "",
    "🔐 Доступ ограничен личным аккаунтом администратора."
  ].join("\n");
}

async function sendMenu(chatId: string | number): Promise<void> {
  await telegramCall("sendMessage", {
    chat_id: chatId,
    text: mainMenuText(),
    parse_mode: "HTML",
    reply_markup: menuKeyboard()
  });
}

async function editOrSend(
  chatId: string | number,
  messageId: number | undefined,
  text: string,
  replyMarkup: Keyboard
): Promise<void> {
  if (messageId !== undefined) {
    try {
      await telegramCall("editMessageText", {
        chat_id: chatId,
        message_id: messageId,
        text,
        parse_mode: "HTML",
        reply_markup: replyMarkup,
        disable_web_page_preview: true
      });
      return;
    } catch {
      // A fresh message is used when Telegram cannot edit the previous one.
    }
  }
  await telegramCall("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    reply_markup: replyMarkup,
    disable_web_page_preview: true
  });
}

async function showStats(
  sql: ReturnType<typeof createDatabase>,
  chatId: string | number,
  messageId?: number
): Promise<void> {
  const stats = await getLeadStats(sql);
  const text = [
    "📊 <b>СТАТИСТИКА ЗАЯВОК</b>",
    "",
    `Всего: <b>${stats.total}</b>`,
    `🆕 Новые: <b>${stats.new}</b>`,
    `🟡 В работе: <b>${stats.in_progress}</b>`,
    `⏳ Ожидают: <b>${stats.waiting}</b>`,
    `✅ Завершены: <b>${stats.completed}</b>`,
    `⛔ Отклонены: <b>${stats.rejected}</b>`
  ].join("\n");
  await editOrSend(chatId, messageId, text, {
    inline_keyboard: [[{ text: "↩️ Главное меню", callback_data: "menu" }]]
  });
}

async function showLead(
  sql: ReturnType<typeof createDatabase>,
  chatId: string | number,
  messageId: number | undefined,
  id: string
): Promise<void> {
  const lead = await getLead(sql, id);
  if (!lead) {
    await editOrSend(chatId, messageId, "Заявка не найдена.", {
      inline_keyboard: [[{ text: "↩️ Главное меню", callback_data: "menu" }]]
    });
    return;
  }
  const text = [
    `<b>📄 ${leadNumber(lead.id)}</b>`,
    "",
    `<b>Статус:</b> ${STATUS_LABELS[lead.status]}`,
    `<b>Имя:</b> ${escapeHtml(lead.name)}`,
    `<b>Телефон:</b> ${escapeHtml(lead.phone)}`,
    `<b>Компания:</b> ${escapeHtml(lead.company || "Не указана")}`,
    `<b>Страна:</b> ${escapeHtml(lead.country)}`,
    `<b>Тип товара:</b> ${escapeHtml(lead.product_type)}`,
    `<b>Объём:</b> ${escapeHtml(lead.volume)}`,
    `<b>Маркетплейс:</b> ${escapeHtml(lead.marketplace || "Не указан")}`,
    `<b>Telegram:</b> ${escapeHtml(lead.telegram || "Не указан")}`,
    `<b>Создана:</b> ${formatDate(lead.created_at)}`,
    `<b>Уведомление:</b> ${lead.notification_status === "sent" ? "доставлено" : "не доставлено / ожидает"}`,
    "",
    "<b>Заметки:</b>",
    escapeHtml(lead.notes || "Пока нет")
  ].join("\n");
  await editOrSend(chatId, messageId, text, {
    inline_keyboard: [
      [{ text: "🟡 В работу", callback_data: `lead:${lead.id}:status:in_progress` }, { text: "⏳ Ожидание", callback_data: `lead:${lead.id}:status:waiting` }],
      [{ text: "✅ Завершить", callback_data: `lead:${lead.id}:status:completed` }, { text: "⛔ Отклонить", callback_data: `lead:${lead.id}:status:rejected` }],
      [{ text: "📝 Добавить заметку", callback_data: `lead:${lead.id}:note` }],
      [{ text: "🆕 Вернуть в новые", callback_data: `lead:${lead.id}:status:new` }],
      [{ text: "↩️ Все заявки", callback_data: "list:all:0" }, { text: "⌂ Меню", callback_data: "menu" }]
    ]
  });
}

async function showList(
  sql: ReturnType<typeof createDatabase>,
  chatId: string | number,
  messageId: number | undefined,
  filter: LeadFilter,
  page: number
): Promise<void> {
  const pageSize = 6;
  const safePage = Math.max(0, Math.floor(page));
  const { items, total } = await listLeads(sql, filter, pageSize, safePage * pageSize);
  const title = filter === "all" ? "ВСЕ ЗАЯВКИ" : STATUS_LABELS[filter].toLocaleUpperCase("ru-RU");
  const lines = [
    `<b>📥 ${title}</b>`,
    `Страница ${safePage + 1} · Всего: ${total}`,
    "",
    ...(items.length
      ? items.map((lead) =>
          `<b>${leadNumber(lead.id)}</b> · ${escapeHtml(lead.name)}\n${escapeHtml(lead.phone)} · ${STATUS_LABELS[lead.status]}`
        )
      : ["Заявок пока нет."])
  ];
  const keyboard: KeyboardButton[][] = items.map((lead) => [{
    text: `${leadNumber(lead.id)} · ${lead.name.slice(0, 28)}`,
    callback_data: `lead:${lead.id}:open`
  }]);
  const navigation: KeyboardButton[] = [];
  if (safePage > 0) navigation.push({ text: "← Назад", callback_data: `list:${filter}:${safePage - 1}` });
  if ((safePage + 1) * pageSize < total) navigation.push({ text: "Далее →", callback_data: `list:${filter}:${safePage + 1}` });
  if (navigation.length) keyboard.push(navigation);
  keyboard.push([{ text: "↩️ Главное меню", callback_data: "menu" }]);
  await editOrSend(chatId, messageId, lines.join("\n"), { inline_keyboard: keyboard });
}

async function handleCommand(sql: ReturnType<typeof createDatabase>, message: TelegramMessage): Promise<void> {
  const chatId = message.chat.id;
  const command = (message.text ?? "").trim().split(/\s+/, 1)[0].toLowerCase();
  if (command === "/start" || command === "/menu") {
    await sendMenu(chatId);
  } else if (command === "/leads") {
    await showList(sql, chatId, undefined, "all", 0);
  } else if (command === "/new") {
    await showList(sql, chatId, undefined, "new", 0);
  } else if (command === "/status") {
    await showStats(sql, chatId);
  } else {
    await telegramCall("sendMessage", {
      chat_id: chatId,
      text: [
        "<b>Команды MJL CRM</b>",
        "/start — главное меню",
        "/leads — все заявки",
        "/new — новые заявки",
        "/status — статистика",
        "/help — справка",
        "/cancel — отменить добавление заметки"
      ].join("\n"),
      parse_mode: "HTML",
      reply_markup: menuKeyboard()
    });
  }
}

async function handleMessage(
  sql: ReturnType<typeof createDatabase>,
  message: TelegramMessage
): Promise<void> {
  if (!message.text || !message.from) return;
  const userId = String(message.from.id);
  const pendingLeadId = await getNoteSession(sql, userId);
  if (pendingLeadId) {
    const note = message.text.trim();
    if (note === "/cancel") {
      await clearNoteSession(sql, userId);
      await telegramCall("sendMessage", { chat_id: message.chat.id, text: "Добавление заметки отменено." });
      return;
    }
    if (note.startsWith("/")) {
      await telegramCall("sendMessage", {
        chat_id: message.chat.id,
        text: "Сначала отправьте текст заметки или используйте /cancel для отмены."
      });
      return;
    }
    if (!note) return;
    const lead = await appendLeadNote(sql, pendingLeadId, note.slice(0, 1000), userId);
    await clearNoteSession(sql, userId);
    await telegramCall("sendMessage", {
      chat_id: message.chat.id,
      text: lead ? `✅ Заметка добавлена к ${leadNumber(lead.id)}.` : "Заявка не найдена.",
      reply_markup: lead
        ? { inline_keyboard: [[{ text: "Открыть заявку", callback_data: `lead:${lead.id}:open` }]] }
        : menuKeyboard()
    });
    return;
  }
  if (message.text.trim().startsWith("/")) await handleCommand(sql, message);
}

async function handleCallback(
  sql: ReturnType<typeof createDatabase>,
  callback: TelegramCallback
): Promise<void> {
  await telegramCall("answerCallbackQuery", { callback_query_id: callback.id }).catch(() => undefined);
  const chatId = callback.message?.chat.id;
  const messageId = callback.message?.message_id;
  if (chatId === undefined || !callback.data) return;
  const parts = callback.data.split(":");
  const action = parts[0];
  if (action === "menu") {
    await editOrSend(chatId, messageId, mainMenuText(), menuKeyboard());
    return;
  }
  if (action === "help") {
    await editOrSend(chatId, messageId, [
      "<b>Как работать с заявками</b>",
      "1. Откройте «Новые заявки» или «Все заявки».",
      "2. Выберите заявку, чтобы увидеть контакты и детали.",
      "3. Измените статус или добавьте внутреннюю заметку.",
      "4. Статистика показывает распределение по статусам.",
      "",
      "Управление доступно только владельцу бота."
    ].join("\n"), { inline_keyboard: [[{ text: "↩️ Главное меню", callback_data: "menu" }]] });
    return;
  }
  if (action === "stats") {
    await showStats(sql, chatId, messageId);
    return;
  }
  if (action === "list") {
    const filter = STATUS_FILTERS.includes(parts[1] as LeadFilter) ? parts[1] as LeadFilter : "all";
    const page = Number.parseInt(parts[2] ?? "0", 10);
    await showList(sql, chatId, messageId, filter, Number.isFinite(page) ? page : 0);
    return;
  }
  if (action === "lead") {
    const id = parts[1];
    const operation = parts[2];
    if (!id || !/^\d+$/.test(id)) return;
    if (operation === "open") {
      await showLead(sql, chatId, messageId, id);
    } else if (operation === "note") {
      await setNoteSession(sql, String(callback.from.id), id);
      await editOrSend(chatId, messageId,
        `📝 Отправьте следующим сообщением заметку для <b>${leadNumber(id)}</b>.\nДля отмены используйте /cancel.`,
        { inline_keyboard: [[{ text: "↩️ Главное меню", callback_data: "menu" }]] }
      );
    } else if (operation === "status") {
      const status = parts[3] as LeadStatus;
      if (!["new", "in_progress", "waiting", "completed", "rejected"].includes(status)) return;
      const updated = await updateLeadStatus(sql, id, status, String(callback.from.id));
      if (updated) await showLead(sql, chatId, messageId, id);
    }
  }
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false });
  }
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const receivedSecret = req.headers["x-telegram-bot-api-secret-token"];
  if (!expectedSecret || receivedSecret !== expectedSecret) {
    return res.status(401).json({ ok: false });
  }

  try {
    const sql = createDatabase();
    await ensureSchema(sql);
    const update = (req.body && typeof req.body === "object" ? req.body : {}) as TelegramUpdate;
    const updateId = update.update_id;
    if (typeof updateId === "number" && await hasProcessedUpdate(sql, updateId)) {
      return res.status(200).json({ ok: true, duplicate: true });
    }

    if (update.message && adminAllowed(update.message.chat, update.message.from)) {
      await handleMessage(sql, update.message);
    } else if (
      update.callback_query &&
      adminAllowed(update.callback_query.message?.chat, update.callback_query.from)
    ) {
      await handleCallback(sql, update.callback_query);
    }

    if (typeof updateId === "number") await markUpdateProcessed(sql, updateId);
    return res.status(200).json({ ok: true });
  } catch {
    return res.status(500).json({ ok: false });
  }
}
