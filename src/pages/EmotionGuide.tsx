import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { GlassCard } from "@/src/components/ui/GlassCard";
import { Search, Heart, Shield, Sparkles, Wind, CloudRain, Sun, Zap, Moon, BookOpen, Share2, CheckCircle2, Trash2 } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { db } from "@/src/lib/firebase";
import { useAuth, useCouple } from "@/src/App";
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, serverTimestamp } from "firebase/firestore";

export const emotions = [
  { id: 'happy', label: 'Happy', icon: Sun, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  { id: 'sad', label: 'Sad', icon: CloudRain, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  { id: 'angry', label: 'Angry', icon: Zap, color: 'text-red-400', bg: 'bg-red-400/10' },
  { id: 'lonely', label: 'Lonely', icon: Moon, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
  { id: 'anxious', label: 'Anxious', icon: Wind, color: 'text-teal-400', bg: 'bg-teal-400/10' },
  { id: 'grateful', label: 'Grateful', icon: Heart, color: 'text-pink-400', bg: 'bg-pink-400/10' },
  { id: 'scared', label: 'Scared', icon: Shield, color: 'text-orange-400', bg: 'bg-orange-400/10' },
  { id: 'hopeful', label: 'Hopeful', icon: Sparkles, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
];

interface GuidanceItem {
  ayah: string;
  ref: string;
  trans: string;
  tafsir: string;
  dua: {
    arabic: string;
    trans: string;
    bangla: string;
  };
}

const guidanceData: Record<string, GuidanceItem[]> = {
  happy: [
    {
      ayah: "لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ",
      ref: "Ibrahim 14:7",
      trans: "If you are grateful, I will surely increase you.",
      tafsir: "Gratitude is the key to abundance. When you feel joy, returning that thanks to Allah ensures the blessing multiplies.",
      dua: {
        arabic: "الْحَمْدُ لِلَّهِ الَّذِي بِنِعْمَتِهِ تَتِمُّ الصَّالِحَاتُ",
        trans: "All praise is for Allah, by whose favor good things are accomplished.",
        bangla: "আলহামদু লিল্লাহিল্লাজি বিনি’মাতিহি তাতিম্মুস সলিহাত"
      }
    },
    {
      ayah: "قُلْ بِفَضْلِ اللَّهِ وَبِرَحْمَتِهِ فَبِذَٰلِكَ فَلْيَفْرَحُوا",
      ref: "Yunus 10:58",
      trans: "Say, 'In the bounty of Allah and in His mercy - in that let them rejoice.'",
      tafsir: "True joy is not found in fleeting worldly possessions, but in experiencing the sublime grace, mercy, and guidance of our Creator.",
      dua: {
        arabic: "رَبِّ أَوْزِعْنِي أَنْ أَشْكُرَ نِعْمَتَكَ",
        trans: "My Lord, inspire me to be grateful for Your favor.",
        bangla: "রব্বি আওযি’নি আন আশকুরা নি’মাতাকা"
      }
    },
    {
      ayah: "فَاصْبِرْ صَبْرًا جَمِيلًا",
      ref: "Al-Ma'arij 70:5",
      trans: "So be patient with gracious patience.",
      tafsir: "Even in moments of deep happiness, maintaining beautiful, graceful composure and keeping your heart grounded keeps your joy pure.",
      dua: {
        arabic: "رَبَّنَا تَقَبَّلْ مِنَّا ۖ إِنَّكَ أَنتَ السَّمِيعُ الْعَلِيمُ",
        trans: "Our Lord, accept [this] from us. Indeed You are the Hearing, the Knowing.",
        bangla: "রব্বানা তাকাব্বল মিন্না, ইন্নাকা আনতাস সামিউল আলিম"
      }
    },
    {
      ayah: "وَأَحْسِن كَمَا أَحْسَنَ اللَّهُ إِلَيْكَ",
      ref: "Al-Qasas 28:77",
      trans: "And do good as Allah has done good to you.",
      tafsir: "When your heart is overflowing with cheer, share that joy with the world. Doing good to others is the highest expression of happiness.",
      dua: {
        arabic: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً",
        trans: "Our Lord, grant us good in this world and good in the Hereafter.",
        bangla: "রব্বানা আতিনা ফিদ দুনিয়া হাসানাতাও ওয়া ফিল আখিরাতি হাসানাতাহ"
      }
    },
    {
      ayah: "وَفِي ذَٰلِكَ فَلْيَتَنَافَسِ الْمُتَنَافِسُونَ",
      ref: "Al-Mutaffifin 83:26",
      trans: "So for this let the competitors compete.",
      tafsir: "The ultimate bliss is the spiritual victory of Jannah. Let our joyful moments inspire us to strive further for beautiful deeds.",
      dua: {
        arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ الْجَنَّةَ وَأَعُوذُ بِكَ مِنَ النَّارِ",
        trans: "O Allah, I ask You for Paradise and seek refuge in You from the Fire.",
        bangla: "আল্লাহুম্মা ইন্নি আসআলুকাল জান্নাতা ওয়া আউযুবিকা মিনান নার"
      }
    },
    {
      ayah: "رَّضِيَ اللَّهُ عَنْهُمْ وَرَضُوا عَنْهُ",
      ref: "Al-Ma'idah 5:119",
      trans: "Allah is pleased with them, and they are pleased with Him.",
      tafsir: "The most beautiful state of happiness is absolute contentment—pleased with the Divine Decree, and blessed with His perfect pleasure.",
      dua: {
        arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ رِضَاكَ وَالْجَنَّةَ",
        trans: "O Allah, I ask You for Your pleasure and Paradise.",
        bangla: "আল্লাহুম্মা ইন্নি আসআলুকা রিদাকা ওয়াল জান্নাহ"
      }
    },
    {
      ayah: "فَهُمْ فِي رَوْضَةٍ يُحْبَرُونَ",
      ref: "Ar-Rum 30:15",
      trans: "Then they will be in a garden, delighted.",
      tafsir: "Real joy is the light of faith reflecting on eternity. The supreme celebration is a garden of permanent peace and delight.",
      dua: {
        arabic: "اللَّهُمَّ اغْفِرْ لِي وَارْحَمْنِي وَأَدْخِلْنِي الْجَنَّةَ",
        trans: "O Allah, forgive me, have mercy on me, and admit me into Paradise.",
        bangla: "আল্লাহুম্মা ইগফির লী ওয়ারহামনী ওয়া আদখিলনাল জান্নাহ"
      }
    },
    {
      ayah: "وَلَقَّاهُمْ نَضْرَةً وَسُرُورًا",
      ref: "Al-Insan 76:11",
      trans: "And He gave them radiance and happiness.",
      tafsir: "Radiance on the face and delight in the soul are gifts of eternal success. Let your earthly happiness represent a shadow of this divine reward.",
      dua: {
        arabic: "اللَّهُمَّ حَبِّبْ إِلَيْنَا الْإِيمَانَ وَزَيِّنْهُ فِي قُلُوبِنَا",
        trans: "O Allah, make faith beloved to us and beautify it in our hearts.",
        bangla: "আল্লাহুম্মা হাব্বিব ইলাইনাল ইমানা ওয়া যাইয়িনহু ফী কুলূবিনা"
      }
    },
    {
      ayah: "وَيَنقَلِبُ إِلَىٰ أَهْلِهِ مَسْرُورًا",
      ref: "Al-Inshiqaq 84:9",
      trans: "And will return to his people in joy.",
      tafsir: "True happiness is shared. To return to those you love with a clean record and a joyous soul is the highest definition of success.",
      dua: {
        arabic: "رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ",
        trans: "Our Lord, grant us from among our wives and offspring comfort to our eyes.",
        bangla: "রব্বানা হাবলানা মিন আযওয়াজিনা ওয়া যুররিয়্যাতিনা কুররাতা আই’য়ুন"
      }
    },
    {
      ayah: "وَلَسَوْفَ يُعْطِيكَ رَبُّكَ فَتَرْضَىٰ",
      ref: "Ad-Duha 93:5",
      trans: "And your Lord is going to give you, and you will be satisfied.",
      tafsir: "This promise of complete satisfaction was given to ease a heavy heart. True happiness is when the soul rests in His endless generosity.",
      dua: {
        arabic: "اللَّهُمَّ رَضِّنِي بِقَضَائِكَ وَبَارِكْ لِي فِيمَا قُدِّرَ لِي",
        trans: "O Allah, make me content with Your decree and bless me in what is destined for me.",
        bangla: "আল্লাহুম্মা রাদ্দিনী বিকাদাইকা ওয়া বারিক লী ফীমা কুদ্দিরা লী"
      }
    }
  ],
  sad: [
    {
      ayah: "لَا تَحْزَنْ إِنَّ اللَّهَ مَعَنَا",
      ref: "At-Tawbah 9:40",
      trans: "Do not grieve; indeed Allah is with us.",
      tafsir: "Allah's presence is most felt when we feel most alone in our sorrow. This was spoken to Abu-Bakr (RA) in a moment of fear and sadness.",
      dua: {
        arabic: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ",
        trans: "O Allah, I seek refuge in You from anxiety and grief.",
        bangla: "আল্লাহুম্মা ইন্নি আউযুবিকা মিনাল হাম্মি ওয়াল হাযান"
      }
    },
    {
      ayah: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا",
      ref: "Ash-Sharh 94:5",
      trans: "For indeed, with hardship [will be] ease.",
      tafsir: "Sorrow is temporary. The 'Yusr' (ease) is not just after the hardship, but packaged with it by Divine Design.",
      dua: {
        arabic: "يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ",
        trans: "O Living, O Sustaining, in Your Mercy I seek relief.",
        bangla: "ইয়া হাইয়ু ইয়া কাইয়ুমু বিরাহমাতিকা আস্তাগীস"
      }
    },
    {
      ayah: "الَّذِينَ إِذَا أَصَابَتْهُم مُّصِيبَةٌ قَالُوا إِنَّا لِلَّهِ وَإِنَّا إِلَيْهِ رَاجِعُونَ",
      ref: "Al-Baqarah 2:156",
      trans: "Indeed we belong to Allah, and indeed to Him we will return.",
      tafsir: "Remembering that everything is fleeting and ultimately returns to the source of peace takes the weight off our shoulders.",
      dua: {
        arabic: "اللَّهُمَّ أْجُرْنِي فِي مُصِيبَتِي وَأَخْلِفْ لِي خَيْرًا مِنْهَا",
        trans: "O Allah, reward me in my affliction and grant me something better in its place.",
        bangla: "আল্লাহুম্মাজুরনি ফি মুসিবাতি ওয়া আখলিফলি খাইরাম মিনহা"
      }
    },
    {
      ayah: "وَلَمْ أَكُن بِدُعَائِكَ رَبِّ شَقِيًّا",
      ref: "Maryam 19:4",
      trans: "And never have I been, in my supplication to You, my Lord, unhappy.",
      tafsir: "Calling upon Him is a cure in itself. Sincere prayer is the bridge that carries us over the deepest valleys of sorrow.",
      dua: {
        arabic: "رَبِّ إِنِّي لِمَا أَنزَلْتَ إِلَيَّ مِنْ خَيْرٍ فَقِيرٌ",
        trans: "My Lord, indeed I am, for whatever good You would send down to me, in need.",
        bangla: "রব্বি ইন্নি লিমা আনযালতা ইলাইয়া মিন খাইরিন ফাকীর"
      }
    },
    {
      ayah: "وَلَنَبْلُوَنَّكُم بِشَيْءٍ مِّنَ الْخَوْفِ وَالْجُوعِ",
      ref: "Al-Baqarah 2:155",
      trans: "And We will surely test you with something of fear and hunger...",
      tafsir: "Grief and loss are part of the earthly journey. The ones who preserve their hope and patience are given unlimited tidings of peace.",
      dua: {
        arabic: "يَا فَارِجَ الْهَمِّ يَا كَاشِفَ الْغَمِّ فَرِّجْ هَمِّي",
        trans: "O Reliever of grief, O Dispeller of sorrow, relieve my burden.",
        bangla: "ইয়া ফারিজাল হাম্মি ইয়া কাশিফাল গম্মি ফাররিজ হাম্মি"
      }
    },
    {
      ayah: "إِنَّمَا أَشْكُو بَثِّي وَحُزْنِي إِلَى اللَّهِ",
      ref: "Yusuf 12:86",
      trans: "I only complain of my suffering and my grief to Allah.",
      tafsir: "Pour out your grief to Al-Khaliq, who understands every unspoken tear. Complaining to Him is the ultimate path to true strength.",
      dua: {
        arabic: "رَبِّ لَا تَكِلْنِي إِلَىٰ نَفْسِي طَرْفَةَ عَيْنٍ",
        trans: "My Lord, do not leave me to myself even for the blink of an eye.",
        bangla: "রব্বি লা তাকিলনী ইলা নাফসী তরফাতা আই’ন"
      }
    },
    {
      ayah: "وَلَا تَهِنُوا وَلَا تَحْزَنُوا وَأَنتُمُ الْأَعْلَوْنَ",
      ref: "Ali 'Imran 3:139",
      trans: "So do not weaken and do not grieve, and you will be superior.",
      tafsir: "Sorrow is human, but do not let it paralyze you. Your faith places you in a higher rank, guarded by divine mercy.",
      dua: {
        arabic: "اللَّهُمَّ قَوِّي قَلْبِي وَصَبِّرْنِي عَلَى مَا كَتَبْتَ لِي",
        trans: "O Allah, strengthen my heart and grant me patience over what You have written for me.",
        bangla: "আল্লাহুম্মা কউয়ী কলবী ওয়া সাব্বিরনী আলা মা কাতাবতা লী"
      }
    },
    {
      ayah: "الْحَمْدُ لِلَّهِ الَّذِي أَذْهَبَ عَنَّا الْحَزَنَ",
      ref: "Fatir 35:34",
      trans: "Praise to Allah, who has removed from us [all] sorrow.",
      tafsir: "The sweet reward of Jannah is the eternal removal of all worries and regrets. Let this hope carry you through current tribulations.",
      dua: {
        arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ نَفْسًا بِكَ مُطْمَئِنَّةً",
        trans: "O Allah, I ask You for a soul that finds rest in You.",
        bangla: "আল্লাহুম্মা ইন্নি আসআলুকা নাফসান বিকা মুতমাইন্নাহ"
      }
    },
    {
      ayah: "فَلَا خَوْفٌ عَلَيْهِمْ وَلَا هُمْ يَحْزَنُونَ",
      ref: "Al-Ahqaf 46:13",
      trans: "There will be no fear concerning them, nor will they grieve.",
      tafsir: "Remaining steadfast on the path of truth brings you under the safety canopy of Allah, shielding you from both fears and griefs.",
      dua: {
        arabic: "اللَّهُمَّ ثَبِّتْ قَدَمَيَّ وَارْزُقْنِي الصَّبْرَ",
        trans: "O Allah, make my feet firm and grant me patience.",
        bangla: "আল্লাহুম্মা সাব্বিত কদমাইয়্যা ওয়ারযুকনীস সবর"
      }
    },
    {
      ayah: "أَلَمْ يَعْلَمُوا أَنَّ اللَّهَ هُوَ يَقْبَلُ التَّوْبَةَ عَنْ عِبَادِهِ",
      ref: "At-Tawbah 9:104",
      trans: "Do they not know that it is Allah who accepts repentance from His servants?",
      tafsir: "Sorrow that stems from mistakes or regrets is healed instantly by repentance. He is the most Loving, most Forgiving.",
      dua: {
        arabic: "رَبِّ اغْفِرْ وَارْحَمْ وَأَنتَ خَيْرُ الرَّاحِمِينَ",
        trans: "My Lord, forgive and have mercy, and You are the best of those who show mercy.",
        bangla: "রব্বিগফির ওয়ারহাম ওয়া আনতা খাইরুর রাহিমীন"
      }
    }
  ],
  anxious: [
    {
      ayah: "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ",
      ref: "Ar-Ra'd 13:28",
      trans: "Unquestionably, by the remembrance of Allah hearts find rest.",
      tafsir: "Anxiety is often a heart seeking its anchor. Dhikr is the anchor that settles the storms of the mind.",
      dua: {
        arabic: "اللَّهُمَّ رَحْمَتَكَ أَرْجُو فَلَا تَكِلْنِي إِلَى نَفْسِي طَرْفَةَ عَيْنٍ",
        trans: "O Allah, I hope for Your mercy. Do not leave me to myself even for the blink of an eye.",
        bangla: "আল্লাহুম্মা রহমাতাকা আরজু ফালা তাকিলনি ইলা নাফসি তরফাতা আই’ন"
      }
    },
    {
      ayah: "وَتَوَكَّلْ عَلَى اللَّهِ وَكَفَىٰ بِاللَّهِ وَكِيلًا",
      ref: "Al-Ahzab 33:3",
      trans: "And rely upon Allah ; and sufficient is Allah as Disposer of affairs.",
      tafsir: "Anxiety comes from trying to control what is already managed by Al-Wakeel. Let go and let God.",
      dua: {
        arabic: "حَسْبِيَ اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ ۖ عَلَيْهِ تَوَكَّلْتُ",
        trans: "Sufficient for me is Allah; there is no deity except Him. On Him I have relied.",
        bangla: "হাসবিআল্লাহু লা ইলাহা ইল্লা হুয়া, আলাইহি তাওয়াক্কালতু"
      }
    },
    {
      ayah: "وَإِذَا سَأَلَكَ عِبَادِي عَنِّي فَإِنِّي قَرِيبٌ",
      ref: "Al-Baqarah 2:186",
      trans: "And when My servants ask you concerning Me - indeed I am near.",
      tafsir: "When fear and anxiety block your breath, sink into the beautiful reality that Allah is closer to you than any passing thought.",
      dua: {
        arabic: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْعَجْزِ وَالْكَسَلِ وَالْجُبْنِ",
        trans: "O Allah, I seek refuge in You from helplessness, laziness, and cowardice.",
        bangla: "আল্লাহুম্মা ইন্নি আউযুবিকা মিনাল আজযি ওয়াল কাসালি ওয়াল জুবনি"
      }
    },
    {
      ayah: "رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي",
      ref: "Taha 20:25-26",
      trans: "My Lord, expand for me my breast and ease for me my task.",
      tafsir: "Musa (AS)'s prayer when facing Pharaoh. Heart expansion dissolves physical and mental tightness and brings sublime calm.",
      dua: {
        arabic: "لَّا إِلَٰهَ إِلَّا أَنتَ سُبْحَانَكَ إِنِّي كُنتُ مِنَ الظَّالِمِينَ",
        trans: "There is no deity except You; exalted are You. Indeed, I have been of the wrongdoers.",
        bangla: "লা ইলাহা ইল্লা আনতা সুবহানাকা ইন্নি কুনতু মিনাজ জোয়ালেমিন"
      }
    },
    {
      ayah: "إِنَّ رَبِّي لَطِيفٌ لِّمَا يَشَاءُ ۚ إِنَّهُ هُوَ الْعَلِيمُ الْحَكِيمُ",
      ref: "Yusuf 12:100",
      trans: "Indeed, my Lord is Subtle in what He wills. Indeed, He is the Knowing, the Wise.",
      tafsir: "Allah is Al-Lateef (The Subtle). He works behind the scenes of your life in gentle, invisible, and deeply protective ways.",
      dua: {
        arabic: "اللَّهُمَّ اجْعَلْ فِي قَلْبِي نُورًا",
        trans: "O Allah, place light within my heart and light in my sight.",
        bangla: "আল্লাহুম্মাজ’আল ফী কলবী নূরান ওয়া ফী বাসরী নূরান"
      }
    },
    {
      ayah: "وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ",
      ref: "At-Talaq 65:3",
      trans: "And whoever relies upon Allah - then He is sufficient for him.",
      tafsir: "The moment you surrender the outcome to Him, your anxiety loses its power. He is enough to navigate you through all stormy waters.",
      dua: {
        arabic: "حَسْبِيَ اللَّهُ وَنِعْمَ الْوَكِيلُ",
        trans: "Sufficient is Allah for me, the most beautiful Trustee.",
        bangla: "হাসবিআল্লাহু ওয়া নি’মাল ওয়াকীল"
      }
    },
    {
      ayah: "لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا",
      ref: "Al-Baqarah 2:286",
      trans: "Allah does not charge a soul except [with that within] its capacity.",
      tafsir: "You were made for this weight. God knows your limits perfectly; He chooses this challenge because He has equipped you to overcome it.",
      dua: {
        arabic: "رَبَّنَا لَا تُحَمِّلْنَا مَا لَا طَاقَةَ لَنَا بِهِ",
        trans: "Our Lord, do not impose upon us that which we have no strength to bear.",
        bangla: "রব্বানা লা তুহাম্মিলনা মা লা তকাতা লানা বিহ"
      }
    },
    {
      ayah: "هُوَ الَّذِي أَنزَلَ السَّكِينَةَ فِي قُلُوبِ الْمُؤْمِنِينَ",
      ref: "Al-Fath 48:4",
      trans: "He is the One who sent down tranquility into the hearts of the believers.",
      tafsir: "Sakeenah (Divine Tranquility) is a special force that calms a fluttering heart, bringing rest where fear once resided.",
      dua: {
        arabic: "اللَّهُمَّ أَنْزِلْ سَكِينَتَكَ عَلَى قَلْبِي",
        trans: "O Allah, descend Your tranquility upon my heart.",
        bangla: "আল্লাহুম্মা আনযিল সাকিনাতাকা আলা কলবী"
      }
    },
    {
      ayah: "وَلَقَدْ نَعْلَمُ أَنَّكَ يَضِيقُ صَدْرُكَ بِمَا يَقُولُونَ",
      ref: "Al-Hijr 15:97",
      trans: "And We already know that your breast is constrained by what they say.",
      tafsir: "He sees your chest tightening under pressure. This validation from your Lord is an invitation to prostration, praise, and peaceful breath.",
      dua: {
        arabic: "فَسَبِّحْ بِحَمْدِ رَبِّكَ وَكُن مِّنَ السَّاجِدِينَ",
        trans: "So exalt [Allah] with praise of your Lord and be of those who prostrate.",
        bangla: "ফাসাব্বিহ বিহামদি রব্বিকা ওয়া কুন মিনাস সাজিদীন"
      }
    },
    {
      ayah: "قَدْ جَاءَتْكُم مَّوْعِظَةٌ مَّن رَّبِّكُمْ وَشِفَاءٌ لِّمَا فِي الصُّدُورِ",
      ref: "Yunus 10:57",
      trans: "There has come to you instruction from your Lord and healing for what is in the breasts.",
      tafsir: "The Quran is not just guidance, but a clinical cure for psychological tightness and anxious breaths. Let its sound wash over you.",
      dua: {
        arabic: "اللَّهُمَّ اجْعَلِ الْقُرْآنَ رَبِيعَ قَلْبِي",
        trans: "O Allah, make the Quran the spring of my heart.",
        bangla: "আল্লাহুম্মাজ’আলিল কুরআনা রাবীয়া কলবী"
      }
    }
  ],
  angry: [
    {
      ayah: "الَّذِينَ يُنفِقُونَ فِي السَّرَّاءِ وَالضَّرَّاءِ وَالْكَاظِمِينَ الْغَيْظَ",
      ref: "Ali 'Imran 3:134",
      trans: "Who restrain anger and who pardon the people - and Allah loves the doers of good.",
      tafsir: "Anger is fire. Control is water. Restraining your reaction during heat is a sign of high character loved by the Creator.",
      dua: {
        arabic: "أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ",
        trans: "I seek refuge in Allah from the accursed Shaitan.",
        bangla: "আউযুবিল্লাহি মিনাশ শাইতানির রাজীম"
      }
    },
    {
      ayah: "خُذِ الْعَفْوَ وَأْمُرْ بِالْعُرْفِ وَأَعْرِضْ عَنِ الْجَاهِلِينَ",
      ref: "Al-A'raf 7:199",
      trans: "Take what is given freely, enjoin what is good, and turn away from the ignorant.",
      tafsir: "Pardon others not because they deserve it, but because your soul deserves peace.",
      dua: {
        arabic: "اللَّهُمَّ اغْفِرْ لِي ذَنْبِي وَأَذْهِبْ غَيْظَ قَلْبِي",
        trans: "O Allah, forgive my sin and remove the anger of my heart.",
        bangla: "আল্লাহুম্মা ইগফির লি যামবি ওয়া আযহিব গইযা কলবি"
      }
    },
    {
      ayah: "وَإِذَا مَا غَضِبُوا هُمْ يَغْفِرُونَ",
      ref: "Ash-Shura 42:37",
      trans: "And when they are angry, they forgive.",
      tafsir: "Forgiveness during moments of high rage is a supreme display of inner spiritual strength that unlocks great rewards.",
      dua: {
        arabic: "رَبَّنَا لَا تَجْعَلْ فِي قُلُوبِنَا غِلًّا لِّلَّذِينَ آمَنُوا",
        trans: "Our Lord, put not in our hearts any resentment toward those who have believed.",
        bangla: "রব্বানা লা তাজ’আল ফী কুলূবিনা গিল্লান লিল্লাযীনা আমানূ"
      }
    },
    {
      ayah: "أَلَا لَهُ الْخَلْقُ وَالْأَمْرُ ۗ تَبَارَكَ اللَّهُ رَبُّ الْعَالَمِينَ",
      ref: "Al-A'raf 7:54",
      trans: "Unquestionably, His is the creation and the command; blessed is Allah.",
      tafsir: "Remembering that ultimate control belongs exclusively to the Lord of the worlds lowers our pride and melts anger instantly.",
      dua: {
        arabic: "اللَّهُمَّ عَالِمَ الْغَيْبِ وَالشَّهَادَةِ رَبَّ كُلِّ شَيْءٍ",
        trans: "O Allah, Knower of the unseen, Lord of all things.",
        bangla: "আল্লাহুম্মা আলিমাল গইবি ওয়াশ শাহাদা রব্বা কুল্লি শাই'"
      }
    },
    {
      ayah: "وَلَا تَسْتَوِي الْحَسَنَةُ وَلَا السَّيِّئَةُ ۚ ادْفَعْ بِالَّتِي هِيَ أَحْسَنُ",
      ref: "Fussilat 41:34",
      trans: "Repel evil by that deed which is better.",
      tafsir: "Responding to bitterness with gentleness and dignity turns adversaries into warmest brothers.",
      dua: {
        arabic: "اللهُمَّ اهْدِنِي لِأَحْسَنِ الْأَخْلَاقِ لَا يَهْدِي لِأَحْسَنِهَا إِلَّا أَنْتَ",
        trans: "O Allah, guide me to the best of manners, for none guides to them except You.",
        bangla: "আল্লাহুম্মাহদিনী লিআহসানিল আখলাকি লা ইয়াহদী লিআহসানিহা ইল্লা আনতা"
      }
    },
    {
      ayah: "وَلَمَن صَبَرَ وَغَفَرَ إِنَّ ذَٰلِكَ لَمِنْ عَزْمِ الْأُمُورِ",
      ref: "Ash-Shura 42:43",
      trans: "And whoever is patient and forgives - indeed, that is of the matters requiring determination.",
      tafsir: "Patience and forgiveness in moments of friction are acts of ironclad determination. They protect your heart from accumulating poisons of grudge.",
      dua: {
        arabic: "اللَّهُمَّ لَا تَجْعَلْ فِي قُلُوبِنَا حِقْدًا لِأَحَدٍ",
        trans: "O Allah, place not in our hearts any malice or grudge towards anyone.",
        bangla: "আল্লাহুম্মা লা তাজ’আল ফী কুলূবিনা হিকদান লি’আহাদিন"
      }
    },
    {
      ayah: "وَإِذَا خَاطَبَهُمُ الْجَاهِلُونَ قَالُوا سَلَامًا",
      ref: "Al-Furqan 25:63",
      trans: "And when the ignorant address them [harshly], they say [words of] peace.",
      tafsir: "Do not descend into matches of screams. Establish your territory of calm by uttering peace, keeping your dignity fully intact.",
      dua: {
        arabic: "رَبَّنَا أَفْرِغْ عَلَيْنَا صَبْرًا وَثَبِّتْ أَقْدَامَنَا",
        trans: "Our Lord, pour upon us patience and make our feet firm.",
        bangla: "রব্বানা আফরিগ আলাইনা সবরান ওয়া সাব্বিত কদমানা"
      }
    },
    {
      ayah: "فَمَنْ عَفَا وَأَصْلَحَ فَأَجْرُهُ عَلَى اللَّهِ",
      ref: "Ash-Shura 42:40",
      trans: "But whoever pardons and makes reconciliation - his reward is [due] from Allah.",
      tafsir: "Letting go of small offenses leaves room for the highest recompense. Your Lord will compensate you better than any human apology could.",
      dua: {
        arabic: "اللَّهُمَّ إِنَّكَ عَفُوٌّ كَرِيمٌ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي",
        trans: "O Allah, indeed You are Forgiving and Generous; You love forgiveness, so forgive me.",
        bangla: "আল্লাহুম্মা ইন্নাকা আফুউউন কারীমু তুহিব্বুল আফওয়া ফাফু আন্নী"
      }
    },
    {
      ayah: "يَا أَيُّهَا الَّذِينَ آمَنُوا اجْتَنِبُوا كَثِيرًا مِّنَ الظَّنِّ",
      ref: "Al-Hujurat 49:12",
      trans: "O you who have believed, avoid much [negative] assumption.",
      tafsir: "Many instances of anger originate from unconfirmed assumptions. Give others the benefit of doubt for your own sanity.",
      dua: {
        arabic: "اللَّهُمَّ اهْدِنِي لِأَرْشَدِ أَمْرِي",
        trans: "O Allah, guide me to the most correct course in my affairs.",
        bangla: "আল্লাহুম্মাহদিনী লি’আরশadi আমরী"
      }
    },
    {
      ayah: "وَلَوْ كُنتَ فَظًّا غَلِيظَ الْقَلْبِ لَانفَضُّوا مِنْ حَوْلِكَ",
      ref: "Ali 'Imran 3:159",
      trans: "And if you had been rude [in speech] and harsh in heart, they would have disbanded from about you.",
      tafsir: "Gentleness holds relationships together. Harshness and anger only break connections. Embrace lenient speech to cultivate love.",
      dua: {
        arabic: "اللَّهُمَّ أَلِّفْ بَيْنَ قُلُوبِنَا وَأَصْلِحْ ذَاتَ بَيْنِنَا",
        trans: "O Allah, reconcile our hearts and correct our relationships.",
        bangla: "আল্লাহুম্মা আল্লিফ বাইনা কুলূবিনা ওয়া আসলিহ যাতা বাইনিনা"
      }
    }
  ],
  lonely: [
    {
      ayah: "وَهُوَ مَعَكُمْ أَيْنَ مَا كُنتُمْ",
      ref: "Al-Hadid 57:4",
      trans: "And He is with you wherever you are.",
      tafsir: "Human company is finite, but the Divine Presence is constant. When you feel lonely, realize that the One who created your soul is closer than your jugular vein.",
      dua: {
        arabic: "يَا أُنْسَ كُلِّ مُسْتَوْحِشٍ",
        trans: "O Companion of the one who is lonely.",
        bangla: "ইয়া উনসা কুল্লি মুসতাউহিশ"
      }
    },
    {
      ayah: "وَنَحْنُ أَقْرَبُ إِلَيْهِ مِنْ حَبْلِ الْوَرِيدِ",
      ref: "Qaf 50:16",
      trans: "And We are closer to him than [his] jugular vein.",
      tafsir: "Loneliness is an invitation to profound intimacy with Allah. He is not distant—He is right inside your heart.",
      dua: {
        arabic: "اللَّهُمَّ اغْفِرْ لِي وَارْحَمْنِي وَأَلْحِقْنِي بِالرَّفِيقِ الأَعْلَى",
        trans: "O Allah, forgive me, have mercy on me and join me with the Highest Companion.",
        bangla: "আল্লাহুম্মা ইগফিরলি ওয়ারহামনি ওয়া আলহিকনি বির রফিকিল আলা"
      }
    },
    {
      ayah: "مَا وَدَّعَكَ رَبُّكَ وَمَا قَلَىٰ",
      ref: "Ad-Duha 93:3",
      trans: "Your Lord has not taken leave of you, nor has He detested [you].",
      tafsir: "This verse was revealed when public revelation paused and the Prophet felt deeply isolated and abandoned. He has not forgotten you.",
      dua: {
        arabic: "اللَّهُمَّ احْفَظْنِي بِحِفْظِكَ وَأَعِزَّنِي بِطَاعَتِكَ",
        trans: "O Allah, guard me with Your protection and honor me with Your obedience.",
        bangla: "আল্লাহুম্মাহফযনী বিহিফযিকা ওয়া আইযযনী বিত’আতিকা"
      }
    },
    {
      ayah: "فَإِنِّي قَرِيبٌ ۖ أُجِيبُ دَعْوَةَ الدَّاعِ",
      ref: "Al-Baqarah 2:186",
      trans: "Indeed, I am near. I respond to the invocation of the caller.",
      tafsir: "He listens and observes each tear. Speak to Him directly with the humility of a child; He is listening.",
      dua: {
        arabic: "اللَّهُمَّ اجْعَلْ لِي مِنْ كُلِّ هَمٍّ فَرَجًا",
        trans: "O Allah, grant me relief from every anxiety.",
        bangla: "আল্লাহুম্মাজ’আল লী মিন কুল্লি হাম্মিন ফারাজান"
      }
    },
    {
      ayah: "فَنَادَىٰ فِي الظُّلُمَاتِ أَن لَّا إِلَٰهَ إِلَّا أَنتَ",
      ref: "Al-Anbiya 21:87",
      trans: "Then he called out within the darknesses, 'There is no deity except You.'",
      tafsir: "Yunus (AS)'s prayer from the absolute darkness and solitude of the sea. His cry of pure monotheism vanished all loneliness.",
      dua: {
        arabic: "الْحَمْدُ لله كَثِيرًا وَسُبْحَانَ الله بُكْرَةً وَأَصِيلًا",
        trans: "Praise be to Allah in abundance, and glory be to Him morning and evening.",
        bangla: "আলহামদু লিল্লাহি কাসীরান ওয়া সুবহানাল্লাহি বুকরাতান ওয়া আসীলা"
      }
    },
    {
      ayah: "ادْعُونِي أَسْتَجِبْ لَكُمْ",
      ref: "Ghafir 40:60",
      trans: "Call upon Me; I will respond to you.",
      tafsir: "When humans don't respond or close their doors, His divine entrance is wide open, welcoming your whispers 24/7.",
      dua: {
        arabic: "رَبَّنَا تَقَبَّلْ دُعَائِي",
        trans: "My Lord, accept my prayer.",
        bangla: "রব্বানা তাকাব্বল দু’আ-ঈ"
      }
    },
    {
      ayah: "رَبِّ لَا تَذَرْنِي فَرْدًا وَأَنتَ خَيْرُ الْوَارِثِينَ",
      ref: "Al-Anbiya 21:89",
      trans: "My Lord, do not leave me alone.",
      tafsir: "Zakariyyah (AS)'s prayer of feeling old and without support. Trust Him to populate your solitude with beautiful companions and answers.",
      dua: {
        arabic: "يَا جَامِعَ النَّاسِ لِيَوْمٍ لَا رَيْبَ فِيهِ اجْمَعْ بَيْنِي وَبَيْنَ صَالِحِ الْأَنِيسِ",
        trans: "O Gatherer of people, gather me with righteous companionship.",
        bangla: "ইয়া জামি’আশ শাতাত ইজমায় শামলানা"
      }
    },
    {
      ayah: "بَلِ اللَّهُ مَوْلَاكُمْ ۖ وَهُوَ خَيْرُ النَّاصِرِينَ",
      ref: "Ali 'Imran 3:150",
      trans: "But Allah is your protector, and He is the best of helpers.",
      tafsir: "Having the Creator of the universe as your 'Mawla' (Protector/Friend) is infinitely better than relying on fickle human crowds.",
      dua: {
        arabic: "اللَّهُمَّ كُنْ لِي نَصِيرًا وَمُعِينًا",
        trans: "O Allah, be a helper and a supporter for me.",
        bangla: "আল্লাহুম্মা কুন লী নাসীরান ওয়া মুঈনান"
      }
    },
    {
      ayah: "اللَّهُ وَلِيُّ الَّذِينَ آمَنُوا يُخْرِجُهُم مِّنَ الظُّلُمَاتِ إِلَى النُّورِ",
      ref: "Al-Baqarah 2:257",
      trans: "Allah is the ally of those who believe. He brings them out from darknesses into the light.",
      tafsir: "Allah takes direct responsibility for pulling believers out of dark isolate situations into the warmth of His special light.",
      dua: {
        arabic: "رَبِّ أَخْرِجْنِي مِنَ الظُّلُمَاتِ إِلَى النُّورِ",
        trans: "My Lord, extract me from darkness into light.",
        bangla: "রব্বি আখরিজনী মিনায যুলুমাতি ইলান নূর"
      }
    },
    {
      ayah: "وَإِن يَمْسَسْكَ اللَّهُ بِضُرٍّ فَلَا كَاشِفَ لَهُ إِلَّا هُوَ",
      ref: "Al-An'am 6:17",
      trans: "And if Allah should touch you with adversity, there is no remover of it except Him.",
      tafsir: "Only He can peel away the layers of loneliness. Turn your heart's dial entirely to Him, and watch the isolation resolve.",
      dua: {
        arabic: "اللَّهُمَّ كَاشِفَ الْغَمِّ فَرِّجْ هَمِّي",
        trans: "O Allah, Remover of distress, relieve my sadness.",
        bangla: "আল্লাহুম্মা কাশিফাল গম্মি ফাররিজ হাম্মি"
      }
    }
  ],
  grateful: [
    {
      ayah: "فَبِأَيِّ آلَاءِ رَبِّكُمَا تُكَذِّبَانِ",
      ref: "Ar-Rahman 55:13",
      trans: "So which of the favors of your Lord would you deny?",
      tafsir: "Gratefulness is the soul's awareness of its gifts. Every breath is a mercy; acknowledging it brings content.",
      dua: {
        arabic: "رَبِّ أَوْزِعْنِي أَنْ أَشْكُرَ نِعْمَتَكَ",
        trans: "My Lord, enable me to be grateful for Your favor which You have bestowed upon me.",
        bangla: "রব্বি আওযি’নি আন আশকুরা নি’মাতাকা"
      }
    },
    {
      ayah: "وَمَن يَشْكُرْ فَإِنَّمَا يَشْكُرُ لِنَفْسِهِ",
      ref: "Luqman 31:12",
      trans: "And whoever is grateful is grateful for [the benefit of] himself.",
      tafsir: "When we thank Allah, He doesn't gain anything—we do. It's the ultimate therapy for the soul.",
      dua: {
        arabic: "اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُসْنِ عِبَادَتِكَ",
        trans: "O Allah, help me to remember You, give thanks to You, and worship You well.",
        bangla: "আল্লাহুম্মা আইন্নি আলা যিকরিকা ওয়া শুকরিকা ওয়া হুসনি ইবাদাতিকা"
      }
    },
    {
      ayah: "اعْمَلُوا آلَ دَاوُودَ شُكْرًا ۚ وَقَلِيلٌ مِّنْ عِبَادِيَ الشَّكُورُ",
      ref: "Saba 34:13",
      trans: "Work, O family of David, in gratitude. And few of My servants are grateful.",
      tafsir: "Gratitude is an active lifestyle, not just passive words. Embody beauty and integrity to honor Allah's gifts.",
      dua: {
        arabic: "اللَّهُمَّ لَكَ الْحَمْدُ شُكْرًا وَلَكَ الْمَنُّ فَضْلًا",
        trans: "O Allah, all praise is Yours out of gratitude, all bounty is Yours out of grace.",
        bangla: "আল্লাহুম্মা লাকাল হামদু শুকরান ওয়া লাকাল মান্নু ফাদলান"
      }
    },
    {
      ayah: "وَسَيَجْزِي اللَّهُ الشَّاكِرِينَ",
      ref: "Ali 'Imran 3:144",
      trans: "And Allah will reward the grateful.",
      tafsir: "Those who appreciate the simple graces of life are given an special honor in both worlds. Gratitude attracts peace.",
      dua: {
        arabic: "رَبَّنَا اغْفِرْ لَنَا وَلِإِخْوَانِنَا الَّذِينَ سَبَقُونَا بِالْإِيمَانِ",
        trans: "Our Lord, forgive us and our brothers who preceded us in faith.",
        bangla: "রব্বানাগফির লানা ওয়ালি ইখওয়ানিনাল্লাযীনা সাবাকূনা বিল ঈমান"
      }
    },
    {
      ayah: "وَأَمَّا بِنِعْمَةِ رَبِّكَ فَحَدِّثْ",
      ref: "Ad-Duha 93:11",
      trans: "And as for the favor of your Lord, report [it].",
      tafsir: "Speak of blessings with humility, acknowledging His hands. Sharing gratitude multiplies optimism and strengthens community.",
      dua: {
        arabic: "اللَّهُمَّ اجْعَلْنِي شَكُورًا وَاجْعَلْنِي صَبُورًا",
        trans: "O Allah, make me highly grateful and make me highly patient.",
        bangla: "আল্লাহুম্মাজ’আলনী শাকূরান ওয়াজ’আলনী সাবূরান"
      }
    },
    {
      ayah: "وَإِن تَعُدُّوا نِعْمَةَ اللَّهِ لَا تُحْصُوهَا",
      ref: "Al-Nahl 16:18",
      trans: "And if you should count the favors of Allah, you could not enumerate them.",
      tafsir: "We are surrounded by trillions of favors. Even in heavy testing seasons, His divine blessings are overwhelming us silently.",
      dua: {
        arabic: "اللَّهُمَّ لَكَ الْحَمْدُ حَمْدًا كَثِيرًا طَيِّبًا مُبَارَكًا فِيهِ",
        trans: "O Allah, all praise is Yours, abundant, pure, and blessed praise.",
        bangla: "আল্লাহুম্মা লাকাল হামদু হামদান কাসীরান তই্যিবান মুবারাকান ফীহ"
      }
    },
    {
      ayah: "فَاذْكُرُونِي أَذْكُرْكُمْ وَاشْكُرُوا لِي",
      ref: "Al-Baqarah 2:152",
      trans: "So remember Me; I will remember you. And be grateful to Me.",
      tafsir: "What a massive status! When you remember and thank your Creator, the King of kings takes your name in His divine assembly.",
      dua: {
        arabic: "يَا رَبِّ لَكَ الْحَمْدُ كَمَا يَنْبَغِي لِجَلَالِ وَجْهِكَ",
        trans: "O my Lord, all praise is due to You as matches the majesty of Your face.",
        bangla: "ইয়াল্লা-হু লাকাল হামদু কামা ইয়ামবাগি লিজালা-লি ওয়াজহিকা"
      }
    },
    {
      ayah: "رَبِّ أَوْزِعْنِي أَنْ أَشْكُرَ نِعْمَتَكَ الَّتِي أَنْعَمْتَ عَلَيَّ",
      ref: "Al-Naml 27:19",
      trans: "My Lord, enable me to be grateful for Your favor which You have bestowed upon me.",
      tafsir: "Solomon (AS) prayed this when he achieved absolute worldly kingdom. Sincere high achievers turn their power into humility and gratitude.",
      dua: {
        arabic: "اللَّهُمَّ اجْعَلْنِي عَبْدًا شَكُورًا",
        trans: "O Allah, make me an intensely grateful servant.",
        bangla: "আল্লাহুম্মাজ’আলনী আবদান শাকূরান"
      }
    },
    {
      ayah: "وَإِن تَشْكُرُوا يَرْضَهُ لَكُمْ",
      ref: "Az-Zumar 39:7",
      trans: "And if you are grateful, He is pleased with it for you.",
      tafsir: "Gratitude is the direct shortcut to securing Divine Pleasure. It aligns your frequency with the peace of the heavens.",
      dua: {
        arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ مُوجِبَاتِ رَحْمَتِكَ",
        trans: "O Allah, I ask You for that which gathers Your mercy and forgiveness.",
        bangla: "আল্লাহুম্মা ইন্নি আসআলুকা মূজিবাতি রহমাতিক"
      }
    },
    {
      ayah: "وَجَعَلَ لَكُمُ السَّمْعَ وَالْأَبْصَارَ وَالْأَفْئِدَةَ ۙ لَعَلَّكُمْ تَشْكُرُونَ",
      ref: "Al-Nahl 16:78",
      trans: "And He made for you hearing and vision and intellect that perhaps you would be grateful.",
      tafsir: "These biological sensory gateways are highly advanced gifts. Appreciating your vision, ears, and cognitive sanity builds immediate peace.",
      dua: {
        arabic: "اللَّهُمَّ مَتِّعْنِي بِسَمْعِي وَبَصَرِي",
        trans: "O Allah, cause me to enjoy my hearing and my sight.",
        bangla: "আল্লাহুম্মা মাত্তি’নী বি-সাম’ঈ ওয়া বাসরী"
      }
    }
  ],
  scared: [
    {
      ayah: "حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ",
      ref: "Ali 'Imran 3:173",
      trans: "Sufficient for us is Allah, and [He is] the best Disposer of affairs.",
      tafsir: "Fear is the absence of security. Turning your dependency to Al-Wakeel (The Trustee) transforms fear into Tawakkul.",
      dua: {
        arabic: "اللَّهُمَّ اسْتُرْ عَوْرَاتِنَا وَآمِنْ رَوْعَاتِنَا",
        trans: "O Allah, cover our faults and calm our fears.",
        bangla: "আল্লাহুম্মা উসতুর আওরাতিনা ওয়া আমিন রওআতিনা"
      }
    },
    {
      ayah: "لَا تَخَافُ دَرَكًا وَلَا تَخْشَىٰ",
      ref: "Taha 20:77",
      trans: "Not fearing being overtaken [by Pharaoh] and not fearing [drowning].",
      tafsir: "The forward direction of your life is protected by Him. Stop fearing the future consequences; walk in faith and the difficulty will divide.",
      dua: {
        arabic: "رَبَّنَا نَجِّنِي مِنَ الْخَوْفِ",
        trans: "My Lord, deliver me from the fear of creation.",
        bangla: "রব্বানা নাজ্জীনী মিনাল খওফ"
      }
    },
    {
      ayah: "الَّذِينَ يُبَلِّغُونَ رِسَالَاتِ اللَّهِ وَيَخْشَوْنَهُ وَلَا يَخْشَوْنَ أَحَدًا إِلَّا اللَّهَ",
      ref: "Al-Ahzab 33:39",
      trans: "Those who convey the messages of Allah and fear Him and do not fear anyone but Allah.",
      tafsir: "When the heart is filled with correct reverence for the Creator of everything, all petty earthly fears are reduced to absolute zero.",
      dua: {
        arabic: "اللهُمَّ اكْفِنِي بِحَلَالِكَ عَنْ حَرَامِكَ",
        trans: "O Allah, suffice me with Your lawful instead of Your prohibited.",
        bangla: "আল্লাহুম্মাকফিনী বিহালালিকা আন হারামিক"
      }
    }
  ],
  hopeful: [
    {
      ayah: "وَلَا تَيْأَسُوا مِن رَّوْحِ اللَّهِ",
      ref: "Yusuf 12:87",
      trans: "And never give up hope of Allah's soothing Mercy.",
      tafsir: "Hope is the oxygen of faith. Despair has no place in the heart of one who knows the Vastness of Allah's Rahmah.",
      dua: {
        arabic: "اللَّهُمَّ اجْعَلْ خَيْرَ عُمْرِي آخِرَهُ",
        trans: "O Allah, make the best of my life its end.",
        bangla: "আল্লাহুম্মা ইজ’আল খয়রা উমরি আখিরাহু"
      }
    },
    {
      ayah: "لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ",
      ref: "Az-Zumar 39:53",
      trans: "Do not despair of the mercy of Allah.",
      tafsir: "Hope is always available, no matter how many mistakes were made. His doorway of mercy is ever open and boundless.",
      dua: {
        arabic: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً",
        trans: "Our Lord, give us in this world [that which is] good and in the Hereafter [that which is] good.",
        bangla: "রব্বানা আতিনা ফিদ দুনিয়া হাসানাতাও ওয়া ফিল আখিরাতি হাসানাতাহ"
      }
    },
    {
      ayah: "إِنَّ مَعَ الْعُسْرِ يُسْرًا",
      ref: "Ash-Sharh 94:6",
      trans: "Indeed, with hardship [will be] ease.",
      tafsir: "No dark season is permanent. The divine order warrants that after every darkness, a glorious dawn must rise.",
      dua: {
        arabic: "اللَّهُمَّ لا سَهْلَ إِلاَّ ما جَعَلْتَهُ سَهْلاً",
        trans: "O Allah, there is no ease except that which You make easy.",
        bangla: "আল্লাহুম্মা লা সাহলা ইল্লা মা জা’আলতাহু সাহলা"
      }
    },
    {
      ayah: "وَعَسَىٰ أَن تَكْرَهُوا شَيْئًا وَهُوَ خَيْرٌ لَّكُمْ",
      ref: "Al-Baqarah 2:216",
      trans: "But perhaps you hate a thing and it is good for you.",
      tafsir: "We see pages, but He sees the entire book. Hope in His vast plan brings ultimate tranquility.",
      dua: {
        arabic: "رَضِيتُ بِاللَّهِ رَبَّا وَبِالْإِسْلَامِ دِينًا",
        trans: "I am pleased with Allah as my Lord and Islam as my religion.",
        bangla: "রাদীতু বিল্লাহi রব্বান ওয়াবিল ইসলামী দ্বীনান"
      }
    },
    {
      ayah: "فَدَعَا رَبَّهُ أَنِّي مَغْلُوبٌ فَانتَصِرْ",
      ref: "Al-Qamar 54:10",
      trans: "So he called upon his Lord, 'Indeed, I am defeated, so help me.'",
      tafsir: "Nuh (AS)'s brief, raw, highly sincere prayer. Supplication is the key that opens the doors of heavens for victorious rescue.",
      dua: {
        arabic: "حَسْبِيَ اللَّهُ وَنِعْمَ الْوَكِيلُ",
        trans: "Sufficient is Allah for me, the most beautiful Trustee.",
        bangla: "হাসবিআল্লাহু ওয়া নি’মাল ওয়াকীল"
      }
    },
    {
      ayah: "لَا تَدْرِي لَعَلَّ اللَّهَ يُحْدِثُ بَعْدَ ذَٰلِكَ أَمْرًا",
      ref: "At-Talaq 65:1",
      trans: "You know not; perhaps Allah will bring about after that a matter.",
      tafsir: "Your current blocked path is not the end. Your Lord prepares behind-the-scenes openings you cannot even fathom.",
      dua: {
        arabic: "اللَّهُمَّ اجْعَلْ لِي مِنْ لَدُنْكَ مَخْرَجًا",
        trans: "O Allah, grant me an exit way from Your presence.",
        bangla: "আল্লাহুম্মাজ’আল লী মিল্লাদুনকা মাখরাজา"
      }
    },
    {
      ayah: "يَنشُرْ لَكُمْ رَبُّكم مِّن رَّحْمَتِهِ وَيُهَيِّئْ لَكُم مِّنْ أَمْرِكُم مِّرْفَقًا",
      ref: "Al-Kahf 18:16",
      trans: "Your Lord will spread for you of His mercy and facilitate ease in your affair.",
      tafsir: "This was prayed by the youths escaping the oppressive city into the dark cave. Hope can decorate a dark damp cave with divine comfort.",
      dua: {
        arabic: "رَبَّنَا آتِنَا مِنْ لَدُنْكَ رَحْمَةً وَهَيِّئْ لَنَا مِنْ أَمْرِنَا رَشَدًا",
        trans: "Our Lord, grant us from Yourself mercy and prepare for us from our affair right guidance.",
        bangla: "রব্বানা আতিনা মিল্লাদুনকা রহমাতাও ওয়া হাইয়্যি’ লানা মিন আমরিনা রশদা"
      }
    },
    {
      ayah: "وَاصْبِرْ فَإِنَّ اللَّهَ لَا يُضِيعُ أَجْرَ الْمُحْسِنِينَ",
      ref: "Hud 11:115",
      trans: "And be patient, for indeed, Allah does not allow to be lost the reward of those who do good.",
      tafsir: "Every solitary sleepless night, every quiet composure is recorded. He sees your effort and will compensate you fully.",
      dua: {
        arabic: "اللَّهُمَّ اجْعَلْنِي مِنَ الْمُحْسِنِينَ",
        trans: "O Allah, make me from those who excel in beauty.",
        bangla: "আল্লাহুম্মাজ’আলনী মিনাল মুহসিনীন"
      }
    },
    {
      ayah: "عَسَى اللَّهُ أَن يَأْتِيَنِي بِهِمْ جَمِيعًا",
      ref: "Yusuf 12:83",
      trans: "Perhaps Allah will bring them to me all together.",
      tafsir: "Yaqub (AS) lost two eyes in tears and two beloved children for decades, yet his hope stood firm. All reunions are simple for Him.",
      dua: {
        arabic: "يَا جَامِعَ الشَّتَاتِ اجْمَعْ شَمْلَنَا",
        trans: "O Gatherer of scattered things, unite our affairs.",
        bangla: "ইয়া জামি’আশ শাতাত ইজমায় শামলানা"
      }
    },
    {
      ayah: "رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ",
      ref: "Al-Furqan 25:74",
      trans: "Our Lord, grant us from among our wives and offspring comfort to our eyes and make us an example for the righteous.",
      tafsir: "The ultimate hope for couples: to view their spouse and children as sources of sublime peace, cooling the eyes and leading the righteous.",
      dua: {
        arabic: "رَبَّنَا تَقَبَّلْ مِنَّا إِنَّكَ أَنْتَ السَّمِيعُ الْعَلِيمُ",
        trans: "Our Lord, accept from us, indeed You are the Hearing, the Knowing.",
        bangla: "রব্বানা তাকাব্বল মিন্না ইন্নাকা আনতাস সামীউল আলীম"
      }
    }
  ]
};

export default function EmotionGuide() {
  const { user } = useAuth();
  const { couple } = useCouple();
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [customEmotion, setCustomEmotion] = useState("");
  const [activeGuidance, setActiveGuidance] = useState<GuidanceItem | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  
  const [guidanceMode, setGuidanceMode] = useState<"curated" | "ai">("curated");
  const [favorites, setFavorites] = useState<any[]>([]);
  const [isSavingFav, setIsSavingFav] = useState(false);
  const [favSuccess, setFavSuccess] = useState(false);

  const fetchFavorites = async () => {
    if (!couple?.id) return;
    try {
      const querySnapshot = await getDocs(
        query(collection(db, "couples", couple.id, "favorites"), orderBy("timestamp", "desc"))
      );
      const items: any[] = [];
      querySnapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() });
      });
      setFavorites(items);
    } catch (err) {
      console.error("Error fetching favorites:", err);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, [couple?.id]);

  const handleSaveFavorite = async () => {
    if (!activeGuidance || !couple?.id || !user?.uid) return;
    setIsSavingFav(true);
    try {
      const isAlreadyFav = favorites.some(f => f.ref === activeGuidance.ref);
      if (isAlreadyFav) {
        setFavSuccess(true);
        setTimeout(() => setFavSuccess(false), 2000);
        return;
      }

      await addDoc(collection(db, "couples", couple.id, "favorites"), {
        ...activeGuidance,
        emotion: selectedEmotion || "Heart State",
        savedBy: user.uid,
        savedByName: user.displayName || user.email || "Spouse",
        timestamp: serverTimestamp()
      });
      setFavSuccess(true);
      fetchFavorites();
      setTimeout(() => setFavSuccess(false), 2000);
    } catch (err) {
      console.error("Error saving favorite:", err);
    } finally {
      setIsSavingFav(false);
    }
  };

  const handleDeleteFavorite = async (favId: string) => {
    if (!couple?.id) return;
    try {
      await deleteDoc(doc(db, "couples", couple.id, "favorites", favId));
      setFavorites(prev => prev.filter(f => f.id !== favId));
    } catch (err) {
      console.error("Error deleting favorite:", err);
    }
  };

  const handleEmotionSelect = async (id: string) => {
    setSelectedEmotion(id);
    setCustomEmotion(""); // Clear custom input when selecting a preset
    
    if (guidanceMode === "ai") {
      setIsSearching(true);
      setActiveGuidance(null);
      try {
        const res = await fetch("/api/emotion/guidance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emotion: id }),
        });
        const data = await res.json();
        if (data.ayah) {
          setActiveGuidance(data);
        } else {
          loadCurated(id);
        }
      } catch (error) {
        console.error("AI emotion selection failed, falling back:", error);
        loadCurated(id);
      } finally {
        setIsSearching(false);
      }
    } else {
      loadCurated(id);
    }
  };

  const loadCurated = (id: string) => {
    const options = guidanceData[id];
    if (options && options.length > 0) {
      const randomItem = options[Math.floor(Math.random() * options.length)];
      setActiveGuidance(randomItem);
    }
  };

  const handleCustomSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmotion.trim()) return;

    setIsSearching(true);
    setSelectedEmotion(customEmotion);
    setActiveGuidance(null);

    try {
      const res = await fetch("/api/emotion/guidance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emotion: customEmotion }),
      });
      const data = await res.json();
      if (data.ayah) {
        setActiveGuidance(data);
      }
    } catch (error) {
      console.error("Custom emotion search failed:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleShuffle = async () => {
    if (!selectedEmotion) return;
    
    if (guidanceMode === "ai" && !guidanceData[selectedEmotion]) {
      // It's a custom emotion search
      setIsSearching(true);
      setActiveGuidance(null);
      try {
        const res = await fetch("/api/emotion/guidance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emotion: selectedEmotion }),
        });
        const data = await res.json();
        if (data.ayah) {
          setActiveGuidance(data);
        }
      } catch (error) {
        console.error("AI shuffle failed:", error);
      } finally {
        setIsSearching(false);
      }
    } else if (guidanceMode === "ai" && guidanceData[selectedEmotion]) {
      // It's a preset but we want infinite AI variation
      setIsSearching(true);
      setActiveGuidance(null);
      try {
        const res = await fetch("/api/emotion/guidance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emotion: selectedEmotion }),
        });
        const data = await res.json();
        if (data.ayah) {
          setActiveGuidance(data);
        } else {
          loadCuratedShuffle();
        }
      } catch (error) {
        console.error("AI shuffle failed, falling back:", error);
        loadCuratedShuffle();
      } finally {
        setIsSearching(false);
      }
    } else {
      loadCuratedShuffle();
    }
  };

  const loadCuratedShuffle = () => {
    if (!selectedEmotion) return;
    const options = guidanceData[selectedEmotion];
    if (options && options.length > 1) {
      let nextItem;
      do {
        nextItem = options[Math.floor(Math.random() * options.length)];
      } while (nextItem.ayah === activeGuidance?.ayah);
      setActiveGuidance(nextItem);
    } else if (options && options.length === 1) {
      setActiveGuidance(options[0]);
    }
  };

  const handleShare = async () => {
    if (!selectedEmotion || !couple?.id || !user?.uid) return;
    
    setIsSharing(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      await addDoc(collection(db, "couples", couple.id, "moods"), {
        userId: user.uid,
        emotionId: selectedEmotion,
        date: today,
        timestamp: serverTimestamp()
      });
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 3000);
    } catch (error) {
      console.error("Error sharing mood:", error);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="container mx-auto px-6 pt-12 max-w-2xl pb-40">
      <header className="mb-12">
        <h1 className="text-4xl font-serif text-champagne mb-2">Heart's Compass</h1>
        <p className="text-[10px] uppercase tracking-[0.3em] text-gold font-bold">Divine guidance for your soul's state</p>
      </header>

      <GlassCard className="p-0 border-white/10 overflow-hidden mb-12 shadow-2xl">
        <form onSubmit={handleCustomSearch} className="flex items-center gap-4 p-4 md:p-6 bg-white/5 backdrop-blur-xl">
           <div className="p-4 bg-gold/10 text-gold rounded-2xl">
             <Search size={20} />
           </div>
           <input 
             type="text"
             placeholder="How is your heart today? (e.g., 'stressed about work', 'feeling empty')"
             value={customEmotion}
             onChange={(e) => setCustomEmotion(e.target.value)}
             className="flex-1 bg-transparent border-none outline-none text-ivory placeholder:text-slate-gray/50 font-serif text-lg"
           />
           <button 
             type="submit"
             disabled={isSearching}
             className="px-8 py-4 bg-gold text-midnight rounded-xl font-bold text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-gold/20 disabled:opacity-50"
           >
             {isSearching ? "Searching..." : "Listen"}
           </button>
        </form>
      </GlassCard>

      <div className="flex flex-col items-center justify-center mb-10 gap-2">
        <span className="text-[9px] uppercase tracking-widest text-slate-gray font-bold">Guidance Source Mode</span>
        <div className="bg-white/5 p-1 rounded-2xl border border-white/10 flex gap-2">
          <button
            onClick={() => setGuidanceMode("curated")}
            className={cn(
              "px-5 py-2.5 rounded-xl text-[10px] uppercase font-bold tracking-widest transition-all",
              guidanceMode === "curated"
                ? "bg-gold text-midnight shadow-lg shadow-gold/20"
                : "text-slate-gray hover:text-ivory"
            )}
          >
            Curated Anchors
          </button>
          <button
            onClick={() => setGuidanceMode("ai")}
            className={cn(
              "px-5 py-2.5 rounded-xl text-[10px] uppercase font-bold tracking-widest transition-all flex items-center gap-1.5",
              guidanceMode === "ai"
                ? "bg-gold text-midnight shadow-lg shadow-gold/20"
                : "text-slate-gray hover:text-ivory"
            )}
          >
            <Sparkles size={12} /> Infinite Quran AI
          </button>
        </div>
        <p className="text-[9px] text-center text-slate-gray/60 italic max-w-sm mt-1">
          {guidanceMode === "curated" 
            ? "Instantly explore classic hand-picked Quranic emotional anchors."
            : "Dynamically seek comforting, emotionally attached verses from the entire Quran using Ruh AI."}
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-12">
        {emotions.map((emotion) => (
          <motion.button
            key={emotion.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleEmotionSelect(emotion.id)}
            className={cn(
              "flex flex-col items-center gap-3 p-5 rounded-3xl transition-all duration-500 border",
              selectedEmotion === emotion.id 
                ? "bg-white/10 border-gold shadow-[0_0_20px_rgba(197,160,89,0.2)]" 
                : "bg-white/5 border-white/10 hover:bg-white/10"
            )}
          >
            <div className={cn("p-3 rounded-2xl", emotion.bg, emotion.color)}>
              <emotion.icon size={24} />
            </div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-gray">{emotion.label}</span>
          </motion.button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {isSearching ? (
          <motion.div
            key="searching-state"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="w-full"
          >
            <GlassCard className="text-center py-24 border-gold/10 relative overflow-hidden">
              <Sparkles className="text-gold mx-auto mb-6 animate-pulse" size={40} />
              <p className="text-champagne font-serif italic text-lg animate-pulse">Consulting the Sacred Book...</p>
              <p className="text-[10px] uppercase tracking-[0.3em] text-slate-gray mt-3 font-bold">Ruh is seeking comforting whispers from the entire Quran for your {selectedEmotion || "current"} heart state</p>
            </GlassCard>
          </motion.div>
        ) : selectedEmotion && activeGuidance ? (
          <motion.div
            key={`${selectedEmotion}-${activeGuidance.ref}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5 }}
          >
            <GlassCard className="relative p-0 overflow-hidden border-gold/20">
              <div className="bg-gradient-to-br from-gold/10 via-transparent to-transparent p-10">
                <div className="text-center mb-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="bg-gold/10 px-5 py-1.5 rounded-full text-[10px] uppercase tracking-[0.3em] text-gold font-bold">
                      Healing for the {selectedEmotion} heart
                    </div>
                    <button 
                      onClick={handleShuffle}
                      className="text-gold hover:text-champagne transition-colors"
                      title="Seek another whisper"
                    >
                      <Sparkles size={18} />
                    </button>
                  </div>
                  <h2 className="arabic-text text-5xl mb-6 text-champagne leading-relaxed">
                    {activeGuidance.ayah}
                  </h2>
                  <p className="text-xl font-serif italic text-ivory leading-relaxed mb-4">
                    "{activeGuidance.trans}"
                  </p>
                  <p className="text-[10px] uppercase tracking-[0.4em] text-gold font-bold opacity-40">
                    {activeGuidance.ref}
                  </p>
                </div>

                <div className="space-y-8">
                  <div className="relative">
                    <div className="absolute -left-4 top-0 w-1 h-full bg-gold/30 rounded-full"></div>
                    <h4 className="text-[10px] uppercase tracking-[0.2em] text-gold font-bold mb-3 flex items-center gap-2">
                       Reflection
                    </h4>
                    <p className="text-ivory leading-relaxed opacity-80 pl-2">
                      {activeGuidance.tafsir}
                    </p>
                  </div>

                  <div className="bg-white/5 p-8 rounded-[32px] border border-white/10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gold/5 rounded-full blur-3xl -mr-12 -mt-12 group-hover:bg-gold/10 transition-colors" />
                    <h4 className="text-[10px] uppercase tracking-[0.2em] text-gold font-bold mb-4 flex items-center gap-2">
                      Healing Dua
                    </h4>
                    <p className="arabic-text text-3xl mb-4 text-champagne text-right leading-loose">
                      {activeGuidance.dua.arabic}
                    </p>
                    <div className="space-y-2">
                       <p className="text-base text-gold font-bold leading-relaxed font-bangla">
                        {activeGuidance.dua.bangla}
                      </p>
                      <p className="text-sm italic text-ivory/60 leading-relaxed">
                        "{activeGuidance.dua.trans}"
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-10 pt-10 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-6">
                  <button 
                    onClick={handleSaveFavorite}
                    disabled={isSavingFav}
                    className={cn(
                      "text-[10px] uppercase tracking-widest font-bold transition-all flex items-center gap-2 group",
                      favSuccess 
                        ? "text-green-400" 
                        : "text-slate-gray hover:text-gold"
                    )}
                  >
                    <Heart size={16} className={cn("group-hover:scale-110 transition-transform", favSuccess ? "fill-green-400 text-green-400" : "")} />
                    {isSavingFav ? "Saving..." : favSuccess ? "Saved to Anchors!" : "Save to Favorites"}
                  </button>
                  <button 
                    onClick={handleShare}
                    disabled={isSharing || shareSuccess}
                    className={cn(
                      "w-full py-4 rounded-2xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95",
                      shareSuccess 
                        ? "bg-green-500/20 text-green-400 border border-green-500/30 shadow-green-500/10" 
                        : "bg-gold text-midnight hover:scale-[1.02] shadow-gold/20"
                    )}
                  >
                    {isSharing ? "Sending..." : shareSuccess ? <>Shared with Spouse <CheckCircle2 size={16} /></> : <>Share frequency with Spouse <Share2 size={16} /></>}
                  </button>
                </div>
              </div>
            </GlassCard>
            <div className="mt-6 flex justify-center">
               <button 
                 onClick={handleShuffle}
                 className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-gold font-bold hover:text-champagne transition-all"
               >
                 Another Whisper <Sparkles size={14} />
               </button>
            </div>
          </motion.div>
        ) : selectedEmotion ? (
          <GlassCard className="text-center py-20 border-white/10" delay={0}>
            <Sparkles className="text-gold mx-auto mb-6 opacity-20" size={48} />
            <p className="text-champagne font-serif italic text-lg capitalize">Infinite patience...</p>
            <p className="text-[10px] uppercase tracking-[0.3em] text-slate-gray mt-2 font-bold">Divine guidance is being curated for this state</p>
          </GlassCard>
        ) : null}
      </AnimatePresence>

      {favorites.length > 0 && (
        <div className="mt-20 border-t border-white/5 pt-12">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-pink-500/10 text-pink-400 rounded-xl">
              <Heart size={20} className="fill-pink-500/10" />
            </div>
            <div>
              <h2 className="text-xl font-serif text-champagne">Shared Comfort Verses</h2>
              <p className="text-[9px] uppercase tracking-widest text-slate-gray mt-0.5">Spiritual anchors saved by you and your spouse</p>
            </div>
          </div>

          <div className="space-y-6">
            {favorites.map((fav) => (
              <GlassCard key={fav.id} className="p-6 border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleDeleteFavorite(fav.id)}
                    className="text-slate-gray hover:text-red-400 transition-colors"
                    title="Remove Anchor"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="flex gap-2 items-center mb-3 text-[9px] uppercase tracking-widest">
                  <span className="bg-gold/10 text-gold px-2.5 py-0.5 rounded-full font-bold">
                    For {fav.emotion}
                  </span>
                  <span className="text-slate-gray/60">•</span>
                  <span className="text-slate-gray">
                    Saved by {fav.savedBy === user?.uid ? "You" : fav.savedByName}
                  </span>
                </div>

                <p className="arabic-text text-2xl text-right text-champagne leading-relaxed mb-3">
                  {fav.ayah}
                </p>
                <p className="text-sm font-serif italic text-ivory/90 leading-relaxed mb-1">
                  "{fav.trans}"
                </p>
                <p className="text-[9px] font-mono tracking-widest text-gold opacity-50 mb-3 block">
                  {fav.ref}
                </p>

                {fav.tafsir && (
                  <p className="text-xs text-slate-gray/80 leading-relaxed border-l border-gold/20 pl-3 italic">
                    {fav.tafsir}
                  </p>
                )}

                {fav.dua && fav.dua.arabic && (
                  <div className="mt-4 pt-4 border-t border-white/5 flex flex-col gap-1 bg-white/5 -mx-6 -mb-6 p-4">
                    <span className="text-[8px] uppercase tracking-widest text-gold/60 font-bold block mb-1">
                      Associated Healing Dua
                    </span>
                    <p className="arabic-text text-xl text-right text-champagne/80 mb-1">
                      {fav.dua.arabic}
                    </p>
                    <p className="text-xs text-gold font-bold leading-normal font-bangla">
                      {fav.dua.bangla}
                    </p>
                    <p className="text-[11px] italic text-ivory/50">
                      "{fav.dua.trans}"
                    </p>
                  </div>
                )}
              </GlassCard>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
