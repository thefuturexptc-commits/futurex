export const bandFaqs = [
  {
    q: 'What does the TFX Smart Band track?',
    a: 'The TFX Smart Band supports activity tracking, heart rate monitoring, sleep tracking, calorie tracking and app-connected wellness monitoring features.',
  },
  {
    q: 'Does the TFX Smart Band support SpO2 monitoring?',
    a: 'Selected TFX Smart Band models support blood oxygen (SpO2) monitoring functionality.',
  },
  {
    q: 'Can the smart band connect to a smartphone?',
    a: 'Yes, TFX Smart Bands connect to compatible smartphones using Bluetooth and companion app integration.',
  },
  {
    q: 'Is the TFX Smart Band suitable for daily wear?',
    a: 'The lightweight design is intended for comfortable everyday use during work, exercise and daily activities.',
  },
  {
    q: 'Which TFX Smart Band is best for fitness tracking?',
 a: 'Choose a model based on the metrics you need. TFX5 AI Smart Band is suited for users who want heart rate, SpO2, blood pressure wellness trends, VO2, vital age, sleep, stress, recovery, GPS activity and app-connected AI insights.',
  },
  {
    q: 'Can I use a TFX Smart Band for sleep tracking?',
    a: 'Yes. TFX Smart Bands are designed for lightweight overnight wear and app-based sleep trend review.',
  },
];

export const ringFaqs = [
  {
    q: 'What is a smart ring?',
 a: 'A smart ring is a wearable device designed to track fitness, activity and wellness metrics while maintaining the form factor of a traditional ring.',
  },
  {
    q: 'What can a TFX Smart Ring track?',
 a: 'TFX Smart Rings support features such as activity tracking, sleep monitoring, heart rate tracking, wellness insights and connected app-based monitoring depending on the model.',
  },
  {
    q: 'Does a TFX Smart Ring connect to an app?',
    a: 'Yes, TFX Smart Rings connect with compatible smartphones through app-based sync for wellness, activity, and sleep insights.',
  },
  {
    q: 'Is a smart ring suitable for daily wear?',
    a: 'TFX Smart Rings are designed with a compact wearable form factor for everyday wellness monitoring, sleep tracking, and activity tracking.',
  },
  {
    q: 'What is the difference between a smart ring and a smart band?',
    a: 'A smart ring offers a compact ring form factor for discreet daily tracking, while a smart band is worn on the wrist and may suit users who prefer wrist-based fitness tracking.',
  },
  {
    q: 'Which TFX Smart Ring should I choose?',
    a: 'Choose TFX Display Pro if you want quick on-device information, TFX Touch if you prefer touch-enabled control, and TFX Smart Ring for compact app-connected wellness tracking.',
  },
];

export const fanFaqs = [
  {
    question: 'What is a bladeless fan?',
    answer: 'A bladeless fan uses airflow amplification technology to circulate air without exposed rotating blades.',
  },
  {
    question: 'How does a bladeless fan work?',
    answer: 'A bladeless fan draws air into its base and pushes smooth airflow through a ring or tower outlet to circulate air around a room.',
  },
  {
    question: 'Are bladeless fans energy efficient?',
    answer: 'Many bladeless fans are designed for efficient airflow and adjustable speed settings, helping users manage comfort and power use.',
  },
  {
    question: 'What is the difference between a bladeless fan and a traditional fan?',
    answer: 'A bladeless fan has no exposed rotating blades and usually offers a modern tower design, smoother airflow, and easier cleaning than many traditional fans.',
  },
  {
    question: 'Can a bladeless fan be used year-round?',
    answer: 'Selected hot and cool bladeless fans can support both cooling airflow and heating functionality for year-round indoor comfort.',
  },
  {
    question: 'What is a hot and cool fan?',
    answer: 'A hot and cool fan is designed to provide cooling airflow in warmer conditions and heated airflow when extra warmth is needed.',
  },
  {
    question: 'What are the benefits of a HEPA bladeless fan?',
    answer: 'A HEPA bladeless fan combines air circulation with filtration support, helping manage indoor airflow while supporting cleaner air movement.',
  },
  {
    question: 'Are bladeless fans suitable for bedrooms?',
    answer: 'Many users prefer bladeless fans in bedrooms due to their modern design and smooth airflow delivery.',
  },
  {
    question: 'Do bladeless fans require less maintenance?',
    answer: 'Bladeless fans can be easier to clean because they do not have exposed blades, though filters and vents should still be maintained as recommended.',
  },
  {
    question: 'Which TFX bladeless fan is best for home use?',
    answer: 'The best TFX bladeless fan depends on the room and use case. Cooling models suit everyday airflow, hot and cool models support year-round comfort, and HEPA models add filtration support.',
  },
];

export const monitoringFaqs = [
  {
    question: 'What is a smart monitoring device?',
 answer: 'Smart monitoring devices are connected technologies designed to help users track fitness, sleep, activity and performance metrics through sensors and companion applications.',
  },
  {
    question: 'What does the Future X Bluetooth Heart Rate Monitor track?',
    answer: 'The Future X Bluetooth Heart Rate Monitor Chest Belt tracks heart rate data during workouts, fitness training, running, cycling, and sports activities through compatible devices and apps.',
  },
  {
    question: 'What does a smart sleep tracking system monitor?',
    answer: 'A smart sleep tracking system helps monitor sleep patterns, rest trends, recovery signals, and connected wellness insights through supported sensors and applications.',
  },
  {
    question: 'Can smart monitoring devices connect to a phone?',
 answer: 'Yes, compatible smart monitoring devices connect to smartphones or supported apps to display fitness and wellness data.',
  },
  {
    question: 'Who should use a Bluetooth heart rate chest belt?',
    answer: 'A Bluetooth heart rate chest belt is useful for runners, cyclists, gym users, cardio training, and sports activities where real-time heart rate tracking is important.',
  },
  {
    question: 'How can sleep tracking help daily wellness?',
    answer: 'Sleep tracking can help users understand sleep duration, routine consistency, rest patterns, and recovery trends over time.',
  },
];

const faqLists = {
  'smart-bands': bandFaqs,
  'smart-rings': ringFaqs,
  'bladeless-fan': fanFaqs,
  'smart-monitoring': monitoringFaqs,
};

export const getCategoryFaqs = (route) => (Object.hasOwn(faqLists, route) ? faqLists[route] : [])
  .map(row => ({ q: row.q ?? row.question, a: row.a ?? row.answer }));
