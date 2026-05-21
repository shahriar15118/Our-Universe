import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { GlassCard } from "@/src/components/ui/GlassCard";
import { Book, Heart, Moon, Star, Sun, Compass, Send, CheckCircle2, MessageSquare, AlertCircle, TrendingUp, Clock, User, Users, Bell, Settings, ChevronRight, ChevronLeft, RotateCcw } from "lucide-react";
import { useAuth, useCouple } from "@/src/App";
import { db } from "@/src/lib/firebase";
import { doc, onSnapshot, setDoc, updateDoc, arrayUnion, serverTimestamp, getDoc } from "firebase/firestore";
import { format, differenceInDays, startOfDay, isAfter, parse, differenceInMinutes } from "date-fns";
import { cn } from "@/src/lib/utils";
import { X } from "lucide-react";

const TOTAL_AYAHS = 6236;
const AYAH_PER_PRAYER = 42;

const postSalahAdhkar = [
  { 
    arabic: "أَسْتَغْفِرُ اللهَ", 
    transliteration: "Astaghfirullah", 
    banglaUccharon: "আস্তাগফিরুল্লাহ",
    translation: "আমি আল্লাহর কাছে ক্ষমা প্রার্থনা করছি", 
    repeat: 3 
  },
  { 
    arabic: "اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ، تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ", 
    transliteration: "Allahumma Antas-Salam...", 
    banglaUccharon: "আল্লাহুম্মা আন্তাস সালামু ওয়া মিনকাস সালাম, তাবারকতা ইয়া যাল জালালি ওয়াল ইকরাম",
    translation: "হে আল্লাহ! আপনিই শান্তি এবং আপনার থেকেই শান্তি আসে...", 
    repeat: 1 
  },
  { 
    arabic: "لَا إِلَهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ", 
    transliteration: "La ilaha illallah...", 
    banglaUccharon: "লা ইলাহা ইল্লাল্লাহু ওয়াহদাহু লা শারিকা লাহু, লাহুল মুলকু ওয়া লাহুল হামদু ওয়া হুয়া আলা কুলি শাইয়িন কাদির",
    translation: "আল্লাহ ছাড়া ইবাদতের কোনো যোগ্য মাবুদ নেই...", 
    repeat: 1 
  },
  { 
    arabic: "سُبْحَانَ اللهِ", 
    transliteration: "SubhanAllah", 
    banglaUccharon: "সুবহানআল্লাহ",
    translation: "আল্লাহ অতি পবিত্র", 
    repeat: 33 
  },
  { 
    arabic: "الْحَمْدُ لِلَّهِ", 
    transliteration: "Alhamdulillah", 
    banglaUccharon: "আলহামদুলিল্লাহ",
    translation: "সমস্ত প্রশংসা আল্লাহর জন্য", 
    repeat: 33 
  },
  { 
    arabic: "اللهُ أَكْبَرُ", 
    transliteration: "Allahu Akbar", 
    banglaUccharon: "আল্লাহু আকবার",
    translation: "আল্লাহ সবচেয়ে মহান", 
    repeat: 34 
  },
];

const morningAdhkar = [
  { 
    arabic: "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ", 
    transliteration: "Asbahna wa asbahal-mulku lillah...", 
    banglaUccharon: "আসবাহনা ওয়া আসবাহাল মুলকু লিল্লাহি ওয়ালহামদু লিল্লাহ, লা ইলাহা ইল্লাল্লাহু ওয়াহদাহু লা শারিকা লাহু",
    translation: "আমরা সকালে উপনীত হয়েছি এবং রাজত্ব আল্লাহর হয়ে সকালে উপনীত হয়েছে...", 
    repeat: 1 
  },
  { 
    arabic: "يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ أَصْلِحْ لِي شَأْنِي كُلَّهُ وَلَا تَكِلْنِي إِلَى نَفْسِي طَرْفَةَ عَيْنٍ", 
    transliteration: "Ya Hayyu Ya Qayyum...", 
    banglaUccharon: "ইয়া হাইয়ু ইয়া কাইয়ূমু বিরাহমাতিকা আস্তাগীসু আসলিহ লী শা'নী কুল্লাহু ওয়া লা তাকিলনী ইলা নাফসী তারফাতা আইন",
    translation: "হে চিরঞ্জীব, হে চিরস্থায়ী! আপনার রহমতের উসিলায় আমি সাহায্য প্রার্থনা করছি...", 
    repeat: 1 
  },
  {
    arabic: "اللَّهُمَّ مَا أَصْبَحَ بِي مِنْ نِعْمَةٍ أَوْ بِأَحَدٍ مِنْ خَلْقِكَ، فَمِنْكَ وَحْدَكَ لَا شَرِيكَ لَهُ، فَلَكَ الْحَمْدُ وَلَكَ الشُّكْرُ",
    transliteration: "Allahumma ma asbaha bi min ni'mah...",
    banglaUccharon: "আল্লাহুম্মা মা আসবাহা বি মিন নিমাতিন আও বিআহাদিম মিন খালকিকা পামীনকা ওয়াহদাকা লা শারিকা লাকা ফালাকাল হামদু ওয়ালাকাশ শুকর",
    translation: "হে আল্লাহ! যে নেয়ামত আমার এই ভোরে আমি পেয়েছি বা আপনার সৃষ্টির কেউ পেয়েছে তা সবই শুধু আপনার পক্ষ থেকে...",
    repeat: 1
  }
];

const eveningAdhkar = [
  { 
    arabic: "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ", 
    transliteration: "Amsayna wa amsal-mulku lillah...", 
    banglaUccharon: "আমসাইনা ওয়া আমসাল মুলকু লিল্লাহি ওয়ালহামদু লিল্লাহ, লা ইলাহা ইল্লাল্লাহু ওয়াহদাহু লা শারিকা লাহু",
    translation: "আমরা সন্ধ্যায় উপনীত হয়েছি এবং রাজত্ব আল্লাহর হয়ে সন্ধ্যায় উপনীত হয়েছে...", 
    repeat: 1 
  },
  { 
    arabic: "اللَّهُمَّ بِكَ أَمْسَيْنَا، وَبِكَ أَصْبَحْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ الْمَصِيرُ", 
    transliteration: "Allahumma bika amsayna...", 
    banglaUccharon: "আল্লাহুম্মা বিকা আমসাইনা, ওয়া বিকা আসবাহনা, ওয়া বিকা নাহইয়া, ওয়া বিকা নামূতু, ওয়া ইলাইকাল মাসীর",
    translation: "হে আল্লাহ! আপনার সাহায্যেই আমরা সন্ধ্যা করেছি, আপনার সাহায্যেই ভোর করেছি...", 
    repeat: 1 
  },
  {
    arabic: "اللَّهُمَّ مَا أَمْسَى بِي مِنْ نِعْمَةٍ أَوْ بِأَحَدٍ مِنْ خَلْقِكَ، فَمِنْكَ وَحْدَكَ لَا شَرِيكَ لَهُ، فَلَكَ الْحَمْدُ وَلَكَ الشُّكْرُ",
    transliteration: "Allahumma ma amsa bi min ni'mah...",
    banglaUccharon: "আল্লাহুম্মা মা আমসা বি মিন নিমাতিন আও বিআহাদিম মিন খালকিকা পামীনকা ওয়াহদাকা লা শারিকা লাকা ফালাকাল হামদু ওয়ালাকাশ শুকর",
    translation: "হে আল্লাহ! যে নেয়ামত আমার এই সন্ধ্যায় আমি পেয়েছি বা আপনার সৃষ্টির কেউ পেয়েছে তা সবই শুধু আপনার পক্ষ থেকে...",
    repeat: 1
  }
];

const dhikrCollections: Record<string, {
  title: string;
  banglaTitle: string;
  icon: any;
  items: Array<{
    arabic: string;
    transliteration: string;
    banglaUccharon: string;
    translation: string;
    repeat: number;
  }>;
}> = {
  preFajr: {
    title: "Pre-Fajr Salah (Tahajjud & Sahur)",
    banglaTitle: "তাহাজ্জুদ ও সাহরি সময়",
    icon: Moon,
    items: [
      {
        arabic: "أَسْتَغْفِرُ اللَّهَ الْعَظِيمَ الَّذِي لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ وَأَتُوبُ إِلَيْهِ",
        transliteration: "Astaghfirullahal 'Adheem...",
        banglaUccharon: "আস্তাগফিরুল্লাহাল আজিমাল্লাজি লা ইলাহা ইল্লা হুয়াল হাইয়ুল কাইয়ুমু ওয়া আতুবু ইলাইহি",
        translation: "আমি মহান আল্লাহর নিকট ক্ষমা প্রার্থনা করছি, যিনি ব্যতীত কোন উপাস্য নেই, যিনি চিরঞ্জীব, চিরস্থায়ী এবং আমি তাঁর দিকেই প্রত্যাবর্তন করছি।",
        repeat: 3
      },
      {
        arabic: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ ، سُبْحَانَ اللَّهِ الْعَظِيمِ",
        transliteration: "Subhanallahi wa bihamdihi, Subhanallahal 'Adheem",
        banglaUccharon: "সুবহানাল্লাহি ওয়া বিহামদিহি, সুবহানাল্লাহিল আজিম",
        translation: "আল্লাহর পবিত্রতা ঘোষণা করছি তাঁর প্রশংসার সাথে, মহিমান্বিত আল্লাহর পবিত্রতা বর্ণনা করছি।",
        repeat: 100
      },
      {
        arabic: "لَا إِلَهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ",
        transliteration: "La ilaha illallah wahdahu...",
        banglaUccharon: "লা ইলাহা ইল্লাল্লাহু ওয়াহদাহু লা শারিকা লাহু, লাহুল মুলকু ওয়া লাহুল হামদু ওয়া হুয়া আলা কুলি শাইয়িন কাদির",
        translation: "আল্লাহ ব্যতীত কোন সত্য উপাস্য নেই, তিনি একক, তাঁর অংশীদার নেই, রাজত্ব ও প্রশংসা তাঁরই এবং তিনি সবকিছুর ওপর ক্ষমতাবান।",
        repeat: 100
      }
    ]
  },
  postFajr: {
    title: "Post-Fajr Salah (Morning Adhkar)",
    banglaTitle: "ফজর পরবর্তী ও সকালের আজকার",
    icon: Sun,
    items: [
      { 
        arabic: "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ", 
        transliteration: "Sayyidul Istighfar",
        banglaUccharon: "আল্লাহুম্মা আন্তা রাব্বি লা ইলাহা ইল্লা আন্তা খালাকতানি ওয়া আনা আবদুকা ওয়া আনা আলা আহদিকা ওয়া ওয়াদিকা মাস্তাতাতু...",
        translation: "হে আল্লাহ! আপনি আমার রব, আপনি ছাড়া কোন সত্য মাবুদ নেই। আপনি আমাকে সৃষ্টি করেছেন এবং আমি আপনার বান্দা...",
        repeat: 1 
      },
      {
        arabic: "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ",
        transliteration: "Asbahna wa asbahal-mulku lillah...",
        banglaUccharon: "আসবাহনা ওয়া আসবাহাল মুলকু লিল্লাহি ওয়ালহামদু লিল্লাহ, লা ইলাহা ইল্লাল্লাহু ওয়াহদাহু লা শারিকা লাহু",
        translation: "আমরা সকালে উপনীত হয়েছি এবং রাজত্ব আল্লাহর হয়ে সকালে উপনীত হয়েছে...",
        repeat: 1
      },
      { 
        arabic: "سُبْحَانَ اللهِ", 
        transliteration: "SubhanAllah", 
        banglaUccharon: "সুবহানআল্লাহ",
        translation: "আল্লাহ অতি পবিত্র", 
        repeat: 33 
      },
      { 
        arabic: "الْحَمْدُ لِلَّهِ", 
        transliteration: "Alhamdulillah", 
        banglaUccharon: "আলহামদুলিল্লাহ",
        translation: "সমস্ত প্রশংসা আল্লাহর জন্য", 
        repeat: 33 
      },
      { 
        arabic: "اللهُ أَكْبَرُ", 
        transliteration: "Allahu Akbar", 
        banglaUccharon: "আল্লাহু আকবার",
        translation: "আল্লাহ সবচেয়ে মহান", 
        repeat: 34 
      }
    ]
  },
  postDhuhr: {
    title: "Post-Dhuhr Salah Adhkar",
    banglaTitle: "যোহর পরবর্তী আজকার",
    icon: Sun,
    items: postSalahAdhkar
  },
  postAsr: {
    title: "Post-Asr Salah Adhkar",
    banglaTitle: "আসর পরবর্তী আজকার",
    icon: Sun,
    items: [
      ...postSalahAdhkar,
      {
        arabic: "اللَّهُمَّ بِكَ أَمْسَيْنَا، وَبِكَ أَصْبَحْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ الْمَصِيرُ",
        transliteration: "Allahumma bika amsayna...",
        banglaUccharon: "আল্লাহুম্মা বিকা আমসাইনা, ওয়া বিকা আসবাহনা, ওয়া বিকা নাহইয়া, ওয়া বিকা নামূতু, ওয়া ইলাইকাল মাসীর",
        translation: "হে আল্লাহ! আপনার সাহায্যেই আমরা সন্ধ্যা করেছি, আপনার সাহায্যেই ভোর করেছি...",
        repeat: 1
      }
    ]
  },
  postMaghrib: {
    title: "Post-Maghrib Salah (Evening Adhkar)",
    banglaTitle: "মাগরিব পরবর্তী ও সন্ধ্যার আজকার",
    icon: Moon,
    items: [
      {
        arabic: "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللهُ وَحْدَهُ لَا شَرِيكَ لَهُ",
        transliteration: "Amsayna wa amsal-mulku lillah...",
        banglaUccharon: "আমসাইনা ওয়া আমসাল মুলকু লিল্লাহি ওয়ালহামদু লিল্লাহ, লা ইলাহা ইল্লাল্লাহু ওয়াহদাহু লা শারিকা লাহু",
        translation: "আমরা সন্ধ্যায় উপনীত হয়েছি এবং রাজত্ব আল্লাহর হয়ে সন্ধ্যায় উপনীত হয়েছে...",
        repeat: 1
      },
      ...postSalahAdhkar
    ]
  },
  postIsha: {
    title: "Post-Isha Salah Adhkar",
    banglaTitle: "এশা পরবর্তী আজকার",
    icon: Moon,
    items: postSalahAdhkar
  },
  beforeSleep: {
    title: "Before Sleep Adhkar",
    banglaTitle: "ঘুমানোর পূর্বের আমল ও দোয়া",
    icon: Moon,
    items: [
      {
        arabic: "بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا",
        transliteration: "Bismika Allahumma amootu wa ahya",
        banglaUccharon: "বিসমিকা আল্লাহুম্মা আমুতু ওয়া আহয়া",
        translation: "হে আল্লাহ, আপনার নামেই আমি মৃত্যুবরণ (শয়ন) করি এবং জীবিত (জাগ্রত) হই।",
        repeat: 1
      },
      {
        arabic: "سُبْحَانَ اللهِ (৩৩ বার) | الْحَمْدُ لِلَّهِ (৩৩ বার) | اللهُ أَكْبَرُ (৩৪ বার)",
        transliteration: "SubhanAllah (33x), Alhamdulillah (33x), Allahu Akbar (34x)",
        banglaUccharon: "সুবহানআল্লাহ (৩৩ বার), আলহামদুলিল্লাহ (৩৩ বার), আল্লাহু আকবার (৩৪ বার)",
        translation: "আল্লাহ অতি পবিত্র, সমস্ত প্রশংসা আল্লাহর এবং আল্লাহ অতি মহান।",
        repeat: 1
      }
    ]
  }
};

interface DeenData {
  prayers: Record<string, boolean>;
  quran: boolean;
  dhikr: boolean;
  dhikrEvening: boolean;
  tahajjud: boolean;
  duha: boolean;
  learning: boolean;
}

interface DeenNote {
  id: string;
  from: string;
  text: string;
  seen: boolean;
  followed: boolean | null;
  timestamp: any;
}

const prayersConfig = [
  { id: "Fajr", icon: Sun },
  { id: "Dhuhr", icon: Sun },
  { id: "Asr", icon: Sun },
  { id: "Maghrib", icon: Moon },
  { id: "Isha", icon: Moon },
];

const learningTopics = [
  {
    title: "তাফসির অধ্যায়ন (Tafsir Study)",
    subtitle: "সূরা আল-ফাতিহা ও সূরা আল-ইখলাস",
    desc: "কুরআনের যেকোনো একটি সূরার তাফসির আলোচনা করা।",
    quote: "“আমার বান্দা যখন বলে, ‘সমস্ত প্রশংসা জগতসমূহের প্রতিপালক আল্লাহর’, তখন আল্লাহ বলেন, ‘আমার বান্দা আমার প্রশংসা করল।’” — সহীহ মুসলিম: ৩৯৫",
    details: [
      {
        section: "১. সূরা আল-ফাতিহা: আল্লাহর সাথে সরাসরি কথোপকথন",
        content: "সালাতে যখন আমরা সূরা ফাতিহা পড়ি, তখন প্রতিটি আয়াতে আল্লাহ রাব্বুল আলামীন আমাদের সরাসরি উত্তর দেন। বান্দা যখন বলে 'আলহামদুলিল্লাহি রাব্বিল আলামিন' (সমস্ত প্রশংসা বিশ্বজাহানের রবের), আল্লাহ বলেন 'আমার বান্দা আমার প্রশংসা করেছে।' এটি পরম এক ভালোবাসার সম্পর্ক। দাম্পত্য জীবনে পারস্পরিক কৃতজ্ঞতা ও সৌন্দর্যের প্রধান শিক্ষা এখানেই নিহিত।"
      },
      {
        section: "২. সূরা আল-ইখলাস: তাওহীদের হৃদপিণ্ড",
        content: "রাসূলুল্লাহ (ﷺ) বলেছেন: 'সুরা ইখলাস কুরআনের এক-তৃতীয়াংশের সমান।' এতে স্রষ্টার একত্ব ও তুলনাহীনতার এমন এক বিশুদ্ধ বর্ণনা রয়েছে যা মানুষের অন্তরে স্থিরতা আনে। যখন আমরা আল্লাহর অনন্যতায় বিশ্বাস স্থাপন করি, তখন আমাদের পারিবারিক জীবনেও ধৈর্য্য, একনিষ্ঠতা ও গভীর প্রশান্তি নেমে আসে।"
      },
      {
        section: "৩. পরিবার ও সম্পর্কের আলোয় শিক্ষা",
        content: "দম্পতি হিসেবে যখন আপনারা একসাথে বসে এ সূরাগুলোর মর্মার্থ উপলব্ধি করবেন, তখন আপনাদের ঘরের শান্তি বহুগুণ বৃদ্ধি পাবে। যখনই আপনারা সালাতে দাঁড়াবেন, অনুভব করবেন আপনারা কেবল একটি প্রথা পালন করছেন না, বরং সৃষ্টিকর্তার দয়ার চাদরে আবৃত হয়ে আছেন।"
      }
    ]
  },
  {
    title: "হাদিস পাঠ (Hadith Reading)",
    subtitle: "মুমিনদের পারস্পরিক ভালোবাসা ও উত্তম দাম্পত্য চরিত্র",
    desc: "রিয়াদুস সালেহীন বা বুখারী শরীফ থেকে অন্তত একটি হাদিস পড়া।",
    quote: "“মুমিনদের পারস্পরিক ভালোবাসা, দয়া ও সহানুভূতি একটি শরীরের মতো। যখন শরীরের কোনো অংশ ব্যথিত হয়, পুরো শরীর জ্বরে আক্রান্ত হয়।” — সহীহ বুখারী",
    details: [
      {
        section: "১. সর্বোত্তম জীবনসঙ্গীর মাপকাঠি",
        content: "রাসূলুল্লাহ (ﷺ) বলেছেন: 'তোমাদের মধ্যে সর্বোত্তম সেই ব্যক্তি, যে তার স্ত্রীর নিকট সর্বোত্তম। আর আমি তোমাদের মধ্যে আমার স্ত্রীদের নিকট সর্বোত্তম।' (সুনানে তিরমিযী)। ইসলামে একজন মানুষের ভালো চরিত্রের প্রধান সার্টিফিকেট দেওয়া হয়েছে তার জীবনসঙ্গীর মাধ্যমে। ঘরই হলো সুন্দর ব্যবহারের প্রথম বিদ্যাপীঠ।"
      },
      {
        section: "২. ছোটখাট অপূর্ণতা এড়িয়ে ইতিবাচক দৃষ্টি",
        content: "নবী করীম (ﷺ) আমাদের শিখীদের কাছে শিখিয়েছেন: 'কোনো মুমিন পুরুষ যেন কোনো মুমিন নারীকে (নিজের স্ত্রীকে) সম্পূর্ণ অপছন্দ বা ঘৃণা না করে। তার একটি আচরণ অপছন্দ হলে অন্য আরেকটি আচরণ অবশ্যই তাকে মুগ্ধ করবে।' (সহীহ মুসলিম)। সম্পর্ককে টিকিয়ে রাখার মূলমন্ত্র হলো ইতিবাচক দিকগুলো দেখা ও কৃতজ্ঞ থাকা।"
      },
      {
        section: "৩. ক্ষুদ্রতম ত্যাগের মহৎ সওয়াব",
        content: "রাসূলুল্লাহ (ﷺ) বলেছেন: 'কেউ যদি সওয়াবের আশায় তার পরিবারের জন্য কিছু ব্যয় করে, তবে তাও তার জন্য সদকা হিসেবে গণ্য হয়।' এমনকি ঘরের সুখে স্ত্রীর মুখে ভালোবেসে এক লোকমা খাবার তুলে দেওয়ার মধ্যেও রয়েছে পরম সওয়াব।"
      }
    ]
  },
  {
    title: "রাসূলুল্লাহর (ﷺ) জীবনী (Seerah Study)",
    subtitle: "নবীজির দাম্পত্য আদর্শ ও রসিকতা",
    desc: "নবীজির (ﷺ) মধুর বৈবাহিক আচরণের বাস্তব ও হৃদয়স্পর্শী গল্পসমূহ।",
    quote: "“রাসূলুল্লাহ (ﷺ) ঘরে ঢুকলেই তাঁর মুখমণ্ডল হাসিতে উজ্জ্বল থাকতো এবং তিনি আমাদের সাথে হাসিমুখে কথা বলতেন ও সাহায্য করতেন।” — সুনানে ইবনে মাজাহ",
    details: [
      {
        section: "১. প্রেমময় মরুভূমির দৌড় প্রতিযোগিতা",
        content: "মা আয়েশা (রা.) বর্ণনা করেন: 'নবীজি (ﷺ) মরুভূমির সফরে আমার সাথে পায়ে হেঁটে দৌড়াদৌড়ি কৌতুক করেছিলেন। আমি জিতে গেলাম। কয়েক বছর পরে আমি একটু ভারী হয়ে যাওয়ার পর আবার দৌড় প্রতিযোগিতা হলো, এবার উনি জিতে গেলেন এবং হাসতে হাসতে পিঠে চাপড় মেরে বললেন—এটি আগের পরাজয়ের মধুর বদলা!' (সুনানে আবু দাউদ)। তাঁরা চমৎকার খুনসুটি করতেন যা ভালোবাসাকে সজীব রাখত।"
      },
      {
        section: "২. একই স্থান হতে ভালোবাসার চুমুক",
        content: "আয়েশা (রা.) বলেন: 'আমি যখন কোনো পাত্রে পানি পান করতাম, রাসূলুল্লাহ (ﷺ) পাত্রটি নিজের হাতে নিয়ে আমি যেখানে মুখ লাগিয়ে পান করেছিলাম ঠিক সেই স্থানে ঠোঁট লাগিয়ে অবশিষ্ট পানি পান করতেন।' (সহীহ মুসলিম)। পরস্পরের প্রতি ভালোবাসার এমন সূক্ষ্ম প্রকাশই হৃদয়কে বেঁধে রাখে।"
      },
      {
        section: "৩. ঘরের কাজে অসাধারণ সহমর্মিতা",
        content: "মা আয়েশাকে জিজ্ঞেস করা হয়েছিল, নবীজি (ﷺ) ঘরের ভেতর কেমন ছিলেন? তিনি উত্তর দিলেন, 'তিনি ঘরের কাজে তাঁর স্ত্রীদের সাহায্য করতেন এবং সেলাই করতেন, ঝাড়ু দিতেন, নিজের কাপড় ধুতেন ও ছাগলের দুধ দোয়াতেন। আর আযানের আওয়াজ শুনলে তিনি সালাতের জন্য প্রস্থান করতেন।' আল্লাহর রাসূল হওয়া সত্ত্বেও তিনি ঘরে ছিলেন একজন সেরা দায়িত্বশীল ও নম্র জীবনসঙ্গী।"
      }
    ]
  },
  {
    title: "...মায়াবী মাসনুন দোয়া শিক্ষা (Masnoon Duas)",
    subtitle: "সুখী দম্পতি ও কলহমুক্ত শান্তিময় পরিবারের জন্য অত্যন্ত শক্তিশালী দোয়া ও আমল",
    desc: "দৈনন্দিন আমল ও মাসনুন দোয়াসমূহ মুখস্থ বা চর্চা করা।",
    quote: "“দোয়াই হলো ইবাদতের মূল ভিত্তি।” — সুনানে তিরমিযী",
    details: [
      {
        section: "১. নয়নজুড়ানো সুখী জুটির শ্রেষ্ঠ দোয়া (কুরআনি দোয়া)",
        content: "পবিত্র কুরআনের অত্যন্ত চমৎকার একটি দোয়া যা প্রতিদিন একসাথে পড়া উচিত:\n`রব্বানা হাব লানা মিন আজওয়াজিনা ওয়া যুররিয়্যাতিনা কুররাতা আ'ইউনিন ওয়াজ'আলনা লিল মুত্তাকীনা ইমামা` \n\n*অনুবাদ:* 'হে আমাদের প্রতিপালক! আমাদের স্ত্রী ও সন্তানদের আমাদের জন্য নয়নপ্রীতিকর ও চোখের প্রশান্তি করো এবং আমাদেরকে মুত্তাকীদের আদর্শ বা নেতা বানাও।' (সূরা আল-ফুরকান: ৭৪)"
      },
      {
        section: "২. ঘরে প্রবেশের মাসনুন দোয়া ও সালাম",
        content: "রাসূলুল্লাহ (ﷺ) বলেছেন, যখন তোমরা ঘরে প্রবেশ করবে, তোমরা সালাম দাও। এটি শয়তানকে ঘর থেকে তাড়িয়ে দেয়। ঘরে ঢোকার দোয়া:\n`اللَّهُمَّ إِنِّي أَسْأَلُكَ خَيْرَ الْمَوْلَجِ وَخَيْرَ الْمَخْرَجِ، بِسْمِ اللَّهِ وَلَجْنَا، وَبِسْمِ اللَّهِ خَرَجْنَا، وَعَلَى اللَّهِ رَبِّنَا تَوَكَّلْنَا` \n\n*উচ্চারণ:* 'আল্লাহুম্মা ইন্নি আসআলুকা খাইরাল মাওলাজি ওয়া খাইরাল মাখরাজি, বিসমিল্লাহি ওয়ালাজনা ওয়া বিসমিল্লাহি খারাজনা, ওয়া আলাল্লাহি রাব্বিনা তাওয়াক্কালনা।'\n\n*অনুবাদ:* 'হে আল্লাহ! আমি উত্তম প্রবেশ ও উত্তম প্রস্থান প্রার্থনা করছি। আল্লাহর নামেই আমরা প্রবেশ করি ও বের হই, এবং আমাদের প্রতিপালক আল্লাহর ওপরই আমাদের ভরসা।' (আবু দাউদ)"
      },
      {
        section: "৩. ক্রোধ ও অশান্তিমুক্ত ঘরের আমল",
        content: "পারিবারিক জীবনে শয়তান অনেক সময় ভুল বোঝাবুঝি বা রাগ সৃষ্টি করে। রাগ বা ঝগড়ার আগমন ঘটলে সাথে সাথে এই দোয়াটি পড়ুন:\n`أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ` \n\n*উচ্চারণ:* 'আউযু বিল্লাহি মিনাশ শায়তানির রাজীম।'\n\n*অনুবাদ:* 'আমি বিতাড়িত শয়তান থেকে আল্লাহর কাছে আশ্রয় প্রার্থনা করছি।' (বুখারী ও মুসলিম)। এছাড়া দিনে অন্তত ৩ বার সুরা নাস ও সুরা ফালাক পড়ে ফুঁ দিলে ঘরের শান্তি আল্লাহর হেফাজতে থাকে।"
      }
    ]
  }
];

export default function Journey() {
  const { profile, couple, partner } = useCouple();
  const [viewMode, setViewMode] = useState<"me" | "partner">("me");
  const [myData, setMyData] = useState<DeenData>({
    prayers: {},
    quran: false,
    dhikr: false,
    dhikrEvening: false,
    tahajjud: false,
    duha: false,
    learning: false,
  });
  const [partnerData, setPartnerData] = useState<DeenData | null>(null);
  const [notes, setNotes] = useState<DeenNote[]>([]);
  const [newNote, setNewNote] = useState("");
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [prayerTimes, setPrayerTimes] = useState<Record<string, string>>({});
  const [showQuranModal, setShowQuranModal] = useState(false);
  const [showDhikrModal, setShowDhikrModal] = useState(false);
  const [showTahajjudModal, setShowTahajjudModal] = useState(false);
  const [showDuhaModal, setShowDuhaModal] = useState(false);
  const [showLearningModal, setShowLearningModal] = useState(false);
  const [selectedLearningTopic, setSelectedLearningTopic] = useState<number | null>(null);

  const getInitialDhikrTab = () => {
    const hour = new Date().getHours();
    if (hour >= 2 && hour < 5) return "preFajr";
    if (hour >= 5 && hour < 11) return "postFajr";
    if (hour >= 11 && hour < 15) return "postDhuhr";
    if (hour >= 15 && hour < 18) return "postAsr";
    if (hour >= 18 && hour < 20) return "postMaghrib";
    if (hour >= 20 && hour < 23) return "postIsha";
    return "beforeSleep";
  };
  const [ayahs, setAyahs] = useState<any[]>([]);
  const [ayahCache, setAyahCache] = useState<Record<number, any[]>>({});
  const [ayahLoading, setAyahLoading] = useState(false);
  const [hasReachedBottom, setHasReachedBottom] = useState(false);
  const [activeReminder, setActiveReminder] = useState<string | null>(null);
  const [dismissedReminders, setDismissedReminders] = useState<Record<string, string>>({}); // { prayerId: dateString }
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const lastFetchedProgressRef = React.useRef<number | null>(null);

  useEffect(() => {
    // Pre-fetch ayahs when profile is available or modal is open and progress changes
    if (profile) {
      const currentProg = profile.quranProgress || 0;
      if (showQuranModal) {
        if (lastFetchedProgressRef.current !== currentProg || ayahs.length === 0) {
          lastFetchedProgressRef.current = currentProg;
          fetchAyahs();
        }
      }
    }
  }, [profile?.quranProgress, showQuranModal]);

  useEffect(() => {
    if (!prayerTimes || Object.keys(prayerTimes).length === 0 || !profile) return;
    
    const checkReminders = () => {
      const now = new Date();
      const settings = profile.reminderSettings || {};
      const dateKey = format(now, "yyyy-MM-dd");
      
      let foundReminder = null;
      
      for (const [prayer, time] of Object.entries(prayerTimes)) {
        // Skip if reminder for this prayer was already dismissed today
        if (dismissedReminders[prayer] === dateKey) continue;

        if (settings[prayer]) {
          try {
            const prayerDate = parse(time as string, "HH:mm", now);
            const diff = differenceInMinutes(prayerDate, now);
            
            if (diff > 0 && diff <= 15) {
              foundReminder = { 
                id: prayer,
                text: `${prayer} prayer is approaching in ${diff} minutes. Prepare your heart.`
              };
              break;
            }
          } catch (e) {
            console.error("Reminder check error for", prayer, e);
          }
        }
      }

      if (foundReminder) {
        setActiveReminder(foundReminder.text);
      } else {
        setActiveReminder(null);
      }
    };

    const interval = setInterval(checkReminders, 30000); // Check every 30 seconds
    checkReminders();

    return () => clearInterval(interval);
  }, [prayerTimes, profile, dismissedReminders]);

  const dismissReminder = () => {
    if (!activeReminder) return;
    
    const prayerName = prayersConfig.find(p => activeReminder.startsWith(p.id))?.id;
    if (prayerName) {
      setDismissedReminders(prev => ({
        ...prev,
        [prayerName]: format(new Date(), "yyyy-MM-dd")
      }));
    }
    setActiveReminder(null);
  };

  const toggleReminder = async (prayerId: string) => {
    if (!profile?.userId || !db) return;
    
    const currentSettings = profile.reminderSettings || {};
    const newSettings = {
      ...currentSettings,
      [prayerId]: !currentSettings[prayerId]
    };

    try {
      await updateDoc(doc(db, "users", profile.userId), {
        reminderSettings: newSettings
      });
    } catch (e) {
      console.error("Failed to update reminder settings", e);
    }
  };

  const fetchAyahs = async () => {
    if (!profile) return;
    const start = (profile.quranProgress || 0) + 1;
    
    // Check cache first
    if (ayahCache[start]) {
      setAyahs(ayahCache[start]);
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = 0;
        }
      }, 50);
      return;
    }

    setAyahLoading(true);
    
    try {
      const res = await fetch(`/api/quran/verses?start=${start}&count=${AYAH_PER_PRAYER}`);
      if (!res.ok) {
        throw new Error(`API returned HTTP ${res.status}`);
      }
      const data = await res.json();
      
      if (data.ayahs) {
        setAyahs(data.ayahs);
        setAyahCache(prev => ({ ...prev, [start]: data.ayahs }));
        setTimeout(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop = 0;
          }
        }, 50);
      } else {
        throw new Error((data.error as string) || "Failed to fetch ayahs");
      }
    } catch (e) {
      console.warn("Express backend API failed, executing client-side direct API fallback:", e);
      
      try {
        // Fetch start ayah details to discover which surah it is in
        const infoRes = await fetch(`https://api.alquran.cloud/v1/ayah/${start}`);
        const infoData = await infoRes.json();
        if (infoData.code !== 200) throw new Error(`Ayah ${start} info not found`);

        const startSurahNum = infoData.data.surah.number;
        const startAyahInSurah = infoData.data.numberInSurah;

        // Fetch two consecutive surahs just in case we cross the boundary
        const surahP1 = fetch(`https://api.alquran.cloud/v1/surah/${startSurahNum}/editions/quran-uthmani,bn.bengali,en.transliteration`).then(r => r.json());
        const surahP2 = startSurahNum < 114 
          ? fetch(`https://api.alquran.cloud/v1/surah/${startSurahNum + 1}/editions/quran-uthmani,bn.bengali,en.transliteration`).then(r => r.json())
          : Promise.resolve(null);

        const [s1, s2] = await Promise.all([surahP1, surahP2]);

        let combined: any[] = [];

        const processSurah = (surahData: any, isStart: boolean) => {
          if (!surahData || surahData.code !== 200) return;
          const arabicAyahs = surahData.data[0].ayahs;
          const banglaAyahs = surahData.data[1].ayahs;
          const englishTranslit = surahData.data[2]?.ayahs || [];
          const currentStartIdx = isStart ? startAyahInSurah - 1 : 0;

          const neededCount = AYAH_PER_PRAYER - combined.length;
          if (neededCount <= 0) return;

          const fetched = arabicAyahs.slice(currentStartIdx, currentStartIdx + neededCount).map((av: any, i: number) => {
            const rawEngTrans = englishTranslit[currentStartIdx + i]?.text || "";
            return {
              number: av.number,
              numInSurah: av.numberInSurah,
              surah: surahData.data[0].name,
              surahEn: surahData.data[0].englishName,
              text: av.text,
              translation: banglaAyahs[currentStartIdx + i]?.text || "অনুবাদ পাওয়া যায়নি",
              transliteration: rawEngTrans || "আরবি তিলাওয়াত দেখুন"
            };
          });
          combined = [...combined, ...fetched];
        };

        processSurah(s1, true);
        if (combined.length < AYAH_PER_PRAYER && s2) processSurah(s2, false);

        if (combined.length > 0) {
          setAyahs(combined);
          setAyahCache(prev => ({ ...prev, [start]: combined }));
          setTimeout(() => {
            if (scrollRef.current) {
              scrollRef.current.scrollTop = 0;
            }
          }, 50);
        } else {
          setAyahs([]);
        }
      } catch (fallbackErr) {
        console.error("Direct public Quran API fallback failed:", fallbackErr);
        setAyahs([]);
      }
    } finally {
      setAyahLoading(false);
    }
  };

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 20) {
      setHasReachedBottom(true);
    }
  };

  useEffect(() => {
    if (!showQuranModal) {
      setHasReachedBottom(false);
    }
  }, [showQuranModal]);

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const docPath = couple?.id ? `couples/${couple.id}/deen_daily/${todayStr}` : null;

  useEffect(() => {
    const fetchTimes = async () => {
      try {
        let lat = 23.8103;
        let lon = 90.4125;

        const getTimes = async (latitude: number, longitude: number) => {
          const res = await fetch(`https://api.aladhan.com/v1/timings?latitude=${latitude}&longitude=${longitude}&method=2`);
          const data = await res.json();
          if (data.data?.timings) {
            setPrayerTimes(data.data.timings);
          }
        };

        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => getTimes(pos.coords.latitude, pos.coords.longitude),
            () => getTimes(lat, lon), 
            { timeout: 10000 }
          );
        } else {
          getTimes(lat, lon);
        }
      } catch (e) {
        console.error("Failed to fetch prayer times", e);
      }
    };

    fetchTimes();
  }, []);

  const updateStreak = async () => {
    if (!couple?.id || !db) return;
    
    const lastDate = couple.lastDeenDate;
    const currentStreak = couple.deenStreak || 0;
    
    if (lastDate === todayStr) return; 

    let newStreak = 1;
    if (lastDate) {
      try {
        const last = startOfDay(new Date(lastDate));
        const today = startOfDay(new Date());
        const diff = differenceInDays(today, last);
        
        if (diff === 1) {
          newStreak = currentStreak + 1;
        } else if (diff === 0) {
          newStreak = currentStreak; 
        } else {
          newStreak = 1; 
        }
      } catch (e) {
        console.error("Date parsing error", e);
        newStreak = 1;
      }
    }

    try {
      await updateDoc(doc(db, "couples", couple.id), {
        deenStreak: newStreak,
        lastDeenDate: todayStr
      });
    } catch (e) {
      console.error("Failed to update streak", e);
    }
  };

  useEffect(() => {
    if (!docPath || !db) return;

    const unsub = onSnapshot(doc(db, docPath), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (profile?.userId) {
          setMyData(data[profile.userId] || { 
            prayers: {}, 
            quran: false, 
            dhikr: false, 
            dhikrEvening: false, 
            tahajjud: false, 
            duha: false, 
            learning: false 
          });
        }
        if (partner?.userId) {
          setPartnerData(data[partner.userId] || null);
        }
        setNotes(data.notes || []);
      }
      setLoading(false);
    }, (error) => {
      console.error("Firestore Error in Journey:", error);
      setLoading(false);
    });

    const s = couple?.deenStreak || 0;
    setStreak(s); 

    return () => unsub();
  }, [docPath, profile?.userId, partner?.userId, couple?.deenStreak]);

  const getCurrentPrayer = () => {
    if (!prayerTimes.Fajr) return "Fajr";
    const now = new Date();
    const timeToDate = (timeStr: string) => parse(timeStr, "HH:mm", new Date());

    const isha = timeToDate(prayerTimes.Isha);
    const maghrib = timeToDate(prayerTimes.Maghrib);
    const asr = timeToDate(prayerTimes.Asr);
    const dhuhr = timeToDate(prayerTimes.Dhuhr);
    const fajr = timeToDate(prayerTimes.Fajr);

    if (isAfter(now, isha)) return "Isha";
    if (isAfter(now, maghrib)) return "Maghrib";
    if (isAfter(now, asr)) return "Asr";
    if (isAfter(now, dhuhr)) return "Dhuhr";
    return "Fajr";
  };

  const updateQuranProgress = async () => {
    if (!profile?.userId || !db) return;
    const currentProgress = profile.quranProgress || 0;
    const nextProgress = Math.min(currentProgress + AYAH_PER_PRAYER, TOTAL_AYAHS);

    try {
      await updateDoc(doc(db, "users", profile.userId), {
        quranProgress: nextProgress
      });
      // Also mark as done for today if not already
      if (!myData.quran) {
        await toggleItem("extra", "quran");
      }
      setShowQuranModal(false);
    } catch (e) {
      console.error("Failed to update Quran progress", e);
    }
  };

  const handleSetQuranProgress = async (newProgress: number) => {
    if (!profile?.userId || !db) return;
    const target = Math.max(0, Math.min(newProgress, TOTAL_AYAHS));
    try {
      await updateDoc(doc(db, "users", profile.userId), {
        quranProgress: target
      });
      setHasReachedBottom(false);
    } catch (e) {
      console.error("Failed to set Quran progress", e);
    }
  };

  const toggleItem = async (type: "prayer" | "extra", id: string) => {
    if (!db || !docPath || !profile?.userId || viewMode !== "me") return;

    try {
      await updateStreak();
    } catch (e) {
      console.warn("Streak update failed, continuing...", e);
    }

    const docRef = doc(db, docPath);
    
    let newStatus = false;
    if (type === "prayer") {
      newStatus = !myData.prayers?.[id];
    } else {
      newStatus = !(myData as any)[id];
    }

    try {
      const updateObj: any = {};
      if (type === "prayer") {
        updateObj[`${profile.userId}.prayers.${id}`] = newStatus;
      } else {
        updateObj[`${profile.userId}.${id}`] = newStatus;
      }
      updateObj.lastUpdated = serverTimestamp();
      
      await updateDoc(docRef, updateObj);
    } catch (e: any) {
      if (e.code === 'not-found') {
        const initialUserData: any = {
          prayers: {},
          quran: false,
          dhikr: false,
          dhikrEvening: false,
          tahajjud: false,
          duha: false,
          learning: false
        };

        if (type === "prayer") {
          initialUserData.prayers[id] = newStatus;
        } else {
          initialUserData[id] = newStatus;
        }

        const initialData = {
          [profile.userId]: initialUserData,
          lastUpdated: serverTimestamp(),
          notes: []
        };
        await setDoc(docRef, initialData, { merge: true });
      } else {
        console.error("Firestore Toggle Error:", e);
      }
    }
  };

  const sendNote = async () => {
    if (!newNote.trim() || !db || !couple?.id || !profile?.userId) return;
    
    await updateStreak();

    const noteId = Math.random().toString(36).substring(7);
    const note: DeenNote = {
      id: noteId,
      from: profile.userId,
      text: newNote,
      seen: false,
      followed: null,
      timestamp: new Date()
    };

    try {
      if (!docPath) return;
      await updateDoc(doc(db, docPath), {
        notes: arrayUnion(note)
      });
    } catch (e) {
      if (!docPath) return;
      await setDoc(doc(db, docPath), { notes: [note] }, { merge: true });
    }
    setNewNote("");
  };

  const acknowledgeNote = async (noteId: string, action: "seen" | "followed" | "ignored") => {
    if (!db || !docPath) return;
    
    const updatedNotes = notes.map(n => {
      if (n.id === noteId) {
        return {
          ...n,
          seen: true,
          followed: action === "followed" ? true : action === "ignored" ? false : n.followed
        };
      }
      return n;
    });

    try {
      await updateDoc(doc(db, docPath), { notes: updatedNotes });
    } catch (e) {
      await setDoc(doc(db, docPath), { notes: updatedNotes }, { merge: true });
    }
  };

  const currentViewData = viewMode === "me" ? myData : (partnerData || { 
    prayers: {}, 
    quran: false, 
    dhikr: false, 
    dhikrEvening: false, 
    tahajjud: false, 
    duha: false, 
    learning: false 
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
          <Compass className="text-gold opacity-20" size={48} />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 pt-8 sm:pt-12 max-w-2xl pb-40 relative">
      {/* Dynamic Ambient Decorative Background Glows wrapped safely to prevent horizontal overflow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-100px] left-1/4 w-[500px] h-[500px] bg-gold/5 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-emerald-500/[0.03] rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 left-1/3 w-[450px] h-[450px] bg-indigo-500/[0.02] rounded-full blur-[110px]" />
      </div>

      <AnimatePresence>
        {activeReminder && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md"
          >
            <GlassCard className="p-4 bg-gold border-gold text-midnight shadow-2xl flex items-center gap-4">
              <div className="bg-midnight/20 p-2 rounded-xl">
                <Bell size={20} className="animate-bounce" />
              </div>
              <p className="text-xs font-bold uppercase tracking-widest flex-1">{activeReminder}</p>
              <button 
                onClick={dismissReminder}
                className="p-1 hover:bg-midnight/10 rounded-full transition-colors"
                id="close-reminder"
              >
                <X size={16} />
              </button>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="mb-10 sm:mb-12 relative z-10 text-center">
        {/* Poetic & Polished Divine Quote */}
        <div className="inline-block py-1 px-4 sm:px-4.5 rounded-full bg-gold/5 border border-gold/15 backdrop-blur-md mb-5">
          <span className="text-[9px] tracking-[0.25em] uppercase text-gold font-bold">Divine Wisdom</span>
        </div>
        <p className="italic text-champagne/90 font-serif text-xl sm:text-2xl md:text-3xl tracking-wide max-w-xl mx-auto leading-relaxed mb-3 px-2">
          "And We created you in pairs"
        </p>
        <p className="text-[10px] uppercase tracking-[0.35em] text-gold/50 font-bold mb-10 sm:mb-12 font-mono">Surah An-Naba · 78:8</p>

        <div className="flex flex-col gap-6 mb-10 sm:mb-12 text-left">
          <div className="space-y-6 sm:space-y-8 w-full">
            <div className="space-y-1 text-center md:text-left">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif text-champagne">Our Deen Journey</h1>
              <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.25em] sm:tracking-[0.3em] text-gold font-bold">Scaling the heights of Iman together</p>
            </div>
            
            {/* Exquisite Metallic Streak Showcase Card */}
            <div className="flex items-center justify-center md:justify-start gap-4 sm:gap-6 bg-gradient-to-br from-gold/[0.15] via-gold/[0.03] to-white/[0.01] px-5 py-5 sm:px-6 sm:py-6 md:px-8 md:py-6.5 rounded-[24px] sm:rounded-[32px] border border-gold/25 backdrop-blur-3xl group hover:border-gold/35 transition-all shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gold/5 rounded-full blur-2xl"></div>
              <div className="p-3.5 bg-gold text-midnight rounded-[18px] sm:rounded-[22px] shadow-lg group-hover:scale-105 transition-all duration-300 flex items-center justify-center relative shrink-0">
                <TrendingUp size={24} className="sm:size-[28px]" strokeWidth={2.5} />
                <span className="absolute -top-0.5 -right-0.5 w-2 w-2 sm:w-2.5 sm:h-2.5 bg-emerald-500 rounded-full animate-ping" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-emerald-500 rounded-full" />
              </div>
              <div className="text-left">
                <p className="text-2xl sm:text-3xl md:text-4xl font-serif text-champagne leading-none mb-1 sm:mb-1.5 font-bold">{streak} Days</p>
                <p className="text-[8px] sm:text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.3em] text-gold font-bold">Iman Progress Streak</p>
              </div>
            </div>

            {/* Spiritual Verse Card - Multilingual under streak */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden group w-full"
            >
              <GlassCard className="p-5 sm:p-8 md:p-10 text-center bg-gradient-to-br from-midnight via-transparent to-gold/5 border-gold/15 shadow-xl relative rounded-[24px] sm:rounded-[32px]">
                 <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-gold/45 to-transparent" />
                 <div className="space-y-6 sm:space-y-8">
                    <div className="flex justify-center">
                       <h3 className="arabic-text text-3xl sm:text-4xl md:text-5xl text-champagne leading-[1.8] text-center w-full">
                          فَإِنَّ مَعَ الْعُسْرِ يُسْرًا
                       </h3>
                    </div>
                    <div className="space-y-4 sm:space-y-5">
                       <p className="text-base sm:text-lg md:text-xl font-serif italic text-ivory/80 tracking-tight leading-relaxed max-w-sm mx-auto">
                         "For indeed, with hardship [will be] ease."
                       </p>
                       <div className="w-10 sm:w-12 h-[1px] bg-gold/25 mx-auto"></div>
                       <p className="text-base sm:text-lg font-bangla text-gold/75 leading-relaxed max-w-sm mx-auto">
                         "নিশ্চয় কষ্টের সাথেই স্বস্তি রয়েছে।"
                       </p>
                    </div>
                    <p className="text-[8px] sm:text-[9px] uppercase tracking-[0.45em] sm:tracking-[0.55em] text-slate-gray font-bold pt-6 sm:pt-8 border-t border-white/5 inline-block">Surah Ash-Sharh · 94:6</p>
                 </div>
              </GlassCard>
            </motion.div>
          </div>

          {/* Premium Fluid Segmented Switcher */}
          <div className="flex justify-center md:justify-end w-full mt-2 sm:mt-4 md:mt-0">
             <div className="flex bg-midnight/60 p-1 rounded-full border border-white/5 backdrop-blur-md">
                <button 
                  onClick={() => setViewMode("me")}
                  className={cn(
                    "flex items-center gap-1.5 px-4.5 py-2 sm:px-5 sm:py-2.5 rounded-full text-[9px] sm:text-[10px] uppercase tracking-widest font-black transition-all",
                    viewMode === "me" 
                      ? "bg-gold text-midnight shadow-md shadow-gold/20 font-bold" 
                      : "text-slate-gray hover:text-ivory"
                  )}
                >
                  <User size={12} /> You
                </button>
                <button 
                  onClick={() => setViewMode("partner")}
                  className={cn(
                    "flex items-center gap-1.5 px-4.5 py-2 sm:px-5 sm:py-2.5 rounded-full text-[9px] sm:text-[10px] uppercase tracking-widest font-black transition-all",
                    viewMode === "partner" 
                      ? "bg-gold text-midnight shadow-md shadow-gold/20 font-bold" 
                      : "text-slate-gray hover:text-ivory"
                  )}
                >
                  <Users size={12} /> Spouse
                </button>
             </div>
          </div>
        </div>
      </header>

      <div className="space-y-10 sm:space-y-12 relative z-10">
        {/* Prayers Section */}
        <section className="space-y-5 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
            <div className="space-y-0.5 sm:space-y-1">
              <h3 className="heading-accent m-0 text-xl sm:text-2xl">Daily Prayers (Salah)</h3>
              <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.15em] sm:tracking-[0.2em] text-slate-gray font-bold">Offer together to multiply rewards</p>
            </div>
            <div className="flex items-center gap-2 text-[9px] sm:text-[10px] uppercase tracking-widest text-gold font-bold bg-gold/5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border border-gold/15 self-start sm:self-center">
              <Clock size={11} className="animate-pulse" /> {format(new Date(), "HH:mm")}
            </div>
          </div>
          {/* Elegant Circular Salah Progress Bar */}
          {(() => {
            const completedPrayersCount = Object.values(currentViewData.prayers || {}).filter(Boolean).length;
            return (
              <div className="bg-white/[0.01] border border-white/5 rounded-3xl p-4 sm:p-5 flex items-center justify-between backdrop-blur-sm text-left relative overflow-hidden">
                <div className="flex items-center gap-3 sm:gap-4 w-full">
                  <div className="relative flex items-center justify-center shrink-0">
                    <svg className="w-10 h-10 transform -rotate-90">
                      <circle
                        cx="20"
                        cy="20"
                        r="17"
                        stroke="rgba(255,255,255,0.05)"
                        strokeWidth="3"
                        fill="transparent"
                      />
                      <motion.circle
                        cx="20"
                        cy="20"
                        r="17"
                        stroke="#C5A059"
                        strokeWidth="3"
                        fill="transparent"
                        strokeDasharray={2 * Math.PI * 17}
                        animate={{ strokeDashoffset: 2 * Math.PI * 17 * (1 - completedPrayersCount / 5) }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      />
                    </svg>
                    <span className="absolute text-[9px] font-bold text-champagne font-mono">{completedPrayersCount}/5</span>
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-semibold text-champagne font-serif">Today's Salah Progress</h4>
                    <p className="text-[8px] sm:text-[9.5px] uppercase tracking-wider text-slate-gray font-bold mt-0.5">
                      {completedPrayersCount === 5 
                        ? "Incredible, complete devotion! (মাশাআল্লাহ)" 
                        : "Every prayer is a divine connection"}
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}

          <div className="grid grid-cols-1 gap-4">
            {prayersConfig.map((prayer) => {
              const isDone = currentViewData.prayers[prayer.id];
              const time = prayerTimes[prayer.id] || "--:--";
              const spouseDone = partnerData?.prayers?.[prayer.id];
              const reminderEnabled = profile?.reminderSettings?.[prayer.id];
              
              return (
                <GlassCard 
                  key={prayer.id}
                  onClick={() => viewMode === "me" && toggleItem("prayer", prayer.id)}
                  whileTap={viewMode === "me" ? { scale: 0.99 } : {}}
                  className={cn(
                    "p-3.5 sm:p-5 flex items-center justify-between transition-all duration-300 cursor-pointer group border relative overflow-hidden rounded-[20px] sm:rounded-[24px]",
                    isDone 
                      ? "bg-gold/[0.05] border-gold/40 shadow-md ring-1 ring-gold/10" 
                      : "bg-white/[0.01] border-white/5 hover:border-white/10 hover:bg-white/[0.03]"
                  )}
                >
                  <div className="flex items-center gap-3 sm:gap-5 text-left">
                    <div className={cn(
                      "p-2.5 sm:p-3 rounded-xl transition-all duration-300 flex items-center justify-center shrink-0",
                      isDone 
                        ? "bg-gold text-midnight shadow-lg scale-105" 
                        : "bg-white/5 text-slate-gray group-hover:text-gold group-hover:bg-gold/10"
                    )}>
                      <prayer.icon size={18} className="sm:size-[20px]" />
                    </div>
                    <div>
                      <h4 className={cn("text-base sm:text-lg font-serif mb-0.5", isDone ? "text-champagne font-semibold text-shadow-sm" : "text-ivory/60 group-hover:text-ivory")}>
                        {prayer.id}
                      </h4>
                      <div className="flex items-center gap-1 sm:gap-1.5">
                        <Clock size={10} className="text-gold/60" />
                        <span className="text-[9px] sm:text-[10px] font-mono tracking-wider text-slate-gray font-bold">{time}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                    {/* Integrated Remind Me Option Inside Prayer Box */}
                    {viewMode === "me" && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleReminder(prayer.id);
                        }}
                        title={reminderEnabled ? "Disable Reminder" : "Enable Reminder"}
                        className={cn(
                          "p-1.5 sm:p-2 rounded-lg border transition-all duration-200 outline-none shrink-0",
                          reminderEnabled 
                            ? "bg-gold/15 border-gold/30 text-gold hover:bg-gold/25" 
                            : "bg-white/5 border-white/5 text-slate-gray/45 hover:text-slate-gray hover:bg-white/10"
                        )}
                      >
                        <Bell size={12} className={cn(reminderEnabled ? "fill-gold text-gold scale-105" : "", "transition-all")} />
                      </button>
                    )}

                    {/* Spouse completion badge */}
                    {viewMode === "me" && spouseDone && (
                      <div className="flex flex-col items-center gap-0.5 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded bg-gold/5 border border-gold/15 shrink-0">
                          <CheckCircle2 size={9} className="text-gold" />
                          <span className="text-[5px] sm:text-[6px] uppercase tracking-wider text-gold font-bold whitespace-nowrap">Spouse Done</span>
                      </div>
                    )}

                    {/* Primary checkbox target */}
                    <div className={cn(
                      "w-8 sm:w-9 h-8 sm:h-9 rounded-xl border flex items-center justify-center transition-all duration-300 shrink-0 text-sm font-semibold",
                      isDone 
                        ? "bg-gold border-gold text-midnight scale-105 shadow-md shadow-gold/10 font-bold" 
                        : "border-white/10 group-hover:border-gold/30 text-transparent"
                    )}>
                      {isDone ? "✓" : ""}
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        </section>

        {/* Extra Deen Activities */}
        <section className="space-y-5 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
             <div className="space-y-1">
                <h3 className="heading-accent m-0 text-xl sm:text-2xl">Sacred Sunnahs</h3>
                <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.15em] sm:tracking-[0.2em] text-slate-gray font-bold">Voluntary acts of devotion</p>
             </div>
             <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.15em] sm:tracking-[0.2em] text-gold font-bold bg-gold/5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border border-gold/15 self-start sm:self-center">
                Elevate Companion Connection
             </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-4 md:gap-5">
            {[
              { id: "quran", label: "Quran", icon: Book, desc: "Recitation Plan", theme: "gold" },
              { id: "dhikr", label: "Dhikr", icon: Star, desc: "Time-based Adhkar", theme: "emerald" },
              { id: "tahajjud", label: "Tahajjud", icon: Moon, desc: "Guide & Log", theme: "indigo" },
              { id: "duha", label: "Duha", icon: Sun, desc: "Forenoon Salah", theme: "amber" },
              { id: "learning", label: "Learning", icon: Compass, desc: "Deen Knowledge", theme: "purple" },
            ].map((item) => {
              const isDone = currentViewData[item.id as keyof DeenData];
              const spouseDone = partnerData?.[item.id as keyof DeenData];
              
              const handleClick = () => {
                if (viewMode !== "me") return;
                if (item.id === "quran") {
                  setShowQuranModal(true);
                  fetchAyahs();
                } else if (item.id === "dhikr") {
                  setShowDhikrModal(true);
                } else if (item.id === "tahajjud") {
                  setShowTahajjudModal(true);
                } else if (item.id === "duha") {
                  setShowDuhaModal(true);
                } else if (item.id === "learning") {
                  setShowLearningModal(true);
                } else {
                  toggleItem("extra", item.id);
                }
              };

              const themesConfig = {
                gold: {
                  core: isDone ? "bg-gold/[0.04] border-gold/35 shadow-sm" : "border-white/5 hover:border-gold/25 hover:bg-gold/[0.01]",
                  iconDone: "bg-gold text-midnight shadow-[0_0_20px_rgba(197,160,89,0.35)]",
                  iconIdle: "bg-white/5 text-slate-gray group-hover:text-gold group-hover:bg-gold/10",
                  text: isDone ? "text-gold font-bold" : "text-champagne/80 group-hover:text-gold",
                },
                emerald: {
                  core: isDone ? "bg-emerald-500/[0.04] border-emerald-500/35 shadow-sm" : "border-white/5 hover:border-emerald-500/25 hover:bg-emerald-500/[0.01]",
                  iconDone: "bg-emerald-500 text-midnight shadow-[0_0_20px_rgba(16,185,129,0.35)]",
                  iconIdle: "bg-white/5 text-slate-gray group-hover:text-emerald-400 group-hover:bg-emerald-500/10",
                  text: isDone ? "text-emerald-400 font-bold" : "text-champagne/80 group-hover:text-emerald-400",
                },
                indigo: {
                  core: isDone ? "bg-indigo-500/[0.04] border-indigo-500/35 shadow-sm" : "border-white/5 hover:border-indigo-500/25 hover:bg-indigo-500/[0.01]",
                  iconDone: "bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.35)]",
                  iconIdle: "bg-white/5 text-slate-gray group-hover:text-indigo-400 group-hover:bg-indigo-500/10",
                  text: isDone ? "text-indigo-400 font-bold" : "text-champagne/80 group-hover:text-indigo-400",
                },
                amber: {
                  core: isDone ? "bg-amber-500/[0.04] border-amber-500/35 shadow-sm" : "border-white/5 hover:border-amber-500/25 hover:bg-amber-500/[0.01]",
                  iconDone: "bg-amber-500 text-midnight shadow-[0_0_20px_rgba(245,158,11,0.35)]",
                  iconIdle: "bg-white/5 text-slate-gray group-hover:text-amber-400 group-hover:bg-amber-500/10",
                  text: isDone ? "text-amber-400 font-bold" : "text-champagne/80 group-hover:text-amber-400",
                },
                purple: {
                  core: isDone ? "bg-purple-500/[0.04] border-purple-500/35 shadow-sm" : "border-white/5 hover:border-purple-500/25 hover:bg-purple-500/[0.01]",
                  iconDone: "bg-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.35)]",
                  iconIdle: "bg-white/5 text-slate-gray group-hover:text-purple-400 group-hover:bg-purple-500/10",
                  text: isDone ? "text-purple-400 font-bold" : "text-champagne/80 group-hover:text-purple-400",
                }
              };

              const themeStyles = themesConfig[item.theme as "gold" | "emerald" | "indigo" | "amber" | "purple"] || themesConfig.gold;

              return (
                <GlassCard
                  key={item.id}
                  onClick={handleClick}
                  whileTap={viewMode === "me" ? { scale: 0.97 } : {}}
                  className={cn(
                    "relative group h-[140px] sm:h-[160px] md:h-[195px] p-0 flex flex-col justify-center items-center overflow-hidden transition-all duration-300 cursor-pointer border rounded-[24px] sm:rounded-[28px] text-left",
                    themeStyles.core,
                    item.id === "learning" ? "col-span-2 md:col-span-1" : ""
                  )}
                >
                  <div className="relative z-10 w-full flex flex-col items-center px-3 sm:px-4">
                    {/* Icon Container */}
                    <div className="relative mb-2 sm:mb-3">
                      <motion.div 
                        animate={isDone ? { scale: [1, 1.03, 1] } : {}}
                        transition={{ duration: 3, repeat: Infinity }}
                        className={cn(
                          "p-2.5 sm:p-3 rounded-2xl transition-all duration-300 relative flex items-center justify-center",
                          isDone ? themeStyles.iconDone : themeStyles.iconIdle
                        )}
                      >
                        <item.icon size={20} className="sm:size-[22px]" strokeWidth={1.5} />
                      </motion.div>
                    </div>

                    <div className="text-center w-full space-y-0.5">
                      <h4 className={cn(
                        "text-sm sm:text-base md:text-lg font-serif tracking-tight transition-all duration-300",
                        themeStyles.text
                      )}>
                        {item.label}
                      </h4>
                      <p className="text-[7.5px] sm:text-[8px] uppercase tracking-[0.2em] text-slate-gray font-bold opacity-60">
                        {item.desc}
                      </p>
                    </div>

                    {/* Partner Status Badge */}
                    {viewMode === "me" && spouseDone && (
                      <div className="mt-2 sm:mt-2.5 flex items-center justify-center gap-1 px-1.5 py-0.5 rounded-full bg-gold/5 border border-gold/15 shrink-0">
                        <Heart size={8} className="text-gold fill-gold" />
                        <span className="text-[5.5px] sm:text-[6px] uppercase tracking-widest text-gold font-black">Partner Done</span>
                      </div>
                    )}
                  </div>
                </GlassCard>
              );
            })}
          </div>
        </section>

        {/* Partner Notes & Polls */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 text-left">
            <MessageSquare className="text-gold" size={18} />
            <h3 className="heading-accent m-0">Sacred Reminders</h3>
          </div>

          <GlassCard className="p-0 border-white/5 overflow-hidden shadow-lg bg-white/[0.01]">
            <div className="p-3 flex gap-3 items-center">
              <input 
                type="text"
                placeholder="Leave a spiritual nudge..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-ivory placeholder:text-slate-gray/40 font-serif px-3 py-2 text-sm text-left"
              />
              <button 
                onClick={sendNote}
                className="p-3 bg-gold hover:bg-gold/95 text-midnight rounded-[16px] hover:scale-105 active:scale-95 transition-all shadow-md shadow-gold/15 shrink-0"
              >
                <Send size={16} />
              </button>
            </div>
          </GlassCard>

          <div className="space-y-4">
             <AnimatePresence>
              {notes.length === 0 ? (
                <p className="text-center text-[10px] uppercase tracking-widest text-slate-gray/60 py-10 border border-dashed border-white/5 rounded-[24px]">No echoes to share yet</p>
              ) : (
                [...notes].reverse().map((note) => {
                  const isFromMe = note.from === profile?.userId;
                  return (
                    <motion.div
                      key={note.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "p-6 rounded-[28px] border flex flex-col gap-4 transition-all text-left relative overflow-hidden",
                        isFromMe 
                          ? "bg-white/[0.01] border-white/5" 
                          : "bg-gold/[0.03] border-gold/15 shadow-sm"
                      )}
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex gap-3 text-left">
                          <div className={cn("p-2.5 rounded-xl shrink-0 flex items-center justify-center h-10 w-10", isFromMe ? "bg-white/5 text-slate-gray" : "bg-gold text-midnight")}>
                             <Heart size={14} />
                          </div>
                          <div>
                            <p className="text-base font-serif text-champagne leading-relaxed">{note.text}</p>
                            <p className="text-[9px] uppercase tracking-[0.2em] text-slate-gray mt-1.5 font-bold opacity-60">
                              {isFromMe ? "Sent by you" : `From ${partner?.name?.split(' ')[0] || 'Spouse'}`}
                            </p>
                          </div>
                        </div>
                        {!isFromMe && !note.seen && <AlertCircle size={14} className="text-gold animate-pulse shrink-0 mt-1" />}
                      </div>

                      {!isFromMe && !note.seen && (
                         <button 
                           onClick={() => acknowledgeNote(note.id, "seen")}
                           className="w-full py-3 bg-gold text-midnight rounded-xl text-[10px] uppercase tracking-widest font-bold shadow-md hover:bg-gold/90 transition-all shadow-gold/10"
                         >
                           Read Reminder
                         </button>
                      )}

                      {!isFromMe && note.seen && (
                         <div className="space-y-3 pt-3 border-t border-white/5">
                            <p className="text-[8px] uppercase tracking-widest text-gold/80 font-bold text-center">Followed this reminder?</p>
                            <div className="flex gap-2">
                               <button 
                                 onClick={() => acknowledgeNote(note.id, "followed")}
                                 className={cn(
                                   "flex-1 py-2.5 rounded-xl text-[9px] uppercase tracking-widest font-bold border transition-all",
                                   note.followed === true ? "bg-emerald-500 text-white border-emerald-500" : "bg-white/5 border-white/10 text-slate-gray/70 hover:bg-white/10"
                                 )}
                               >
                                 Yes
                               </button>
                               <button 
                                 onClick={() => acknowledgeNote(note.id, "ignored")}
                                 className={cn(
                                   "flex-1 py-2.5 rounded-xl text-[9px] uppercase tracking-widest font-bold border transition-all",
                                   note.followed === false ? "bg-red-500/20 border-red-500/30 text-red-300" : "bg-white/5 border-white/10 text-slate-gray/70 hover:bg-white/10"
                                 )}
                               >
                                 No
                               </button>
                            </div>
                         </div>
                      )}

                      {isFromMe && note.seen && (
                         <div className="flex justify-between items-center text-[7px] uppercase tracking-widest font-black border-t border-white/5 pt-3 mt-1">
                            <span className="text-gold/50">Seen by spouse</span>
                            {note.followed !== null && (
                               <span className={note.followed ? "text-emerald-400" : "text-amber-500/75"}>
                                 {note.followed ? "Followed successfully" : "Not yet followed"}
                               </span>
                            )}
                         </div>
                      )}
                    </motion.div>
                  );
                })
              )}
             </AnimatePresence>
          </div>
        </section>
      </div>

      {/* Quran Progress Modal */}
      <AnimatePresence>
        {showQuranModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4 bg-midnight/95 backdrop-blur-2xl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="w-full max-w-5xl h-[95vh] flex flex-col"
            >
              <GlassCard className="p-0 border-gold/30 shadow-[0_0_100px_rgba(197,160,89,0.2)] relative overflow-hidden flex flex-col h-full">
                {/* Header - Fixed & Compact */}
                <div className="p-5 md:p-6 pb-3 border-b border-white/10 flex justify-between items-center shrink-0">
                  <div className="flex gap-4 items-center">
                    <div className="p-3 bg-gold text-midnight rounded-[18px] shadow-lg">
                      <Book size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl md:text-2xl font-serif text-champagne">Quran Khatam Plan</h2>
                      <p className="text-[8px] uppercase tracking-[0.3em] text-gold font-bold">1 Month Journey · 42 Ayahs</p>
                    </div>
                  </div>
                  <button onClick={() => setShowQuranModal(false)} className="p-3 bg-white/5 hover:bg-gold hover:text-midnight rounded-full transition-all text-slate-gray">
                    <X size={20} />
                  </button>
                </div>

                {/* Progress Grid - Fixed/Very Compact */}
                <div className="px-6 py-4 bg-white/5 border-b border-white/10 shrink-0">
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div className="flex justify-between items-center px-4 py-1.5 bg-midnight/40 rounded-lg border border-white/5 w-full">
                      <span className="text-[8px] uppercase tracking-widest text-slate-gray font-bold">Start</span>
                      <span className="text-sm font-serif text-gold">Ayah {(profile?.quranProgress || 0) + 1}</span>
                    </div>
                    <div className="flex justify-between items-center px-4 py-1.5 bg-midnight/40 rounded-lg border border-white/5 w-full">
                      <span className="text-[8px] uppercase tracking-widest text-slate-gray font-bold">Goal</span>
                      <span className="text-sm font-serif text-ivory">Ayah {Math.min((profile?.quranProgress || 0) + AYAH_PER_PRAYER, TOTAL_AYAHS)}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[7px] uppercase tracking-widest font-bold">
                      <span className="text-slate-gray">Total Progress</span>
                      <span className="text-gold">{(profile?.quranProgress || 0)} / {TOTAL_AYAHS} ({Math.round(((profile?.quranProgress || 0) / TOTAL_AYAHS) * 100)}%)</span>
                    </div>
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${((profile?.quranProgress || 0) / TOTAL_AYAHS) * 100}%` }}
                        className="h-full bg-gold shadow-[0_0_10px_rgba(197,160,89,0.5)]"
                      />
                    </div>
                  </div>

                  {/* Navigation & Reset Controls */}
                  <div className="flex items-center justify-between flex-wrap gap-2 mt-4 pt-3 border-t border-white/5">
                    <button
                      onClick={() => {
                        if (confirm("Are you sure you want to reset your Quran progression back to the very beginning?")) {
                          handleSetQuranProgress(0);
                        }
                      }}
                      disabled={ayahLoading || (profile?.quranProgress || 0) === 0}
                      className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-400 text-[9px] uppercase tracking-widest font-black transition-all disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw size={12} /> Reset to Start
                    </button>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSetQuranProgress((profile?.quranProgress || 0) - AYAH_PER_PRAYER)}
                        disabled={ayahLoading || (profile?.quranProgress || 0) === 0}
                        className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-ivory text-[9px] uppercase tracking-widest font-black transition-all disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1.5 cursor-pointer"
                        title="Go back 42 Ayahs"
                      >
                        <ChevronLeft size={12} /> Prev 42 Ayahs
                      </button>

                      <button
                        onClick={() => handleSetQuranProgress((profile?.quranProgress || 0) + AYAH_PER_PRAYER)}
                        disabled={ayahLoading || (profile?.quranProgress || 0) >= TOTAL_AYAHS}
                        className="px-3 py-1.5 rounded-xl bg-gold/10 hover:bg-gold/20 border border-gold/20 hover:border-gold/30 text-gold text-[9px] uppercase tracking-widest font-black transition-all disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1.5 cursor-pointer"
                        title="Go forward 42 Ayahs"
                      >
                        Next 42 Ayahs <ChevronRight size={12} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Ayahs List - Scrollable */}
                <div 
                  ref={scrollRef}
                  onScroll={handleScroll}
                  className="flex-1 overflow-y-auto scroll-smooth p-6 md:p-8 pt-4 space-y-6 custom-scrollbar bg-midnight/20"
                >
                  {ayahLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-6">
                      <div className="relative">
                        <div className="w-16 h-16 border-4 border-gold/10 rounded-full" />
                        <div className="w-16 h-16 border-4 border-t-gold rounded-full animate-spin absolute top-0 left-0" />
                      </div>
                      <div className="text-center space-y-2">
                        <p className="text-sm text-gold font-bold animate-pulse">Fetching Divine Verses</p>
                        <p className="text-[10px] text-slate-gray uppercase tracking-widest">Generating Bangla Transliteration...</p>
                      </div>
                    </div>
                  ) : ayahs.length > 0 ? (
                    ayahs.map((ayah, idx) => (
                      <motion.div 
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="bg-white/5 border border-white/5 p-8 rounded-[32px] space-y-6 group hover:bg-white/[0.08] transition-all text-left"
                      >
                        <div className="flex justify-between items-center border-b border-white/5 pb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gold/10 text-gold rounded-lg flex items-center justify-center text-xs font-bold font-mono">
                              {ayah.numInSurah}
                            </div>
                            <span className="text-[10px] uppercase tracking-widest text-gold font-bold">{ayah.surahEn}</span>
                          </div>
                          <span className="text-[10px] text-slate-gray font-mono opacity-40">Verse #{ayah.number}</span>
                        </div>

                        <p className="arabic-text text-4xl text-right text-champagne leading-[1.8] group-hover:text-white transition-colors">
                          {ayah.text}
                        </p>

                        <div className="space-y-4 pt-4 border-t border-white/5">
                          <div className="flex flex-col gap-1.5">
                            <span className="text-[9px] uppercase tracking-[0.2em] text-gold/40 font-bold">Bangla Uccharon</span>
                            <p className="text-base text-gold font-bold leading-relaxed font-bangla">
                              {ayah.transliteration}
                            </p>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <span className="text-[9px] uppercase tracking-[0.2em] text-white/20 font-bold">Bengali Translation</span>
                            <p className="text-[13px] text-ivory/70 font-serif leading-relaxed italic">
                              "{ayah.translation}"
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-20 px-10 border border-dashed border-white/10 rounded-[32px]">
                      <p className="text-slate-gray text-sm">Failed to load verses. Please try again.</p>
                    </div>
                  )}
                </div>

                {/* Footer - Fixed */}
                <div className="p-6 md:p-8 border-t border-white/10 shrink-0 bg-midnight/40 backdrop-blur-md">
                  <div className="flex flex-col gap-4">
                    <AnimatePresence>
                      {hasReachedBottom ? (
                        <motion.button 
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          onClick={updateQuranProgress}
                          disabled={ayahLoading}
                          className={cn(
                            "w-full py-5 rounded-[24px] text-sm uppercase tracking-[0.3em] font-bold shadow-2xl transition-all bg-gold text-midnight hover:scale-[1.02] active:scale-95 shadow-[0_15px_40px_rgba(197,160,89,0.4)]",
                            ayahLoading && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          {ayahLoading ? "Please Wait..." : `Mark as Read (${AYAH_PER_PRAYER} Ayahs)`}
                        </motion.button>
                      ) : (
                        <div className="py-4 text-center">
                          <p className="text-[10px] uppercase tracking-[0.2em] text-gold/40 animate-pulse font-bold">
                            Scroll to bottom to mark as read
                          </p>
                        </div>
                      )}
                    </AnimatePresence>
                    <p className="text-[9px] text-center text-slate-gray/60 italic font-serif">
                      Read these ayahs after this prayer to complete the Quran in 1 month
                    </p>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Dhikr Modal */}
      <AnimatePresence>
        {showDhikrModal && (() => {
          const activeKey = getInitialDhikrTab();
          const activeCollection = dhikrCollections[activeKey] || dhikrCollections.postFajr;
          const modalIcon = activeCollection.icon;

          return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-midnight/80 backdrop-blur-xl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-xl"
            >
              <GlassCard className="p-6 md:p-10 border-gold/30 shadow-2xl relative max-h-[85vh] overflow-y-auto custom-scrollbar">
                <div className="absolute top-4 right-4 z-10">
                  <button onClick={() => setShowDhikrModal(false)} className="text-slate-gray hover:text-gold transition-colors p-2 bg-midnight/40 rounded-full">
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="text-center space-y-4">
                    <div className="p-4 bg-gold/10 text-gold rounded-full inline-block border border-gold/20">
                      {React.createElement(modalIcon, { size: 24 })}
                    </div>
                    <div>
                      <h2 className="text-2xl font-serif text-champagne mb-1">{activeCollection.title}</h2>
                      <p className="text-[10px] uppercase tracking-[0.3em] text-gold font-bold">{activeCollection.banglaTitle}</p>
                    </div>
                  </div>

                  <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-1 scrollbar-thin">
                    {activeCollection.items.map((dhikr, idx) => {
                       return (
                        <div key={idx} className="bg-white/5 border border-white/5 p-5 rounded-[24px] space-y-3 group hover:bg-white/[0.08] transition-all text-left">
                          <div className="flex justify-between items-start gap-3">
                            <h4 className="arabic-text text-2xl text-right text-champagne leading-relaxed flex-1">
                              {dhikr.arabic}
                            </h4>
                            {dhikr.repeat > 1 && (
                              <div className="bg-gold text-midnight px-3 py-0.5 rounded-full text-[9px] font-bold shadow-md whitespace-nowrap">
                                {dhikr.repeat}x
                              </div>
                            )}
                          </div>
                          <div className="space-y-2 pt-1 border-t border-white/5">
                             <div className="flex flex-col gap-0.5">
                                <span className="text-[8px] uppercase tracking-widest text-gold/40 font-bold">উচ্চারণ (Pronunciation)</span>
                                <p className="text-xs font-bangla text-ivory/95 leading-relaxed font-semibold">
                                   {dhikr.banglaUccharon}
                                </p>
                             </div>
                             <div className="flex flex-col gap-0.5">
                                <span className="text-[8px] uppercase tracking-widest text-white/20 font-bold">অনুবাদ (Translation)</span>
                                <p className="text-[11px] font-serif italic text-slate-gray leading-relaxed">"{dhikr.translation}"</p>
                             </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <button 
                    onClick={() => {
                      if (viewMode === "me" && !myData.dhikr) toggleItem("extra", "dhikr");
                      setShowDhikrModal(false);
                    }}
                    className="w-full py-4.5 bg-midnight border-2 border-gold/40 text-gold rounded-[20px] text-[10px] uppercase tracking-widest font-bold hover:bg-gold hover:text-midnight transition-all shadow-xl"
                  >
                    Mark Daily Dhikr as Done (আজকার সম্পন্ন করেছি)
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          </div>
          );
        })()}
      </AnimatePresence>

      {/* Tahajjud Modal */}
      <AnimatePresence>
        {showTahajjudModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-midnight/80 backdrop-blur-xl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-xl"
            >
              <GlassCard className="p-6 md:p-10 border-gold/30 shadow-2xl relative max-h-[85vh] overflow-y-auto custom-scrollbar">
                <div className="absolute top-4 right-4 z-10">
                  <button onClick={() => setShowTahajjudModal(false)} className="text-slate-gray hover:text-gold transition-colors p-2 bg-midnight/40 rounded-full">
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-6 text-left">
                  <div className="text-center space-y-3">
                    <div className="p-4 bg-gold/10 text-gold rounded-full inline-block shadow-lg border border-gold/20">
                      <Moon size={28} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-serif text-champagne mb-1">Tahajjud Guide & Sunnah</h2>
                      <p className="text-[10px] uppercase tracking-[0.3em] text-gold font-bold">তাহাজ্জুদ সালাতের নিয়ম ও সুন্নাহ</p>
                    </div>
                  </div>

                  <div className="bg-gold/5 border border-gold/10 rounded-[24px] p-5 space-y-1">
                    <p className="text-[11px] text-gold/80 italic font-serif leading-relaxed text-center">
                      “আমাদের প্রতিপালক প্রতি রাতের শেষ তৃতীয়াংশে নিম্ন আকাশে অবতরণ করেন এবং বলেন: কে আমাকে ডাকবে আমি তার ডাকে সাড়া দেব? কে আমার কাছে চাইবে আমি তাকে দান করব?”
                    </p>
                    <p className="text-[8px] text-right text-slate-gray">— সহীহ বুখারী: ১১৪৫</p>
                  </div>

                  <div className="space-y-5 max-h-[40vh] overflow-y-auto pr-1">
                    <div>
                      <h3 className="text-xs uppercase tracking-widest text-gold mb-2 font-bold flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-gold"></span>
                        তাহাজ্জুদের সময় (Time of Prayer)
                      </h3>
                      <p className="text-xs text-slate-gray leading-relaxed pl-3">
                        রাতের শেষ তৃতীয়াংশ হচ্ছে সবচেয়ে উত্তম সময়। এশার নামাজের পর থেকে সুবহে সাদেক বা ফজরের ওয়াক্ত হওয়ার পূর্ব পর্যন্ত যেকোনো সময় আদায় করা যায়। ঘুমানোর পর জেগে উঠে এই নামাজ পড়া সুন্নাত।
                      </p>
                    </div>

                    <div>
                      <h3 className="text-xs uppercase tracking-widest text-gold mb-2 font-bold flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-gold"></span>
                        রাকত সংখ্যা (Number of Rak'ahs)
                      </h3>
                      <p className="text-xs text-slate-gray leading-relaxed pl-3">
                        নূন্যতম ২ রাকাত থেকে সর্বোচ্চ ১২ রাকাত পর্যন্ত পড়া যায়। প্রিয় নবী (ﷺ) সাধারণত ৮ রাকাত পড়তেন এবং এরপর ৩ রাকাত বিতর সালাত আদায় করতে ভালোবাসতেন। ২ রাকাত করে প্রতি সালামে শেষ করা নিয়ম।
                      </p>
                    </div>

                    <div>
                      <h3 className="text-xs uppercase tracking-widest text-gold mb-2 font-bold flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-gold"></span>
                        পড়া ও আমলের সুন্নাহ নিয়মসমূহ
                      </h3>
                      <ul className="space-y-2.5 pl-3 text-xs text-ivory/95">
                        <li className="flex items-start gap-1.5">
                          <span className="text-gold mt-1">✦</span>
                          <div>
                            <strong className="text-champagne block">ঘুমানোর আগে নিয়ত (Firm Intention):</strong>
                            ঘুমানোর পূর্বে মনে মনে তাহাজ্জুদের মজবুত নিয়ত করা। যদি না-ও উঠতে পারে, তবুও বোনাস সাওয়াব পাওয়া যাবে।
                          </div>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <span className="text-gold mt-1">✦</span>
                          <div>
                            <strong className="text-champagne block">মেসওয়াক করা (Using Siwak/Miswak):</strong>
                            ঘুম থেকে উঠে মেসওয়াক বা দাঁত ব্রাশ করা খুবই গুরুত্বসহকারে সুন্নাত।
                          </div>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <span className="text-gold mt-1">✦</span>
                          <div>
                            <strong className="text-champagne block">আকাশের দিকে তাকিয়ে সূরা আল-ইমরান পাঠ:</strong>
                            রাসূলুল্লাহ (ﷺ) ঘুম থেকে জেগেই আকাশের দিকে তাকাতেন এবং সূরা আলে-ইমরানের শেষ ১০ আয়াত (১৯০-২০০) তিলাওয়াত করতেন।
                          </div>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <span className="text-gold mt-1">✦</span>
                          <div>
                            <strong className="text-champagne block">দীর্ঘ সেজদা ও রুকু (Long Sujood & Ruku):</strong>
                            তাহাজ্জুদ সালাতের রুকু ও সেজদা দীর্ঘ করা উত্তম। সেজদায় গিয়ে নিজের ভাষায় আল্লাহর দরবারে প্রচুর ক্রন্দন ও সাহায্য প্রার্থনা করুন।
                          </div>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <span className="text-gold mt-1">✦</span>
                          <div>
                            <strong className="text-champagne block">সালাতের প্রারম্ভিক রাকাত (Beginning):</strong>
                            প্রথমে হালকা বা ছোট সূরা দিয়ে সংক্ষিপ্ত দুই রাকাত সালাত আদায় করার পর দীর্ঘ সূরা দিয়ে নামাজ পড়া সুন্নাত।
                          </div>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      if (viewMode === "me") toggleItem("extra", "tahajjud");
                      setShowTahajjudModal(false);
                    }}
                    className={cn(
                      "w-full py-4 rounded-[20px] text-xs uppercase tracking-widest font-bold shadow-2xl transition-all hover:scale-[1.02] active:scale-95 mt-4",
                      myData.tahajjud 
                        ? "bg-white/10 text-ivory hover:bg-white/15" 
                        : "bg-gold text-midnight shadow-gold/30"
                    )}
                  >
                    {myData.tahajjud ? "Mark Tahajjud as Undone (তাহাজ্জুদ সালাত বাতিল করুন)" : "Mark Tahajjud as Done (তাহাজ্জুদ সম্পন্ন করেছি)"}
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Duha Modal */}
      <AnimatePresence>
        {showDuhaModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-midnight/80 backdrop-blur-xl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-xl"
            >
              <GlassCard className="p-6 md:p-10 border-gold/30 shadow-2xl relative max-h-[85vh] overflow-y-auto custom-scrollbar">
                <div className="absolute top-4 right-4 z-10">
                  <button onClick={() => setShowDuhaModal(false)} className="text-slate-gray hover:text-gold transition-colors p-2 bg-midnight/40 rounded-full">
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-6 text-left">
                  <div className="text-center space-y-3">
                    <div className="p-4 bg-gold/10 text-gold rounded-full inline-block shadow-lg border border-gold/20">
                      <Sun size={28} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-serif text-champagne mb-1">Duha Salah Guide & Virtues</h2>
                      <p className="text-[10px] uppercase tracking-[0.3em] text-gold font-bold">দ্বোহা/চাশত সালাত গাইড ও ফজিলত</p>
                    </div>
                  </div>

                  <div className="bg-gold/5 border border-gold/10 rounded-[24px] p-5 space-y-1">
                    <p className="text-[11px] text-gold/80 italic font-serif leading-relaxed text-center">
                      “প্রতিদিন সকালে আপনাদের শরীরের প্রতিটি জোড়ার (৩৬০টি জোড়া) সদকা আদায় করা আবশ্যক... তবে চাশতের (দ্বোহা) দুই রাকাত সালাত আদায় করা এই সবকিছুর পক্ষ থেকে যথেষ্ট হয়।”
                    </p>
                    <p className="text-[8px] text-right text-slate-gray">— সহীহ মুসলিম: ৭২০</p>
                  </div>

                  <div className="space-y-5 max-h-[40vh] overflow-y-auto pr-1">
                    <div>
                      <h3 className="text-xs uppercase tracking-widest text-gold mb-2 font-bold flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-gold"></span>
                        নামাজের সময় (Time of Prayer)
                      </h3>
                      <p className="text-xs text-slate-gray leading-relaxed pl-3">
                        সূর্য উদয়ের আনুমানিক ১৫-২০ মিনিট পর থেকে শুরু করে দ্বিপ্রহরের (ঠিক দুপুরের) প্রায় ২০-২৫ মিনিট পূর্ব পর্যন্ত। রাসুলুল্লাহ (ﷺ) সূর্য ভালোমত উত্তপ্ত হওয়ার পর অর্থাৎ সকাল ৯টা থেকে ১১টার মধ্যবর্তী সময়ে চাশত পড়তে বেশি ভালোবাসতেন।
                      </p>
                    </div>

                    <div>
                      <h3 className="text-xs uppercase tracking-widest text-gold mb-2 font-bold flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-gold"></span>
                        রাকত সংখ্যা (Number of Rak'ahs)
                      </h3>
                      <p className="text-xs text-slate-gray leading-relaxed pl-3">
                        নূন্যতম ২ রাকাত থেকে সর্বোচ্চ ৮ রাকাত পর্যন্ত আজ করা যায়। ২ রাকাত করে প্রতি সালামে শেষ করা নিয়ম। রাসুলুল্লাহ (ﷺ) সাধারণত ৪ রাকাত করে পড়তেন এবং কখনও ইচ্ছে করলে বেশিও পড়তেন।
                      </p>
                    </div>

                    <div>
                      <h3 className="text-xs uppercase tracking-widest text-gold mb-2 font-bold flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-gold"></span>
                        পরম ফজিলত ও সুন্নাহসমূহ (Virtues & Blessings)
                      </h3>
                      <ul className="space-y-2.5 pl-3 text-xs text-ivory/95">
                        <li className="flex items-start gap-1.5">
                          <span className="text-gold mt-1">✦</span>
                          <div>
                            <strong className="text-champagne block">৩৬০টি সদকার সাওয়াব:</strong>
                             can- মানবদেহে অবস্থিত ৩৬০টি জয়েন্টের প্রত্যেকটির জন্য প্রতিদিন সকালে সদকা করা আবশ্যক। দুই রাকাত চাশতের সালাত এই সব জয়েন্টের সদকার সমান সাওয়াব এনে দেয়।
                          </div>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <span className="text-gold mt-1">✦</span>
                          <div>
                            <strong className="text-champagne block">সারাদিনের কাজ আল্লাহর দায়িত্বে:</strong>
                            যে ব্যক্তি দিনের শুরুতে চার রাকাত চাশতের সালাত আদায় করে, আল্লাহ তায়ালা তার পুরো দিনের দায়িত্ব গ্রহণ করে নেন।
                          </div>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <span className="text-gold mt-1">✦</span>
                          <div>
                            <strong className="text-champagne block">আউয়াবিনের সালাত (Salah of Awabeen):</strong>
                            রাসুলুল্লাহ (ﷺ) বলেছেন, "নিষ্ঠাবান তাওবাকারীগণই কেবল চাশতের নামাজের চমৎকার নিয়মিত যত্ন নেন এবং এটিই আল-আউয়াবীন (তাওবাকারী)-দের সালাত।"
                          </div>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      if (viewMode === "me") toggleItem("extra", "duha");
                      setShowDuhaModal(false);
                    }}
                    className={cn(
                      "w-full py-4 rounded-[20px] text-xs uppercase tracking-widest font-bold shadow-2xl transition-all hover:scale-[1.02] active:scale-95 mt-4",
                      myData.duha 
                        ? "bg-white/10 text-ivory hover:bg-white/15" 
                        : "bg-amber-500 text-midnight shadow-amber-500/30"
                    )}
                  >
                    {myData.duha ? "Mark Duha as Undone (দ্বোহা সালাত বাতিল করুন)" : "Mark Duha as Done (দ্বোহা সালাত সম্পন্ন করেছি)"}
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Learning Modal */}
      <AnimatePresence>
        {showLearningModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-midnight/80 backdrop-blur-xl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-xl"
            >
              <GlassCard className="p-6 md:p-10 border-gold/30 shadow-2xl relative max-h-[85vh] overflow-y-auto custom-scrollbar">
                <div className="absolute top-4 right-4 z-10">
                  <button 
                    onClick={() => {
                      setShowLearningModal(false);
                      setSelectedLearningTopic(null);
                    }} 
                    className="text-slate-gray hover:text-gold transition-colors p-2 bg-midnight/40 rounded-full"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-6 text-left">
                  <div className="text-center space-y-3">
                    <div className="p-4 bg-gold/10 text-gold rounded-full inline-block shadow-lg border border-gold/20">
                      <Compass size={28} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-serif text-champagne mb-1">Seek Sacred Knowledge</h2>
                      <p className="text-[10px] uppercase tracking-[0.3em] text-gold font-bold">দ্বীনি ইলম অর্জন ও অধ্যয়ন</p>
                    </div>
                  </div>

                  <div className="bg-gold/5 border border-gold/10 rounded-[24px] p-5 space-y-1">
                    <p className="text-[11px] text-gold/80 italic font-serif leading-relaxed text-center">
                      “যে ব্যক্তি ইলম (দ্বীনি জ্ঞান) অর্জনের জন্য কোনো পথ ধারণ করে, আল্লাহ তার জন্য জান্নাতের পথ সহজ করে দেন।”
                    </p>
                    <p className="text-[8px] text-right text-slate-gray">— সহীহ মুসলিম: ২৬৯৯</p>
                  </div>

                  {selectedLearningTopic === null ? (
                    <div className="space-y-5 max-h-[48vh] overflow-y-auto pr-1">
                      <div>
                        <h3 className="text-xs uppercase tracking-widest text-gold mb-2 font-bold flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-gold"></span>
                          আজকের দ্বীনি শিক্ষা বিষয়সমূহ (Topics to Study)
                        </h3>
                        <p className="text-xs text-slate-gray leading-relaxed pl-3 mb-3">
                          দুজন একসাথে বসে বা আলাদাভাবে দিনে অন্তত ৫-১০ মিনিট দ্বীনি আলোচনা করুন বা পড়ুন। পড়তে যেকোনো একটি বিষয়ে ক্লিক করুন:
                        </p>
                        
                        <div className="grid grid-cols-1 gap-2.5 pl-3">
                          {learningTopics.map((topic, i) => (
                            <button
                              type="button"
                              key={i}
                              onClick={() => setSelectedLearningTopic(i)}
                              className="text-left p-4 bg-white/[0.02] border border-white/5 hover:border-gold/30 rounded-2xl hover:bg-gold/5 transition-all w-full flex items-center justify-between group"
                            >
                              <div className="space-y-1 pr-4">
                                <h4 className="text-xs font-bold text-champagne group-hover:text-gold transition-colors">{topic.title}</h4>
                                <p className="text-[10px] text-slate-gray leading-relaxed">{topic.desc}</p>
                              </div>
                              <ChevronRight size={16} className="text-slate-gray group-hover:text-gold group-hover:translate-x-1 transition-all shrink-0" />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-xs uppercase tracking-widest text-gold mb-2 font-bold flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-gold"></span>
                          জ্ঞানের ফযিলত (Virtues of Knowledge Study)
                        </h3>
                        <ul className="space-y-2.5 pl-3 text-xs text-ivory/95">
                          <li className="flex items-start gap-1.5">
                            <span className="text-gold mt-1">✦</span>
                            <div>
                              <strong className="text-champagne block">ফেরেশতাদের ডানা মেলানো:</strong>
                              দ্বীনি জ্ঞান অন্বেষণকারীর সন্তুষ্টির জন্য আল্লাহর সম্মানিত ফেরেশতাগণ তাদের ডানা বিছিয়ে দেন।
                            </div>
                          </li>
                          <li className="flex items-start gap-1.5">
                            <span className="text-gold mt-1">✦</span>
                            <div>
                              <strong className="text-champagne block">সবার দোয়া লাভ:</strong>
                              জ্ঞানের অনুসন্ধানকারীর জন্য আসমান ও জমিনের সকল মাখলুক এমনকি পানির নিচের মাছ পর্যন্ত ক্ষমা প্রার্থনা করে।
                            </div>
                          </li>
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-5 max-h-[48vh] overflow-y-auto pr-1">
                      <div className="flex items-center gap-2 mb-2">
                        <button
                          type="button"
                          onClick={() => setSelectedLearningTopic(null)}
                          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gold text-[10px] uppercase tracking-widest font-bold rounded-lg transition-all flex items-center gap-1"
                        >
                          ← ফিরে যান (Back)
                        </button>
                        <span className="text-[10px] text-slate-gray">দ্বীনি শিক্ষা কক্ষ</span>
                      </div>

                      <div className="space-y-4">
                        <div className="border-b border-white/5 pb-3">
                          <h3 className="text-sm font-bold text-gold">{learningTopics[selectedLearningTopic].title}</h3>
                          <p className="text-[11px] text-slate-gray italic">{learningTopics[selectedLearningTopic].subtitle}</p>
                        </div>

                        {learningTopics[selectedLearningTopic].quote && (
                          <div className="bg-gold/5 border border-gold/15 p-4 rounded-xl text-[11px] text-ivory/90 italic leading-relaxed font-serif">
                            {learningTopics[selectedLearningTopic].quote}
                          </div>
                        )}

                        <div className="space-y-3.5 mt-3">
                          {learningTopics[selectedLearningTopic].details.map((detail, idx) => (
                            <div key={idx} className="p-4 bg-white/[0.01] border border-white/5 rounded-xl space-y-1">
                              <h4 className="text-xs font-bold text-champagne">{detail.section}</h4>
                              <p className="text-[11px] text-slate-gray leading-relaxed whitespace-pre-line">{detail.content}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <button 
                    onClick={() => {
                      if (viewMode === "me") toggleItem("extra", "learning");
                      setShowLearningModal(false);
                      setSelectedLearningTopic(null);
                    }}
                    className={cn(
                      "w-full py-4 rounded-[20px] text-xs uppercase tracking-widest font-bold shadow-2xl transition-all hover:scale-[1.02] active:scale-95 mt-4",
                      myData.learning 
                        ? "bg-white/10 text-ivory hover:bg-white/15" 
                        : "bg-purple-500 text-white shadow-purple-500/30"
                    )}
                  >
                    {myData.learning ? "Mark Learning as Undone (জ্ঞান অর্জন বাতিল করুন)" : "Mark Learning as Done (জ্ঞান অর্জন সম্পন্ন করেছি)"}
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
