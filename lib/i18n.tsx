"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { enUS, th } from "date-fns/locale";
import { setDateLocale } from "./dates";

export type Locale = "th" | "en";

const LANG_KEY = "organiser:locale";

const thDict = {
  home: "หน้าแรก",
  homeShort: "แรก",
  calendar: "ปฏิทิน",
  calendarShort: "ปฏิทิน",
  tasks: "งาน",
  tasksShort: "งาน",
  notes: "โน้ต",
  notesShort: "โน้ต",
  readingNav: "อ่านหนังสือ",
  readingShort: "อ่าน",
  logout: "ออกจากระบบ",
  syncNote: "ซิงก์ทุกอุปกรณ์แบบเรียลไทม์ (Firebase)",
  add: "เพิ่ม",
  cancel: "ยกเลิก",
  close: "ปิด",
  save: "บันทึก",
  saving: "กำลังบันทึก…",
  delete: "ลบ",
  edit: "แก้ไข",
  search: "ค้นหา",
  viewAll: "ดูทั้งหมด",
  today: "วันนี้",
  daysUnit: "วัน",
  langToggle: "เปลี่ยนภาษา",
  themeToggle: "สลับธีมสว่าง/มืด",

  // dashboard
  greetMorning: "สวัสดีตอนเช้า",
  greetAfternoon: "สวัสดีตอนบ่าย",
  greetEvening: "สวัสดีตอนเย็น",
  greetNamePrefix: "คุณ",
  pushBanner: "เปิดการแจ้งเตือนเพื่อไม่พลาด deadline แม้ปิดแอป",
  pushEnable: "เปิดการแจ้งเตือน",
  pushLater: "ภายหลัง",
  pushOpening: "กำลังเปิด…",
  dashCountdown: "นับถอยหลังวันสำคัญ",
  dashCountEmpty: "ยังไม่มีวันสำคัญที่ใกล้ถึง",
  dashCountHint: "เพิ่มกิจกรรมในปฏิทิน หรือกำหนดส่งในงาน เพื่อดูนับถอยหลังที่นี่",
  dashToday: "วันนี้",
  dashTodayEmpty: "วันนี้ว่าง — ไปเพิ่มกิจกรรมกันเถอะ",
  dashTodayEmptyHint: "กดที่ช่องวันในปฏิทินเพื่อเพิ่มได้เลย",
  dashReadingTitle: "ติดตามอ่านหนังสือ",
  dashReadingEmpty: "ยังไม่มีวิชาที่กำลังอ่าน",
  dashReadingEmptyHint: "ตั้งวิชา + จำนวนบท แล้วบันทึกความคืบหน้าตามจริง",
  dashUrgentAll: "ดูงานเร่งด่วนทั้งหมด",
  quickAddEvent: "เพิ่มกิจกรรม",
  quickAddTask: "เพิ่มงาน",
  quickUpdateReading: "อัปเดตการอ่าน",
  activityFallback: "กิจกรรม",

  // urgency labels
  uOverdue: "เลยกำหนด",
  uCritical: "วันนี้!",
  uUrgent: "เร่งด่วน",
  uSoon: "ใกล้ถึง",
  uNormal: "มีเวลา",
  uNone: "ไม่มีกำหนด",
  uDone: "เสร็จแล้ว",
  taskKind: "งาน",

  // tasks
  tasksSubtitle: "ค้างทำ {open} · เลยกำหนด {overdue}",
  filterAll: "ทั้งหมด",
  filterOpen: "ค้างทำ",
  filterDone: "เสร็จแล้ว",
  filterOverdue: "เลยกำหนด",
  taskQuickPh: "เพิ่มงานเร็วๆ เช่น “ทำการบ้านเคมี”",
  taskHigh: "สำคัญสูง",
  taskMedium: "ปานกลาง",
  taskLow: "น้อย",
  taskLegend: "สีขอบซ้ายเรียงตามความด่วน: แดง = เลย/วันนี้ · ส้ม = เร่งด่วน · เหลือง = ใกล้ · เขียว = มีเวลา",
  taskEmptyAll: "ยังไม่มีงาน",
  taskEmptyOverdue: "ไม่มีงานที่เลยกำหนด 🎉",
  taskEmptyInFilter: "ไม่มีงานในหมวดนี้",
  taskEmptyOpenHint: "เพิ่มงานแรกด้านบนเลย",
  taskOverdueDays: "เลยกำหนด {n} วัน",
  taskDueToday: "ครบกำหนดวันนี้",
  taskDaysLeft: "เหลือ {n} วัน",
  taskMarkDone: "ทำเครื่องหมายว่าเสร็จ",
  taskMarkUndone: "ทำเครื่องหมายว่ายังไม่เสร็จ",
  taskDoneCheck: "งานนี้เสร็จแล้ว",
  taskNewTitle: "เพิ่มงาน",
  taskEditTitle: "แก้ไขงาน",
  taskTitlePh: "เช่น ทำโจทย์เคมี 10 ข้อ",
  taskNotePh: "รายละเอียดเพิ่มเติม…",
  taskRangeCheck: "กำหนดเป็นช่วงวันที่ (เริ่ม–สิ้นสุด)",
  labelStartDate: "วันเริ่ม",
  labelTo: "ถึง",

  // calendar
  calSubtitle: "แตะวันเพื่อดู/เพิ่มกิจกรรม",
  calAddEvent: "เพิ่มกิจกรรม",
  calPrev: "เดือนก่อนหน้า",
  calNext: "เดือนถัดไป",
  calAddToday: "เพิ่มกิจกรรมวันนี้",
  calNoEventsDay: "ยังไม่มีกิจกรรมในวันนี้",
  calEmptyTitle: "ปฏิทินยังว่าง — เริ่มเพิ่มกิจกรรมแรก",
  calEmptyHint: "แตะวันในปฏิทิน หรือกดปุ่ม “เพิ่มกิจกรรม”",
  calDayTitle: "วัน {date}",
  calEventNewTitle: "เพิ่มกิจกรรม",
  calEventEditTitle: "แก้ไขกิจกรรม",
  calEventTitle: "ชื่อกิจกรรม",
  calEventDate: "วันที่",
  calEventPh: "เช่น ลงแข่งฟิสิกส์ SOS ระดับเขต",
  calEventNotePh: "รายละเอียด เวลา หรือลิงก์…",
  calShowTasks: "แสดงงานในปฏิทิน",
  calTaskSection: "งาน",
  calNoTasksDay: "ไม่มีงานในวันนี้",

  // notes
  notesSubtitle: "จดบันทึกตามวิชา/หัวข้อ ค้นหาได้ทุกที่",
  notesNew: "เพิ่มโน้ต",
  notesSearchPh: "ค้นหาโน้ต…",
  notesAllSubjects: "ทุกวิชา/หัวข้อ",
  notesChooseSubject: "วิชา/หัวข้อ",
  notesNotFound: "ไม่พบโน้ตที่ค้นหา",
  notesEmpty: "ยังไม่มีโน้ต",
  notesEmptyHint: "กด “เพิ่มโน้ต” เพื่อเริ่มจด",
  noteTitlePh: "ชื่อโน้ต…",
  noteBodyPh: "จดอะไรก็ได้ที่นี่… ตัวอย่าง: สูตรที่ต้องจำ, เนื้อเรื่องที่สอบปลายภาค, ไอเดียโปรเจกต์",
  notePin: "ปักหมุดไว้ด้านบน",
  noteNewTitle: "โน้ตใหม่",
  noteEditTitle: "แก้ไขโน้ต",

  // reading
  readingSubtitleBehind: "{n} รายการกำลังตามหลังแผน",
  readingSubtitleOk: "ทุกวิชาไปตามแผน 👍",
  readingBehind: "วิชาที่ตามหลัง:",
  readingAllGood: "ตามแผนทั้งหมด — อ่านต่อไปนะ!",
  readingDoneCount: "เสร็จแล้ว {n} วิชา",
  readingAdd: "เพิ่มวิชา",
  readingEmpty: "ยังไม่มีวิชาที่กำลังอ่าน",
  readingEmptyHint: "กด “เพิ่มวิชา” ตั้งบทและวันเป้าหมาย แล้วกด +1 บาทุกครั้งที่อ่านจบ",
  readNewTitle: "เพิ่มวิชาอ่านหนังสือ",
  readEditTitle: "แก้ไขการอ่าน",
  readSubject: "ชื่อวิชา",
  readSubjectPh: "เช่น ฟิสิกส์ เล่ม 3",
  readTotalCh: "บททั้งหมด (ไม่บังคับ)",
  readCurrentCh: "อ่านถึงบทที่",
  readPercent: "เปอร์เซ็นต์รวม (ไม่บังคับ — ถ้าไม่ใส่ จะคำนวณจากจำนวนบท)",
  readPercentPh: "เช่น 40",
  readStart: "เริ่มอ่านวันที่",
  readTarget: "เป้าหมายจบวันที่ (ไม่บังคับ)",
  readHint: "เมื่อตั้งวันเป้าหมาย แอปจะคำนวณว่าคุณควรอ่านไปถึงกี่% ณ วันนี้ และเตือนเมื่อ “ตามหลัง” แผน",
  readChapterStr: "บทที่ {current}/{total}",
  readChapterNoTotal: "บทที่ {n}",
  readTargetDate: "กำหนดจบ {date}",
  readNoTarget: "ยังไม่มีวันเป้าหมาย",
  readDaysLeft: "เหลือ {n} วัน",
  readAddChapter: "+1 บท",
  statusDone: "เสร็จแล้ว",
  statusBehind: "ตามหลัง",
  statusOverTarget: "เกินเวลานิดหน่อย",
  statusOnTrack: "ตามแผน",
  statusReading: "ระหว่างอ่าน",

  // login / auth / setup
  loginTagline: "ปฏิทิน · งาน · โน้ต · อ่านหนังสือ ในที่เดียว",
  loginGoogle: "ล็อกอินด้วย Google",
  loginOr: "หรือ",
  loginIn: "เข้าสู่ระบบ",
  loginUp: "สมัครใหม่",
  loginEmail: "อีเมล",
  loginPassword: "รหัสผ่าน (อย่างน้อย 6 ตัว)",
  loginName: "ชื่อ (เช่น เป้)",
  loginSubmitIn: "เข้าสู่ระบบ",
  loginSubmitUp: "สร้างบัญชี",
  loginSyncNote: "ข้อมูลซิงก์ผ่านคลาวด์ (Firebase) — เข้าจากมือถือหรือคอมก็เห็นเหมือนกัน",
  setupTitle: "ยังไม่ได้ตั้งค่า Firebase",
  setupBody: "สร้างไฟล์ .env.local จาก .env.local.example แล้ววางค่า Firebase ตามขั้นตอนใน README แล้ว restart แอป",
  errInvalidCredential: "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
  errInvalidEmail: "รูปแบบอีเมลไม่ถูกต้อง",
  errUserNotFound: "ไม่พบบัญชีผู้ใช้นี้",
  errWrongPassword: "รหัสผ่านไม่ถูกต้อง",
  errEmailInUse: "อีเมลนี้ถูกใช้งานแล้ว",
  errWeakPassword: "รหัสผ่านต้องอย่างน้อย 6 ตัวอักษร",
  errTooMany: "ลองอีกครั้งในภายหลัง (รอสักครู่)",
  errNetwork: "การเชื่อมต่ออินเทอร์เน็ตล้มเหลว",
  errPopup: "ปิดหน้าต่างล็อกอินก่อนเสร็จ ลองใหม่ได้",
  errDomain: "โดเมนนี้ยังไม่ได้รับอนุญาต ไปเพิ่มใน Firebase Auth ได้",
  errGeneric: "เกิดข้อผิดพลาด กรุณาลองใหม่",

  // notify button
  notifyOn: "การแจ้งเตือน (เปิดอยู่)",
  notifyOff: "การแจ้งเตือน (ยังไม่เปิด)",
  notifyUnsupported: "เบราว์เซอร์นี้ไม่รองรับการแจ้งเตือน",
  notifyEnable: "เปิดการแจ้งเตือน",
  notifyDisable: "ปิดการแจ้งเตือน",
  notifyTest: "ส่ง push ทดสอบ ({n} อุปกรณ์)",
  notifyMsgOn: "เปิดแล้ว — จะแจ้ง deadline ทั้งตอนเปิดและปิดแอป",
  notifyMsgFail: "เปิดไม่สำเร็จ — ดูที่ README (ต้องตั้ง VAPID key และเปิด HTTPS)",
  notifyMsgOff: "ปิดแล้ว — ลบอุปกรณ์ออกจากการรับ push แล้ว",
  notifyMsgSent: "ส่งไปที่ {n} อุปกรณ์ — ดูการแจ้งเตือนของคุณ",

  // category picker
  catPhDefault: "ไม่ระบุ",
  catAddEvent: "เพิ่มหมวดใหม่ (หมวด)",
  catAddSubject: "เพิ่มหมวดใหม่ (วิชา/หัวข้อ)",
  catPhName: "ชื่อหมวด เช่น สอบเข้า ม.4, งานอดิเรก…",
  catAddBtn: "เพิ่มหมวด",
  catPick: "เลือกหมวด",
  catYours: "หมวดที่สร้างเอง",
  catNone: "ยังไม่มีหมวดที่สร้างเอง",
  catDeleteBtn: "ลบหมวด",
  catConfirmDelete:
    'ลบหมวด "{name}" หรือไม่? กิจกรรม/งานที่ใช้หมวดนี้ยังอยู่ (แสดงแบบค่าเริ่มต้น)',

  // confirm dialogs
  confirmDeleteEvent: 'ลบ "{name}" หรือไม่?',
  confirmDeleteTask: 'ลบงาน "{name}" หรือไม่?',
  confirmDeleteNote: 'ลบโน้ต "{name}" หรือไม่?',
  confirmDeleteReading: 'ลบวิชา "{name}" หรือไม่?',

  // misc labels
  labelCategory: "หมวดหมู่",
  labelNote: "บันทึกย่อ (ไม่บังคับ)",
  labelDue: "กำหนดส่ง (ไม่บังคับ — กำหนดไว้อัตโนมัติเปลี่ยนสีตามความด่วน)",
  labelPriority: "ความสำคัญ",
  weekdayShort: ["จ", "อ", "พ", "พฤ", "ศ", "ส", "อา"],
};

export type TKey = keyof typeof thDict;

const enDict: Record<TKey, string | string[]> = {
  home: "Home",
  homeShort: "Home",
  calendar: "Calendar",
  calendarShort: "Cal",
  tasks: "Tasks",
  tasksShort: "Tasks",
  notes: "Notes",
  notesShort: "Notes",
  readingNav: "Reading",
  readingShort: "Read",
  logout: "Sign out",
  syncNote: "Real-time sync across devices (Firebase)",
  add: "Add",
  cancel: "Cancel",
  close: "Close",
  save: "Save",
  saving: "Saving…",
  delete: "Delete",
  edit: "Edit",
  search: "Search",
  viewAll: "View all",
  today: "Today",
  daysUnit: "d",
  langToggle: "Change language",
  themeToggle: "Toggle light/dark theme",

  greetMorning: "Good morning",
  greetAfternoon: "Good afternoon",
  greetEvening: "Good evening",
  greetNamePrefix: "",
  pushBanner: "Turn on notifications so you never miss a deadline, even with the app closed",
  pushEnable: "Enable notifications",
  pushLater: "Later",
  pushOpening: "Enabling…",
  dashCountdown: "Countdown",
  dashCountEmpty: "No upcoming important dates yet",
  dashCountHint: "Add events to the calendar or set task deadlines to see a countdown here",
  dashToday: "Today",
  dashTodayEmpty: "Nothing today — let's add something",
  dashTodayEmptyHint: "Tap a day in the calendar to add an event",
  dashReadingTitle: "Reading tracker",
  dashReadingEmpty: "No subjects being read yet",
  dashReadingEmptyHint: "Add a subject + chapters, then update progress as you go",
  dashUrgentAll: "View all urgent tasks",
  quickAddEvent: "Add event",
  quickAddTask: "Add task",
  quickUpdateReading: "Update reading",
  activityFallback: "Activity",

  uOverdue: "Overdue",
  uCritical: "Today!",
  uUrgent: "Urgent",
  uSoon: "Soon",
  uNormal: "On track",
  uNone: "No due date",
  uDone: "Done",
  taskKind: "Task",

  tasksSubtitle: "{open} open · {overdue} overdue",
  filterAll: "All",
  filterOpen: "Open",
  filterDone: "Done",
  filterOverdue: "Overdue",
  taskQuickPh: "Quick add — e.g. “do chemistry homework”",
  taskHigh: "High",
  taskMedium: "Medium",
  taskLow: "Low",
  taskLegend: "Left bar = urgency: red = overdue/today · orange = urgent · yellow = soon · green = on track",
  taskEmptyAll: "No tasks yet",
  taskEmptyOverdue: "No overdue tasks 🎉",
  taskEmptyInFilter: "No tasks in this view",
  taskEmptyOpenHint: "Add your first task above",
  taskOverdueDays: "{n} day(s) overdue",
  taskDueToday: "Due today",
  taskDaysLeft: "{n} day(s) left",
  taskMarkDone: "Mark as done",
  taskMarkUndone: "Mark as not done",
  taskDoneCheck: "This task is done",
  taskNewTitle: "New task",
  taskEditTitle: "Edit task",
  taskTitlePh: "e.g. solve 10 chemistry problems",
  taskNotePh: "Extra details…",
  taskRangeCheck: "Set a date range (start–end)",
  labelStartDate: "Start",
  labelTo: "To",

  calSubtitle: "Tap a day to view / add events",
  calAddEvent: "Add event",
  calPrev: "Previous month",
  calNext: "Next month",
  calAddToday: "Add event on this day",
  calNoEventsDay: "No events on this day",
  calEmptyTitle: "Calendar is empty — add your first event",
  calEmptyHint: "Tap a day in the calendar or press “Add event”",
  calDayTitle: "{date}",
  calEventNewTitle: "New event",
  calEventEditTitle: "Edit event",
  calEventTitle: "Event title",
  calEventDate: "Date",
  calEventPh: "e.g. regional physics competition",
  calEventNotePh: "Details, time, or a link…",
  calShowTasks: "Show tasks on calendar",
  calTaskSection: "Tasks",
  calNoTasksDay: "No tasks on this day",

  notesSubtitle: "Free-form notes by subject — searchable everywhere",
  notesNew: "New note",
  notesSearchPh: "Search notes…",
  notesAllSubjects: "All subjects/topics",
  notesChooseSubject: "Subject / topic",
  notesNotFound: "No notes match your search",
  notesEmpty: "No notes yet",
  notesEmptyHint: "Press “New note” to start writing",
  noteTitlePh: "Note title…",
  noteBodyPh: "Write anything here… e.g. formulas to memorize, exam content, project ideas",
  notePin: "Pin to top",
  noteNewTitle: "New note",
  noteEditTitle: "Edit note",

  readingSubtitleBehind: "{n} subject(s) are behind schedule",
  readingSubtitleOk: "Everything is on schedule 👍",
  readingBehind: "Behind schedule:",
  readingAllGood: "All on track — keep going!",
  readingDoneCount: "{n} subject(s) finished",
  readingAdd: "Add subject",
  readingEmpty: "No reading subjects yet",
  readingEmptyHint: "Press “Add subject”, set chapters & a goal date, then press +1 chapter as you finish each one",
  readNewTitle: "Add reading subject",
  readEditTitle: "Edit reading",
  readSubject: "Subject name",
  readSubjectPh: "e.g. Physics vol. 3",
  readTotalCh: "Total chapters (optional)",
  readCurrentCh: "Current chapter",
  readPercent: "Total percent (optional — auto-calculated from chapters if empty)",
  readPercentPh: "e.g. 40",
  readStart: "Start date",
  readTarget: "Target finish date (optional)",
  readHint: "When you set a goal date, the app calculates how far along you should be by today and warns you when you're “behind”.",
  readChapterStr: "Chapter {current}/{total}",
  readChapterNoTotal: "Chapter {n}",
  readTargetDate: "Goal {date}",
  readNoTarget: "No goal date",
  readDaysLeft: "{n} day(s) left",
  readAddChapter: "+1 ch",
  statusDone: "Done",
  statusBehind: "Behind",
  statusOverTarget: "Past target",
  statusOnTrack: "On track",
  statusReading: "Reading",

  loginTagline: "Calendar · Tasks · Notes · Reading in one place",
  loginGoogle: "Continue with Google",
  loginOr: "or",
  loginIn: "Sign in",
  loginUp: "Sign up",
  loginEmail: "Email",
  loginPassword: "Password (at least 6 chars)",
  loginName: "Name (e.g. Pete)",
  loginSubmitIn: "Sign in",
  loginSubmitUp: "Create account",
  loginSyncNote: "Data syncs through the cloud (Firebase) — same view on phone and computer",
  setupTitle: "Firebase is not configured yet",
  setupBody: "Copy .env.local.example to .env.local, fill in your Firebase values per the README, then restart the app",
  errInvalidCredential: "Wrong email or password",
  errInvalidEmail: "Invalid email format",
  errUserNotFound: "No account found with this email",
  errWrongPassword: "Incorrect password",
  errEmailInUse: "This email is already in use",
  errWeakPassword: "Password must be at least 6 characters",
  errTooMany: "Too many attempts — try again later",
  errNetwork: "Network connection failed",
  errPopup: "Sign-in window closed early — try again",
  errDomain: "This domain is not allowed yet — add it in Firebase Auth",
  errGeneric: "Something went wrong. Please try again",

  notifyOn: "Notifications (on)",
  notifyOff: "Notifications (not enabled yet)",
  notifyUnsupported: "This browser does not support notifications",
  notifyEnable: "Enable notifications",
  notifyDisable: "Disable notifications",
  notifyTest: "Send test push ({n} devices)",
  notifyMsgOn: "Enabled — you'll get deadline alerts with the app open or closed",
  notifyMsgFail: "Couldn't enable — check the README (needs VAPID key + HTTPS)",
  notifyMsgOff: "Disabled — removed your devices from push",
  notifyMsgSent: "Sent to {n} device(s) — check your notification",

  catPhDefault: "None",
  catAddEvent: "New category (category)",
  catAddSubject: "New subject / topic",
  catPhName: "e.g. Entrance exam, Hobby…",
  catAddBtn: "Add category",
  catPick: "Choose category",
  catYours: "Your categories",
  catNone: "No custom categories yet",
  catDeleteBtn: "Delete category",
  catConfirmDelete:
    'Delete category "{name}"? Existing events/tasks keep their data — they just show as default',

  confirmDeleteEvent: 'Delete "{name}"?',
  confirmDeleteTask: 'Delete task "{name}"?',
  confirmDeleteNote: 'Delete note "{name}"?',
  confirmDeleteReading: 'Delete subject "{name}"?',

  labelCategory: "Category",
  labelNote: "Notes (optional)",
  labelDue: "Due date (optional — auto colors by urgency)",
  labelPriority: "Priority",
  weekdayShort: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
};

interface LocaleContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  toggleLocale: () => void;
  t: (key: TKey, vars?: Record<string, string | number>) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() => {
    if (typeof window === "undefined") return "th";
    const saved = window.localStorage.getItem(LANG_KEY);
    return saved === "en" ? "en" : "th";
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(LANG_KEY, locale);
    } catch {
      // ignore
    }
    setDateLocale(locale);
    document.documentElement.lang = locale;
  }, [locale]);

  const t = useCallback(
    (key: TKey, vars?: Record<string, string | number>) => {
      let str = (locale === "th" ? thDict[key] : enDict[key]) as string;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          str = str.replaceAll(`{${k}}`, String(v));
        }
      }
      return str;
    },
    [locale]
  );

  const value = useMemo(
    () => ({ locale, setLocale, toggleLocale: () => setLocale((l) => (l === "th" ? "en" : "th")), t }),
    [locale, t]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale ต้องใช้ภายใน LocaleProvider");
  return ctx;
}

/** ชื่อวันสั้น (7 วัน เริ่มจันทร์) ตามภาษาที่เลือก */
export function weekdayShort(locale: Locale): readonly string[] {
  return locale === "th" ? (thDict.weekdayShort as string[]) : (enDict.weekdayShort as string[]);
}

/** Utility: แปลง locale → date-fns locale */
export function dateFnsLocaleOf(locale: Locale) {
  return locale === "th" ? th : enUS;
}