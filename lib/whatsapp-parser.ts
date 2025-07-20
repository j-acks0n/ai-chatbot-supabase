interface WhatsAppMessage {
  timestamp: Date;
  sender: string;
  content: string;
  isSystemMessage: boolean;
}

interface ParsedChat {
  messages: WhatsAppMessage[];
  participants: string[];
  messageCount: { [participant: string]: number };
}

export class WhatsAppParser {
  private static readonly MESSAGE_PATTERN =
    /^\[(\d{2}\/\d{2}\/\d{4}), (\d{2}:\d{2}:\d{2})\] ([^:]+): (.*)$/;
  private static readonly SYSTEM_MESSAGES = [
    'Messages and calls are end-to-end encrypted',
    'image omitted',
    'document omitted',
    'video omitted',
    'audio omitted',
    'GIF omitted',
    'sticker omitted',
    'You deleted this message',
    'This message was deleted',
  ];

  static parseExport(exportText: string): ParsedChat {
    const lines = exportText.split('\n').filter((line) => line.trim());
    const messages: WhatsAppMessage[] = [];
    const participantSet = new Set<string>();
    const messageCount: { [participant: string]: number } = {};

    let currentMessage: WhatsAppMessage | null = null;

    for (const line of lines) {
      const match = line.match(this.MESSAGE_PATTERN);

      if (match) {
        // Save previous message if exists
        if (currentMessage) {
          messages.push(currentMessage);
          messageCount[currentMessage.sender] =
            (messageCount[currentMessage.sender] || 0) + 1;
        }

        const [, datePart, timePart, sender, content] = match;
        const timestamp = this.parseTimestamp(datePart, timePart);
        const isSystemMessage = this.isSystemMessage(content);

        if (!isSystemMessage) {
          participantSet.add(sender.trim());
        }

        currentMessage = {
          timestamp,
          sender: sender.trim(),
          content: content.trim(),
          isSystemMessage,
        };
      } else if (currentMessage && line.trim()) {
        // This is a continuation of the previous message (multiline message)
        currentMessage.content += '\n' + line.trim();
      }
    }

    // Add the last message
    if (currentMessage) {
      messages.push(currentMessage);
      messageCount[currentMessage.sender] =
        (messageCount[currentMessage.sender] || 0) + 1;
    }

    return {
      messages: messages.filter((msg) => !msg.isSystemMessage),
      participants: Array.from(participantSet),
      messageCount,
    };
  }

  private static parseTimestamp(datePart: string, timePart: string): Date {
    const [day, month, year] = datePart.split('/').map(Number);
    const [hours, minutes, seconds] = timePart.split(':').map(Number);
    return new Date(year, month - 1, day, hours, minutes, seconds);
  }

  private static isSystemMessage(content: string): boolean {
    return this.SYSTEM_MESSAGES.some((pattern) =>
      content.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  static getMessagesByPerson(
    parsedChat: ParsedChat,
    personName: string
  ): WhatsAppMessage[] {
    return parsedChat.messages.filter(
      (msg) => msg.sender.toLowerCase() === personName.toLowerCase()
    );
  }

  static getPersonCommunicationStyle(messages: WhatsAppMessage[]): {
    averageMessageLength: number;
    commonWords: string[];
    emoticonsUsed: string[];
    communicationPatterns: string[];
    punctuationStyle: string[];
    capitalizationStyle: string;
    greetingPatterns: string[];
    farewellPatterns: string[];
    questionStyle: string[];
    responseStyle: string[];
    typicalPhrases: string[];
    messageTiming: string[];
  } {
    const allText = messages.map((m) => m.content).join(' ');
    const words = allText
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 2);

    // Count word frequency
    const wordCount: { [word: string]: number } = {};
    words.forEach((word) => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });

    // Get common words (excluding very common ones)
    const commonWords = Object.entries(wordCount)
      .filter(
        ([word]) =>
          ![
            'the',
            'and',
            'you',
            'for',
            'are',
            'but',
            'not',
            'can',
            'have',
            'that',
            'with',
          ].includes(word)
      )
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
      .map(([word]) => word);

    // Extract emoticons and emojis
    const emoticonPattern =
      /[\u{1f600}-\u{1f64f}]|[\u{1f300}-\u{1f5ff}]|[\u{1f680}-\u{1f6ff}]|[\u{1f1e0}-\u{1f1ff}]|[\u{2600}-\u{26ff}]|[\u{2700}-\u{27bf}]/gu;
    const emoticonsUsed = [...new Set(allText.match(emoticonPattern) || [])];

    // Analyze communication patterns
    const patterns: string[] = [];
    const avgLength =
      messages.reduce((sum, msg) => sum + msg.content.length, 0) /
      messages.length;

    if (avgLength > 100) patterns.push('writes long messages');
    if (avgLength < 30) patterns.push('prefers short messages');
    if (emoticonsUsed.length > 10) patterns.push('uses many emojis');
    if (
      messages.some(
        (m) => m.content.includes('ahah') || m.content.includes('haha')
      )
    ) {
      patterns.push('often uses laughter expressions');
    }

    // Analyze punctuation style
    const punctuationStyle: string[] = [];
    const exclamationCount = (allText.match(/!/g) || []).length;
    const questionCount = (allText.match(/\?/g) || []).length;
    const periodCount = (allText.match(/\./g) || []).length;
    const ellipsisCount = (allText.match(/\.{2,}/g) || []).length;
    const commaCount = (allText.match(/,/g) || []).length;

    if (exclamationCount > messages.length * 0.3)
      punctuationStyle.push('uses many exclamation marks');
    if (questionCount > messages.length * 0.2)
      punctuationStyle.push('asks many questions');
    if (ellipsisCount > messages.length * 0.1)
      punctuationStyle.push('uses ellipsis frequently');
    if (periodCount < messages.length * 0.1)
      punctuationStyle.push('rarely uses periods');
    if (commaCount > messages.length * 0.5)
      punctuationStyle.push('uses commas frequently');

    // Analyze capitalization
    let capitalizationStyle = 'mixed case';
    const upperCaseCount = (allText.match(/[A-Z]/g) || []).length;
    const totalLetters = (allText.match(/[a-zA-Z]/g) || []).length;

    if (upperCaseCount / totalLetters > 0.3) {
      capitalizationStyle = 'frequent capitals';
    } else if (upperCaseCount / totalLetters < 0.05) {
      capitalizationStyle = 'mostly lowercase';
    }

    // Analyze greeting patterns
    const greetingPatterns: string[] = [];
    const greetings = [
      'hi',
      'hello',
      'hey',
      'good morning',
      'good evening',
      'sup',
      'wassup',
      'yo',
    ];
    greetings.forEach((greeting) => {
      if (allText.toLowerCase().includes(greeting)) {
        greetingPatterns.push(greeting);
      }
    });

    // Analyze farewell patterns
    const farewellPatterns: string[] = [];
    const farewells = [
      'bye',
      'goodbye',
      'see you',
      'talk later',
      'ttyl',
      'good night',
      'goodnight',
      'take care',
    ];
    farewells.forEach((farewell) => {
      if (allText.toLowerCase().includes(farewell)) {
        farewellPatterns.push(farewell);
      }
    });

    // Analyze question style
    const questionStyle: string[] = [];
    const questions = messages.filter((m) => m.content.includes('?'));
    if (questions.length > 0) {
      const questionWords = [
        'what',
        'how',
        'when',
        'where',
        'why',
        'who',
        'which',
      ];
      questionWords.forEach((word) => {
        if (questions.some((q) => q.content.toLowerCase().includes(word))) {
          questionStyle.push(`asks "${word}" questions`);
        }
      });
    }

    // Analyze response style
    const responseStyle: string[] = [];
    const shortResponses = messages.filter((m) => m.content.length < 10);
    const longResponses = messages.filter((m) => m.content.length > 100);

    if (shortResponses.length > messages.length * 0.3) {
      responseStyle.push('gives short responses');
    }
    if (longResponses.length > messages.length * 0.2) {
      responseStyle.push('gives detailed responses');
    }

    // Find typical phrases (3+ words that appear multiple times)
    const typicalPhrases: string[] = [];
    const phrases = allText.match(/\b\w+\s+\w+\s+\w+\b/g) || [];
    const phraseCount: { [phrase: string]: number } = {};
    phrases.forEach((phrase) => {
      const cleanPhrase = phrase.toLowerCase();
      phraseCount[cleanPhrase] = (phraseCount[cleanPhrase] || 0) + 1;
    });

    Object.entries(phraseCount)
      .filter(([, count]) => count >= 2)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .forEach(([phrase]) => typicalPhrases.push(phrase));

    // Analyze message timing patterns
    const messageTiming: string[] = [];
    if (messages.length > 5) {
      const timeGaps = [];
      for (let i = 1; i < messages.length; i++) {
        const gap =
          messages[i].timestamp.getTime() - messages[i - 1].timestamp.getTime();
        timeGaps.push(gap / (1000 * 60)); // convert to minutes
      }

      const avgGap =
        timeGaps.reduce((sum, gap) => sum + gap, 0) / timeGaps.length;

      if (avgGap < 2) messageTiming.push('responds very quickly');
      else if (avgGap < 30) messageTiming.push('responds within minutes');
      else if (avgGap < 480) messageTiming.push('responds within hours');
      else messageTiming.push('responds after long delays');

      // Check for message bursts
      const quickResponses = timeGaps.filter((gap) => gap < 1).length;
      if (quickResponses > timeGaps.length * 0.3) {
        messageTiming.push('sends messages in bursts');
      }
    }

    return {
      averageMessageLength: Math.round(avgLength),
      commonWords,
      emoticonsUsed,
      communicationPatterns: patterns,
      punctuationStyle,
      capitalizationStyle,
      greetingPatterns,
      farewellPatterns,
      questionStyle,
      responseStyle,
      typicalPhrases,
      messageTiming,
    };
  }
}
