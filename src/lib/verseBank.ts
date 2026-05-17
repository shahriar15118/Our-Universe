
export interface Verse {
  arabic: string;
  english: string;
  bangla: string;
  ref: string;
}

export const VerseBank: Record<string, Verse[]> = {
  Radiant: [
    {
      arabic: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا",
      english: "For indeed, with hardship [will be] ease.",
      bangla: "নিশ্চয় কষ্টের সাথেই স্বস্তি রয়েছে।",
      ref: "Ash-Sharh 94:6"
    },
    {
       arabic: "لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ",
       english: "If you are grateful, I will surely increase you [in favor].",
       bangla: "যদি তোমরা শোকর আদায় কর, তবে আমি অবশ্যই তোমাদের বাড়িয়ে দেব।",
       ref: "Ibrahim 14:7"
    }
  ],
  Loved: [
    {
      arabic: "وَجَعَلَ بَيْنَكُم مَّوَدَّةً وَرَحْمَةً",
      english: "And He placed between you affection and mercy.",
      bangla: "আর তিনি তোমাদের মধ্যে সৃষ্টি করেছেন প্রেম ও দয়া।",
      ref: "Ar-Rum 30:21"
    },
    {
      arabic: "فَإِنِّي قَرِيبٌ ۖ أُجِيبُ دَعْوَةَ الدَّاعِ",
      english: "Indeed I am near. I respond to the invocation of the supplicant.",
      bangla: "নিশ্চয়ই আমি নিকটবর্তী। আমি প্রার্থনাকারীর ডাকে সাড়া দেই।",
      ref: "Al-Baqarah 2:186"
    }
  ],
  Peaceful: [
    {
      arabic: "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ",
      english: "Unquestionably, by the remembrance of Allah hearts are assured.",
      bangla: "জেনে রেখো, আল্লাহর জিকিরেই কলব বা অন্তর প্রশান্তি পায়।",
      ref: "Ar-Ra'd 13:28"
    },
    {
      arabic: "هُوَ الَّذِي أَنزَلَ السَّكِينَةَ فِي قُلُوبِ الْمُؤْمِنِينَ",
      english: "It is He who sent down tranquility into the hearts of the believers.",
      bangla: "তিনিই মুমিনদের অন্তরে প্রশান্তি নাজিল করেছেন।",
      ref: "Al-Fath 48:4"
    }
  ],
  Quiet: [
    {
      arabic: "إِنَّ اللَّهَ مَعَ الصَّابِرِينَ",
      english: "Indeed, Allah is with the patient.",
      bangla: "নিশ্চয়ই আল্লাহ ধৈর্যশীলদের সাথে আছেন।",
      ref: "Al-Baqarah 2:153"
    },
    {
      arabic: "لَا تَدْرِي لَعَلَّ اللَّهَ يُحْدِثُ بَعْدَ ذَٰلِكَ أَمْرًا",
      english: "You know not; perhaps Allah will bring about after that a [different] matter.",
      bangla: "তুমি জানো না, সম্ভবত আল্লাহ এর পরে কোনো (নতুন) পথ বের করে দেবেন।",
      ref: "At-Talaq 65:1"
    }
  ],
  Restless: [
    {
      arabic: "لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ",
      english: "Do not despair of the mercy of Allah.",
      bangla: "তোমরা আল্লাহর রহমত থেকে নিরাশ হয়ো না।",
      ref: "Az-Zumar 39:53"
    },
    {
      arabic: "وَاصْبِرْ لِحُكْمِ رَبِّكَ فَإِنَّكَ بِأَعْيُنِنَا",
      english: "And be patient for the decision of your Lord, for indeed, you are in Our eyes.",
      bangla: "আপনি আপনার রবের হুকুমের জন্য ধৈর্য ধরুন, কেননা আপনি আমার চোখের সামনেই রয়েছেন।",
      ref: "At-Tur 52:48"
    }
  ],
  Energetic: [
    {
      arabic: "وَتَوَكَّلْ عَلَى اللَّهِ ۚ وَكَفَىٰ بِاللَّهِ وَكِيلًا",
      english: "And rely upon Allah; and sufficient is Allah as Disposer of affairs.",
      bangla: "এবং আপনি আল্লাহর ওপর ভরসা করুন। কর্মবিধায়ক হিসেবে আল্লাহই যথেষ্ট।",
      ref: "Al-Ahzab 33:3"
    },
    {
      arabic: "وَفِي ذَٰلِكَ فَلْيَتَنَافَسِ الْمُتَنَافِسُونَ",
      english: "So for this let the competitors compete.",
      bangla: "কাজেই প্রতিযোগীরা যেন এর জন্যই প্রতিযোগিতা করে।",
      ref: "Al-Mutaffifin 83:26"
    }
  ]
};
