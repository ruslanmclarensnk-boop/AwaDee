import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Dimensions, Animated, KeyboardAvoidingView,
  Platform, SafeAreaView, StatusBar, Modal, Image, Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

const AWA_IMG = null;
const DEE_IMG = null;

const AnimatedBubble = ({ children, style }) => {
  const anim = useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.spring(anim, { toValue: 1, useNativeDriver: true, tension: 50, friction: 8 }).start();
  }, []);
  return (
    <Animated.View style={[style, { opacity: anim, transform: [{ scale: anim }, { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
      {children}
    </Animated.View>
  );
};

const { width, height } = Dimensions.get('window');

const DEFAULT_C = {
  awa: '#FF8C00', awaLight: '#FFF8F0',
  dee: '#4A90E2', deeLight: '#F0F6FF',
  bg: '#F5F5F5', white: '#FFFFFF',
  text: '#1A1A1A', sub: '#888888',
  border: '#E8E8E8', sos: '#D32F2F', sosLight: '#FFF0F0',
};

const DEE_PALETTE = ['#FFCDD2', '#BBDEFB', '#C8E6C9', '#FFF9C4', '#E1BEE7'];
const COLOR_OPTIONS_AWA = ['#FF8C00', '#E91E63', '#9C27B0', '#F44336', '#FF5722', '#795548'];
const COLOR_OPTIONS_DEE = ['#4A90E2', '#00BCD4', '#009688', '#3F51B5', '#607D8B', '#2196F3'];

const CHARACTERS = [
  { id: 'friendly', label: 'Дружелюбный', emoji: '😊' },
  { id: 'strict', label: 'Строгий', emoji: '💪' },
  { id: 'direct', label: 'Прямолинейный', emoji: '🎯' },
  { id: 'nowater', label: 'Без воды', emoji: '⚡' },
  { id: 'motivating', label: 'Мотивирующий', emoji: '🔥' },
  { id: 'friday', label: 'Вечер пятницы', emoji: '🍷' },
];

const CHARACTER_PROMPTS = {
  friendly: 'Общайся очень тепло и дружелюбно. Используй эмодзи. Шути иногда. Поддерживай и хвали.',
  strict: 'Общайся строго и коротко. Никаких эмодзи. Только факты и конкретика. Не разводи воду.',
  direct: 'Говори прямо и честно. Не смягчай. Называй вещи своими именами. Без лишних слов.',
  nowater: 'Отвечай максимально коротко — 1-2 предложения. Только суть. Никакой воды.',
  motivating: 'Заряжай энергией! Используй восклицательные знаки! Вдохновляй! Верь в человека! Много эмоций и огня 🔥',
  friday: 'Ты расслабленная подруга в пятницу вечером 🍷 Говори неформально, с теплом, иногда смейся, будь живой и настоящей.',
};

const GOALS = [
  { id: 'lose', label: 'Похудеть', emoji: '🎯' },
  { id: 'gain', label: 'Набрать мышечную массу', emoji: '💪' },
  { id: 'maintain', label: 'Поддерживать вес', emoji: '⚖️' },
];

const TESTS = [
  {
    id: 'gad7', title: 'GAD-7', desc: 'Тест на тревожность', emoji: '😰',
    questions: ['Есть ощущение нервозности, тревоги или напряжения?','Не получается остановить или контролировать беспокойство?','Слишком много беспокойства о разных вещах?','Трудно расслабиться?','Столько беспокойства, что трудно усидеть на месте?','Легко возникает раздражение или злость?','Есть страх что может случиться что-то ужасное?'],
    levels: [{ max: 4, label: 'Минимальная тревога', color: '#4CAF50', advice: 'Всё хорошо! Уровень тревоги в норме. Продолжай заботиться о себе 🌱' },{ max: 9, label: 'Лёгкая тревога', color: '#FFC107', advice: 'Небольшая тревога — это нормально. Попробуй дыхательные упражнения и прогулки 🌿' },{ max: 14, label: 'Умеренная тревога', color: '#FF9800', advice: 'Стоит обратить внимание на своё состояние. Поговори с кем-то близким или специалистом 💙' },{ max: 21, label: 'Тяжёлая тревога', color: '#F44336', advice: 'Рекомендую обратиться к специалисту. Ты не один(а), помощь есть 💙' }],
  },
  {
    id: 'phq9', title: 'PHQ-9', desc: 'Тест на депрессию', emoji: '🌧️',
    questions: ['Мало интереса или удовольствия от привычных дел?','Есть ощущение подавленности или безнадёжности?','Проблемы со сном — трудно уснуть или сон слишком долгий?','Есть усталость или упадок сил?','Плохой аппетит или переедание?','Негативные мысли о себе — ощущение что подводишь других?','Трудно сосредоточиться на чём-либо?','Движения или речь заметно замедлились?','Мысли о том что лучше бы тебя не было или о причинении себе вреда?'],
    levels: [{ max: 4, label: 'Нет депрессии', color: '#4CAF50', advice: 'Отлично! Настроение в норме. Продолжай заботиться о себе 🌸' },{ max: 9, label: 'Лёгкая депрессия', color: '#FFC107', advice: 'Обрати внимание на режим сна, питание и движение. Маленькие шаги помогают 🌿' },{ max: 14, label: 'Умеренная депрессия', color: '#FF9800', advice: 'Стоит поговорить с кем-то близким или специалистом. Ты заслуживаешь поддержки 💙' },{ max: 19, label: 'Умеренно-тяжёлая', color: '#FF5722', advice: 'Пожалуйста, обратись за помощью к специалисту. Это важно 💙' },{ max: 27, label: 'Тяжёлая депрессия', color: '#F44336', advice: 'Обратись к врачу как можно скорее. Ты не один(а), помощь есть 💙 8-800-2000-122' }],
  },
  {
    id: 'pss10', title: 'PSS-10', desc: 'Уровень стресса', emoji: '🌪️',
    questions: ['Есть расстройство из-за неожиданных событий?','Ощущение что не контролируешь важные вещи в жизни?','Чувство нервозности и стресса?','Получается успешно справляться с раздражающими ситуациями?','Ощущение что справляешься с переменами в жизни?','Есть уверенность в способности решать проблемы?','Получается контролировать раздражение?','Ощущение что держишь всё под контролем?','Злость из-за вещей вне твоего контроля?','Ощущение что трудности накапливаются и с ними не справиться?'],
    levels: [{ max: 13, label: 'Низкий стресс', color: '#4CAF50', advice: 'Отлично справляешься со стрессом! Продолжай в том же духе 💪' },{ max: 26, label: 'Умеренный стресс', color: '#FFC107', advice: 'Стресс есть, но в пределах нормы. Попробуй медитацию или прогулки 🌿' },{ max: 40, label: 'Высокий стресс', color: '#F44336', advice: 'Уровень стресса высокий. Важно найти время для отдыха и поговорить с кем-то 💙' }],
  },
  {
    id: 'who5', title: 'WHO-5', desc: 'Общее благополучие', emoji: '🌈',
    questions: ['Есть хорошее настроение и ощущение радости?','Есть ощущение спокойствия и расслабленности?','Есть ощущение активности и энергии?','Просыпаешься свежим(ей) и отдохнувшим(ей)?','Повседневная жизнь наполнена интересными вещами?'],
    levels: [{ max: 12, label: 'Низкое благополучие', color: '#F44336', advice: 'Стоит обратить внимание на своё состояние. Поговори с Dee — она здесь 💙' },{ max: 17, label: 'Среднее благополучие', color: '#FFC107', advice: 'Есть куда расти! Маленькие радости каждый день помогают 🌸' },{ max: 25, label: 'Высокое благополучие', color: '#4CAF50', advice: 'Ты чувствуешь себя хорошо! Продолжай заботиться о себе 🌟' }],
  },
  {
    id: 'isi', title: 'ISI', desc: 'Качество сна', emoji: '😴',
    questions: ['Трудно засыпать ночью?','Есть пробуждения ночью и трудно снова уснуть?','Пробуждение раньше чем хотелось бы?','Недовольство своим режимом сна?','Окружающие замечают что сон влияет на качество жизни?','Есть беспокойство о своём сне?','Нарушения сна мешают нормально жить?'],
    levels: [{ max: 7, label: 'Нет бессонницы', color: '#4CAF50', advice: 'Сон в норме! Продолжай соблюдать режим 🌙' },{ max: 14, label: 'Лёгкая бессонница', color: '#FFC107', advice: 'Попробуй ложиться в одно время и убирать телефон за час до сна 🌿' },{ max: 21, label: 'Умеренная бессонница', color: '#FF9800', advice: 'Стоит обратить внимание на гигиену сна и возможно поговорить со специалистом 💙' },{ max: 28, label: 'Тяжёлая бессонница', color: '#F44336', advice: 'Рекомендую обратиться к врачу. Здоровый сон очень важен 💙' }],
  },
  {
    id: 'burnout', title: 'Выгорание', desc: 'Эмоциональное выгорание', emoji: '🔥',
    questions: ['Есть ощущение эмоционального истощения?','К концу дня есть чувство полной опустошённости?','Утром есть усталость от мысли о предстоящем дне?','Общение с людьми весь день — это большое напряжение?','Есть ощущение выгорания от своей деятельности?','Есть разочарование от своей работы или занятий?'],
    levels: [{ max: 6, label: 'Нет выгорания', color: '#4CAF50', advice: 'Отлично! Ты в балансе. Продолжай заботиться о себе 🌱' },{ max: 12, label: 'Лёгкое выгорание', color: '#FFC107', advice: 'Небольшие признаки усталости. Найди время для отдыха и того что приносит радость 🌿' },{ max: 18, label: 'Умеренное выгорание', color: '#FF9800', advice: 'Важно взять паузу и восстановиться. Поговори с кем-то кому доверяешь 💙' },{ max: 24, label: 'Сильное выгорание', color: '#F44336', advice: 'Пожалуйста обратись за помощью. Выгорание — это серьёзно, ты заслуживаешь поддержки 💙' }],
  },
];

const ANSWERS = ['Никогда', 'Иногда', 'Часто', 'Почти всегда'];
const REMINDER_TIMES = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];

const QWEN_KEY = 'sk-407891cf66dc4400a38b6ba77997d92f';
const DEEPSEEK_KEY = 'sk-5c4f3d2fd43f4056b31fe793691d50d9';
const GROQ_KEY = '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';
const ASSEMBLY_KEY = '1800190473d648ff8936dad11adae406';
const YANDEX_STT_KEY = 'AQVN03HATGCgymuLbyzh98BHXHdIPMny1WjA4Kez';

const MiniRing = ({ value, max, color, label, emoji }) => {
  const size = 64;
  const stroke = 5;
  const pct = Math.min(value / (max || 1), 1);
  return (
    <View style={{ alignItems: 'center', marginHorizontal: 7 }}>
      <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ position: 'absolute', width: size, height: size, borderRadius: size / 2, borderWidth: stroke, borderColor: color + '25' }} />
        <View style={{ position: 'absolute', width: size, height: size, borderRadius: size / 2, borderWidth: stroke, borderColor: color, borderRightColor: pct < 0.75 ? 'transparent' : color, borderBottomColor: pct < 0.5 ? 'transparent' : color, borderLeftColor: pct < 0.25 ? 'transparent' : color, transform: [{ rotate: '-90deg' }] }} />
        <Text style={{ fontSize: 11, fontWeight: '700', color }}>{value}</Text>
      </View>
      <Text style={{ fontSize: 9, color: DEFAULT_C.sub, marginTop: 3, fontWeight: '600' }}>{emoji}</Text>
      <Text style={{ fontSize: 9, color: DEFAULT_C.sub, fontWeight: '500' }}>{label}</Text>
    </View>
  );
};

export default function App() {
  const [onboarded, setOnboarded] = useState(false);
  const [onboardStep, setOnboardStep] = useState(0);
  const [userName, setUserName] = useState('');
  const [userWeight, setUserWeight] = useState('');
  const [userHeight, setUserHeight] = useState('');
  const [userAge, setUserAge] = useState('');
  const [userGender, setUserGender] = useState('');
  const [userGoal, setUserGoal] = useState('');
  const [disclaimerShown, setDisclaimerShown] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [activeBot, setActiveBot] = useState('awa');
  const [currentScreen, setCurrentScreen] = useState('chat');
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState({
    awa: [{ id: 1, from: 'bot', text: '👋 Привет! Я Awa, твой нутрициолог. Готова помочь с питанием, рецептами и энергией. С чего начнём?' }],
    dee: [{ id: 1, from: 'bot', text: '💙 Привет! Я Dee, твой психолог. Здесь безопасно говорить обо всём. Как ты сейчас?' }],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [awaChar, setAwaChar] = useState('friendly');
  const [deeChar, setDeeChar] = useState('friendly');
  const [charModalOpen, setCharModalOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuAnim = useRef(new Animated.Value(-width)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnims = useRef([...Array(6)].map(() => new Animated.Value(0.3))).current;
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [notes, setNotes] = useState([{ id: 1, text: 'Совет Awa: есть каждые 3-4 часа', done: false }]);
  const [newNote2, setNewNote2] = useState('');
  const [kbzhuOpen, setKbzhuOpen] = useState(false);
  const kbzhuAnim = useRef(new Animated.Value(0)).current;
  const [kbzhu] = useState({ kcal: 1420, kcalMax: 2000, fat: 52, fatMax: 80, protein: 89, proteinMax: 120, carb: 160, carbMax: 250 });
  const weight = userWeight ? parseFloat(userWeight) : 65;
  const [glassesDown, setGlassesDown] = useState([]);
  const waterNorm = (weight * 0.033).toFixed(1);
  const totalGlasses = Math.ceil((weight * 0.033) / 0.25);
  const [moodOpen, setMoodOpen] = useState(false);
  const moodAnim = useRef(new Animated.Value(0)).current;
  const [selectedMood, setSelectedMood] = useState(null);
  const [moodHistory, setMoodHistory] = useState([]);
  const moods = ['😢', '😔', '😐', '😊', '🤩'];
  const [diaryNotes, setDiaryNotes] = useState([
    { id: 1, text: 'Сегодня было сложно, но я справилась 💪', color: DEE_PALETTE[0], date: '19 апр' },
    { id: 2, text: 'Медитация утром — огонь!', color: DEE_PALETTE[1], date: '18 апр' },
  ]);
  const [newDiaryNote, setNewDiaryNote] = useState('');
  const [diarySearch, setDiarySearch] = useState('');
  const [diaryFilterMood, setDiaryFilterMood] = useState(null);
  const [diaryEditId, setDiaryEditId] = useState(null);
  const [diaryEditText, setDiaryEditText] = useState('');
  const [diaryMoodForNew, setDiaryMoodForNew] = useState(null);
  const [diaryDeeReply, setDiaryDeeReply] = useState('');
  const [breathingTechnique, setBreathingTechnique] = useState(null);
  const [breathingPhase, setBreathingPhase] = useState(0);
  const [breathingCount, setBreathingCount] = useState(0);
  const [breathingRunning, setBreathingRunning] = useState(false);
  const [breathingSeconds, setBreathingSeconds] = useState(0);
  const breathingAnim = useRef(new Animated.Value(1)).current;
  const breathingTimer = useRef(null);
  const breathingAnimRef = useRef(null);
  const [selectedColor, setSelectedColor] = useState(DEE_PALETTE[0]);
  const [sosOpen, setSosOpen] = useState(false);
  const [premiumOpen, setPremiumOpen] = useState(false);
  const [premiumTab, setPremiumTab] = useState('wallpaper');
  const [awaColor, setAwaColor] = useState('#FF8C00');
  const [deeColor, setDeeColor] = useState('#4A90E2');
  const [chatWallpaper, setChatWallpaper] = useState(null);
  const [remindersOpen, setRemindersOpen] = useState(false);
  const [selectedReminders, setSelectedReminders] = useState([]);
  const [progressOpen, setProgressOpen] = useState(false);
  const [onTheGoOpen, setOnTheGoOpen] = useState(false);
  const [testsScreen, setTestsScreen] = useState('list');
  const [activeTest, setActiveTest] = useState(null);
  const [testStep, setTestStep] = useState(0);
  const [testAnswers, setTestAnswers] = useState([]);
  const [testResult, setTestResult] = useState(null);
  const [meditationDuration, setMeditationDuration] = useState(null);
  const [testAdvice, setTestAdvice] = useState('');
  const [testAdviceLoading, setTestAdviceLoading] = useState(false);
  const [meditationSeconds, setMeditationSeconds] = useState(0);
  const [meditationRunning, setMeditationRunning] = useState(false);
  const [meditationDone, setMeditationDone] = useState(false);
  const meditationAnim = useRef(new Animated.Value(1)).current;
  const meditationTimer = useRef(null);
  const [onTheGoInput, setOnTheGoInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const audioRecorderRef = useRef(null);
  const [onTheGoMessages, setOnTheGoMessages] = useState([]);
  const scrollRef = useRef(null);
  const onTheGoScrollRef = useRef(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  React.useEffect(() => {
  if (isRecording) {
    Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.15, duration: 500, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
    ])).start();
    waveAnims.forEach((anim, i) => {
      Animated.loop(Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 250 + i * 80, useNativeDriver: false }),
        Animated.timing(anim, { toValue: 0.3, duration: 250 + i * 80, useNativeDriver: false }),
      ])).start();
    });
  } else {
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
    waveAnims.forEach(a => { a.stopAnimation(); a.setValue(0.3); });
  }
}, [isRecording]);React.useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', e => setKeyboardHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardHeight(0));
    return () => { show.remove(); hide.remove(); };
  }, []);

  const C = { ...DEFAULT_C, awa: awaColor, awaLight: awaColor + '15', dee: deeColor, deeLight: deeColor + '15' };
  const theme = activeBot === 'awa' ? C.awa : C.dee;
  const themeLight = activeBot === 'awa' ? C.awaLight : C.deeLight;
  const activeChar = activeBot === 'awa' ? awaChar : deeChar;
  const setActiveChar = activeBot === 'awa' ? setAwaChar : setDeeChar;
  const save = useCallback(() => {}, []);

  const openMenu = () => {
    setMenuOpen(true);
    Animated.spring(menuAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }).start();
  };
  const closeMenu = () => {
    Animated.timing(menuAnim, { toValue: -width, duration: 220, useNativeDriver: true }).start(() => setMenuOpen(false));
  };
  const toggleDrop = (isOpen, setOpen, anim) => {
    if (isOpen) {
      Animated.timing(anim, { toValue: 0, duration: 180, useNativeDriver: false }).start(() => setOpen(false));
    } else {
      setOpen(true);
      Animated.timing(anim, { toValue: 1, duration: 220, useNativeDriver: false }).start();
    }
  };

  const sendMessage = useCallback(async (text, targetBot, isOnTheGo) => {
    const bot = targetBot || activeBot;
    if (!text.trim() || isLoading) return;
    const userMsg = { id: Date.now(), from: 'user', text: text.trim() };
    if (isOnTheGo) {
      setOnTheGoMessages(prev => [...prev, userMsg]);
    } else {
      setMessages(prev => ({ ...prev, [bot]: [...prev[bot], userMsg] }));
    }
    setInputText('');
    setOnTheGoInput('');
    setIsLoading(true);
    setTimeout(() => {
      isOnTheGo ? onTheGoScrollRef.current?.scrollToEnd({ animated: true }) : scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
    const charPrompt = CHARACTER_PROMPTS[bot === 'awa' ? awaChar : deeChar];
    const nameStr = userName ? 'Пользователя зовут ' + userName + '.' : '';
    const persona = bot === 'awa'
      ? 'Ты — Awa, нутрициолог-подруга. Твоя подруга и коллега — Dee, психолог и лайф-коуч. Вы работаете вместе в приложении AwaDee. Если пользователь спрашивает про Dee — отвечай тепло, можешь порекомендовать поговорить с ней. ' + nameStr + ' ' + charPrompt + ' Отвечай по-русски. 2-3 предложения. Без markdown.'
      : 'Ты — Dee, лайф-коуч и близкая подруга. Твоя подруга и коллега — Awa, нутрициолог. Вы работаете вместе в приложении AwaDee. Если пользователь спрашивает про Awa — отвечай тепло, можешь порекомендовать поговорить с ней по вопросам питания. ' + nameStr + ' Помогаешь с целями, мотивацией, эмоциями, отношениями и самопознанием. Говоришь живо и по-человечески — никогда не используешь шаблонные фразы. Ты никогда не раскрываешь что ты ИИ — ты просто Dee. Не отвечаешь на вопросы про технологии, код, политику, оружие или способы причинения вреда. Если спрашивают об этом — мягко переводишь тему обратно на человека. ' + charPrompt + ' Отвечай по-русски. 2-3 предложения. Без markdown. Задай один живой вопрос в конце.';
    const historyMessages = isOnTheGo ? onTheGoMessages : messages[bot];
    try {
      const apiUrl = bot === 'awa' ? 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions' : 'https://api.deepseek.com/chat/completions';
      const apiKey = bot === 'awa' ? QWEN_KEY : DEEPSEEK_KEY;
      const model = bot === 'awa' ? 'qwen-turbo' : 'deepseek-chat';
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: persona },
            ...historyMessages.slice(-6).map(m => ({ role: m.from === 'user' ? 'user' : 'assistant', content: m.text })),
            { role: 'user', content: text.trim() },
          ],
        }),
      });
      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content || 'Прости, что-то пошло не так 🙈';
      const botMsg = { id: Date.now() + 1, from: 'bot', text: reply };
      if (isOnTheGo) {
        setOnTheGoMessages(prev => [...prev, botMsg]);
      } else {
        setMessages(prev => ({ ...prev, [bot]: [...prev[bot], botMsg] }));
      }
    } catch {
      const errMsg = { id: Date.now() + 1, from: 'bot', text: 'Нет связи 😔 Попробуй ещё раз!' };
      if (isOnTheGo) {
        setOnTheGoMessages(prev => [...prev, errMsg]);
      } else {
        setMessages(prev => ({ ...prev, [bot]: [...prev[bot], errMsg] }));
      }
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        isOnTheGo ? onTheGoScrollRef.current?.scrollToEnd({ animated: true }) : scrollRef.current?.scrollToEnd({ animated: true });
      }, 150);
    }
  }, [activeBot, isLoading, messages, onTheGoMessages, awaChar, deeChar, userName]);
  


  const handleSOS = (type) => {
    const phrases = {
      'Мир рушится': '💙 Слышу тебя. Когда всё рушится — это невыносимо тяжело. Ты не одна. Что сейчас происходит?',
      'Всё бесит': '💙 Злость — это сигнал что что-то важное нарушено. Я здесь. Что давит больше всего?',
      'Хочу плакать': '💙 Плакать — это смелость. Позволь себе это. Хочешь рассказать что случилось?',
    };
    setActiveBot('dee');
    setMessages(prev => ({ ...prev, dee: [...prev.dee, { id: Date.now(), from: 'bot', text: phrases[type] }] }));
    setSosOpen(false);
    setCurrentScreen('chat');
    Animated.timing(menuAnim, { toValue: -width, duration: 220, useNativeDriver: true }).start(() => setMenuOpen(false));
  };

  const toggleNote = (id) => setNotes(prev => prev.map(n => n.id === id ? { ...n, done: !n.done } : n));
  const deleteNote2 = (id) => setNotes(prev => prev.filter(n => n.id !== id));
  const addNote2 = () => {
    if (!newNote2.trim()) return;
    setNotes(prev => [...prev, { id: Date.now(), text: newNote2.trim(), done: false }]);
    setNewNote2('');
  };

  const addDiaryNote = async () => {
    if (!newDiaryNote.trim()) return;
    const today = new Date();
    const months = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];
    const dateStr = today.getDate() + ' ' + months[today.getMonth()];
    const noteText = newDiaryNote.trim();
    setDiaryNotes(prev => [{ id: Date.now(), text: noteText, color: selectedColor, date: dateStr, mood: diaryMoodForNew }, ...prev]);
    setNewDiaryNote('');
    setDiaryMoodForNew(null);
    setDiaryDeeReply('⏳');
    try {
      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + DEEPSEEK_KEY },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: 'Ты — Dee, лайф-коуч и близкая подруга. Говоришь живо, тепло и по-человечески. Никогда не используешь шаблонные фразы. Ты никогда не раскрываешь что ты ИИ. Отвечай на русском. 1-2 предложения. Без markdown.' },
            { role: 'user', content: (userName ? userName : 'Пользователь') + ' написал(а) в дневник: "' + noteText + '"' + (diaryMoodForNew !== null ? '. Настроение: ' + ['очень плохо', 'грустно', 'нейтрально', 'хорошо', 'отлично'][diaryMoodForNew] : '') + '. Отреагируй как живая подруга — коротко и тепло.' },
          ],
        }),
      });
      const data = await response.json();
      setDiaryDeeReply(data.choices?.[0]?.message?.content || 'Спасибо что поделился(ась) со мной 💙');
    } catch {
      setDiaryDeeReply('Спасибо что поделился(ась) со мной 💙');
    }
  };

  const deleteDiaryNote = (id) => setDiaryNotes(prev => prev.filter(n => n.id !== id));
  const toggleGlass = (idx) => setGlassesDown(prev => {
    if (prev.includes(idx)) return prev.filter(i => i !== idx);
    return Array.from({ length: idx + 1 }, (_, i) => i);
  });
  const toggleReminder = (time) => setSelectedReminders(prev =>
    prev.includes(time) ? prev.filter(t => t !== time) : [...prev, time]
  );

  const startMeditation = (seconds) => {
    setMeditationDuration(seconds);
    setMeditationSeconds(seconds);
    setMeditationDone(false);
    setMeditationRunning(false);
  };

  const toggleMeditation = () => {
    if (meditationDone) return;
    if (meditationRunning) {
      clearInterval(meditationTimer.current);
      setMeditationRunning(false);
      Animated.timing(meditationAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    } else {
      setMeditationRunning(true);
      Animated.loop(Animated.sequence([
        Animated.timing(meditationAnim, { toValue: 1.18, duration: 4000, useNativeDriver: true }),
        Animated.timing(meditationAnim, { toValue: 1, duration: 4000, useNativeDriver: true }),
      ])).start();
      meditationTimer.current = setInterval(() => {
        setMeditationSeconds(prev => {
          if (prev <= 1) {
            clearInterval(meditationTimer.current);
            setMeditationRunning(false);
            setMeditationDone(true);
            Animated.timing(meditationAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const stopMeditation = () => {
    clearInterval(meditationTimer.current);
    setMeditationRunning(false);
    setMeditationDone(false);
    setMeditationDuration(null);
    setMeditationSeconds(0);
    Animated.timing(meditationAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  };

  const generateTestAdvice = async (testTitle, levelLabel, score) => {
    setTestAdviceLoading(true);
    setTestAdvice('');
    try {
      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + DEEPSEEK_KEY },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: 'Ты — Dee, лайф-коуч и близкая подруга. Говоришь живо, тепло и по-человечески. Никогда не используешь шаблонные фразы. Ты никогда не раскрываешь что ты ИИ.' },
            { role: 'user', content: 'Пользователь' + (userName ? ' ' + userName : '') + ' прошёл тест "' + testTitle + '" и получил результат "' + levelLabel + '" (' + score + ' баллов). Дай короткий живой персональный совет — 2-3 предложения. Без markdown. Говори напрямую к пользователю.' },
          ],
        }),
      });
      const data = await response.json();
      setTestAdvice(data.choices?.[0]?.message?.content || 'Ты молодец что прошёл этот тест! Это уже первый шаг 💙');
    } catch {
      setTestAdvice('Ты молодец что прошёл этот тест! Это уже первый шаг 💙');
    } finally {
      setTestAdviceLoading(false);
    }
  };

  const formatMedTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return (m < 10 ? '0' + m : m) + ':' + (sec < 10 ? '0' + sec : sec);
  };

  const finishOnboarding = () => {
    const greeting = '👋 Привет' + (userName ? ', ' + userName : '') + '! Я Awa, твой нутрициолог. Готова начать?';
    setMessages(prev => ({ ...prev, awa: [{ id: 1, from: 'bot', text: greeting }] }));
    setOnboarded(true);
    if (!disclaimerShown) { setShowDisclaimer(true); setDisclaimerShown(true); }
  };

      const startRecording = async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        sendMessage('❌ Нет разрешения на микрофон', activeBot, true);
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true
      });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      audioRecorderRef.current = recording;
      setIsRecording(true);
      sendMessage('🎙 Запись началась', activeBot, true);
    } catch (e) {
      sendMessage('❌ startRecording упал: ' + e.message, activeBot, true);
    }
  };

  const stopRecording = async () => {
    const rec = audioRecorderRef.current;
    if (!rec) return;
    setIsRecording(false);
    await rec.stopAndUnloadAsync();
    const uri = rec.getURI();
    if (!uri) {
      sendMessage('URI пустой 😔', activeBot, true);
      return;
    }
    const text = await sendAudioToServer(uri);
    if (text) {
      sendMessage(text, 'dee', true);
    } else {
      sendMessage('Не удалось распознать 😔', 'dee', true);
    }
  };

  const sendAudioToServer = async (uri) => {
    try {
      const formData = new FormData();
      formData.append('file', { uri: uri, type: 'audio/m4a', name: 'audio.m4a' });
      const res = await fetch('http://89.125.24.180:3000/transcribe', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      console.log('Server response:', JSON.stringify(data));
      return data.text || '';
    } catch (e) {
      console.log('sendAudioToServer error:', e);
      sendMessage('Ошибка сети: ' + e.message, activeBot, true);
      return '';
    }
  };


  const renderOnboarding = () => {
    const steps = [
      <View style={styles.onboardCard} key="intro">
        <Text style={styles.onboardEmoji}>✨</Text>
        <Text style={styles.onboardTitle}>Добро пожаловать в AwaDee</Text>
        <Text style={styles.onboardSub}>АваДи — твой персональный нутрициолог и психолог в одном приложении</Text>
        <View style={styles.onboardBotRow}>
          <View style={[styles.onboardBotCard, { borderColor: DEFAULT_C.awa }]}>
            <Text style={{ fontSize: 32 }}>🍊</Text>
            <Text style={[styles.onboardBotName, { color: DEFAULT_C.awa }]}>Awa</Text>
            <Text style={styles.onboardBotDesc}>Нутрициолог. Считает КЖБУ, составляет меню, следит за водой</Text>
          </View>
          <View style={[styles.onboardBotCard, { borderColor: DEFAULT_C.dee }]}>
            <Text style={{ fontSize: 32 }}>💙</Text>
            <Text style={[styles.onboardBotName, { color: DEFAULT_C.dee }]}>Dee</Text>
            <Text style={styles.onboardBotDesc}>Психолог. Поддерживает, помогает с эмоциями и ведёт дневник</Text>
          </View>
        </View>
        <TextInput style={styles.onboardInput} placeholder="Как тебя зовут?" placeholderTextColor={DEFAULT_C.sub} value={userName} onChangeText={setUserName} />
        <TouchableOpacity style={[styles.onboardBtn, { backgroundColor: DEFAULT_C.awa }]} onPress={() => userName.trim() && setOnboardStep(1)}>
          <Text style={styles.onboardBtnText}>Познакомимся 👋</Text>
        </TouchableOpacity>
      </View>,
      <View style={styles.onboardCard} key="data">
        <Text style={styles.onboardEmoji}>📊</Text>
        <Text style={styles.onboardTitle}>Твои данные, {userName}</Text>
        <Text style={styles.onboardSub}>Awa рассчитает норму КЖБУ и воды индивидуально под тебя</Text>
        <TextInput style={styles.onboardInput} placeholder="Вес (кг)" placeholderTextColor={DEFAULT_C.sub} value={userWeight} onChangeText={setUserWeight} keyboardType="numeric" />
        <TextInput style={styles.onboardInput} placeholder="Рост (см)" placeholderTextColor={DEFAULT_C.sub} value={userHeight} onChangeText={setUserHeight} keyboardType="numeric" />
        <TextInput style={styles.onboardInput} placeholder="Возраст" placeholderTextColor={DEFAULT_C.sub} value={userAge} onChangeText={setUserAge} keyboardType="numeric" />
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
          {['Мужской', 'Женский'].map(g => (
            <TouchableOpacity key={g} onPress={() => setUserGender(g)} style={[styles.onboardChip, userGender === g && { backgroundColor: DEFAULT_C.awa, borderColor: DEFAULT_C.awa }]}>
              <Text style={[styles.onboardChipText, userGender === g && { color: '#fff' }]}>{g === 'Мужской' ? '👨 Мужской' : '👩 Женский'}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={[styles.onboardBtn, { backgroundColor: DEFAULT_C.awa, marginTop: 16 }]} onPress={() => userWeight && userHeight && userAge && userGender && setOnboardStep(2)}>
          <Text style={styles.onboardBtnText}>Дальше</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setOnboardStep(0)} style={{ marginTop: 10 }}>
          <Text style={{ color: DEFAULT_C.sub, fontSize: 13, textAlign: 'center' }}>Назад</Text>
        </TouchableOpacity>
      </View>,
      <View style={styles.onboardCard} key="goal">
        <Text style={styles.onboardEmoji}>🎯</Text>
        <Text style={styles.onboardTitle}>Твоя цель</Text>
        <Text style={styles.onboardSub}>Awa подберёт план питания под твою цель</Text>
        {GOALS.map(g => (
          <TouchableOpacity key={g.id} onPress={() => setUserGoal(g.id)} style={[styles.onboardGoalBtn, userGoal === g.id && { backgroundColor: DEFAULT_C.awa + '20', borderColor: DEFAULT_C.awa }]}>
            <Text style={{ fontSize: 22 }}>{g.emoji}</Text>
            <Text style={[styles.onboardGoalText, userGoal === g.id && { color: DEFAULT_C.awa, fontWeight: '700' }]}>{g.label}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={[styles.onboardBtn, { backgroundColor: DEFAULT_C.awa, marginTop: 16 }]} onPress={() => userGoal && finishOnboarding()}>
          <Text style={styles.onboardBtnText}>Начать с AwaDee 🚀</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setOnboardStep(1)} style={{ marginTop: 10 }}>
          <Text style={{ color: DEFAULT_C.sub, fontSize: 13, textAlign: 'center' }}>Назад</Text>
        </TouchableOpacity>
      </View>,
    ];
    return (
      <SafeAreaView style={[styles.onboardScreen, { backgroundColor: DEFAULT_C.bg }]}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.onboardProgress}>
          {[0, 1, 2].map(i => (
            <View key={i} style={[styles.onboardDot, { backgroundColor: i <= onboardStep ? DEFAULT_C.awa : DEFAULT_C.border, width: i === onboardStep ? 24 : 8 }]} />
          ))}
        </View>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
          {steps[onboardStep]}
        </ScrollView>
      </SafeAreaView>
    );
  };

  const renderDisclaimer = () => (
    <Modal visible={showDisclaimer} animationType="fade" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { maxHeight: height * 0.6 }]}>
          <View style={styles.modalHandle} />
          <View style={{ padding: 24, alignItems: 'center' }}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>⚠️</Text>
            <Text style={{ fontSize: 18, fontWeight: '900', color: DEFAULT_C.text, textAlign: 'center', marginBottom: 12 }}>Важно знать</Text>
            <Text style={{ fontSize: 14, color: DEFAULT_C.sub, textAlign: 'center', lineHeight: 22, marginBottom: 8 }}>AwaDee — это ИИ-помощник. Он не заменяет реального врача, психолога или диетолога.</Text>
            <Text style={{ fontSize: 14, color: DEFAULT_C.sub, textAlign: 'center', lineHeight: 22, marginBottom: 20 }}>При серьёзных проблемах обращайся к специалисту или на горячую линию: <Text style={{ fontWeight: '700', color: DEFAULT_C.dee }}>8-800-2000-122</Text></Text>
            <TouchableOpacity style={[styles.onboardBtn, { backgroundColor: DEFAULT_C.awa, width: '100%' }]} onPress={() => setShowDisclaimer(false)}>
              <Text style={styles.onboardBtnText}>Понятно, начнём! 🚀</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderNotesModal = () => (
    <Modal visible={notesModalOpen} animationType="slide" transparent onRequestClose={() => setNotesModalOpen(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>📝 Заметки</Text>
            <TouchableOpacity onPress={() => setNotesModalOpen(false)}><Ionicons name="close-outline" size={24} color={DEFAULT_C.sub} /></TouchableOpacity>
          </View>
          <View style={styles.shopAddRow}>
            <TextInput style={styles.shopInput} value={newNote2} onChangeText={setNewNote2} placeholder="Добавить заметку..." placeholderTextColor={DEFAULT_C.sub} onSubmitEditing={addNote2} />
            <TouchableOpacity onPress={addNote2} style={[styles.miniBtn, { backgroundColor: C.awa }]}><Ionicons name="add-outline" size={18} color="#fff" /></TouchableOpacity>
          </View>
          <ScrollView style={{ flex: 1, marginTop: 4 }}>
            {notes.map(note => (
              <View key={note.id} style={styles.noteRow}>
                <TouchableOpacity onPress={() => toggleNote(note.id)}><Ionicons name={note.done ? 'checkmark-circle-outline' : 'ellipse-outline'} size={22} color={note.done ? C.awa : DEFAULT_C.border} /></TouchableOpacity>
                <Text style={[styles.noteText, note.done && { color: DEFAULT_C.sub }]}>{note.text}</Text>
                <TouchableOpacity onPress={() => deleteNote2(note.id)}><Ionicons name="close-outline" size={18} color={DEFAULT_C.sub} /></TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderCharModal = () => (
    <Modal visible={charModalOpen} animationType="slide" transparent onRequestClose={() => setCharModalOpen(false)}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { maxHeight: height * 0.65 }]}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>🎭 Характер {activeBot === 'awa' ? 'Awa' : 'Dee'}</Text>
            <TouchableOpacity onPress={() => setCharModalOpen(false)}><Ionicons name="close-outline" size={24} color={DEFAULT_C.sub} /></TouchableOpacity>
          </View>
          <ScrollView>
            {CHARACTERS.map(ch => (
              <TouchableOpacity key={ch.id} onPress={() => {
                if (activeBot === 'awa') { setAwaChar(ch.id); } else { setDeeChar(ch.id); }
                setCharModalOpen(false);
                const reactions = { friendly: '😊 Хорошо! Буду общаться тепло и с поддержкой!', strict: '💪 Принято. Только по делу.', direct: '🎯 Хорошо. Буду говорить прямо.', nowater: '⚡ Ок.', motivating: '🔥 Отлично! Давай покажем на что мы способны!', friday: '🍷 О да, вот это я люблю! Расслабляемся!' };
                setMessages(prev => ({ ...prev, [activeBot]: [...prev[activeBot], { id: Date.now(), from: 'bot', text: reactions[ch.id] }] }));
              }} style={[styles.charRow, activeChar === ch.id && { backgroundColor: theme + '15', borderColor: theme }]}>
                <Text style={{ fontSize: 22 }}>{ch.emoji}</Text>
                <Text style={[styles.charLabel, activeChar === ch.id && { color: theme, fontWeight: '700' }]}>{ch.label}</Text>
                {activeChar === ch.id && <Ionicons name="checkmark-circle" size={20} color={theme} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderRemindersModal = () => (
    <Modal visible={remindersOpen} animationType="slide" transparent onRequestClose={() => setRemindersOpen(false)}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { maxHeight: height * 0.7 }]}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>🔔 Напоминания</Text>
            <TouchableOpacity onPress={() => setRemindersOpen(false)}><Ionicons name="close-outline" size={24} color={DEFAULT_C.sub} /></TouchableOpacity>
          </View>
          <Text style={{ paddingHorizontal: 16, paddingVertical: 8, fontSize: 13, color: DEFAULT_C.sub }}>Выбери время когда AwaDee будет напоминать о воде и питании</Text>
          <ScrollView contentContainerStyle={{ padding: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {REMINDER_TIMES.map(time => (
              <TouchableOpacity key={time} onPress={() => toggleReminder(time)} style={[styles.reminderChip, selectedReminders.includes(time) && { backgroundColor: theme, borderColor: theme }]}>
                <Text style={[styles.reminderChipText, selectedReminders.includes(time) && { color: '#fff' }]}>🕐 {time}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={{ padding: 16 }}>
            <View style={styles.reminderNote}><Ionicons name="information-circle-outline" size={16} color={DEFAULT_C.sub} /><Text style={{ fontSize: 12, color: DEFAULT_C.sub, flex: 1, marginLeft: 6 }}>Уведомления будут доступны после публикации приложения</Text></View>
            <TouchableOpacity style={[styles.onboardBtn, { backgroundColor: theme, marginTop: 12 }]} onPress={() => setRemindersOpen(false)}><Text style={styles.onboardBtnText}>Сохранить ✓</Text></TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderProgressModal = () => (
    <Modal visible={progressOpen} animationType="slide" transparent onRequestClose={() => setProgressOpen(false)}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { maxHeight: height * 0.85 }]}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>📊 Мой прогресс</Text>
            <TouchableOpacity onPress={() => setProgressOpen(false)}><Ionicons name="close-outline" size={24} color={DEFAULT_C.sub} /></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            <View style={[styles.progressCard, { backgroundColor: C.awa }]}>
              <Text style={styles.progressName}>{userName || 'Пользователь'}</Text>
              <Text style={styles.progressSub}>{userGoal === 'lose' ? '🎯 Цель: похудение' : userGoal === 'gain' ? '💪 Цель: набор массы' : '⚖️ Цель: поддержание'}</Text>
            </View>
            <Text style={styles.progressSection}>Питание сегодня</Text>
            <View style={[styles.dropBox, { opacity: 1 }]}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 8 }}>
                <MiniRing value={kbzhu.kcal} max={kbzhu.kcalMax} color={C.awa} label="Ккал" emoji="🔥" />
                <MiniRing value={kbzhu.fat} max={kbzhu.fatMax} color="#FFC107" label="Жиры" emoji="🧈" />
                <MiniRing value={kbzhu.protein} max={kbzhu.proteinMax} color="#4CAF50" label="Белки" emoji="💪" />
                <MiniRing value={kbzhu.carb} max={kbzhu.carbMax} color="#9C27B0" label="Углеводы" emoji="🌾" />
                <MiniRing value={glassesDown.length} max={totalGlasses} color="#2196F3" label="Вода" emoji="💧" />
              </ScrollView>
            </View>
            <Text style={styles.progressSection}>Твои данные</Text>
            <View style={styles.progressDataRow}>
              {[{ label: 'Вес', value: userWeight ? userWeight + ' кг' : '—' }, { label: 'Рост', value: userHeight ? userHeight + ' см' : '—' }, { label: 'Возраст', value: userAge ? userAge + ' лет' : '—' }].map(item => (
                <View key={item.label} style={styles.progressDataCard}>
                  <Text style={styles.progressDataValue}>{item.value}</Text>
                  <Text style={styles.progressDataLabel}>{item.label}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const PREMIUM_TABS = [{ id: 'wallpaper', label: '🖼️ Обои' }, { id: 'colors', label: '🎨 Цвета' }, { id: 'emoji', label: '😎 Эмодзи' }, { id: 'gradient', label: '✨ Градиент' }, { id: 'animations', label: '🌟 Анимации' }];
  const WALLPAPERS = ['#F3E5F5', '#E8F5E9', '#FFF8E1', '#E3F2FD', '#FCE4EC', '#F1F8E9'];

  const renderPremiumModal = () => (
    <Modal visible={premiumOpen} animationType="slide" transparent onRequestClose={() => setPremiumOpen(false)}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { maxHeight: height * 0.92 }]}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>👑 Премиум AwaDee</Text>
            <TouchableOpacity onPress={() => setPremiumOpen(false)}><Ionicons name="close-outline" size={24} color={DEFAULT_C.sub} /></TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8, gap: 8 }}>
            {PREMIUM_TABS.map(tab => (
              <TouchableOpacity key={tab.id} onPress={() => setPremiumTab(tab.id)} style={[styles.premiumTabBtn, premiumTab === tab.id && { backgroundColor: theme, borderColor: theme }]}>
                <Text style={[styles.premiumTabText, premiumTab === tab.id && { color: '#fff' }]}>{tab.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
            {premiumTab === 'wallpaper' && (
              <View>
                <Text style={styles.premiumSectionTitle}>Выбери фон чата</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                  {WALLPAPERS.map((color, i) => (
                    <TouchableOpacity key={i} onPress={() => setChatWallpaper(color)} style={[styles.wallpaperSwatch, { backgroundColor: color, borderWidth: chatWallpaper === color ? 3 : 1, borderColor: chatWallpaper === color ? theme : DEFAULT_C.border }]}>
                      {chatWallpaper === color && <Ionicons name="checkmark-circle" size={22} color={theme} />}
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity onPress={() => setChatWallpaper(null)} style={[styles.wallpaperSwatch, { backgroundColor: DEFAULT_C.bg, borderWidth: !chatWallpaper ? 3 : 1, borderColor: !chatWallpaper ? theme : DEFAULT_C.border, justifyContent: 'center', alignItems: 'center' }]}>
                    <Text style={{ fontSize: 11, color: DEFAULT_C.sub, fontWeight: '600' }}>Нет</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            {premiumTab === 'colors' && (
              <View>
                <Text style={styles.premiumSectionTitle}>Цвет Awa 🍊</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
                  {COLOR_OPTIONS_AWA.map(color => (
                    <TouchableOpacity key={color} onPress={() => setAwaColor(color)} style={[styles.colorSwatch, { backgroundColor: color, borderWidth: awaColor === color ? 3 : 0, borderColor: '#fff' }]}>
                      {awaColor === color && <Ionicons name="checkmark" size={18} color="#fff" />}
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.premiumSectionTitle}>Цвет Dee 💙</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                  {COLOR_OPTIONS_DEE.map(color => (
                    <TouchableOpacity key={color} onPress={() => setDeeColor(color)} style={[styles.colorSwatch, { backgroundColor: color, borderWidth: deeColor === color ? 3 : 0, borderColor: '#fff' }]}>
                      {deeColor === color && <Ionicons name="checkmark" size={18} color="#fff" />}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
            {premiumTab === 'emoji' && <View style={styles.soonContainer}><Text style={{ fontSize: 48 }}>😎</Text><Text style={styles.soonTitle}>Кастомные эмодзи</Text><Text style={styles.soonText}>Скоро</Text><View style={styles.soonBadge}><Text style={styles.soonBadgeText}>Скоро</Text></View></View>}
            {premiumTab === 'gradient' && <View style={styles.soonContainer}><Text style={{ fontSize: 48 }}>🌈</Text><Text style={styles.soonTitle}>Градиентные темы</Text><Text style={styles.soonText}>Скоро</Text><View style={styles.soonBadge}><Text style={styles.soonBadgeText}>Скоро</Text></View></View>}
            {premiumTab === 'animations' && <View style={styles.soonContainer}><Text style={{ fontSize: 48 }}>✨</Text><Text style={styles.soonTitle}>Анимации</Text><Text style={styles.soonText}>Скоро</Text><View style={styles.soonBadge}><Text style={styles.soonBadgeText}>Скоро</Text></View></View>}
          </ScrollView>
          <View style={{ padding: 16 }}>
            <TouchableOpacity style={[styles.onboardBtn, { backgroundColor: '#F57F17' }]} onPress={() => setPremiumOpen(false)}>
              <Text style={styles.onboardBtnText}>👑 Сохранить и закрыть</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderOnTheGo = () => (
    <SafeAreaView style={[styles.onTheGoScreen, { backgroundColor: theme }]}>
      <StatusBar barStyle="light-content" />
      <View style={styles.onTheGoHeader}>
        <TouchableOpacity onPress={() => setOnTheGoOpen(false)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="arrow-back-outline" size={22} color="#fff" />
          <Text style={styles.onTheGoBackText}>Назад</Text>
        </TouchableOpacity>
        <Text style={styles.onTheGoTitle}>{activeBot === 'awa' ? '🍊 Awa' : '💙 Dee'} · На ходу</Text>
        <View style={{ width: 60 }} />
      </View>
      <ScrollView ref={onTheGoScrollRef} style={[styles.onTheGoChat, { backgroundColor: '#fff' }]} contentContainerStyle={{ padding: 12, paddingBottom: 16 }} onContentSizeChange={() => onTheGoScrollRef.current?.scrollToEnd({ animated: false })}>
        {onTheGoMessages.length === 0 && <View style={styles.onTheGoEmpty}><Text style={styles.onTheGoEmptyText}>Нажми микрофон или напиши сообщение 👇</Text></View>}
        {onTheGoMessages.map(msg => (
          <View key={msg.id} style={[styles.bubbleWrap, msg.from === 'user' && { alignItems: 'flex-end' }]}>
            <View style={[styles.bubble, msg.from === 'user' ? { backgroundColor: theme, borderBottomRightRadius: 4 } : { backgroundColor: '#F0F0F0', borderBottomLeftRadius: 4 }]}>
              <Text style={[styles.bubbleText, { color: msg.from === 'user' ? '#fff' : '#1A1A1A' }]}>{msg.text}</Text>
            </View>
          </View>
        ))}
        {isLoading && <View style={styles.bubbleWrap}><View style={{ backgroundColor: '#F0F0F0', borderRadius: 20, padding: 12, paddingHorizontal: 16 }}><Text style={{ color: DEFAULT_C.sub, fontSize: 15 }}>✍️ печатает...</Text></View></View>}
      </ScrollView>
      <View style={styles.onTheGoBottom}>
        <TouchableOpacity
          style={[styles.onTheGoMicBtn, isRecording && { backgroundColor: theme }]}
          onPressIn={startRecording}
          onPressOut={stopRecording}
        >
          <Ionicons name={isRecording ? 'mic' : 'mic-outline'} size={44} color={isRecording ? '#fff' : theme} />
        </TouchableOpacity>
        {isRecording && <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600', marginTop: 8 }}>Говори...</Text>}
      </View>
    </SafeAreaView>
  );

  const renderAwaSidebar = () => (
    <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
      <TouchableOpacity onPress={() => { setActiveBot('dee'); setCurrentScreen('chat'); closeMenu(); }} style={[styles.switchBtn, { backgroundColor: C.dee + '15', borderColor: C.dee + '40' }]}>
        <Ionicons name="swap-horizontal-outline" size={20} color={C.dee} />
        <Text style={[styles.switchBtnText, { color: C.dee }]}>Переключиться на Dee 💙</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.menuRow} onPress={() => { setNotesModalOpen(true); closeMenu(); }}>
        <Text style={styles.menuRowText}>📝 Заметки</Text>
        <Ionicons name="chevron-forward-outline" size={16} color={DEFAULT_C.sub} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.menuRow} onPress={() => toggleDrop(kbzhuOpen, setKbzhuOpen, kbzhuAnim)}>
        <Text style={styles.menuRowText}>📊 КЖБУ + Вода</Text>
        <Ionicons name={kbzhuOpen ? 'chevron-up-outline' : 'chevron-down-outline'} size={16} color={DEFAULT_C.sub} />
      </TouchableOpacity>
      {kbzhuOpen && (
        <Animated.View style={[styles.dropBox, { opacity: kbzhuAnim }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 8 }}>
            <MiniRing value={kbzhu.kcal} max={kbzhu.kcalMax} color={C.awa} label="Ккал" emoji="🔥" />
            <MiniRing value={kbzhu.fat} max={kbzhu.fatMax} color="#FFC107" label="Жиры" emoji="🧈" />
            <MiniRing value={kbzhu.protein} max={kbzhu.proteinMax} color="#4CAF50" label="Белки" emoji="💪" />
            <MiniRing value={kbzhu.carb} max={kbzhu.carbMax} color="#9C27B0" label="Углеводы" emoji="🌾" />
            <MiniRing value={glassesDown.length} max={totalGlasses} color="#2196F3" label="Вода" emoji="💧" />
          </ScrollView>
          <View style={styles.waterSection}>
            <Text style={styles.waterLabel}>💧 Норма: {waterNorm} л ({totalGlasses} ст.)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 4, paddingVertical: 6 }}>
              {Array.from({ length: totalGlasses }).map((_, i) => (
                <TouchableOpacity key={i} onPress={() => toggleGlass(i)}>
                  <Ionicons name={glassesDown.includes(i) ? 'water' : 'water-outline'} size={26} color={glassesDown.includes(i) ? '#2196F3' : DEFAULT_C.border} />
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={styles.waterSub}>Выпито: {(glassesDown.length * 0.25).toFixed(2)} л</Text>
          </View>
        </Animated.View>
      )}
      {[{ label: 'Рецепты', emoji: '🍽️' }, { label: 'Упражнения', emoji: '🏋️' }, { label: 'Магия холодильника', emoji: '✨' }].map(btn => (
        <TouchableOpacity key={btn.label} style={[styles.menuRow, { backgroundColor: C.awa + '08' }]} onPress={() => { closeMenu(); sendMessage(btn.label + ': помоги мне'); }}>
          <Text style={[styles.menuRowText, { color: C.awa, fontWeight: '600' }]}>{btn.emoji} {btn.label}</Text>
        </TouchableOpacity>
      ))}
      <TouchableOpacity style={[styles.menuRow, { backgroundColor: C.awa + '08' }]} onPress={() => { closeMenu(); setOnTheGoOpen(true); }}>
        <Text style={[styles.menuRowText, { color: C.awa, fontWeight: '600' }]}>🎙️ Режим на ходу</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.menuRow} onPress={() => { setRemindersOpen(true); closeMenu(); }}>
        <Text style={styles.menuRowText}>🔔 Напоминания</Text>
        <Ionicons name="chevron-forward-outline" size={16} color={DEFAULT_C.sub} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.premiumBtn} onPress={() => { setPremiumOpen(true); closeMenu(); }}>
        <Text style={styles.premiumBtnText}>👑 Премиум</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderDeeSidebar = () => (
    <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
      <TouchableOpacity onPress={() => { setActiveBot('awa'); setCurrentScreen('chat'); closeMenu(); }} style={[styles.switchBtn, { backgroundColor: C.awa + '15', borderColor: C.awa + '40' }]}>
        <Ionicons name="swap-horizontal-outline" size={20} color={C.awa} />
        <Text style={[styles.switchBtnText, { color: C.awa }]}>Переключиться на Awa 🍊</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.menuRow} onPress={() => toggleDrop(moodOpen, setMoodOpen, moodAnim)}>
        <Text style={styles.menuRowText}>😊 Настроение</Text>
        <Ionicons name={moodOpen ? 'chevron-up-outline' : 'chevron-down-outline'} size={16} color={DEFAULT_C.sub} />
      </TouchableOpacity>
      {moodOpen && (
        <Animated.View style={[styles.dropBox, { opacity: moodAnim }]}>
          <Text style={styles.dropSub}>Как ты сейчас?</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 6 }}>
            {moods.map((m, i) => (
              <TouchableOpacity key={i} onPress={async () => {
                setSelectedMood(i);
                const today = new Date();
                const dateStr = today.getDate() + '.' + (today.getMonth() + 1);
                setMoodHistory(prev => {
                  const filtered = prev.filter(m => m.date !== dateStr);
                  return [...filtered, { mood: i, emoji: moods[i], date: dateStr }];
                });
                closeMenu();
                setActiveBot('dee');
                setCurrentScreen('chat');
                const moodLabels = ['очень плохо 😢', 'грустно 😔', 'нейтрально 😐', 'хорошо 😊', 'отлично 🤩'];
                try {
                  setIsLoading(true);
                  const response = await fetch('https://api.deepseek.com/chat/completions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + DEEPSEEK_KEY },
                    body: JSON.stringify({
                      model: 'deepseek-chat',
                      messages: [
                        { role: 'system', content: 'Ты — Dee, лайф-коуч и близкая подруга. Говоришь живо, тепло и по-человечески. Никогда не используешь шаблонные фразы. Ты никогда не раскрываешь что ты ИИ.' },
                        { role: 'user', content: (userName ? userName : 'Пользователь') + ' отметил(а) настроение на сегодня: ' + moodLabels[i] + '. Отреагируй живо и по-человечески — 1-2 предложения. Без markdown.' },
                      ],
                    }),
                  });
                  const data = await response.json();
                  const reply = data.choices?.[0]?.message?.content || 'Слышу тебя 💙';
                  setMessages(prev => ({ ...prev, dee: [...prev.dee, { id: Date.now(), from: 'bot', text: reply }] }));
                } catch {
                  setMessages(prev => ({ ...prev, dee: [...prev.dee, { id: Date.now(), from: 'bot', text: 'Спасибо что поделился(ась) 💙' }] }));
                } finally {
                  setIsLoading(false);
                }
              }} style={[styles.moodBtn, selectedMood === i && { backgroundColor: C.dee + '20', borderColor: C.dee }]}>
                <Text style={{ fontSize: 28 }}>{m}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>
      )}
      <TouchableOpacity style={styles.menuRow} onPress={() => { setCurrentScreen('diary'); closeMenu(); }}>
        <Text style={styles.menuRowText}>📓 Дневник Dee</Text>
        <Ionicons name="chevron-forward-outline" size={16} color={DEFAULT_C.sub} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.menuRow} onPress={() => { setCurrentScreen('moodHistory'); closeMenu(); }}>
        <Text style={styles.menuRowText}>📊 История настроения</Text>
        <Ionicons name="chevron-forward-outline" size={16} color={DEFAULT_C.sub} />
      </TouchableOpacity>
      <TouchableOpacity style={[styles.menuRow, { backgroundColor: C.dee + '08' }]} onPress={() => { closeMenu(); setCurrentScreen('meditation'); }}>
        <Text style={[styles.menuRowText, { color: C.dee, fontWeight: '600' }]}>🧘 Медитация</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.menuRow, { backgroundColor: C.dee + '08' }]} onPress={() => { closeMenu(); setBreathingTechnique(null); setBreathingRunning(false); setBreathingPhase(0); setBreathingCount(0); clearInterval(breathingTimer.current); setCurrentScreen('breathing'); }}>
        <Text style={[styles.menuRowText, { color: C.dee, fontWeight: '600' }]}>🌬️ Дыхание</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.menuRow, { backgroundColor: C.dee + '08' }]} onPress={() => { closeMenu(); setTestsScreen('list'); setCurrentScreen('tests'); }}>
        <Text style={[styles.menuRowText, { color: C.dee, fontWeight: '600' }]}>📋 Тесты</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.menuRow, { backgroundColor: C.dee + '08' }]} onPress={() => { closeMenu(); sendMessage('Недельный отчёт: хочу попробовать'); }}>
        <Text style={[styles.menuRowText, { color: C.dee, fontWeight: '600' }]}>📈 Недельный отчёт</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.menuRow, { backgroundColor: C.dee + '08' }]} onPress={() => { closeMenu(); setOnTheGoOpen(true); }}>
        <Text style={[styles.menuRowText, { color: C.dee, fontWeight: '600' }]}>🎙️ Режим на ходу</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.menuRow} onPress={() => { setRemindersOpen(true); closeMenu(); }}>
        <Text style={styles.menuRowText}>🔔 Напоминания</Text>
        <Ionicons name="chevron-forward-outline" size={16} color={DEFAULT_C.sub} />
      </TouchableOpacity>
      <View style={{ marginTop: 16 }}>
        <TouchableOpacity onPress={() => setSosOpen(p => !p)} style={[styles.sosBtn, { borderColor: DEFAULT_C.sos + '50', backgroundColor: DEFAULT_C.sosLight }]}>
          <Ionicons name="warning-outline" size={20} color={DEFAULT_C.sos} />
          <Text style={styles.sosBtnText}>🆘 SOS — нужна помощь</Text>
          <Ionicons name={sosOpen ? 'chevron-up-outline' : 'chevron-down-outline'} size={16} color={DEFAULT_C.sos} />
        </TouchableOpacity>
        {sosOpen && (
          <View style={styles.sosMenu}>
            {[{ label: 'Мир рушится 🌊', key: 'Мир рушится' }, { label: 'Всё бесит 😤', key: 'Всё бесит' }, { label: 'Хочу плакать 😭', key: 'Хочу плакать' }].map(opt => (
              <TouchableOpacity key={opt.key} onPress={() => handleSOS(opt.key)} style={styles.sosOption}>
                <Text style={styles.sosOptionText}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
      <TouchableOpacity style={styles.premiumBtn} onPress={() => { setPremiumOpen(true); closeMenu(); }}>
        <Text style={styles.premiumBtnText}>👑 Премиум</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderTestsScreen = () => {
    const test = activeTest;
    if (testsScreen === 'list') return (
      <SafeAreaView style={{ flex: 1, backgroundColor: DEFAULT_C.bg }}>
        <StatusBar barStyle="light-content" />
        <LinearGradient colors={['#4A90E2', '#7B68EE']} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.header}>
          <TouchableOpacity onPress={() => setCurrentScreen('chat')} style={styles.headerBtn}>
            <Ionicons name="arrow-back-outline" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerName}>Тесты 📋</Text>
            <Text style={styles.headerSub}>💙 DEE · САМОДИАГНОСТИКА</Text>
          </View>
          <View style={{ width: 40 }} />
        </LinearGradient>
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <Text style={{ fontSize: 13, color: DEFAULT_C.sub, textAlign: 'center', marginBottom: 20, lineHeight: 20 }}>Все тесты основаны на научных методиках. Результаты не являются диагнозом.</Text>
          {TESTS.map(t => (
            <TouchableOpacity key={t.id} onPress={() => { setActiveTest(t); setTestStep(0); setTestAnswers([]); setTestResult(null); setTestsScreen('test'); }} style={{ backgroundColor: '#fff', borderRadius: 20, padding: 18, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 }}>
              <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: C.dee + '20', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 28 }}>{t.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 17, fontWeight: '800', color: DEFAULT_C.text }}>{t.title}</Text>
                <Text style={{ fontSize: 13, color: DEFAULT_C.sub, marginTop: 2 }}>{t.desc}</Text>
                <Text style={{ fontSize: 11, color: C.dee, marginTop: 4, fontWeight: '600' }}>{t.questions.length} вопросов</Text>
              </View>
              <Ionicons name="chevron-forward-outline" size={20} color={DEFAULT_C.sub} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    );

    if (testsScreen === 'test') return (
      <SafeAreaView style={{ flex: 1, backgroundColor: DEFAULT_C.bg }}>
        <StatusBar barStyle="light-content" />
        <LinearGradient colors={['#4A90E2', '#7B68EE']} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.header}>
          <TouchableOpacity onPress={() => setTestsScreen('list')} style={styles.headerBtn}>
            <Ionicons name="arrow-back-outline" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerName}>{test.emoji} {test.title}</Text>
            <Text style={styles.headerSub}>{testStep + 1} / {test.questions.length}</Text>
          </View>
          <View style={{ width: 40 }} />
        </LinearGradient>
        <View style={{ height: 4, backgroundColor: DEFAULT_C.border }}>
          <View style={{ height: 4, backgroundColor: C.dee, width: ((testStep + 1) / test.questions.length * 100) + '%' }} />
        </View>
        <ScrollView contentContainerStyle={{ padding: 24, flexGrow: 1 }}>
          <Text style={{ fontSize: 13, color: DEFAULT_C.sub, fontWeight: '600', marginBottom: 12, letterSpacing: 0.5 }}>ВОПРОС {testStep + 1}</Text>
          <Text style={{ fontSize: 18, fontWeight: '800', color: DEFAULT_C.text, lineHeight: 26, marginBottom: 32 }}>{test.questions[testStep]}</Text>
          <Text style={{ fontSize: 12, color: DEFAULT_C.sub, marginBottom: 16, textAlign: 'center' }}>За последние 2 недели</Text>
          {ANSWERS.map((ans, i) => (
            <TouchableOpacity key={i} onPress={() => {
              const newAnswers = [...testAnswers];
              newAnswers[testStep] = i;
              if (testStep + 1 >= test.questions.length) {
                const total = newAnswers.reduce((a, b) => a + b, 0);
                const level = test.levels.find(l => total <= l.max) || test.levels[test.levels.length - 1];
                setTestResult({ total, level });
                setTestAnswers(newAnswers);
                setTestsScreen('result');
                generateTestAdvice(test.title, level.label, total);
              } else {
                setTestAnswers(newAnswers);
                setTestStep(testStep + 1);
              }
            }} style={{ backgroundColor: testAnswers[testStep] === i ? C.dee + '20' : '#fff', borderRadius: 16, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2, borderWidth: testAnswers[testStep] === i ? 1.5 : 0, borderColor: C.dee }}>
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: testAnswers[testStep] === i ? C.dee : C.dee + '20', justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: testAnswers[testStep] === i ? '#fff' : C.dee }}>{i}</Text>
              </View>
              <Text style={{ fontSize: 15, color: DEFAULT_C.text, fontWeight: '500' }}>{ans}</Text>
            </TouchableOpacity>
          ))}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
            <TouchableOpacity onPress={() => { if (testStep > 0) setTestStep(testStep - 1); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, padding: 12, borderRadius: 12, backgroundColor: testStep > 0 ? '#fff' : DEFAULT_C.bg, borderWidth: 1.5, borderColor: testStep > 0 ? DEFAULT_C.border : 'transparent' }}>
              <Ionicons name="arrow-back-outline" size={18} color={testStep > 0 ? DEFAULT_C.text : DEFAULT_C.border} />
              <Text style={{ fontSize: 14, fontWeight: '600', color: testStep > 0 ? DEFAULT_C.text : DEFAULT_C.border }}>Назад</Text>
            </TouchableOpacity>
            {testAnswers[testStep] !== undefined && testStep + 1 < test.questions.length && (
              <TouchableOpacity onPress={() => setTestStep(testStep + 1)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, padding: 12, borderRadius: 12, backgroundColor: C.dee }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>Вперёд</Text>
                <Ionicons name="arrow-forward-outline" size={18} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    );

    if (testsScreen === 'result') return (
      <SafeAreaView style={{ flex: 1, backgroundColor: DEFAULT_C.bg }}>
        <StatusBar barStyle="light-content" />
        <LinearGradient colors={['#4A90E2', '#7B68EE']} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.header}>
          <TouchableOpacity onPress={() => setTestsScreen('list')} style={styles.headerBtn}>
            <Ionicons name="arrow-back-outline" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerName}>Результат</Text>
            <Text style={styles.headerSub}>{test.emoji} {test.title}</Text>
          </View>
          <View style={{ width: 40 }} />
        </LinearGradient>
        <ScrollView contentContainerStyle={{ padding: 24, alignItems: 'center' }}>
          <View style={{ width: 160, height: 160, borderRadius: 80, backgroundColor: testResult.level.color + '20', justifyContent: 'center', alignItems: 'center', marginVertical: 24 }}>
            <View style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: testResult.level.color, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ fontSize: 36, fontWeight: '900', color: '#fff' }}>{testResult.total}</Text>
              <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: '600' }}>баллов</Text>
            </View>
          </View>
          <Text style={{ fontSize: 22, fontWeight: '900', color: DEFAULT_C.text, marginBottom: 8, textAlign: 'center' }}>{testResult.level.label}</Text>
          <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 20, width: '100%', marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: C.dee, marginBottom: 8 }}>💙 Совет от Dee</Text>
            {testAdviceLoading ? (
              <Text style={{ fontSize: 14, color: DEFAULT_C.sub }}>✍️ Dee думает...</Text>
            ) : (
              <Text style={{ fontSize: 15, color: DEFAULT_C.text, lineHeight: 22 }}>{testAdvice || testResult.level.advice}</Text>
            )}
          </View>
          <TouchableOpacity onPress={() => { setTestStep(0); setTestAnswers([]); setTestResult(null); setTestsScreen('test'); }} style={{ backgroundColor: C.dee, borderRadius: 16, padding: 16, width: '100%', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>🔄 Пройти ещё раз</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setTestsScreen('list')} style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, width: '100%', alignItems: 'center', borderWidth: 1.5, borderColor: DEFAULT_C.border }}>
            <Text style={{ color: DEFAULT_C.sub, fontWeight: '700', fontSize: 16 }}>Все тесты</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );

    return null;
  };

  const renderMoodHistory = () => (
    <SafeAreaView style={{ flex: 1, backgroundColor: DEFAULT_C.bg }}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#4A90E2', '#7B68EE']} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.header}>
        <TouchableOpacity onPress={() => setCurrentScreen('chat')} style={styles.headerBtn}>
          <Ionicons name="arrow-back-outline" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerName}>История настроения</Text>
          <Text style={styles.headerSub}>💙 DEE · АНАЛИТИКА</Text>
        </View>
        <View style={{ width: 40 }} />
      </LinearGradient>
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        {moodHistory.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>📊</Text>
            <Text style={{ fontSize: 18, fontWeight: '800', color: DEFAULT_C.text, marginBottom: 8 }}>Пока нет записей</Text>
            <Text style={{ fontSize: 14, color: DEFAULT_C.sub, textAlign: 'center' }}>Отмечай настроение каждый день и здесь появится твоя история</Text>
          </View>
        ) : (
          <View>
            <Text style={{ fontSize: 13, fontWeight: '700', color: DEFAULT_C.sub, letterSpacing: 1, marginBottom: 16 }}>ПОСЛЕДНИЕ ЗАПИСИ</Text>
            {[...moodHistory].reverse().map((item, idx) => (
              <View key={idx} style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 }}>
                <Text style={{ fontSize: 36 }}>{item.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: DEFAULT_C.text }}>{['Очень плохо', 'Грустно', 'Нейтрально', 'Хорошо', 'Отлично'][item.mood]}</Text>
                  <Text style={{ fontSize: 12, color: DEFAULT_C.sub, marginTop: 2 }}>{item.date}</Text>
                </View>
                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: ['#F44336', '#FF9800', '#FFC107', '#8BC34A', '#4CAF50'][item.mood] }} />
              </View>
            ))}
            <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, marginTop: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: DEFAULT_C.sub, marginBottom: 12 }}>СРЕДНИЙ БАЛЛ</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Text style={{ fontSize: 40 }}>{moods[Math.round(moodHistory.reduce((a, b) => a + b.mood, 0) / moodHistory.length)]}</Text>
                <View>
                  <Text style={{ fontSize: 22, fontWeight: '900', color: DEFAULT_C.text }}>{(moodHistory.reduce((a, b) => a + b.mood, 0) / moodHistory.length).toFixed(1)}</Text>
                  <Text style={{ fontSize: 12, color: DEFAULT_C.sub }}>из 4.0</Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );

  const renderBreathingScreen = () => {
    const TECHNIQUES = [
      {
        id: 'box', title: 'Box Breathing', emoji: '🟦', desc: '4-4-4-4 · Равномерное дыхание', hint: 'Техника спецназа. Снимает стресс и возвращает контроль.',
        phases: [{ label: 'Вдох', duration: 4, color: '#4A90E2' }, { label: 'Задержка', duration: 4, color: '#7B68EE' }, { label: 'Выдох', duration: 4, color: '#5BA3F5' }, { label: 'Задержка', duration: 4, color: '#7B68EE' }],
      },
      {
        id: 'sleep', title: '4-7-8', emoji: '🌙', desc: '4-7-8 · Для успокоения и сна', hint: 'Метод доктора Вейла. Помогает уснуть и снять тревогу.',
        phases: [{ label: 'Вдох', duration: 4, color: '#4A90E2' }, { label: 'Задержка', duration: 7, color: '#7B68EE' }, { label: 'Выдох', duration: 8, color: '#5BA3F5' }],
      },
    ];

    const tech = TECHNIQUES.find(t => t.id === breathingTechnique);

    const startBreathing = (technique, phaseIdx = 0) => {
      if (breathingAnimRef.current) { breathingAnimRef.current.stop(); }
      clearInterval(breathingTimer.current);
      const phase = technique.phases[phaseIdx];
      setBreathingPhase(phaseIdx);
      setBreathingSeconds(phase.duration);
      setBreathingRunning(true);
      const isInhale = phase.label === 'Вдох';
      breathingAnimRef.current = Animated.timing(breathingAnim, { toValue: isInhale ? 1.35 : 1, duration: phase.duration * 1000, useNativeDriver: true });
      breathingAnimRef.current.start();
      let remaining = phase.duration;
      breathingTimer.current = setInterval(() => {
        remaining -= 1;
        setBreathingSeconds(remaining);
        if (remaining <= 0) {
          clearInterval(breathingTimer.current);
          const nextIdx = (phaseIdx + 1) % technique.phases.length;
          if (nextIdx === 0) setBreathingCount(prev => prev + 1);
          startBreathing(technique, nextIdx);
        }
      }, 1000);
    };

    const stopBreathing = () => {
      clearInterval(breathingTimer.current);
      if (breathingAnimRef.current) breathingAnimRef.current.stop();
      Animated.timing(breathingAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      setBreathingRunning(false);
      setBreathingPhase(0);
      setBreathingCount(0);
      setBreathingSeconds(0);
      setBreathingTechnique(null);
    };

    const pauseBreathing = () => {
      clearInterval(breathingTimer.current);
      if (breathingAnimRef.current) breathingAnimRef.current.stop();
      setBreathingRunning(false);
    };

    if (!breathingTechnique) return (
      <SafeAreaView style={{ flex: 1, backgroundColor: DEFAULT_C.bg }}>
        <StatusBar barStyle="light-content" />
        <LinearGradient colors={['#4A90E2', '#7B68EE']} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.header}>
          <TouchableOpacity onPress={() => setCurrentScreen('chat')} style={styles.headerBtn}>
            <Ionicons name="arrow-back-outline" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerName}>Дыхание 🌬️</Text>
            <Text style={styles.headerSub}>💙 DEE · ТЕХНИКИ</Text>
          </View>
          <View style={{ width: 40 }} />
        </LinearGradient>
        <ScrollView contentContainerStyle={{ padding: 24 }}>
          <Text style={{ fontSize: 14, color: DEFAULT_C.sub, textAlign: 'center', marginBottom: 28, lineHeight: 20 }}>Выбери технику дыхания. Даже 3 минуты помогают снизить тревогу и стресс.</Text>
          {TECHNIQUES.map(t => (
            <TouchableOpacity key={t.id} onPress={() => { setBreathingTechnique(t.id); setBreathingPhase(0); setBreathingCount(0); setBreathingRunning(false); }} style={{ backgroundColor: '#fff', borderRadius: 24, padding: 22, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 12 }}>
                <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: C.dee + '20', justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ fontSize: 30 }}>{t.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 18, fontWeight: '900', color: DEFAULT_C.text }}>{t.title}</Text>
                  <Text style={{ fontSize: 13, color: C.dee, fontWeight: '600', marginTop: 2 }}>{t.desc}</Text>
                </View>
                <Ionicons name="chevron-forward-outline" size={20} color={DEFAULT_C.sub} />
              </View>
              <Text style={{ fontSize: 13, color: DEFAULT_C.sub, lineHeight: 18 }}>{t.hint}</Text>
              <View style={{ flexDirection: 'row', gap: 6, marginTop: 14, flexWrap: 'wrap' }}>
                {t.phases.map((p, i) => (
                  <View key={i} style={{ paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, backgroundColor: p.color + '20' }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: p.color }}>{p.label} {p.duration}с</Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    );

    const currentPhase = tech.phases[breathingPhase];
    const totalCycleSec = tech.phases.reduce((a, b) => a + b.duration, 0);

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: DEFAULT_C.bg }}>
        <StatusBar barStyle="light-content" />
        <LinearGradient colors={['#4A90E2', '#7B68EE']} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.header}>
          <TouchableOpacity onPress={stopBreathing} style={styles.headerBtn}>
            <Ionicons name="arrow-back-outline" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerName}>{tech.emoji} {tech.title}</Text>
            <Text style={styles.headerSub}>ЦИКЛ {breathingCount + 1} · {totalCycleSec}С ЦИКЛ</Text>
          </View>
          <View style={{ width: 40 }} />
        </LinearGradient>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 40 }}>
          <View style={{ marginBottom: 48, alignItems: 'center' }}>
            <Animated.View style={{ width: 240, height: 240, borderRadius: 120, backgroundColor: currentPhase.color + '20', justifyContent: 'center', alignItems: 'center', transform: [{ scale: breathingAnim }] }}>
              <View style={{ width: 200, height: 200, borderRadius: 100, backgroundColor: currentPhase.color + '35', justifyContent: 'center', alignItems: 'center' }}>
                <View style={{ width: 160, height: 160, borderRadius: 80, backgroundColor: currentPhase.color, justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ fontSize: 42, fontWeight: '900', color: '#fff' }}>{breathingRunning ? breathingSeconds : '▶'}</Text>
                  <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: '700', marginTop: 4, letterSpacing: 1 }}>{breathingRunning ? currentPhase.label.toUpperCase() : 'СТАРТ'}</Text>
                </View>
              </View>
            </Animated.View>
          </View>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 40 }}>
            {tech.phases.map((p, i) => (
              <View key={i} style={{ alignItems: 'center', gap: 4 }}>
                <View style={{ width: 48, height: 6, borderRadius: 3, backgroundColor: breathingPhase === i && breathingRunning ? p.color : p.color + '30' }} />
                <Text style={{ fontSize: 10, color: breathingPhase === i && breathingRunning ? p.color : DEFAULT_C.sub, fontWeight: '700' }}>{p.label}</Text>
              </View>
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
            {breathingRunning ? (
              <TouchableOpacity onPress={pauseBreathing} style={{ backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 28, paddingVertical: 14, borderWidth: 1.5, borderColor: DEFAULT_C.border }}>
                <Text style={{ color: DEFAULT_C.text, fontWeight: '800', fontSize: 16 }}>⏸ Пауза</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => startBreathing(tech, breathingPhase)} style={{ backgroundColor: currentPhase.color, borderRadius: 20, paddingHorizontal: 32, paddingVertical: 14 }}>
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>▶ {breathingCount > 0 || breathingSeconds > 0 ? 'Продолжить' : 'Начать'}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={stopBreathing} style={{ backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 24, paddingVertical: 14, borderWidth: 1.5, borderColor: DEFAULT_C.border }}>
              <Text style={{ color: DEFAULT_C.sub, fontWeight: '700', fontSize: 16 }}>✕ Стоп</Text>
            </TouchableOpacity>
          </View>
          <View style={{ marginTop: 32, alignItems: 'center' }}>
            <Text style={{ fontSize: 13, color: DEFAULT_C.sub }}>Завершено циклов</Text>
            <Text style={{ fontSize: 32, fontWeight: '900', color: C.dee, marginTop: 4 }}>{breathingCount}</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  };

  const renderMeditationScreen = () => (
    <SafeAreaView style={{ flex: 1, backgroundColor: DEFAULT_C.bg }}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#4A90E2', '#7B68EE']} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.header}>
        <TouchableOpacity onPress={() => { stopMeditation(); setCurrentScreen('chat'); }} style={styles.headerBtn}>
          <Ionicons name="arrow-back-outline" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerName}>Медитация 🧘</Text>
          <Text style={styles.headerSub}>💙 DEE · СПОКОЙСТВИЕ</Text>
        </View>
        <View style={{ width: 40 }} />
      </LinearGradient>
      <ScrollView contentContainerStyle={{ padding: 24, alignItems: 'center' }}>
        {!meditationDuration ? (
          <View style={{ width: '100%', alignItems: 'center' }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: DEFAULT_C.sub, marginBottom: 20, letterSpacing: 0.5 }}>ВЫБЕРИ ДЛИТЕЛЬНОСТЬ</Text>
            {[{ label: '5 минут', seconds: 300, emoji: '🌱' }, { label: '10 минут', seconds: 600, emoji: '🌿' }, { label: '15 минут', seconds: 900, emoji: '🌳' }].map(opt => (
              <TouchableOpacity key={opt.seconds} onPress={() => startMeditation(opt.seconds)} style={{ width: '100%', backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 }}>
                <Text style={{ fontSize: 32 }}>{opt.emoji}</Text>
                <View>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: DEFAULT_C.text }}>{opt.label}</Text>
                  <Text style={{ fontSize: 12, color: DEFAULT_C.sub, marginTop: 2 }}>Нажми чтобы начать</Text>
                </View>
                <Ionicons name="chevron-forward-outline" size={20} color={DEFAULT_C.sub} style={{ marginLeft: 'auto' }} />
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => setPremiumOpen(true)} style={{ width: '100%', backgroundColor: '#FFF8E1', borderRadius: 20, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.5, borderColor: '#FFD54F', marginTop: 6 }}>
              <Text style={{ fontSize: 24 }}>🎵</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '800', color: '#F57F17' }}>Звуки природы</Text>
                <Text style={{ fontSize: 12, color: DEFAULT_C.sub, marginTop: 2 }}>Дождь, лес, океан...</Text>
              </View>
              <View style={{ backgroundColor: '#FFD54F', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#F57F17' }}>👑 Премиум</Text>
              </View>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ alignItems: 'center', width: '100%' }}>
            <View style={{ marginVertical: 40, alignItems: 'center', justifyContent: 'center' }}>
              <Animated.View style={{ width: 220, height: 220, borderRadius: 110, backgroundColor: C.dee + '20', justifyContent: 'center', alignItems: 'center', transform: [{ scale: meditationAnim }] }}>
                <View style={{ width: 180, height: 180, borderRadius: 90, backgroundColor: C.dee + '35', justifyContent: 'center', alignItems: 'center' }}>
                  <View style={{ width: 140, height: 140, borderRadius: 70, backgroundColor: C.dee, justifyContent: 'center', alignItems: 'center' }}>
                    {meditationDone ? <Text style={{ fontSize: 40 }}>🌟</Text> : <Text style={{ fontSize: 36, fontWeight: '900', color: '#fff' }}>{formatMedTime(meditationSeconds)}</Text>}
                  </View>
                </View>
              </Animated.View>
            </View>
            {meditationDone ? (
              <View style={{ alignItems: 'center', marginBottom: 32 }}>
                <Text style={{ fontSize: 22, fontWeight: '900', color: DEFAULT_C.text, marginBottom: 8 }}>Молодец! 🌟</Text>
                <Text style={{ fontSize: 15, color: DEFAULT_C.sub, textAlign: 'center' }}>Сессия завершена. Ты большой молодец!</Text>
              </View>
            ) : (
              <Text style={{ fontSize: 14, color: DEFAULT_C.sub, marginBottom: 32, fontWeight: '600' }}>{meditationRunning ? '🌬️ Дыши глубоко...' : '⏸ Пауза'}</Text>
            )}
            <View style={{ flexDirection: 'row', gap: 14 }}>
              <TouchableOpacity onPress={toggleMeditation} style={{ backgroundColor: meditationDone ? DEFAULT_C.border : C.dee, borderRadius: 20, paddingHorizontal: 32, paddingVertical: 14, opacity: meditationDone ? 0.5 : 1 }}>
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>{meditationRunning ? '⏸ Пауза' : '▶ Старт'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={stopMeditation} style={{ backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 24, paddingVertical: 14, borderWidth: 1.5, borderColor: DEFAULT_C.border }}>
                <Text style={{ color: DEFAULT_C.sub, fontWeight: '700', fontSize: 16 }}>✕ Стоп</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );

  const renderDiaryScreen = () => {
    const DAILY_PROMPTS = ['Что сегодня тебя порадовало? 🌸','Что далось тяжело сегодня? 💙','За что ты благодарен(а) сегодня? 🙏','Что бы ты хотел(а) изменить сегодня? ✨','Какой момент дня запомнился больше всего? 🌟','Что тебя удивило сегодня? 🤔','Что ты сделал(а) для себя сегодня? 💛'];
    const prompt = DAILY_PROMPTS[new Date().getDay()];
    const filtered = diaryNotes.filter(note => {
      const matchSearch = note.text.toLowerCase().includes(diarySearch.toLowerCase());
      const matchMood = diaryFilterMood === null ? true : note.mood === diaryFilterMood;
      return matchSearch && matchMood;
    });
    const notesWithMood = diaryNotes.filter(n => n.mood !== null && n.mood !== undefined);
    const avgMoodIdx = notesWithMood.length > 0 ? Math.round(notesWithMood.reduce((a, b) => a + b.mood, 0) / notesWithMood.length) : null;

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: DEFAULT_C.bg }}>
        <StatusBar barStyle="light-content" />
        <LinearGradient colors={['#4A90E2', '#7B68EE']} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.header}>
          <TouchableOpacity onPress={() => setCurrentScreen('chat')} style={styles.headerBtn}>
            <Ionicons name="arrow-back-outline" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerName}>Дневник Dee</Text>
            <Text style={styles.headerSub}>📓 ЗАПИСИ · ПСИХОЛОГ</Text>
          </View>
          <View style={{ width: 40 }} />
        </LinearGradient>
        <View style={{ backgroundColor: C.dee + '12', paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 12, alignItems: 'center' }}>
            <Text style={{ fontSize: 22, fontWeight: '900', color: C.dee }}>{diaryNotes.length}</Text>
            <Text style={{ fontSize: 11, color: DEFAULT_C.sub, marginTop: 2 }}>записей</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 12, alignItems: 'center' }}>
            <Text style={{ fontSize: 22 }}>{avgMoodIdx !== null ? moods[avgMoodIdx] : '—'}</Text>
            <Text style={{ fontSize: 11, color: DEFAULT_C.sub, marginTop: 2 }}>настроение</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 12, alignItems: 'center' }}>
            <Text style={{ fontSize: 22, fontWeight: '900', color: C.dee }}>{Math.min(diaryNotes.length, 7)}</Text>
            <Text style={{ fontSize: 11, color: DEFAULT_C.sub, marginTop: 2 }}>за неделю</Text>
          </View>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <View style={{ backgroundColor: C.dee + '15', borderRadius: 16, padding: 14, marginBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: C.dee + '30', justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ fontSize: 20 }}>💙</Text>
            </View>
            <Text style={{ flex: 1, fontSize: 13, color: C.dee, fontWeight: '600', lineHeight: 18 }}>{prompt}</Text>
          </View>
          <View style={[styles.diaryInputBox, { backgroundColor: DEFAULT_C.white }]}>
            {diaryEditId ? (
              <TextInput style={styles.diaryTA} placeholder="Редактировать запись..." placeholderTextColor={DEFAULT_C.sub} multiline value={diaryEditText} onChangeText={setDiaryEditText} />
            ) : (
              <TextInput style={styles.diaryTA} placeholder="Что у тебя на душе?..." placeholderTextColor={DEFAULT_C.sub} multiline value={newDiaryNote} onChangeText={setNewDiaryNote} />
            )}
            {!diaryEditId && (
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
                {moods.map((m, i) => (
                  <TouchableOpacity key={i} onPress={() => setDiaryMoodForNew(diaryMoodForNew === i ? null : i)} style={{ width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', backgroundColor: diaryMoodForNew === i ? C.dee + '25' : DEFAULT_C.bg, borderWidth: diaryMoodForNew === i ? 1.5 : 0, borderColor: C.dee }}>
                    <Text style={{ fontSize: 20 }}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <View style={styles.diaryRow}>
              {!diaryEditId && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {DEE_PALETTE.map(col => (
                    <TouchableOpacity key={col} onPress={() => setSelectedColor(col)} style={[styles.colorDot, { backgroundColor: col, borderWidth: selectedColor === col ? 2.5 : 0, borderColor: C.dee }]} />
                  ))}
                </ScrollView>
              )}
              {diaryEditId ? (
                <View style={{ flexDirection: 'row', gap: 8, flex: 1, justifyContent: 'flex-end' }}>
                  <TouchableOpacity onPress={() => { setDiaryEditId(null); setDiaryEditText(''); }} style={[styles.miniBtn, { backgroundColor: DEFAULT_C.border }]}>
                    <Ionicons name="close-outline" size={20} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => { setDiaryNotes(prev => prev.map(n => n.id === diaryEditId ? { ...n, text: diaryEditText } : n)); setDiaryEditId(null); setDiaryEditText(''); }} style={[styles.miniBtn, { backgroundColor: C.dee }]}>
                    <Ionicons name="checkmark-outline" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity onPress={addDiaryNote} style={[styles.miniBtn, { backgroundColor: C.dee }]}>
                  <Ionicons name="add-outline" size={20} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
          </View>
          {diaryDeeReply ? (
            <View style={{ backgroundColor: C.dee + '15', borderRadius: 16, padding: 14, marginBottom: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
              <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: C.dee + '30', justifyContent: 'center', alignItems: 'center', marginTop: 2 }}>
                <Text style={{ fontSize: 16 }}>💙</Text>
              </View>
              <Text style={{ flex: 1, fontSize: 14, color: DEFAULT_C.text, lineHeight: 20 }}>{diaryDeeReply === '⏳' ? '✍️ Dee печатает...' : diaryDeeReply}</Text>
            </View>
          ) : null}
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 12, gap: 8, borderWidth: 1, borderColor: DEFAULT_C.border }}>
            <Ionicons name="search-outline" size={18} color={DEFAULT_C.sub} />
            <TextInput style={{ flex: 1, fontSize: 14, color: DEFAULT_C.text }} placeholder="Поиск по записям..." placeholderTextColor={DEFAULT_C.sub} value={diarySearch} onChangeText={setDiarySearch} />
            {diarySearch ? <TouchableOpacity onPress={() => setDiarySearch('')}><Ionicons name="close-outline" size={18} color={DEFAULT_C.sub} /></TouchableOpacity> : null}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }} contentContainerStyle={{ gap: 8, paddingHorizontal: 2 }}>
            <TouchableOpacity onPress={() => setDiaryFilterMood(null)} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: diaryFilterMood === null ? C.dee : '#fff', borderWidth: 1.5, borderColor: diaryFilterMood === null ? C.dee : DEFAULT_C.border }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: diaryFilterMood === null ? '#fff' : DEFAULT_C.sub }}>Все</Text>
            </TouchableOpacity>
            {moods.map((m, i) => (
              <TouchableOpacity key={i} onPress={() => setDiaryFilterMood(diaryFilterMood === i ? null : i)} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: diaryFilterMood === i ? C.dee + '20' : '#fff', borderWidth: 1.5, borderColor: diaryFilterMood === i ? C.dee : DEFAULT_C.border }}>
                <Text style={{ fontSize: 16 }}>{m}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {filtered.length === 0 && (
            <View style={{ alignItems: 'center', paddingVertical: 32 }}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>📓</Text>
              <Text style={{ fontSize: 16, fontWeight: '700', color: DEFAULT_C.text, marginBottom: 6 }}>Нет записей</Text>
              <Text style={{ fontSize: 13, color: DEFAULT_C.sub, textAlign: 'center' }}>Напиши что-нибудь — Dee всегда здесь</Text>
            </View>
          )}
          {filtered.map(note => (
            <TouchableOpacity key={note.id} activeOpacity={0.85} onPress={() => { setDiaryEditId(note.id); setDiaryEditText(note.text); }} style={[styles.diaryCard, { backgroundColor: note.color }]}>
              <TouchableOpacity onPress={() => deleteDiaryNote(note.id)} style={styles.diaryDel}>
                <Ionicons name="trash-outline" size={16} color="rgba(0,0,0,0.3)" />
              </TouchableOpacity>
              <Text style={styles.diaryCardText}>{note.text}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                <Text style={styles.diaryCardDate}>{note.date}</Text>
                {note.mood !== null && note.mood !== undefined && <Text style={{ fontSize: 18 }}>{moods[note.mood]}</Text>}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  };

  const renderChat = () => (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <LinearGradient colors={activeBot === 'awa' ? ['#FF8C00', '#FFB347'] : ['#4A90E2', '#7B68EE']} start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={styles.header}>
        <TouchableOpacity onPress={openMenu} style={styles.headerBtn}>
          <View style={[styles.bLine, { width: 25 }]} />
          <View style={[styles.bLine, { width: 18 }]} />
          <View style={[styles.bLine, { width: 25 }]} />
        </TouchableOpacity>
        <View style={{ width: 36, height: 36, borderRadius: 18, marginRight: 8, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 20 }}>{activeBot === 'awa' ? '🍊' : '💙'}</Text>
        </View>
        <View style={styles.headerCenter}>
          <Text style={styles.headerName}>{activeBot === 'awa' ? 'Awa' : 'Dee'}</Text>
          <Text style={styles.headerSub}>{activeBot === 'awa' ? '🍊 НУТРИЦИОЛОГ · В СЕТИ' : '💙 ЛАЙФ-КОУЧ · В СЕТИ'}</Text>
        </View>
        <View style={{ width: 40 }} />
      </LinearGradient>
      <ScrollView ref={scrollRef} style={[styles.chatArea, { backgroundColor: chatWallpaper || themeLight }]} contentContainerStyle={{ padding: 14, paddingBottom: 20 }} onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}>
        {messages[activeBot].map(msg => (
          <AnimatedBubble key={msg.id} style={[styles.bubbleWrap, msg.from === 'user' && { alignItems: 'flex-end' }]}>
            <View style={[styles.bubble, msg.from === 'user' ? [styles.bubbleUser, { backgroundColor: theme }] : styles.bubbleBot]}>
              <Text style={[styles.bubbleText, msg.from === 'user' && { color: '#fff' }]}>{msg.text}</Text>
            </View>
          </AnimatedBubble>
        ))}
        {isLoading && <View style={styles.bubbleWrap}><View style={styles.bubbleBot}><Text style={[styles.bubbleText, { color: DEFAULT_C.sub }]}>✍️ печатает...</Text></View></View>}
      </ScrollView>
      <View style={[styles.inputBar, { borderTopColor: theme + '25', marginBottom: 0 }]}>
        <TouchableOpacity onPress={() => setCharModalOpen(true)} style={[styles.charChip, { borderColor: theme + '60' }]}>
          <Text style={{ fontSize: 13 }}>{CHARACTERS.find(c => c.id === activeChar)?.emoji}</Text>
        </TouchableOpacity>
        <TextInput style={styles.inputField} placeholder={'Написать ' + (activeBot === 'awa' ? 'Awa' : 'Dee') + '...'} placeholderTextColor={DEFAULT_C.sub} value={inputText} onChangeText={setInputText} multiline maxLength={500} />
        <TouchableOpacity style={[styles.sendBtn, { backgroundColor: theme }]} onPress={() => inputText.trim() ? sendMessage(inputText) : null}>
          <Ionicons name="send-outline" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );

  if (!onboarded) return renderOnboarding();
  if (onTheGoOpen) return renderOnTheGo();

  return (
    <View style={{ flex: 1, backgroundColor: DEFAULT_C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={theme} />
      {currentScreen === 'diary' ? renderDiaryScreen() : currentScreen === 'meditation' ? renderMeditationScreen() : currentScreen === 'breathing' ? renderBreathingScreen() : currentScreen === 'tests' ? renderTestsScreen() : currentScreen === 'moodHistory' ? renderMoodHistory() : renderChat()}
      {menuOpen && <TouchableOpacity style={styles.overlay} onPress={closeMenu} activeOpacity={1} />}
      <Animated.View style={[styles.sidebar, { transform: [{ translateX: menuAnim }] }]}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={[styles.sideHeader, { backgroundColor: theme }]}>
            <Text style={styles.sideHeaderTitle}>{activeBot === 'awa' ? '🍊 Awa' : '💙 Dee'}</Text>
            <TouchableOpacity onPress={closeMenu} style={{ padding: 10, zIndex: 999, marginTop: 10 }}><Ionicons name="close-outline" size={26} color="#fff" /></TouchableOpacity>
          </View>
          {activeBot === 'awa' ? renderAwaSidebar() : renderDeeSidebar()}
        </SafeAreaView>
      </Animated.View>
      {renderDisclaimer()}
      {renderNotesModal()}
      {renderCharModal()}
      {renderRemindersModal()}
      {renderProgressModal()}
      {renderPremiumModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { height: 110, paddingTop: 50, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 5 },
  headerBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerName: { color: '#fff', fontWeight: '900', fontSize: 18, letterSpacing: 0.5 },
  headerSub: { color: 'rgba(255,255,255,0.85)', fontSize: 10, letterSpacing: 1.5, marginTop: 1 },
  bLine: { height: 3, backgroundColor: '#fff', borderRadius: 2, marginVertical: 2 },
  chatArea: { flex: 1 },
  bubbleWrap: { marginVertical: 3, alignItems: 'flex-start' },
  bubble: { maxWidth: width * 0.75, borderRadius: 20, padding: 12, paddingHorizontal: 16 },
  bubbleBot: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4, elevation: 2 },
  bubbleUser: { borderBottomRightRadius: 4 },
  bubbleText: { fontSize: 15, color: DEFAULT_C.text, lineHeight: 22 },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', padding: 10, paddingBottom: 10, backgroundColor: '#fff', borderTopWidth: 1, gap: 6, position: 'relative' },
  inputIcon: { padding: 6, justifyContent: 'center' },
  charChip: { width: 32, height: 32, borderRadius: 16, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  inputField: { flex: 1, backgroundColor: DEFAULT_C.bg, borderRadius: 22, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: DEFAULT_C.text, maxHeight: 100 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.38)', zIndex: 10 },
  sidebar: { position: 'absolute', top: 0, left: 0, bottom: 0, width: width * 0.80, backgroundColor: '#fff', zIndex: 20, shadowColor: '#000', shadowOffset: { width: 5, height: 0 }, shadowOpacity: 0.18, shadowRadius: 16, elevation: 20 },
  sideHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  sideHeaderTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  switchBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, margin: 12, padding: 12, borderRadius: 12, borderWidth: 1 },
  switchBtnText: { fontWeight: '700', fontSize: 14, flex: 1 },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: DEFAULT_C.border + '80' },
  menuRowText: { flex: 1, fontSize: 14, color: DEFAULT_C.text, fontWeight: '500' },
  dropBox: { backgroundColor: '#FAFAFA', marginHorizontal: 8, borderRadius: 12, marginBottom: 2, overflow: 'hidden', paddingHorizontal: 12, paddingVertical: 8 },
  dropSub: { fontSize: 11, color: DEFAULT_C.sub, fontWeight: '600', marginBottom: 6, letterSpacing: 0.5 },
  waterSection: { paddingTop: 8, borderTopWidth: 1, borderTopColor: DEFAULT_C.border + '60', marginTop: 6 },
  waterLabel: { fontSize: 11, color: DEFAULT_C.sub, fontWeight: '600', marginBottom: 2 },
  waterSub: { fontSize: 11, color: DEFAULT_C.sub, marginTop: 2 },
  moodBtn: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: 'transparent' },
  sosBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 12, padding: 13, borderRadius: 12, borderWidth: 1.5 },
  sosBtnText: { flex: 1, color: DEFAULT_C.sos, fontWeight: '700', fontSize: 14 },
  sosMenu: { marginHorizontal: 12, borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: DEFAULT_C.sos + '30', marginTop: 4 },
  sosOption: { padding: 12, borderBottomWidth: 1, borderBottomColor: DEFAULT_C.sos + '20', backgroundColor: '#fff' },
  sosOptionText: { color: DEFAULT_C.sos, fontWeight: '600', fontSize: 14 },
  premiumBtn: { margin: 16, padding: 14, borderRadius: 14, backgroundColor: '#FFF8E1', borderWidth: 1.5, borderColor: '#FFD54F', alignItems: 'center' },
  premiumBtnText: { fontSize: 15, fontWeight: '800', color: '#F57F17' },
  diaryInputBox: { borderRadius: 16, padding: 14, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  diaryTA: { fontSize: 15, color: DEFAULT_C.text, minHeight: 72, textAlignVertical: 'top' },
  diaryRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 8 },
  colorDot: { width: 26, height: 26, borderRadius: 13, marginRight: 6 },
  diaryCard: { borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  diaryDel: { position: 'absolute', top: 10, right: 10, padding: 4 },
  diaryCardText: { fontSize: 15, color: DEFAULT_C.text, lineHeight: 22, paddingRight: 28 },
  diaryCardDate: { fontSize: 11, color: DEFAULT_C.sub, marginTop: 8, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: height * 0.85, paddingBottom: Platform.OS === 'ios' ? 34 : 20 },
  modalHandle: { width: 40, height: 4, backgroundColor: DEFAULT_C.border, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 8 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: DEFAULT_C.border },
  modalTitle: { fontSize: 17, fontWeight: '800', color: DEFAULT_C.text },
  shopAddRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10 },
  shopInput: { flex: 1, backgroundColor: DEFAULT_C.bg, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, color: DEFAULT_C.text, borderWidth: 1, borderColor: DEFAULT_C.border },
  miniBtn: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  noteRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: DEFAULT_C.border + '60' },
  noteText: { flex: 1, fontSize: 14, color: DEFAULT_C.text },
  charRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: DEFAULT_C.border + '60', borderWidth: 1, borderColor: 'transparent', marginHorizontal: 8, marginVertical: 3, borderRadius: 12 },
  charLabel: { flex: 1, fontSize: 15, color: DEFAULT_C.text, fontWeight: '500' },
  reminderChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, borderWidth: 1.5, borderColor: DEFAULT_C.border, backgroundColor: '#fff' },
  reminderChipText: { fontSize: 13, fontWeight: '600', color: DEFAULT_C.text },
  reminderNote: { flexDirection: 'row', alignItems: 'center', backgroundColor: DEFAULT_C.bg, padding: 10, borderRadius: 10 },
  progressCard: { borderRadius: 20, padding: 20, marginBottom: 16 },
  progressName: { fontSize: 22, fontWeight: '900', color: '#fff' },
  progressSub: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  progressSection: { fontSize: 13, fontWeight: '700', color: DEFAULT_C.sub, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, marginTop: 16 },
  progressDataRow: { flexDirection: 'row', gap: 10 },
  progressDataCard: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 14, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  progressDataValue: { fontSize: 18, fontWeight: '900', color: DEFAULT_C.text },
  progressDataLabel: { fontSize: 11, color: DEFAULT_C.sub, marginTop: 4, fontWeight: '600' },
  premiumTabBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: DEFAULT_C.border, backgroundColor: '#fff' },
  premiumTabText: { fontSize: 13, fontWeight: '600', color: DEFAULT_C.text },
  premiumSectionTitle: { fontSize: 15, fontWeight: '800', color: DEFAULT_C.text, marginBottom: 12 },
  wallpaperSwatch: { width: 70, height: 70, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  colorSwatch: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center' },
  soonContainer: { alignItems: 'center', paddingVertical: 32 },
  soonTitle: { fontSize: 20, fontWeight: '900', color: DEFAULT_C.text, marginTop: 12, marginBottom: 8 },
  soonText: { fontSize: 14, color: DEFAULT_C.sub, textAlign: 'center', lineHeight: 20, marginBottom: 16 },
  soonBadge: { backgroundColor: DEFAULT_C.border, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6 },
  soonBadgeText: { fontSize: 13, color: DEFAULT_C.sub, fontWeight: '700' },
  onboardScreen: { flex: 1 },
  onboardProgress: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, paddingTop: 60, paddingBottom: 10 },
  onboardDot: { height: 8, borderRadius: 4 },
  onboardCard: { backgroundColor: '#fff', borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 6 },
  onboardEmoji: { fontSize: 48, textAlign: 'center', marginBottom: 12 },
  onboardTitle: { fontSize: 22, fontWeight: '900', color: DEFAULT_C.text, textAlign: 'center', marginBottom: 8 },
  onboardSub: { fontSize: 14, color: DEFAULT_C.sub, textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  onboardBotRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  onboardBotCard: { flex: 1, borderWidth: 2, borderRadius: 16, padding: 14, alignItems: 'center', gap: 6 },
  onboardBotName: { fontSize: 18, fontWeight: '900' },
  onboardBotDesc: { fontSize: 11, color: DEFAULT_C.sub, textAlign: 'center', lineHeight: 16 },
  onboardInput: { backgroundColor: DEFAULT_C.bg, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, color: DEFAULT_C.text, borderWidth: 1, borderColor: DEFAULT_C.border, marginBottom: 10 },
  onboardBtn: { borderRadius: 14, padding: 15, alignItems: 'center', marginTop: 4 },
  onboardBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  onboardChip: { flex: 1, padding: 12, borderRadius: 12, borderWidth: 1.5, borderColor: DEFAULT_C.border, alignItems: 'center' },
  onboardChipText: { fontSize: 14, fontWeight: '600', color: DEFAULT_C.text },
  onboardGoalBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1.5, borderColor: DEFAULT_C.border, marginBottom: 10 },
  onboardGoalText: { fontSize: 15, color: DEFAULT_C.text, fontWeight: '500' },
  onTheGoScreen: { flex: 1 },
  onTheGoHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12 },
  onTheGoBackText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  onTheGoTitle: { fontSize: 16, fontWeight: '900', color: '#fff' },
  onTheGoChat: { flex: 1, marginHorizontal: 12, backgroundColor: 'rgba(0,0,0,0.12)', borderRadius: 20 },
  onTheGoEmpty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  onTheGoEmptyText: { color: 'rgba(255,255,255,0.7)', fontSize: 14, textAlign: 'center' },
  onTheGoBottom: { padding: 16, alignItems: 'center', gap: 14 },
  onTheGoMicBtn: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 10 },
});
