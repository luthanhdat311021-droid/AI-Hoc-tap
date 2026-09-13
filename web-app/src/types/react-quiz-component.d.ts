declare module 'react-quiz-component' {
  import React from 'react';

  export interface AppLocale {
    landingHeaderText?: string;
    question?: string;
    startQuizBtn?: string;
    resultFilterAll?: string;
    resultFilterCorrect?: string;
    resultFilterIncorrect?: string;
    resultFilterUnanswered?: string;
    nextQuestionBtn?: string;
    prevQuestionBtn?: string;
    resultPageHeaderText?: string;
    resultPagePoint?: string;
    pauseScreenDisplay?: string;
    timerTimeRemaining?: string;
    timerTimeTaken?: string;
    pauseScreenPause?: string;
    pauseScreenResume?: string;
    singleSelectionTagText?: string;
    multipleSelectionTagText?: string;
    pickNumberOfSelection?: string;
    marksOfQuestion?: string;
  }

  export interface Question {
    question: string;
    questionType: 'text' | 'photo';
    questionPic?: string;
    answerSelectionType: 'single' | 'multiple';
    answers: string[];
    correctAnswer: string | number[];
    messageForCorrectAnswer?: string;
    messageForIncorrectAnswer?: string;
    explanation?: string;
    point?: string | number;
    segment?: string;
    questionIndex?: number;
  }

  export interface QuizData {
    quizTitle: string;
    quizSynopsis?: string;
    nrOfQuestions?: number;
    questions: Question[];
    appLocale?: AppLocale;
    progressBarColor?: string;
  }

  export interface QuestionSummary {
    numberOfQuestions: number;
    numberOfCorrectAnswers: number;
    numberOfIncorrectAnswers: number;
    questions: Question[];
    userInput: (number | number[] | undefined)[];
    totalPoints: number;
    correctPoints: number;
    timeTaken: number;
  }

  export interface QuizProps {
    quiz: QuizData;
    shuffle?: boolean;
    shuffleAnswer?: boolean;
    showDefaultResult?: boolean;
    onComplete?: (summary: QuestionSummary) => void;
    customResultPage?: (summary: QuestionSummary) => React.ReactElement;
    showInstantFeedback?: boolean;
    continueTillCorrect?: boolean;
    revealAnswerOnSubmit?: boolean;
    allowNavigation?: boolean;
    onQuestionSubmit?: (data: {
      question: Question;
      userAnswer: number | number[] | undefined;
      isCorrect: boolean;
    }) => void;
    disableSynopsis?: boolean;
    timer?: number;
    allowPauseTimer?: boolean;
    enableProgressBar?: boolean;
    progressBarColor?: string;
  }

  const Quiz: React.FC<QuizProps>;
  export default Quiz;
}
